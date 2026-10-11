import React from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { Agent, AgentStatus, AgentDepartment } from '../../types/office';
import {
  Laptop,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  Code2,
  FileText,
  Coffee,
  Smartphone,
  Moon,
  Activity,
} from 'lucide-react';

interface ZoneDef {
  key: AgentDepartment;
  title: string;
  subtitle: string;
}

const ZONES: ZoneDef[] = [
  {
    key: 'orchestra',
    title: 'ORCHESTRA POD',
    subtitle: 'Perencanaan Strategis, Arsitektur Sistem & Orkestrasi Tim',
  },
  {
    key: 'developer',
    title: 'DEVELOPER POD',
    subtitle: 'Pembuatan Kode Fitur, Pipeline DevOps & Pengujian Otomatis (QA)',
  },
  {
    key: 'writer',
    title: 'WRITER POD',
    subtitle: 'Dokumentasi Teknis, Audit Kode (PR Review) & Kebijakan Keamanan',
  },
];

export const SimpleOfficeFloor: React.FC = () => {
  const { agents, selectAgent } = useOfficeStore();

  const getStatusBadge = (agent: Agent) => {
    if (agent.status === 'coding') {
      return { label: 'CODING', icon: '💻', bg: 'bg-zinc-100 text-zinc-950 font-bold' };
    }
    if (agent.status === 'planning') {
      return {
        label: agent.department === 'orchestra' ? 'ORKESTRASI' : 'PLANNING',
        icon: agent.department === 'orchestra' ? '🪄' : '💭',
        bg: 'bg-zinc-800 text-zinc-100 border border-zinc-700',
      };
    }
    if (agent.status === 'testing') {
      return { label: 'TESTING', icon: '🧪', bg: 'bg-zinc-800 text-zinc-100' };
    }
    if (agent.status === 'reviewing') {
      return { label: 'REVIEWING', icon: '🔍', bg: 'bg-zinc-800 text-zinc-100' };
    }
    if (agent.status === 'blocked') {
      return { label: 'BLOCKED', icon: '⚠️', bg: 'bg-zinc-900 text-white border border-zinc-600' };
    }

    // Idle activities & leaving desk locations
    if (agent.locationState === 'chatting') {
      return { label: 'MENGOBROL', icon: '💬', bg: 'bg-zinc-900 text-zinc-200 border border-zinc-700' };
    }
    if (agent.locationState === 'walking') {
      return { label: 'MONDAR-MANDIR', icon: '🚶‍♂️', bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800' };
    }
    if (agent.locationState === 'coffee_bar' || agent.idleActivity === 'coffee') {
      return { label: 'MINUM KOPI', icon: '☕', bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800' };
    }
    if (agent.locationState === 'lounge' || agent.idleActivity === 'phone') {
      return { label: 'SOFA LOUNGE', icon: '🛋️', bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800' };
    }
    if (agent.locationState === 'whiteboard') {
      return { label: 'WHITEBOARD', icon: '📋', bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800' };
    }
    if (agent.idleActivity === 'nap') {
      return { label: 'POWER NAP', icon: '😴', bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800' };
    }
    return { label: 'STANDBY', icon: '💤', bg: 'bg-zinc-900 text-zinc-400 border border-zinc-850' };
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Overview Info Header - Monochrome Minimalist */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-850 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            TATA LETAK KANTOR • 3 DEPARTEMEN
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            Meja kerja dipisahkan ke zona <b>Orchestra</b>, <b>Developer</b>, dan <b>Writer</b>. Agen yang tidak bertugas melakukan aktivitas santai (kopi, peregangan, cek ponsel, nap).
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-950 font-semibold">💻 Coding</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">☕ Minum Kopi</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">📱 Cek Ponsel</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">🥱 Peregangan</span>
          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">😴 Power Nap</span>
        </div>
      </div>

      {/* 3 SEPARATE ZONES / DEPARTMENTS */}
      {ZONES.map((zone) => {
        const zoneAgents = agents.filter((a) => a.department === zone.key);

        return (
          <section
            key={zone.key}
            className="rounded-2xl border border-zinc-850 bg-zinc-950 p-5 space-y-4"
          >
            {/* Zone Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-850">
              <div>
                <h3 className="font-bold text-sm tracking-widest text-zinc-100 font-mono flex items-center gap-2">
                  <span>{zone.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                    {zoneAgents.length} AGEN
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">{zone.subtitle}</p>
              </div>
            </div>

            {/* Workstation Desk Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {zoneAgents.map((agent) => {
                const statusInfo = getStatusBadge(agent);
                const isWorking = agent.status !== 'idle';

                return (
                  <div
                    key={agent.id}
                    onClick={() => selectAgent(agent.id)}
                    className="group relative bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 transition duration-150 cursor-pointer shadow-sm"
                  >
                    {/* Top Desk Monochrome Line */}
                    <div className="absolute top-0 left-4 right-4 h-0.5 bg-zinc-700 rounded-b" />

                    {/* Agent Header */}
                    <div className="flex items-start justify-between gap-2 mb-3 pt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white shadow-sm font-mono shrink-0">
                          {agent.name.charAt(0)}
                        </div>

                        <div>
                          <h4 className="font-bold text-xs text-zinc-100 group-hover:text-white transition">
                            {agent.name}
                          </h4>
                          <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                            {agent.title}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-mono font-medium px-2 py-0.5 rounded flex items-center gap-1 ${statusInfo.bg}`}
                      >
                        <span>{statusInfo.icon}</span>
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Desk Monitor Display - Monochrome Minimalist */}
                    <div className="bg-black rounded-lg p-3 border border-zinc-850 mb-2.5 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-zinc-300" /> MONITOR
                        </span>
                        <span className="text-zinc-200 font-semibold">{agent.model}</span>
                      </div>

                      <div className="text-xs text-zinc-300 line-clamp-2 min-h-[32px] leading-snug font-mono">
                        {agent.currentTask ? (
                          agent.currentTask
                        ) : (
                          <span className="text-zinc-400">{agent.currentAction}</span>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
                          <span>PROGRES</span>
                          <span className="font-bold text-zinc-200">{agent.progress}%</span>
                        </div>
                        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-zinc-100 rounded-full transition-all duration-300"
                            style={{ width: `${agent.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Agent Thought */}
                    <div className="text-[11px] text-zinc-400 italic line-clamp-1 mb-2 font-mono px-1">
                      "{agent.currentThought}"
                    </div>

                    {/* Card Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-850 text-[10px] font-mono text-zinc-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-zinc-300" />
                        {agent.metrics.tasksCompleted} Selesai
                      </span>
                      <span className="text-zinc-300 group-hover:text-white flex items-center gap-1">
                        Detail <Eye className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
