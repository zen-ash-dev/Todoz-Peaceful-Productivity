import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService, TagService } from '../../services';

const COLORS = ['#0D9488', '#14B8A6', '#F97316', '#EF4444', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#64748B'];

@Component({
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <h1 style="font-size:24px;font-weight:700;margin-bottom:20px;">Settings</h1>

      <div class="glass-card" style="padding:16px;margin-bottom:16px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <span class="material-icons" style="color:var(--primary)">palette</span> Theme
        </h2>
        <div style="display:flex;gap:8px;">
          <button class="theme-opt" [class.active]="currentTheme === 'dark'" (click)="setTheme('dark')">
            <span class="material-icons">dark_mode</span> Dark
          </button>
          <button class="theme-opt" [class.active]="currentTheme === 'light'" (click)="setTheme('light')">
            <span class="material-icons">light_mode</span> Light
          </button>
        </div>
      </div>

      <div class="glass-card" style="padding:16px;margin-bottom:16px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <span class="material-icons" style="color:var(--primary)">folder</span> Projects
        </h2>
        <div class="inline-form">
          <input class="input" placeholder="Project name" [(ngModel)]="newProject" (keydown.enter)="handleAddProject()" />
          <div class="color-picker">
            @for (c of colors.slice(0,5); track c) {
              <button class="color-dot" [class.selected]="c === projectColor" [style.background]="c" (click)="projectColor = c"></button>
            }
          </div>
          <button class="btn btn-primary" (click)="handleAddProject()">add</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          @for (p of projectService.projects(); track p.id) {
            <div class="chip">
              <span class="chip-dot" [style.background]="p.color"></span>
              <span>{{ p.name }}</span>
              <button class="btn-icon-sm material-icons" (click)="confirmDeleteProject(p)">close</button>
            </div>
          } @empty { <span style="font-size:13px;color:var(--text-dim)">No projects yet</span> }
        </div>
      </div>

      <div class="glass-card" style="padding:16px;">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          <span class="material-icons" style="color:var(--primary)">label</span> Tags
        </h2>
        <div class="inline-form">
          <input class="input" placeholder="Tag name" [(ngModel)]="newTag" (keydown.enter)="handleAddTag()" />
          <div class="color-picker">
            @for (c of colors.slice(2,7); track c) {
              <button class="color-dot" [class.selected]="c === tagColor" [style.background]="c" (click)="tagColor = c"></button>
            }
          </div>
          <button class="btn btn-primary" (click)="handleAddTag()">add</button>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          @for (t of tagService.tags(); track t.id) {
            <div class="chip" [style.background]="t.color + '20'" [style.color]="t.color">
              <span>{{ t.name }}</span>
              <button class="btn-icon-sm material-icons" (click)="confirmDeleteTag(t)">close</button>
            </div>
          } @empty { <span style="font-size:13px;color:var(--text-dim)">No tags yet</span> }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 600px; margin: 0 auto; }

    .theme-opt { display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:var(--radius-sm);border:1px solid var(--border-glass);background:transparent;color:var(--text-muted);cursor:pointer;font-family:var(--font);font-size:14px;flex:1;justify-content:center;transition:all var(--transition-fast);touch-action:manipulation;user-select:none; }
    .theme-opt:active { transform:scale(0.97); }
    .theme-opt.active { background:var(--primary);color:white;border-color:var(--primary); }
    .theme-opt .material-icons { font-size:18px !important; }

    .btn-icon-sm { display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;border:none;background:transparent;color:inherit;cursor:pointer;font-size:14px;opacity:0.6;transition:opacity var(--transition-fast);touch-action:manipulation; }
    .btn-icon-sm:hover { opacity:1; }

    .inline-form { display: flex; gap: 8px; margin-bottom: 12px; align-items: center; }
    .inline-form .input { flex: 1; min-width: 0; }
    .color-picker { display: flex; gap: 4px; flex-shrink: 0; }

    @media (max-width: 480px) {
      .theme-opt { padding: 12px 16px; }
      .inline-form { flex-wrap: wrap; }
      .inline-form .input { width: 100%; flex: none; order: 1; }
      .inline-form .color-picker { order: 3; }
      .inline-form .btn { order: 2; margin-left: auto; }
    }
  `]
})
export class SettingsComponent {
  readonly projectService = inject(ProjectService);
  readonly tagService = inject(TagService);
  readonly colors = COLORS;

  newProject = '';
  projectColor = COLORS[0];
  newTag = '';
  tagColor = COLORS[2];
  currentTheme = localStorage.getItem('todoz-theme') || 'dark';

  setTheme(t: string) {
    this.currentTheme = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('todoz-theme', t);
  }

  async handleAddProject() {
    if (!this.newProject.trim()) return;
    await this.projectService.add(this.newProject.trim(), this.projectColor);
    this.newProject = '';
  }

  async handleAddTag() {
    if (!this.newTag.trim()) return;
    await this.tagService.add(this.newTag.trim(), this.tagColor);
    this.newTag = '';
  }

  confirmDeleteProject(p: any) { if (confirm(`Delete project "${p.name}"?`)) this.projectService.delete(p.id); }
  confirmDeleteTag(t: any) { if (confirm(`Delete tag "${t.name}"?`)) this.tagService.delete(t.id); }
}
