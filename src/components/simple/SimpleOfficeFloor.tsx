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
  FlaskConical,
  Search,
  AlertTriangle,
  MessageSquare,
  Footprints,
  ClipboardList,
  Armchair,
  Pause,
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
      return {
        label: 'CODING',
        icon: <Code2 className="w-3 h-3" />,
        bg: 'bg-zinc-100 text-zinc-950 font-medium',
      };
    }
    if (agent.status === 'planning') {
      return {
        label: agent.department === 'orchestra' ? 'ORKESTRASI' : 'PLANNING',
        icon: agent.department === 'orchestra' ? <Layers className="w-3 h-3" /> : <FileText className="w-3 h-3" />,
        bg: 'bg-zinc-800 text-zinc-100 border border-zinc-700',
      };
    }
    if (agent.status === 'testing') {
      return {
        label: 'TESTING',
        icon: <FlaskConical className="w-3 h-3" />,
        bg: 'bg-zinc-800 text-zinc-100 border border-zinc-700',
      };
    }
    if (agent.status === 'reviewing') {
      return {
        label: 'REVIEWING',
        icon: <Search className="w-3 h-3" />,
        bg: 'bg-zinc-800 text-zinc-100 border border-zinc-700',
      };
    }
    if (agent.status === 'blocked') {
      return {
        label: 'BLOCKED',
        icon: <AlertTriangle className="w-3 h-3" />,
        bg: 'bg-zinc-900 text-zinc-200 border border-zinc-600',
      };
    }

    // Idle activities & leaving desk locations
    if (agent.locationState === 'chatting') {
      return {
        label: 'MENGOBROL',
        icon: <MessageSquare className="w-3 h-3" />,
        bg: 'bg-zinc-900 text-zinc-300 border border-zinc-700',
      };
    }
    if (agent.locationState === 'walking') {
      return {
        label: 'MONDAR-MANDIR',
        icon: <Footprints className="w-3 h-3" />,
        bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800',
      };
    }
    if (agent.locationState === 'coffee_bar' || agent.idleActivity === 'coffee') {
      return {
        label: 'MINUM KOPI',
        icon: <Coffee className="w-3 h-3" />,
        bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800',
      };
    }
    if (agent.locationState === 'lounge' || agent.idleActivity === 'phone') {
      return {
        label: 'SOFA LOUNGE',
        icon: <Armchair className="w-3 h-3" />,
        bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800',
      };
    }
    if (agent.locationState === 'whiteboard') {
      return {
        label: 'WHITEBOARD',
        icon: <ClipboardList className="w-3 h-3" />,
        bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800',
      };
    }
    if (agent.idleActivity === 'nap') {
      return {
        label: 'POWER NAP',
        icon: <Moon className="w-3 h-3" />,
        bg: 'bg-zinc-900 text-zinc-300 border border-zinc-800',
      };
    }
    return {
      label: 'STANDBY',
      icon: <Pause className="w-3 h-3" />,
      bg: 'bg-zinc-900 text-zinc-400 border border-zinc-800',
    };
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 font-mono text-xs">
      {/* Overview Info Header */}
      <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 shrink-0">
            <Layers className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="font-semibold text-xs tracking-wide text-zinc-100 uppercase">
              Tata Letak Kantor • 3 Departemen
            </h2>
            <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
              Meja kerja dipisahkan ke zona <b>Orchestra</b>, <b>Developer</b>, dan <b>Writer</b>. Agen yang tidak bertugas melakukan aktivitas santai (kopi, peregangan, cek ponsel, nap).
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-950 font-medium">
            <Code2 className="w-3 h-3" /> Coding
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
            <Coffee className="w-3 h-3" /> Minum Kopi
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
            <Smartphone className="w-3 h-3" /> Cek Ponsel
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
            <Activity className="w-3 h-3" /> Peregangan
          </span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800">
            <Moon className="w-3 h-3" /> Power Nap
          </span>
        </div>
      </div>

      {/* 3 SEPARATE ZONES / DEPARTMENTS */}
      {ZONES.map((zone) => {
        const zoneAgents = agents.filter((a) => a.department === zone.key);

        return (
          <section
            key={zone.key}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4"
          >
            {/* Zone Header Banner */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-semibold text-xs tracking-wider text-zinc-100 uppercase font-mono flex items-center gap-2">
                  <span>{zone.title}</span>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 text-zinc-400">
                    {zoneAgents.length} AGEN
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">{zone.subtitle}</p>
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
                    className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition duration-150 hover:border-zinc-700 hover:bg-zinc-900/80 cursor-pointer shadow-sm"
                  >
                    {/* Top Desk Monochrome Line */}
                    <div className="absolute top-0 left-4 right-4 h-0.5 bg-zinc-700 rounded-b" />

                    {/* Agent Header */}
                    <div className="flex items-start justify-between gap-2 mb-3 pt-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-200 shadow-sm font-mono shrink-0">
                          {agent.name.charAt(0)}
                        </div>

                        <div>
                          <h4 className="font-semibold text-xs text-zinc-100 group-hover:text-white transition">
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

                    {/* Desk Monitor Display */}
                    <div className="bg-black rounded-lg p-3 border border-zinc-800 mb-2.5 space-y-2">
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
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400">
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
