import { create } from 'zustand';
import {
  Agent,
  AgentStatus,
  IdleActivity,
  AgentLocation,
  EventType,
  Mission,
  OfficeEvent,
  Task,
  TaskStatus,
  WorkforceStats,
} from '../types/office';
import {
  INITIAL_AGENTS,
  INITIAL_EVENTS,
  INITIAL_MISSION,
  INITIAL_TASKS,
} from '../data/initialData';

export type CameraPreset = 'isometric' | 'topdown' | 'front' | 'agent' | 'free';

interface OfficeState {
  // Core Entities
  agents: Agent[];
  tasks: Task[];
  events: OfficeEvent[];
  mission: Mission;

  // UI Selection & Camera
  selectedAgentId: string | null;
  selectedTaskId: string | null;
  hoveredAgentId: string | null;
  focusedAgentId: string | null;
  cameraPreset: CameraPreset;
  autoRotate: boolean;

  // Simulation Controls
  simulationRunning: boolean;
  simulationSpeed: number; // 0.5, 1, 2
  soundEnabled: boolean;
  eventFilter: 'all' | EventType;
  isCreateTaskModalOpen: boolean;

  // Computed Metrics
  getStats: () => WorkforceStats;

  // Actions
  selectAgent: (agentId: string | null) => void;
  focusAgent: (agentId: string | null) => void;
  selectTask: (taskId: string | null) => void;
  setHoveredAgent: (agentId: string | null) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  toggleAutoRotate: () => void;
  toggleSimulation: (running?: boolean) => void;
  setSimulationSpeed: (speed: number) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setEventFilter: (filter: 'all' | EventType) => void;
  setCreateTaskModalOpen: (open: boolean) => void;

  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  moveTask: (taskId: string, targetStatus: TaskStatus) => void;
  addTask: (newTask: Partial<Task> & { title: string; description: string }) => void;
  addEvent: (evt: {
    type: EventType;
    message: string;
    agentId?: string;
    taskId?: string;
    taskKey?: string;
    details?: string;
  }) => void;
  clearEvents: () => void;

  // Simulation automation triggers
  stepSimulation: () => void;
  resetSimulation: () => void;
  triggerEscalation: () => void;
  resolveEscalation: () => void;
  injectBugTest: () => void;
}

const getFormattedTime = (): string => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// Play brief web audio synthesized feedback
export const playSound = (type: 'blip' | 'chime' | 'alert' | 'complete') => {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'blip') {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'chime') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.2);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'complete') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    }
  } catch {
    // AudioContext blocked or not supported
  }
};

