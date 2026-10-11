import React, { useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { Agent, AgentDepartment } from '../../types/office';
import {
  Cpu,
  Bot,
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Layers,
  Code2,
  FileText,
  Search,
  ExternalLink,
  Shield,
  Zap,
} from 'lucide-react';

const PRESET_MODELS = [
  { id: 'Gemini 2.5 Flash', provider: 'Google', tier: 'Fast & Smart', badge: 'bg-blue-950 text-blue-300 border-blue-800' },
  { id: 'Gemini 1.5 Pro', provider: 'Google', tier: 'High Reasoning', badge: 'bg-blue-950 text-blue-300 border-blue-800' },
  { id: 'Claude-3.5-Sonnet', provider: 'Anthropic', tier: 'Architecture & Code', badge: 'bg-amber-950 text-amber-300 border-amber-800' },
  { id: 'Claude-3.5-Haiku', provider: 'Anthropic', tier: 'Ultra Fast', badge: 'bg-amber-950 text-amber-300 border-amber-800' },
  { id: 'GPT-4o', provider: 'OpenAI', tier: 'Flagship Multimodal', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  { id: 'GPT-4o-mini', provider: 'OpenAI', tier: 'Lightweight', badge: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  { id: 'DeepSeek-Coder-V2', provider: 'DeepSeek', tier: 'Code Specialist', badge: 'bg-purple-950 text-purple-300 border-purple-800' },
  { id: 'DeepSeek-R1', provider: 'DeepSeek', tier: 'Reasoning Specialist', badge: 'bg-purple-950 text-purple-300 border-purple-800' },
  { id: 'Llama 3.3 70B', provider: 'Meta', tier: 'Open Source', badge: 'bg-indigo-950 text-indigo-300 border-indigo-800' },
];

export const AgentSettingsTab: React.FC = () => {
  const { agents, updateAgent } = useOfficeStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<AgentDepartment | 'all'>('all');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [customModelInputs, setCustomModelInputs] = useState<Record<string, string>>({});

  const showSavedNotice = (agentName: string) => {
    setSavedNotice(`Pengaturan untuk "${agentName}" berhasil disimpan!`);
    setTimeout(() => {
      setSavedNotice(null);
    }, 2800);
  };

  const handleNameChange = (agentId: string, newName: string) => {
    updateAgent(agentId, { name: newName });
    const target = agents.find((a) => a.id === agentId);
    if (target) showSavedNotice(newName || target.name);
  };

  const handleTitleChange = (agentId: string, newTitle: string) => {
    updateAgent(agentId, { title: newTitle });
    const target = agents.find((a) => a.id === agentId);
    if (target) showSavedNotice(target.name);
  };

  const handleModelChange = (agentId: string, newModel: string) => {
    updateAgent(agentId, { model: newModel });
    const target = agents.find((a) => a.id === agentId);
    if (target) showSavedNotice(target.name);
  };

  // Quick Preset Actions
  const applyAllModelPreset = (modelId: string, label: string) => {
    agents.forEach((ag) => {
      updateAgent(ag.id, { model: modelId });
    });
    setSavedNotice(`Semua agen berhasil disetel ke ${label}!`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const resetAllToDefaults = () => {
    // Reset defaults based on department & role
    agents.forEach((ag) => {
      let defaultModel = 'Gemini 1.5 Pro';
      if (ag.department === 'orchestra') defaultModel = 'Claude-3.5-Sonnet';
      else if (ag.role === 'developer' || ag.role === 'devops') defaultModel = 'DeepSeek-Coder-V2';
      else if (ag.role === 'architect' || ag.role === 'tester') defaultModel = 'GPT-4o';
      else if (ag.role === 'reviewer') defaultModel = 'Claude-3.5-Sonnet';

      updateAgent(ag.id, { model: defaultModel });
    });
    setSavedNotice('Semua model API berhasil dikembalikan ke preset optimal!');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const filteredAgents = agents.filter((agent) => {
    const matchesDept = selectedDept === 'all' || agent.department === selectedDept;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="min-h-full w-full bg-zinc-950 p-6 md:p-8 text-zinc-100 font-sans selection:bg-zinc-800">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-zinc-100 text-zinc-950 shadow-sm">
                <Cpu className="h-5 w-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Konfigurasi Model & Agen AI
              </h1>
            </div>
            <p className="mt-1 text-xs md:text-sm text-zinc-400">
              Ganti nama avatar dan sesuaikan API model AI (LLM) untuk masing-masing agen dalam sistem virtual workspace.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider mr-1 hidden lg:inline">
              Preset Cepat:
            </span>
            <button
              onClick={() => applyAllModelPreset('Gemini 2.5 Flash', 'Gemini 2.5 Flash')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-200 transition cursor-pointer"
            >
              Semua Gemini
            </button>
            <button
              onClick={() => applyAllModelPreset('Claude-3.5-Sonnet', 'Claude 3.5 Sonnet')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-200 transition cursor-pointer"
            >
              Semua Claude
            </button>
            <button
              onClick={() => applyAllModelPreset('GPT-4o', 'GPT-4o')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-200 transition cursor-pointer"
            >
              Semua GPT-4o
            </button>
            <button
              onClick={resetAllToDefaults}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/70 text-zinc-400 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
              title="Kembalikan model ke default"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {savedNotice && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs md:text-sm animate-in fade-in slide-in-from-top-2">
            <Check className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{savedNotice}</span>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
          {/* Department Filter Tabs */}
          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer ${
                selectedDept === 'all'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semua ({agents.length})
            </button>
            <button
              onClick={() => setSelectedDept('orchestra')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedDept === 'orchestra'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Orchestra (1)
            </button>
            <button
              onClick={() => setSelectedDept('developer')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedDept === 'developer'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              Developer ({agents.filter((a) => a.department === 'developer').length})
            </button>
            <button
              onClick={() => setSelectedDept('writer')}
              className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                selectedDept === 'writer'
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Writer ({agents.filter((a) => a.department === 'writer').length})
            </button>
          </div>

          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau model AI..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition"
            />
          </div>
        </div>

        {/* Grid of Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => {
            const isOrchestra = agent.department === 'orchestra';
            const currentPreset = PRESET_MODELS.find(
              (m) => m.id.toLowerCase() === agent.model.toLowerCase()
            );
            const isCustom = !currentPreset;

            return (
              <div
                key={agent.id}
                className={`flex flex-col justify-between rounded-xl border p-4.5 transition relative overflow-hidden bg-zinc-900/40 hover:bg-zinc-900/70 ${
                  isOrchestra
                    ? 'border-zinc-400 shadow-sm shadow-zinc-900'
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* Accent top pill */}
                {isOrchestra && (
                  <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-lg bg-zinc-100 text-zinc-950 font-mono text-[9px] font-bold uppercase tracking-wider">
                    Orchestra Maestro
                  </div>
                )}

                <div className="space-y-4">
                  {/* Avatar & Department Row */}
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 text-white font-bold text-sm shadow-inner">
                      {isOrchestra ? '🪄' : agent.department === 'developer' ? '💻' : '📝'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                          {agent.department.toUpperCase()} POD
                        </span>
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            agent.status === 'idle'
                              ? 'bg-zinc-400'
                              : agent.status === 'blocked'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-emerald-400 animate-ping'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-zinc-400 truncate">
                        ID: <span className="font-mono text-zinc-300">{agent.id}</span>
                      </p>
                    </div>
                  </div>

                  {/* Field 1: Nama Agen */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Nama AI</span>
                      <span className="text-[10px] text-zinc-400 font-sans">Bisa diubah</span>
                    </label>
                    <input
                      type="text"
                      defaultValue={agent.name}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== agent.name) {
                          handleNameChange(agent.id, val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition"
                      placeholder="Masukkan nama AI..."
                    />
                  </div>

                  {/* Field 2: Jabatan / Peran */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      Jabatan / Spesialisasi
                    </label>
                    <input
                      type="text"
                      defaultValue={agent.title}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== agent.title) {
                          handleTitleChange(agent.id, val);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition"
                      placeholder="Masukkan jabatan..."
                    />
                  </div>

                  {/* Field 3: API Model AI */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 text-zinc-400" />
                        API Model AI
                      </label>
                      {currentPreset && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${currentPreset.badge}`}>
                          {currentPreset.provider}
                        </span>
                      )}
                    </div>

                    <select
                      value={isCustom ? '__custom__' : agent.model}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val !== '__custom__') {
                          handleModelChange(agent.id, val);
                        } else {
                          // keep custom model
                          setCustomModelInputs((prev) => ({
                            ...prev,
                            [agent.id]: agent.model,
                          }));
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition cursor-pointer"
                    >
                      <optgroup label="Model Populer & Unggulan">
                        {PRESET_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.id} — ({m.provider} • {m.tier})
                          </option>
                        ))}
                      </optgroup>
                      <option value="__custom__">Custom Model Lainnya...</option>
                    </select>

                    {/* Custom Model String Input (if custom selected) */}
                    {(isCustom || customModelInputs[agent.id] !== undefined) && (
                      <div className="mt-2">
                        <input
                          type="text"
                          defaultValue={agent.model}
                          placeholder="Ketik nama model custom (e.g. o3-mini, gemini-2.5-pro)..."
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val && val !== agent.model) {
                              handleModelChange(agent.id, val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                          }}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono text-amber-200 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Metrics & Current Activity */}
                <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Tokens:</span>
                    <span className="text-zinc-200">{(agent.metrics.tokensGenerated / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Akurasi:</span>
                    <span className="text-emerald-400 font-semibold">{agent.metrics.accuracyScore}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Selesai:</span>
                    <span className="text-zinc-200">{agent.metrics.tasksCompleted}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredAgents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Bot className="h-10 w-10 text-zinc-400 mb-3" />
            <h3 className="text-sm font-semibold text-zinc-200">Tidak ada agen ditemukan</h3>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              Coba sesuaikan kata kunci pencarian atau ubah filter departemen di atas.
            </p>
          </div>
        )}

        {/* Informational Guidance Card */}
        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-zinc-300 shrink-0" />
            <span>
              Perubahan nama dan model API tersinkronisasi secara real-time ke visual 3D, papan Kanban, dan log tugas.
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 shrink-0">
            <span>TOTAL: {agents.length} AGENTS ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
