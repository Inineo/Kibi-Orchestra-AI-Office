import React, { useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { Task, TaskStatus } from '../../types/office';
import {
  Kanban,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Bot,
  AlertCircle,
  FileCode2,
  Plus,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface ColumnDef {
  key: TaskStatus;
  title: string;
  color: string;
  borderClass: string;
  bgClass: string;
}

const COLUMNS: ColumnDef[] = [
  {
    key: 'pending',
    title: 'PENDING',
    color: '#94A3B8',
    borderClass: 'border-slate-700',
    bgClass: 'bg-slate-900/60',
  },
  {
    key: 'running',
    title: 'RUNNING',
    color: '#3B82F6',
    borderClass: 'border-blue-700/60',
    bgClass: 'bg-blue-950/20',
  },
  {
    key: 'review',
    title: 'REVIEW',
    color: '#F59E0B',
    borderClass: 'border-amber-700/60',
    bgClass: 'bg-amber-950/20',
  },
  {
    key: 'done',
    title: 'DONE',
    color: '#10B981',
    borderClass: 'border-emerald-700/60',
    bgClass: 'bg-emerald-950/20',
  },
];

const PRIORITY_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', text: 'text-rose-400', label: 'CRIT' },
  high: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', text: 'text-amber-400', label: 'HIGH' },
  medium: { bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', text: 'text-indigo-400', label: 'MED' },
  low: { bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30', text: 'text-slate-400', label: 'LOW' },
};

export const TaskBoard: React.FC<{ isCollapsed: boolean; onToggleCollapse: () => void }> = ({
  isCollapsed,
  onToggleCollapse,
}) => {
  const { tasks, agents, moveTask, selectTask, setCreateTaskModalOpen } = useOfficeStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgent =
      selectedAgentFilter === 'all' || t.assignedToAgentId === selectedAgentFilter;
    return matchesSearch && matchesAgent;
  });

  const getAgent = (agentId: string | null) => {
    if (!agentId) return null;
    return agents.find((a) => a.id === agentId);
  };

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'pending') return 'running';
    if (current === 'running') return 'review';
    if (current === 'review') return 'done';
    return null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'done') return 'review';
    if (current === 'review') return 'running';
    if (current === 'running') return 'pending';
    return null;
  };

  if (isCollapsed) {
    return (
      <aside className="w-12 bg-slate-900 border-l border-slate-800 flex flex-col items-center py-4 text-slate-400 select-none z-20">
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-slate-800 hover:text-white rounded-lg transition mb-6"
          title="Expand Task Board"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex-1 flex flex-col items-center gap-6">
          <div className="[writing-mode:vertical-rl] rotate-180 text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Kanban className="w-3.5 h-3.5 rotate-90 text-indigo-400" /> Task Board ({tasks.length})
          </div>

          <div className="flex flex-col gap-2 mt-4 text-[10px] font-mono text-center">
            {COLUMNS.map((col) => {
              const count = tasks.filter((t) => t.status === col.key).length;
              return (
                <div
                  key={col.key}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                  style={{ backgroundColor: `${col.color}20`, border: `1px solid ${col.color}50` }}
                  title={`${col.title}: ${count}`}
                >
                  {count}
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 md:w-96 lg:w-[420px] bg-slate-900/95 backdrop-blur-md border-l border-slate-800 flex flex-col h-full select-none z-20 shadow-2xl">
      {/* Board Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Kanban className="w-4 h-4 text-indigo-400" />
          <h2 className="font-semibold text-sm text-white">Workforce Task Board</h2>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            {tasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="p-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg text-xs transition flex items-center gap-1"
            title="Add Task"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
            title="Collapse Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-2.5 border-b border-slate-800/80 bg-slate-950/40 flex flex-col gap-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tasks, keys, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-medium text-slate-400 scrollbar-none">
          <button
            onClick={() => setSelectedAgentFilter('all')}
            className={`px-2 py-0.5 rounded-md whitespace-nowrap transition ${
              selectedAgentFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300'
            }`}
          >
            All
          </button>
          {agents.map((ag) => (
            <button
              key={ag.id}
              onClick={() => setSelectedAgentFilter(ag.id)}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedAgentFilter === ag.id
                  ? 'bg-slate-800 text-white border border-slate-600'
                  : 'bg-slate-900/60 hover:bg-slate-800 text-slate-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ag.color }} />
              {ag.role}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Columns (Scrollable area) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`rounded-xl border ${col.borderClass} ${col.bgClass} p-2.5 transition flex flex-col gap-2`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-1 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                  <span className="font-bold text-xs tracking-wider text-slate-200">
                    {col.title}
                  </span>
                </div>
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-slate-300 font-semibold">
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List in Column */}
              <div className="space-y-2">
                {colTasks.length === 0 ? (
                  <div className="text-[11px] text-slate-500 italic text-center py-3 bg-slate-950/20 rounded-lg border border-dashed border-slate-800">
                    No tasks in {col.title.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const agent = getAgent(task.assignedToAgentId);
                    const prio = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
                    const prevStatus = getPrevStatus(task.status);
                    const nextStatus = getNextStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        onClick={() => selectTask(task.id)}
                        className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-xl p-3 shadow-md hover:shadow-xl transition group cursor-pointer"
                      >
                        {/* Top row: Key + Priority */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[11px] font-mono font-bold text-indigo-400 group-hover:text-indigo-300">
                            {task.key}
                          </span>
                          <span
                            className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded border ${prio.bg}`}
                          >
                            {prio.label}
                          </span>
                        </div>

                        {/* Task Title */}
                        <h4 className="text-xs font-medium text-slate-200 line-clamp-2 mb-2 leading-snug">
                          {task.title}
                        </h4>

                        {/* Progress Bar (if running or review) */}
                        {task.status !== 'pending' && (
                          <div className="mb-2">
                            <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-0.5">
                              <span>Progress</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer: Agent & Model pills + Move actions */}
                        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-800/80">
                          {agent ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                              <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: agent.color }}
                              />
                              <span className="truncate max-w-[90px]">{agent.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Unassigned</span>
                          )}

                          {/* Quick workflow mover buttons */}
                          <div
                            className="flex items-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {prevStatus && (
                              <button
                                onClick={() => moveTask(task.id, prevStatus)}
                                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
                                title={`Move back to ${prevStatus}`}
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {nextStatus && (
                              <button
                                onClick={() => moveTask(task.id, nextStatus)}
                                className="p-1 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-200 rounded transition"
                                title={`Advance to ${nextStatus}`}
                              >
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
