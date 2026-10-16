# 🎭 TUYUL Orchestra — Task Unified Yield & Utility Layer

<div align="center">

**A revolutionary 3D virtual office where autonomous AI agents work together as an orchestrated workforce**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![GitHub](https://img.shields.io/badge/GitHub_CLI-181717?style=for-the-badge&logo=github&logoColor=white)](https://cli.github.com/)

</div>

---

## 🌟 Overview

**TUYUL** (**T**ask **U**nified **Y**ield & **U**tility **L**ayer) **Orchestra** is not just another AI chatbot — it's a **complete autonomous AI workforce coordination system** that simulates a real software development office in stunning 3D. Watch as specialized AI agents with different roles, authorities, and capabilities collaborate to complete complex tasks — complete with parallel execution, 9Router cost prediction, GitHub issue tracking, Strix security scanning, and Obsidian knowledge research.

### 🎯 Core Concept

**Traditional AI Agents**: Single AI model answering questions  
**TUYUL Orchestra**: A full virtual office where specialized AI agents work together with hierarchy, authority levels, and escalation protocols

Think of it as a **virtual software company** where:
- 🎩 **Orchestra Maestro** — Makes strategic decisions (Authority: 10)
- 🏗️ **Architects** — Design system architecture (Authority: 8)
- 💻 **Developers** — Write code (Authority: 4–6)
- 🔍 **QA Engineers** — Test and validate with AI security scanning (Authority: 3)
- 📝 **Technical Writers** — Document everything (Authority: 2)
- 🔬 **AI Research Specialist** — Provides PM with knowledge & research (Authority: 5)
- 🎓 **Interns** — Create GitHub issues and assist (Authority: 1)

---

## ✨ Key Features

### 🏢 Immersive 3D Virtual Office
- **Real-time 3D rendering** with Three.js
- Beautiful office environment with dedicated work zones (Orchestra Pod, Engineering Bay, QA & Docs Studio)
- Live animated characters representing each AI agent
- Smooth camera controls with 360° rotation
- Performance-optimized rendering (60 FPS target)

### 🤖 Intelligent Agent System
- **Authority-based hierarchy** (0–10 levels)
- **Dynamic model selection** — Uses budget models for simple tasks, premium models for complex ones
- **Escalation protocols** — Lower authority agents can escalate to higher authority
- **Context-aware execution** — Each agent receives only relevant information
- **Review loops** — Multi-layer quality control (Plan → Execute → Test → Review)

### 🔬 AI Research Specialist (Dr. Aris Thorne)
- Dedicated AI agent supporting the Product Manager with knowledge retrieval
- Searches Obsidian Vault for relevant project notes and SOPs
- Reduces PM token consumption on repetitive knowledge tasks
- Integrated into the Orchestra Pod layout alongside the PM desk

### 🔐 Security Gate — Smart Sensitivity Filter
- PM and AI Intern automatically evaluate task sensitivity before creating public GitHub issues
- Tasks with sensitive keywords (`.env`, `api_key`, `secret`, `token`, `password`, `credential`, `private_key`) are **blocked from public GitHub** and kept in Obsidian Vault
- Transparent audit trail — all blocked tasks are logged with their reason

### 🛡️ Strix Autonomous Security Scanner
- **QA Agent** is powered by [Strix](https://strix.sh) for autonomous bug discovery and penetration testing
- Dynamically reads the active AI model from the QA agent and routes it through **9Router Gateway**
- Runs asynchronously in the background after each QA simulation tick
- Results surfaced via `/api/qa/strix-scan` endpoint

### 📋 Issue-Driven Development (IDD) with GitHub CLI
- AI Intern creates GitHub Issues **before** implementing changes via `gh` CLI
- Issues include rich metadata: `assignees`, `labels`, `milestones`
- PM evaluates sensitivity before allowing public issue creation
- Full issue lifecycle: Create → Work → Close → Push

### 🎛️ Real-time Orchestration
- Live task board with Kanban-style workflow
- Activity feed showing only task-relevant events (no noise)
- Agent status monitoring (Idle, Planning, Coding, Testing, Reviewing, Researching)
- Mission progress tracking
- Cost optimization through smart model routing via 9Router

### 🔄 Backend Integration
- **FastAPI** backend for AI orchestration
- **9Router** integration for multi-provider AI access (OpenAI, Anthropic, Gemini, DeepSeek, Ollama)
- **Obsidian** vault integration for knowledge management and SOP storage
- **GitHub CLI** (`gh`) for automated issue management
- Automated documentation generation

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Three.js** - 3D graphics and rendering
- **Tailwind CSS 4** - Modern styling system
- **Zustand** - State management
- **Vite** - Lightning-fast build tool
- **Motion** - Smooth animations
- **Lucide React** - Beautiful icons

### Backend
- **Python 3.11+** — Backend runtime
- **FastAPI** — High-performance API framework
- **9Router** — Multi-provider AI gateway
- **GitHub CLI (`gh`)** — Automated GitHub issue creation
- **Strix Agent** — Autonomous security & bug scanning
- **python-dotenv** — Environment management

### 3D & Graphics
- **Three.js 0.186** - WebGL rendering
- **OrbitControls** - Camera manipulation
- **Custom shaders** - Optimized materials
- **Shadow mapping** - Realistic lighting

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ and npm/bun
- **Python** 3.11+ (for backend)
- **GitHub CLI** (`gh`) — [Install here](https://cli.github.com/) and run `gh auth login`
- **9Router** running locally on port `20128`
- Modern browser with WebGL support

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Inineo/TUYUL-Orchestra.git
cd TUYUL-Orchestra
```

2. **Install frontend dependencies**
```bash
npm install
# or
bun install
```

3. **Install backend dependencies**
```bash
cd backend
pip install -r requirements.txt
cd ..
```

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials (see `.env.example` for all options):
```env
# 9Router Configuration
VITE_9ROUTER_URL=http://localhost:20128
VITE_9ROUTER_API_KEY=your_api_key_here

# Default AI Model (routed via 9Router)
DEFAULT_AI_MODEL=openai/gpt-4o-mini

# Obsidian Integration (optional but recommended)
OBSIDIAN_ANTIGRAVITY_PATH=D:\Obsidian\YourVault\antigravity
CURRENT_PROJECT_NAME=Kibi-Orchestra
```

> ⚠️ **Never commit your `.env` file.** It is already in `.gitignore`. Only `.env.example` (with empty values) is tracked.

5. **Authenticate GitHub CLI** (required for AI Intern to create issues)
```bash
gh auth login
```

6. **Start the development server**

**Frontend:**
```bash
npm run dev
```
Open http://localhost:5173

**Backend** (database auto-initializes on first run):
```bash
cd backend
python main.py
```
Backend runs on http://localhost:8000

> 💾 **Database**: `orchestrator.db` is created automatically in `backend/` when the server starts for the first time. No manual setup required. It is excluded from git via `.gitignore`.

---

## 📖 Usage

### Creating a Mission

1. Click the **"New Mission"** button in the command center
2. Enter your mission description (e.g., "Add authentication with JWT")
3. Watch as the Orchestra Maestro analyzes and delegates tasks
4. Monitor real-time progress in the 3D office

### Interacting with Agents

- **Click on an agent** to view their current task and status
- **Hover over desks** to see agent roles and activity
- **Use the task board** to track workflow progress
- **Check the event stream** for detailed activity logs

### Camera Controls

- **Left Click + Drag**: Rotate camera
- **Right Click + Drag**: Pan camera
- **Mouse Wheel**: Zoom in/out
- **Double Click Agent**: Focus camera on agent

---

## 🏗️ Project Structure

```
Kibi-Orchestra-V3/
├── src/
│   ├── components/
│   │   ├── office3d/           # 3D office scene components
│   │   │   ├── ThreeOfficeScene.ts  # Main 3D engine
│   │   │   └── OfficeCanvas.tsx     # React wrapper
│   │   ├── panels/             # UI panels (TaskBoard, Stats, Events)
│   │   ├── modals/             # Modal dialogs
│   │   ├── simple/             # Simple UI components (ActivityFeed, AgentSettings)
│   │   └── ui/                 # Reusable UI primitives
│   ├── stores/
│   │   └── useOfficeStore.ts   # Zustand global state + agent simulation
│   ├── types/
│   │   └── office.ts           # TypeScript type definitions (AgentRole etc.)
│   ├── data/
│   │   └── initialData.ts      # Default agent configurations
│   └── lib/
│       ├── utils.ts            # Utility functions
│       └── aiClient.ts         # AI client integration (9Router)
├── backend/
│   ├── main.py                 # FastAPI server (all routes)
│   ├── config.py               # Configuration management
│   ├── requirements.txt        # Python dependencies
│   ├── services/
│   │   ├── orchestrator.py     # AI workflow orchestration (PM + Researcher)
│   │   ├── obsidian.py         # Obsidian vault read/write integration
│   │   ├── intern_safety.py    # GitHub issue creation + sensitivity gate
│   │   ├── qa_strix.py         # Strix autonomous security scanner integration
│   │   └── caveman.py          # Token compression utility
│   └── scripts/                # Setup & sync utility scripts
├── .env.example                # Environment template (safe to commit)
├── .gitignore                  # Excludes .env, secrets, vault paths
└── package.json
```

---

## 🎨 3D Office Design

The virtual office features three distinct zones:

### 🎭 Orchestra Pod (Center)
- **Product Manager (PM)** — Strategic command and task delegation
- **AI Research Specialist (Dr. Aris Thorne)** — Knowledge research supporting the PM
- Panoramic curved monitors for system-wide overview

### 💻 Engineering Bay (Left Wing)
- **Frontend & Backend Developers**
- Dual-monitor workstations
- Collaborative development zone

### 📋 Quality & Docs Studio (Right Wing)
- **QA Engineer** — Powered by Strix autonomous security scanner
- **Technical Writer** — Documentation workspace
- Quality assurance and knowledge hub

---

## 🧠 Agent Roles & Authority

| Role | Authority | Model Policy | Responsibilities |
|------|-----------|--------------|------------------|
| **Orchestra Maestro** | 10 | Premium (Claude-3.5) | Strategic decisions, final approval |
| **System Architect** | 8 | Premium (Claude-3.5) | Architecture design, locked decisions |
| **Senior Developer** | 6 | Dynamic | Complex implementations |
| **AI Research Specialist** | 5 | Standard | Knowledge retrieval, Obsidian search, research support |
| **Developer** | 4 | Budget (DeepSeek) | Standard coding tasks |
| **QA Engineer** | 3 | Standard + Strix | Testing, validation & security scanning |
| **Technical Writer** | 2 | Budget (Gemini-Flash) | Documentation |
| **Intern** | 1 | Budget | GitHub issue creation, learning & assistance |

**Key Principle**: Lower authority cannot override higher authority decisions — they must escalate!

---

## 🔐 Security Policy

### What Is Protected
- Real `.env` files are excluded via `.gitignore` — never tracked
- No API keys, tokens, or credentials are hardcoded in source files
- Sensitive tasks (involving `api_key`, `secret`, `token`, `.env`, `password`, `credential`, `private_key`) are **intercepted by the Security Gate** and stored in Obsidian Vault instead of public GitHub Issues

### What Is Safe to Commit
- `.env.example` — template with empty values ✅
- All source code — no hardcoded secrets ✅
- `backend/config.py` — reads from environment variables only ✅

### Git History Audit
The repository's git history has been verified — no sensitive files were ever committed. A dedicated security commit (`835dff6`) enhanced `.gitignore` and removed any internal documents from tracking.

---

## 🎯 Workflow: Issue-Driven Development (IDD)

```mermaid
graph TD
    A[User Mission] --> B[PM + Researcher analyze and plan]
    B --> C{Sensitive task?}
    C -->|Yes| D[Store in Obsidian Vault only]
    C -->|No| E[AI Intern creates GitHub Issue]
    E --> F[Developer implements changes]
    F --> G{QA + Strix scan}
    G -->|Pass| H[Tech Writer documents]
    G -->|Fail| I[New bug issue created]
    H --> J[Intern closes GitHub Issue]
    J --> K[Push and deploy]
```

---

## 🔧 Backend API Endpoints

### Mission Management
- `POST /api/mission/start` — Start a new mission
- `GET /api/mission/{id}/status` — Check mission status
- `POST /api/mission/{id}/abort` — Abort mission

### Agent Operations
- `POST /api/agent/{role}/assign` — Assign task to agent
- `GET /api/agent/{role}/status` — Get agent status
- `POST /api/agent/{role}/escalate` — Escalate to higher authority

### GitHub Issue Management
- `POST /api/intern/github-issue` — Create GitHub issue via `gh` CLI

### QA & Security
- `POST /api/qa/strix-scan` — Run Strix autonomous security scan

### Obsidian Integration
- `POST /api/obsidian/sync-docs` — Sync documentation to vault
- `POST /api/obsidian/create-index` — Generate index notes
- `POST /api/obsidian/create-sop` — Create SOPs

---

## 📊 Performance Optimizations

### 3D Rendering
- ✅ Shadow map resolution reduced to 1024 (4x lighter on VRAM)
- ✅ Pixel ratio capped at 1.25 on high-DPI screens
- ✅ Raycasting throttled to ~30fps (32ms)
- ✅ Skip rendering when browser tab hidden
- ✅ Medium precision shaders for 40% fillrate savings
- ✅ Basic shadow map (faster than PCF soft shadows)

### State Management
- ✅ Zustand for lightweight state
- ✅ Context selectivity - agents receive only relevant data
- ✅ Event-driven architecture

---

## 🔮 Roadmap

### Phase 1: Foundation ✅ (Complete)
- [x] 3D office visualization with Three.js
- [x] Authority-based agent hierarchy system
- [x] Task board UI (Kanban)
- [x] FastAPI backend orchestration
- [x] 9Router multi-provider AI gateway integration
- [x] Obsidian Vault integration for knowledge management

### Phase 2: Intelligence ✅ (Complete)
- [x] AI Research Specialist agent (Dr. Aris Thorne)
- [x] GitHub CLI integration for Issue-Driven Development
- [x] Strix autonomous security & bug scanning (QA agent)
- [x] Smart Sensitivity Gate (no leaking sensitive tasks publicly)
- [x] Activity feed filtering (clean, task-focused logs)
- [x] Backend reorganization (modular services architecture)

### Phase 3: Scale 🚧 (In Progress)
- [ ] Memory system for agents (persistent context across missions)
- [ ] Parallel task execution (multiple missions simultaneously)
- [ ] Advanced cost prediction engine
- [ ] Custom workflow templates
- [ ] Multi-mission support
- [ ] Team collaboration features
- [ ] Production deployment & cloud hosting

---

## 🤝 Contributing & Forking

> **Note on Project Status**: **TUYUL Orchestra** saat ini dikembangkan secara independen sebagai proyek pribadi aktif. Untuk saat ini, **kami belum menerima Pull Request atau kontribusi kode langsung ke repositori utama**.

Namun, repositori ini berlisensi open source ([MIT License](LICENSE))! Anda sangat dipersilakan untuk:
- 🍴 **Fork** repositori ini ke akun Anda sendiri.
- 🚀 Bereksperimen dan mengembangkan fitur kustom sesuai kebutuhan Anda secara mandiri.
- ⭐ Memberikan Star atau membuka **GitHub Issue** jika menemukan bug atau ingin berbagi ide/feedback.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **9Router** — Multi-provider AI gateway
- **Antigravity** — AI-powered IDE
- **Strix** — Autonomous security scanner
- **GitHub CLI** — Seamless issue management from terminal
- **Three.js** — Amazing 3D library
- **React** & **Vite** — Modern web development
- **FastAPI** — High-performance Python API framework
- **Obsidian** — Knowledge management and SOP vault

---

## 📞 Contact

**Project Maintainer**: Inineo  
**Repository**: [github.com/Inineo/TUYUL-Orchestra](https://github.com/Inineo/TUYUL-Orchestra)

---

<div align="center">

**Made with ❤️ by the TUYUL Orchestra Team**

⭐ Star this repo if you find it useful!

</div>
