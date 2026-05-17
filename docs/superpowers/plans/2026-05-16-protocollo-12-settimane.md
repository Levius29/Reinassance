# Protocollo 12 Settimane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the base static PWA for daily protocol tracking with durable local persistence.

**Architecture:** Vanilla HTML/CSS/JS modules, no build step. Data through IndexedDB wrapper with localStorage mirror. UI uses hash tabs and renders from static protocol data.

**Tech Stack:** HTML5, CSS3 custom properties, JavaScript ES modules, IndexedDB, localStorage, service worker, Chart.js CDN, Node built-in test runner.

---

### Task 1: Pure Protocol And Checklist Logic

**Files:**
- Create: `js/protocol.js`
- Create: `js/checklist.js`
- Create: `tests/checklist.test.js`

- [ ] Write tests for protocol week/day calculation and completion percentage.
- [ ] Run `node --test tests/checklist.test.js` and confirm missing module failure.
- [ ] Implement protocol data and checklist helpers.
- [ ] Re-run test and confirm pass.

### Task 2: Persistence Foundation

**Files:**
- Create: `js/db.js`
- Create: `tests/db-helpers.test.js`

- [ ] Write tests for export payload validation and mirror snapshot normalization.
- [ ] Run `node --test tests/db-helpers.test.js` and confirm missing module failure.
- [ ] Implement IndexedDB wrapper, export/import, mirror backup, restore detection.
- [ ] Re-run persistence helper tests.

### Task 3: Static App Shell

**Files:**
- Create: `index.html`
- Create: `css/style.css`
- Create: `js/ui.js`
- Create: `js/app.js`

- [ ] Build semantic app shell with bottom tabs, onboarding dialog, modal, toasts.
- [ ] Wire app startup, settings, routing, today/week/labs/charts/report renderers.
- [ ] Register service worker.
- [ ] Verify in browser via static server.

### Task 4: Reports, Charts, PWA

**Files:**
- Create: `js/metrics.js`
- Create: `js/report.js`
- Create: `js/charts.js`
- Create: `manifest.webmanifest`
- Create: `sw.js`
- Create: `README.md`
- Create: `assets/icons/icon-192.png`
- Create: `assets/icons/icon-512.png`
- Create: `assets/icons/icon-512-maskable.png`

- [ ] Implement weekly summaries, lab/weekly chart series, report text.
- [ ] Add manifest, service worker cache list, README deployment notes.
- [ ] Generate simple PNG icons.
- [ ] Run all tests and static-server smoke test.

### Self-Review

Plan covers all MVP parts from design. No placeholder tasks. Tests focus where browser APIs are not required.
