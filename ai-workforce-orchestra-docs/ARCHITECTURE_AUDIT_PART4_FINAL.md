# AI WORKFORCE ORCHESTRA - FULL ARCHITECTURE AUDIT
## PART 4: ORCHESTRATION, INTEGRATION & IMPLEMENTATION PLAN (FINAL)

---

## R. TASK ORCHESTRATION STATE MACHINE

### Task Lifecycle

```
USER REQUEST
    ↓
┌─────────────────────────────────────────────────────────┐
│ PENDING                                                  │
│ - Task created from mission or user request             │
│ - Waiting for dependencies                              │
└────────────┬────────────────────────────────────────────┘
             │ (dependencies satisfied)
             ↓
┌─────────────────────────────────────────────────────────┐
│ ASSIGNED                                                 │
│ - Role determined (architect/developer/reviewer)        │
│ - Model selection in progress                           │
└────────────┬────────────────────────────────────────────┘
             │ (agent + model selected)
             ↓
┌─────────────────────────────────────────────────────────┐
│ RUNNING                                                  │
│ - Agent executing task                                  │
│ - Context provided, model called via 9Router            │
└────────┬───────────────────┬────────────────────────────┘
         │                   │
         │ (success)         │ (blocked/escalation)
         ↓                   ↓
┌──────────────────┐   ┌─────────────────────────────────┐
│ REVIEW           │   │ BLOCKED                         │
│ - Artifact       │   │ - Needs decision from higher    │
│   submitted      │   │   authority                     │
│ - Reviewer       │   │ - Waiting for escalation        │
│   assigned       │   │   resolution                    │
└────┬─────────────┘   └─────┬───────────────────────────┘
     │                       │ (decision received)
     │ (review done)         ↓
     ↓                  ┌─────────────────────────────────┐
┌─────────────┐         │ UNBLOCKED                       │
│ REWORK      │←────────│ - Resume with updated context   │
│ - Issues    │         └─────────────────────────────────┘
│   found     │                       │
│ - Back to   │                       │
│   agent     │                       ↓
└────┬────────┘                  (continue)
     │ (retry)
     ↓
┌─────────────────────────────────────────────────────────┐
│ APPROVED                                                 │
│ - Review passed                                         │
│ - Ready to apply                                        │
└────────────┬────────────────────────────────────────────┘
             │ (apply to project)
             ↓
┌─────────────────────────────────────────────────────────┐
│ COMPLETED                                                │
│ - Artifact applied                                      │
│ - Task closed                                           │
└─────────────────────────────────────────────────────────┘

ERROR PATHS:
RUNNING → FAILED (unrecoverable error)
REWORK → FAILED (max retry exceeded)
BLOCKED → FAILED (escalation rejected or timeout)
```

### State Transition Rules

```javascript
const STATE_TRANSITIONS = {
  PENDING: {
    allowed: ["ASSIGNED", "FAILED"],
    conditions: {
      ASSIGNED: (task) => task.dependencies.every(d => d.status === "COMPLETED")
    }
  },
  
  ASSIGNED: {
    allowed: ["RUNNING", "FAILED"],
    conditions: {
      RUNNING: (task) => task.assigned_to_agent_run !== null
    }
  },
  
  RUNNING: {
    allowed: ["REVIEW", "BLOCKED", "FAILED", "COMPLETED"],
    conditions: {
      REVIEW: (task) => task.artifacts.length > 0 && task.type !== "decision",
      BLOCKED: (task) => task.escalation !== null,
      COMPLETED: (task) => task.type === "decision" && task.result !== null,
      FAILED: (task) => task.retry_count >= MAX_RETRIES
    }
  },
  
  BLOCKED: {
    allowed: ["UNBLOCKED", "FAILED"],
    conditions: {
      UNBLOCKED: (task) => task.escalation.status === "answered",
      FAILED: (task) => task.escalation.status === "rejected" 
                     || (Date.now() - task.blocked_at) > ESCALATION_TIMEOUT
    }
  },
  
  UNBLOCKED: {
    allowed: ["RUNNING"]
  },
  
  REVIEW: {
    allowed: ["REWORK", "APPROVED", "ESCALATE_REVIEW", "FAILED"],
    conditions: {
      APPROVED: (task) => task.review.result === "pass",
      REWORK: (task) => task.review.result === "rework",
      ESCALATE_REVIEW: (task) => task.review.result === "escalate"
    }
  },
  
  REWORK: {
    allowed: ["RUNNING", "FAILED"],
    conditions: {
      RUNNING: (task) => task.retry_count < MAX_RETRIES,
      FAILED: (task) => task.retry_count >= MAX_RETRIES
    }
  },
  
  APPROVED: {
    allowed: ["COMPLETED", "FAILED"],
    conditions: {
      COMPLETED: (task) => task.applied_successfully === true
    }
  }
};

const MAX_RETRIES = 3;
const ESCALATION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
```

