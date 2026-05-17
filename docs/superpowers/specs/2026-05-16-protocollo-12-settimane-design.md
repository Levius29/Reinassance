# Protocollo 12 Settimane Design

## Goal

Build a static offline-first PWA for a 12-week health protocol. The app must act as daily guide and diary: exact-time tasks, simple checkoffs, robust local persistence, weekly values, clinical labs, charts, reports, backup/import.

## Architecture

No build step. Root serves `index.html`, `css/style.css`, vanilla ES modules in `js/`, `manifest.webmanifest`, `sw.js`, and generated PNG icons. All runtime state lives in IndexedDB through `js/db.js`; every write also updates a throttled `localStorage` mirror named `protocol_backup_v1`.

UI is one-page hash routing: `#oggi`, `#settimana`, `#valori`, `#grafici`, `#report`. Protocol content is static data in `js/protocol.js`; UI renders from data, never hardcodes supplements/training/lab fields.

## Data Model

IndexedDB database `protocol_db`, version 1:

- `days`, key `date`, index `weekNumber`
- `weeks`, key `weekNumber`
- `labs`, key `id` autoincrement, index `date`
- `settings`, key `key`
- `meta`, key `key`

`days` contains `date`, `weekNumber`, `dayType`, `items`, `completedPct`, `note`, `updatedAt`. `weeks` stores weekly body/symptom values and note. `labs` stores free optional clinical panel values. `settings` stores theme and protocol start date. `meta` stores streak and schema data.

## MVP Scope

Implement full app skeleton plus the important foundation:

- IndexedDB CRUD, export/import, restore-from-mirror path.
- Static 12-week protocol data including supplements, day types, milestones, lab fields, manifesto.
- Onboarding with start date.
- Today tab with current protocol day, training checklist, supplements, habits, autosave, progress, streak badge.
- Week tab with 7-day adherence grid and weekly metrics form.
- Labs tab with create/edit/delete lab records.
- Charts tab using Chart.js CDN when available, graceful no-chart fallback.
- Report tab with weekly report text, print, export/import.
- PWA manifest, service worker, iOS meta, offline shell cache, relative paths.

## Error Handling

All database writes return promises and surface toast errors. Import validates top-level stores before replacing state. Destructive lab delete and import replace use explicit confirmation. If IndexedDB is empty and local mirror exists, app prompts to restore.

## Testing

Use `node --test` for pure modules:

- Protocol dates and day-type derivation.
- Checklist item generation and completion percentage.
- Backup payload validation helpers.
- Invariant V1: UI must never show protocol week below 1, even if selected date is before start date.

Use a local static server plus browser manual check for app startup, route switching, persistence after reload, and service worker registration.

## Self-Review

No placeholders. Scope is one static PWA. Design follows Claude plan with one pragmatic choice: implement broad but neutral UI now, leaving visual polish for later review.

## Bug Log

- B1 | 2026-05-16 | Future start date made Today show week 0 | V1
