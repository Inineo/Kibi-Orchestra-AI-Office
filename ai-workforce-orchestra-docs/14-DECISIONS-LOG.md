# Decision Log - AI Workforce Orchestra

**Last Updated**: 2026-10-05  
**Purpose**: Record all critical architectural and technical decisions

---

## 📋 How to Use This Document

**When to add a decision**:
- ✅ Choosing between architectural approaches
- ✅ Selecting technologies or frameworks
- ✅ Defining system boundaries
- ✅ Establishing patterns or conventions
- ✅ Making trade-offs that affect future development

**Format**:
```markdown
### [ID] Decision Title
**Date**: YYYY-MM-DD
**Status**: Accepted | Rejected | Superseded | Proposed
**Context**: What is the issue we're facing?
**Decision**: What did we decide?
**Consequences**: What are the implications?
**Alternatives Considered**: What else did we look at?
```

---

## 🎯 Critical Decisions

### [DEC-001] Orchestra as Separate Layer, Not 9Router Extension

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
- 9Router is production-ready AI gateway with zero orchestration capabilities
- Need to coordinate multiple AI agents with state management
- Must integrate with both 9Router and Antigravity

**Decision**:
Build Orchestra as **independent orchestration layer** that uses 9Router via HTTP API, not as extension or modification of 9Router.

**Rationale**:
1. **Separation of Concerns**: 9Router = gateway, Orchestra = coordination
2. **No 9Router Modifications**: Keep 9Router pristine for easy updates
3. **Independent Deployment**: Can scale/update Orchestra without affecting 9Router
4. **Clear Boundary**: HTTP API is well-defined integration point

**Consequences**:
- ✅ Orchestra can use any AI gateway (not locked to 9Router)
- ✅ 9Router remains stable and updatable
- ✅ Clear system boundaries
- ❌ Extra network hop (negligible overhead)
- ❌ Can't access 9Router internals (fine, use HTTP API)

**Alternatives Considered**:
1. **Extend 9Router codebase** - Rejected: Too coupled, hard to maintain
2. **Fork 9Router** - Rejected: Maintenance nightmare
3. **9Router plugin system** - Rejected: Doesn't exist, would need to build

---

### [DEC-002] PostgreSQL via Supabase for State Storage

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Need persistent state storage for missions, tasks, decisions, with real-time updates to UI.

**Decision**:
Use **PostgreSQL via Supabase** (managed service with real-time subscriptions).

**Rationale**:
1. **ACID Transactions**: Critical for mission state consistency
2. **JSONB Support**: Flexible schema for agent outputs
3. **Real-time Built-in**: WebSocket subscriptions without separate infrastructure
4. **pgvector Ready**: Can add embeddings for Phase 2 memory system
5. **Production-grade from Day 1**: No migration from SQLite/MongoDB later
6. **Free Tier**: Sufficient for MVP development

**Consequences**:
- ✅ No separate WebSocket server needed
- ✅ Type-safe with Prisma ORM
- ✅ Can scale to millions of rows
- ✅ Can self-host later if needed
- ❌ Requires internet connection (can use local Postgres for dev)
- ❌ Vendor-specific features (but PostgreSQL underneath)

**Alternatives Considered**:
1. **MongoDB** - Rejected: No ACID, harder to query relationships
2. **SQLite** - Rejected: No concurrent writes, no real-time
3. **Redis** - Rejected: Not primary database, no complex queries
4. **AWS RDS** - Rejected: No built-in real-time, more complex setup

---

### [DEC-003] Agent ≠ Model (Dynamic Model Selection)

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Need cost-effective AI usage while maintaining quality. Complex tasks need premium models, simple tasks don't.

**Decision**:
Agents are **roles with policies**, not fixed models. **Model selected dynamically per task** based on complexity.

