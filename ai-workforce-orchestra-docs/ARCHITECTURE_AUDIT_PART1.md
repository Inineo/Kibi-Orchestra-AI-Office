# AI WORKFORCE ORCHESTRA - FULL ARCHITECTURE AUDIT
## PART 1: 9ROUTER SYSTEM AUDIT

**Date**: 2026-10-05  
**Status**: TECHNICAL DISCOVERY PHASE  
**NO IMPLEMENTATION YET**

---

## EXECUTIVE SUMMARY

This document provides a complete technical audit of 9Router based on **actual source code analysis**, identifying what exists, what's missing, and what needs to be built for the AI Workforce Orchestra system.

**Key Finding**: 9Router is a **production-grade AI gateway/router** with sophisticated request handling, but has **zero orchestration capabilities**. The Orchestra layer must be built entirely from scratch on top of 9Router.

---

## PART 1: REQUEST FLOW AUDIT

### A. Complete Request Flow (FACT)

Based on actual source code analysis:

```
CLIENT REQUEST
    ↓
[1] Next.js Route Handler
    File: src/app/api/v1/chat/completions/route.js
    Function: POST()
    Input: Request object with { model, messages, stream?, tools? }
    Output: Calls handleChat(request)
    
    ↓
[2] Chat Handler  
    File: src/sse/handlers/chat.js
    Function: handleChat(request)
    Responsibilities:
      - Parse JSON body
      - Extract API key from Authorization header
      - Validate API key (if requireApiKey enabled)
      - Strip context markers (e.g., [1m] for extended context)
      - Detect required capabilities (vision, pdf, etc.)
      - Check if model is a combo
    Input: Request object
    Output: Response object or calls combo handlers
    
    ↓
[3] Model Resolution
    File: src/sse/services/model.js
    Function: getModelInfo(modelStr) or getComboModels(modelStr)
    Responsibilities:
      - Parse model string (format: "provider/model" or alias or combo)
      - Resolve aliases from localDb
      - Check if it's a combo name
      - Return { provider, model } or null if combo
    Input: modelStr (e.g., "anthropic/claude-3-5-sonnet" or "office-team")
    Output: { provider, model } or combo models array
    
    ↓
[4a] SINGLE MODEL PATH → handleSingleModelChat()
    File: src/sse/handlers/chat.js:167
    
    ↓
[5a] Credential Selection
    File: src/sse/services/auth.js
    Function: getProviderCredentials(provider, excludeSet, model)
    Responsibilities:
      - Get all active connections for provider from localDb
      - Filter out: excluded IDs, model-locked accounts, quota-exhausted
      - Select account based on strategy (fill-first, round-robin, least-used)
      - Handle rate limits and retry-after timing
    Input: provider, excludeConnectionIds Set, model
    Output: credentials object or { allRateLimited: true, retryAfter }
    
    ↓
[6a] Core Chat Handler
    File: open-sse/handlers/chatCore.js
    Function: handleChatCore({ body, modelInfo, credentials, ... })
    Responsibilities:
      - Detect source format (OpenAI, Claude, Gemini, Responses API)
      - Determine target format from provider/model
      - Apply token savers (RTK, Headroom, Caveman, Ponytail, Pxpipe)
      - Translate request format
      - Strip unsupported modalities
      - Build context
    Input: body, modelInfo, credentials, settings
    Output: Calls executor.execute()
    
    ↓
[7a] Executor Selection & Execution
    File: open-sse/executors/index.js
    Function: getExecutor(provider)
    Returns: Provider-specific executor or DefaultExecutor
    
    File: open-sse/executors/default.js (or specialized)
    Function: execute({ model, body, stream, credentials, signal })
    Responsibilities:
      - Build URL for provider API
      - Build headers (auth, content-type, provider-specific)
      - Transform request body
      - **ACTUAL API CALL**: proxyAwareFetch(url, { method, headers, body })
      - Handle token refresh on 401/403
    Input: model, body, stream, credentials
    Output: { response, url, headers, transformedBody }
    
    ↓
[8a] Response Handling
    Streaming: Parse SSE stream, translate chunks, forward to client
    Non-streaming: Parse JSON, translate response, return to client
    
    ↓
CLIENT RECEIVES RESPONSE

---

[4b] COMBO PATH → handleComboChat() or handleFusionChat()
    File: open-sse/services/combo.js
    
    Strategy: FALLBACK
      - Try models sequentially until success
      - Excludes failed connection IDs for retry
      
    Strategy: ROUND-ROBIN  
      - Rotate between models using in-memory state
      - comboRotationState Map tracks index + consecutiveUseCount
      - Sticky limit: use same model N times before rotating
      
    Strategy: FUSION (DETAILED BELOW)
```

---

### B. FUSION STRATEGY - COMPLETE LIFECYCLE (FACT)

**File**: `open-sse/services/combo.js:547-626`

