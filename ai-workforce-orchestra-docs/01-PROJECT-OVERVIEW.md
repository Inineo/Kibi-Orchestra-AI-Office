# Project Overview - AI Workforce Orchestra

---

## 🎯 Vision

Membangun sistem **AI Workforce Orchestration** yang mensimulasikan kantor virtual di mana berbagai AI agents bekerja berdasarkan **role** dan **authority** mereka, bukan hanya sebagai model AI yang dipanggil.

**Bukan**: Chatbot multi-agent  
**Adalah**: Complete AI workforce coordination system dengan hierarchy, escalation, review loops, dan decision tracking

---

## 🏢 Konsep "Virtual Office"

### Analogi Kantor Nyata

Dalam kantor software development:
- **Strategist/PM** → Menganalisis requirements, membuat keputusan bisnis
- **Architect** → Design system, database, API contracts
- **Senior Developer** → Implementasi fitur kompleks
- **Developer** → Coding standard features
- **Reviewer** → Code review, quality check
- **Tester** → Testing dan validation
- **Tech Lead** → Final decision maker

### Orchestra Implementation

Agent dalam Orchestra memiliki:
- **Role** (job description)
- **Authority Level** (0-10, menentukan keputusan apa yang bisa diambil)
- **Capabilities** (apa yang bisa dikerjakan)
- **Model Policy** (kriteria model yang digunakan)
- **Output Format** (structured response)

**Key Principle**: **Agent ≠ Model**

```
Agent (Role + Authority + Policy)
   ↓
Select Model Dynamically (based on task complexity)
   ↓
Execute via 9Router
   ↓
Validate Result
   ↓
Pass to Next Agent or Escalate
```

---

## 🎭 Skenario Contoh

### User Request:
> "Tambahkan fitur authentication dengan JWT"

### Orchestra Workflow:

```
1. STRATEGIST (Authority: 9)
   Model: Claude-3.5-Sonnet (premium reasoning)
   Task: Analyze requirements
   Output: Requirements breakdown, acceptance criteria
   Decision: Approve scope
   
2. ARCHITECT (Authority: 8)
   Model: Claude-3.5-Sonnet (premium reasoning)
   Task: Design architecture
   Output: 
   - Authentication flow diagram
   - Database schema (users, sessions, refresh_tokens)
   - API endpoints design
   - Security considerations
   Decision: LOCKED (architecture decisions cannot be changed by lower authority)
   
3. PLANNER (Authority: 7)
   Model: GPT-4 (standard reasoning)
   Task: Break down implementation
   Output:
   - Task 1: Create user model and migration
   - Task 2: Implement JWT generation
   - Task 3: Create auth middleware
   - Task 4: Add login/logout endpoints
   - Task 5: Write tests
   
4. DEVELOPER (Authority: 4)
   Model: DeepSeek-Coder (budget, coding-focused)
   Task: Implement Task 1 - Create user model
   Output: Code artifact (user.model.ts, migration.sql)
   
   ⚠️ BLOCKED: Developer realizes schema needs changes
   → Escalate to ARCHITECT
   
5. ARCHITECT (Escalation)
   Model: Claude-3.5-Sonnet
   Task: Review schema change request
   Decision: APPROVED with modifications
   Output: Updated schema design (LOCKED)
   
6. DEVELOPER (Unblocked)
   Model: DeepSeek-Coder
   Task: Implement with approved schema
   Output: Updated code artifact
   
7. REVIEWER (Authority: 5)
   Model: GPT-4 (standard reasoning)
   Task: Code review
   Checks:
   - ✅ Follows architecture decisions
   - ✅ Passes linting
   - ✅ Meets acceptance criteria
   - ❌ Missing edge case handling
   Result: REWORK
   
8. DEVELOPER (Rework)
   Model: DeepSeek-Coder
   Task: Fix edge cases
   Output: Updated artifact
   
9. REVIEWER (Re-review)
   Result: PASS
   
10. TESTER (Authority: 2)
    Model: Gemini-Flash (budget)
    Task: Validate functionality
    Output: Test report
    Result: PASS
    
11. TECH LEAD (Authority: 9)
    Model: Claude-3.5-Sonnet
    Task: Final approval
    Decision: APPROVED
    
12. APPLY TO ANTIGRAVITY
    Artifacts written to workspace
    Mission COMPLETED
```

---

## 🔄 Core Principles

### 1. Authority-Based Decision Making

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

### 2. Dynamic Model Selection

**Model chosen based on task complexity, not fixed per role**

```javascript
Task: "Add login button" (Simple)
  ↓
Developer role
  ↓
Task complexity: 2/10
  ↓
Model selected: DeepSeek-Coder ($0.14/1M) ✅

Task: "Refactor auth system for OAuth" (Complex)
  ↓
Developer role
  ↓
Task complexity: 8/10
  ↓
Model selected: Claude-3.5-Sonnet ($3/1M) ✅
```

### 3. Context Selectivity

**Each agent only receives relevant context**

```
Planner needs:
  ✅ Mission goal
  ✅ Requirements
  ✅ Architecture decisions
  ❌ Previous code implementations (not relevant)

Developer needs:
  ✅ Current task
  ✅ Architecture decisions (locked)
  ✅ Relevant files
  ✅ Coding conventions
  ❌ Business requirements discussion (already decided)

Reviewer needs:
  ✅ Task requirements
  ✅ Acceptance criteria
  ✅ Architecture decisions
  ✅ Code diff
  ❌ Planning discussion (not relevant)
```