---

## S. ESCALATION SYSTEM

### Escalation Triggers

```javascript
// 1. Agent explicitly requests escalation
if (agentOutput.escalation_needed) {
  createEscalation({
    reason: agentOutput.escalation_reason,
    to_role: determineEscalationTarget(currentAgent, agentOutput.topic)
  });
}

// 2. Agent attempts decision outside authority
function validateDecision(agent, decision) {
  if (decision.type in agent.canApprove) {
    return { allowed: true };
  }
  
  // Check if decision requires higher authority
  const requiredAuthority = getRequiredAuthority(decision.type);
  if (agent.authority < requiredAuthority) {
    return {
      allowed: false,
      escalate_to: findAgentWithAuthority(requiredAuthority),
      reason: `Decision type "${decision.type}" requires authority ${requiredAuthority}, agent has ${agent.authority}`
    };
  }
  
  return { allowed: true };
}

// 3. Agent fails repeatedly
if (task.retry_count >= 2 && task.status === "REWORK") {
  createEscalation({
    reason: "Task failed multiple times, needs expert intervention",
    to_role: getNextHigherRole(task.assigned_to_role),
    context: {
      failures: task.attempts.map(a => a.failure_reason)
    }
  });
}

// 4. Review identifies critical issues
if (review.issues.some(i => i.severity === "critical")) {
  createEscalation({
    reason: "Critical issues found in review",
    to_role: review.issues[0].type === "security" ? "security_lead" : "tech_lead",
    context: {
      issues: review.issues.filter(i => i.severity === "critical")
    }
  });
}
```

### Escalation Resolution Flow

```
TASK BLOCKED
    ↓
Create Escalation
    ↓
┌─────────────────────────────────────────────────────────┐
│ Find agent with required authority                       │
│   - Check authority level                               │
│   - Check canApprove list                              │
│   - Select appropriate role                             │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Build escalation context                                 │
│   - Original task                                       │
│   - Blocking reason                                     │
│   - Agent's attempted solution                          │
│   - Previous decisions (locked)                         │
│   - Relevant architecture                               │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Execute higher authority agent                           │
│   - Premium model (architect/tech_lead use best)       │
│   - Full reasoning capability                           │
│   - Structured decision format                          │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Decision output                                          │
│   {                                                     │
│     decision: "APPROVE" | "REJECT" | "MODIFY",         │
│     rationale: string,                                 │
│     modifications: {...},                               │
│     lock_decision: boolean,  // Prevent future changes │
│     guidance: string  // For original agent            │
│   }                                                     │
└────────────┬────────────────────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────────────────────┐
│ Store decision as locked if decision.lock_decision       │
│   → Lower authority agents CANNOT override              │
│   → Included in future contexts automatically           │
└────────────┬────────────────────────────────────────────┘
             ↓
┌─────────────────────────────────────────────────────────┐
│ Update task context with decision                        │
│ Transition: BLOCKED → UNBLOCKED → RUNNING               │
└─────────────────────────────────────────────────────────┘
```

### Authority Enforcement

