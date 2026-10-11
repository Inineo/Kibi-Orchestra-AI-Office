# Implementation Plan - AI Workforce Orchestra

**Last Updated**: 2026-10-11  
**Status**: Active Execution - Backend Python & Obsidian/Caveman Integration

---

## 🎯 Implementation Strategy

**Approach**: Iterative phases dengan integrasi Frontend (Kibi-Orchestra 3D Studio) dan Backend Orchestrator (Python FastAPI).

**Philosophy**:
- ✅ Build smallest working increment first
- ✅ Python Backend for Local System Execution (Filesystem, Obsidian Vault, CLI)
- ✅ Caveman Prompt Compression to save 60-80% token costs
- ✅ Keep Frontend lightweight, reactive, and visually stunning (Three.js)

---

## 📅 Phase Timeline

```
Phase 1: Foundation (Frontend 3D & Python Engine)  [Active]   ████████████░░░░░░
Phase 2: Agent System & Caveman Token Optimizer    [Upcoming] ░░░░░░░░████████░░
Phase 3: Obsidian Vault & Ponytail Integration     [Upcoming] ░░░░░░░░░░░░████░░
Phase 4: Full Multi-Agent Autonomy & QA Escalation [Upcoming] ░░░░░░░░░░░░░░████
```

---

## 🏗️ Phase 1: Foundation & Backend Python Orchestration

### Goals
- [x] Frontend 3D Office Environment & Free Camera Controls
- [x] 9Router Proxy & Model Selector (Live LLM Gateway)
- [x] Multi-Role Squad (`product_manager`, `frontend`, `backend`, `intern`)
- [ ] **Python Backend Engine (`backend/`)**: FastAPI server on port 8000
- [ ] **Obsidian Vault Connector**: Read/write missions & agent knowledge directly to Markdown files
- [ ] **Caveman Token Compression**: Ultra-compact state sharing to minimize context costs
- [ ] **Frontend-Backend API Bridge**: Real-time sync between 3D avatars and Python orchestrator

---

#### 1.1 Python Backend Setup
```bash
# Directory: backend/
python -m venv venv
venv\Scripts\activate
pip install fastapi uvicorn pydantic requests python-dotenv
```

**Files to create**:
- `backend/main.py` - FastAPI server with CORS & status polling
- `backend/config.py` - Environment loader (9Router URL, API Key, Obsidian Vault path)
- `backend/services/obsidian.py` - Vault sync manager (Markdown R/W)
- `backend/services/caveman.py` - Token compressor (Ultra-dense prompt format)
- `backend/services/orchestrator.py` - PM decomposition & agent task delegator

---

#### 1.2 Backend Foundation (Day 1-2)
```bash
cd packages/backend
pnpm init
pnpm add express cors helmet dotenv
pnpm add prisma @prisma/client zod uuid date-fns
pnpm add -D typescript @types/node @types/express tsx
```

**Files to create**:
- `src/index.ts` - Express server
- `src/config.ts` - Configuration loader
- `src/routes/` - API routes
- `.env.example` - Environment template

**Deliverable**: Express server running on localhost:3001

---

#### 1.3 Database Setup (Day 2-3)

**Steps**:
1. Create Supabase account
2. Create new project
3. Copy connection strings

```bash
# Initialize Prisma
npx prisma init

# Copy schema from 04-DATABASE-SCHEMA.md
# Edit prisma/schema.prisma

# Create initial migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

**Test**:
```typescript
// src/test-db.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  const mission = await prisma.mission.create({
    data: {
      goal: 'Test mission',
      status: 'planning'
    }
  });
  console.log('Mission created:', mission);
}

testConnection();
```

**Deliverable**: Database connected, can create records

---

#### 1.4 Core API Endpoints (Day 3-4)

**Endpoints to implement**:

```typescript
// POST /api/missions - Create mission
router.post('/missions', async (req, res) => {
  const { goal, requirements } = req.body;
  
  const mission = await prisma.mission.create({
    data: {
      goal,
      requirements: requirements || [],
      status: 'planning'
    }
  });
  
  res.json(mission);
});

// GET /api/missions/:id - Get mission
router.get('/missions/:id', async (req, res) => {
  const mission = await prisma.mission.findUnique({
    where: { id: req.params.id },
    include: {
      tasks: true,
      decisions: true
    }
  });
  
  res.json(mission);
});

