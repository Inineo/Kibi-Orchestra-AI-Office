import React, { useState, useEffect, lazy, Suspense } from 'react';
import { ShadcnLayout, DashboardTab } from './components/layout/ShadcnLayout';

// OPT-01/02: Lazy-load 3D scene so Three.js (~600 KB) is code-split into a separate chunk.
// When user switches to a non-3D tab, OfficeCanvas unmounts → WebGL context + all GPU
// resources are freed, saving ~800 MB RAM and ~12% GPU.
const OfficeCanvas = lazy(() => import('./components/office3d/OfficeCanvas'));
import { SimpleOfficeFloor } from './components/simple/SimpleOfficeFloor';
import { SimpleKanban } from './components/simple/SimpleKanban';
import { SimpleActivityFeed } from './components/simple/SimpleActivityFeed';
import { AgentSettingsTab } from './components/simple/AgentSettingsTab';
import { AgentDetailModal } from './components/modals/AgentDetailModal';
import { TaskDetailModal } from './components/modals/TaskDetailModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { useOfficeStore } from './stores/useOfficeStore';

export default function App() {
  const [currentTab, setCurrentTab] = useState<DashboardTab>('office3d');

  const {
    simulationRunning,
    simulationSpeed,
    stepSimulation,
    toggleSimulation,
    selectAgent,
    selectTask,
  } = useOfficeStore();

  // Run real-time autonomous simulation loop in background
  useEffect(() => {
    if (!simulationRunning) return;

    // Real-time ticking every 2.4s / speed factor
    const intervalMs = Math.round(2400 / simulationSpeed);
    const timer = setInterval(() => {
      if (document.hidden) return; // OPT-10: Skip simulation ticks when tab is hidden
      stepSimulation();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [simulationRunning, simulationSpeed, stepSimulation]);

  // Keyboard shortcut listener (Space = Pause/Play, Esc = close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggleSimulation();
      } else if (e.code === 'Escape') {
        selectAgent(null);
        selectTask(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSimulation, selectAgent, selectTask]);

  return (
    <ShadcnLayout currentTab={currentTab} onTabChange={setCurrentTab}>
      {/* View Router */}
      {currentTab === 'office3d' && (
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-black">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin" />
                <span className="text-zinc-500 font-mono text-xs tracking-wider">LOADING 3D OFFICE...</span>
              </div>
            </div>
          }
        >
          <div className="w-full h-full relative">
            <OfficeCanvas />
          </div>
        </Suspense>
      )}

      {currentTab === 'settings' && (
        <div className="w-full h-full overflow-y-auto">
          <AgentSettingsTab />
        </div>
      )}

      {currentTab === 'kanban' && (
        <div className="w-full h-full overflow-y-auto">
          <SimpleKanban />
        </div>
      )}

      {currentTab === 'activity' && (
        <div className="w-full h-full overflow-y-auto">
          <SimpleActivityFeed />
        </div>
      )}

      {currentTab === 'grid2d' && (
        <div className="w-full h-full overflow-y-auto">
          <SimpleOfficeFloor />
        </div>
      )}

      {/* Global Interactive Modals */}
      <AgentDetailModal />
      <TaskDetailModal />
      <CreateTaskModal />
    </ShadcnLayout>
  );
}
