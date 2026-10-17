import React from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { fetchAvailableModels, RouterModel } from '../../lib/aiClient';
import {
  X,
  Bot,
  Brain,
  Cpu,
  Zap,
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const AgentDetailModal: React.FC = () => {
  const {
    agents,
    tasks,
    selectedAgentId,
    selectAgent,
    focusAgent,
    updateAgent,
    addEvent,
  } = useOfficeStore();

  const [availableModels, setAvailableModels] = React.useState<RouterModel[]>([]);

  React.useEffect(() => {
    fetchAvailableModels().then((mods) => {
      if (mods.length > 0) setAvailableModels(mods);
    });
  }, []);

  const agent = agents.find((a) => a.id === selectedAgentId);
  if (!agent) return null;

  const currentTaskObj = agent.currentTaskId
    ? tasks.find((t) => t.id === agent.currentTaskId)
    : null;

  // Status visual badge
  const getStatusBadge = () => {
    switch (agent.status) {
      case 'coding':
        return { label: 'Sedang Coding', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' };
      case 'planning':
        return { label: 'Sedang Merancang', badge: 'bg-blue-950 text-blue-300 border-blue-800' };
      case 'reviewing':
        return { label: 'Sedang Review', badge: 'bg-purple-950 text-purple-300 border-purple-800' };
      case 'testing':
        return { label: 'Sedang Testing', badge: 'bg-cyan-950 text-cyan-300 border-cyan-800' };
      case 'blocked':
        return { label: 'Terkendala (Blocked)', badge: 'bg-rose-950 text-rose-300 border-rose-800' };
      case 'idle':
      default:
        return { label: 'Standby / Istirahat', badge: 'bg-zinc-900 text-zinc-400 border-zinc-800' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 font-mono">
      <div className="bg-zinc-950 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between border-b border-zinc-800 bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200 font-bold font-mono text-sm shadow-sm shrink-0">
              {agent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-xs tracking-wide text-zinc-100 uppercase">{agent.name}</h3>
                <span className="rounded px-1.5 py-0.5 font-mono text-[9px] uppercase border border-zinc-700 bg-zinc-900 text-zinc-300">
                  {statusBadge.label}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-zinc-400 font-mono truncate max-w-[180px]">
                {agent.title} • <span className="text-zinc-300">{agent.model}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                focusAgent(agent.id);
                selectAgent(null);
              }}
              className="h-7 px-2.5 rounded-md border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] font-mono transition flex items-center gap-1.5 cursor-pointer"
              title="Fokus kamera 3D ke posisi agen"
            >
              <Compass className="w-3.5 h-3.5 text-zinc-300" /> Fokus 3D
            </button>
            <button
              onClick={() => selectAgent(null)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Simplified Body */}
        <div className="p-5 space-y-4 text-xs font-mono">
          {/* 1. Quick Config: Nama & Model API */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Nama AI
                </label>
                <input
                  type="text"
                  defaultValue={agent.name}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && val !== agent.name) {
                      updateAgent(agent.id, { name: val });
                      addEvent({
                        type: 'message',
                        message: `Nama agen diperbarui: "${val}"`,
                        agentId: agent.id,
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2.5 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
                  placeholder="Nama AI..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                  Model API LLM
                </label>
                <select
                  value={agent.model}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateAgent(agent.id, { model: val });
                    addEvent({
                      type: 'message',
                      message: `${agent.name} dialihkan ke model API: ${val}`,
                      agentId: agent.id,
                    });
                  }}
                  className="h-8 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 font-mono text-xs text-zinc-300 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                >
                  <optgroup label="Router Aliases (Direkomendasikan)">
                    <option value="Daily">Daily (Fast & Smart)</option>
                    <option value="Architect">Architect (High Reasoning)</option>
                    <option value="Coding_Specialist">Coding_Specialist (Coder)</option>
                    <option value="Reviewer">Reviewer (Auditor)</option>
                    <option value="Fast">Fast (Low Latency)</option>
                    <option value="gemini/gemini-3.7-flash">Gemini 3.7 Flash</option>
                  </optgroup>
                  {availableModels.length > 0 && (
                    <optgroup label="Semua Model 9Router Aktif">
                      {availableModels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Tugas Aktif & Pikiran Otomatis */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] uppercase text-zinc-400 flex items-center justify-between font-medium tracking-wide">
              <span className="flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-zinc-300" /> PIKIRAN & PEKERJAAN SAAT INI
              </span>
              {agent.currentTask && (
                <span className="text-[10px] font-mono text-zinc-300 font-semibold">
                  {agent.progress}%
                </span>
              )}
            </div>

            <div className="text-zinc-200 italic bg-zinc-900/60 p-3 rounded-lg border border-zinc-800 text-xs">
              "{agent.currentThought}"
            </div>

            <div className="text-zinc-400 text-[11px] pt-1 leading-relaxed">
              <span className="text-zinc-500 font-medium">Aksi: </span>
              <span className="text-zinc-200">{agent.currentAction}</span>
            </div>
          </div>

          {/* 3. Metrik Performa Real-Time */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <div className="bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg text-center">
              <div className="text-[9px] text-zinc-500 uppercase font-mono">SELESAI</div>
              <div className="text-xs font-semibold text-zinc-100 mt-0.5">
                {agent.metrics.tasksCompleted}
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg text-center">
              <div className="text-[9px] text-zinc-500 uppercase font-mono">TOKENS</div>
              <div className="text-xs font-semibold text-zinc-100 mt-0.5">
                {(agent.metrics.tokensGenerated / 1000).toFixed(0)}k
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg text-center">
              <div className="text-[9px] text-zinc-500 uppercase font-mono">SPEED</div>
              <div className="text-xs font-semibold text-zinc-100 mt-0.5">
                {agent.metrics.speedTokensSec} <span className="text-[9px] text-zinc-500 font-normal">t/s</span>
              </div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800 p-2 rounded-lg text-center">
              <div className="text-[9px] text-zinc-500 uppercase font-mono">AKURASI</div>
              <div className="text-xs font-semibold text-zinc-100 mt-0.5">
                {agent.metrics.accuracyScore}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
