# FAQ - AI Workforce Orchestra

**Last Updated**: 2026-10-05  
**Purpose**: Common questions and answers

---

## 🎯 General Questions

### Q: Apa itu AI Workforce Orchestra?

**A**: Sistem orchestration yang mensimulasikan "kantor virtual" di mana berbagai AI agents bekerja berdasarkan **role** dan **authority**, bukan hanya sebagai chatbot multi-agent. Orchestra mengkoordinasikan planning, coding, review, dan escalation untuk menyelesaikan software development tasks secara otomatis.

---

### Q: Apa bedanya dengan sistem multi-agent lain?

**A**: Perbedaan utama:
1. **Agent ≠ Model**: Agent adalah role dengan authority, model dipilih dinamis per task
2. **Authority Hierarchy**: Lower authority tidak bisa override higher authority
3. **Locked Decisions**: Architectural decisions dikunci, tidak bisa diubah sembarangan
4. **Escalation System**: Otomatis escalate ke higher authority saat stuck
5. **Cost Optimization**: Simple task = cheap model, complex = premium model

---

### Q: Apakah Orchestra menggantikan developer?

**A**: **Tidak**. Orchestra adalah tool untuk:
- Mengotomasi task repetitif
- Mempercepat development
- Maintain consistency
- Reduce manual coordination overhead

Developer tetap needed untuk:
- Define requirements
- Make strategic decisions
- Review critical changes
- Handle edge cases
- Production deployment

---

## 🏗️ Architecture Questions

### Q: Kenapa tidak langsung extend 9Router?

**A**: Karena:
1. **Separation of Concerns**: 9Router = AI gateway, Orchestra = coordination
2. **No Modifications**: Keep 9Router pristine for updates
3. **Clear Boundary**: HTTP API is clean integration point
4. **Flexibility**: Can replace 9Router if needed

Lihat: `14-DECISIONS-LOG.md` [DEC-001]

---

### Q: Kenapa pakai PostgreSQL bukan MongoDB?

**A**: Karena:
1. **ACID Transactions**: Mission state consistency critical
2. **Relational**: Task dependencies, agent hierarchies are relational
3. **JSONB**: Still flexible for agent outputs
4. **pgvector**: Ready for Phase 2 memory system
5. **Production-grade**: No migration needed later

Lihat: `14-DECISIONS-LOG.md` [DEC-002]

---

### Q: Kenapa state disimpan di Orchestra bukan di 9Router?

**A**: Karena 9Router **stateless** by design:
- Every request independent
- No conversation memory
- No task tracking
- No workflow coordination

Orchestra provides state layer on top of 9Router.

---

### Q: Bagaimana Orchestra berinteraksi dengan Antigravity?

**A**: **MVP**: File-based communication
- Orchestra writes task files to shared directory
- Antigravity (or watcher) picks up and executes
- Results written back to shared directory

**Future**: HTTP API (if Antigravity exposes one)

Lihat: `10-INTEGRATIONS.md`

---

## 🤖 Agent & Model Questions

### Q: Berapa banyak agent role?

**A**: **MVP**: 3 roles
- Planner (breaks down tasks)
- Developer (writes code)
- Reviewer (checks quality)

**Future**: 10+ roles (Architect, Strategist, Tester, Security Reviewer, etc.)

---

### Q: Bagaimana model dipilih untuk agent?

**A**: Dynamic selection based on:
1. **Agent's model policy** (budget/standard/premium tier allowed)
2. **Task complexity** (1-10 scale)
3. **Required capabilities** (vision, tools, context size)
4. **Cost constraints** (over-qualification penalty)

Example:
- Developer + simple bug fix (complexity: 2) → DeepSeek-Coder ($0.14/1M)
- Developer + complex refactor (complexity: 8) → Claude-3.5-Sonnet ($3/1M)

Lihat: `06-MODEL-ROUTING.md`

---

### Q: Apa itu "authority level"?

**A**: Authority (0-10) menentukan keputusan apa yang bisa diambil agent:

```
Level 10: User (final authority)
Level 9:  Tech Lead (all decisions)
Level 8:  Architect (architecture, schema)
Level 7:  Planner (task breakdown)
Level 4:  Developer (standard coding)
Level 2:  Tester (validation only)
```

Lower authority **tidak bisa** override higher authority decisions.

---

