// Maps Prisma rows to plain serializable shapes for client components.
import { dateKey } from "./dates";
import type { TaskWithRefs, SessionWithRefs } from "./types";

export interface TaskItemData {
  id: string;
  title: string;
  notes: string;
  status: string;
  priority: string;
  today: boolean;
  dueDate: string | null; // "yyyy-MM-dd"
  estimatedMinutes: number | null;
  projectId: string | null;
  projectAreaId: string | null;
  projectName: string | null;
  sortOrder: number;
  todaySortOrder: number;
}

export function toTaskItem(task: TaskWithRefs): TaskItemData {
  return {
    id: task.id,
    title: task.title,
    notes: task.notes,
    status: task.status,
    priority: task.priority,
    today: task.today,
    dueDate: task.dueDate ? dateKey(task.dueDate) : null,
    estimatedMinutes: task.estimatedMinutes,
    projectId: task.projectId,
    projectAreaId: task.projectAreaId,
    projectName: task.project?.name ?? null,
    sortOrder: task.sortOrder,
    todaySortOrder: task.todaySortOrder,
  };
}

export interface SessionItemData {
  id: string;
  description: string;
  startTime: string; // ISO
  endTime: string | null;
  durationMinutes: number;
  projectId: string | null;
  projectName: string | null;
  taskId: string | null;
  taskTitle: string | null;
}

export function toSessionItem(session: SessionWithRefs): SessionItemData {
  return {
    id: session.id,
    description: session.description,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime ? session.endTime.toISOString() : null,
    durationMinutes: session.durationMinutes,
    projectId: session.projectId,
    projectName: session.project?.name ?? null,
    taskId: session.taskId,
    taskTitle: session.task?.title ?? null,
  };
}