**Rationale**:
1. **Cost Optimization**: Simple task = cheap model, complex = premium
2. **Quality Appropriate**: Match model capability to task requirement
3. **Flexibility**: Can add new models without changing agent definitions
4. **Realistic**: Mimics real office (senior dev doesn't do simple tasks)

**Example**:
```typescript
Developer role:
  - Simple bug fix (complexity: 2) → DeepSeek-Coder ($0.14/1M)
  - Refactor auth system (complexity: 8) → Claude-3.5-Sonnet ($3/1M)
```

**Consequences**:
- ✅ 40-60% cost reduction vs always-premium
- ✅ Over-qualification penalty prevents waste
- ✅ Can optimize model selection over time
- ❌ More complex model selection logic
- ❌ Need task complexity estimation

**Alternatives Considered**:
1. **Fixed model per agent** - Rejected: Wastes money on simple tasks
2. **Always use cheapest** - Rejected: Poor quality on complex tasks
3. **User selects model** - Rejected: User shouldn't need to know models

---

### [DEC-004] Authority-Based Decision Enforcement

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Need to prevent AI agents from making conflicting architectural decisions or overriding each other chaotically.

**Decision**:
Implement **authority hierarchy (0-10)** where higher authority decisions are **locked** and cannot be overridden by lower authority agents.

**Rationale**:
1. **Consistency**: Once architect decides database schema, developers can't randomly change it
2. **Escalation**: When developer needs schema change, must escalate to architect
3. **Audit Trail**: Know who made which decisions at what authority level
4. **Realistic**: Mimics real software teams

**Example**:
```
Architect (8): "Use PostgreSQL with JSONB" [LOCKED]
Developer (4): Attempts to use MongoDB → BLOCKED → Escalate to Architect
```

**Consequences**:
- ✅ No conflicting decisions
- ✅ Clear escalation paths
- ✅ Architectural integrity maintained
- ❌ More complex workflow logic
- ❌ Could slow down in edge cases (rare)

**Alternatives Considered**:
1. **No authority system** - Rejected: Chaos, conflicting decisions
2. **Voting system** - Rejected: No tie-breaker, slow
3. **Human approval for all** - Rejected: Defeats automation purpose

---

### [DEC-005] File-based Antigravity Integration for MVP

**Date**: 2026-10-05  
**Status**: ✅ Accepted (MVP only)  
**Deciders**: Architecture Team

**Context**:
Antigravity's programmatic API is unknown. Need way to apply code artifacts to workspace.

**Decision**:
Use **file-based communication** for MVP: Orchestra writes task files, Antigravity (or watcher script) picks up and executes.

**Rationale**:
1. **Works Without API**: No dependency on undocumented API
2. **Simple**: Just filesystem operations
3. **Debuggable**: Can inspect files manually
4. **Upgradeable**: Can switch to API later without changing orchestration logic

**Consequences**:
- ✅ Can start implementation immediately
- ✅ No API documentation dependency
- ✅ Easy to debug
- ❌ Polling-based (not event-driven)
- ❌ File race conditions possible
- ❌ Not elegant

**Future**:
Replace with HTTP API when Antigravity API is documented/discovered.

**Alternatives Considered**:
1. **Wait for API docs** - Rejected: Blocks MVP
2. **IPC/sockets** - Rejected: More complex than files
3. **Direct Antigravity integration** - Rejected: Unknown how

---

### [DEC-006] Express.js over NestJS for Backend

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Need backend framework for Orchestra API.

**Decision**:
Use **Express.js** (simple, mature) over NestJS (opinionated, heavy).

**Rationale**:
1. **Simplicity**: Less boilerplate for MVP
2. **Flexibility**: No framework opinions
3. **Understanding**: Easier to see what's happening
4. **Sufficient**: Don't need enterprise patterns for MVP

**Consequences**:
- ✅ Faster MVP development
- ✅ Lighter bundle
- ✅ More control
- ❌ Less structure (must create our own)
- ❌ No built-in DI (not needed for MVP)

**Future**:
Can migrate to NestJS later if enterprise patterns needed.

**Alternatives Considered**:
1. **NestJS** - Rejected: Overkill for MVP
2. **Fastify** - Considered: Similar to Express, no strong reason to switch
3. **Next.js API routes only** - Rejected: Want separate backend service

---

### [DEC-007] Multi-Layer Review System

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
AI-generated code needs quality control, but can't review everything with premium models (cost).

**Decision**:
Implement **multi-layer review**:
1. Automated (free) - linting, type check
2. AI review (budget) - code quality, correctness
3. Security review (premium, conditional) - if auth/crypto code
4. Architecture review (premium, conditional) - if breaking changes

**Rationale**:
1. **Cost-effective**: Don't use premium models for simple checks
2. **Quality**: Still catch most issues
3. **Appropriate Depth**: Match review depth to code sensitivity

**Consequences**:
- ✅ 70-80% cost reduction in review vs always-premium
- ✅ Better quality than single-pass review
- ✅ Security-critical code gets extra scrutiny
- ❌ More complex review logic
- ❌ Multiple review passes (slower)

**Alternatives Considered**:
1. **Single AI reviewer** - Rejected: Either expensive or low quality
2. **No AI review** - Rejected: Misses subtle bugs
3. **Human review only** - Rejected: Defeats automation

---

### [DEC-008] Max 3 Retry Attempts Before Escalation

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Agents might fail repeatedly on same task (hallucination, misunderstanding).

**Decision**:
**Max 3 attempts** (initial + 2 retries) before automatic escalation to higher authority or human.

**Rationale**:
1. **Prevents Infinite Loops**: Stop wasting tokens on hopeless tasks
2. **Realistic**: After 3 failures, problem is deeper than agent can solve
3. **Cost Control**: 3 failures = escalation signal

**Consequences**:
- ✅ Prevents runaway costs
- ✅ Forces intervention on truly hard problems
- ✅ Simple rule
- ❌ Might escalate solvable problems (rare)

**Alternatives Considered**:
1. **Unlimited retries** - Rejected: Cost explosion
2. **Single attempt** - Rejected: Too aggressive, no recovery
3. **5 attempts** - Rejected: Too many wasted tokens

---

### [DEC-009] Context Selectivity (Not Full History)

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Sending full conversation history to every agent wastes tokens and adds noise.

**Decision**:
Each agent receives **only relevant context** based on:
- Agent's role and context needs
- Agent's authority (locked decisions only)
- Task requirements
- Current phase

**Example**:
```
Reviewer needs:
  ✅ Task requirements
  ✅ Acceptance criteria
  ✅ Code diff
  ❌ Strategic planning discussion (irrelevant)
```

**Consequences**:
- ✅ 30-50% token reduction
- ✅ Less noise for agent
- ✅ Faster responses (less to process)
- ❌ Must implement context selection logic
- ❌ Risk of missing relevant context (mitigated by explicit needs)

**Alternatives Considered**:
1. **Send everything** - Rejected: Wastes tokens, adds noise
2. **Manual context selection** - Rejected: Too much work
3. **AI context selection** - Considered: Phase 2 optimization

---

### [DEC-010] Prisma ORM over TypeORM

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Need type-safe database access with good TypeScript integration.

**Decision**:
Use **Prisma** over TypeORM or Sequelize.

**Rationale**:
1. **Best TypeScript DX**: Auto-generated types
2. **Schema-first**: Easy to understand and modify
3. **Migration System**: Excellent migration workflow
4. **Type Safety**: Catch errors at compile time
5. **Performance**: Connection pooling, prepared statements

**Consequences**:
- ✅ Excellent developer experience
- ✅ Type-safe queries
- ✅ Clear schema definition
- ❌ Less flexible than raw SQL (acceptable trade-off)
- ❌ Learning curve (but well-documented)

**Alternatives Considered**:
1. **TypeORM** - Rejected: Decorator-heavy, complex
2. **Sequelize** - Rejected: Weaker TypeScript support
3. **Drizzle** - Considered: Good but less mature
4. **Raw SQL** - Rejected: No type safety

---

### [DEC-011] No Memory System in MVP

**Date**: 2026-10-05  
**Status**: ✅ Accepted  
**Deciders**: Architecture Team

**Context**:
Long-term memory and learning would be valuable but adds significant complexity.

**Decision**:
**Defer memory system to Phase 2**. MVP is stateless per mission.

**Rationale**:
1. **Complexity**: Memory requires embeddings, semantic search, relevance scoring
2. **Value**: Can prove concept without memory
3. **Database Ready**: pgvector extension can be enabled later
4. **Focus**: Ship working orchestration first

**Consequences**:
- ✅ Faster MVP delivery
- ✅ Simpler architecture
- ✅ Can add later without major refactor
- ❌ No learning from past missions
- ❌ Repeated mistakes possible

**Future**:
Phase 2 will add memory table with pgvector for semantic search.

**Alternatives Considered**:
1. **Include in MVP** - Rejected: Adds 2-3 weeks
2. **Simple file-based memory** - Rejected: Not scalable
3. **Never add memory** - Rejected: Limits long-term value

---

### [DEC-012] Sequential Task Execution for MVP

**Date**: 2026-10-05  
**Status**: ✅ Accepted (MVP only)  
**Deciders**: Architecture Team

**Context**:
Parallel task execution could speed up workflows but adds complexity.

**Decision**:
MVP executes tasks **sequentially** (one at a time per mission).

**Rationale**:
1. **Simplicity**: No concurrency issues
2. **Safe**: No file conflicts in workspace
3. **Debuggable**: Clear linear flow
4. **Sufficient**: Prove orchestration logic first

**Consequences**:
- ✅ Much simpler state machine
- ✅ No race conditions
- ✅ Easy to debug
- ❌ Slower (not critical for MVP)
- ❌ Can't parallelize independent tasks

**Future**:
Phase 2 will add task dependency graph and parallel execution.

**Alternatives Considered**:
1. **Parallel from start** - Rejected: Too complex for MVP
2. **Never parallelize** - Rejected: Would be slow at scale

---

## 📊 Decision Summary Table

| ID | Decision | Status | Impact |
|----|----------|--------|--------|
| DEC-001 | Orchestra as separate layer | ✅ Accepted | High - System architecture |
| DEC-002 | PostgreSQL via Supabase | ✅ Accepted | High - Data persistence |
| DEC-003 | Agent ≠ Model | ✅ Accepted | High - Cost optimization |
| DEC-004 | Authority hierarchy | ✅ Accepted | High - Decision consistency |
| DEC-005 | File-based Antigravity (MVP) | ✅ Accepted | Medium - Integration |
| DEC-006 | Express.js over NestJS | ✅ Accepted | Medium - Development speed |
| DEC-007 | Multi-layer review | ✅ Accepted | High - Quality + Cost |
| DEC-008 | Max 3 retries | ✅ Accepted | Medium - Cost control |
| DEC-009 | Context selectivity | ✅ Accepted | Medium - Token efficiency |
| DEC-010 | Prisma ORM | ✅ Accepted | Medium - DX |
| DEC-011 | No memory in MVP | ✅ Accepted | Low - Defer complexity |
| DEC-012 | Sequential execution (MVP) | ✅ Accepted | Low - Simplicity |

---

## 🔮 Open Questions

### [Q-001] Antigravity API Discovery
**Status**: 🔍 Investigating  
**Question**: Does Antigravity have HTTP API or must we use file-based?  
**Impact**: Integration elegance  
**Next Steps**: Check Antigravity documentation, test endpoints

### [Q-002] Model Performance Tracking
**Status**: 💭 To Decide  
**Question**: Should we track model performance (success rate, latency) for better selection?  
**Impact**: Model selection quality over time  
**Proposal**: Phase 2 feature

### [Q-003] Cost Budget Enforcement
**Status**: 💭 To Decide  
**Question**: Should Orchestra enforce per-mission cost budgets?  
**Impact**: Cost control  
**Proposal**: Phase 2 feature (pre-flight cost estimation)

---

## 📚 Related Documents

- **Architecture**: See `02-ARCHITECTURE.md`
- **Tech Stack**: See `03-TECH-STACK.md`
- **Implementation Plan**: See `13-IMPLEMENTATION-PLAN.md`

---

**Status**: Living Document - Update when making new decisions
