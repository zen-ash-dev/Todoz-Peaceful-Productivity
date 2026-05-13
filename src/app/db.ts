import Dexie, { type EntityTable } from 'dexie';

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string | null;
  tagIds: string[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'backlog' | 'todo' | 'in_progress' | 'done' | 'archived';
  dueDate: number | null;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  order: number;
  estimatedMinutes: number;
  spentMinutes: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  createdAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface TimeLog {
  id: string;
  taskId: string;
  startTime: number;
  endTime: number | null;
  duration: number;
  createdAt: number;
}

export interface PomodoroSession {
  id: string;
  taskId: string | null;
  startTime: number;
  endTime: number | null;
  duration: number;
  type: 'work' | 'break' | 'longBreak';
  completed: boolean;
}

let idCounter = Date.now();
export function genId() {
  return (++idCounter).toString(36) + Math.random().toString(36).substr(2, 5);
}

export class ZenFlowDB extends Dexie {
  tasks!: EntityTable<Task, 'id'>;
  projects!: EntityTable<Project, 'id'>;
  tags!: EntityTable<Tag, 'id'>;
  timeLogs!: EntityTable<TimeLog, 'id'>;
  pomodoroSessions!: EntityTable<PomodoroSession, 'id'>;

  constructor() {
    super('todoz');
    this.version(1).stores({
      tasks: 'id, projectId, status, priority, dueDate, createdAt',
      projects: 'id, order',
      tags: 'id',
      timeLogs: 'id, taskId, startTime',
      pomodoroSessions: 'id, startTime, completed',
    });
  }
}

export const db = new ZenFlowDB();
