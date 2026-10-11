import React, { useState, useEffect } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import {
  Sparkles,
  GitBranch,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Volume2,
  VolumeX,
  RotateCcw,
  Plus,
  Play,
  Pause,
  Layers,
  ChevronDown,
} from 'lucide-react';

export const MissionControl: React.FC = () => {
  const {
    mission,
    tasks,
    soundEnabled,
    simulationRunning,
    setSoundEnabled,
    toggleSimulation,
    resetSimulation,
    triggerEscalation,
    resolveEscalation,
    injectBugTest,
    setCreateTaskModalOpen,
  } = useOfficeStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(480);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-lg z-30">
      {/* Brand & Mission Title */}
      <div className="flex items-center gap-3 min-w-[280px]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 border border-indigo-400/30">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              AI Workforce Orchestra
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                v2.4 SIMULATOR
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200 truncate max-w-[260px] md:max-w-md">
              {mission.title}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* Progress & Timing Widget */}
      <div className="flex items-center gap-4 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs">
        {/* Mission Progress */}
        <div className="flex flex-col gap-1 min-w-[130px]">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Progress</span>
            <span className="text-indigo-300 font-bold">{progressPct}%</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Tasks done */}
        <div className="text-left font-mono">
          <div className="text-[10px] text-slate-400 uppercase">Tasks</div>
          <div className="text-slate-200 font-semibold">
            {completedCount} / {totalCount}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Elapsed */}
        <div className="text-left font-mono">
          <div className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Elapsed
          </div>
          <div className="text-slate-200 font-semibold">{formatDuration(elapsedSeconds)}</div>
        </div>

        <div className="h-6 w-px bg-slate-800" />

        {/* Target branch */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-slate-400">
          <GitBranch className="w-3.5 h-3.5 text-slate-400" />
          <span>{mission.targetBranch}</span>
        </div>
      </div>

      {/* Simulation Operations & Interactive Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCreateTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/30 transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Task
        </button>

        {/* Trigger / Resolve Escalation demo buttons */}
        <button
          onClick={triggerEscalation}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
          title="Simulate upstream dependency blocker"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Escalate</span>
        </button>

        <button
          onClick={resolveEscalation}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
          title="Resolve active agent blocker"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Resolve</span>
        </button>

        <button
          onClick={injectBugTest}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-medium transition cursor-pointer"
          title="Inject a high-priority bug incident into sprint"
        >
          <Bug className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden sm:inline">Inject Bug</span>
        </button>

        {/* Audio feedback toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
            soundEnabled
              ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-400'
              : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
          }`}
          title={soundEnabled ? 'Mute SFX' : 'Enable Web Audio SFX'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Reset simulation */}
        <button
          onClick={resetSimulation}
          className="p-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 text-slate-400 hover:text-white transition cursor-pointer"
          title="Reset All Simulation States"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
