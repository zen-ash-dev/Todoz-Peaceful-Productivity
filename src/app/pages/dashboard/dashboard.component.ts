import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TaskService, PomodoroService } from '../../services';
import { DatePipe } from '@angular/common';

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Dashboard</h1>
        <p class="date">{{ today | date:'EEEE, MMMM d' }}</p>
      </div>

      @if (taskService.loading()) {
        <div class="stats-grid">
          @for (_ of [1,2,3,4]; track _) {
            <div class="glass-card stat-card"><div class="an-skeleton" style="height:60px;width:100%"></div></div>
          }
        </div>
      }

      <div class="stats-grid an-stagger">
        <a class="glass-card stat-card an-stagger-item" routerLink="/tasks">
          <div class="stat-icon material-icons" style="color:var(--warning);font-size:28px">pending_actions</div>
          <div class="stat-body">
            <span class="stat-value">{{ pendingToday().length }}</span>
            <span class="stat-label">Pending Today</span>
          </div>
        </a>
        <a class="glass-card stat-card an-stagger-item" routerLink="/tasks">
          <div class="stat-icon material-icons" style="color:var(--success);font-size:28px">check_circle</div>
          <div class="stat-body">
            <span class="stat-value">{{ completedToday().length }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </a>
        <a class="glass-card stat-card an-stagger-item" routerLink="/pomodoro">
          <div class="stat-icon material-icons" style="color:var(--primary);font-size:28px">timer</div>
          <div class="stat-body">
            <span class="stat-value">{{ focusMinutes() }}m</span>
            <span class="stat-label">Focus Time</span>
          </div>
        </a>
        <a class="glass-card stat-card an-stagger-item" routerLink="/analytics">
          <div class="stat-icon material-icons" style="color:var(--accent);font-size:28px">local_fire_department</div>
          <div class="stat-body">
            <span class="stat-value">{{ streak() }}<span style="font-size:12px;color:var(--text-muted)">d</span></span>
            <span class="stat-label">Streak</span>
          </div>
        </a>
      </div>

      <div class="glass-card quick-add">
        <div class="quick-add-row">
          <input class="input" #newTask placeholder="Add a task for today..." (keydown.enter)="addTask(newTask.value); newTask.value=''" />
          <button class="btn btn-primary" (click)="addTask(newTask.value); newTask.value=''">add</button>
        </div>
      </div>

      <div class="quick-actions an-stagger">
        <a class="glass-card action-btn an-stagger-item" routerLink="/pomodoro">
          <span class="material-icons" style="font-size:28px;color:var(--primary)">timer</span>
          <span>Focus</span>
        </a>
        <a class="glass-card action-btn an-stagger-item" routerLink="/tasks">
          <span class="material-icons" style="font-size:28px;color:var(--success)">checklist</span>
          <span>Tasks</span>
        </a>
        <a class="glass-card action-btn an-stagger-item" routerLink="/kanban">
          <span class="material-icons" style="font-size:28px;color:var(--warning)">view_column</span>
          <span>Board</span>
        </a>
        <a class="glass-card action-btn an-stagger-item" routerLink="/tracking">
          <span class="material-icons" style="font-size:28px;color:var(--accent)">schedule</span>
          <span>Time</span>
        </a>
      </div>

      <div class="glass-card">
        <h2>Today's Tasks @if (pendingToday().length > 0) { <span class="count">({{ pendingToday().length }})</span> }</h2>
        @if (pendingToday().length === 0) {
          <div class="empty-state">
            <span class="material-icons" style="font-size:48px;color:var(--success)">celebration</span>
            <p>All done for today!</p>
          </div>
        } @else {
          <div class="task-mini-list an-stagger">
            @for (t of pendingToday().slice(0, 8); track t.id) {
              <div class="task-mini-item glass an-stagger-item" (click)="taskService.toggleDone(t.id)">
                <div class="checkbox" [class.checked]="t.status === 'done'">
                  @if (t.status === 'done') { <span class="material-icons" style="font-size:12px;color:white">check</span> }
                </div>
                <span class="task-mini-title">{{ t.title }}</span>
                @if (t.priority === 'high' || t.priority === 'urgent') {
                  <span class="badge priority-badge">{{ t.priority }}</span>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card { text-decoration: none; color: inherit; display: flex; cursor: pointer; }
    .page-header { margin-bottom: 20px; }
    .quick-add { padding: 16px; margin-bottom: 16px; }
    .quick-add-row { display: flex; gap: 8px; align-items: center; }
    .quick-add-row .input { flex: 1; min-height: 42px; }

    .quick-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .action-btn { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 14px 8px; text-decoration: none; color: var(--text-muted); font-size: 11px; cursor: pointer; transition: all var(--transition-fast); min-height: 72px; }
    .action-btn:hover { color: var(--text); border-color: var(--border-glass-hover); }
    .action-btn:active { transform: scale(0.96); }
    .action-btn .material-icons { font-size: 24px !important; width: 24px; height: 24px; }

    .glass-card { margin-bottom: 16px; padding: 20px; }
    .glass-card h2 { font-size: 16px; font-weight: 600; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
    .count { color: var(--text-muted); font-weight: 400; font-size: 14px; }

    @media (max-width: 480px) {
      .quick-actions { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .action-btn { min-height: 64px; padding: 10px; }
      .glass-card { padding: 14px; margin-bottom: 12px; }
    }

    .task-mini-list { display: flex; flex-direction: column; gap: 6px; }
    .task-mini-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; touch-action: manipulation; transition: background var(--transition-fast); }
    .task-mini-item:hover { background: var(--bg-glass); }
    .task-mini-item:active { transform: scale(0.98); }
    .task-mini-title { flex: 1; font-size: 14px; font-weight: 450; }
    .priority-badge { background: var(--danger); color: white; font-size: 10px; padding: 0 8px; font-weight: 600; }
  `]
})
export class DashboardComponent {
  readonly taskService = inject(TaskService);
  readonly pomodoroService = inject(PomodoroService);
  readonly today = new Date();

  readonly pendingToday = computed(() =>
    this.taskService.tasks().filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate).toDateString() === this.today.toDateString() && t.status !== 'done';
    })
  );

  readonly completedToday = computed(() =>
    this.taskService.tasks().filter(t => {
      if (!t.completedAt) return false;
      return new Date(t.completedAt).toDateString() === this.today.toDateString();
    })
  );

  readonly focusMinutes = computed(() =>
    this.pomodoroService.todaySessions
      .filter(s => s.type === 'work' && s.completed)
      .reduce((sum, s) => sum + s.duration, 0)
  );

  readonly streak = computed(() => {
    const dates = new Set(
      this.taskService.tasks()
        .filter(t => t.completedAt)
        .map(t => new Date(t.completedAt!).toDateString())
    );
    if (dates.size === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOffset = dates.has(today.toDateString()) ? 0 : 1;
    let streak = 0;
    for (let i = startOffset; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (dates.has(d.toDateString())) streak++;
      else break;
    }
    return streak;
  });

  addTask(title: string) {
    if (!title?.trim()) return;
    const due = new Date(); due.setHours(23, 59, 59, 999);
    this.taskService.add({ title: title.trim(), dueDate: due.getTime() });
  }
}
