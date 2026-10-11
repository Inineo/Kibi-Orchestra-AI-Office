import React, { useRef, useEffect, useState } from 'react';
import { useOfficeStore } from '../../stores/useOfficeStore';
import { EventType, OfficeEvent } from '../../types/office';
import {
  Radio,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCode,
  MessageSquare,
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';

export const EventStream: React.FC<{
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}> = ({ isCollapsed, onToggleCollapse }) => {
  const {
    events,
    eventFilter,
    setEventFilter,
    clearEvents,
    focusAgent,
    selectAgent,
    selectTask,
  } = useOfficeStore();

  const [autoScroll, setAutoScroll] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new events
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [events, autoScroll]);

  const filteredEvents = events.filter((e) => {
    if (eventFilter === 'all') return true;
    return e.type === eventFilter;
  });

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'start':
        return <Play className="w-3.5 h-3.5 text-blue-400" />;
      case 'progress':
        return <Activity className="w-3.5 h-3.5 text-cyan-400" />;
      case 'complete':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'escalation':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
      case 'error':
        return <XCircle className="w-3.5 h-3.5 text-rose-400" />;
      case 'artifact':
        return <FileCode className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <MessageSquare className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const getBadgeClass = (type: EventType) => {
    switch (type) {
      case 'start':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'progress':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'complete':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'escalation':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'error':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'artifact':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-200 select-none z-20 shadow-2xl transition-all duration-200 flex flex-col">
      {/* Event Stream Header */}
      <div className="px-4 py-2 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span className="font-semibold text-slate-100 uppercase tracking-wider text-[11px]">
            Live Event Stream
          </span>
          <span className="text-[10px] font-mono px-2 py-0.2 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
            {events.length} logs
          </span>
        </div>

        {/* Filter Badges */}
        <div className="hidden md:flex items-center gap-1">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'start', label: 'Start' },
              { key: 'progress', label: 'Progress' },
              { key: 'complete', label: 'Done' },
              { key: 'escalation', label: 'Escalations' },
              { key: 'artifact', label: 'Artifacts' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setEventFilter(item.key)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase transition ${
                eventFilter === item.key
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
              autoScroll ? 'text-indigo-400 bg-indigo-950/60 border border-indigo-700/50' : 'text-slate-400'
            }`}
          >
            Auto-Scroll
          </button>
          <button
            onClick={clearEvents}
            className="p-1 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded transition"
            title="Clear Stream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
            title={isCollapsed ? 'Expand Log Drawer' : 'Collapse Log Drawer'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {!isCollapsed && (
        <div
          ref={scrollContainerRef}
          className="h-36 md:h-44 overflow-y-auto p-2.5 space-y-1.5 font-mono text-[11px]"
        >
          {filteredEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-500 italic">No events recorded in this filter view.</div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-slate-800 transition group"
              >
                {/* Timestamp */}
                <span className="text-slate-500 shrink-0 select-text">{evt.timestamp}</span>

                {/* Event Type Icon & Tag */}
                <span className="shrink-0 mt-0.5">{getEventIcon(evt.type)}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 border ${getBadgeClass(
                    evt.type
                  )}`}
                >
                  {evt.type}
                </span>

                {/* Message Body */}
                <div className="flex-1 min-w-0">
                  <span className="text-slate-200 select-text leading-tight">{evt.message}</span>
                  {evt.details && (
                    <div className="text-[10px] text-slate-400 mt-0.5 select-text pl-1 border-l border-slate-700">
                      {evt.details}
                    </div>
                  )}
                </div>

                {/* Quick Interactive Target Links */}
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                  {evt.agentId && (
                    <button
                      onClick={() => {
                        focusAgent(evt.agentId!);
                        selectAgent(evt.agentId!);
                      }}
                      className="px-1.5 py-0.5 text-[9px] bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                      title="Focus Agent in 3D"
                    >
                      Focus
                    </button>
                  )}
                  {evt.taskId && (
                    <button
                      onClick={() => selectTask(evt.taskId!)}
                      className="px-1.5 py-0.5 text-[9px] bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white rounded border border-slate-700 transition"
                      title="View Task Details"
                    >
                      Task
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