// GET /api/missions - List missions
router.get('/missions', async (req, res) => {
  const missions = await prisma.mission.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  res.json(missions);
});
```

**Deliverable**: Can create and query missions via API

---

#### 1.5 9Router Integration (Day 4-5)

**Create 9Router client**:
```typescript
// src/services/ai-client.ts
interface AICallOptions {
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  tools?: Tool[];
}

export class AIClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor() {
    this.baseUrl = process.env.NINEROUTER_URL || 'http://localhost:20128';
    this.apiKey = process.env.NINEROUTER_API_KEY!;
  }
  
  async call(options: AICallOptions): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        stream: false,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens,
        tools: options.tools
      })
    });
    
    if (!response.ok) {
      throw new Error(`9Router error: ${response.status}`);
    }
    
    const data = await response.json();
    return this.parseResponse(data);
  }
  
  private parseResponse(data: any): AIResponse {
    return {
      content: data.choices[0].message.content,
      toolCalls: data.choices[0].message.tool_calls,
      usage: data.usage
    };
  }
}
```

**Test**:
```typescript
// src/test-ai.ts
const client = new AIClient();

const response = await client.call({
  model: 'openai/gpt-4o-mini',
  messages: [
    { role: 'user', content: 'Say hello' }
  ]
});

console.log('AI Response:', response.content);
```

**Deliverable**: Can call 9Router successfully

---

#### 1.6 Simple Agent Execution (Day 5-6)

**Create basic agent runner**:
```typescript
// src/services/agent-runner.ts
export class AgentRunner {
  private aiClient: AIClient;
  
  async executeAgent(params: {
    role: string;
    task: Task;
    context: any;
  }): Promise<AgentRun> {
    const { role, task, context } = params;
    
    // Build prompt
    const messages = this.buildMessages(role, task, context);
    
    // Select model (simple for now)
    const model = this.selectModel(role);
    
    // Call AI
    const startTime = Date.now();
    const response = await this.aiClient.call({
      model,
      messages
    });
    const latency = Date.now() - startTime;
    
    // Store agent run
    const agentRun = await prisma.agentRun.create({
      data: {
        taskId: task.id,
        agentRole: role,
        modelUsed: model,
        status: 'completed',
        result: { content: response.content },
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        cost: this.calculateCost(response.usage, model),
        startedAt: new Date(startTime),
        completedAt: new Date(),
        latencyMs: latency
      }
    });
    
    return agentRun;
  }
  
  private selectModel(role: string): string {
    // Simple mapping for Phase 1
    const modelMap: Record<string, string> = {
      'planner': 'openai/gpt-4o-mini',
      'developer': 'opencode/deepseek-coder',
      'reviewer': 'openai/gpt-4o-mini'
    };
    return modelMap[role] || 'openai/gpt-4o-mini';
  }
}
```

**Deliverable**: Can execute single agent and store result

---

### Phase 1 Success Criteria
- ✅ Express server running
- ✅ Database connected with Prisma
- ✅ Can create missions via API
- ✅ Can call 9Router successfully
- ✅ Can execute simple agent
- ✅ Agent run stored in database

**Demo**: Create mission via API, execute planner agent, see result in database

---

## 🤖 Phase 2: Agent System (Week 3)

### Goals
- ✅ Multi-agent workflow working
- ✅ Planner → Developer → Reviewer flow
- ✅ Task breakdown implemented
- ✅ Basic context building

### Tasks

#### 2.1 Agent Definitions (Day 1)
```typescript
// src/agents/definitions.ts
export const AGENT_ROLES = {
  planner: {
    authority: 7,
    capabilities: ['task_breakdown', 'planning'],
    systemPrompt: `You are a software development planner...`,
    modelPolicy: {
      default: 'openai/gpt-4o-mini'
    }
  },
  developer: {
    authority: 4,
    capabilities: ['coding', 'implementation'],
    systemPrompt: `You are a software developer...`,
    modelPolicy: {
      default: 'opencode/deepseek-coder'
    }
  },
  reviewer: {
    authority: 5,
    capabilities: ['code_review', 'quality_check'],
    systemPrompt: `You are a code reviewer...`,
    modelPolicy: {
      default: 'openai/gpt-4o-mini'
    }
  }
};
```

**Deliverable**: Agent roles defined

---

#### 2.2 Task Manager (Day 1-2)
```typescript
// src/services/task-manager.ts
export class TaskManager {
  async createTasksFromMission(mission: Mission): Promise<Task[]> {
    // Execute planner agent
    const plannerRun = await agentRunner.executeAgent({
      role: 'planner',
      task: {
        description: mission.goal,
        requirements: mission.requirements
      },
      context: {}
    });
    
    // Parse planner output into tasks
    const taskDescriptions = this.parsePlannerOutput(plannerRun.result);
    
    // Create tasks in database
    const tasks = await Promise.all(
      taskDescriptions.map(desc => 
        prisma.task.create({
          data: {
            missionId: mission.id,
            type: 'implement',
            description: desc,
            status: 'pending'
          }
        })
      )
    );
    
    return tasks;
  }
  
