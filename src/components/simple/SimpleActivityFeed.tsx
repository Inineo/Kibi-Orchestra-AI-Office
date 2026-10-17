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
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-4 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shrink-0">
            <Radio className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="font-semibold text-xs tracking-wide text-zinc-100 uppercase">
              Log Aktivitas Kerja • Live Audit Stream
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
              Riwayat kejadian dan interaksi antar agen AI secara real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Filter Control */}
          <div className="flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'start', label: 'Mulai' },
              { id: 'complete', label: 'Selesai' },
              { id: 'escalation', label: 'Blocker' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`h-7 rounded-lg px-2.5 font-mono text-[11px] font-medium transition cursor-pointer ${
                  filter === item.id
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={clearEvents}
            className="h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition cursor-pointer"
            title="Bersihkan Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl divide-y divide-zinc-800/80 overflow-hidden font-mono">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 text-xs italic">
            Tidak ada aktivitas dalam kategori ini.
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 hover:bg-zinc-900/40 flex items-start gap-3 text-xs transition"
            >
              <div className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 shrink-0 mt-0.5 font-mono text-[10px]">
                {evt.type.toUpperCase().slice(0, 4)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500 text-[11px] font-mono">{evt.timestamp}</span>
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
                  className="h-7 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono shrink-0 transition cursor-pointer"
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
