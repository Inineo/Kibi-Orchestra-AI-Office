# Quick Reference - AI Workforce Orchestra

**Last Updated**: 2026-10-05  
**Purpose**: Cheat sheet untuk quick lookup

---

## 📁 Documentation Map

| File | Purpose | When to Read |
|------|---------|--------------|
| `00-README.md` | Master index, status, quick start | First |
| `01-PROJECT-OVERVIEW.md` | Vision, concept, example workflow | Understanding what we're building |
| `02-ARCHITECTURE.md` | System design, layers, data flow | Understanding how it works |
| `03-TECH-STACK.md` | Technologies, tools, dependencies | Setting up environment |
| `04-DATABASE-SCHEMA.md` | Tables, relationships, Prisma schema | Database implementation |
| `05-AGENT-SYSTEM.md` | Agent roles, authority, capabilities | (TODO - reference 01 & 02 for now) |
| `06-MODEL-ROUTING.md` | Model selection algorithm | (TODO - reference 02 for now) |
| `07-TASK-ORCHESTRATION.md` | Workflow state machine | (TODO - reference 02 for now) |
| `08-ESCALATION-SYSTEM.md` | Escalation triggers, resolution | (TODO - reference 02 for now) |
| `09-REVIEW-SYSTEM.md` | Quality control layers | (TODO - reference 02 for now) |
| `10-INTEGRATIONS.md` | 9Router & Antigravity integration | Integration implementation |
| `11-API-SPECIFICATION.md` | REST API endpoints | (TODO - reference 13 for now) |
| `12-UI-DESIGN.md` | User interface specs | (Phase 2) |
| `13-IMPLEMENTATION-PLAN.md` | Phase-by-phase build plan | Starting implementation |
| `14-DECISIONS-LOG.md` | Why we made certain choices | Understanding decisions |
| `15-FAQ.md` | Common questions & troubleshooting | When stuck |
| `ARCHITECTURE_AUDIT_*.md` | Deep dive 9Router analysis | Technical reference |

---

## 🚀 Quick Start Commands

### Setup Project
```bash
# Clone or create project
mkdir ai-workforce-orchestra
cd ai-workforce-orchestra

# Initialize
pnpm init
pnpm add -D turbo

# Create structure
mkdir -p packages/{backend,frontend}
```

### Backend Setup
```bash
cd packages/backend
pnpm add express prisma @prisma/client cors helmet dotenv zod
pnpm add -D typescript tsx @types/node @types/express

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init
```

### Test 9Router
```bash
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

---

## 🗄️ Database Quick Reference

### Core Tables
```
missions      → High-level goals
decisions     → Locked architectural choices
tasks         → Units of work
agent_runs    → Agent execution records
escalations   → Authority requests
artifacts     → Code outputs
reviews       → Quality checks
events        → Real-time updates
```

### Common Queries
```sql
-- Get mission with all tasks
SELECT m.*, json_agg(t.*) as tasks
FROM missions m
LEFT JOIN tasks t ON t.mission_id = m.id
WHERE m.id = $1
GROUP BY m.id;

-- Get active tasks
SELECT * FROM tasks 
WHERE status IN ('pending', 'running', 'blocked')
ORDER BY created_at;

-- Get agent performance
SELECT 
  agent_role,
  COUNT(*) as runs,
  AVG(latency_ms) as avg_latency,
  SUM(cost) as total_cost
FROM agent_runs
GROUP BY agent_role;

-- Get escalations needing resolution
SELECT * FROM escalations
WHERE status = 'pending'
ORDER BY created_at;
```

---

## 🤖 Agent Authority Levels

```
10 → User (final authority)
9  → Tech Lead / Strategist
8  → Architect
7  → Senior Developer / Planner
6  → Product Manager
5  → Reviewer
4  → Developer
3  → Junior Developer
2  → Tester
1  → Formatter
```

**Rule**: Lower cannot override higher's locked decisions

---

## 💰 Model Selection Cheat Sheet

### Budget Tier (<$0.50/1M tokens)
- DeepSeek-Coder: $0.14/1M (coding)
- GPT-4o-mini: $0.15/1M (general)
- Gemini Flash: ~$0.10/1M (simple tasks)

### Standard Tier ($0.50-$2/1M)
- GPT-4o: ~$2.50/1M (balanced)
- Claude Haiku: ~$0.80/1M (fast)

### Premium Tier ($3+/1M)
- Claude-3.5-Sonnet: $3/1M (reasoning)
- GPT-4: $30/1M (legacy, avoid)
- o1-preview: $15/1M (deep reasoning)

**When to use**:
- Budget: Simple tasks, testing, validation
- Standard: Code review, planning
- Premium: Architecture, complex refactors, security

---

## 🔌 9Router Integration

### Call AI Model
```typescript
const response = await fetch('http://localhost:20128/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.NINEROUTER_API_KEY}`
  },
  body: JSON.stringify({
    model: 'anthropic/claude-3-5-sonnet',
    messages: [
      { role: 'system', content: 'You are...' },
      { role: 'user', content: 'Task...' }
    ],
    stream: false,
    temperature: 0.7
  })
});
```

### Model Format
```
"provider/model"           → anthropic/claude-3-5-sonnet
"alias"                    → gpt4 (defined in 9Router)
"combo"                    → office-team (fallback/fusion)
```

---

## 🔄 Task Status Flow

```
PENDING → ASSIGNED → RUNNING → REVIEW → APPROVED → COMPLETED
                         ↓         ↓
                      BLOCKED   REWORK
                         ↓         ↓
                    UNBLOCKED  (retry)
