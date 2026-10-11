export type AgentRole =
  | 'strategist'
  | 'architect'
  | 'planner'
  | 'developer'
  | 'reviewer'
  | 'tester'
  | 'devops'
  | 'security';

export type AgentStatus =
  | 'idle'
  | 'planning'
  | 'coding'
  | 'reviewing'
  | 'testing'
  | 'blocked';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export type AgentDepartment = 'orchestra' | 'developer' | 'writer';
export type IdleActivity = 'coffee' | 'phone' | 'stretch' | 'nap' | 'standby';
export type AgentLocation = 'at_desk' | 'lounge' | 'coffee_bar' | 'whiteboard' | 'walking' | 'chatting';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  department: AgentDepartment;
  title: string;
  status: AgentStatus;
  idleActivity?: IdleActivity;
  locationState?: AgentLocation;
  currentTask: string | null;
  currentTaskId: string | null;
  model: string; // e.g. "Claude-3.5-Sonnet", "DeepSeek-Coder-V2", "GPT-4o"
  progress: number; // 0-100
  elapsedTime: number; // in seconds
  deskPosition: Position3D;
  deskRotationY: number;
  color: string;
  accentColor: string;
  avatarIcon: string;
  currentThought: string;
  currentAction: string;
  recentOutputs: string[];
  metrics: {
    tasksCompleted: number;
    tokensGenerated: number;
    speedTokensSec: number;
    toolCallsCount: number;
    accuracyScore: number;
  };
}

export type TaskStatus = 'pending' | 'running' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  key: string; // e.g., "TASK-101"
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToAgentId: string | null;
  model: string | null;
  progress: number; // 0-100
  startTime: number | null; // timestamp ms
  elapsedTime: number; // seconds
  estimatedTime: number; // seconds
  tags: string[];
  artifacts: {
    name: string;
    type: 'code' | 'diagram' | 'doc' | 'test';
    path: string;
  }[];
  subtasks: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}

export type EventType =
  | 'start'
  | 'progress'
  | 'complete'
  | 'escalation'
  | 'error'
  | 'message'
  | 'artifact';

export interface OfficeEvent {
  id: string;
  timestamp: string; // "10:05:43"
  timeMs: number;
  type: EventType;
  message: string;
  agentId?: string;
  taskId?: string;
  taskKey?: string;
  details?: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed';
  progress: number;
  startTime: number;
  estimatedTotalSeconds: number;
  tasksCompleted: number;
  tasksTotal: number;
  targetBranch: string;
}

export interface WorkforceStats {
  activeAgents: number;
  totalAgents: number;
  tasksDone: number;
  tasksTotal: number;
  successRate: number;
  avgTimeSeconds: number;
  totalCostUsd: number;
  tokensProcessed: number;
}
