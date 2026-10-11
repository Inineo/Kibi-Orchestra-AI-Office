# Tech Stack - AI Workforce Orchestra

**Last Updated**: 2026-10-05  
**Status**: Architecture Complete - Pre-Implementation

---

## 🎯 Technology Selection Principles

1. **Production-ready from day 1** - No migration hell
2. **TypeScript throughout** - Type safety across stack
3. **Real-time capable** - Live updates essential
4. **Scalable** - MVP to production without rewrite
5. **Developer-friendly** - Good DX, clear documentation
6. **Cost-effective** - Free tier for MVP, affordable scale

---

## 📦 Core Stack

### Backend

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Runtime** | Node.js | 20.x LTS | Industry standard, excellent async I/O |
| **Language** | TypeScript | 5.x | Type safety, better refactoring |
| **Framework** | Express.js | 4.x | Lightweight, flexible, battle-tested |
| **Database** | PostgreSQL | 15+ | ACID, JSON support, pgvector ready |
| **ORM** | Prisma | 5.x | Type-safe queries, excellent DX |
| **Hosting** | Supabase | - | Managed Postgres + real-time + auth |

**Why Express over NestJS/Fastify?**
- Simpler for MVP
- Less boilerplate
- Easier to understand flow
- Can migrate later if needed

**Why Prisma over TypeORM/Sequelize?**
- Best TypeScript integration
- Schema-first approach
- Excellent migration system
- Auto-generated types

**Why Supabase over AWS RDS?**
- Real-time subscriptions built-in (critical for UI)
- Free tier sufficient for MVP
- PostgreSQL-based (not vendor lock-in)
- REST API auto-generated
- Can self-host later if needed

---

### Frontend

| Component | Technology | Version | Rationale |
|-----------|-----------|---------|-----------|
| **Framework** | Next.js | 14.x | React + SSR + API routes |
| **Language** | TypeScript | 5.x | Type safety |
| **UI Library** | React | 18.x | Component model |
| **Styling** | Tailwind CSS | 3.x | Rapid prototyping |
| **State** | Zustand | 4.x | Simple, performant |
| **Real-time** | Supabase Realtime | - | WebSocket subscriptions |
| **UI Components** | shadcn/ui | - | Accessible, customizable |

**Why Next.js over Vite/Create React App?**
- API routes (backend + frontend in one repo)
- SSR for better performance
- File-based routing
- Production-ready

**Why Zustand over Redux/Recoil?**
- Simpler API
- Less boilerplate
- Excellent TypeScript support
- Sufficient for our needs

**Why shadcn/ui over Material-UI/Ant Design?**
- Copy-paste components (no heavy dependency)
- Tailwind-based (consistent with our choice)
- Accessible by default
- Highly customizable

---

### Integration Layer

| Component | Technology | Access Method | Rationale |
|-----------|-----------|---------------|-----------|
| **9Router** | Existing system | HTTP API (localhost:20128) | Multi-provider AI gateway |
| **Antigravity** | Existing system | File-based (MVP) | Code execution environment |

**9Router Integration**:
```typescript
// HTTP client to 9Router
const response = await fetch('http://localhost:20128/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.ORCHESTRA_API_KEY}`
  },
  body: JSON.stringify({
    model: selectedModel,
    messages: contextMessages,
    stream: false
  })
});
```

**Antigravity Integration** (MVP - File-based):
```typescript
// Write task to shared directory
await fs.writeFile(
  `${SHARED_DIR}/tasks/pending/${taskId}.json`,
  JSON.stringify(task)
);

// Watch for completion
const watcher = fs.watch(`${SHARED_DIR}/results/`);
```

---

## 🛠️ Development Tools

### Required

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Node.js** | Runtime | `nvm install 20` |
| **pnpm** | Package manager | `npm install -g pnpm` |
| **Docker** | Local Postgres (optional) | Docker Desktop |
| **VS Code** | IDE | With TypeScript, Prisma extensions |

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 📚 Libraries & Utilities

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.0",
    "prisma": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "zod": "^3.22.0",           // Input validation
    "uuid": "^9.0.0",           // ID generation
    "date-fns": "^2.30.0",      // Date handling
    "ws": "^8.14.0",            // WebSocket server
    "cors": "^2.8.5",           // CORS middleware
    "helmet": "^7.0.0",         // Security headers
    "dotenv": "^16.3.0"         // Environment variables
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/node": "^20.8.0",
    "@types/express": "^4.17.0",
    "tsx": "^3.14.0",           // TypeScript executor
    "vitest": "^0.34.0",        // Testing
    "eslint": "^8.50.0",
    "prettier": "^3.0.0"
  }
}
```

### Frontend Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.4.0",
    "@supabase/supabase-js": "^2.38.0",
    "tailwindcss": "^3.3.0",
    "lucide-react": "^0.292.0",  // Icons
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",            // Class merging
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.2.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.8.0",
    "eslint": "^8.50.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 🗄️ Database

### PostgreSQL via Supabase

**Features Used**:
- ✅ PostgreSQL 15+
- ✅ JSONB columns (for flexible data)
- ✅ Full-text search
- ✅ Real-time subscriptions (WebSocket)
- ✅ Row Level Security (future)
- ✅ pgvector extension (for memory/embeddings - Phase 2)