```

**Max retries**: 3 before escalation

---

## 🚨 Common Issues & Fixes

### 9Router 401 Error
```bash
# Check API key
echo $NINEROUTER_API_KEY

# Test connection
curl http://localhost:20128/health
```

### Database Connection Failed
```bash
# Test Prisma
npx prisma studio

# Check connection string
echo $DATABASE_URL

# Reset if needed
npx prisma migrate reset
```

### Task Stuck
```sql
-- Find stuck tasks
SELECT * FROM tasks 
WHERE status = 'running' 
  AND updated_at < NOW() - INTERVAL '10 minutes';

-- Check agent runs
SELECT * FROM agent_runs 
WHERE status = 'running' 
ORDER BY started_at DESC LIMIT 10;
```

---

## 📊 Cost Calculation

```typescript
// Formula
const cost = (promptTokens * inputPricePerMillion + 
              completionTokens * outputPricePerMillion) / 1_000_000;

// Example: Claude-3.5-Sonnet
// Input: 5000 tokens, Output: 1500 tokens
const cost = (5000 * 3 + 1500 * 15) / 1_000_000;
// = $0.0375
```

**Target**: Under $1 per feature (MVP)

---

## 🎯 MVP Scope

### ✅ Included
- 3 agent roles (Planner, Developer, Reviewer)
- Sequential task execution
- Basic escalation
- File-based Antigravity integration
- PostgreSQL state storage
- 9Router HTTP integration
- CLI interface
- Max 3 retries

### ❌ Not Included
- Dynamic model selection (fixed per role)
- Parallel execution
- Memory/learning
- Advanced context optimization
- UI dashboard
- Multi-mission support
- Cost prediction

---

## 📚 Key Concepts

### Agent ≠ Model
```
Agent = Role + Authority + Policy
Model = Selected dynamically per task
```

### Locked Decisions
```
Architect: "Use PostgreSQL" [LOCKED]
Developer: Cannot change to MongoDB
Developer: Must escalate if needs different DB
```

### Context Selectivity
```
Reviewer gets:
  ✅ Code diff
  ✅ Requirements
  ✅ Acceptance criteria
  ❌ Strategic planning discussion
```

---

## 🔧 Environment Variables

```bash
# Backend
DATABASE_URL="postgresql://..."
NINEROUTER_URL="http://localhost:20128"
NINEROUTER_API_KEY="sk-..."
ANTIGRAVITY_SHARED_DIR="/path/to/shared"
NODE_ENV="development"
PORT="3001"

# Frontend
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 📞 Emergency Contacts

**When really stuck**:
1. Re-read `15-FAQ.md`
2. Check `14-DECISIONS-LOG.md` for rationale
3. Search `ARCHITECTURE_AUDIT_*.md` for 9Router internals
4. Ask team with full context

**Before asking**:
- What did you try?
- What was expected?
- What actually happened?
- Relevant code/logs?

---

## 🎓 Learning Path

**First time? Read in order**:
1. `01-PROJECT-OVERVIEW.md` - Understand vision
2. `02-ARCHITECTURE.md` - System design
3. `14-DECISIONS-LOG.md` - Why decisions made
4. `13-IMPLEMENTATION-PLAN.md` - How to build

**Starting implementation?**
1. `13-IMPLEMENTATION-PLAN.md` - Follow phases
2. `04-DATABASE-SCHEMA.md` - Database setup
3. `10-INTEGRATIONS.md` - 9Router & Antigravity

**Understanding specific part?**
- Agents → `02-ARCHITECTURE.md` section N
- Models → `02-ARCHITECTURE.md` section O
- Tasks → `02-ARCHITECTURE.md` section R
- Escalation → `02-ARCHITECTURE.md` section S
- Review → `02-ARCHITECTURE.md` section T

---

## ✅ Pre-Implementation Checklist

Before coding:
- [ ] Read docs 00-15
- [ ] Understand architecture
- [ ] 9Router running (localhost:20128)
- [ ] Supabase account created
- [ ] Node.js 20+ installed
- [ ] pnpm installed
- [ ] VS Code ready
- [ ] Git initialized

---

## 🎯 Success Criteria (MVP)

**MVP complete when**:
- ✅ User creates mission via API
- ✅ Planner breaks into tasks
- ✅ Developer implements code
- ✅ Reviewer validates quality
- ✅ Artifacts applied to workspace
- ✅ All state in database
- ✅ End-to-end workflow works
- ✅ Cost under $1 per feature

---

**Need more details?** See full documentation files above.

**Status**: Quick Reference - Always keep this handy
