# System Architecture - AI Workforce Orchestra

**Last Updated**: 2026-10-05  
**Status**: Architecture Complete - Pre-Implementation

---

## 🏗️ System Overview

AI Workforce Orchestra adalah sistem 3-layer yang memisahkan concerns dengan jelas:

```
┌─────────────────────────────────────────────────────────────┐
│                    USER / CLIENT                             │
│                  (CLI / Web UI / API)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              ORCHESTRA LAYER (NEW - MUST BUILD)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Orchestrator (Control Plane)                        │  │
│  │    - Parse user intent                               │  │
│  │    - Determine workflow                              │  │
│  │    - Coordinate agents                               │  │
│  │    - Manage mission lifecycle                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────┴────────────────────────────────┐ │
│  │  Core Components:                                     │ │
│  ├─ Mission Manager      ├─ Task Manager                 │ │
│  ├─ Agent Manager        ├─ Model Router                 │ │
│  ├─ Context Engine       ├─ Memory System (Future)       │ │
│  ├─ Review Engine        ├─ Escalation Engine            │ │
│  └─ Event Bus           └─ Execution Adapter            │ │
│                                                            │ │
└────────────────────────┬───────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ↓                             ↓
┌─────────────────────┐      ┌─────────────────────┐
│     9ROUTER         │      │   ANTIGRAVITY       │
│  (EXISTS - USE)     │      │  (EXISTS - USE)     │
│                     │      │                     │
│  - Multi-provider   │      │  - File ops         │
│  - Format translate │      │  - Command exec     │
│  - Token optimize   │      │  - Test runner      │
│  - Rate limit       │      │  - Git operations   │
│  - Usage tracking   │      │  - Codebase context │
└─────────┬───────────┘      └─────────┬───────────┘
          │                            │
          ↓                            ↓
   AI Provider APIs              User Project Repo
```

---

## 📦 Layer Responsibilities

### Layer 1: Orchestra (NEW - Core of this project)

**Responsibility**: Coordination, orchestration, state management

**Components**:

1. **Mission Manager**
   - Accepts high-level goals from user
   - Tracks mission status (planning → in_progress → review → completed)
   - Maintains mission-level decisions
   - Enforces scope and requirements

2. **Task Manager**
   - Breaks down missions into tasks
   - Manages task dependencies
   - Tracks task status (pending → assigned → running → review → completed)
   - Handles task blocking and unblocking

3. **Agent Manager**
   - Defines agent roles (architect, developer, reviewer, etc.)
   - Assigns agents to tasks based on role requirements
   - Manages agent execution lifecycle
   - Tracks agent runs and outputs

4. **Model Router**
   - Selects appropriate model based on:
     * Agent's model policy
     * Task complexity
     * Required capabilities (vision, tools, context size)
     * Cost constraints
   - Provides fallback models on failure
   - Tracks model performance

5. **Context Engine**
   - Builds relevant context for each agent
   - Filters based on:
     * Agent's context needs
     * Agent's authority level
     * Task requirements
   - Prioritizes and truncates if context too large
   - Includes locked decisions from higher authority

6. **Review Engine**
   - Multi-layer quality control
   - Automated checks (linting, type checking)
   - AI code review
   - Security review (conditional)
   - Architecture review (conditional)
   - Manages pass/fail/rework cycles

7. **Escalation Manager**
   - Detects when agent needs higher authority
   - Routes to appropriate higher-authority agent
   - Manages escalation resolution
   - Stores decisions as locked

8. **Event Bus**
   - Publishes state changes
   - Real-time updates to UI
   - Event persistence for replay

9. **Memory System** (Future - Phase 2)
   - Long-term knowledge storage
   - Pattern recognition
   - Failure memory
   - Semantic search

### Layer 2: 9Router (EXISTS - Integration Only)

**Responsibility**: AI model gateway

**What 9Router Provides**:
- ✅ Multi-provider support (100+ providers)
- ✅ Credential management (multiple accounts per provider)
- ✅ Format translation (OpenAI ↔ Claude ↔ Gemini)
- ✅ Token optimization (RTK, Headroom, etc.)
- ✅ Rate limit handling
- ✅ Account fallback on errors
- ✅ Usage tracking (tokens, cost, latency)
- ✅ Model capability detection

