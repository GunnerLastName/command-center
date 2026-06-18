export type AssistantActionType =
  | "create_task"
  | "mark_task_done"
  | "mark_task_today"
  | "check_habit"
  | "uncheck_habit"
  | "log_work"
  | "create_brain_dump"
  | "write_daily_review"
  | "update_project_status"
  | "get_summary"
  | "unknown";

export interface PendingConfirmation {
  action: AssistantActionType;
  payload: Record<string, unknown>;
  prompt: string;
}

export interface AssistantResult {
  ok: boolean;
  message: string;
  needsConfirmation?: PendingConfirmation;
}

export interface HistoryEntry {
  id: string;
  command: string;
  response: string;
  ok: boolean;
  timestamp: Date;
}