export const useOfficeStore = create<OfficeState>((set, get) => ({
  agents: INITIAL_AGENTS,
  tasks: INITIAL_TASKS,
  events: INITIAL_EVENTS,
  mission: INITIAL_MISSION,

  selectedAgentId: null,
  selectedTaskId: null,
  hoveredAgentId: null,
  focusedAgentId: null,
  cameraPreset: 'isometric',
  autoRotate: false,

  simulationRunning: true,
  simulationSpeed: 1,
  soundEnabled: false,
  eventFilter: 'all',
  isCreateTaskModalOpen: false,

  getStats: () => {
    const { agents, tasks } = get();
    const activeAgents = agents.filter((a) => a.status !== 'idle').length;
    const tasksDone = tasks.filter((t) => t.status === 'done').length;
    const tasksTotal = tasks.length;
    const completedTasksWithTime = tasks.filter((t) => t.status === 'done' && t.elapsedTime > 0);
    const avgTime = completedTasksWithTime.length
      ? Math.round(
          completedTasksWithTime.reduce((acc, t) => acc + t.elapsedTime, 0) /
            completedTasksWithTime.length
        )
      : 225;

    const tokensTotal = agents.reduce((acc, a) => acc + a.metrics.tokensGenerated, 0);
    // Estimated cost: $2.50 per 1M tokens combined prompt/completion
    const cost = Number(((tokensTotal / 1_000_000) * 2.5).toFixed(2));

    return {
      activeAgents,
      totalAgents: agents.length,
      tasksDone,
      tasksTotal,
      successRate: 95.8,
      avgTimeSeconds: avgTime,
      totalCostUsd: Math.max(0.48, cost),
      tokensProcessed: tokensTotal,
    };
  },

  selectAgent: (agentId) => {
    set({ selectedAgentId: agentId });
    if (agentId && get().soundEnabled) playSound('blip');
  },

  focusAgent: (agentId) => {
    set({
      focusedAgentId: agentId,
      cameraPreset: agentId ? 'agent' : 'isometric',
    });
    if (agentId && get().soundEnabled) playSound('blip');
  },

  selectTask: (taskId) => {
    set({ selectedTaskId: taskId });
    if (taskId && get().soundEnabled) playSound('blip');
  },

  setHoveredAgent: (agentId) => {
    set({ hoveredAgentId: agentId });
  },

  setCameraPreset: (preset) => {
    set({
      cameraPreset: preset,
      focusedAgentId: preset === 'agent' ? get().focusedAgentId : null,
    });
  },

  toggleAutoRotate: () => {
    set((s) => ({ autoRotate: !s.autoRotate }));
  },

  toggleSimulation: (running) => {
    set((s) => ({
      simulationRunning: running !== undefined ? running : !s.simulationRunning,
    }));
  },

  setSimulationSpeed: (speed) => {
    set({ simulationSpeed: speed });
  },

  setSoundEnabled: (enabled) => {
    set({ soundEnabled: enabled });
  },

  setEventFilter: (filter) => {
    set({ eventFilter: filter });
  },

  setCreateTaskModalOpen: (open) => {
    set({ isCreateTaskModalOpen: open });
  },

  updateAgent: (agentId, updates) => {
    set((state) => ({
      agents: state.agents.map((ag) => (ag.id === agentId ? { ...ag, ...updates } : ag)),
    }));
  },

  moveTask: (taskId, targetStatus) => {
    const { soundEnabled, addEvent } = get();
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      const updatedTasks = state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: targetStatus,
              progress: targetStatus === 'done' ? 100 : t.progress,
            }
          : t
      );

      // Re-calculate mission completion
      const doneCount = updatedTasks.filter((t) => t.status === 'done').length;
      const progressPct = Math.round((doneCount / updatedTasks.length) * 100);

      return {
        tasks: updatedTasks,
        mission: {
          ...state.mission,
          tasksCompleted: doneCount,
          progress: progressPct,
        },
      };
    });

    const task = get().tasks.find((t) => t.id === taskId);
    if (task) {
      addEvent({
        type: targetStatus === 'done' ? 'complete' : 'progress',
        message: `Task ${task.key} moved to ${targetStatus.toUpperCase()}`,
        taskId: task.id,
        taskKey: task.key,
        agentId: task.assignedToAgentId || undefined,
      });
      if (soundEnabled) {
        playSound(targetStatus === 'done' ? 'complete' : 'blip');
      }
    }
  },

  addTask: (newTaskData) => {
    const count = get().tasks.length + 1;
    const taskKey = `TASK-${100 + count}`;
    const newTask: Task = {
      id: `task-${Date.now()}`,
      key: taskKey,
      title: newTaskData.title,
      description: newTaskData.description || 'Autonomous workforce micro-deliverable',
      status: newTaskData.status || 'pending',
      priority: newTaskData.priority || 'medium',
      assignedToAgentId: newTaskData.assignedToAgentId || null,
      model: newTaskData.model || 'DeepSeek-Coder-V2',
      progress: 0,
      startTime: null,
      elapsedTime: 0,
      estimatedTime: newTaskData.estimatedTime || 180,
      tags: newTaskData.tags || ['Feature'],
      artifacts: [],
      subtasks: newTaskData.subtasks || [
        { id: '1', text: 'Analyze requirements', completed: false },
        { id: '2', text: 'Generate implementation', completed: false },
        { id: '3', text: 'Verify tests and edge cases', completed: false },
      ],
    };

    set((state) => ({
      tasks: [newTask, ...state.tasks],
      mission: {
        ...state.mission,
        tasksTotal: state.tasks.length + 1,
      },
    }));

    get().addEvent({
      type: 'start',
      message: `New task ${taskKey} created: "${newTask.title}"`,
      taskId: newTask.id,
      taskKey,
    });
    if (get().soundEnabled) playSound('chime');
  },

  addEvent: (evt) => {
    const newEvent: OfficeEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: getFormattedTime(),
      timeMs: Date.now(),
      type: evt.type,
      message: evt.message,
      agentId: evt.agentId,
      taskId: evt.taskId,
      taskKey: evt.taskKey,
      details: evt.details,
    };

    set((state) => ({
      events: [newEvent, ...state.events].slice(0, 80), // keep latest 80 events
    }));
  },

  clearEvents: () => {
    set({ events: [] });
  },

  stepSimulation: () => {
    const state = get();
    const { agents, tasks } = state;

    const runningAgents = agents.filter((a) => a.status !== 'idle' && a.status !== 'blocked');
    const idleAgents = agents.filter((a) => a.status === 'idle');
    const blockedAgents = agents.filter((a) => a.status === 'blocked');
    const pendingTasks = tasks.filter((t) => t.status === 'pending');
    const runningTasks = tasks.filter((t) => t.status === 'running');
    const reviewTasks = tasks.filter((t) => t.status === 'review');

    // --- 1. RESOLVE BLOCKED AGENTS AUTONOMOUSLY (Architect unblocks) ---
    if (blockedAgents.length > 0 && Math.random() > 0.4) {
      const blocked = blockedAgents[0];
      const architect = agents.find((a) => a.role === 'architect');
      get().updateAgent(blocked.id, {
        status: 'coding',
        idleActivity: 'standby',
        locationState: 'at_desk',
        currentThought: '✓ Dependency contract disetujui oleh Architect Dr. Marcus Chen. Melanjutkan eksekusi di meja...',
        currentAction: 'Menulis patch dan validasi endpoint handler di meja kerja',
      });
      state.addEvent({
        type: 'complete',
        message: `✓ Architect Dr. Marcus Chen menyetujui RFC dan membuka blokir ${blocked.name}`,
        agentId: blocked.id,
        details: 'Subnet proxy whitelist diterapkan ke gateway.',
      });
      return;
    }

    // --- 2. ADVANCE ACTIVE WORKERS IN REAL TIME ---
    if (runningAgents.length > 0) {
      const luckyAgent = runningAgents[Math.floor(Math.random() * runningAgents.length)];
      const deltaProgress = Math.floor(Math.random() * 8) + 4;
      const newProgress = Math.min(100, luckyAgent.progress + deltaProgress);
      const newTokens = luckyAgent.metrics.tokensGenerated + Math.floor(Math.random() * 260) + 140;

      // Update associated task if exists
      let taskCompleted = false;
      if (luckyAgent.currentTaskId) {
        const associatedTask = tasks.find((t) => t.id === luckyAgent.currentTaskId);
        if (associatedTask) {
          if (newProgress >= 100) {
            taskCompleted = true;
            // Workflow handoff: if developer finished, send to review!
            const nextStatus: TaskStatus =
              luckyAgent.role === 'developer' ? 'review' : 'done';
            state.moveTask(associatedTask.id, nextStatus);

            state.addEvent({
              type: nextStatus === 'done' ? 'complete' : 'progress',
              message: `${luckyAgent.name} menyelesaikan ${associatedTask.key} (Beralih ke ${nextStatus.toUpperCase()})`,
              agentId: luckyAgent.id,
              taskId: associatedTask.id,
              taskKey: associatedTask.key,
            });

            // Relieve current agent into casual idle break leaving the desk
            const casualActivities: ('coffee' | 'phone' | 'stretch' | 'nap')[] = [
              'coffee',
              'phone',
              'stretch',
              'nap',
            ];
            const nextActivity =
              casualActivities[Math.floor(Math.random() * casualActivities.length)];
            const nextLocation: AgentLocation =
              nextActivity === 'coffee'
                ? 'coffee_bar'
                : nextActivity === 'stretch'
                ? 'walking'
                : 'lounge';

            get().updateAgent(luckyAgent.id, {
              status: 'idle',
              idleActivity: nextActivity,
              locationState: nextLocation,
              currentTask: null,
              currentTaskId: null,
              progress: 0,
              elapsedTime: 0,
              currentThought:
                nextActivity === 'coffee'
                  ? '☕ Tugas selesai. Berjalan ke coffee bar menikmati espresso hangat...'
                  : nextActivity === 'phone'
                  ? '📱 Tugas selesai. Duduk santai di sofa lounge membaca referensi di smartphone...'
                  : nextActivity === 'stretch'
                  ? '🚶‍♂️ Tugas selesai. Mondar-mandir jalan santai di lorong meregangkan kaki...'
                  : '😴 Tugas selesai. Duduk rileks di lounge memulihkan energi kognitif (Zzz)...',
              currentAction:
                nextActivity === 'coffee'
                  ? 'Pergi ke coffee bar (Coffee Break)'
                  : nextActivity === 'phone'
                  ? 'Duduk di sofa lounge cek ponsel'
                  : nextActivity === 'stretch'
                  ? 'Mondar-mandir jalan santai'
                  : 'Istirahat santai di sofa lounge',
              metrics: {
                ...luckyAgent.metrics,
                tasksCompleted: luckyAgent.metrics.tasksCompleted + 1,
                tokensGenerated: newTokens,
              },
            });

            // If task went to review, dispatch Reviewer agent automatically if available!
            if (nextStatus === 'review') {
              const reviewerAgent = agents.find((a) => a.role === 'reviewer');
              if (reviewerAgent && reviewerAgent.status === 'idle') {
                get().updateAgent(reviewerAgent.id, {
                  status: 'reviewing',
                  idleActivity: 'standby',
                  locationState: 'at_desk',
                  currentTask: `Audit PR untuk ${associatedTask.key}`,
                  currentTaskId: associatedTask.id,
                  progress: 20,
                  currentThought: `🔍 Kembali ke meja kerja: Membaca AST diff & security checklist ${associatedTask.key}...`,
                  currentAction: `Melakukan code review ${associatedTask.key} di meja`,
                });
                state.addEvent({
                  type: 'start',
                  message: `Eleanor Wright (Reviewer) kembali ke meja untuk mengaudit ${associatedTask.key}`,
                  agentId: reviewerAgent.id,
                  taskId: associatedTask.id,
                  taskKey: associatedTask.key,
                });
              }
            }
            return;
          } else {
            // Update task progress in sync
            set((s) => ({
              tasks: s.tasks.map((t) =>
                t.id === luckyAgent.currentTaskId ? { ...t, progress: newProgress } : t
              ),
            }));
          }
        }
      }

      if (!taskCompleted) {
        // Dynamic realistic cognitive thoughts based on role
        let nextThought = 'Mengoptimalkan AST bytecode dan validasi schema...';
        if (luckyAgent.role === 'developer') {
          const devThoughts = [
            'Menulis unit tests crypto di /src/auth/jwt.service.ts...',
            'Menyusun skema JWKS asymmetric public key rotation...',
            'Memvalidasi batas clock skew leeway toleransi 5 detik...',
            'Mengoptimalkan bytecode traversal dan garbage collection...',
          ];
          nextThought = devThoughts[Math.floor(Math.random() * devThoughts.length)];
        } else if (luckyAgent.role === 'reviewer') {
          const revThoughts = [
            'Memeriksa CWE-208 timing discrepancy pada token comparison...',
            'Validasi sanitasi header X-Forwarded-For...',
            'Memeriksa kesesuaian typing strict mode TypeScript...',
          ];
          nextThought = revThoughts[Math.floor(Math.random() * revThoughts.length)];
        } else if (luckyAgent.role === 'tester') {
          const testThoughts = [
            'Menjalankan batch fuzzing #4,200: 0 uncaught exceptions...',
            'Menguji concurrent replay attack race condition...',
            'Evaluasi cakupan test coverage (94.8% statement coverage)...',
          ];
          nextThought = testThoughts[Math.floor(Math.random() * testThoughts.length)];
        }

        get().updateAgent(luckyAgent.id, {
          progress: newProgress,
          elapsedTime: luckyAgent.elapsedTime + 4,
          currentThought: nextThought,
          metrics: {
            ...luckyAgent.metrics,
            tokensGenerated: newTokens,
          },
        });

        if (Math.random() > 0.6) {
          state.addEvent({
            type: 'progress',
            message: `${luckyAgent.name}: ${nextThought.slice(0, 48)}... [${newProgress}%]`,
            agentId: luckyAgent.id,
          });
        }
      }
    }

    // --- 3. AUTONOMOUS DISPATCH: Idle developer takes pending task ---
    if (idleAgents.length > 0 && pendingTasks.length > 0) {
      // Prefer developer or devops for pending engineering tasks
      const devCandidate =
        idleAgents.find((a) => a.role === 'developer' || a.role === 'devops') ||
        idleAgents[0];
      const nextTask = pendingTasks[0];

      get().updateAgent(devCandidate.id, {
        status: devCandidate.role === 'reviewer' ? 'reviewing' : devCandidate.role === 'tester' ? 'testing' : 'coding',
        idleActivity: 'standby',
        locationState: 'at_desk',
        currentTask: nextTask.title,
        currentTaskId: nextTask.id,
        progress: 8,
        elapsedTime: 1,
        currentThought: `Kembali ke meja kerja: Memulai ${nextTask.key} (${nextTask.title})...`,
        currentAction: `Menulis kode untuk ${nextTask.title} di meja kerja`,
      });

      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === nextTask.id
            ? {
                ...t,
                status: 'running',
                assignedToAgentId: devCandidate.id,
                startTime: Date.now(),
                progress: 8,
              }
            : t
        ),
      }));

      state.addEvent({
        type: 'start',
        message: `▶ ${nextTask.key} ditugaskan ke ${devCandidate.name} (kembali ke meja kerja)`,
        agentId: devCandidate.id,
        taskId: nextTask.id,
        taskKey: nextTask.key,
      });
      if (state.soundEnabled) playSound('blip');
      return;
    }

    // --- 4. REVIEW TASK COMPLETION ---
    if (reviewTasks.length > 0 && Math.random() > 0.6) {
      const revTask = reviewTasks[0];
      state.moveTask(revTask.id, 'done');
      return;
    }

    // --- 5. NATURAL IDLE ACTIVITY & OFFICE EXPLORATION (Agents leave desks, wander & socialize) ---
    if (idleAgents.length >= 2 && Math.random() > 0.5) {
      // SOCIAL INTERACTION: Pair of idle agents meet and chat!
      const candA = idleAgents[0];
      const candB = idleAgents[1];

      get().updateAgent(candA.id, {
        locationState: 'chatting',
        idleActivity: 'standby',
        currentThought: `💬 Berdiskusi dengan ${candB.name} tentang optimasi performa & arsitektur...`,
        currentAction: `Mengobrol dengan ${candB.name} di collaboration table`,
      });
      get().updateAgent(candB.id, {
        locationState: 'chatting',
        idleActivity: 'standby',
        currentThought: `💬 Berbagi wawasan dengan ${candA.name} di collaboration table...`,
        currentAction: `Mengobrol dengan ${candA.name} di collaboration table`,
      });

      state.addEvent({
        type: 'message',
        message: `💬 ${candA.name} & ${candB.name} bertemu dan berdiskusi di collaboration table`,
        agentId: candA.id,
      });
      return;
    }

    if (idleAgents.length > 0 && Math.random() > 0.4) {
      const candidate = idleAgents[Math.floor(Math.random() * idleAgents.length)];
      const locationsPool: { act: IdleActivity; loc: AgentLocation; thought: string; action: string }[] = [
        {
          act: 'coffee',
          loc: 'coffee_bar',
          thought: '☕ Berjalan ke coffee bar menikmati espresso hangat...',
          action: 'Berdiri di coffee bar menikmati kopi',
        },
        {
          act: 'phone',
          loc: 'lounge',
          thought: '📱 Duduk santai di sofa lounge mengecek dokumentasi di ponsel...',
          action: 'Duduk santai di sofa lounge',
        },
        {
          act: 'stretch',
          loc: 'walking',
          thought: '🚶‍♂️ Mondar-mandir jalan santai di lorong meregangkan kaki & pikiran...',
          action: 'Mondar-mandir santai di lorong kantor',
        },
        {
          act: 'standby',
          loc: 'whiteboard',
          thought: '📋 Mempelajari diagram arsitektur sistem pada whiteboard...',
          action: 'Berdiri menganalisis whiteboard',
        },
      ];

      const choice = locationsPool[Math.floor(Math.random() * locationsPool.length)];

      get().updateAgent(candidate.id, {
        idleActivity: choice.act,
        locationState: choice.loc,
        currentThought: choice.thought,
        currentAction: choice.action,
      });

      if (Math.random() > 0.7) {
        state.addEvent({
          type: 'message',
          message: `${candidate.name}: ${choice.action}`,
          agentId: candidate.id,
        });
      }
    }
  },

  resetSimulation: () => {
    set({
      agents: INITIAL_AGENTS,
      tasks: INITIAL_TASKS,
      events: INITIAL_EVENTS,
      mission: INITIAL_MISSION,
      selectedAgentId: null,
      selectedTaskId: null,
      focusedAgentId: null,
      cameraPreset: 'isometric',
    });
    get().addEvent({
      type: 'message',
      message: 'Office simulator reset to initial state benchmark.',
    });
  },

  triggerEscalation: () => {
    const { agents, addEvent, updateAgent, soundEnabled } = get();
    const candidate = agents.find((a) => a.status === 'coding' || a.status === 'testing');
    if (!candidate) return;

    updateAgent(candidate.id, {
      status: 'blocked',
      currentThought: '⚠️ ESCALATION: Upstream schema contract mismatch detected! Awaiting architect approval.',
      currentAction: 'Blocked by dependency on /api/v1/jwks endpoint failure',
    });

    addEvent({
      type: 'escalation',
      message: `⚠️ ESCALATION: ${candidate.name} is BLOCKED on ${candidate.currentTask || 'task execution'}!`,
      agentId: candidate.id,
      details: 'Critical dependency failure reported. Alert sent to Dr. Marcus Chen (Architect).',
    });

    if (soundEnabled) playSound('alert');
  },

  resolveEscalation: () => {
    const { agents, addEvent, updateAgent, soundEnabled } = get();
    const blockedAgent = agents.find((a) => a.status === 'blocked');
    if (!blockedAgent) return;

    updateAgent(blockedAgent.id, {
      status: 'coding',
      currentThought: '✓ Blocker resolved by Architect approval. Resuming code execution...',
      currentAction: 'Compiling patched endpoint handler',
    });

    addEvent({
      type: 'complete',
      message: `✓ Blocker resolved for ${blockedAgent.name} by Systems Architect!`,
      agentId: blockedAgent.id,
      details: 'CIDR header subnet whitelisted in reverse proxy configuration.',
    });

    if (soundEnabled) playSound('chime');
  },

  injectBugTest: () => {
    const { addTask, addEvent, soundEnabled } = get();
    addTask({
      title: 'Fix Race Condition in Distributed Token Blacklist',
      description: 'Simulated high-concurrency race condition causing token replay during node failover.',
      priority: 'critical',
      tags: ['Bug', 'Hotfix', 'Redis'],
      estimatedTime: 120,
    });

    addEvent({
      type: 'error',
      message: '🚨 INCIDENT INJECTED: Race condition in Distributed Token Blacklist reported on production canary!',
      details: 'Automated test suite flagged 2 dirty reads out of 50,000 requests.',
    });

    if (soundEnabled) playSound('alert');
  },
}));
