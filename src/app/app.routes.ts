import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'tasks', loadComponent: () => import('./pages/tasks/tasks.component').then(m => m.TasksComponent) },
  { path: 'kanban', loadComponent: () => import('./pages/kanban/kanban.component').then(m => m.KanbanComponent) },
  { path: 'pomodoro', loadComponent: () => import('./pages/pomodoro/pomodoro.component').then(m => m.PomodoroComponent) },
  { path: 'tracking', loadComponent: () => import('./pages/tracking/tracking.component').then(m => m.TrackingComponent) },
  { path: 'analytics', loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent) },
  { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
];
