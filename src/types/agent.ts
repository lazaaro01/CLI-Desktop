export type AgentStatus = 'idle' | 'working' | 'waiting' | 'done' | 'error';

export type IslandMode = 'hidden' | 'peek' | 'open';

export interface Session {
  id: string;
  key: string;
  projectName: string;
  cwd: string;
  status: AgentStatus;
  detail: string;
  currentTask?: string;
  started: boolean;
  startedAt?: string;
  updatedAt?: string;
}

export interface PermissionRequest {
  id: string;
  sessionId: string;
  projectName: string;
  command: string;
  riskLevel?: 'low' | 'medium' | 'high';
  status: 'pending' | 'approved' | 'denied';
  resolve?: (approved: boolean) => void;
  createdAt: string;
}

export type HookEventType =
  | 'SessionStart'
  | 'BeforeTool'
  | 'Notification'
  | 'AfterTool'
  | 'AfterAgent';

export interface AgentEvent {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: HookEventType;
  timestamp: string;
  [key: string]: unknown;
}

export interface TerminalLog {
  kind: 'sys' | 'prompt' | 'tool' | 'gem' | 'ok' | 'err' | 'warn' | 'add' | 'del';
  text: string;
}

export interface ProjectConfig {
  key: string;
  name: string;
  cwd: string;
  file: string;
  test: string;
  passed: string;
  risky: string;
  task: string;
  del: string;
  add: string;
  err: string;
}
