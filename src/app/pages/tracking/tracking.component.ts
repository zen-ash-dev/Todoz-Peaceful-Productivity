import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TimeLogService } from '../../services';
import { TaskService } from '../../services';

@Component({
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="page">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:4px;">Time Tracking</h1>
      <p style="color:var(--text-muted);font-size:14px;margin-bottom:20px;">
        @if (todayTotal() > 0) { {{ todayTotalLabel() }} tracked today }
        @else { No time tracked today }
      </p>

      @if (runningLog) {
        <div class="glass-card active-timer an-pulse-glow">
          <p style="font-size:14px;color:var(--text-muted);margin-bottom:4px;">
            Tracking: {{ getTaskName(runningLog.taskId) }}
          </p>
          <div class="elapsed">{{ formatElapsed(elapsed()) }}</div>
          <button class="btn btn-accent" (click)="stopTimer()">
            <span class="material-icons">stop</span> Stop
          </button>
        </div>
      }

      <div class="glass-card" style="padding:16px;margin-bottom:16px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:12px;">Active Tasks</h2>
        @for (t of activeTasks(); track t.id) {
          <div class="log-item glass">
            <span style="flex:1;font-size:14px;">{{ t.title }}</span>
            @if (t.spentMinutes > 0) { <span style="font-size:12px;color:var(--text-dim)">{{ t.spentMinutes }}m</span> }
            <button class="btn btn-ghost" style="padding:4px 12px;font-size:12px;" (click)="startTimer(t.id)">
              <span class="material-icons" style="font-size:14px;">play_arrow</span> Track
            </button>
          </div>
        } @empty {
          <p style="color:var(--text-dim);font-size:13px;text-align:center;padding:12px;">No active tasks</p>
        }
      </div>

      <div class="glass-card" style="padding:16px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:12px;">Today's Log</h2>
        <div class="an-stagger">
        @for (l of todayLogs(); track l.id) {
          <div class="log-item glass an-stagger-item" (click)="deleteLog(l.id)">
            <span class="material-icons" style="color:var(--primary);font-size:16px;">schedule</span>
            <span style="flex:1;font-size:13px;">{{ getTaskName(l.taskId) }}</span>
            <span style="font-size:12px;color:var(--text-muted);">{{ l.startTime | date:'HH:mm' }}</span>
            <span style="font-size:12px;font-weight:600;">{{ formatDuration(l.duration) }}</span>
          </div>
        } @empty {
          <p style="color:var(--text-dim);font-size:13px;text-align:center;padding:12px;">No time entries today</p>
        }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .active-timer { padding:24px;margin-bottom:16px;text-align:center;border-color:var(--success); }
    .elapsed { font-size:40px;font-weight:700;font-variant-numeric:tabular-nums;font-family:var(--font-mono);margin-bottom:12px;letter-spacing:-0.02em; }

    @media (max-width: 480px) {
      .elapsed { font-size:30px; }
      .active-timer { padding:16px; }
    }

    .log-item { display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--radius-sm);margin-bottom:6px;cursor:pointer;transition:background var(--transition-fast); }
    .log-item:hover { background:var(--bg-glass); }
  `]
})
export class TrackingComponent implements OnInit, OnDestroy {
  readonly timeLogService = inject(TimeLogService);
  readonly taskService = inject(TaskService);

  runningId: string | null = null;
  readonly elapsed = signal(0);
  private interval: any = null;

  get runningLog() { return this.timeLogService.timeLogs().find(l => l.id === this.runningId); }

  readonly todayLogs = computed(() =>
    this.timeLogService.timeLogs().filter(l => new Date(l.startTime).toDateString() === new Date().toDateString())
  );

  readonly todayTotal = computed(() => this.todayLogs().reduce((sum, l) => sum + l.duration, 0));
  readonly todayTotalLabel = computed(() => {
    const m = this.todayTotal();
    if (m < 60) return m + 'm';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  });

  readonly activeTasks = computed(() =>
    this.taskService.tasks().filter(t => t.status === 'in_progress' || t.status === 'todo')
  );

  ngOnInit() {
    this.interval = setInterval(() => {
      if (this.runningId) {
        const log = this.timeLogService.timeLogs().find(l => l.id === this.runningId);
        if (log) this.elapsed.set(Math.floor((Date.now() - log.startTime) / 1000));
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.interval) clearInterval(this.interval);
  }

  getTaskName(id: string) { return this.taskService.tasks().find(t => t.id === id)?.title ?? 'Unknown'; }

  formatElapsed(s: number) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  formatDuration(m: number) {
    if (m < 60) return m + 'm';
    return Math.floor(m / 60) + 'h ' + (m % 60) + 'm';
  }

  async startTimer(taskId: string) {
    if (this.runningId) await this.timeLogService.stop(this.runningId);
    const log = await this.timeLogService.start(taskId);
    this.runningId = log.id;
    this.elapsed.set(0);
  }

  async stopTimer() {
    if (!this.runningId) return;
    await this.timeLogService.stop(this.runningId);
    this.runningId = null;
    this.elapsed.set(0);
  }

  async deleteLog(id: string) {
    if (id === this.runningId) return;
    if (confirm('Delete this time entry?')) {
      await this.timeLogService.delete(id);
    }
  }
}