  async getNextTask(missionId: string): Promise<Task | null> {
    return prisma.task.findFirst({
      where: {
        missionId,
        status: 'pending'
      },
      orderBy: { createdAt: 'asc' }
    });
  }
  
  async updateTaskStatus(taskId: string, status: string) {
    return prisma.task.update({
      where: { id: taskId },
      data: { 
        status,
        updatedAt: new Date()
      }
    });
  }
}
```

**Deliverable**: Can break mission into tasks

---

#### 2.3 Workflow Orchestrator (Day 2-3)
```typescript
// src/services/orchestrator.ts
export class Orchestrator {
  async executeMission(missionId: string) {
    const mission = await prisma.mission.findUnique({
      where: { id: missionId }
    });
    
    // Phase 1: Planning
    await this.updateMissionStatus(missionId, 'planning');
    const tasks = await taskManager.createTasksFromMission(mission);
    
    // Phase 2: Implementation
    await this.updateMissionStatus(missionId, 'in_progress');
    
    for (const task of tasks) {
      await this.executeTask(task);
    }
    
    // Phase 3: Complete
    await this.updateMissionStatus(missionId, 'completed');
  }
  
  async executeTask(task: Task) {
    // Update status
    await taskManager.updateTaskStatus(task.id, 'running');
    
    // Execute developer
    const devRun = await agentRunner.executeAgent({
      role: 'developer',
      task,
      context: await this.buildContext(task)
    });
    
    // Create artifact
    const artifact = await this.createArtifact(task, devRun);
    
    // Execute reviewer
    const reviewRun = await agentRunner.executeAgent({
      role: 'reviewer',
      task,
      context: {
        artifact,
        requirements: task.requirements
      }
    });
    
    // Check review result
    const reviewResult = this.parseReviewResult(reviewRun.result);
    
    if (reviewResult.pass) {
      await taskManager.updateTaskStatus(task.id, 'approved');
    } else {
      await taskManager.updateTaskStatus(task.id, 'rework');
      // For MVP, mark as needs attention
    }
  }
}
```

**Deliverable**: End-to-end workflow executes

---

#### 2.4 Context Builder (Day 3-4)
```typescript
// src/services/context-builder.ts
export class ContextBuilder {
  async buildForAgent(agent: AgentRole, task: Task): Promise<any> {
    const context: any = {
      task: {
        description: task.description,
        requirements: task.requirements,
        type: task.type
      }
    };
    
    // Add mission context
    if (task.missionId) {
      const mission = await prisma.mission.findUnique({
        where: { id: task.missionId }
      });
      context.mission = {
        goal: mission.goal,
        requirements: mission.requirements
      };
    }
    
    // Add decisions (for higher authority agents)
    if (agent.authority >= 5) {
      const decisions = await prisma.decision.findMany({
        where: {
          missionId: task.missionId,
          locked: true
        }
      });
      context.decisions = decisions;
    }
    
    return context;
  }
}
```

**Deliverable**: Agents receive relevant context

---

### Phase 2 Success Criteria
- ✅ Planner breaks mission into tasks
- ✅ Developer implements each task
- ✅ Reviewer checks each artifact
- ✅ All data stored in database
- ✅ Can query mission status

**Demo**: Submit mission "Add user authentication", watch it go through planner → developer → reviewer, see tasks and artifacts

---

## 🔄 Phase 3: Review & Escalation (Week 4)

### Goals
- ✅ Rework loops implemented
- ✅ Escalation system working
- ✅ Authority enforcement
- ✅ Decision locking

### Tasks

#### 3.1 Review Loops (Day 1-2)
```typescript
// Enhance orchestrator with retry logic
async executeTaskWithRetry(task: Task, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await this.executeTask(task);
    
    if (result.status === 'approved') {
      return result;
    }
    
    if (result.status === 'rework' && attempt < maxRetries) {
      // Provide feedback for next attempt
      await taskManager.updateTaskFeedback(task.id, result.feedback);
      continue;
    }
    
    // Max retries exceeded
    return { status: 'escalate', reason: 'max_retries_exceeded' };
  }
}
```

**Deliverable**: Failed tasks retry with feedback

---

#### 3.2 Escalation System (Day 2-3)
```typescript
// src/services/escalation-manager.ts
export class EscalationManager {
  async createEscalation(params: {
    fromAgentRun: string;
    reason: string;
    question: string;
  }): Promise<Escalation> {
    const fromRun = await prisma.agentRun.findUnique({
      where: { id: params.fromAgentRun }
    });
    
    // Determine target role
    const toRole = this.determineEscalationTarget(fromRun.agentRole);
    
    const escalation = await prisma.escalation.create({
      data: {
        fromAgentRun: params.fromAgentRun,
        fromAgentRole: fromRun.agentRole,
        toAgentRole: toRole,
        reason: params.reason,
        question: params.question,
        status: 'pending'
      }
    });
    
    return escalation;
  }
  