**What 9Router DOES NOT Provide**:
- ❌ State management
- ❌ Task orchestration
- ❌ Agent roles
- ❌ Context selection
- ❌ Review loops
- ❌ Dynamic model selection (combos are pre-configured)
- ❌ File system access
- ❌ Workflow management

**Orchestra Integration**:
```javascript
// Orchestra calls 9Router via HTTP API
const response = await fetch('http://localhost:20128/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ORCHESTRA_API_KEY}`
  },
  body: JSON.stringify({
    model: "anthropic/claude-3-5-sonnet",  // Selected by Model Router
    messages: buildMessages(agent, task, context),
    stream: false,
    tools: agent.requiresTools ? toolDefinitions : undefined
  })
});
```

### Layer 3: Antigravity (EXISTS - File-based Integration)

**Responsibility**: Code execution environment

**What Antigravity Provides**:
- ✅ File operations (read, write, edit)
- ✅ Command execution (build, test, lint)
- ✅ Git operations
- ✅ Codebase context
- ✅ Test runner

**Integration Strategy for MVP**:

**Option: File-based Communication**
```
Orchestra (Planning/Review)
    ↓
Write task files to shared directory
    ↓
Antigravity watches directory
    ↓
Executes tasks (apply code, run tests)
    ↓
Write results back to shared directory
    ↓
Orchestra validates and continues
```

**Shared directory structure**:
```
${sharedDir}/orchestra-workspace/
  tasks/
    pending/
      task-{uuid}.json
    in_progress/
      task-{uuid}.json
    completed/
      task-{uuid}.json
  artifacts/
    {task-id}/
      {file-path}.{ext}
      {file-path}.diff
  results/
    {task-id}.json
```

---

## 🔄 Complete Request Flow

### User Request → Mission Complete

```
USER: "Add JWT authentication"
    ↓
┌──────────────────────────────────────────────────────┐
│ 1. MISSION CREATION                                   │
│    Orchestrator parses intent                         │
│    Creates Mission object                             │
│    Status: PLANNING                                   │
└────────────┬─────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────┐
│ 2. STRATEGIST AGENT (Authority: 9)                   │
│    Model: Claude-3.5-Sonnet (premium)                │
│    Task: Analyze requirements                         │
│    Output: Requirements breakdown, scope, criteria    │
│    Decision: APPROVED                                 │
└────────────┬─────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────┐
│ 3. ARCHITECT AGENT (Authority: 8)                    │
│    Model: Claude-3.5-Sonnet (premium)                │
│    Task: Design system architecture                   │
│    Output:                                            │
│      - Authentication flow                            │
│      - Database schema (users, sessions)              │
│      - API endpoints                                  │
│      - Security considerations                        │
│    Decision: LOCKED (cannot be overridden)            │
└────────────┬─────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────┐
│ 4. PLANNER AGENT (Authority: 7)                      │
│    Model: GPT-4 (standard)                           │
│    Task: Break down implementation                    │
│    Output: Task breakdown                             │
│      - Task 1: Create user model                      │
│      - Task 2: Implement JWT generation               │
│      - Task 3: Create auth middleware                 │
│      - Task 4: Add login/logout endpoints             │
│      - Task 5: Write tests                            │
└────────────┬─────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────┐
│ 5. DEVELOPER AGENT (Authority: 4)                    │
│    Model: DeepSeek-Coder (budget)                    │
│    Task: Implement Task 1                             │
│    Context:                                           │
│      ✅ Architecture decisions (locked)               │
│      ✅ Task requirements                             │
│      ✅ Coding conventions                            │
│      ❌ Strategic discussion (not relevant)           │
│    Output: Code artifact                              │
└────────────┬─────────────────────────────────────────┘
             │
             ↓ (IF BLOCKED)
      ┌──────────────────┐
      │  ESCALATION      │
      │  to ARCHITECT    │
      └──────┬───────────┘
             │
             ↓
