import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TaskService, ProjectService, TagService } from '../../services';
import type { Task } from '../../db';

@Component({
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Tasks</h1>
          <p class="subtitle">{{ taskService.tasks().length }} total</p>
        </div>
        <button class="btn btn-primary" (click)="openNew()">add New Task</button>
      </div>

      <div class="glass-card filters">
        <input class="input" placeholder="Search tasks..." [(ngModel)]="search" />
        <select class="input filter-select" [(ngModel)]="statusFilter">
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="backlog">Backlog</option>
        </select>
        <select class="input filter-select" [(ngModel)]="sortField">
          <option value="createdAt">Created</option>
          <option value="dueDate">Due Date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </select>
      </div>

      <div class="task-list an-stagger">
        @for (t of filtered(); track t.id) {
          <div class="glass-card task-card an-stagger-item" [class.done]="t.status === 'done'" (click)="editTask(t)">
            <div class="task-row">
              <div class="checkbox" [class.checked]="t.status === 'done'" (click)="$event.stopPropagation(); taskService.toggleDone(t.id)">
                @if (t.status === 'done') { <span class="material-icons" style="font-size:12px;color:white">check</span> }
              </div>
              <div class="task-content">
                <div class="task-title-row">
                  <span class="task-title" [class.line-through]="t.status === 'done'">{{ t.title }}</span>
                  @if (t.priority === 'high' || t.priority === 'urgent') {
                    <span class="badge priority-h">!</span>
                  }
                </div>
                @if (t.description) {
                  <p class="task-desc">{{ t.description }}</p>
                }
                <div class="task-meta">
                  @if (t.dueDate) {
                    <span class="meta-item" [class.overdue]="t.dueDate < now() && t.status !== 'done'">
                      <span class="material-icons">calendar_today</span>
                      {{ t.dueDate | date:'MMM d' }}
                    </span>
                  }
                  @if (t.projectId) {
                    <span class="meta-item">
                      <span class="material-icons">folder</span>
                      {{ projectService.projects().find(p => p.id === t.projectId)?.name }}
                    </span>
                  }
                  @if (t.estimatedMinutes) {
                    <span class="meta-item">
                      <span class="material-icons">schedule</span>
                      {{ t.estimatedMinutes }}m
                    </span>
                  }
                </div>
              </div>
              <button class="btn-icon" (click)="$event.stopPropagation(); confirmDelete(t)" aria-label="Delete task">
                <span class="material-icons" style="color:var(--danger)">delete</span>
              </button>
            </div>
          </div>
        } @empty {
          <div class="glass-card empty-state">
            <span class="material-icons" style="font-size:48px;color:var(--text-dim)">task_alt</span>
            <p>No tasks found</p>
          </div>
        }
      </div>
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()">
        <div class="modal glass-card an-scale-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingId() ? 'Edit Task' : 'New Task' }}</h2>
            <button class="btn-icon material-icons" (click)="closeForm()">close</button>
          </div>
          <div class="modal-body">
            <input class="input" placeholder="Task title" [(ngModel)]="formTitle" />
            <textarea class="input" placeholder="Description" [(ngModel)]="formDesc" rows="3" style="resize:vertical"></textarea>
            <div class="form-grid">
              <div>
                <label>Priority</label>
                <select class="input" [(ngModel)]="formPriority">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label>Status</label>
                <select class="input" [(ngModel)]="formStatus">
                  <option value="backlog">Backlog</option>
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div>
                <label>Due Date</label>
                <input class="input" type="date" [(ngModel)]="formDueDate" />
              </div>
              <div>
                <label>Project</label>
                <select class="input" [(ngModel)]="formProject">
                  <option value="">None</option>
                  @for (p of projectService.projects(); track p.id) {
                    <option [value]="p.id">{{ p.name }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="tag-select">
              <label>Tags</label>
              <div class="tag-list">
                @for (tag of tagService.tags(); track tag.id) {
                  <button class="tag-chip" [class.selected]="formTags().includes(tag.id)" (click)="toggleTag(tag.id)">
                    {{ tag.name }}
                  </button>
                }
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeForm()">Cancel</button>
            <button class="btn btn-primary" (click)="saveTask()">{{ editingId() ? 'Update' : 'Create' }}</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; gap: 8px; flex-wrap: wrap; }
    .page-header h1 { font-size: 20px; }
    .page-header .btn { flex-shrink: 0; }

    .filters { display: flex; gap: 8px; padding: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }
    .filters .input { width: auto; min-width: 120px; flex: 1; }

    @media (max-width: 480px) {
      .page-header .btn { width: 100%; }
      .filters { flex-direction: column; gap: 6px; padding: 10px; }
      .filters .input { width: 100%; min-width: 0; }
    }

    .task-list { display: flex; flex-direction: column; gap: 8px; }
    .task-card { padding: 14px 16px; cursor: pointer; transition: all var(--transition-fast); }
    .task-card.done { opacity: 0.5; }
    .task-card:hover { border-color: var(--border-glass-hover); }
    .task-card:active { transform: scale(0.99); }
    .task-row { display: flex; align-items: flex-start; gap: 12px; }
    .task-content { flex: 1; min-width: 0; }
    .task-title-row { display: flex; align-items: center; gap: 8px; }
    .task-title { font-size: 14px; font-weight: 500; }
    .line-through { text-decoration: line-through; color: var(--text-dim); }
    .priority-h { background: var(--danger); color: white; font-size: 10px; padding: 0 6px; font-weight: 700; border-radius: 4px; }
    .task-desc { font-size: 12px; color: var(--text-dim); margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .task-meta { display: flex; align-items: center; gap: 12px; margin-top: 6px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-dim); }
    .meta-item .material-icons { font-size: 13px !important; width: 13px; height: 13px; }
    .overdue { color: var(--danger); }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    @media (max-width: 480px) {
      .form-grid { grid-template-columns: 1fr; gap: 10px; }
    }

    .tag-select { margin-top: 4px; }
    .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag-chip { padding: 6px 14px; border-radius: 9999px; border: 1px solid var(--border-glass); background: var(--bg-glass); color: var(--text-muted); cursor: pointer; font-size: 12px; font-family: var(--font); transition: all var(--transition-fast); touch-action: manipulation; user-select: none; }
    .tag-chip:hover { border-color: var(--border-glass-hover); color: var(--text); }
    .tag-chip.selected { background: rgba(13,148,136,0.2); color: var(--primary); border-color: rgba(13,148,136,0.3); }
    .tag-chip:active { transform: scale(0.95); }
  `]
})
export class TasksComponent {
  readonly taskService = inject(TaskService);
  readonly projectService = inject(ProjectService);
  readonly tagService = inject(TagService);
  readonly now = computed(() => Date.now());

  search = signal('');
  statusFilter = signal('all');
  sortField = signal('createdAt');
  sortDesc = signal(true);

  showForm = signal(false);
  editingId = signal<string | null>(null);
  formTitle = '';
  formDesc = '';
  formPriority: string = 'medium';
  formStatus: string = 'todo';
  formProject: string = '';
  formTags = signal<string[]>([]);
  formDueDate = '';

  readonly filtered = computed(() => {
    let items = this.taskService.tasks();
    const sf = this.statusFilter();
    if (sf !== 'all') items = items.filter(t => t.status === sf);
    const s = this.search();
    if (s) items = items.filter(t => t.title.toLowerCase().includes(s.toLowerCase()) || (t.description || '').toLowerCase().includes(s.toLowerCase()));
    const field = this.sortField();
    items.sort((a, b) => {
      if (field === 'priority') {
        const order: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        return order[b.priority] - order[a.priority];
      }
      if (field === 'dueDate') return (b.dueDate ?? 0) - (a.dueDate ?? 0);
      if (field === 'title') return a.title.localeCompare(b.title);
      return b.createdAt - a.createdAt;
    });
    return items;
  });

  openNew() {
    this.editingId.set(null);
    this.formTitle = ''; this.formDesc = ''; this.formPriority = 'medium';
    this.formStatus = 'todo'; this.formProject = ''; this.formDueDate = '';
    this.formTags.set([]);
    this.showForm.set(true);
  }

  confirmDelete(t: Task) {
    if (confirm(`Delete "${t.title}"?`)) {
      this.deleteTask(t.id);
    }
  }

  editTask(t: Task) {
    this.editingId.set(t.id);
    this.formTitle = t.title; this.formDesc = t.description;
    this.formPriority = t.priority; this.formStatus = t.status;
    this.formProject = t.projectId ?? ''; this.formDueDate = t.dueDate ? new Date(t.dueDate).toISOString().slice(0, 10) : '';
    this.formTags.set([...t.tagIds]);
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  toggleTag(id: string) {
    this.formTags.update(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  async saveTask() {
    if (!this.formTitle.trim()) return;
    const due = this.formDueDate ? new Date(this.formDueDate).getTime() : undefined;
    if (due && isNaN(due)) return;
    if (this.editingId()) {
      await this.taskService.update(this.editingId()!, {
        title: this.formTitle.trim(), description: this.formDesc.trim(),
        priority: this.formPriority as any, status: this.formStatus as any,
        projectId: this.formProject || null, tagIds: this.formTags(),
        dueDate: due ?? null,
      });
    } else {
      await this.taskService.add({
        title: this.formTitle.trim(), description: this.formDesc.trim(),
        priority: this.formPriority as any, status: this.formStatus as any,
        projectId: this.formProject || null, tagIds: this.formTags(),
        dueDate: due ?? null,
      });
    }
    this.closeForm();
  }

  async deleteTask(id: string) {
    await this.taskService.delete(id);
  }
}
