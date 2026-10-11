# AI WORKFORCE ORCHESTRA - FULL ARCHITECTURE AUDIT
## PART 2: 9ROUTER CAPABILITIES & LIMITATIONS

---

## E. DATABASE ARCHITECTURE (FACT)

**Storage**: SQLite with WAL mode  
**Location**: `${dataDir}/9router.db`  
**Schema Version**: 1  

**Tables** (from `src/lib/db/schema.js`):

### 1. settings
```sql
CREATE TABLE settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),  -- Single row
  data TEXT NOT NULL  -- JSON blob
)
```
**Stores**: Global settings, strategies, feature flags

### 2. providerConnections
```sql
CREATE TABLE providerConnections (
  id TEXT PRIMARY KEY,  -- UUID
  provider TEXT NOT NULL,
  authType TEXT NOT NULL,
  name TEXT,
  email TEXT,
  priority INTEGER,
  isActive INTEGER DEFAULT 1,
  data TEXT NOT NULL,  -- JSON: credentials, providerSpecificData
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```
**Stores**: OAuth tokens, API keys, refresh tokens per account

### 3. combos
```sql
CREATE TABLE combos (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  kind TEXT,
  models TEXT NOT NULL,  -- JSON array: ["provider/model1", "provider/model2"]
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
)
```
**Critical**: Combo configuration stored here, **NOT in memory**

### 4. kv (Key-Value Store)
```sql
CREATE TABLE kv (
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  PRIMARY KEY (scope, key)
)
```
**Scopes**:
- `modelAliases`: Custom model aliases
- `customModels`: User-added models
- `mitmAlias`: MITM tool host aliases
- `pricing`: Custom pricing overrides

### 5. usageHistory
```sql
CREATE TABLE usageHistory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  connectionId TEXT,
  apiKey TEXT,
  endpoint TEXT,
  promptTokens INTEGER DEFAULT 0,
  completionTokens INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  status TEXT,
  tokens TEXT,  -- JSON
  meta TEXT     -- JSON
)
```
**Usage**: Real-time request tracking

### 6. requestDetails
```sql
CREATE TABLE requestDetails (
  id TEXT PRIMARY KEY,
  timestamp TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  connectionId TEXT,
  status TEXT,
  data TEXT NOT NULL  -- JSON: full request/response details
)
```
**Usage**: Detailed request logs for debugging

### 7. providerNodes, proxyPools, apiKeys
Custom OpenAI/Anthropic-compatible endpoints, proxy configuration, API key management

---

## F. TOOL CALLING & STRUCTURED OUTPUT (FACT vs INFERENCE)

### Tools Support (FACT)

**9Router forwards tools as-is**:
```javascript
// From chatCore.js
body.tools  // Passed through translation
body.tool_choice  // Passed through translation
```

**Format translation** (FACT):
- OpenAI tools → Claude tools (translator handles)
- Claude tools → OpenAI tools
- Gemini function_declarations ↔ OpenAI tools
- Responses API `tools` → OpenAI tools

**Tool deduplication** (FACT):
File: `open-sse/utils/toolDeduper.js`
- Strips duplicate MCP tools (Claude client quirk)
- DeepSeek requires unique tool names (enforced)

**FUSION LIMITATION** (FACT):
```javascript
// From combo.js:567
const { tools, tool_choice, ...rest } = body;
const panelBody = { ...rest, stream: false };
```
**Panel models DO NOT receive tools** - Tools stripped for fusion!  
Only judge call has tools restored.

### Structured Output (PARTIAL SUPPORT)

**JSON Schema** (INFERENCE from default.js:89-106):
```javascript
applyJsonSchemaFallback(body) {
  if (body?.response_format?.type === 'json_schema') {
    // Fallback: inject schema into system prompt
    // + set response_format: { type: 'json_object' }
  }
}
```
**Support level**: Via prompt engineering fallback, not native

**JSON Mode** (FACT):
```javascript
body.response_format = { type: 'json_object' }
```
Forwarded to providers that support it

---

## G. STREAMING BEHAVIOR (FACT)

**Decision logic** (from chatCore.js:133-157):