```javascript
// When agent produces output that affects architecture
function enforceAuthority(agent, output) {
  const violations = [];
  
  // Check for locked decisions being violated
  for (const decision of mission.decisions.filter(d => d.locked)) {
    if (output.contradicts(decision)) {
      violations.push({
        type: "locked_decision_violation",
        decision_id: decision.id,
        decision_topic: decision.topic,
        violation: `Output attempts to ${output.action} but decision requires ${decision.decision}`
      });
    }
  }
  
  // Check for unauthorized changes
  const unauthorizedChanges = [];
  for (const change of output.changes) {
    const required = getRequiredAuthority(change.type);
    if (agent.authority < required) {
      unauthorizedChanges.push({
        change: change.type,
        required_authority: required,
        agent_authority: agent.authority
      });
    }
  }
  
  if (violations.length > 0 || unauthorizedChanges.length > 0) {
    return {
      blocked: true,
      violations,
      unauthorizedChanges,
      escalation: createAutoEscalation(agent, violations, unauthorizedChanges)
    };
  }
  
  return { blocked: false };
}
```

---

## T. REVIEW & QUALITY CONTROL

### Multi-Layer Review

```javascript
const REVIEW_LAYERS = {
  // Layer 1: Automated checks (fast, cheap)
  automated: {
    agent: "linter",
    checks: [
      "syntax_errors",
      "type_errors",
      "lint_rules",
      "basic_security_patterns"
    ],
    cost: "free",
    model: null  // Uses tools, not LLM
  },
  
  // Layer 2: AI code review (standard, budget model)
  code_review: {
    agent: "reviewer",
    model_policy: { reasoning: "medium", coding: "medium", costTier: "budget" },
    checks: [
      "correctness",
      "code_quality",
      "test_coverage",
      "edge_cases"
    ]
  },
  
  // Layer 3: Security review (if sensitive code, premium model)
  security_review: {
    agent: "security_reviewer",
    model_policy: { reasoning: "high", costTier: "premium" },
    triggers: [
      "auth_code",
      "crypto_code",
      "database_query",
      "user_input_handling"
    ],
    checks: [
      "injection_vulnerabilities",
      "auth_bypass",
      "data_exposure",
      "crypto_misuse"
    ]
  },
  
  // Layer 4: Architecture review (if breaking changes, premium model)
  architecture_review: {
    agent: "architect",
    model_policy: { reasoning: "very_high", costTier: "premium" },
    triggers: [
      "schema_changes",
      "api_breaking_changes",
      "new_dependencies",
      "performance_critical"
    ],
    checks: [
      "architecture_consistency",
      "scalability_impact",
      "breaking_changes",
      "migration_safety"
    ]
  }
};

async function conductReview(task, artifact) {
  const reviews = [];
  
  // Always run automated
  const automated = await runAutomatedChecks(artifact);
  reviews.push(automated);
  if (automated.result === "fail" && automated.severity === "critical") {
    return { result: "rework", reviews };
  }
  
  // Always run code review
  const codeReview = await runAgentReview("code_review", task, artifact);
  reviews.push(codeReview);
  if (codeReview.result === "fail") {
    return { result: "rework", reviews };
  }
  
  // Conditional security review
  if (requiresSecurityReview(artifact)) {
    const secReview = await runAgentReview("security_review", task, artifact);
    reviews.push(secReview);
    if (secReview.hasIssues(["critical", "major"])) {
      return { result: "escalate", reviews, escalate_to: "security_lead" };
    }
  }
  
  // Conditional architecture review
  if (requiresArchitectureReview(artifact)) {
    const archReview = await runAgentReview("architecture_review", task, artifact);
    reviews.push(archReview);
    if (archReview.result === "fail") {
      return { result: "escalate", reviews, escalate_to: "tech_lead" };
    }
  }
  
  return { result: "pass", reviews };
}
```

### Review Loop with Retry Limit

