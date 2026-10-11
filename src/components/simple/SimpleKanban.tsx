import React, { useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { Task, TaskStatus } from '../../types/office';
import {
  Kanban,
  Search,
  Plus,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Bot,
  Tag,
} from 'lucide-react';

interface ColumnDef {
  key: TaskStatus;
  title: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'pending', title: 'MENUNGGU' },
  { key: 'running', title: 'DIKERJAKAN' },
  { key: 'review', title: 'REVIEW' },
  { key: 'done', title: 'SELESAI' },
];

export const SimpleKanban: React.FC = () => {
  const { tasks, agents, moveTask, selectTask, setCreateTaskModalOpen } = useOfficeStore();
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.key.toLowerCase().includes(search.toLowerCase())
  );

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

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 font-sans">
      {/* Header & Controls - Monochrome Minimalist */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
        <div>
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            PAPAN ALUR TUGAS • WORKFLOW KANBAN
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Pantau pergerakan tugas dari perencanaan hingga selesai. Klik tombol panah untuk memindahkan status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg text-xs font-mono font-semibold shadow-sm transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Tugas
          </button>
        </div>
      </div>

      {/* 4 Kanban Columns - Monochrome Minimalist */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.key);

          return (
            <div
              key={col.key}
              className="bg-zinc-950 border border-zinc-850 rounded-xl p-3.5 flex flex-col min-h-[460px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-850 mb-3 px-1">
                <span className="font-bold text-xs font-mono tracking-wider text-zinc-300">
                  {col.title}
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="space-y-2.5 flex-1 overflow-y-auto font-mono">
                {colTasks.length === 0 ? (
                  <div className="text-center py-10 text-xs text-zinc-500 italic">
                    Belum ada tugas
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const agent = getAgent(task.assignedToAgentId);
                    const prev = getPrevStatus(task.status);
                    const next = getNextStatus(task.status);

                    return (
                      <div
                        key={task.id}
                        onClick={() => selectTask(task.id)}
                        className="bg-black hover:bg-zinc-900/80 border border-zinc-850 hover:border-zinc-700 rounded-lg p-3 transition cursor-pointer group shadow-sm"
                      >
                        {/* Top: Key & Priority */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[11px] font-mono font-bold text-zinc-300">
                            {task.key}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                            {task.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-medium text-white mb-2 leading-snug line-clamp-2">
                          {task.title}
                        </h4>

                        {/* Progress */}
                        {task.status !== 'pending' && (
                          <div className="mb-2">
                            <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                              <span>PROGRES</span>
                              <span>{task.progress}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-zinc-200 rounded-full"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Footer: Agent & Move buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-850 text-xs">
                          {agent ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-zinc-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                              <span className="truncate max-w-[100px]">{agent.name}</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 italic">Unassigned</span>
                          )}

                          {/* Quick Workflow Action Arrows */}
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {prev && (
                              <button
                                onClick={() => moveTask(task.id, prev)}
                                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded transition"
                                title="Kembalikan status"
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </button>
                            )}
                            {next && (
                              <button
                                onClick={() => moveTask(task.id, next)}
                                className="p-1 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition"
                                title="Lanjutkan status"
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
    </div>
  );
};
