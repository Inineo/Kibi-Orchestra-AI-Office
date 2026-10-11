import React from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { AgentStatus, IdleActivity } from '../../types/office';
import {
  X,
  Bot,
  Brain,
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Code2,
  FileText,
  Clock,
  Compass,
  Coffee,
  Smartphone,
  Moon,
} from 'lucide-react';

export const AgentDetailModal: React.FC = () => {
  const {
    agents,
    selectedAgentId,
    selectAgent,
    focusAgent,
    updateAgent,
    addEvent,
  } = useOfficeStore();

  const agent = agents.find((a) => a.id === selectedAgentId);
  if (!agent) return null;

  const handleStatusOverride = (newStatus: AgentStatus) => {
    updateAgent(agent.id, {
      status: newStatus,
      locationState: newStatus === 'idle' ? agent.locationState : 'at_desk',
      currentThought:
        newStatus === 'blocked'
          ? 'Manual escalation: Agen mengalami kendala teknis / dependency blocker!'
          : newStatus === 'planning'
          ? 'Manual override: Agen sedang merancang arsitektur & dekomposisi sprint.'
          : newStatus === 'coding'
          ? 'Manual override: Agen sedang menulis kode implementasi di repository.'
          : newStatus === 'testing'
          ? 'Manual override: Agen sedang menjalankan stress test & fuzzing.'
          : newStatus === 'reviewing'
          ? 'Manual override: Agen sedang mengaudit kode Pull Request.'
          : 'Agen bertransisi ke mode istirahat / standby.',
    });

    addEvent({
      type: newStatus === 'blocked' ? 'escalation' : 'progress',
      message: `${agent.name} status diubah ke ${newStatus.toUpperCase()}`,
      agentId: agent.id,
    });
  };

  const handleIdleActivityOverride = (activity: IdleActivity) => {
    let thought = '';
    let action = '';
    let location: 'at_desk' | 'lounge' | 'coffee_bar' | 'whiteboard' | 'walking' | 'chatting' = 'at_desk';

    if (activity === 'coffee') {
      thought = '☕ Sedang menikmati espresso hangat di coffee bar...';
      action = 'Menikmati secangkir kopi di coffee bar (Coffee Break)';
      location = 'coffee_bar';
    } else if (activity === 'phone') {
      thought = '📱 Duduk santai di sofa lounge mengecek smartphone...';
      action = 'Duduk santai di sofa lounge';
      location = 'lounge';
    } else if (activity === 'stretch') {
      thought = '🚶‍♂️ Mondar-mandir jalan santai di lorong meregangkan kaki & pikiran...';
      action = 'Mondar-mandir santai di lorong kantor';
      location = 'walking';
    } else if (activity === 'nap') {
      thought = '😴 Power Nap: Duduk santai di lounge memulihkan energi kognitif (Zzz)...';
      action = 'Power Nap di sofa lounge';
      location = 'lounge';
    } else {
      thought = 'Menunggu giliran tugas berikutnya di antrean meja...';
      action = 'Standby rileks di kursi meja kerja';
      location = 'at_desk';
    }

    updateAgent(agent.id, {
      status: 'idle',
      idleActivity: activity,
      locationState: location,
      currentThought: thought,
      currentAction: action,
    });

    addEvent({
      type: 'message',
      message: `${agent.name} beralih ke aktivitas: ${activity.toUpperCase()} (${location})`,
      agentId: agent.id,
    });
  };

  const statusOptions: { key: AgentStatus; label: string }[] = [
    { key: 'coding', label: '💻 Coding' },
    { key: 'planning', label: '💭 Planning' },
    { key: 'reviewing', label: '🔍 Review' },
    { key: 'testing', label: '🧪 Testing' },
    { key: 'blocked', label: '⚠️ Blocked' },
    { key: 'idle', label: '💤 Idle' },
  ];

  const idleOptions: { key: IdleActivity; label: string; icon: string }[] = [
    { key: 'coffee', label: 'Minum Kopi', icon: '☕' },
    { key: 'phone', label: 'Cek Ponsel', icon: '📱' },
    { key: 'stretch', label: 'Peregangan', icon: '🥱' },
    { key: 'nap', label: 'Power Nap (Zzz)', icon: '😴' },
    { key: 'standby', label: 'Standby Santai', icon: '💤' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Monochrome Minimalist */}
        <div className="p-4 flex items-center justify-between border-b border-zinc-850 bg-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-zinc-750 flex items-center justify-center text-white font-bold font-mono">
              {agent.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">{agent.name}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium uppercase bg-zinc-900 text-zinc-200 border border-zinc-800">
                  {agent.status}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {agent.title} • <span className="text-zinc-200">{agent.model}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                focusAgent(agent.id);
                selectAgent(null);
              }}
              className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 rounded-lg text-xs font-mono transition flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-zinc-300" /> Fokus 3D
            </button>
            <button
              onClick={() => selectAgent(null)}
              className="p-1.5 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Quick Model & Name Config */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 space-y-3">
            <div className="text-[10px] uppercase text-zinc-400 font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-zinc-300" /> IDENTITAS & MODEL API
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400">Nama AI:</label>
                <input
                  type="text"
                  defaultValue={agent.name}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && val !== agent.name) {
                      updateAgent(agent.id, { name: val });
                      addEvent({
                        type: 'message',
                        message: `Nama agen diubah menjadi: "${val}"`,
                        agentId: agent.id,
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400 font-mono"
                  placeholder="Nama AI..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-400">Model API LLM:</label>
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
                  className="w-full bg-black border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-400 font-mono cursor-pointer"
                >
                  <option value="Gemini 2.5 Flash">Gemini 2.5 Flash (Google)</option>
                  <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Google)</option>
                  <option value="Claude-3.5-Sonnet">Claude-3.5-Sonnet (Anthropic)</option>
                  <option value="Claude-3.5-Haiku">Claude-3.5-Haiku (Anthropic)</option>
                  <option value="GPT-4o">GPT-4o (OpenAI)</option>
                  <option value="GPT-4o-mini">GPT-4o-mini (OpenAI)</option>
                  <option value="DeepSeek-Coder-V2">DeepSeek-Coder-V2 (DeepSeek)</option>
                  <option value="DeepSeek-R1">DeepSeek-R1 (DeepSeek)</option>
                  <option value="Llama 3.3 70B">Llama 3.3 70B (Meta)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Current Activity & Cognitive Stream */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] uppercase text-zinc-400 flex items-center gap-1.5 font-bold">
              <Brain className="w-3.5 h-3.5 text-zinc-300" /> AKTIVITAS & PIKIRAN SAAT INI
            </div>
            <div className="text-zinc-200 italic bg-black p-3 rounded-lg border border-zinc-850 text-xs">
              "{agent.currentThought}"
            </div>
            <div className="text-zinc-400 text-[11px] pt-1">
              Aksi Langsung: <span className="text-zinc-200">{agent.currentAction}</span>
            </div>
          </div>

          {/* Interactive Simulation: Casual Idle Activities */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] uppercase text-zinc-400 font-bold flex items-center justify-between">
              <span>AKTIVITAS SAAT IDLE / SANTAI (ANIMASI 3D)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {idleOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleIdleActivityOverride(opt.key)}
                  className={`p-2 rounded-lg text-xs font-mono transition text-left border flex items-center gap-2 cursor-pointer ${
                    agent.status === 'idle' && agent.idleActivity === opt.key
                      ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                      : 'bg-black hover:bg-zinc-900 text-zinc-300 border-zinc-800'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Status Override */}
          <div className="bg-zinc-900/40 border border-zinc-850 rounded-xl p-3.5 space-y-2">
            <div className="text-[10px] uppercase text-zinc-400 font-bold">
              STATUS KERJA AKTIF
            </div>
            <div className="grid grid-cols-3 gap-2">
              {statusOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleStatusOverride(opt.key)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono transition cursor-pointer border ${
                    agent.status === opt.key
                      ? 'bg-zinc-100 text-zinc-950 font-bold border-white'
                      : 'bg-black hover:bg-zinc-900 text-zinc-300 border-zinc-800'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-black border border-zinc-850 p-2.5 rounded-lg text-center">
              <div className="text-[9px] text-zinc-400 uppercase font-mono">SELESAI</div>
              <div className="text-base font-bold text-white mt-0.5">
                {agent.metrics.tasksCompleted}
              </div>
            </div>
            <div className="bg-black border border-zinc-850 p-2.5 rounded-lg text-center">
              <div className="text-[9px] text-zinc-400 uppercase font-mono">TOKENS</div>
              <div className="text-base font-bold text-white mt-0.5">
                {(agent.metrics.tokensGenerated / 1000).toFixed(0)}k
              </div>
            </div>
            <div className="bg-black border border-zinc-850 p-2.5 rounded-lg text-center">
              <div className="text-[9px] text-zinc-400 uppercase font-mono">SPEED</div>
              <div className="text-base font-bold text-white mt-0.5">
                {agent.metrics.speedTokensSec} <span className="text-[9px] text-zinc-400">t/s</span>
              </div>
            </div>
            <div className="bg-black border border-zinc-850 p-2.5 rounded-lg text-center">
              <div className="text-[9px] text-zinc-400 uppercase font-mono">AKURASI</div>
              <div className="text-base font-bold text-white mt-0.5">
                {agent.metrics.accuracyScore}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
