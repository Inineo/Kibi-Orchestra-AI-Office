import React, { useState, useEffect } from 'react';
import { ShadcnLayout, DashboardTab } from './components/layout/ShadcnLayout';
import { OfficeCanvas } from './components/office3d/OfficeCanvas';
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
        <div className="w-full h-full relative">
          <OfficeCanvas />
        </div>
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