```javascript
// Client requested streaming
const clientRequestedStreaming = body.stream === true 
  || sourceFormat === FORMATS.ANTIGRAVITY 
  || sourceFormat === FORMATS.GEMINI 
  || sourceFormat === FORMATS.GEMINI_CLI;

// Provider requires streaming
const providerRequiresStreaming = PROVIDERS[provider]?.forceStream === true;

// Final decision
let stream = providerRequiresStreaming ? true : (body.stream !== false);

// Image generation models → force non-streaming
if (isImageGenModel && (provider === 'antigravity' || provider === 'gemini-cli')) {
  stream = false;
}

// DeepSeek TUI quirk: only stream if client explicitly requested
if (detectedTool === 'deepseek-tui' && body.stream !== true) {
  stream = false;
}

// Client Accept header preference
if (clientPrefersJson && !clientPrefersSSE && body.stream !== true) {
  stream = false;
}
```

**FUSION streaming** (FACT):
- Panel: **ALWAYS non-streaming** (forced)
- Judge: **Honors client's original stream flag**

**SSE Parsing** (FACT):
File: `open-sse/handlers/chatCore/streamingHandler.js`
- Parses `data: {...}` lines
- Handles `[DONE]` marker
- Translates chunks between formats
- Forwards to client

---

## H. WHAT 9ROUTER DOES vs DOESN'T (FACT CHECK)

### ✅ 9ROUTER DOES

1. **Multi-provider gateway** - 100+ providers via executors
2. **Credential management** - Multiple accounts per provider
3. **Format translation** - OpenAI ↔ Claude ↔ Gemini ↔ Responses API
4. **Token optimization** - RTK, Headroom, Caveman, Ponytail, Pxpipe
5. **Rate limit handling** - Per-account rate limit awareness + retry-after
6. **Account fallback** - Try next account on error
7. **Combo strategies** - Fallback, round-robin, fusion
8. **Usage tracking** - Tokens, cost, latency per request
9. **Request logging** - Full request/response details
10. **Model capability detection** - Vision, PDF, reasoning, tools, limits
11. **Auto token refresh** - OAuth token refresh on 401/403
12. **Proxy support** - HTTP/SOCKS proxy per connection
13. **Custom endpoints** - OpenAI/Anthropic-compatible nodes
14. **Model aliases** - Custom model name mappings
15. **Tool forwarding** - Passes tools to upstream APIs

### ❌ 9ROUTER DOES NOT

1. **State management** - Every request is stateless
2. **Conversation memory** - No multi-turn state
3. **Task orchestration** - No concept of tasks
4. **Agent roles** - No role-based execution
5. **Context selection** - Sends full body to all models
6. **Escalation logic** - Only error-based fallback
7. **Review loops** - No validation/approval cycle
8. **Dynamic model selection** - Combo models are pre-configured
9. **Intermediate result access** - Fusion panel outputs ephemeral
10. **Cost prediction** - Only tracks actual usage
11. **Budget enforcement** - No pre-flight cost checks
12. **Workflow management** - No multi-step coordination
13. **Decision persistence** - No decision log
14. **Learning/adaptation** - No experience memory
15. **File system access** - No integration with workspace
16. **Code execution** - No test/build/lint capability
17. **Git operations** - No version control integration
18. **Async callbacks** - Synchronous request/response only
19. **Event stream** - No pub/sub for state changes
20. **Role authority** - No permission/capability model

---

## I. COMBO CONFIGURATION (FACT)

**Storage**: `combos` table in SQLite

**Schema**:
```javascript
{
  id: "uuid",
  name: "office-team",  // Unique identifier
  kind: null,           // Optional categorization
  models: [             // JSON array
    "anthropic/claude-3-5-sonnet",
    "openai/gpt-4",
    "gemini/gemini-2.0-flash-thinking-exp"
  ],
  createdAt: "ISO8601",
  updatedAt: "ISO8601"
}
```

**Strategy configuration** (FACT):
Stored in `settings.data` JSON:
```javascript
{
  comboStrategy: "fallback",  // Global default
  comboStrategies: {          // Per-combo overrides
    "office-team": {
      fallbackStrategy: "fusion",
      judgeModel: "anthropic/claude-3-5-sonnet",
      fusionTuning: {
        minPanel: 2,
        stragglerGraceMs: 10000,
        panelHardTimeoutMs: 120000
      }
    }
  }
}
```

**In-memory rotation state** (FACT):
File: `open-sse/services/combo.js:88`
```javascript
const comboRotationState = new Map();
// Key: comboName
// Value: { index: number, consecutiveUseCount: number }
```
**NOT PERSISTENT** - Reset on server restart

