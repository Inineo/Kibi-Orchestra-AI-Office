import React, { useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { EventType } from '../../types/office';
import {
  Radio,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  MessageSquare,
  Trash2,
} from 'lucide-react';

export const SimpleActivityFeed: React.FC = () => {
  const { events, clearEvents, selectAgent } = useOfficeStore();
  const [filter, setFilter] = useState<string>('all');

  // Hanya tampilkan log terkait task kerja (eksekusi, progress, error/blocker, commit artifact, review)
  const taskEvents = events.filter((e) => {
    // Abaikan jika tipe event message dan tidak ada keterkaitan dengan task/sprint
    if (e.type === 'message' && !e.taskId && !e.taskKey) return false;
    // Abaikan log reset atau benchmark simulator
    if (e.message.toLowerCase().includes('simulator reset') || e.message.toLowerCase().includes('initial state')) return false;
    return true;
  });

  const filteredEvents = taskEvents.filter((e) => {
    if (filter === 'all') return true;
    return e.type === filter;
  });

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 font-sans">
      {/* Header - Monochrome Minimalist */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-850">
        <div>
          <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
            LOG AKTIVITAS KERJA • LIVE AUDIT STREAM
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Riwayat kejadian dan interaksi antar agen AI secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex items-center bg-black p-1 rounded-lg border border-zinc-850 text-xs font-mono">
            {['all', 'start', 'complete', 'escalation'].map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded capitalize transition ${
                  filter === key
                    ? 'bg-zinc-100 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {key === 'all'
                  ? 'Semua'
                  : key === 'start'
                  ? 'Mulai'
                  : key === 'complete'
                  ? 'Selesai'
                  : 'Blocker'}
              </button>
            ))}
          </div>

          <button
            onClick={clearEvents}
            className="p-2 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-zinc-850 transition"
            title="Bersihkan Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-zinc-950 border border-zinc-850 rounded-xl divide-y divide-zinc-850 overflow-hidden font-mono">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs italic">
            Tidak ada aktivitas dalam kategori ini.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 hover:bg-zinc-900/60 flex items-start gap-3 text-xs transition"
            >
              <div className="p-1 rounded bg-black border border-zinc-800 text-zinc-300 shrink-0 mt-0.5 font-mono text-[10px]">
                {evt.type.toUpperCase().slice(0, 4)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[11px]">{evt.timestamp}</span>
                  <span className="font-medium text-zinc-200">{evt.message}</span>
                </div>
                {evt.details && (
                  <div className="text-zinc-400 text-[11px] mt-1 pl-2 border-l border-zinc-800">
                    {evt.details}
                  </div>
                )}
              </div>

              {evt.agentId && (
                <button
                  onClick={() => selectAgent(evt.agentId!)}
                  className="px-2 py-1 text-[10px] bg-black hover:bg-zinc-850 text-zinc-300 rounded border border-zinc-800 shrink-0 transition"
                >
                  Lihat Agen
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