  async resolveEscalation(escalationId: string) {
    const escalation = await prisma.escalation.findUnique({
      where: { id: escalationId }
    });
    
    // Execute higher authority agent
    const resolverRun = await agentRunner.executeAgent({
      role: escalation.toAgentRole,
      task: { 
        description: escalation.question,
        context: escalation.context
      },
      context: {}
    });
    
    // Update escalation
    await prisma.escalation.update({
      where: { id: escalationId },
      data: {
        status: 'answered',
        resolvedByAgentRun: resolverRun.id,
        resolution: resolverRun.result,
        resolvedAt: new Date()
      }
    });
    
    return resolverRun.result;
  }
}
```

**Deliverable**: Escalations create and resolve

---

#### 3.3 Authority Enforcement (Day 3-4)
```typescript
// src/services/authority-enforcer.ts
export class AuthorityEnforcer {
  async validateDecision(agent: AgentRole, decision: any): Promise<ValidationResult> {
    const requiredAuthority = this.getRequiredAuthority(decision.type);
    
    if (agent.authority < requiredAuthority) {
      return {
        allowed: false,
        reason: `Decision requires authority ${requiredAuthority}, agent has ${agent.authority}`,
        escalateToRole: this.findRoleWithAuthority(requiredAuthority)
      };
    }
    
    // Check for locked decision conflicts
    const conflicts = await this.checkLockedDecisions(decision);
    if (conflicts.length > 0) {
      return {
        allowed: false,
        reason: 'Conflicts with locked decisions',
        conflicts
      };
    }
    
    return { allowed: true };
  }
}
```

**Deliverable**: Low authority can't override high authority

---

### Phase 3 Success Criteria
- ✅ Tasks retry up to 3 times
- ✅ Escalations trigger and resolve
- ✅ Authority checks prevent violations
- ✅ Decisions can be locked

**Demo**: Task that requires escalation (e.g., schema change), watch escalation flow

---

## 🔗 Phase 4: Integration (Week 5)

### Goals
- ✅ Antigravity integration working
- ✅ Artifacts applied to workspace
- ✅ Tests run after code generation
- ✅ End-to-end workflow complete

### Tasks

#### 4.1 Antigravity File-based Integration (Day 1-2)
```typescript
// src/services/antigravity-client.ts
export class AntigravityClient {
  private sharedDir: string;
  
  async applyArtifact(artifact: Artifact): Promise<void> {
    const task = {
      id: `task-${artifact.id}`,
      type: 'apply_artifact',
      artifact: {
        path: artifact.path,
        content: artifact.content,
        action: 'create'
      },
      commands: [
        'npm run type-check',
        `npm test ${artifact.path.replace('.ts', '.test.ts')}`
      ]
    };
    
    // Write to shared directory
    await fs.writeFile(
      path.join(this.sharedDir, 'tasks/pending', `${task.id}.json`),
      JSON.stringify(task, null, 2)
    );
  }
  
  async waitForCompletion(taskId: string, timeoutMs = 300000): Promise<any> {
    const resultPath = path.join(this.sharedDir, 'results', `${taskId}.json`);
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (await fs.pathExists(resultPath)) {
        return JSON.parse(await fs.readFile(resultPath, 'utf8'));
      }
      await sleep(1000);
    }
    
