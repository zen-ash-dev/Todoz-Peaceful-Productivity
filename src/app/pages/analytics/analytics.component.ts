import { Component, inject, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TaskService, PomodoroService } from '../../services';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:20px;">Analytics</h1>

      <div class="stats-grid an-stagger">
        <a class="glass-card stat an-stagger-item" routerLink="/tasks">
          <span style="font-size:12px;color:var(--text-muted)">Completion Rate</span>
          <span style="font-size:24px;font-weight:700;">{{ completionRate() }}%</span>
        </a>
        <a class="glass-card stat an-stagger-item" routerLink="/tasks">
          <span style="font-size:12px;color:var(--text-muted)">Completed</span>
          <span style="font-size:24px;font-weight:700;">{{ completedCount() }}</span>
        </a>
        <a class="glass-card stat an-stagger-item" routerLink="/tasks">
          <span style="font-size:12px;color:var(--text-muted)">Pending</span>
          <span style="font-size:24px;font-weight:700;">{{ pendingCount() }}</span>
        </a>
        <a class="glass-card stat an-stagger-item" routerLink="/pomodoro">
          <span style="font-size:12px;color:var(--text-muted)">Focus (7d)</span>
          <span style="font-size:24px;font-weight:700;">{{ focusHours() }}h</span>
        </a>
      </div>

      <div class="glass-card" style="padding:20px;margin-bottom:16px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">This Week</h2>
        <div class="chart">
          @for (d of weeklyData(); track d.label) {
            <div class="chart-bar-group" (click)="goTasks()">
              <div class="chart-bars">
                <div class="bar created" [style.height.%]="(d.created / maxVal()) * 100">
                  <span class="bar-value">{{ d.created || '' }}</span>
                </div>
                <div class="bar completed" [style.height.%]="(d.completed / maxVal()) * 100">
                  <span class="bar-value">{{ d.completed || '' }}</span>
                </div>
              </div>
              <span class="chart-label">{{ d.label }}</span>
            </div>
          }
        </div>
        <div class="chart-legend">
          <span><span class="dot" style="background:var(--primary);opacity:0.7"></span> Created</span>
          <span><span class="dot" style="background:var(--success)"></span> Completed</span>
        </div>
      </div>

      <div class="glass-card" style="padding:20px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:12px;">Pending by Priority</h2>
        @for (item of priorities(); track item.label) {
          <div style="margin-bottom:8px;cursor:pointer;" (click)="goTasks()">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
              <span>{{ item.label }}</span>
              <span>{{ item.count }}</span>
            </div>
            <div class="bar-track">
              <div class="bar-fill" [style.width.%]="item.pct" [style.background]="item.color"></div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .stat { padding: 16px; display: flex; flex-direction: column; gap: 6px; text-decoration: none; color: inherit; cursor: pointer; }
    .chart-bar-group { cursor: pointer; }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    }

    .chart { display: flex; align-items: flex-end; gap: 6px; height: 120px; }
    .chart-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
    .chart-bars { display: flex; gap: 2px; width: 100%; align-items: flex-end; height: 100%; }
    .bar { flex: 1; border-radius: 3px 3px 0 0; transition: height 0.5s ease; min-height: 0; position: relative; display: flex; align-items: flex-start; justify-content: center; }
    .bar-value { position: absolute; top: -16px; font-size: 10px; color: var(--text-muted); line-height: 1; pointer-events: none; }
    .bar.created { background: var(--primary); opacity: 0.7; }
    .bar.completed { background: var(--success); }
    .chart-label { font-size: 10px; color: var(--text-dim); margin-top: 4px; }
    .chart-legend { display: flex; gap: 16px; justify-content: center; margin-top: 10px; font-size: 12px; color: var(--text-muted); }
    .dot { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin-right: 4px; vertical-align: middle; }
    .bar-track { height: 6px; background: var(--bg-glass); border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
  `]
})
export class AnalyticsComponent {
  readonly router = inject(Router);
  readonly taskService = inject(TaskService);
  readonly pomodoroService = inject(PomodoroService);

  readonly totalTasks = computed(() => this.taskService.tasks().length);
  readonly completedCount = computed(() => this.taskService.tasks().filter(t => t.status === 'done').length);
  readonly pendingCount = computed(() => this.totalTasks() - this.completedCount());
  readonly completionRate = computed(() => this.totalTasks() > 0 ? Math.round(this.completedCount() / this.totalTasks() * 100) : 0);

  readonly focusHours = computed(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return Math.round(this.pomodoroService.sessions()
      .filter(s => s.type === 'work' && s.completed && s.startTime >= weekAgo)
      .reduce((sum, s) => sum + s.duration, 0) / 60 * 10) / 10;
  });

  weeklyData = computed(() => {
    const days: { label: string; completed: number; created: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toDateString();
      days.push({
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: this.taskService.tasks().filter(t => t.completedAt && new Date(t.completedAt).toDateString() === ds).length,
        created: this.taskService.tasks().filter(t => new Date(t.createdAt).toDateString() === ds).length,
      });
    }
    return days;
  });

  readonly maxVal = computed(() => Math.max(...this.weeklyData().map(d => Math.max(d.completed, d.created)), 0) || 1);

  readonly priorities = computed(() => {
    const pending = this.taskService.tasks().filter(t => t.status !== 'done');
    const total = pending.length || 1;
    const items = [
      { label: 'Urgent', key: 'urgent' as const, color: 'var(--danger)' },
      { label: 'High', key: 'high' as const, color: 'var(--warning)' },
      { label: 'Medium', key: 'medium' as const, color: 'var(--info)' },
      { label: 'Low', key: 'low' as const, color: 'var(--text-dim)' },
    ];
    return items.map(item => {
      const count = pending.filter(t => t.priority === item.key).length;
      return { ...item, count, pct: (count / total) * 100 };
    });
  });

  goTasks() { this.router.navigate(['/tasks']); }
}