```javascript
async function executeTaskWithReview(task) {
  let attempts = 0;
  const MAX_ATTEMPTS = 3;
  
  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    
    // Execute task
    const agentRun = await executeAgent(task);
    
    if (agentRun.status === "escalated") {
      return await handleEscalation(agentRun.escalation);
    }
    
    if (agentRun.status === "failed") {
      if (attempts >= MAX_ATTEMPTS) {
        return { status: "failed", reason: "max_retries_exceeded" };
      }
      continue; // Retry
    }
    
    // Review artifact
    const reviewResult = await conductReview(task, agentRun.artifact);
    
    if (reviewResult.result === "pass") {
      return { status: "approved", artifact: agentRun.artifact };
    }
    
    if (reviewResult.result === "escalate") {
      return await handleEscalation(reviewResult.escalation);
    }
    
    if (reviewResult.result === "rework") {
      if (attempts >= MAX_ATTEMPTS) {
        // Too many failures, escalate to human or higher authority
        return { 
          status: "escalate", 
          reason: "repeated_review_failure",
          reviews: reviewResult.reviews
        };
      }
      
      // Provide feedback for rework
      task.feedback = aggregateReviewFeedback(reviewResult.reviews);
      continue; // Retry with feedback
    }
  }
}
```

---

## U. ANTIGRAVITY INTEGRATION ANALYSIS

### What We Know About Antigravity (FACT from context)

**Antigravity is Google Deepmind's Advanced Agentic Coding environment**

Based on the system prompts and identity sections found earlier:
- It's an AI-powered development environment
- Has tools for file operations, command execution
- Can edit files, run commands, search code
- Has subagent capabilities
- Has tool system (invoke_subagent, run_command, view_file, etc.)

### What We DON'T Know (UNKNOWN - Needs Investigation)

**File**: N/A - Not found in 9Router codebase

❓ **CRITICAL UNKNOWNS**:

1. **Does Antigravity expose a programmatic API?**
   - Can external orchestrator call Antigravity functions?
   - Or must orchestrator run INSIDE Antigravity?

2. **Can we trigger Antigravity actions remotely?**
   - HTTP API?
   - IPC?
   - File-based communication?

3. **How does workspace isolation work?**
   - Can multiple agents work in same workspace concurrently?
   - Do we need separate worktrees/branches?

4. **State persistence**
   - Where is Antigravity state stored?
   - Can we query current workspace state?

5. **Integration model**
   - Should Orchestra be:
     a) Antigravity plugin/extension?
     b) External service that calls Antigravity?
     c) Wrapper around Antigravity?

### Proposed Integration Architecture (INFERENCE - To Be Validated)

**Option A: Orchestra as Antigravity Extension**
```
User → Antigravity UI
         ↓
    Orchestra Extension
         ↓
    9Router (via localhost:20128)
         ↓
    AI Providers
```
**Pros**: Direct access to Antigravity APIs, workspace context  
**Cons**: Tied to Antigravity lifecycle, deployment complexity

**Option B: Orchestra as External Service**
```
User → Orchestra UI
         ↓
    Orchestrator Service
         ├→ 9Router (AI calls)
         └→ Antigravity (via API/CLI?)
              ↓
         User Project
```
**Pros**: Independent deployment, flexible integration  
**Cons**: Requires Antigravity API (unknown if exists)

**Option C: Hybrid - Orchestra coordinates, Antigravity executes**
```
User → Orchestra UI
         ↓
    Orchestrator
         ├→ 9Router (AI reasoning, planning, review)
         └→ File-based tasks → Antigravity watches & executes
              ↓
         User Project
```
**Pros**: Loose coupling, works without Antigravity API  
**Cons**: File-based coordination is fragile

### **RECOMMENDATION**: Start with Option C for MVP
- Orchestra plans & coordinates via 9Router
- Writes task files to shared directory
- Antigravity (or similar tool) picks up and executes
- Results written back to shared directory
- Orchestra validates and continues workflow

**This requires validation through actual Antigravity documentation/testing**

---

## V. FAILURE MODES & MITIGATIONS

### Critical Failure Scenarios

