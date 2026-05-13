# Todoz — Peaceful Productivity

A modern, responsive task management PWA built with Angular + Dexie (IndexedDB). Features a kanban board, Pomodoro focus timer, time tracking, analytics, and full offline/PWA support.

Built with Capacitor for native mobile deployment and Angular Service Worker for offline-first experience.

## Features

- **Dashboard** — Daily overview with stats, quick-add, and upcoming tasks
- **Tasks** — Full CRUD with search, filters, sorting, and tags
- **Kanban Board** — Drag-and-drop status columns with mobile horizontal scroll
- **Focus Timer** — Pomodoro-style timer with session tracking
- **Time Tracking** — Per-task stopwatch with daily log
- **Analytics** — Completion rates, weekly trends, and priority breakdown
- **Settings** — Theme toggle, project/tag management

## Tech Stack

- Angular 21 (standalone components, signals)
- Dexie.js (IndexedDB wrapper)
- Material Icons
- Capacitor (mobile)
- PWA (service worker)

## Quick Start

```bash
npm install
ng serve
```

Open `http://localhost:4200`. Demo data seeds automatically on first load.

## Build

```bash
ng build
```

## Mobile

```bash
npx cap add android
npx cap open android
```
