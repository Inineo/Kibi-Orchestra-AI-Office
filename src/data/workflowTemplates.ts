import { TaskPriority } from '../types/office';

export interface WorkflowTemplate {
  id: string;
  name: string;
  badge: string;
  category: 'feature' | 'security' | 'fix' | 'refactor' | 'custom';
  description: string;
  targetMode: 'pm_decompose' | 'single';
  
  // PM Decompose fields
  missionGoal?: string;
  missionRequirements?: string;

  // Single task fields
  taskTitle?: string;
  taskDescription?: string;
  taskPriority?: TaskPriority;
  taskTags?: string[];
  recommendedModel?: string;
}

export const DEFAULT_WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'fullstack-feature',
    name: 'Fullstack Feature',
    badge: '[E2E] End-to-End',
    category: 'feature',
    description: 'Decompose user story into frontend UI, backend API, DB migration, & QA test.',
    targetMode: 'pm_decompose',
    missionGoal: 'Build end-to-end fullstack feature with API endpoint, reactive UI, and persistent storage.',
    missionRequirements: `1. Backend: Implement REST endpoint with validation, error handling, & DB schema updates.
2. Frontend: Build responsive UI component, connect to backend state, & handle loading/error states.
3. QA: Perform validation tests, security check, and ensure 0 regression.`,
    recommendedModel: 'Daily',
  },
  {
    id: 'security-audit',
    name: 'Security & Bug Audit',
    badge: '[SEC] Strix Scan',
    category: 'security',
    description: 'Autonomous security scan, CWE vulnerability checks, and secret leakage prevention.',
    targetMode: 'pm_decompose',
    missionGoal: 'Audit application endpoints and codebase for CWE vulnerabilities, unsafe input handling, and exposed secrets.',
    missionRequirements: `1. Run Strix Security Scanner on changed backend services.
2. Verify intern safety gate suppresses sensitive credentials (.env, tokens, private keys).
3. Generate remediation patches and regression test cases.`,
    recommendedModel: 'Expert',
  },
  {
    id: 'bugfix-regression',
    name: 'Bugfix & Test',
    badge: '[FIX] Quick Fix',
    category: 'fix',
    description: 'Reproduce edge cases, create focused minimal patch, and run verification check.',
    targetMode: 'single',
    taskTitle: 'fix(core): Resolve reproduction failure and add regression guard',
    taskDescription: `Reproduce the reported issue:
1. Identify the root cause in the affected store or service module.
2. Apply minimal drop-in replacement fix avoiding unneeded abstractions.
3. Run verification check or build to ensure zero regression.`,
    taskPriority: 'high',
    taskTags: ['Bugfix', 'QA', 'Core'],
    recommendedModel: 'Daily',
  },
  {
    id: 'api-refactoring',
    name: 'API Refactoring',
    badge: '[REFACTOR] Clean Code',
    category: 'refactor',
    description: 'Simplify payload schemas, modernize endpoints, and optimize token footprint.',
    targetMode: 'pm_decompose',
    missionGoal: 'Refactor legacy backend API handlers to simplify payload structures and reduce token consumption.',
    missionRequirements: `1. Streamline endpoint request/response contracts to eliminate redundant payload bloat.
2. Apply Caveman token compression heuristics where applicable.
3. Update TypeScript interfaces to match revised contracts.`,
    recommendedModel: 'Heavy',
  },
];