    throw new Error(`Task timeout: ${taskId}`);
  }
}
```

**Deliverable**: Artifacts written to shared directory

---

#### 4.2 Antigravity Watcher Script (Day 2)
```typescript
// scripts/antigravity-watcher.ts
const SHARED_DIR = process.env.ANTIGRAVITY_SHARED_DIR!;
const WORKSPACE = process.env.WORKSPACE_PATH!;

const watcher = chokidar.watch(
  path.join(SHARED_DIR, 'tasks/pending'),
  { ignoreInitial: false }
);

watcher.on('add', async (filepath) => {
  const task = JSON.parse(await fs.readFile(filepath, 'utf8'));
  
  console.log(`Executing task: ${task.id}`);
  
  try {
    // Move to in_progress
    await fs.move(
      filepath,
      path.join(SHARED_DIR, 'tasks/in_progress', path.basename(filepath))
    );
    
    // Execute task
    if (task.type === 'apply_artifact') {
      await fs.writeFile(
        path.join(WORKSPACE, task.artifact.path),
        task.artifact.content
      );
    }
    
    // Run commands
    const outputs = [];
    for (const cmd of task.commands || []) {
      const result = await execa.command(cmd, { cwd: WORKSPACE });
      outputs.push({ cmd, stdout: result.stdout });
    }
    
    // Write result
    await fs.writeFile(
      path.join(SHARED_DIR, 'results', `${task.id}.json`),
      JSON.stringify({
        task_id: task.id,
        status: 'success',
        outputs
      })
    );
    
    // Move to completed
    await fs.move(
      path.join(SHARED_DIR, 'tasks/in_progress', path.basename(filepath)),
      path.join(SHARED_DIR, 'tasks/completed', path.basename(filepath))
    );
    
  } catch (error) {
    console.error(`Task failed: ${task.id}`, error);
    
    await fs.writeFile(
      path.join(SHARED_DIR, 'results', `${task.id}.json`),
      JSON.stringify({
        task_id: task.id,
        status: 'failed',
        error: error.message
      })
    );
  }
});
```

**Deliverable**: Watcher picks up and executes tasks

---

#### 4.3 End-to-end Workflow (Day 3-5)

Integrate all pieces:
1. User creates mission
2. Planner breaks down
3. For each task:
   - Developer generates code
   - Artifact created
   - Applied via Antigravity
   - Tests run
   - Reviewer checks
   - Approve or rework
4. Mission completes

**Deliverable**: Full workflow from mission to applied code

---

### Phase 4 Success Criteria
- ✅ Code artifacts applied to workspace
- ✅ Tests run automatically
- ✅ Full mission completes end-to-end
- ✅ All state tracked in database

**Demo**: "Add login endpoint" → generates code → applies to workspace → tests pass → marks complete

---

## 🚀 Phase 5: Polish & Iteration (Week 6+)

### Goals
- ✅ Basic UI for monitoring
- ✅ Error handling improved
- ✅ Logging and debugging
- ✅ Documentation complete

### Tasks
- Simple web UI to view missions/tasks
- Better error messages
- Performance optimization
- User documentation
- Deployment preparation

---

## 📋 Pre-Implementation Checklist

Before starting Phase 1:

- [ ] All documentation reviewed
- [ ] 9Router installed and running on localhost:20128
- [ ] Supabase account created
- [ ] Node.js 20+ installed
- [ ] pnpm installed
- [ ] VS Code with extensions ready
- [ ] Git repository initialized
- [ ] Architecture questions answered

---

## 🎯 Success Metrics

**MVP Success**:
- ✅ User submits mission via API
- ✅ System breaks down into tasks automatically
- ✅ Agents generate code
- ✅ Code applied to workspace
- ✅ Tests run automatically
- ✅ Quality gates pass
- ✅ Mission marked complete
- ✅ All state queryable from database
- ✅ Under $1 per average feature

---

## 📚 Related Documents

- **Architecture**: See `02-ARCHITECTURE.md`
- **Database Schema**: See `04-DATABASE-SCHEMA.md`
- **Integration**: See `10-INTEGRATIONS.md`
- **Decisions**: See `14-DECISIONS-LOG.md`

---

**Status**: Ready to Execute - Start with Phase 1
