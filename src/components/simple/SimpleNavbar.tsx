import React from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import {
  Layers,
  Play,
  Pause,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  Box,
  Kanban,
  Radio,
  LayoutGrid,
} from 'lucide-react';

export type SimpleViewTab = 'office3d' | 'kanban' | 'activity' | 'grid2d';

interface SimpleNavbarProps {
  currentTab: SimpleViewTab;
  onTabChange: (tab: SimpleViewTab) => void;
}

export const SimpleNavbar: React.FC<SimpleNavbarProps> = ({ currentTab, onTabChange }) => {
  const {
    mission,
    tasks,
    simulationRunning,
    simulationSpeed,
    soundEnabled,
    toggleSimulation,
    setSimulationSpeed,
    setSoundEnabled,
    resetSimulation,
    setCreateTaskModalOpen,
  } = useOfficeStore();

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="bg-black border-b border-zinc-850 text-zinc-100 px-4 py-2.5 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Mission Status - Monochrome Minimalism */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-100 text-black flex items-center justify-center font-bold shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm tracking-tight text-white uppercase font-mono">
                AI WORKFORCE ORCHESTRA
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 font-semibold">
                MINIMAL
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate max-w-xs md:max-w-md font-mono">
              MISI: <span className="text-zinc-200">{mission.title}</span> ({progressPct}%)
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Monochrome Minimalist) */}
        <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
          <button
            onClick={() => onTabChange('office3d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentTab === 'office3d'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Kantor 3D
          </button>

          <button
            onClick={() => onTabChange('kanban')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentTab === 'kanban'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" /> Tugas ({tasks.length})
          </button>

          <button
            onClick={() => onTabChange('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentTab === 'activity'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Aktivitas
          </button>

          <button
            onClick={() => onTabChange('grid2d')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              currentTab === 'grid2d'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Meja 2D
          </button>
        </div>

        {/* Quick Simulation Controls (Monochrome Minimalist) */}
        <div className="flex items-center gap-2">
          {/* Play/Pause */}
          <button
            onClick={() => toggleSimulation()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition cursor-pointer border ${
              simulationRunning
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-800'
                : 'bg-zinc-100 hover:bg-white text-zinc-950 border-zinc-200 shadow'
            }`}
          >
            {simulationRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" /> JEDA
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> MULAI
              </>
            )}
          </button>

          {/* Speed Toggle */}
          <button
            onClick={() => setSimulationSpeed(simulationSpeed === 1 ? 2 : 1)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition"
            title="Kecepatan Simulasi"
          >
            {simulationSpeed}x
          </button>

          {/* Add Task */}
          <button
            onClick={() => setCreateTaskModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-mono border border-zinc-750 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> TUGAS BARU
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition"
            title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-zinc-100" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset */}
          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white transition"
            title="Reset Simulasi"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
