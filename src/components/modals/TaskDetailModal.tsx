import React from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { TaskStatus } from '../../types/office';
import {
  X,
  Kanban,
  CheckSquare,
  Square,
  FileCode2,
  Clock,
  Bot,
  Tag,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const TaskDetailModal: React.FC = () => {
  const {
    tasks,
    agents,
    selectedTaskId,
    selectTask,
    moveTask,
    focusAgent,
    selectAgent,
  } = useOfficeStore();

  const task = tasks.find((t) => t.id === selectedTaskId);
  if (!task) return null;

  const assignedAgent = agents.find((a) => a.id === task.assignedToAgentId);

  const toggleSubtask = (subId: string) => {
    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subId ? { ...st, completed: !st.completed } : st
    );
    const completedCount = updatedSubtasks.filter((st) => st.completed).length;
    const progress = Math.round((completedCount / updatedSubtasks.length) * 100);

    useOfficeStore.setState((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id
          ? {
              ...t,
              subtasks: updatedSubtasks,
              progress,
              status: progress === 100 ? 'done' : t.status,
            }
          : t
      ),
    }));
  };

  const statusOptions: { key: TaskStatus; label: string }[] = [
    { key: 'pending', label: 'Menunggu' },
    { key: 'running', label: 'Dikerjakan' },
    { key: 'review', label: 'Review' },
    { key: 'done', label: 'Selesai' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 font-mono">
      <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shrink-0">
              <Kanban className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs tracking-wide text-zinc-100 uppercase">
                  {task.key}
                </span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-400">
                  {task.priority}
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-400 truncate max-w-sm">
                Detail tiket tugas & acceptance criteria
              </p>
            </div>
          </div>

          <button
            onClick={() => selectTask(null)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 mb-2 leading-snug">{task.title}</h2>
            <div className="text-zinc-300 leading-relaxed bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
              {task.description}
            </div>
          </div>

          {/* Workflow Status Segmented Control */}
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500 mb-1.5 block">
              Status Alur Tugas
            </span>
            <div className="grid grid-cols-4 gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
              {statusOptions.map((st) => (
                <button
                  key={st.key}
                  onClick={() => moveTask(task.id, st.key)}
                  className={`h-8 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center ${
                    task.status === st.key
                      ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                      : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Agent & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1 font-medium">
                Agen Penanggung Jawab
              </div>
              {assignedAgent ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-zinc-100 text-xs">{assignedAgent.name}</div>
                    <div className="text-[10px] text-zinc-400 uppercase">
                      {assignedAgent.role}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      focusAgent(assignedAgent.id);
                      selectAgent(assignedAgent.id);
                      selectTask(null);
                    }}
                    className="h-6 w-6 flex items-center justify-center hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition cursor-pointer"
                    title="Lihat Meja Agen"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-zinc-500 italic text-[11px]">Antrean Umum (Pending)</div>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wide text-zinc-500 mb-1 font-medium">
                Model LLM
              </div>
              <div className="text-zinc-200 font-medium text-xs mt-1">
                {task.model || 'Auto-allocated'}
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wide text-zinc-500 font-medium">
                Subtasks Checklist ({task.subtasks.filter((s) => s.completed).length}/
                {task.subtasks.length})
              </span>
              <span className="text-zinc-200 font-semibold">{task.progress}%</span>
            </div>

            <div className="space-y-1.5">
              {task.subtasks.map((st) => (
                <button
                  key={st.id}
                  onClick={() => toggleSubtask(st.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-md bg-zinc-900/60 hover:bg-zinc-900 text-left border border-zinc-800 transition cursor-pointer"
                >
                  {st.completed ? (
                    <CheckSquare className="w-3.5 h-3.5 text-zinc-100 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  )}
                  <span className={`text-xs ${st.completed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                    {st.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