---

## J. AUTHENTICATION & CREDENTIAL FLOW (FACT)

**Credential structure**:
```javascript
{
  id: "conn-uuid",
  connectionName: "My Account",
  provider: "anthropic",
  authType: "oauth" | "apikey",
  accessToken: "sk-ant-...",
  refreshToken: "...",
  apiKey: null,  // For API key auth
  providerSpecificData: {
    projectId: "...",           // Gemini/Antigravity
    deviceId: "...",            // Kimi
    orgId: "...",              // Kilocode
    enabledModels: [...],      // Codex model filter
    connectionProxyEnabled: boolean,
    connectionProxyUrl: "...",
    vercelRelayUrl: "...",
  },
  isActive: true,
  priority: 0,
  lastError: "...",
  errorCode: 429,
  modelLocks: {
    "claude-3-5-sonnet": "2026-10-05T03:00:00.000Z"  // Rate limit until
  }
}
```

**Selection strategies** (FACT):
From `settings.fallbackStrategy` or per-provider override:
- **fill-first**: Use first available account until exhausted
- **round-robin**: Rotate through all accounts
- **least-used**: Pick account with lowest usage

**Model locks** (FACT):
Per-account, per-model rate limit tracking:
```javascript
// When 429/503 with Retry-After header
credentials.modelLocks[model] = retryAfterTimestamp;

// Future requests skip this account for this model
if (isModelLockActive(credentials, model)) {
  // Skip in getProviderCredentials()
}
```

**Antigravity quota cache** (FACT - SPECIAL CASE):
File: `src/sse/services/antigravityQuota.js`
- In-memory cache of live quota per account per model
- Populated on 409/429 from Antigravity
- Blocks account selection until quota resets
- NOT persisted to database

---

## K. PRICING & COST TRACKING (FACT)

**Pricing data** (FACT):
File: `open-sse/providers/pricing.js`
- Hardcoded pricing for common models
- Pattern matching (e.g., `gpt-4*` pricing)
- Stored in `kv` table for custom overrides

**Cost calculation** (FACT):
File: `src/lib/usageDb.js`
```javascript
{
  promptTokens: number,
  completionTokens: number,
  cost: (promptTokens * inputPrice + completionTokens * outputPrice) / 1M
}
```

**LIMITATION** (INFERENCE):
- No pre-flight cost estimation
- No budget enforcement
- Cost calculated AFTER request completes

---

## L. UNKNOWN / NEEDS INVESTIGATION

### 1. Model Discovery API ❓
**Question**: Can we query "give me all models with vision + reasoning + context>500k"?  
**Current**: `getCapabilitiesForModel(provider, model)` only checks single model  
**Status**: **UNKNOWN** - Need to check if bulk query API exists

### 2. Antigravity Integration ❓
**Question**: How does external orchestrator interact with Antigravity workspace?  
**Status**: **NOT FOUND** in 9Router codebase - This is a separate concern

### 3. Custom Executor Registration ❓
**Question**: Can Orchestra register custom executors dynamically?  
**Current**: Executors hardcoded in `executors/index.js`  
**Status**: **EXTENSIBLE but not pluggable** - Would need source modification

### 4. Webhook/Callback Support ❓
**Question**: Can 9Router call back when long-running request completes?  
**Status**: **NO** - Synchronous request/response only (CONFIRMED)

### 5. Structured State API ❓
**Question**: Does 9Router expose API to store/retrieve custom state?  
**Status**: **NO** - Database only stores 9Router internal state (CONFIRMED)

### 6. Event Stream ❓
**Question**: Can external systems subscribe to 9Router events?  
**Status**: **NO** - No pub/sub mechanism found (CONFIRMED)

### 7. Request Prioritization ❓
**Question**: Can Orchestra mark requests as high/low priority?  
**Status**: **NO** - FIFO request handling (CONFIRMED)

### 8. Partial Response Access ❓
**Question**: Can we access fusion panel responses after judge completes?  
**Status**: **NO** - Panel responses not stored (CONFIRMED from code)

### 9. Model Performance Metrics ❓
**Question**: Does 9Router track model success rate, average latency per model?  
**Status**: **PARTIAL** - Usage tracking exists but no aggregated metrics API found

### 10. Dynamic Combo Creation ❓
**Question**: Can Orchestra create combos programmatically at runtime?  
**Status**: **YES** - Database API available (`createCombo()`)

---