### 4. Structured Communication

**Agents communicate via structured state, not free-form chat**

```
❌ Agent A: "I think we should use PostgreSQL"
   Agent B: "I disagree, MongoDB is better"

✅ Architect creates Decision object:
   {
     decision: "Use PostgreSQL",
     rationale: "ACID transactions needed for payments",
     locked: true,
     authority: 8
   }
   
   Developer receives this as locked context
   Developer cannot debate, only implement
```

### 5. Feedback Loops

**Plan → Execute → Test → Review → Pass/Rework/Escalate**

```
Execute
  ↓
Test (automated)
  ↓
Review (AI reviewer)
  ↓
Decision:
  - PASS → Continue
  - REWORK → Back to Execute (max 3 times)
  - ESCALATE → Higher authority intervention
```

---

## 🎯 Goals

### Primary Goals

1. **Reduce AI cost** - Use cheap models for simple tasks, premium for complex
2. **Maintain quality** - Multi-layer review, architecture enforcement
3. **Prevent chaos** - Authority hierarchy, locked decisions
4. **Enable scale** - Parallel execution, state management
5. **Transparency** - Real-time UI showing what each agent is doing

### Non-Goals (MVP)

- ❌ Replace human developers completely
- ❌ Handle all possible edge cases
- ❌ AGI or self-learning system
- ❌ Support every programming language
- ❌ Production deployment without human oversight

---

## 🏗️ System Components

### Orchestra Layer (NEW - Must Build)

```
Orchestrator
├─ Mission Manager      # High-level goal tracking
├─ Task Manager         # Break down and track units of work
├─ Agent Manager        # Role assignment, execution
├─ Model Router         # Dynamic model selection
├─ Context Engine       # Build relevant context per agent
├─ Review Engine        # Multi-layer quality control
├─ Escalation Manager   # Authority-based escalation
├─ Memory System        # Long-term knowledge (future)
└─ Event Bus           # Real-time updates
```

### Integration Layers

```
9Router (EXISTS - Use via HTTP)
├─ Multi-provider gateway
├─ Format translation
├─ Token optimization
├─ Rate limit handling
└─ Usage tracking

Antigravity (EXISTS - File-based integration)
├─ File operations
├─ Command execution
├─ Test runner
├─ Git operations
└─ Codebase context
```

---

## 📊 Success Metrics (MVP)

### Functional Metrics
- ✅ End-to-end workflow completes without manual intervention
- ✅ Escalation system works (lower authority blocked → higher authority resolves)
- ✅ Review loops work (fail → rework → pass)
- ✅ Artifacts correctly applied to workspace
- ✅ Real-time UI reflects agent status

### Quality Metrics
- ✅ 80%+ of simple tasks use budget models (<$0.5/1M tokens)
- ✅ Complex tasks automatically escalate to premium models
- ✅ Architecture decisions enforced (no violations)
- ✅ Code review catches 90%+ of obvious errors

### Cost Metrics
- ✅ Average cost per feature <$1
- ✅ Model selection reduces cost by 40%+ vs always-premium
- ✅ Rework loops <3 iterations average

---

## 🚫 Out of Scope (MVP)

- ❌ Memory/learning system (Phase 2)
- ❌ Parallel task execution (Phase 2)
- ❌ Multi-mission support (Phase 2)
- ❌ Custom workflow templates (Phase 2)
- ❌ User authentication (single-user MVP)
- ❌ Advanced context optimization (Phase 2)
- ❌ Cost prediction engine (Phase 2)
- ❌ A/B testing workflows (Phase 3)
- ❌ Production deployment (Phase 3)

---

## 🎨 UI Concept

### Office Simulator

**Real-time visualization** of AI agents working:

```
┌────────────────────────────────────────────┐
│  AI Workforce Orchestra - Live View        │
├────────────────────────────────────────────┤
│                                            │
│  [Desk: Strategist]    [Desk: Architect]  │
│     💭 Planning            ⚡ Designing    │
│     Claude-3.5-Sonnet     Claude-3.5      │
│                                            │
│  [Desk: Dev]           [Desk: Reviewer]   │
│     💻 Coding              😴 Idle         │
│     DeepSeek-Coder        -               │
│                                            │
│  Task Board:                               │
│  PENDING(3) RUNNING(2) REVIEW(1) DONE(5)  │
│                                            │
│  Event Stream:                             │
│  ▶ Task-123 assigned to Developer         │
│  ▶ Developer executing with DeepSeek...   │
│  ▶ Artifact created: auth.ts              │
│  ▶ Review started...                      │
└────────────────────────────────────────────┘
```

---

## 📚 Related Documents

- **Architecture**: See `02-ARCHITECTURE.md`
- **Tech Stack**: See `03-TECH-STACK.md`
- **Agent System**: See `05-AGENT-SYSTEM.md`
- **Implementation Plan**: See `13-IMPLEMENTATION-PLAN.md`

---

**Last Updated**: 2026-10-05  
**Status**: Architecture Complete - Ready for Implementation
