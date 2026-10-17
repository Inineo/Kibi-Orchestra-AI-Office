import React, { useState, useEffect } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { TaskPriority } from '../../types/office';
import { estimateTokensAndCost } from '../../lib/aiClient';
import {
  DEFAULT_WORKFLOW_TEMPLATES,
  WorkflowTemplate,
} from '../../data/workflowTemplates';
import { X, Plus, Sparkles, Layers, Bot, ArrowRight, Loader2, Coins, Bookmark, Trash2 } from 'lucide-react';

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
      badge: '[CUSTOM]',
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

  const handleDeleteSelectedTemplate = () => {
    if (!selectedTemplateId?.startsWith('custom-')) return;

    const updated = customTemplates.filter((template) => template.id !== selectedTemplateId);
    setCustomTemplates(updated);
    setSelectedTemplateId(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150 font-mono">
      <div className="bg-zinc-950 border border-zinc-600 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-850/80 bg-zinc-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
              {mode === 'pm_decompose' ? <Sparkles className="w-4 h-4 text-zinc-300" /> : <Plus className="w-4 h-4 text-zinc-300" />}
            </div>
            <div>
              <h3 className="font-semibold text-xs tracking-wide text-zinc-100 uppercase">
                {mode === 'pm_decompose' ? 'Orchestrate Mission' : 'Buat Tugas Baru'}
              </h3>
              <p className="mt-0.5 font-mono text-[11px] text-zinc-400">
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
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-zinc-700 bg-zinc-900 p-1">
            <button
              type="button"
              onClick={() => setMode('pm_decompose')}
              className={`h-9 w-full rounded-lg px-3 font-mono text-[11px] font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'pm_decompose'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pecah Otomatis (PM)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`h-9 w-full rounded-lg px-3 font-mono text-[11px] font-medium transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'single'
                  ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                  : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tiket Manual</span>
            </button>
          </div>
        </div>

          <div className="px-5 py-3 border-b border-zinc-700 bg-zinc-900/70">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-500">
                Workflow presets
              </span>
              <div className="flex items-center gap-3">
                {selectedTemplateId?.startsWith('custom-') && (
                  <button
                    id="delete-selected-template"
                    type="button"
                    onClick={handleDeleteSelectedTemplate}
                    className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 transition hover:text-zinc-200"
                    title="Hapus template terpilih"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Hapus</span>
                  </button>
                )}
                {((mode === 'pm_decompose' && missionGoal.trim()) || (mode === 'single' && title.trim())) && (
                  <button
                    type="button"
                    onClick={handleSaveCurrentAsTemplate}
                    className="flex items-center gap-1 font-mono text-[10px] text-zinc-500 transition hover:text-zinc-200"
                  >
                    <Bookmark className="h-3 w-3" />
                    <span>Simpan</span>
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl)}
                    className={`flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[10px] leading-4 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500 ${
                      isSelected
                        ? 'border-zinc-200 bg-zinc-100 text-zinc-950'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100'
                    }`}
                    title={tpl.description}
                  >
                    <span>{tpl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

        {/* Form PM Decompose Mode */}
        {mode === 'pm_decompose' && (
          <form onSubmit={handleDecomposeSubmit} className="h-[380px] overflow-y-auto p-5 space-y-4">
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80 text-[11px] text-zinc-300 font-mono flex items-start gap-2.5">
              <Bot className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
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
                    <Coins className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Estimasi Biaya 9Router:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">~{estimate.totalTokens} tokens</span>
                    <span className="text-zinc-200 font-semibold bg-zinc-800 px-2 py-0.5 rounded-md border border-zinc-700">
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
                className="h-8 rounded-md bg-zinc-100 px-3 font-mono text-xs font-medium text-zinc-950 transition hover:bg-white cursor-pointer flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
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
          <form onSubmit={handleSingleSubmit} className="h-[380px] overflow-y-auto space-y-3 p-5">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Judul tugas <span className="text-zinc-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Implementasi endpoint auth refresh token"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">
                Brief & instruksi
              </label>
              <textarea
                rows={3}
                placeholder="Konteks, kriteria selesai, dan catatan untuk agen..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-20 w-full resize-none rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs leading-relaxed text-zinc-100 placeholder:text-zinc-600 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Prioritas</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 font-mono text-xs text-zinc-300 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Model AI</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 font-mono text-xs text-zinc-300 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400">
                  <option value="Daily">Daily (Fast & Smart)</option><option value="Coding_Specialist">Coding_Specialist</option><option value="Architect">Architect (Reasoning)</option><option value="Fast">Fast (Low Latency)</option><option value="Reviewer">Reviewer (Auditor)</option><option value="gemini/gemini-3.7-flash">Gemini 3.7 Flash</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Tugaskan ke</label>
                <select value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)} className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 font-mono text-xs text-zinc-300 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400">
                  <option value="">Antrean umum (pending)</option>
                  {agents.map((ag) => <option key={ag.id} value={ag.id}>{ag.name} ({ag.role.toUpperCase()})</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-zinc-400">Tags <span className="font-normal text-zinc-500">pisahkan dengan koma</span></label>
                <input type="text" placeholder="Backend, Security, API" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 transition focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400" />
              </div>
            </div>

            {title.trim().length > 0 && (() => {
              const estimate = estimateTokensAndCost(title + ' ' + description, model, 2.0);
              return (
                <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-[11px]">
                  <div className="flex items-center gap-2 text-zinc-400"><Coins className="h-3.5 w-3.5" /><span>Model {model}</span></div>
                  <div className="flex items-center gap-2"><span className="text-zinc-500">~{estimate.totalTokens} token</span><span className="rounded-md bg-zinc-800 px-2 py-0.5 font-medium text-zinc-200">${estimate.estimatedCostUsd.toFixed(5)}</span></div>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
              <button type="button" onClick={() => setCreateTaskModalOpen(false)} className="h-8 rounded-md border border-zinc-800 px-3 font-mono text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-100">Batal</button>
              <button type="submit" className="h-8 rounded-md bg-zinc-100 px-3 font-mono text-xs font-medium text-zinc-950 transition hover:bg-white">Tugaskan</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
