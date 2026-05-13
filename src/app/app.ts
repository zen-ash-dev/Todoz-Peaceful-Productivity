import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { db, genId } from './db';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  readonly sidebarOpen = signal(false);
  readonly theme = signal(localStorage.getItem('todoz-theme') || 'dark');

  constructor() {
    document.documentElement.setAttribute('data-theme', this.theme());
    this.seedDemoData();
  }

  private async seedDemoData() {
    const count = await db.tasks.count();
    if (count > 0) return;

    const project1 = { id: genId(), name: 'Work', color: '#3B82F6', icon: 'work', order: 0, createdAt: Date.now() };
    const project2 = { id: genId(), name: 'Personal', color: '#22C55E', icon: 'person', order: 1, createdAt: Date.now() };
    const project3 = { id: genId(), name: 'Learning', color: '#8B5CF6', icon: 'school', order: 2, createdAt: Date.now() };
    await db.projects.bulkAdd([project1, project2, project3]);

    const tag1 = { id: genId(), name: 'urgent', color: '#EF4444', createdAt: Date.now() };
    const tag2 = { id: genId(), name: 'design', color: '#EC4899', createdAt: Date.now() };
    const tag3 = { id: genId(), name: 'dev', color: '#3B82F6', createdAt: Date.now() };
    const tag4 = { id: genId(), name: 'ideas', color: '#F59E0B', createdAt: Date.now() };
    await db.tags.bulkAdd([tag1, tag2, tag3, tag4]);

    const now = Date.now(); const day = 86400000;
    const tasks: any[] = [
      { id: genId(), title: 'Review project proposal', description: 'Go through the Q3 proposal document', projectId: project1.id, tagIds: [tag3.id], priority: 'high', status: 'in_progress', dueDate: now + day, createdAt: now - 2*day, updatedAt: now, completedAt: null, order: 0, estimatedMinutes: 45, spentMinutes: 20 },
      { id: genId(), title: 'Team standup notes', description: 'Prepare notes for morning standup', projectId: project1.id, tagIds: [], priority: 'medium', status: 'todo', dueDate: now + day, createdAt: now - day, updatedAt: now, completedAt: null, order: 1, estimatedMinutes: 15, spentMinutes: 0 },
      { id: genId(), title: 'Fix login page bug', description: 'Users report 500 error on login', projectId: project1.id, tagIds: [tag1.id, tag3.id], priority: 'urgent', status: 'todo', dueDate: now, createdAt: now - 3*day, updatedAt: now, completedAt: null, order: 2, estimatedMinutes: 60, spentMinutes: 0 },
      { id: genId(), title: 'Grocery shopping', description: 'Milk, eggs, bread, vegetables', projectId: project2.id, tagIds: [], priority: 'low', status: 'backlog', dueDate: now + 2*day, createdAt: now - day, updatedAt: now, completedAt: null, order: 3, estimatedMinutes: 30, spentMinutes: 0 },
      { id: genId(), title: 'Morning run', description: '5km before breakfast', projectId: project2.id, tagIds: [], priority: 'medium', status: 'done', dueDate: now, createdAt: now - 5*day, updatedAt: now, completedAt: now, order: 4, estimatedMinutes: 30, spentMinutes: 30 },
      { id: genId(), title: 'Read "Atomic Habits"', description: 'Chapters 5-8 this week', projectId: project3.id, tagIds: [tag4.id], priority: 'low', status: 'in_progress', dueDate: now + 5*day, createdAt: now - 4*day, updatedAt: now, completedAt: null, order: 5, estimatedMinutes: 120, spentMinutes: 45 },
      { id: genId(), title: 'Design new dashboard', description: 'Wireframe the analytics dashboard', projectId: project1.id, tagIds: [tag2.id, tag4.id], priority: 'high', status: 'backlog', dueDate: now + 7*day, createdAt: now - 2*day, updatedAt: now, completedAt: null, order: 6, estimatedMinutes: 180, spentMinutes: 0 },
      { id: genId(), title: 'Pay electricity bill', description: 'Due before 15th', projectId: project2.id, tagIds: [tag1.id], priority: 'high', status: 'todo', dueDate: now + 2*day, createdAt: now - 6*day, updatedAt: now, completedAt: null, order: 7, estimatedMinutes: 10, spentMinutes: 0 },
    ];
    await db.tasks.bulkAdd(tasks);
  }

  toggleTheme() {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('todoz-theme', next);
  }

  navItems = [
    { path: '', icon: 'dashboard', label: 'Dashboard' },
    { path: '/tasks', icon: 'checklist', label: 'Tasks' },
    { path: '/kanban', icon: 'view_column', label: 'Board' },
    { path: '/pomodoro', icon: 'timer', label: 'Focus' },
    { path: '/tracking', icon: 'schedule', label: 'Time' },
    { path: '/analytics', icon: 'bar_chart', label: 'Analytics' },
    { path: '/settings', icon: 'settings', label: 'Settings' },
  ];
}
