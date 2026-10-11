import React, { useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import {
  BarChart3,
  Bot,
  CheckCircle2,
  TrendingUp,
  Clock,
  DollarSign,
  Cpu,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const StatsPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const { getStats } = useOfficeStore();
  const stats = getStats();

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="absolute top-16 right-4 z-20 w-64 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl text-white select-none transition-all overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800/80 hover:bg-slate-800/40 transition text-xs font-semibold"
      >
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span>Workforce Metrics</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[10px] font-mono font-normal">
            {stats.activeAgents}/{stats.totalAgents} Active
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Metric Items */}
      {isExpanded && (
        <div className="p-3 space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                <Bot className="w-3 h-3 text-cyan-400" /> Active Agents
              </div>
              <div className="text-sm font-bold font-mono text-cyan-300">
                {stats.activeAgents} / {stats.totalAgents}
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Tasks Done
              </div>
              <div className="text-sm font-bold font-mono text-emerald-300">
                {stats.tasksDone} / {stats.tasksTotal}
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                <TrendingUp className="w-3 h-3 text-indigo-400" /> Success Rate
              </div>
              <div className="text-sm font-bold font-mono text-indigo-300">
                {stats.successRate}%
              </div>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
              <div className="text-[10px] text-slate-400 flex items-center gap-1 mb-0.5">
                <Clock className="w-3 h-3 text-amber-400" /> Avg Task Time
              </div>
              <div className="text-sm font-bold font-mono text-amber-300">
                {formatTime(stats.avgTimeSeconds)}
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-purple-400" /> Tokens Generated
            </span>
            <span className="text-slate-200 font-semibold">
              {(stats.tokensProcessed / 1000).toFixed(1)}k
            </span>
          </div>

          <div className="bg-slate-950/70 p-2 rounded-xl border border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-emerald-400" /> Estimated LLM Cost
            </span>
            <span className="text-emerald-400 font-bold">
              ${stats.totalCostUsd.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
