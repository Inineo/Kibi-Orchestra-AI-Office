import React, { useEffect, useRef } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { ThreeOfficeScene } from './ThreeOfficeScene';
import {
  Compass,
  RotateCw,
  Bot,
  Coffee,
  Smartphone,
  Moon,
  Activity,
  Code2,
} from 'lucide-react';

export const OfficeCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ThreeOfficeScene | null>(null);

  const {
    agents,
    cameraPreset,
    focusedAgentId,
    hoveredAgentId,
    selectAgent,
    focusAgent,
    setHoveredAgent,
    setCameraPreset,
  } = useOfficeStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new ThreeOfficeScene(containerRef.current, {
      onSelectAgent: (id) => selectAgent(id),
      onHoverAgent: (id) => setHoveredAgent(id),
      onUserRotate: () => {
        setCameraPreset('free');
      },
    });
    sceneRef.current = scene;

    return () => {
      scene.destroy();
      sceneRef.current = null;
    };
  }, [selectAgent, setHoveredAgent]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.syncAgents(agents);
    }
  }, [agents]);

  useEffect(() => {
    if (sceneRef.current) {
      if (cameraPreset === 'agent' && focusedAgentId) {
        sceneRef.current.focusOnAgent(focusedAgentId);
      } else if (cameraPreset !== 'agent' && cameraPreset !== 'free') {
        sceneRef.current.setCameraPreset(cameraPreset as 'isometric' | 'topdown' | 'front');
      }
    }
  }, [cameraPreset, focusedAgentId]);

  const hoveredAgent = agents.find((a) => a.id === hoveredAgentId);

  const handleFocusZone = (zone: 'all' | 'orchestra' | 'developer' | 'writer') => {
    if (sceneRef.current) {
      focusAgent(null);
      sceneRef.current.focusZone(zone);
    }
  };

  const getAgentActivityBadge = (agent: (typeof agents)[0]) => {
    if (agent.status === 'coding') {
      return { label: 'Coding', icon: '💻' };
    }
    if (agent.status === 'planning') {
      return {
        label: agent.department === 'orchestra' ? 'Orkestrasi' : 'Planning',
        icon: agent.department === 'orchestra' ? '🪄' : '💭',
      };
    }
    if (agent.status === 'testing') {
      return { label: 'Testing', icon: '🧪' };
    }
    if (agent.status === 'reviewing') {
      return { label: 'Reviewing', icon: '🔍' };
    }
    if (agent.status === 'blocked') {
      return { label: 'Blocked', icon: '⚠️' };
    }

    // Idle location & social activities
    if (agent.locationState === 'chatting') {
      return { label: 'Mengobrol', icon: '💬' };
    }
    if (agent.locationState === 'walking') {
      return { label: 'Mondar-mandir', icon: '🚶‍♂️' };
    }
    if (agent.locationState === 'coffee_bar' || agent.idleActivity === 'coffee') {
      return { label: 'Coffee Bar', icon: '☕' };
    }
    if (agent.locationState === 'lounge' || agent.idleActivity === 'phone') {
      return { label: 'Sofa Lounge', icon: '🛋️' };
    }
    if (agent.locationState === 'whiteboard') {
      return { label: 'Whiteboard', icon: '📋' };
    }
    if (agent.idleActivity === 'nap') {
      return { label: 'Power Nap', icon: '😴' };
    }
    return { label: 'Standby', icon: '💤' };
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black font-sans">
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating Zone & Camera Preset Controls (Monochrome Minimalist) */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 p-1.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl shadow-2xl text-xs">
        {/* Zone switcher buttons */}
        <div className="flex items-center gap-1 pr-2 border-r border-zinc-800">
          <span className="px-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
            ZONA:
          </span>
          <button
            onClick={() => handleFocusZone('all')}
            className="px-2.5 py-1 rounded-lg font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            Semua
          </button>
          <button
            onClick={() => handleFocusZone('orchestra')}
            className="px-2.5 py-1 rounded-lg font-medium text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60 transition"
          >
            Orchestra
          </button>
          <button
            onClick={() => handleFocusZone('developer')}
            className="px-2.5 py-1 rounded-lg font-medium text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60 transition"
          >
            Developer
          </button>
          <button
            onClick={() => handleFocusZone('writer')}
            className="px-2.5 py-1 rounded-lg font-medium text-zinc-200 hover:bg-zinc-800 border border-zinc-700/60 transition"
          >
            Writer
          </button>
        </div>

        {/* Camera angle presets */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setCameraPreset('isometric');
              focusAgent(null);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
              cameraPreset === 'isometric'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Isometrik
          </button>
          <button
            onClick={() => {
              setCameraPreset('topdown');
              focusAgent(null);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
              cameraPreset === 'topdown'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Atas
          </button>
          <button
            onClick={() => {
              setCameraPreset('front');
              focusAgent(null);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-medium transition ${
              cameraPreset === 'front'
                ? 'bg-zinc-100 text-zinc-950 font-semibold shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Depan
          </button>
          <button
            onClick={() => handleFocusZone('all')}
            className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
            title="Reset Sudut"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Hover Tooltip (Monochrome Minimalist) */}
      {hoveredAgent && (
        <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-100">
          <div className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 shadow-2xl rounded-2xl p-3.5 w-72 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-zinc-700"
                  style={{ backgroundColor: hoveredAgent.color }}
                />
                <div>
                  <h4 className="font-bold text-xs text-zinc-100">{hoveredAgent.name}</h4>
                  <p className="text-[10px] text-zinc-400 uppercase font-mono tracking-wider">
                    {hoveredAgent.title}
                  </p>
                </div>
              </div>

              {/* Status or Idle Activity Badge */}
              <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-zinc-900 text-zinc-200 border border-zinc-800 flex items-center gap-1">
                <span>{getAgentActivityBadge(hoveredAgent).icon}</span>
                <span>{getAgentActivityBadge(hoveredAgent).label}</span>
              </span>
            </div>

            <div className="text-[11px] text-zinc-300 bg-zinc-900/80 p-2 rounded-xl border border-zinc-800 mb-2 truncate font-mono">
              {hoveredAgent.currentTask ? (
                hoveredAgent.currentTask
              ) : (
                <span className="text-zinc-400">{hoveredAgent.currentAction}</span>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span>{hoveredAgent.model}</span>
              <span>Progres: {hoveredAgent.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-zinc-200 rounded-full"
                style={{ width: `${hoveredAgent.progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Clean Agent Squad Carousel Bar (Monochrome Minimalist) */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-xl overflow-x-auto max-w-full">
          <span className="text-[11px] font-mono text-zinc-400 px-2 flex items-center gap-1 shrink-0 font-medium">
            <Bot className="w-3.5 h-3.5 text-zinc-300" /> AGEN:
          </span>
          {agents.map((agent) => {
            const isSelected = focusedAgentId === agent.id;
            const activity = getAgentActivityBadge(agent);

            return (
              <button
                key={agent.id}
                onClick={() => {
                  focusAgent(agent.id);
                  selectAgent(agent.id);
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-xl text-xs transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-zinc-800 text-white ring-1 ring-zinc-500 shadow'
                    : 'bg-zinc-900/70 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800/80'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="font-medium text-[11px]">{agent.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-950 font-mono text-zinc-400 border border-zinc-800 flex items-center gap-1">
                  <span>{activity.icon}</span>
                  <span>{activity.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
