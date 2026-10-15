import { create } from 'zustand';
import { executeAgentTaskStep, decomposeMissionWithPM } from '../lib/aiClient';
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

  // Mission & Decomposing with Product Manager
  createMissionDecomposed: (goal: string, requirements?: string) => Promise<void>;

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

// OPT-03: Singleton AudioContext — prevents memory leak from creating a new
// AudioContext per playSound() call. Each leaked context = ~2-5 MB.
let sharedAudioCtx: AudioContext | null = null;

// Play brief web audio synthesized feedback
export const playSound = (type: 'blip' | 'chime' | 'alert' | 'complete') => {
  try {
    if (!sharedAudioCtx) {
      sharedAudioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
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

  createMissionDecomposed: async (goal: string, requirements?: string) => {
    const { agents, addEvent, addTask, updateAgent, soundEnabled } = get();
    const pmAgent = agents.find((a) => a.role === 'product_manager') || agents[0];

    // 1. Set Product Manager status into planning
    if (pmAgent) {
      updateAgent(pmAgent.id, {
        status: 'planning',
        locationState: 'at_desk',
        idleActivity: 'standby',
        currentTask: `Analyzing PRD: ${goal.slice(0, 40)}...`,
        currentThought: `🎯 Product Manager mengurai Mission: "${goal}" menjadi sub-task tim teknis...`,
        currentAction: 'Menjalankan inferensi Product Manager AI via 9Router Gateway',
      });
    }

    addEvent({
      type: 'start',
      message: `🎯 [PM] ${pmAgent?.name || 'Product Manager'} memulai dekomposisi misi: "${goal}"`,
      agentId: pmAgent?.id,
      details: 'Mengurai PRD menjadi spesifikasi tugas terarah untuk Frontend, Backend, dan Intern.',
    });
    if (soundEnabled) playSound('blip');

    try {
      // 2. Panggil 9Router AI untuk memecah misi
      const result = await decomposeMissionWithPM({
        missionGoal: goal,
        requirements,
        model: pmAgent?.model || 'Architect',
      });

      // 3. Masukkan sub-task ke Kanban & Store
      result.tasks.forEach((t, idx) => {
        // Cari agen yang cocok dengan role task
        const matchedAgent = agents.find((a) => a.role === t.role);

        addTask({
          title: t.title,
          description: t.description,
          priority: t.priority,
          assignedToAgentId: matchedAgent?.id || null,
          model: matchedAgent?.model || 'Daily',
          estimatedTime: t.estimatedTime || 180,
          tags: t.tags || [t.role.toUpperCase()],
          subtasks: [
            { id: `st-${idx}-1`, text: 'Spesifikasi & kontrak arsitektur', completed: false },
            { id: `st-${idx}-2`, text: 'Implementasi kode solusi', completed: false },
            { id: `st-${idx}-3`, text: 'Validasi testing & code review', completed: false },
          ],
        });

        // 3B. Otomatis daftarkan task ke GitHub Issues (dengan Security Gate & Rich Metadata)
        fetch('/api/backend/intern/github-issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: t.title,
            body: `### Deskripsi Tugas\n${t.description}\n\n- **Role Assigned**: \`${t.role}\`\n- **Priority**: \`${t.priority}\`\n- **Status**: Pending Execution`,
            role: t.role,
            assignees: ['Inineo'],
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res.issue_url) {
              addEvent({
                type: 'artifact',
                message: `🐙 Mendaftarkan issue GitHub: "${t.title}"`,
                details: res.issue_url,
              });
            } else if (res.is_sensitive) {
              console.log('Task disaring oleh Security Gate (Private):', t.title);
            }
          })
          .catch(() => {});
      });

      // 4. Update PM kembali ke idle / monitoring
      if (pmAgent) {
        updateAgent(pmAgent.id, {
          status: 'idle',
          currentThought: `✓ Berhasil memecah misi menjadi ${result.tasks.length} tiket sprint aktif.`,
          currentAction: 'Memantau eksekusi engineer di dashboard',
        });
      }

      addEvent({
        type: 'complete',
        message: `✓ [PM DECOMPOSITION COMPLETED]: ${result.tasks.length} tugas baru siap dikerjakan tim!`,
        agentId: pmAgent?.id,
        details: result.epicSummary,
      });
      if (soundEnabled) playSound('complete');
    } catch (err) {
      console.error('Error decomposing mission:', err);
      if (pmAgent) {
        updateAgent(pmAgent.id, {
          status: 'idle',
          currentThought: '⚠️ Gagal menghubungi 9Router, fallback ke manual backlog.',
          currentAction: 'Standby di meja kerja',
        });
      }
      addEvent({
        type: 'error',
        message: 'Gagal memecah misi secara otomatis via 9Router.',
        details: String(err),
      });
    }
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

    // --- 2. ADVANCE ACTIVE WORKERS IN PARALLEL (Multi-Agent Concurrent Execution) ---
    if (runningAgents.length > 0) {
      // Advance each running agent in parallel
      for (const luckyAgent of runningAgents) {
        const deltaProgress = Math.floor(Math.random() * 7) + 5;
        const newProgress = Math.min(100, luckyAgent.progress + deltaProgress);
        const newTokens = luckyAgent.metrics.tokensGenerated + Math.floor(Math.random() * 200) + 100;

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
            continue;
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
        // Trigger real AI call to 9Router asynchronously to generate thoughts and actions
        if (luckyAgent.currentTaskId && Math.random() > 0.5) {
          const associatedTask = tasks.find((t) => t.id === luckyAgent.currentTaskId);
          if (associatedTask) {
            executeAgentTaskStep({
              agentName: luckyAgent.name,
              agentRole: luckyAgent.role,
              agentModel: luckyAgent.model,
              taskTitle: associatedTask.title,
              taskDescription: associatedTask.description,
              taskKey: associatedTask.key,
              stage: luckyAgent.role === 'developer' ? 'implement' : luckyAgent.role === 'reviewer' ? 'review' : 'plan',
            })
              .then((aiRes) => {
                get().updateAgent(luckyAgent.id, {
                  currentThought: `🤖 [9Router AI]: ${aiRes.thought}`,
                  currentAction: aiRes.action,
                  metrics: {
                    ...luckyAgent.metrics,
                    tokensGenerated: luckyAgent.metrics.tokensGenerated + aiRes.tokensGenerated,
                  },
                });

                if (aiRes.artifactCode) {
                  set((s) => ({
                    tasks: s.tasks.map((t) =>
                      t.id === associatedTask.id
                        ? {
                            ...t,
                            artifacts: [
                              ...(t.artifacts || []),
                              {
                                name: `${associatedTask.key}_output.ts`,
                                type: 'code' as const,
                                path: `/artifacts/${associatedTask.key}_output.ts`,
                              },
                            ],
                          }
                        : t
                    ),
                  }));
                }
              })
              .catch((err) => {
                console.warn('Fallback simulation due to 9Router error:', err);
              });
          }
        }

        // Dynamic realistic cognitive thoughts based on role
        let nextThought = 'Mengoptimalkan AST bytecode dan validasi schema...';
        if (luckyAgent.role === 'product_manager') {
          const pmThoughts = [
            'Meninjau user journey funnel dan acceptance criteria sprint...',
            'Menyelaraskan OKR tim engineering dengan roadmap produk...',
            'Menganalisis feedback pengguna dan memecah tiket epics...',
          ];
          nextThought = pmThoughts[Math.floor(Math.random() * pmThoughts.length)];
        } else if (luckyAgent.role === 'frontend') {
          const feThoughts = [
            'Mengoptimalkan render pipeline komponen React dan state hook...',
            'Menyempurnakan responsive layout dan estetika antarmuka UI...',
            'Membangun Three.js scene canvas shader dan material visual...',
            'Menghubungkan websocket store ke visual reactive board...',
          ];
          nextThought = feThoughts[Math.floor(Math.random() * feThoughts.length)];
        } else if (luckyAgent.role === 'backend' || luckyAgent.role === 'developer') {
          const devThoughts = [
            'Menulis unit tests crypto di /src/auth/jwt.service.ts...',
            'Menyusun skema JWKS asymmetric public key rotation...',
            'Memvalidasi batas clock skew leeway toleransi 5 detik...',
            'Mengoptimalkan bytecode traversal dan garbage collection...',
          ];
          nextThought = devThoughts[Math.floor(Math.random() * devThoughts.length)];
        } else if (luckyAgent.role === 'intern') {
          const internThoughts = [
            'Mempelajari modul codebase dan membuat regression tests...',
            'Membantu memvalidasi edge-case error boundary dan logging...',
            'Menulis dokumentasi panduan onboarding developer junior...',
          ];
          nextThought = internThoughts[Math.floor(Math.random() * internThoughts.length)];
        } else if (luckyAgent.role === 'reviewer') {
          const revThoughts = [
            'Memeriksa CWE-208 timing discrepancy pada token comparison...',
            'Validasi sanitasi header X-Forwarded-For...',
            'Memeriksa kesesuaian typing strict mode TypeScript...',
          ];
          nextThought = revThoughts[Math.floor(Math.random() * revThoughts.length)];
        } else if (luckyAgent.role === 'qa' || luckyAgent.role === 'tester') {
          const testThoughts = [
            'Menjalankan audit kerentanan Strix Autonomous Security Scanner...',
            'Strix memindai CWE/OWASP edge-case & boundary limits via 9Router...',
            'Menjalankan pen-testing dinamis & fuzz testing pada API endpoints...',
            'Evaluasi cakupan test coverage & validasi zero-day vulnerability...',
          ];
          nextThought = testThoughts[Math.floor(Math.random() * testThoughts.length)];

          // Panggil Strix scan di background secara asynchronous (10% chance per tick)
          if (Math.random() > 0.88) {
            fetch('/api/backend/qa/strix-scan', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: luckyAgent.model,
                task_id: luckyAgent.currentTaskId,
              }),
            })
              .then((r) => r.json())
              .then((res) => {
                if (res.summary) {
                  state.addEvent({
                    type: 'progress',
                    message: `🛡️ [STRIX QA]: ${res.summary}`,
                    agentId: luckyAgent.id,
                  });
                }
              })
              .catch(() => {});
          }
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
  }

    // --- 3. AUTONOMOUS DISPATCH: Direct task assignment to matching Role Agents in Parallel ---
    if (idleAgents.length > 0 && pendingTasks.length > 0) {
      let availableIdleAgents = [...idleAgents];
      const tasksToAssign = [...pendingTasks];

      for (const targetTask of tasksToAssign) {
        if (availableIdleAgents.length === 0) break;

        let devCandidate: typeof availableIdleAgents[0] | undefined;
        if (targetTask.assignedToAgentId) {
          devCandidate = availableIdleAgents.find((a) => a.id === targetTask.assignedToAgentId);
        }
        if (!devCandidate) {
          // Find matching role based on tags or title
          devCandidate = availableIdleAgents.find((a) =>
            (targetTask.tags && targetTask.tags.some((tag) => tag.toLowerCase() === a.role.toLowerCase())) ||
            targetTask.title.toLowerCase().includes(`[${a.role.toLowerCase()}]`)
          );
        }
        if (!devCandidate) {
          // Fallback to suitable role if no direct match
          devCandidate = availableIdleAgents.find(
            (a) => a.role === 'researcher' || a.role === 'frontend' || a.role === 'backend' || a.role === 'qa' || a.role === 'intern'
          );
        }

        if (devCandidate) {
          const candidateId = devCandidate.id;
          availableIdleAgents = availableIdleAgents.filter((a) => a.id !== candidateId);

          get().updateAgent(candidateId, {
            status:
              devCandidate.role === 'researcher'
                ? 'reviewing'
                : devCandidate.role === 'qa' || devCandidate.role === 'tester'
                ? 'testing'
                : devCandidate.role === 'reviewer'
                ? 'reviewing'
                : 'coding',
            idleActivity: 'standby',
            locationState: 'at_desk',
            currentTask: targetTask.title,
            currentTaskId: targetTask.id,
            progress: 8,
            elapsedTime: 1,
            currentThought: `Kembali ke meja kerja: Memulai ${targetTask.key} (${targetTask.title})...`,
            currentAction: `Menulis kode untuk ${targetTask.title} di meja kerja`,
          });

          set((s) => ({
            tasks: s.tasks.map((t) =>
              t.id === targetTask.id
                ? {
                    ...t,
                    status: 'running',
                    assignedToAgentId: candidateId,
                    startTime: Date.now(),
                    progress: 8,
                  }
                : t
            ),
          }));

          state.addEvent({
            type: 'start',
            message: `▶ ${targetTask.key} ditugaskan ke ${devCandidate.name} (kembali ke meja kerja)`,
            agentId: candidateId,
            taskId: targetTask.id,
            taskKey: targetTask.key,
          });
          if (state.soundEnabled) playSound('blip');
        }
      }
    }

    // --- 4. REVIEW TASK COMPLETION ---
    if (reviewTasks.length > 0 && Math.random() > 0.6) {
      const revTask = reviewTasks[0];
      state.moveTask(revTask.id, 'done');
      return;
    }

    // --- 5. NATURAL IDLE ACTIVITY & OFFICE EXPLORATION (Agents leave desks, wander & socialize) ---
    if (idleAgents.length >= 2 && Math.random() > 0.5) {
      // SOCIAL INTERACTION: Pair of idle agents meet and chat! (Hanya animasi visual di 3D, tidak dicatat ke log aktivitas)
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
      // Catatan: Aktivitas santai/idle seperti kopi atau istirahat tidak dicatat ke log aktivitas
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