### Q: Apa yang terjadi saat developer butuh ubah architecture?

**A**: **Escalation flow**:
1. Developer attempts schema change
2. Orchestra detects: requires Authority 8
3. Task BLOCKED
4. Escalation created → routed to Architect
5. Architect reviews and decides (approve/reject/modify)
6. Decision LOCKED
7. Developer continues with approved design

Lihat: `08-ESCALATION-SYSTEM.md`

---

## 💰 Cost Questions

### Q: Berapa biaya per feature?

**A**: **Target**: Under $1 per average feature (MVP)

Breakdown:
- Planning: $0.10-0.20 (GPT-4o-mini)
- Implementation: $0.20-0.40 (DeepSeek-Coder)
- Review: $0.10-0.20 (GPT-4o-mini)
- Escalations: $0.10-0.30 (conditional, premium)

**Cost optimization**:
- Simple tasks use budget models
- Complex tasks use premium models
- Multi-layer review (automated → AI → expert)

---

### Q: Bagaimana mencegah cost explosion?

**A**: Built-in safeguards:
1. **Max retry limit**: 3 attempts max per task
2. **Model selection**: Appropriate model for complexity
3. **Context optimization**: Only relevant context sent
4. **Review layers**: Automated first, AI second
5. **Over-qualification penalty**: Don't use premium for simple tasks

Future: Pre-flight cost estimation and budget enforcement.

---

## 🔧 Implementation Questions

### Q: Berapa lama build MVP?

**A**: **5-6 weeks** dengan phased approach:
- Week 1-2: Foundation (database, API, 9Router integration)
- Week 3: Agent system (planner → developer → reviewer)
- Week 4: Review & escalation
- Week 5: Antigravity integration
- Week 6+: Polish & iteration

Lihat: `13-IMPLEMENTATION-PLAN.md`

---

### Q: Tech stack apa yang digunakan?

**A**:
- **Backend**: Node.js + TypeScript + Express + Prisma
- **Database**: PostgreSQL via Supabase
- **Frontend**: Next.js + React + Tailwind
- **Integration**: 9Router (HTTP) + Antigravity (file-based)

Lihat: `03-TECH-STACK.md`

---

### Q: Apakah perlu modify 9Router code?

**A**: **TIDAK**. Orchestra uses 9Router as-is via HTTP API.

