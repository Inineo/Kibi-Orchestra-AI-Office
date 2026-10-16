import React, { useState, useEffect } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { TaskPriority } from '../../types/office';
import { estimateTokensAndCost } from '../../lib/aiClient';
import {
  DEFAULT_WORKFLOW_TEMPLATES,
  WorkflowTemplate,
} from '../../data/workflowTemplates';
import { X, Plus, Sparkles, Layers, Bot, ArrowRight, Loader2, Coins, Bookmark } from 'lucide-react';

const STORAGE_KEY_CUSTOM_TEMPLATES = 'kibi_custom_workflow_templates';

export const CreateTaskModal: React.FC = () => {
  const {
    isCreateTaskModalOpen,
    setCreateTaskModalOpen,
    addTask,
    createMissionDecomposed,
    agents,
  } = useOfficeStore();

  const [mode, setMode] = useState<'pm_decompose' | 'single'>('pm_decompose');

  // Single task state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  const [model, setModel] = useState('Daily');
  const [tagsInput, setTagsInput] = useState('Feature, Backend');

  // PM Decompose state
  const [missionGoal, setMissionGoal] = useState('');
  const [missionRequirements, setMissionRequirements] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);

  // Template state
  const [customTemplates, setCustomTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CUSTOM_TEMPLATES);
      if (stored) {
        setCustomTemplates(JSON.parse(stored));
      }
    } catch {
      // Ignore localStorage parse error
    }
  }, []);

  const allTemplates = [...DEFAULT_WORKFLOW_TEMPLATES, ...customTemplates];

  const applyTemplate = (tpl: WorkflowTemplate) => {
    setSelectedTemplateId(tpl.id);
    if (tpl.targetMode === 'pm_decompose') {
      setMode('pm_decompose');
      if (tpl.missionGoal) setMissionGoal(tpl.missionGoal);
      if (tpl.missionRequirements) setMissionRequirements(tpl.missionRequirements);
    } else {
      setMode('single');
      if (tpl.taskTitle) setTitle(tpl.taskTitle);
      if (tpl.taskDescription) setDescription(tpl.taskDescription);
      if (tpl.taskPriority) setPriority(tpl.taskPriority);
      if (tpl.taskTags) setTagsInput(tpl.taskTags.join(', '));
      if (tpl.recommendedModel) setModel(tpl.recommendedModel);
    }
  };

  const handleSaveCurrentAsTemplate = () => {
    const isPm = mode === 'pm_decompose';
    const name = isPm
      ? missionGoal.slice(0, 24).trim() || 'Custom Mission'
      : title.slice(0, 24).trim() || 'Custom Task';

    const newTpl: WorkflowTemplate = {
      id: 'custom-' + Date.now(),
      name,
      badge: '⭐ Custom',
      category: 'custom',
      description: isPm ? missionGoal : (description || title),
      targetMode: mode,
      missionGoal: isPm ? missionGoal : undefined,
      missionRequirements: isPm ? missionRequirements : undefined,
      taskTitle: !isPm ? title : undefined,
      taskDescription: !isPm ? description : undefined,
      taskPriority: !isPm ? priority : undefined,
      taskTags: !isPm ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      recommendedModel: model,
    };

    const updated = [newTpl, ...customTemplates];
    setCustomTemplates(updated);
    setSelectedTemplateId(newTpl.id);
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM_TEMPLATES, JSON.stringify(updated));
    } catch {
      // Storage unavailable
    }
  };

  if (!isCreateTaskModalOpen) return null;

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    addTask({
      title: title.trim(),
      description: description.trim() || 'Workforce task instruction',
      priority,
      assignedToAgentId: assignedAgentId || null,
      model,
      tags: tags.length ? tags : ['General'],
    });

    setTitle('');
    setDescription('');
    setCreateTaskModalOpen(false);
  };

  const handleDecomposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!missionGoal.trim() || isDecomposing) return;

    setIsDecomposing(true);
    try {
      await createMissionDecomposed(missionGoal.trim(), missionRequirements.trim());
      setMissionGoal('');
      setMissionRequirements('');
      setCreateTaskModalOpen(false);
    } finally {
      setIsDecomposing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header - Monochrome Minimalist */}
        <div className="p-4 border-b border-zinc-850 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-800">
              {mode === 'pm_decompose' ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                {mode === 'pm_decompose' ? 'ORCHESTRATE MISSION (PM DECOMPOSITION)' : 'BUAT TUGAS TUNGGAL (NEW TASK)'}
              </h3>
              <p className="text-[10px] text-zinc-400 font-sans">
                {mode === 'pm_decompose'
                  ? 'Product Manager AI akan memecah goal ke Frontend, Backend, & Intern'
                  : 'Tambahkan 1 tiket tugas manual ke papan backlog'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateTaskModalOpen(false)}
            className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow Template Quick Bar */}
        <div className="border-b border-zinc-800 bg-zinc-950/70 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1.5">
              <span>⚡ WORKFLOW TEMPLATES (1-CLICK)</span>
            </span>
            {((mode === 'pm_decompose' && missionGoal.trim()) || (mode === 'single' && title.trim())) && (
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="text-[10px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Bookmark className="w-3 h-3" />
                <span>Simpan Template</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow-sm'
                      : 'bg-zinc-900/90 text-zinc-300 border-zinc-800 hover:border-zinc-600 hover:text-white'
                  }`}
                  title={tpl.description}
                >
                  <span>{tpl.badge}</span>
                  <span>{tpl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('pm_decompose')}
            className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'pm_decompose'
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pecah Otomatis via PM (AI)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'single'
                ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tiket Manual Tunggal</span>
          </button>
        </div>

        {/* Form PM Decompose Mode */}
        {mode === 'pm_decompose' && (
          <form onSubmit={handleDecomposeSubmit} className="p-5 space-y-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300 font-sans flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Alur Kerja Otonom PM:</span>
                Product Manager AI menganalisis kebutuhan Anda via 9Router, lalu membuat tiket khusus terpisah untuk:
                <div className="flex gap-2 mt-1.5 font-mono text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800">💻 Front End</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800">⚙️ Back End</span>
                  <span className="px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800">🌱 Intern / QA</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                GOAL MISI / PRD FITUR *
              </label>
              <textarea
                rows={3}
                required
                disabled={isDecomposing}
                placeholder="Contoh: Buat sistem Autentikasi OAuth2 dengan Social Login (Google & GitHub) beserta dashboard profil pengguna..."
                value={missionGoal}
                onChange={(e) => setMissionGoal(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                PERSYARATAN & BATASAN TEKNIS (OPSIONAL)
              </label>
              <input
                type="text"
                disabled={isDecomposing}
                placeholder="Contoh: Gunakan JWT RS256, Tailwind styling, dan coverage unit test minimal 90%"
                value={missionRequirements}
                onChange={(e) => setMissionRequirements(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
            </div>

            {/* Live Token & Cost Estimator */}
            {missionGoal.trim().length > 0 && (() => {
              const estimate = estimateTokensAndCost(missionGoal + ' ' + missionRequirements, 'Architect', 2.5);
              return (
                <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estimasi Token & Biaya 9Router:</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-400">~{estimate.totalTokens} tokens</span>
                    <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      ${estimate.estimatedCostUsd.toFixed(5)} USD
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="pt-3 border-t border-zinc-850 flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">
                Memanggil model 9Router (Architect / Daily)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isDecomposing}
                  onClick={() => setCreateTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDecomposing || !missionGoal.trim()}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold font-mono transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isDecomposing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>PM Memecah Tugas...</span>
                    </>
                  ) : (
                    <>
                      <span>Pecah & Distribusikan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Form Single Task Mode */}
        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="p-5 space-y-4 text-xs">
            <div>
              <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                JUDUL TUGAS *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Implementasi OpenTelemetry distributed tracing"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>

          <div>
            <label className="block text-[10px] uppercase text-zinc-400 mb-1">
              DESKRIPSI & SPESIFIKASI
            </label>
            <textarea
              rows={3}
              placeholder="Instruksi dan kriteria penyelesaian tugas untuk agen AI..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                PRIORITAS
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-500 font-mono"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                MODEL LLM
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-500 font-mono"
              >
                <option value="Daily">Daily (Fast & Smart)</option>
                <option value="Coding_Specialist">Coding_Specialist (Code Specialist)</option>
                <option value="Architect">Architect (Reasoning)</option>
                <option value="Fast">Fast (Low Latency)</option>
                <option value="Reviewer">Reviewer (Auditor)</option>
                <option value="gemini/gemini-3.7-flash">Gemini 3.7 Flash</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                TUGASKAN KE AGEN
              </label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-zinc-500 font-mono"
              >
                <option value="">Antrean Umum (Pending)</option>
                {agents.map((ag) => (
                  <option key={ag.id} value={ag.id}>
                    {ag.name} ({ag.role.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-zinc-400 mb-1">
                TAGS (KOMA DIPISAH)
              </label>
              <input
                type="text"
                placeholder="Auth, Security, Redis"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
              />
            </div>
          </div>

          {/* Live Token & Cost Estimator for Single Task */}
          {title.trim().length > 0 && (() => {
            const estimate = estimateTokensAndCost(title + ' ' + description, model, 2.0);
            return (
              <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[11px] font-mono text-zinc-300">
                <div className="flex items-center gap-2">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Model {model}:</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">~{estimate.totalTokens} tokens</span>
                  <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    ${estimate.estimatedCostUsd.toFixed(5)} USD
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="pt-3 border-t border-zinc-850 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateTaskModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-black hover:bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold font-mono transition cursor-pointer shadow-sm"
            >
              Tugaskan
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
