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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 font-sans">
      <div className="bg-zinc-950 border border-zinc-800/90 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-850/80 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              {mode === 'pm_decompose' ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4 text-zinc-300" />}
            </div>
            <div>
              <h3 className="font-semibold text-xs tracking-wide text-zinc-100 uppercase">
                {mode === 'pm_decompose' ? 'Orchestrate Mission' : 'Buat Tugas Baru'}
              </h3>
              <p className="text-[11px] text-zinc-400 font-sans mt-0.5">
                {mode === 'pm_decompose'
                  ? 'PM AI memecah goal menjadi tugas terkoordinasi'
                  : 'Tambah tiket manual ke antrean agen'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateTaskModalOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="px-5 pt-3 pb-2 bg-zinc-950">
          <div className="grid grid-cols-2 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('pm_decompose')}
              className={`py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'pm_decompose'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pecah Otomatis (PM)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`py-1.5 px-3 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'single'
                  ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tiket Manual</span>
            </button>
          </div>
        </div>

        {/* Workflow Template Quick Bar */}
        <div className="px-5 py-2.5 border-b border-zinc-850/80 bg-zinc-900/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              Workflow Presets
            </span>
            {((mode === 'pm_decompose' && missionGoal.trim()) || (mode === 'single' && title.trim())) && (
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="text-[10px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Bookmark className="w-3 h-3" />
                <span>Simpan Form</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {allTemplates.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => applyTemplate(tpl)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition flex items-center gap-1.5 border cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-200 text-zinc-950 border-white font-bold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                  }`}
                  title={tpl.description}
                >
                  <span className="text-xs">{tpl.badge.split(' ')[0]}</span>
                  <span>{tpl.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form PM Decompose Mode */}
        {mode === 'pm_decompose' && (
          <form onSubmit={handleDecomposeSubmit} className="p-5 space-y-4">
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-[11px] text-zinc-300 font-sans flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-zinc-100">Alur Kerja Tim Otomatis:</span>
                <span className="text-zinc-400 ml-1">PM AI akan membagi goal ke peran Front End, Back End, dan QA/Intern.</span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Goal / Deskripsi Kebutuhan *
              </label>
              <textarea
                rows={3}
                required
                disabled={isDecomposing}
                placeholder="Deskripsikan fitur atau kebutuhan sistem yang ingin dibangun..."
                value={missionGoal}
                onChange={(e) => setMissionGoal(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition resize-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Batasan Teknis (Opsional)
              </label>
              <input
                type="text"
                disabled={isDecomposing}
                placeholder="e.g., Gunakan TypeScript strict, unit test coverage, Prisma schema..."
                value={missionRequirements}
                onChange={(e) => setMissionRequirements(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition"
              />
            </div>

            {/* Live Token & Cost Estimator */}
            {missionGoal.trim().length > 0 && (() => {
              const estimate = estimateTokensAndCost(missionGoal + ' ' + missionRequirements, 'Architect', 2.5);
              return (
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estimasi Biaya 9Router:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">~{estimate.totalTokens} tokens</span>
                    <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/60">
                      ${estimate.estimatedCostUsd.toFixed(5)} USD
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDecomposing}
                onClick={() => setCreateTaskModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isDecomposing || !missionGoal.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isDecomposing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Distribusikan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Form Single Task Mode */}
        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Judul Tugas *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Implementasi endpoint auth refresh token"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                Deskripsi & Instruksi
              </label>
              <textarea
                rows={3}
                placeholder="Rincian instruksi pelaksanaan tugas untuk agen..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Prioritas
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 transition"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Model AI
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 transition"
                >
                  <option value="Daily">Daily (Fast & Smart)</option>
                  <option value="Coding_Specialist">Coding_Specialist</option>
                  <option value="Architect">Architect (Reasoning)</option>
                  <option value="Fast">Fast (Low Latency)</option>
                  <option value="Reviewer">Reviewer (Auditor)</option>
                  <option value="gemini/gemini-3.7-flash">Gemini 3.7 Flash</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Tugaskan Ke
                </label>
                <select
                  value={assignedAgentId}
                  onChange={(e) => setAssignedAgentId(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-500 transition"
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
                <label className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-1.5 font-medium">
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Backend, Security, API"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition"
                />
              </div>
            </div>

            {/* Live Token & Cost Estimator */}
            {title.trim().length > 0 && (() => {
              const estimate = estimateTokensAndCost(title + ' ' + description, model, 2.0);
              return (
                <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-300">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Model {model}:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">~{estimate.totalTokens} tokens</span>
                    <span className="text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/60">
                      ${estimate.estimatedCostUsd.toFixed(5)} USD
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateTaskModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-transparent hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold transition cursor-pointer shadow-sm"
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