9Router remains:
- ✅ Pristine (no modifications)
- ✅ Updatable (get latest features)
- ✅ Stable (don't break working system)

---

### Q: Apakah bisa pakai AI gateway lain (bukan 9Router)?

**A**: **Ya**, karena Orchestra hanya butuh OpenAI-compatible API:
- Can use OpenRouter
- Can use direct OpenAI/Anthropic
- Can use LiteLLM
- Can use any gateway with `/v1/chat/completions`

9Router dipilih karena:
- Already installed locally
- Multi-provider with fallback
- Token optimization built-in
- Rate limit handling

---

### Q: Dimana mulai coding?

**A**: **JANGAN coding dulu!**

Checklist before coding:
- [ ] Read ALL documentation (01-15)
- [ ] Understand architecture completely
- [ ] Verify 9Router running (localhost:20128)
- [ ] Create Supabase account
- [ ] Setup development environment
- [ ] Answer open questions

**Then**: Follow `13-IMPLEMENTATION-PLAN.md` Phase 1

---

## 🚨 Troubleshooting

### Q: 9Router returns 401 Unauthorized

**A**: Check:
1. Is 9Router running? `http://localhost:20128`
2. Is API key correct in `.env`?
3. Is API key created in 9Router UI?

```bash
# Test 9Router
curl http://localhost:20128/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"test"}]}'
```

---

### Q: Database connection fails

**A**: Check:
1. Is `DATABASE_URL` correct in `.env`?
2. Is Supabase project running?
3. Is IP whitelisted in Supabase? (or allow all for dev)
4. Run `npx prisma db push` to sync schema

```bash
# Test connection
npx prisma studio  # Opens database browser
```

---

### Q: Agent returns gibberish atau hallucination

**A**: Possible causes:
1. **Prompt too vague** → Add more context
2. **Wrong model** → Use higher capability model
3. **Context too large** → Truncate/prioritize context
4. **Temperature too high** → Lower to 0.3-0.5

Fix:
- Check agent's system prompt clarity
- Verify context includes requirements
- Add examples to prompt
- Try different model

---

### Q: Task stuck in "running" forever

**A**: Possible causes:
1. **Model timeout** → Increase timeout or use faster model
2. **9Router provider down** → Check 9Router logs
3. **Antigravity not watching** → Check watcher script running
4. **File permissions** → Check shared directory accessible

Debug:
```sql
-- Check stuck tasks
SELECT * FROM tasks WHERE status = 'running' AND updated_at < NOW() - INTERVAL '10 minutes';

-- Check agent runs
SELECT * FROM agent_runs WHERE status = 'running' ORDER BY started_at DESC;
```

---

### Q: Review loops infinitely

**A**: Should NOT happen (max 3 retries enforced).

If it does:
1. Check `retry_count` in database
2. Verify escalation triggers after 3 failures
3. Check reviewer prompt - is it too strict?
4. Check developer context - does it include review feedback?

---

### Q: Cost higher than expected

**A**: Debug:
1. Check which models used:
```sql
SELECT model_used, COUNT(*), SUM(cost) 
FROM agent_runs 
GROUP BY model_used 
ORDER BY SUM(cost) DESC;
```

2. Check retry counts:
```sql
SELECT AVG(retry_count) FROM tasks WHERE status = 'completed';
```

3. Check context sizes:
```sql
SELECT AVG(prompt_tokens) FROM agent_runs;
```

Optimize:
- Reduce context for simple tasks
- Use cheaper models where appropriate
- Fix prompts causing retries

---

## 🔮 Future Features

### Q: Kapan parallel task execution?

**A**: **Phase 2** (setelah MVP validated)

MVP: Sequential (simpler, safer)  
Phase 2: Parallel with dependency graph

---

### Q: Kapan memory/learning system?

**A**: **Phase 2**

Requirements:
- pgvector extension
- Embedding generation
- Semantic search
- Relevance scoring

Not critical for MVP validation.

---

### Q: Kapan multi-mission support?

**A**: **Phase 2**

MVP: One mission at a time  
Phase 2: Multiple concurrent missions

---

### Q: Apakah akan ada UI?

**A**: 
- **MVP**: CLI + API only
- **Phase 2**: Simple monitoring UI
- **Phase 3**: Full office simulator UI with real-time visualization

---

## 📚 Where to Learn More

| Topic | Document |
|-------|----------|
| **Big Picture** | `01-PROJECT-OVERVIEW.md` |
| **System Design** | `02-ARCHITECTURE.md` |
| **Technologies** | `03-TECH-STACK.md` |
| **Database** | `04-DATABASE-SCHEMA.md` |
| **Agents** | `05-AGENT-SYSTEM.md` |
| **Model Selection** | `06-MODEL-ROUTING.md` |
| **Workflow** | `07-TASK-ORCHESTRATION.md` |
| **Escalation** | `08-ESCALATION-SYSTEM.md` |
| **Quality Control** | `09-REVIEW-SYSTEM.md` |
| **9Router & Antigravity** | `10-INTEGRATIONS.md` |
| **APIs** | `11-API-SPECIFICATION.md` |
| **Why Decisions Made** | `14-DECISIONS-LOG.md` |
| **How to Build** | `13-IMPLEMENTATION-PLAN.md` |
| **9Router Deep Dive** | `ARCHITECTURE_AUDIT_PART1-4.md` |

---

## 🤝 Contributing

### Q: Bagaimana cara contribute?

**A**: 
1. Read all documentation
2. Follow implementation plan
3. Keep code aligned with architecture
4. Update documentation when making decisions
5. Test thoroughly before PR

---

### Q: Boleh deviate dari architecture?

**A**: **Ya, tapi**:
1. Must have good reason
2. Document in `14-DECISIONS-LOG.md`
3. Update affected documentation
4. Discuss with team first

Architecture is guide, not prison. But changes should be intentional, not accidental.

---

## 💬 Getting Help

**If stuck**:
1. Re-read relevant documentation
2. Check this FAQ
3. Check `14-DECISIONS-LOG.md` for context
4. Search 9Router audit files for technical details
5. Ask in team chat with context

**Good question format**:
```
Problem: [what's not working]
Expected: [what should happen]
Actual: [what actually happens]
Tried: [what you already tried]
Context: [relevant code/logs]
```

---

**Status**: Living Document - Add questions as they arise