**Connection**:
```typescript
// Via Prisma
DATABASE_URL="postgresql://user:pass@db.supabase.co:5432/postgres"

// Via Supabase Client (for real-time)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
```

---

## 🚀 Deployment Architecture (Future)

### MVP Deployment

```
┌─────────────────────┐
│   Local Machine     │
│                     │
│  - Next.js (dev)    │
│  - Express (dev)    │
│  - 9Router running  │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│   Supabase Cloud    │
│   - PostgreSQL      │
│   - Realtime        │
└─────────────────────┘
```

### Production Deployment (Phase 2+)

```
┌──────────────────────┐
│   Vercel / Railway   │
│   - Next.js          │
│   - API Routes       │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│   Supabase Cloud     │
│   - PostgreSQL       │
│   - Realtime         │
└──────────┬───────────┘
           │
           ↓
┌──────────────────────┐
│   9Router (VPS)      │
│   - Self-hosted      │
│   - Docker           │
└──────────────────────┘
```

---

## 🔧 Configuration Management

### Environment Variables

**Backend (.env)**:
```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # For Prisma migrations

# Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # Backend only

# 9Router
NINEROUTER_URL="http://localhost:20128"
NINEROUTER_API_KEY="your-orchestra-key"

# Antigravity Integration
ANTIGRAVITY_SHARED_DIR="/path/to/shared"

# Application
NODE_ENV="development"
PORT="3001"
```

**Frontend (.env.local)**:
```bash
# Supabase (public keys)
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

# Backend API
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

## 📊 Monitoring & Observability (Future)

### Phase 2+

| Component | Tool | Purpose |
|-----------|------|---------|
| **Logging** | Winston / Pino | Structured logs |
| **Metrics** | Prometheus | Performance metrics |
| **Tracing** | OpenTelemetry | Distributed tracing |
| **Errors** | Sentry | Error tracking |
| **APM** | New Relic / Datadog | Application monitoring |

**Not needed for MVP** - Console logs sufficient for development

---

## 🧪 Testing Strategy

### MVP Testing

```
Unit Tests: Vitest
  - Core business logic
  - Model selection algorithm
  - Context building
  - Authority enforcement

Integration Tests: Vitest
  - API endpoints
  - Database operations
  - 9Router integration

E2E Tests: (Future - Phase 2)
  - Playwright
  - Full workflow testing
```

**Testing Philosophy**:
- Test critical paths only for MVP
- Don't over-test during rapid iteration
- Focus on business logic, not UI
- Mock 9Router calls for speed

---

## 🔐 Security

### MVP Security Measures

1. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` templates

2. **API Key Management**
   - Orchestra API key for 9Router
   - Supabase service key server-side only

3. **Input Validation**
   - Zod schemas for all API inputs
   - Sanitize user input

4. **CORS**
   - Restrict origins in production

5. **Database**
   - Prepared statements (Prisma)
   - No raw SQL in application code

### Production Security (Phase 2+)

- Row Level Security (RLS) in Supabase
- Authentication (user sessions)
- Rate limiting
- HTTPS only
- Audit logging

---

## 📚 Documentation Tools

| Tool | Purpose | When |
|------|---------|------|
| **TypeDoc** | API documentation | Phase 2 |
| **Storybook** | Component documentation | Phase 2 |
| **Swagger/OpenAPI** | API specification | Phase 2 |
| **Mermaid** | Architecture diagrams | MVP (in docs) |

---

## 🎯 Technology Decisions Summary

| Decision | Choice | Alternative Considered | Why Chosen |
|----------|--------|------------------------|------------|
| Language | TypeScript | JavaScript | Type safety essential |
| Backend Framework | Express | NestJS, Fastify | Simplicity for MVP |
| Database | PostgreSQL | MongoDB, MySQL | JSONB + ACID + pgvector |
| Database Host | Supabase | AWS RDS, Neon | Real-time built-in |
| ORM | Prisma | TypeORM, Drizzle | Best TypeScript DX |
| Frontend | Next.js | Vite, Remix | Full-stack framework |
| State Management | Zustand | Redux, Recoil | Simplicity |
| Styling | Tailwind | CSS Modules, Styled | Rapid prototyping |
| Real-time | Supabase Realtime | Socket.io, Pusher | Included with database |
| Testing | Vitest | Jest, Mocha | Fast, modern, TS-first |

---

## 🚦 Migration Path (If Needed)

### From MVP to Scale

**What CAN scale as-is**:
- ✅ PostgreSQL (Supabase can handle millions of rows)
- ✅ Next.js (Vercel scale)
- ✅ Prisma (production-ready)
- ✅ TypeScript (no migration needed)

**What MIGHT need changes**:
- 🔄 File-based Antigravity → API-based integration
- 🔄 Single-instance Express → Load balanced cluster
- 🔄 In-memory caching → Redis
- 🔄 Monorepo → Separate services (if needed)

**NOT needed for most cases** - This stack can handle thousands of missions/day

---

## 📚 Related Documents

- **Architecture**: See `02-ARCHITECTURE.md`
- **Database Schema**: See `04-DATABASE-SCHEMA.md`
- **Implementation Plan**: See `13-IMPLEMENTATION-PLAN.md`

---

**Status**: Tech Stack Finalized - Ready for Implementation
