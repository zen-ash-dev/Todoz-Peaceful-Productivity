import { Component, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TaskService } from '../../services';
import type { Task } from '../../db';

@Component({
  standalone: true,
  template: `
    <div class="board">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:16px;">Board</h1>
      <div class="columns an-stagger">
        @for (col of columns; track col.status) {
          <div class="column an-stagger-item">
            <div class="glass-card" style="flex:1;display:flex;flex-direction:column;min-height:0;">
              <div class="col-header">
                <div class="col-dot" [style.background]="col.color"></div>
                <span class="col-title">{{ col.label }}</span>
                <span class="col-count">{{ colTasks(col.status).length }}</span>
              </div>
              <div class="col-body" 
                (dragover)="$event.preventDefault()"
                (drop)="onDrop($event, col.status)">
                @for (t of colTasks(col.status); track t.id) {
                  <div class="card glass" draggable="true"
                    (dragstart)="onDragStart($event, t.id)"
                    (click)="editTask(t.id)"
                    [style.borderLeft]="'3px solid ' + col.color">
                    <div class="card-title">{{ t.title }}</div>
                    @if (t.description) {
                      <p class="card-desc">{{ t.description }}</p>
                    }
                    <div class="card-meta">
                      @if (t.priority === 'high' || t.priority === 'urgent') {
                        <span class="badge urgent">!</span>
                      }
                      @if (t.estimatedMinutes) {
                        <span>{{ t.estimatedMinutes }}m</span>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-col">Drop tasks here</div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .board { height: 100%; display: flex; flex-direction: column; overflow: hidden; min-height: 0; max-width: 100%; }

    .columns {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      flex: 1;
      min-height: 0;
    }

    @media (max-width: 768px) {
      .columns {
        display: flex;
        gap: 12px;
        overflow-x: auto;
        overflow-y: hidden;
        -webkit-overflow-scrolling: touch;
        scroll-snap-type: x mandatory;
        padding: 4px 4px 8px;
        flex: 1;
        min-height: 0;
        max-width: 100%;
      }
      .columns::-webkit-scrollbar { display: none; }
      .column {
        min-width: 75vw;
        max-width: 75vw;
        scroll-snap-align: start;
        flex-shrink: 0;
      }
    }

    .column { display: flex; flex-direction: column; min-height: 0; }

    .col-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--border-glass); }
    .col-dot { width: 10px; height: 10px; border-radius: 50%; }
    .col-title { font-size: 14px; font-weight: 600; }
    .col-count { font-size: 11px; color: var(--text-muted); background: var(--bg-glass); padding: 1px 8px; border-radius: 9999px; }
    .col-body { flex: 1; overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 6px; }

    .card { padding: 12px 14px; border-radius: var(--radius-sm); cursor: grab; transition: all var(--transition-fast); user-select: none; touch-action: manipulation; }
    .card:hover { border-color: var(--border-glass-hover); }
    .card:active { cursor: grabbing; }
    .card-title { font-size: 13px; font-weight: 500; }
    .card-desc { font-size: 11px; color: var(--text-dim); margin-top: 4px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .card-meta { display: flex; align-items: center; gap: 6px; margin-top: 6px; font-size: 10px; color: var(--text-dim); }
    .urgent { background: var(--danger); color: white; padding: 0 6px; font-weight: 700; border-radius: 4px; font-size: 10px; }
    .empty-col { text-align: center; padding: 20px; color: var(--text-dim); font-size: 12px; }
  `]
})
export class KanbanComponent {
  readonly taskService = inject(TaskService);
  readonly router = inject(Router);

  columns = [
    { status: 'backlog', label: 'Backlog', color: 'var(--text-dim)' },
    { status: 'todo', label: 'To Do', color: 'var(--info)' },
    { status: 'in_progress', label: 'In Progress', color: 'var(--warning)' },
    { status: 'done', label: 'Done', color: 'var(--success)' },
  ];

  colTasks(status: string) {
    return this.taskService.tasks().filter(t => t.status === status).sort((a, b) => a.order - b.order);
  }

  onDragStart(e: DragEvent, taskId: string) {
    e.dataTransfer?.setData('taskId', taskId);
  }

  onDrop(e: DragEvent, status: string) {
    e.preventDefault();
    const taskId = e.dataTransfer?.getData('taskId');
    if (taskId) this.taskService.update(taskId, { status: status as any });
  }

  editTask(id: string) {
    this.router.navigate(['/tasks']);
  }
}
