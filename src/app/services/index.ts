import { Injectable, signal } from '@angular/core';
import { db, type Task, type Project, type Tag, type TimeLog, type PomodoroSession, genId } from '../db';

@Injectable({ providedIn: 'root' })
export class TaskService {
  readonly tasks = signal<Task[]>([]);
  readonly loading = signal(true);

  constructor() { this.load(); }

  async load() {
    this.loading.set(true);
    const all = await db.tasks.orderBy('createdAt').reverse().toArray();
    this.tasks.set(all);
    this.loading.set(false);
  }

  async add(partial: Partial<Task> & { title: string }) {
    const now = Date.now();
    const task: Task = {
      id: genId(), title: partial.title, description: partial.description ?? '',
      projectId: partial.projectId ?? null, tagIds: partial.tagIds ?? [],
      priority: partial.priority ?? 'medium', status: partial.status ?? 'todo',
      dueDate: partial.dueDate ?? null, createdAt: now, updatedAt: now,
      completedAt: null, order: partial.order ?? 0,
      estimatedMinutes: partial.estimatedMinutes ?? 0, spentMinutes: 0,
    };
    await db.tasks.add(task);
    this.tasks.update(prev => [task, ...prev]);
    return task;
  }

  async update(id: string, changes: Partial<Task>) {
    const updates = { ...changes, updatedAt: Date.now() };
    await db.tasks.update(id, updates);
    this.tasks.update(prev => prev.map(t => t.id === id ? { ...t, ...updates } as Task : t));
  }

  async delete(id: string) {
    await db.tasks.delete(id);
    await db.timeLogs.where('taskId').equals(id).delete();
    this.tasks.update(prev => prev.filter(t => t.id !== id));
  }

  async toggleDone(id: string) {
    const task = this.tasks().find(t => t.id === id);
    if (!task) return;
    if (task.status === 'done') {
      await this.update(id, { status: 'todo', completedAt: null });
    } else {
      await this.update(id, { status: 'done', completedAt: Date.now() });
    }
  }
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  readonly projects = signal<Project[]>([]);
  constructor() { db.projects.orderBy('order').toArray().then(p => this.projects.set(p)); }

  async add(name: string, color: string, icon = 'folder') {
    const p: Project = { id: genId(), name, color, icon, order: this.projects().length, createdAt: Date.now() };
    await db.projects.add(p);
    this.projects.update(prev => [...prev, p]);
    return p;
  }

  async delete(id: string) {
    await db.projects.delete(id);
    this.projects.update(prev => prev.filter(p => p.id !== id));
  }
}

@Injectable({ providedIn: 'root' })
export class TagService {
  readonly tags = signal<Tag[]>([]);
  constructor() { db.tags.toArray().then(t => this.tags.set(t)); }

  async add(name: string, color: string) {
    const t: Tag = { id: genId(), name, color, createdAt: Date.now() };
    await db.tags.add(t);
    this.tags.update(prev => [...prev, t]);
    return t;
  }

  async delete(id: string) {
    await db.tags.delete(id);
    this.tags.update(prev => prev.filter(t => t.id !== id));
  }
}

@Injectable({ providedIn: 'root' })
export class TimeLogService {
  readonly timeLogs = signal<TimeLog[]>([]);
  constructor() { this.load(); }

  async load() {
    const all = await db.timeLogs.orderBy('startTime').reverse().toArray();
    this.timeLogs.set(all);
  }

  async start(taskId: string) {
    const log: TimeLog = { id: genId(), taskId, startTime: Date.now(), endTime: null, duration: 0, createdAt: Date.now() };
    await db.timeLogs.add(log);
    this.timeLogs.update(prev => [log, ...prev]);
    return log;
  }

  async stop(id: string) {
    const log = this.timeLogs().find(l => l.id === id);
    if (!log) return;
    const duration = Math.round((Date.now() - log.startTime) / 60000);
    await db.timeLogs.update(id, { endTime: Date.now(), duration });
    this.timeLogs.update(prev => prev.map(l => l.id === id ? { ...l, endTime: Date.now(), duration } : l));
  }

  async delete(id: string) {
    await db.timeLogs.delete(id);
    this.timeLogs.update(prev => prev.filter(l => l.id !== id));
  }
}

@Injectable({ providedIn: 'root' })
export class PomodoroService {
  readonly sessions = signal<PomodoroSession[]>([]);
  constructor() { db.pomodoroSessions.orderBy('startTime').reverse().toArray().then(s => this.sessions.set(s)); }

  async add(data: Omit<PomodoroSession, 'id'>) {
    const s: PomodoroSession = { id: genId(), ...data };
    await db.pomodoroSessions.add(s);
    this.sessions.update(prev => [s, ...prev]);
    return s;
  }

  async complete(id: string) {
    await db.pomodoroSessions.update(id, { completed: true, endTime: Date.now() });
    this.sessions.update(prev => prev.map(s => s.id === id ? { ...s, completed: true, endTime: Date.now() } : s));
  }

  get todaySessions() {
    return this.sessions().filter(s => {
      const d = new Date(s.startTime);
      return d.toDateString() === new Date().toDateString();
    });
  }
}