| Failure Mode | Impact | Mitigation |
|--------------|--------|------------|
| **Model timeout** | Task blocked | Fallback to faster model, reduce context size |
| **Provider unavailable** | All accounts fail | 9Router handles via multi-provider fallback |
| **Hallucination** | Incorrect code | Multi-layer review, test validation |
| **Conflicting decisions** | Inconsistent state | Authority enforcement, locked decisions |
| **Infinite retry loop** | Resource waste | MAX_RETRIES limit, escalation after 3 failures |
| **Context too large** | Model error | Context prioritization, truncation algorithm |
| **Wrong model selected** | Poor quality | Scoring algorithm, performance tracking, feedback loop |
| **Budget exhausted** | Workflow stops | Pre-flight cost check, cost tracking per mission |
| **Concurrent file edits** | Merge conflicts | File locking for MVP, git worktree for advanced |
| **Escalation timeout** | Blocked forever | 30-minute timeout → fail task, notify user |
| **Reviewer disagreement** | Loop between agents | Escalate to higher authority after 2 iterations |
| **Architecture violation** | Tech debt | Authority enforcement, locked decision checks |
| **Test failures** | Rework loop | Provide test output to agent, max 3 reworks |
| **Memory leaks** | State bloat | Periodic memory cleanup, relevance decay |
| **Event loss** | UI desync | Event persistence, replay capability |

---

## W. DATA STORAGE ARCHITECTURE

### PostgreSQL Schema (Recommended)

```sql
-- Missions
CREATE TABLE missions (
  id UUID PRIMARY KEY,
  goal TEXT NOT NULL,
  requirements JSONB,
  status TEXT NOT NULL,
  current_phase TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

-- Decisions (Locked architecture decisions)
CREATE TABLE decisions (
  id UUID PRIMARY KEY,
  mission_id UUID REFERENCES missions(id),
  topic TEXT NOT NULL,
  decision TEXT NOT NULL,
  rationale TEXT,
  alternatives_considered JSONB,
  made_by_agent TEXT NOT NULL,
  authority_level INTEGER NOT NULL,
  locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON decisions(mission_id);
CREATE INDEX ON decisions(locked) WHERE locked = true;

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  mission_id UUID REFERENCES missions(id),
  parent_task_id UUID REFERENCES tasks(id),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB,
  assigned_to_role TEXT,
  assigned_to_agent_run UUID,
  status TEXT NOT NULL,
  blocked_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON tasks(mission_id, status);
CREATE INDEX ON tasks(status) WHERE status IN ('PENDING', 'RUNNING', 'BLOCKED');

-- Agent Runs
CREATE TABLE agent_runs (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  agent_role TEXT NOT NULL,
  model_used TEXT NOT NULL,
  status TEXT NOT NULL,
  context_provided JSONB,
  result JSONB,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  cost NUMERIC(10,6),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  latency_ms INTEGER
);
CREATE INDEX ON agent_runs(task_id);
CREATE INDEX ON agent_runs(started_at DESC);

-- Escalations
CREATE TABLE escalations (
  id UUID PRIMARY KEY,
  from_agent_run UUID REFERENCES agent_runs(id),
  from_agent_role TEXT NOT NULL,
  to_agent_role TEXT NOT NULL,
  reason TEXT NOT NULL,
  context JSONB,
  question TEXT,
  status TEXT NOT NULL,
  resolved_by_agent_run UUID REFERENCES agent_runs(id),
  resolution JSONB,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON escalations(status) WHERE status = 'pending';

-- Artifacts
CREATE TABLE artifacts (
  id UUID PRIMARY KEY,
  task_id UUID REFERENCES tasks(id),
  agent_run_id UUID REFERENCES agent_runs(id),
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT,  -- Null if large, stored in filesystem
  diff TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX ON artifacts(task_id);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY,
  artifact_id UUID REFERENCES artifacts(id),
  reviewer_agent_run UUID REFERENCES agent_runs(id),
  result TEXT NOT NULL,
  feedback TEXT,
  issues JSONB,
  created_at TIMESTAMPTZ NOT NULL
);

-- Memory (pgvector for semantic search)
CREATE TABLE memory (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  context JSONB,
  embedding VECTOR(1536),  -- pgvector extension
  relevance_score FLOAT,
  created_at TIMESTAMPTZ NOT NULL,
  last_accessed TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0
);
CREATE INDEX ON memory USING ivfflat (embedding vector_cosine_ops);

-- Events (for UI updates)
CREATE TABLE events (
  id UUID PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX ON events(timestamp DESC);
CREATE INDEX ON events(type, timestamp DESC);
```

### File Storage

Large artifacts (>1MB) stored in filesystem:
```
${dataDir}/orchestra/
  artifacts/
    {artifact_id}.{ext}
  logs/
    {agent_run_id}.log
```

