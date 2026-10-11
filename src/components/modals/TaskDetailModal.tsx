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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header - Monochrome Minimalist */}
        <div className="p-4 border-b border-zinc-850 bg-black flex items-center justify-between font-mono">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-900 text-zinc-100 border border-zinc-750">
              {task.key}
            </span>
            <span className="text-xs uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
              PRIORITAS: {task.priority}
            </span>
          </div>

          <button
            onClick={() => selectTask(null)}
            className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
          <div>
            <h2 className="text-sm font-bold text-white mb-2 leading-snug">{task.title}</h2>
            <p className="text-zinc-300 leading-relaxed bg-black p-3 rounded-lg border border-zinc-850">
              {task.description}
            </p>
          </div>

          {/* Workflow Status Mover */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] uppercase text-zinc-400 font-bold">
              STATUS ALUR TUGAS
            </div>
            <div className="grid grid-cols-4 gap-2">
              {statusOptions.map((st) => (
                <button
                  key={st.key}
                  onClick={() => moveTask(task.id, st.key)}
                  className={`py-1.5 rounded-lg text-xs font-mono transition cursor-pointer border ${
                    task.status === st.key
                      ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                      : 'bg-black hover:bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Agent & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3">
              <div className="text-[9px] uppercase text-zinc-400 mb-1">AGEN PENANGGUNG JAWAB</div>
              {assignedAgent ? (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white text-xs">{assignedAgent.name}</div>
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
                    className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded"
                    title="Lihat Meja Agen"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="text-zinc-500 italic">Unassigned (In queue)</div>
              )}
            </div>

            <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3">
              <div className="text-[9px] uppercase text-zinc-400 mb-1">MODEL LLM</div>
              <div className="text-zinc-200 font-semibold text-xs mt-1">
                {task.model || 'Auto-allocated'}
              </div>
            </div>
          </div>

          {/* Subtasks Checklist */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-zinc-400 font-bold">
                SUBTASKS CHECKLIST ({task.subtasks.filter((s) => s.completed).length}/
                {task.subtasks.length})
              </span>
              <span className="text-zinc-200 font-bold">{task.progress}%</span>
            </div>

            <div className="space-y-1.5">
              {task.subtasks.map((st) => (
                <button
                  key={st.id}
                  onClick={() => toggleSubtask(st.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-black hover:bg-zinc-900 text-left border border-zinc-850 transition cursor-pointer"
                >
                  {st.completed ? (
                    <CheckSquare className="w-4 h-4 text-zinc-100 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600 shrink-0" />
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