```javascript
// VERIFIED FROM SOURCE CODE

handleFusionChat({ body, models, handleSingleModel, judgeModel, tuning })

STEP 1: Validation
  - Check models array not empty
  - If only 1 model → direct call (no fusion needed)
  
STEP 2: Configuration
  - Default tuning: { minPanel: 2, stragglerGraceMs: 8000, panelHardTimeoutMs: 90000 }
  - Judge model: judgeModel || models[0]
  
STEP 3: Panel Preparation
  - Strip tools and tool_choice from body (panel gives prose only)
  - Force stream: false (panel models non-streaming)
  - Flatten tool history into plain text (tool_calls → "[Called tools: X]")
  
STEP 4: Parallel Execution
  - Map all panel models to withTimeout(handleSingleModel(panelBody, model, true), timeout)
  - collectPanel() waits with quorum-grace:
      * Wait for minPanel models to complete
      * Start grace timer (8 seconds default)
      * If all complete before grace → proceed immediately
      * Hard timeout: 90 seconds absolute maximum
  
STEP 5: Result Collection
  - For each panel response:
      * Extract text from JSON (OpenAI/Claude/Gemini/Responses formats)
      * Skip if: timeout, error, !ok, empty content
      * answers.push({ model, text })
  
STEP 6: Degradation Logic
  - 0 answers → 503 error "All fusion panel models failed"
  - 1 answer → direct return (no fusion) with that model
  - 2+ answers → proceed to judge
  
STEP 7: Judge Synthesis
  - Build judge prompt:
      * "You are the JUDGE in a model-fusion panel"
      * "[Source 1]\n<answer1>\n[Source 2]\n<answer2>"
      * "Analyze consensus, contradictions, unique insights, blind spots"
      * "Write ONE final answer"
  - appendUserTurn(body, judgePrompt) → adds judge directive as user message
  - Call handleSingleModel(judgeBody, judge) with original stream setting
  
STEP 8: Return
  - Judge response streams to client (if client requested streaming)
```

**CRITICAL OBSERVATIONS**:

1. **Panel outputs are NOT persistent** - `answers` array only lives in function scope
2. **No access to intermediate reasoning** - Only final text extracted
3. **Judge sees anonymized sources** - No model attribution in prompt
4. **Same body to all panels** - Cannot send different context per model
5. **Tools stripped for panels** - Cannot use function calling in parallel
6. **No escalation mechanism** - Linear flow only
7. **No state persistence** - Stateless request/response

---

### C. MODEL & PROVIDER ROUTING (FACT)

**How 9Router determines execution path**:

```
INPUT: body.model (string)

STEP 1: Strip context markers
  "claude-sonnet-4.5[1m]" → "claude-sonnet-4.5" + marker

STEP 2: Check if combo
  File: src/lib/db/repos/combosRepo.js
  Query: SELECT * FROM combos WHERE name = ?
  If found → combo path (fallback/round-robin/fusion)

STEP 3: Parse model string
  File: open-sse/services/model.js:19
  Formats:
    - "provider/model" → { provider: "provider", model: "model" }
    - "alias" → lookup in modelAliases table
    - "prefix/model" → check providerNodes for custom endpoints

STEP 4: Resolve provider ID
  File: src/shared/constants/providers.js
  Maps aliases to canonical IDs (e.g., "oc" → "opencode")

STEP 5: Get executor
  File: open-sse/executors/index.js:70
  executors[provider] || new DefaultExecutor(provider)

STEP 6: Build URL & headers
  From provider registry (open-sse/providers/registry/*.js)
  OR from custom providerNodes (OpenAI/Anthropic compatible)

STEP 7: Execute request
  proxyAwareFetch(url, { method: 'POST', headers, body })
```

**Model identification types** (FACT):

1. **Native provider/model**: `anthropic/claude-3-5-sonnet`
2. **Alias**: `gpt4` → resolves to `openai/gpt-4` via modelAliases table
3. **Combo**: `office-team` → resolves to models array via combos table
4. **Provider alias**: `oc/deepseek-coder` → `opencode/deepseek-coder`
5. **Custom node**: `mynode/claude-3` → custom OpenAI/Anthropic-compatible endpoint

---

### D. CAPABILITY DETECTION (FACT)

**File**: `open-sse/providers/capabilities.js`

**Capability Flags**:
```javascript
{
  // Input modalities
  vision: boolean,        // Can read images
  pdf: boolean,          // Can read PDFs
  audioInput: boolean,   // Can read audio
  videoInput: boolean,   // Can read video
  
  // Output modalities
  imageOutput: boolean,  // Can generate images
  audioOutput: boolean,  // Can generate audio
  
  // Features
  search: boolean,       // Built-in web search
  tools: boolean,        // Function calling support
  reasoning: boolean,    // Has thinking/reasoning capability
  
  // Thinking configuration
  thinkingFormat: string | null,  // Format: openai|claude-adaptive|gemini-level|zai|deepseek|kimi|etc
  thinkingCanDisable: boolean,
  thinkingRange: { min, max } | null,
  
  // Limits
  contextWindow: number,  // Input token limit
  maxOutput: number      // Output token limit
}
```

**Resolution order** (FACT):
1. PROVIDER_CAPABILITIES[provider][model] - Provider-specific override
2. MODEL_CAPABILITIES[model] - Exact model ID exceptions
3. PATTERN_CAPABILITIES - Glob pattern matching
4. models.dev catalog - External model database (synced in background)
5. visionPatterns.js - Name-based vision detection
6. DEFAULT_CAPABILITIES - Safe floor

**Usage in combo** (FACT):
- `detectRequiredCapabilities(body)` scans request for images/PDF/audio/video
- `reorderByCapabilities(models, required)` prioritizes capable models
- Used in auto-switch: floats vision models to front if request has images

---