┌──────────────────────────────────────────────────────┐
│ 6. REVIEWER AGENT (Authority: 5)                     │
│    Model: GPT-4 (standard)                           │
│    Task: Code review                                  │
│    Checks:                                            │
│      ✅ Follows architecture                          │
│      ✅ Passes linting                                │
│      ✅ Meets acceptance criteria                     │
│      ❌ Missing edge cases                            │
│    Result: REWORK                                     │
└────────────┬─────────────────────────────────────────┘
             ↓
     (Developer fixes, re-review)
             ↓
┌──────────────────────────────────────────────────────┐
│ 7. TESTER AGENT (Authority: 2)                       │
│    Model: Gemini-Flash (budget)                      │
│    Task: Validate functionality                       │
│    Output: Test report                                │
│    Result: PASS                                       │
└────────────┬─────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────┐
│ 8. TECH LEAD (Authority: 9)                          │
│    Model: Claude-3.5-Sonnet (premium)                │
│    Task: Final approval                               │
│    Decision: APPROVED                                 │
└────────────┬─────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────┐
│ 9. APPLY TO ANTIGRAVITY                              │
│    Write artifacts to workspace                       │
│    Run tests                                          │
│    Commit if all pass                                 │
└────────────┬─────────────────────────────────────────┘
             ↓
        MISSION COMPLETED
```

---

## 🔐 Authority-Based Architecture

### Core Principle

**Lower authority CANNOT override higher authority decisions**

```
Developer (Authority: 4) attempts to change database schema
  ↓
Orchestra detects: Schema change requires Authority 8
  ↓
BLOCKED → Escalate to Architect
  ↓
Architect reviews and decides
  ↓
Decision stored as LOCKED
  ↓
Developer continues with approved design
```

### Authority Levels

```
Level 10: User (Final Authority)
Level 9:  Tech Lead / Strategist (Final decisions)
Level 8:  Architect (Major architectural decisions)
Level 7:  Senior Developer / Planner (Complex implementation)
Level 6:  Product Manager (Requirements)
Level 5:  Code Reviewer (Quality gate)
Level 4:  Developer (Standard implementation)
Level 3:  Junior Developer (Simple tasks)
Level 2:  Tester (Validation only)
Level 1:  Formatter (Mechanical tasks)
```

---

## 📊 Data Flow

### State Storage

```
PostgreSQL (Supabase)
  ├─ missions          # High-level goals
  ├─ decisions         # Locked architectural choices
  ├─ tasks             # Units of work
  ├─ agent_runs        # Execution records
  ├─ escalations       # Authority requests
  ├─ artifacts         # Code outputs
  ├─ reviews           # Quality checks
  ├─ events            # State changes
  └─ memory (future)   # Long-term knowledge
```

### Real-time Updates

```
State Change
    ↓
Event Bus publishes event
    ↓
PostgreSQL (persistence)
    ↓
WebSocket broadcast to UI
    ↓
UI updates in real-time
```

---

## 🎯 Design Principles

1. **Separation of Concerns**
   - Orchestra = Coordination
   - 9Router = AI Gateway
   - Antigravity = Execution

2. **Agent ≠ Model**
   - Agent = Role + Authority + Policy
   - Model = Selected dynamically per task

3. **Authority Enforcement**
   - Locked decisions cannot be overridden
   - Automatic escalation when needed

4. **Context Selectivity**
   - Each agent gets only relevant context
   - Reduces token usage and noise

5. **Multi-layer Quality**
   - Automated checks (free)
   - AI review (budget models)
   - Expert review (premium models, conditional)

6. **Cost Optimization**
   - Simple tasks → budget models
   - Complex tasks → premium models
   - Review complexity determines model tier

7. **Fail-safe Escalation**
   - Stuck agents escalate automatically
   - Repeated failures → higher authority
   - Max retry limits prevent infinite loops

---

## 📚 Related Documents

- **Agent System**: See `05-AGENT-SYSTEM.md`
- **Model Routing**: See `06-MODEL-ROUTING.md`
- **Task Orchestration**: See `07-TASK-ORCHESTRATION.md`
- **Escalation**: See `08-ESCALATION-SYSTEM.md`
- **Integration**: See `10-INTEGRATIONS.md`
- **9Router Deep Dive**: See Architecture Audit files in conversation `091957d7-40b9-4ca7-a454-b823706f1000`

---

**Status**: Architecture Complete - Ready for Implementation