---

## X. MVP vs FUTURE ARCHITECTURE

### MVP (Minimum Viable Product)

**Goal**: Prove concept with simplest useful workflow

**Scope**:
- ✅ Single linear workflow (plan → code → review → approve)
- ✅ 3 roles: Planner, Developer, Reviewer
- ✅ Fixed model assignments (no dynamic selection)
- ✅ Simple escalation (developer→reviewer on error)
- ✅ File-based Antigravity integration
- ✅ In-memory state (PostgreSQL optional)
- ✅ Basic review (pass/fail)
- ✅ No memory system
- ✅ CLI interface only
- ✅ Single mission at a time

**NOT in MVP**:
- ❌ Dynamic model routing
- ❌ Complex authority hierarchy
- ❌ Parallel task execution
- ❌ Context optimization
- ❌ Memory/learning
- ❌ UI simulator
- ❌ Cost prediction
- ❌ Multiple concurrent missions

### Future Architecture

**After MVP validation**:
- Full role hierarchy (10 agents)
- Dynamic model selection based on complexity
- Context engine with smart filtering
- Memory system with semantic search
- Parallel task execution
- Real-time UI simulator
- Cost prediction & budget control
- Multi-mission support
- Performance analytics
- A/B testing different strategies

---

## Y. 9ROUTER INTEGRATION BOUNDARY (FINAL)

### What Orchestra Uses from 9Router

```javascript
// Orchestra → 9Router API calls

// 1. Execute agent with specific model
async function callAgent(agent, task, context) {
  const modelSelection = selectModel(agent, task);
  
  const response = await fetch('http://localhost:20128/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${orchestra_api_key}`
    },
    body: JSON.stringify({
      model: modelSelection.primary,  // e.g., "anthropic/claude-3-5-sonnet"
      messages: buildMessages(agent, task, context),
      stream: false,  // Orchestra needs full response for validation
      tools: agent.outputFormat.type === "structured" ? [agent.outputSchema] : undefined,
      temperature: 0.7
    })
  });
  
  return await response.json();
}

// 2. Create dynamic combo for fusion workflows (optional)
async function createFusionCombo(panelModels, judgeModel) {
  await fetch('http://localhost:20128/api/combos', {
    method: 'POST',
    body: JSON.stringify({
      name: `fusion-${Date.now()}`,
      models: panelModels,
      fusionTuning: { minPanel: 2, stragglerGraceMs: 10000 }
    })
  });
  
  // Then use in settings.comboStrategies
}

// 3. Query usage/cost (for budget control)
async function getCurrentCost(missionId) {
  const response = await fetch('http://localhost:20128/api/usage/stats');
  const stats = await response.json();
  // Filter by mission-specific API key or time range
}
```

### What Orchestra DOESN'T Use

- ❌ 9Router combos directly (Orchestra builds own workflow)
- ❌ 9Router rate limiting (Orchestra does pre-flight model selection)
- ❌ 9Router database (separate Orchestra database)
- ❌ 9Router UI (separate Orchestra UI)

### Clean Separation

```
Orchestra concerns:
  - Workflow orchestration
  - Agent coordination
  - State management
  - Escalation logic
  - Review loops
  - Decision tracking

9Router concerns:
  - Model access
  - Format translation
  - Token optimization
  - Provider failover
  - Usage tracking
