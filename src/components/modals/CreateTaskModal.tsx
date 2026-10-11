import React, { useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { TaskPriority } from '../../types/office';
import { X, Plus } from 'lucide-react';

export const CreateTaskModal: React.FC = () => {
  const {
    isCreateTaskModalOpen,
    setCreateTaskModalOpen,
    addTask,
    agents,
  } = useOfficeStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assignedAgentId, setAssignedAgentId] = useState<string>('');
  const [model, setModel] = useState('DeepSeek-Coder-V2');
  const [tagsInput, setTagsInput] = useState('Feature, Backend');

  if (!isCreateTaskModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-sans">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col font-mono">
        {/* Header - Monochrome Minimalist */}
        <div className="p-4 border-b border-zinc-850 bg-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-800">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-white">
              BUAT TUGAS BARU (NEW TASK)
            </h3>
          </div>
          <button
            onClick={() => setCreateTaskModalOpen(false)}
            className="p-1.5 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
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
                <option value="Claude-3.5-Sonnet">Claude-3.5-Sonnet</option>
                <option value="DeepSeek-Coder-V2">DeepSeek-Coder-V2</option>
                <option value="GPT-4o">GPT-4o</option>
                <option value="Gemini 1.5 Pro">Gemini 1.5 Pro</option>
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
      </div>
    </div>
  );
};
