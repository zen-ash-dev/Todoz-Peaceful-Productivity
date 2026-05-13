import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { PomodoroService } from '../../services';

type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

@Component({
  standalone: true,
  template: `
    <div class="page">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:24px;text-align:center;">Focus</h1>

      <div class="mode-tabs glass-card" style="display:inline-flex;padding:6px;margin:0 auto 24px;gap:4px;">
        @for (m of modes; track m.key) {
          <button class="mode-btn" [class.active]="mode() === m.key" (click)="switchMode(m.key)">
            <span class="material-icons">{{ m.icon }}</span>
            {{ m.label }}
          </button>
        }
      </div>

      <div class="timer-ring glass-card an-scale-in">
        <div class="timer-ring-inner">
          <svg viewBox="0 0 200 200" class="timer-svg">
            <circle cx="100" cy="100" r="85" fill="none" stroke="var(--border-glass)" stroke-width="6"/>
            <circle cx="100" cy="100" r="85" fill="none" stroke="var(--primary)" stroke-width="6" stroke-linecap="round"
              [attr.stroke-dasharray]="circumference"
              [attr.stroke-dashoffset]="circumference * (1 - progress())"
              style="transition:stroke-dashoffset 1s linear; transform:rotate(-90deg); transform-origin:100px 100px"/>
          </svg>
          <div class="timer-text">
            <div class="time-display">{{ minutes() }}:{{ seconds() }}</div>
            <div class="mode-label">{{ modeLabel() }}</div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:32px;">
        <button class="btn btn-accent" (click)="toggleTimer()">
          <span class="material-icons">{{ running() ? 'pause' : 'play_arrow' }}</span>
          {{ running() ? 'Pause' : 'Start' }}
        </button>
        <button class="btn btn-ghost" (click)="reset()">
          <span class="material-icons">replay</span>
        </button>
      </div>

      <div class="glass-card" style="padding:16px;max-width:400px;margin:0 auto;">
        <h3 style="font-size:14px;font-weight:600;margin-bottom:8px;">Today's Focus</h3>
        <p style="color:var(--text-muted);font-size:13px;">
          {{ todayWorkSessions.length }} sessions · {{ todayWorkMinutes }} minutes focused
        </p>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 500px; margin: 0 auto; text-align: center; }

    .mode-tabs { border-radius: var(--radius-sm); display: inline-flex; padding: 6px; margin: 0 auto 24px; gap: 4px; }
    .mode-btn { display:inline-flex;align-items:center;gap:6px;padding:8px 14px;border-radius:var(--radius-xs);border:none;background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--font);font-size:13px;transition:all var(--transition-fast);touch-action:manipulation;user-select:none; }
    .mode-btn:active { transform:scale(0.95); }
    .mode-btn.active { background:var(--primary);color:white; }
    .mode-btn .material-icons { font-size:16px !important; width:16px;height:16px; }

    .timer-ring { padding: 24px; margin-bottom: 24px; display: flex; justify-content: center; }
    .timer-ring-inner { position: relative; width: 200px; height: 200px; }
    .timer-svg { width: 100%; height: 100%; display: block; }
    .timer-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
    .time-display { font-size:42px;font-weight:700;font-variant-numeric:tabular-nums;font-family:var(--font-mono);letter-spacing:-0.02em; }
    .mode-label { font-size:12px;color:var(--text-muted);margin-top:4px; }

    @media (max-width: 480px) {
      .mode-tabs { gap: 2px; padding: 4px; }
      .mode-btn { padding: 6px 10px; font-size: 12px; }
      .mode-btn .material-icons { font-size: 14px !important; }
      .timer-ring { padding: 16px; margin-bottom: 16px; }
      .timer-ring-inner { width: 160px; height: 160px; }
      .time-display { font-size: 34px; }
    }

    .controls { display:flex;gap:12px;justify-content:center;margin-bottom:32px; }
  `]
})
export class PomodoroComponent implements OnInit, OnDestroy {
  readonly pomodoroService = inject(PomodoroService);

  modes: { key: PomodoroMode; label: string; icon: string }[] = [
    { key: 'focus', label: 'Focus', icon: 'psychology' },
    { key: 'shortBreak', label: 'Short Break', icon: 'coffee' },
    { key: 'longBreak', label: 'Long Break', icon: 'free_breakfast' },
  ];

  readonly mode = signal<PomodoroMode>('focus');
  readonly timeLeft = signal(25 * 60);
  readonly running = signal(false);
  readonly sessionId = signal<string | null>(null);
  private timerInterval: any = null;

  readonly FOCUS = 25; readonly SHORT = 5; readonly LONG = 15;
  readonly circumference = 2 * Math.PI * 85;

  readonly minutes = computed(() => String(Math.floor(this.timeLeft() / 60)).padStart(2, '0'));
  readonly seconds = computed(() => String(this.timeLeft() % 60).padStart(2, '0'));

  readonly progress = computed(() => {
    const m = this.mode();
    const total = m === 'focus' ? this.FOCUS * 60 : m === 'shortBreak' ? this.SHORT * 60 : this.LONG * 60;
    return 1 - this.timeLeft() / total;
  });

  readonly modeLabel = computed(() => {
    const m = this.mode();
    return m === 'focus' ? 'Focus' : m === 'shortBreak' ? 'Short Break' : 'Long Break';
  });

  get todayWorkSessions() {
    return this.pomodoroService.todaySessions.filter(s => s.type === 'work');
  }
  get todayWorkMinutes() {
    return this.todayWorkSessions.filter(s => s.completed).reduce((sum, s) => sum + s.duration, 0);
  }

  switchMode(m: PomodoroMode) {
    this.running.set(false);
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    this.mode.set(m);
    const total = m === 'focus' ? this.FOCUS * 60 : m === 'shortBreak' ? this.SHORT * 60 : this.LONG * 60;
    this.timeLeft.set(total);
    this.sessionId.set(null);
  }

  toggleTimer() {
    if (this.running()) {
      this.running.set(false);
      if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
      return;
    }
    if (this.timeLeft() <= 0) { this.reset(); return; }
    if (!this.sessionId()) {
      const m = this.mode();
      const dur = m === 'focus' ? this.FOCUS : m === 'shortBreak' ? this.SHORT : this.LONG;
      this.pomodoroService.add({
        taskId: null, startTime: Date.now(), endTime: null,
        duration: dur,
        type: m === 'focus' ? 'work' : m === 'shortBreak' ? 'break' : 'longBreak',
        completed: false
      }).then(s => this.sessionId.set(s.id));
    }
    this.running.set(true);
  }

  reset() {
    this.running.set(false);
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    const m = this.mode();
    const total = m === 'focus' ? this.FOCUS * 60 : m === 'shortBreak' ? this.SHORT * 60 : this.LONG * 60;
    this.timeLeft.set(total);
    if (this.sessionId()) {
      this.pomodoroService.complete(this.sessionId()!);
    }
    this.sessionId.set(null);
  }

  ngOnInit() {
    this.timerInterval = setInterval(() => {
      if (this.running()) {
        this.timeLeft.update(v => {
          if (v <= 1) {
            this.running.set(false);
            if (this.sessionId()) {
              this.pomodoroService.complete(this.sessionId()!);
            }
            this.sessionId.set(null);
            return 0;
          }
          return v - 1;
        });
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}