```

---

## Z. OPEN QUESTIONS (MUST ANSWER BEFORE IMPLEMENTATION)

### 🔴 CRITICAL (Block MVP)

1. **Antigravity Integration Method**
   - How does Orchestra trigger Antigravity actions?
   - API? CLI? File-based?
   - **Action**: Test Antigravity capabilities, document integration points

2. **State Storage Decision**
   - PostgreSQL or in-memory for MVP?
   - If PostgreSQL, local file or hosted?
   - **Action**: Decide based on persistence requirements

3. **Model Selection Strategy**
   - Fixed assignments or simple scoring for MVP?
   - **Action**: Start with fixed, validate with real tasks

4. **Escalation Target Selection**
   - How to determine which role to escalate to?
   - **Action**: Define role hierarchy matrix

5. **Review Criteria Definition**
   - What makes a review pass vs fail?
   - **Action**: Define concrete pass/fail rules per review type

### 🟡 HIGH PRIORITY (Needed soon)

6. **Context Size Management**
   - How to measure and limit context tokens?
   - **Action**: Implement token counter, define limits per role

7. **Cost Budget Enforcement**
   - Per-mission? Per-task? Per-day?
   - **Action**: Define budget model

8. **Parallel Task Execution**
   - MVP: sequential only?
   - Future: how to determine safe parallelism?
   - **Action**: Start sequential, design parallel for v2

9. **Memory Relevance Scoring**
   - Algorithm for selecting relevant memories?
   - **Action**: Design for v2, skip in MVP

10. **UI Architecture**
    - Web app? Separate process? Embedded in Antigravity?
    - **Action**: Design API contract first, UI later

### 🟢 MEDIUM PRIORITY (Post-MVP)

11. **Multi-Mission Support**
12. **A/B Testing Different Workflows**
13. **Performance Analytics**
14. **Model Performance Tracking**
15. **Automated Workflow Optimization**

---

## AA. RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Foundation (Week 1-2)

1. **Setup Orchestra project structure**
   - TypeScript/Node.js (or Python)
   - Database schema (PostgreSQL recommended)
   - Basic Express API server

2. **Implement core data models**
   - Mission, Task, AgentRun, Decision entities
   - State transition logic
   - Event system

3. **Build 9Router integration layer**
   - HTTP client for /v1/chat/completions
   - Model selection logic (simple fixed mapping for MVP)
   - Error handling & retry

4. **Test basic flow**
   - Create mission → create task → execute agent via 9Router
   - Validate end-to-end

### Phase 2: Agent System (Week 3)

5. **Implement Agent Manager**
   - Role definitions (3 roles for MVP: planner, developer, reviewer)
   - Context building (simple: task + mission goal)
   - Prompt templates

6. **Build execution loop**
   - executeAgent() function
   - State transitions
   - Result validation

7. **Test with real AI models**
   - Run planner agent
   - Run developer agent
   - Capture and store results

### Phase 3: Review & Escalation (Week 4)

8. **Implement Review Engine**
   - Simple pass/fail logic
   - Review agent execution
   - Feedback generation

9. **Implement Escalation System**
   - Escalation triggers
   - Higher authority execution
   - Decision storage

10. **Test review loop**
    - Task → execute → review → rework → approve

### Phase 4: Integration (Week 5)

11. **Antigravity Integration**
    - File-based task handoff
    - Result capture
    - Error handling

12. **End-to-end workflow**
    - User request → planning → coding → review → approval → apply

13. **MVP validation**
    - Run real feature implementation
    - Measure cost, time, quality

### Phase 5: Iteration (Week 6+)

14. **Collect feedback**
15. **Add dynamic model selection**
16. **Improve context engine**
17. **Add memory system**
18. **Build UI**

---

## FINAL SUMMARY

### What We Confirmed

✅ 9Router is production-ready model gateway  
✅ Fusion provides parallel execution primitive  
✅ No orchestration exists - must build from scratch  
✅ Database schema is straightforward  
✅ Integration boundary is clean (HTTP API)

### What We Must Build

❌ Complete Orchestra layer (10+ components)  
❌ Agent role system with authority  
❌ Task orchestration with state machine  
❌ Escalation logic  
❌ Review loops  
❌ Context engine  
❌ Decision tracking  
❌ Memory system (future)

### Critical Unknowns

❓ Antigravity integration method  
❓ Optimal state storage (PostgreSQL vs in-memory)  
❓ Model selection scoring weights  
❓ Context optimization strategy  
❓ Cost budget enforcement rules

### Ready to Implement

After this audit, we have:
- ✅ Complete understanding of 9Router
- ✅ Clear architecture for Orchestra
- ✅ Data models designed
- ✅ State machine defined
- ✅ Integration boundaries clear
- ✅ Implementation plan sequenced

**NEXT STEP**: Review this audit, answer open questions, then begin Phase 1 implementation.

---

**END OF ARCHITECTURE AUDIT**
