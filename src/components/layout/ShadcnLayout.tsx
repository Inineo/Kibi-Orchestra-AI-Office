import React, { useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Box,
  Kanban,
  Radio,
  LayoutGrid,
  Play,
  Pause,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  ChevronRight,
  Menu,
  X,
  Bot,
  Activity,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

export type DashboardTab = 'office3d' | 'kanban' | 'activity' | 'grid2d' | 'settings';

interface ShadcnLayoutProps {
  currentTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  children: React.ReactNode;
}

export const ShadcnLayout: React.FC<ShadcnLayoutProps> = ({
  currentTab,
  onTabChange,
  children,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    mission,
    agents,
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
  const activeAgentsCount = agents.filter((a) => a.status !== 'idle').length;

  const navItems = [
    { key: 'office3d' as const, label: 'Kantor 3D', icon: Box, desc: 'Simulasi 3D Real-time' },
    { key: 'settings' as const, label: 'Model & Agen', icon: Cpu, desc: 'Ganti nama & model API' },
    { key: 'kanban' as const, label: 'Papan Tugas', icon: Kanban, desc: `${tasks.length} item antrean` },
    { key: 'activity' as const, label: 'Aktivitas', icon: Radio, desc: 'Live event stream' },
    { key: 'grid2d' as const, label: 'Meja 2D', icon: LayoutGrid, desc: '3 zona departemen' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black text-zinc-100 font-sans antialiased">
      {/* 1. SHADCN SIDEBAR */}
      <aside
        className={`flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-200 z-30 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Organization / Project Logo */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-3.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 font-bold shadow-sm">
              <Layers className="h-4 w-4" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col min-w-0">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-white truncate">
                  AI Orchestra
                </span>
                <span className="font-mono text-[10px] text-zinc-400 truncate">
                  Virtual Workspace
                </span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-7 w-7 text-zinc-400 hover:text-white"
            title={sidebarOpen ? 'Ciutkan Sidebar' : 'Perluas Sidebar'}
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 space-y-1.5 p-2 overflow-y-auto">
          {sidebarOpen && (
            <div className="px-2 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              Navigasi Utama
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onTabChange(item.key)}
                className={`group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition cursor-pointer select-none ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm font-semibold'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                }`}
                title={item.label}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-zinc-950' : 'text-zinc-400'}`} />
                {sidebarOpen && (
                  <div className="flex flex-1 items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    <span
                      className={`text-[10px] font-mono opacity-80 ${
                        isActive ? 'text-zinc-700' : 'text-zinc-400'
                      }`}
                    >
                      {item.key === 'kanban' ? tasks.length : ''}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Workforce Live Status Card at Bottom of Sidebar */}
        {sidebarOpen && (
          <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 font-mono text-[11px] space-y-2">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-zinc-200" /> Tim Aktif
              </span>
              <span className="text-zinc-100 font-bold">
                {activeAgentsCount} / {agents.length}
              </span>
            </div>

            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-zinc-200" /> Tugas Selesai
              </span>
              <span className="text-zinc-100 font-bold">
                {completedCount} / {totalCount}
              </span>
            </div>

            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-zinc-200 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
      </aside>

      {/* 2. MAIN APP CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* SHADCN TOP HEADER BAR */}
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 bg-black px-4 z-20">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400">Workspace</span>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-zinc-200 font-medium truncate max-w-xs md:max-w-md">
              {mission.title}
            </span>
            <Badge variant="outline" className="hidden sm:inline-flex text-zinc-400">
              {progressPct}% SELESAI
            </Badge>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2">
            {/* Play/Pause Button */}
            <Button
              variant={simulationRunning ? 'secondary' : 'default'}
              size="sm"
              onClick={() => toggleSimulation()}
              className="gap-1.5 font-mono text-xs"
            >
              {simulationRunning ? (
                <>
                  <Pause className="h-3.5 w-3.5 text-zinc-400" /> JEDA
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" /> MULAI
                </>
              )}
            </Button>

            {/* Speed Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSimulationSpeed(simulationSpeed === 1 ? 2 : 1)}
              className="font-mono text-xs px-2.5"
              title="Kecepatan Simulasi"
            >
              {simulationSpeed}x
            </Button>

            {/* Add Task Button */}
            <Button
              variant="default"
              size="sm"
              onClick={() => setCreateTaskModalOpen(true)}
              className="gap-1 font-mono text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> TUGAS BARU
            </Button>

            {/* SFX Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8 text-zinc-400 hover:text-white"
              title={soundEnabled ? 'Matikan Audio' : 'Aktifkan Audio'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4 text-zinc-100" /> : <VolumeX className="h-4 w-4" />}
            </Button>

            {/* Reset */}
            <Button
              variant="ghost"
              size="icon"
              onClick={resetSimulation}
              className="h-8 w-8 text-zinc-400 hover:text-white"
              title="Reset Simulasi"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 overflow-hidden relative bg-black">
          {children}
        </main>
      </div>
    </div>
  );
};
