# Cockpit Editorial Dark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the PWA cockpit into the Editorial Dark design system, add swipe/haptic/long-press flows, populate the diet plan, and drop the unused labs/charts subsystem — without breaking the no-build PWA contract.

**Architecture:** Static PWA (HTML + ES modules + CSS), IndexedDB persistence (now v2 with `diet_overrides`), single non-scrolling viewport with 4 horizontally snapped slides on `#view-oggi`. Theming is now dark-only. The render loop in `js/app.js` stays event-driven, with a new `meal-editor.js` module for the long-press inline diet editor.

**Tech Stack:** Vanilla HTML/CSS/JS (ES modules), IndexedDB, IntersectionObserver, Pointer Events, Outfit + JetBrains Mono via Google Fonts CDN, Service Worker for offline. No bundler. Node `--test` for unit tests.

---

## File map

| Path | Responsibility | Action |
|------|----------------|--------|
| `index.html` | Shell, font preconnect, module entry | Modify |
| `css/style.css` | Editorial Dark tokens, layout, slides, tiles, ring, modal | Rewrite |
| `js/app.js` | Render orchestrator, events, slide controller, ring updater | Refactor |
| `js/protocol.js` | Static protocol data, DIET_PLAN content, date helpers | Modify |
| `js/db.js` | IndexedDB wrapper + migration v2, new store `diet_overrides`, drop `labs` | Modify |
| `js/checklist.js` | Pure checklist + completion math | Unchanged |
| `js/ui.js` | Modal, toast, helpers; new `haptic`, `longPress`, `ringSvg` | Modify |
| `js/report.js` | Weekly text report | Unchanged |
| `js/meal-editor.js` | Long-press editor modal for diet overrides | Create |
| `js/diet.js` | Pure merge function `mergeDietForDate(default, overrides)` | Create |
| `js/charts.js` | Charts view | Delete |
| `js/metrics.js` | Chart metrics | Delete |
| `sw.js` | Service worker cache list, bump cache version | Modify |
| `tests/diet-overrides.test.js` | Test `mergeDietForDate` | Create |
| `tests/checklist.test.js` | Verify still green | Run only |
| `tests/db-helpers.test.js` | Update for v2 schema | Modify |

---

## Task 1: DB schema v2 — add `diet_overrides`, drop `labs`

**Files:**
- Modify: `js/db.js`
- Modify: `tests/db-helpers.test.js`

- [ ] **Step 1: Inspect current test to know the contract**

Run: `cat tests/db-helpers.test.js`
Note which `STORE_NAMES`, `normalizeSnapshot` keys, `validateBackupPayload` errors the test asserts on. Keep those assertions green or update them deliberately.

- [ ] **Step 2: Update `js/db.js` schema and migration**

Modify the top of the file:

```js
export const DB_NAME = "protocol_db";
export const DB_VERSION = 2;
export const BACKUP_VERSION = 2;
export const MIRROR_KEY = "protocol_backup_v2";

const STORE_DEFS = {
  days: { keyPath: "date", indexes: [{ name: "weekNumber", keyPath: "weekNumber" }] },
  weeks: { keyPath: "weekNumber", indexes: [] },
  diet_overrides: { keyPath: "id", indexes: [{ name: "by-date", keyPath: "date" }] },
  settings: { keyPath: "key", indexes: [] },
  meta: { keyPath: "key", indexes: [] },
};
```

Replace `createEmptySnapshot`, `normalizeSnapshot`, and `validateBackupPayload` so the `labs` entry is removed and `diet_overrides` is added. Replace the three functions with:

```js
export function createEmptySnapshot() {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date(0).toISOString(),
    days: [],
    weeks: [],
    diet_overrides: [],
    settings: [],
    meta: [],
  };
}

export function normalizeSnapshot(payload) {
  return {
    version: payload?.version ?? BACKUP_VERSION,
    exportedAt: payload?.exportedAt ?? new Date().toISOString(),
    days: Array.isArray(payload?.days) ? payload.days : [],
    weeks: Array.isArray(payload?.weeks) ? payload.weeks : [],
    diet_overrides: Array.isArray(payload?.diet_overrides) ? payload.diet_overrides : [],
    settings: Array.isArray(payload?.settings) ? payload.settings : [],
    meta: Array.isArray(payload?.meta) ? payload.meta : [],
  };
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Backup non valido." };
  if (payload.version !== BACKUP_VERSION && payload.version !== 1) {
    return { ok: false, error: "Versione backup non supportata." };
  }
  for (const storeName of STORE_NAMES) {
    if (payload[storeName] !== undefined && !Array.isArray(payload[storeName])) {
      return { ok: false, error: `Store ${storeName} non valido.` };
    }
  }
  return { ok: true, error: "" };
}
```

Replace the `openDB` block so the migration drops `labs` if it exists:

```js
export function openDB() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB non disponibile in questo browser."));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains("labs")) db.deleteObjectStore("labs");
      for (const [name, def] of Object.entries(STORE_DEFS)) {
        const store = db.objectStoreNames.contains(name)
          ? request.transaction.objectStore(name)
          : db.createObjectStore(name, {
              keyPath: def.keyPath,
              autoIncrement: def.autoIncrement === true,
            });
        for (const index of def.indexes) {
          if (!store.indexNames.contains(index.name)) store.createIndex(index.name, index.keyPath);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
  return dbPromise;
}
```

Also drop the old mirror key when loading mirror, to avoid v1 leakage. Replace `readMirror`:

```js
export function readMirror() {
  if (typeof localStorage === "undefined") return null;
  const legacyKey = "protocol_backup_v1";
  const raw = localStorage.getItem(MIRROR_KEY) ?? localStorage.getItem(legacyKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const validation = validateBackupPayload(parsed);
    if (!validation.ok) return null;
    return normalizeSnapshot(parsed);
  } catch {
    return null;
  }
}
```

- [ ] **Step 3: Update `tests/db-helpers.test.js` to match v2**

Open the test file, replace every reference to `labs` with `diet_overrides`, bump expected `BACKUP_VERSION` to `2` if asserted, and verify `createEmptySnapshot` keys. If the test imports a constant called `LABS_*`, remove that assertion line.

- [ ] **Step 4: Run the DB tests**

Run: `node --test tests/db-helpers.test.js`
Expected: all tests pass. If a test still fails because it asserts on `labs`, that assertion must be deleted (we are intentionally dropping the store).

- [ ] **Step 5: Commit**

```bash
git add js/db.js tests/db-helpers.test.js
git commit -m "feat(db): schema v2 with diet_overrides, drop labs store"
```

---

## Task 2: Pure `mergeDietForDate` + tests

**Files:**
- Create: `js/diet.js`
- Create: `tests/diet-overrides.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/diet-overrides.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { mergeDietForDate } from "../js/diet.js";

const defaultMeals = [
  { id: "meal_breakfast", label: "Colazione", time: "08:00", items: ["A"] },
  { id: "meal_lunch", label: "Pranzo", time: "13:00", items: ["B"] },
  { id: "meal_dinner", label: "Cena", time: "20:00", items: ["C"] },
];

test("returns defaults when no overrides", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, []);
  assert.deepEqual(merged.map((m) => m.items), [["A"], ["B"], ["C"]]);
});

test("overrides matching meal for date", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["X", "Y"] },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["X", "Y"]);
  assert.deepEqual(merged.find((m) => m.id === "meal_breakfast").items, ["A"]);
});

test("ignores overrides for other dates", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-18_meal_lunch", date: "2026-05-18", mealId: "meal_lunch", items: ["Z"] },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["B"]);
});

test("last override wins for duplicate id", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["first"], updatedAt: 1 },
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["last"], updatedAt: 2 },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["last"]);
});

test("preserves meal order and time/label", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_dinner", date: "2026-05-17", mealId: "meal_dinner", items: ["new"] },
  ]);
  assert.deepEqual(merged.map((m) => m.id), ["meal_breakfast", "meal_lunch", "meal_dinner"]);
  assert.equal(merged[2].time, "20:00");
  assert.equal(merged[2].label, "Cena");
});

test("marks overridden meals so UI can show indicator", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["X"] },
  ]);
  assert.equal(merged.find((m) => m.id === "meal_lunch").overridden, true);
  assert.equal(merged.find((m) => m.id === "meal_breakfast").overridden, false);
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `node --test tests/diet-overrides.test.js`
Expected: failure with `ERR_MODULE_NOT_FOUND` for `../js/diet.js`.

- [ ] **Step 3: Create `js/diet.js` with the minimal implementation**

```js
export function buildOverrideId(date, mealId) {
  return `${date}_${mealId}`;
}

export function mergeDietForDate(date, defaultMeals, overrides) {
  const relevant = new Map();
  for (const override of overrides) {
    if (override.date !== date) continue;
    relevant.set(override.mealId, override);
  }
  return defaultMeals.map((meal) => {
    const override = relevant.get(meal.id);
    if (!override) return { ...meal, overridden: false };
    return { ...meal, items: override.items, overridden: true };
  });
}
```

- [ ] **Step 4: Run the test to confirm it passes**

Run: `node --test tests/diet-overrides.test.js`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/diet.js tests/diet-overrides.test.js
git commit -m "feat(diet): pure mergeDietForDate function with tests"
```

---

## Task 3: Populate `DIET_PLAN`, drop `LAB_FIELDS` and `labsToBook`

**Files:**
- Modify: `js/protocol.js`

- [ ] **Step 1: Open `js/protocol.js` and locate `DIET_PLAN`**

Find the `DIET_PLAN` export (currently using `DEFAULT_DAILY_MEALS` placeholder).

- [ ] **Step 2: Replace `DEFAULT_DAILY_MEALS` and `DIET_PLAN` with the full plan**

Delete the `DEFAULT_DAILY_MEALS` constant and replace `DIET_PLAN` with:

```js
export const DIET_PLAN = {
  1: {
    label: "Lunedì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", items: [
        "Avena 80g cotta in acqua",
        "4 albumi + 1 uovo intero strapazzati",
        "Frutti rossi 100g",
        "Caffè nero",
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", items: [
        "Pollo 200g grigliato",
        "Riso basmati 100g (peso secco)",
        "Verdure miste cotte + 1 cucchiaio olio EVO",
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", items: [
        "Salmone 180g al forno",
        "Patate dolci 200g",
        "Insalata mista + limone",
      ]},
    ],
  },
  2: {
    label: "Martedì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", items: [
        "Pane integrale 80g",
        "Ricotta 150g",
        "Miele 1 cucchiaino",
        "Frutta fresca 1 porzione",
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", items: [
        "Pasta integrale 100g",
        "Tonno al naturale 150g",
        "Pomodorini + olio EVO",
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", items: [
        "Spuntino pre-MT 16:30: banana + mandorle 30g",
        "Post-allenamento: pollo 180g + quinoa 80g + verdure cotte",
      ]},
    ],
  },
  3: {
    label: "Mercoledì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", items: [
        "Avena 80g cotta",
        "Whey 30g",
        "Banana",
        "Burro arachidi 15g",
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", items: [
        "Manzo magro 200g",
        "Riso 100g (peso secco)",
        "Spinaci saltati + olio EVO",
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", items: [
        "Merluzzo 200g",
        "Patate 200g",
        "Broccoli al vapore",
      ]},
    ],
  },
  4: {
    label: "Giovedì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", items: [
        "Yogurt greco 0% 250g",
        "Granola 50g",
        "Frutta fresca",
        "Noci 20g",
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", items: [
        "Insalata mista grande",
        "3 uova sode",
        "Pane integrale 60g",
        "Olio EVO + aceto",
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", items: [
        "Zuppa legumi 300g (lenticchie/ceci/fagioli)",
        "Pane integrale 60g",
        "Formaggio fresco 60g",
      ]},
    ],
  },
  5: {
    label: "Venerdì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", items: [
        "Pancake avena (80g avena + 3 albumi + 1 uovo)",
        "Frutti rossi 100g",
        "Sciroppo acero 1 cucchiaino",
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", items: [
        "Pollo 200g",
        "Patate 250g al forno",
        "Verdure grigliate + olio EVO",
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", items: [
        "Tacchino 200g",
        "Riso 100g (peso secco)",
        "Zucchine saltate",
      ]},
    ],
  },
  6: {
    label: "Sabato",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", items: [
        "Toast integrale 2 fette",
        "2 uova alla coque",
        "Avocado mezzo",
        "Frutta fresca",
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", items: [
        "Pasta 100g",
        "Ragù magro di manzo",
        "Parmigiano 15g",
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", items: [
        "Spuntino pre-MT 16:30: banana + mandorle 30g",
        "Pesce azzurro 200g (sgombro/alici)",
        "Verdure + olio EVO",
      ]},
    ],
  },
  0: {
    label: "Domenica",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "09:00", items: [
        "Brunch libero: uova benedict / pancake / scelta",
        "Caffè + frutta",
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:30", items: [
        "Pasto libero con focus omega-3",
        "Opzioni: salmone, sgombro, sardine, o piatto di legumi",
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", items: [
        "Insalatona ricca proteica",
        "Petto pollo o tonno o uova",
        "Semi misti + olio EVO",
      ]},
    ],
  },
};
```

- [ ] **Step 3: Delete `LAB_FIELDS` and clean `MILESTONES`**

Find `export const LAB_FIELDS = [` and delete the entire array through the closing `];`.

Find `MILESTONES` and remove the `labsToBook` keys from week 6 and week 12 entries. The result should be:

```js
export const MILESTONES = {
  1: { type: "info", text: "Fase 1 — Ricostruzione. Forza 70-75%, reps 6-8." },
  4: { type: "info", text: "Settimana di scarico — forza −30%." },
  5: { type: "info", text: "Fase 2 — Carichi pieni (4-6 reps)." },
  6: { type: "exam", text: "Checkpoint esami: dosa D3, B12, folati." },
  8: { type: "info", text: "Settimana di scarico (2°)." },
  12: { type: "exam", text: "Checkpoint maggiore: panel completo." },
};
```

- [ ] **Step 4: Syntax check**

Run: `node --check js/protocol.js`
Expected: silent success.

- [ ] **Step 5: Existing tests still green**

Run: `node --test tests/*.test.js`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add js/protocol.js
git commit -m "feat(protocol): fill DIET_PLAN with TRT recovery template, drop LAB_FIELDS"
```

---

## Task 4: HTML shell — fonts + drop Chart.js + drop unused views

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the entire `index.html` content**

Overwrite `index.html` with:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="Protocollo">
    <meta name="theme-color" content="#08090d">
    <meta name="color-scheme" content="dark">
    <title>Protocollo 12 Settimane</title>
    <link rel="manifest" href="./manifest.webmanifest">
    <link rel="apple-touch-icon" href="./assets/icons/icon-192.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap">
    <link rel="stylesheet" href="./css/style.css">
    <script type="module" src="./js/app.js"></script>
  </head>
  <body>
    <div id="app" class="app-shell">
      <main>
        <section id="view-oggi" class="view"></section>
      </main>
    </div>

    <dialog id="modal" class="modal">
      <div class="modal-panel">
        <button class="icon-button modal-close" type="button" data-close-modal aria-label="Chiudi">×</button>
        <h2 class="modal-title"></h2>
        <div class="modal-body"></div>
        <div class="modal-actions"></div>
      </div>
    </dialog>

    <div id="toastHost" class="toast-host" aria-live="polite"></div>
    <input id="importFile" type="file" accept="application/json" hidden>
  </body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat(html): editorial dark shell — Outfit/JetBrains Mono, drop Chart.js and dead views"
```

---

## Task 5: CSS rewrite — Editorial Dark

**Files:**
- Overwrite: `css/style.css`

- [ ] **Step 1: Replace `css/style.css` in full**

Overwrite `css/style.css` with:

```css
:root {
  --font-display: "Outfit", -apple-system, BlinkMacSystemFont, "SF Pro", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace;
  --ink: #08090d;
  --surface: #0f1218;
  --surface-2: #1a1e27;
  --surface-3: #232936;
  --border: #262b36;
  --border-soft: #1e222b;
  --text: #f5f6f8;
  --text-dim: #9aa3b2;
  --text-mute: #5b6373;
  --accent: #7c3aed;
  --accent-strength: #7c3aed;
  --accent-combat: #f97316;
  --accent-rest: #10b981;
  --good: #22c55e;
  --warn: #f59e0b;
  --bad: #ef4444;
  --day-accent: var(--accent);
  --radius-sm: 10px;
  --radius: 12px;
  --radius-lg: 16px;
  --radius-xl: 18px;
  --shadow: 0 1px 0 rgba(255,255,255,.04) inset, 0 10px 28px rgba(0,0,0,.45);
  color-scheme: dark;
}

* { box-sizing: border-box; }
html, body {
  margin: 0;
  height: 100%;
  background: var(--ink);
  color: var(--text);
  font-family: var(--font-display);
  -webkit-text-size-adjust: 100%;
  -webkit-font-smoothing: antialiased;
  overflow: hidden;
  overscroll-behavior: none;
  touch-action: manipulation;
}
body { scrollbar-width: none; }
body::-webkit-scrollbar { display: none; }
body::before {
  content: "";
  position: fixed; inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, color-mix(in srgb, var(--day-accent) 14%, transparent), transparent 60%),
    radial-gradient(ellipse 60% 40% at 100% 100%, color-mix(in srgb, var(--day-accent) 6%, transparent), transparent 70%);
  z-index: 0;
  transition: background 400ms ease;
}

button, input, textarea, select {
  font: inherit;
  font-family: var(--font-display);
  font-size: 16px;
  color: inherit;
}
button { cursor: pointer; background: transparent; border: 0; color: inherit; }

.app-shell {
  position: relative;
  z-index: 1;
  height: 100svh;
  overflow: hidden;
  padding: calc(10px + env(safe-area-inset-top)) 14px calc(14px + env(safe-area-inset-bottom));
}

main {
  height: 100%;
  min-height: 0;
  margin: 0 auto;
  max-width: 520px;
  overflow: hidden;
}

.view {
  height: 100%;
  min-height: 0;
  display: grid;
  gap: 12px;
  overflow: hidden;
}

#view-oggi {
  grid-template-rows: auto auto auto auto minmax(0, 1fr) auto;
}

/* --- COCKPIT HERO --- */
.cockpit-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 4px 2px 0;
}
.cockpit-hero .head-eyebrow {
  font-size: 10px;
  letter-spacing: .14em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-dim);
}
.cockpit-hero h1 {
  margin: 4px 0 6px;
  font-weight: 800;
  letter-spacing: -.02em;
  font-size: clamp(22px, 6vw, 32px);
  line-height: 1.05;
}
.cockpit-hero .next-task {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-dim);
  font-weight: 600;
}
.cockpit-hero .next-task b {
  font-family: var(--font-mono);
  color: var(--day-accent);
  font-weight: 700;
}
.cockpit-hero .day-nav {
  display: inline-flex;
  gap: 6px;
  margin-top: 8px;
}
.cockpit-hero .day-nav button {
  width: 32px; height: 32px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-size: 14px;
  color: var(--text-dim);
  transition: transform 80ms ease, color 200ms ease, border-color 200ms ease;
}
.cockpit-hero .day-nav button:active {
  transform: scale(.94);
  color: var(--day-accent);
  border-color: var(--day-accent);
}

.ring {
  width: 72px; height: 72px;
  position: relative;
}
.ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
.ring svg .track { stroke: var(--surface-3); fill: none; stroke-width: 6; }
.ring svg .fill {
  stroke: var(--day-accent);
  fill: none;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 400ms cubic-bezier(.4,0,.2,1), stroke 300ms;
}
.ring .ring-label {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -.02em;
}
.ring .ring-label small {
  font-size: 9px;
  color: var(--text-dim);
  margin-left: 2px;
}

/* --- WEEK STRIP V2 --- */
.week-strip {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 6px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
}
.week-cell {
  display: grid;
  grid-template-rows: auto auto auto;
  align-items: center;
  justify-items: center;
  padding: 8px 2px;
  border-radius: var(--radius);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-dim);
  transition: transform 80ms ease, background 200ms ease, color 200ms ease, border-color 200ms ease;
  min-height: 64px;
}
.week-cell:active { transform: scale(.96); }
.week-cell .wk-name {
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  font-weight: 700;
}
.week-cell .wk-day {
  font-family: var(--font-mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  margin-top: 2px;
}
.week-cell .wk-dot {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: var(--border);
  margin-top: 4px;
  box-shadow: 0 0 0 0 transparent;
}
.week-cell.filled .wk-dot { background: var(--cell-accent, var(--day-accent)); }
.week-cell.active {
  background: color-mix(in srgb, var(--cell-accent, var(--day-accent)) 14%, var(--surface));
  border-color: color-mix(in srgb, var(--cell-accent, var(--day-accent)) 55%, var(--border));
  color: var(--text);
}
.week-cell.active .wk-dot {
  background: var(--cell-accent, var(--day-accent));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cell-accent, var(--day-accent)) 25%, transparent);
}

/* --- SLIDE HEADER --- */
.slide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 0;
}
.slide-dots {
  display: flex;
  align-items: center;
  gap: 6px;
}
.slide-dot {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: var(--surface-3);
  transition: width 220ms ease, background 220ms ease;
}
.slide-dot.active {
  width: 16px;
  background: var(--day-accent);
}
.slide-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -.01em;
  transition: opacity 150ms ease;
}
.slide-label.fading { opacity: 0; }

/* --- MILESTONE BANNER --- */
.milestone {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  background: color-mix(in srgb, var(--day-accent) 10%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--day-accent) 40%, var(--border));
  border-radius: var(--radius);
  padding: 8px 12px;
}

/* --- DAILY BOARD (4 SLIDES) --- */
.daily-board {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
}
.daily-board::-webkit-scrollbar { display: none; }
.slide {
  flex: 0 0 100%;
  min-width: 100%;
  height: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 2px;
}
.slide::-webkit-scrollbar { display: none; }

.card {
  background: var(--surface);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 14px;
  box-shadow: var(--shadow);
}
.card + .card { margin-top: 10px; }

.card-eyebrow {
  font-size: 10px;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-weight: 700;
  color: var(--text-dim);
}
.card-title {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  margin: 2px 0 12px;
}
.card-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -.01em;
}
.card-title .meta {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  color: var(--day-accent);
}

/* --- CHECK ROWS --- */
.check-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 10px 12px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  background: var(--surface-2);
  transition: transform 80ms ease, border-color 200ms ease, background 200ms ease;
}
.check-row:active { transform: scale(.98); }
.check-row.primary {
  min-height: 56px;
  border-left: 4px solid var(--day-accent);
  border-radius: 14px;
  background: color-mix(in srgb, var(--day-accent) 8%, var(--surface));
}
.check-row input[type="checkbox"] {
  width: 22px; height: 22px;
  accent-color: var(--day-accent);
  flex: 0 0 22px;
}
.check-row span { font-size: 14px; font-weight: 600; line-height: 1.3; }

/* --- EXERCISE LIST --- */
.exercise-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  counter-reset: ex;
  display: grid;
  gap: 8px;
}
.exercise-list li {
  position: relative;
  padding: 8px 10px 8px 38px;
  border-radius: var(--radius);
  background: var(--surface-2);
  font-size: 13px;
  color: var(--text);
  line-height: 1.4;
  counter-increment: ex;
}
.exercise-list li::before {
  content: counter(ex);
  position: absolute;
  left: 8px; top: 50%;
  transform: translateY(-50%);
  width: 22px; height: 22px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--day-accent) 18%, var(--surface));
  color: var(--day-accent);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 700;
  display: grid;
  place-items: center;
}

/* --- SUPPLEMENT + MEAL TILES --- */
.tile-grid { display: grid; gap: 10px; }
.supp-tile, .meal-tile {
  display: grid;
  grid-template-columns: 24px 56px 1fr;
  grid-template-areas:
    "check time label"
    ".     items items";
  gap: 6px 10px;
  align-items: center;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  background: var(--surface-2);
  padding: 10px 12px;
  position: relative;
  transition: transform 80ms ease, border-color 200ms ease, background 200ms ease;
}
.supp-tile:active, .meal-tile:active { transform: scale(.99); }
.supp-tile input, .meal-tile input {
  grid-area: check;
  width: 20px; height: 20px;
  accent-color: var(--day-accent);
}
.supp-tile .time, .meal-tile .time {
  grid-area: time;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 12px;
  color: var(--day-accent);
}
.supp-tile .label, .meal-tile .label {
  grid-area: label;
  font-weight: 700;
  font-size: 14px;
}
.supp-tile .items, .meal-tile .items {
  grid-area: items;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
}
.supp-tile .items em, .meal-tile .items em {
  font-style: normal;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 9px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-dim);
  background: var(--surface);
  line-height: 1.3;
}
.meal-tile .items { flex-direction: column; align-items: stretch; }
.meal-tile .items em {
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 12.5px;
  text-align: left;
}
.supp-tile.checked, .meal-tile.checked {
  border-color: color-mix(in srgb, var(--day-accent) 60%, var(--border));
  background: color-mix(in srgb, var(--day-accent) 8%, var(--surface));
}
.meal-tile.overridden::after {
  content: "";
  position: absolute;
  top: 12px; right: 12px;
  width: 6px; height: 6px;
  border-radius: 999px;
  background: var(--day-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--day-accent) 22%, transparent);
}

/* --- HABITS --- */
.habit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.habit-grid .full { grid-column: 1 / -1; }
.habit-num {
  display: grid;
  grid-template-rows: auto auto;
  gap: 4px;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius);
  background: var(--surface-2);
  padding: 12px;
}
.habit-num small { font-size: 11px; color: var(--text-dim); font-weight: 700; text-transform: uppercase; letter-spacing: .1em; }
.habit-num input {
  border: 0;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  padding: 0;
  outline: none;
  width: 100%;
}

/* --- PANEL ROW --- */
.panel-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 2px;
}
.panel-button {
  min-height: 44px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-weight: 700;
  font-size: 13px;
  letter-spacing: .04em;
  color: var(--text);
  transition: transform 80ms ease, border-color 200ms ease, color 200ms ease;
}
.panel-button:active { transform: scale(.96); border-color: var(--day-accent); color: var(--day-accent); }

/* --- BUTTONS GENERIC --- */
.button, .icon-button {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  padding: 0 14px;
  font-weight: 700;
  font-size: 14px;
  transition: transform 80ms ease, opacity 200ms ease;
}
.button:active, .icon-button:active { transform: scale(.97); }
.icon-button { width: 44px; padding: 0; font-size: 20px; }
.button.primary { background: var(--day-accent); color: #fff; border-color: var(--day-accent); }
.button.danger { background: var(--bad); color: #fff; border-color: var(--bad); }
.button.ghost { background: transparent; border-color: var(--border-soft); color: var(--text-dim); }

/* --- WEEK MODAL (panel) --- */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}
.section-head h2 { margin: 0; font-size: 18px; font-weight: 800; }
.week-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.day-tile {
  display: grid;
  grid-template-rows: auto auto auto;
  gap: 4px;
  padding: 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border-soft);
  background: var(--surface-2);
  text-align: left;
  transition: transform 80ms ease, border-color 200ms ease;
}
.day-tile:active { transform: scale(.97); }
.day-tile .lbl {
  font-size: 11px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: .1em;
  font-weight: 700;
}
.day-tile .pct {
  font-family: var(--font-mono);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -.02em;
}
.day-tile .sub { font-size: 12px; color: var(--text-dim); font-weight: 600; }
.day-tile.good { border-color: color-mix(in srgb, var(--good) 60%, var(--border)); }
.day-tile.good .pct { color: var(--good); }
.day-tile.warn { border-color: color-mix(in srgb, var(--warn) 60%, var(--border)); }
.day-tile.warn .pct { color: var(--warn); }
.day-tile.bad { border-color: color-mix(in srgb, var(--bad) 50%, var(--border)); }
.day-tile.bad .pct { color: var(--bad); }

/* --- REPORT --- */
.report-pre {
  white-space: pre-wrap;
  margin: 0 0 14px;
  line-height: 1.55;
  font-size: 13.5px;
  color: var(--text);
}
.report-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* --- MODAL --- */
.modal {
  border: 0;
  padding: 0;
  background: transparent;
  width: min(440px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
}
.modal::backdrop { background: rgba(0,0,0,.7); backdrop-filter: blur(4px); }
.modal-panel {
  position: relative;
  width: 100%;
  max-height: min(840px, calc(100vh - 32px));
  overflow: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 22px;
  box-shadow: 0 30px 80px rgba(0,0,0,.6);
  color: var(--text);
}
.modal-panel::-webkit-scrollbar { display: none; }
.modal-close { position: absolute; right: 14px; top: 14px; }
.modal-title { padding-right: 48px; margin: 0 0 14px; font-size: 18px; font-weight: 800; letter-spacing: -.01em; }
.modal-body { min-width: 0; max-width: 100%; overflow-x: hidden; font-size: 14px; line-height: 1.5; }
.modal-body p { margin: 0 0 10px; color: var(--text-dim); }
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 18px;
  flex-wrap: wrap;
}

/* --- FORM (onboarding, meal editor) --- */
.field {
  display: grid;
  gap: 6px;
  color: var(--text-dim);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.field input, .field textarea, .field select {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface-2);
  color: var(--text);
  min-height: 44px;
  padding: 12px;
  font-size: 16px;
  text-transform: none;
  letter-spacing: 0;
  font-weight: 500;
}
.field textarea { resize: vertical; min-height: 180px; line-height: 1.5; }
.manifesto-text {
  background: var(--ink);
  border: 1px solid var(--border);
  padding: 18px;
  border-radius: var(--radius-lg);
  font-size: 14.5px;
  line-height: 1.55;
}

/* --- TOAST --- */
.toast-host {
  position: fixed;
  left: 12px; right: 12px;
  bottom: calc(24px + env(safe-area-inset-bottom));
  z-index: 20;
  display: grid;
  gap: 8px;
  pointer-events: none;
}
.toast {
  justify-self: center;
  max-width: 480px;
  background: var(--text);
  color: var(--ink);
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 700;
  font-size: 13px;
}
.toast-bad { background: var(--bad); color: #fff; }

/* --- PRINT --- */
@media print {
  body::before { display: none; }
  .panel-row, .button, .icon-button { display: none !important; }
  .app-shell { padding: 0; height: auto; }
  html, body { overflow: visible !important; height: auto; }
  .card { box-shadow: none; }
}
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "feat(css): Editorial Dark design system rewrite"
```

---

## Task 6: Add helpers — `haptic`, `longPress`, `ringSvg`, formatters

**Files:**
- Modify: `js/ui.js`

- [ ] **Step 1: Append helpers to `js/ui.js`**

Append at the end of `js/ui.js` (after `debounce`):

```js
export function haptic(pattern = "tick") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const patterns = {
    tick: 10,
    "complete-day": [20, 40, 20],
    "complete-week": [30, 80, 30, 80, 50],
  };
  navigator.vibrate(patterns[pattern] ?? pattern);
}

export function longPress(element, onLongPress, { delay = 500, moveThreshold = 8 } = {}) {
  let timer = null;
  let startX = 0;
  let startY = 0;
  let fired = false;

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  }
  function onDown(event) {
    const point = event.touches ? event.touches[0] : event;
    startX = point.clientX;
    startY = point.clientY;
    fired = false;
    cancel();
    timer = setTimeout(() => {
      fired = true;
      onLongPress(event);
    }, delay);
  }
  function onMove(event) {
    if (!timer) return;
    const point = event.touches ? event.touches[0] : event;
    const dx = Math.abs(point.clientX - startX);
    const dy = Math.abs(point.clientY - startY);
    if (dx > moveThreshold || dy > moveThreshold) cancel();
  }
  function onUp() { cancel(); }
  function onClick(event) {
    if (fired) {
      event.preventDefault();
      event.stopPropagation();
      fired = false;
    }
  }
  element.addEventListener("pointerdown", onDown);
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerup", onUp);
  element.addEventListener("pointercancel", onUp);
  element.addEventListener("pointerleave", onUp);
  element.addEventListener("click", onClick, true);
  return () => {
    cancel();
    element.removeEventListener("pointerdown", onDown);
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerup", onUp);
    element.removeEventListener("pointercancel", onUp);
    element.removeEventListener("pointerleave", onUp);
    element.removeEventListener("click", onClick, true);
  };
}

export function ringSvg(pct, { size = 72, stroke = 6 } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, pct)));
  return `
    <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}"></circle>
      <circle class="fill" cx="${size/2}" cy="${size/2}" r="${r}"
              stroke-dasharray="${c.toFixed(2)}"
              stroke-dashoffset="${offset.toFixed(2)}"></circle>
    </svg>
  `;
}

export function updateRing(ringEl, pct) {
  const fill = ringEl.querySelector("svg .fill");
  if (!fill) return;
  const r = Number(fill.getAttribute("r"));
  const c = 2 * Math.PI * r;
  fill.setAttribute("stroke-dashoffset", (c * (1 - Math.max(0, Math.min(1, pct)))).toFixed(2));
  const label = ringEl.querySelector(".ring-label .num");
  if (label) label.textContent = Math.round(pct * 100);
}

export function nextTaskLabel(record, dayType, now = new Date()) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const nowHHMM = `${hh}:${mm}`;
  if (record.completedPct === 1) return { time: "", label: `Giorno chiuso · streak +1` };
  const trainingDone = record.items.training === true;
  if (!trainingDone && dayType.training.time > nowHHMM) {
    return { time: dayType.training.time, label: dayType.training.title.split(" · ")[0] };
  }
  return { time: dayType.training.time, label: dayType.label };
}
```

- [ ] **Step 2: Replace `setTheme` to be a no-op**

Find `export function setTheme` in `js/ui.js` and replace its body with:

```js
export function setTheme() {
  document.documentElement.dataset.theme = "dark";
}
```

- [ ] **Step 3: Syntax check**

Run: `node --check js/ui.js`
Expected: silent success.

- [ ] **Step 4: Commit**

```bash
git add js/ui.js
git commit -m "feat(ui): helpers — haptic, longPress, ringSvg, updateRing, nextTaskLabel"
```

---

## Task 7: `meal-editor.js` — long-press inline editor

**Files:**
- Create: `js/meal-editor.js`

- [ ] **Step 1: Create `js/meal-editor.js`**

```js
import { $, closeModal, escapeHtml, openModal, toast } from "./ui.js";
import { buildOverrideId } from "./diet.js";
import { deleteOne, getOne, putOne } from "./db.js";

export async function openMealEditor({ date, meal, onSaved }) {
  const overrideId = buildOverrideId(date, meal.id);
  const existing = await getOne("diet_overrides", overrideId);
  const initial = existing?.items ?? meal.items;
  const isOverridden = Boolean(existing);

  openModal({
    title: `${meal.label} · ${date}`,
    body: `
      <p>Un item per riga. Salvataggio sostituisce il contenuto del pasto per questa data.</p>
      <label class="field"><span>Items</span><textarea id="mealItems" rows="10">${escapeHtml(initial.join("\n"))}</textarea></label>
    `,
    actions: `
      ${isOverridden ? `<button class="button danger" type="button" id="resetMeal">Reset default</button>` : ""}
      <button class="button ghost" type="button" data-close-modal>Annulla</button>
      <button class="button primary" type="button" id="saveMeal">Salva</button>
    `,
  });

  $("#saveMeal").addEventListener("click", async () => {
    const raw = $("#mealItems").value || "";
    const items = raw.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!items.length) {
      toast("Inserisci almeno un item.", "bad");
      return;
    }
    await putOne("diet_overrides", {
      id: overrideId,
      date,
      mealId: meal.id,
      items,
      updatedAt: Date.now(),
    });
    closeModal();
    toast("Pasto aggiornato.");
    onSaved?.();
  });

  $("#resetMeal")?.addEventListener("click", async () => {
    await deleteOne("diet_overrides", overrideId);
    closeModal();
    toast("Pasto ripristinato al default.");
    onSaved?.();
  });
}
```

- [ ] **Step 2: Syntax check**

Run: `node --check js/meal-editor.js`
Expected: silent success.

- [ ] **Step 3: Commit**

```bash
git add js/meal-editor.js
git commit -m "feat(meal-editor): long-press inline editor for diet overrides"
```

---

## Task 8: `app.js` — render refactor, slide controller, ring, week-strip v2

**Files:**
- Overwrite: `js/app.js`

- [ ] **Step 1: Replace `js/app.js` in full**

Overwrite `js/app.js` with the refactored version:

```js
import {
  DAY_TYPES,
  MANIFESTO,
  MILESTONES,
  PROTOCOL,
  SUPPLEMENT_BLOCKS,
  DIET_PLAN,
  addDays,
  clampProtocolWeek,
  getDayTypeForDate,
  getInitialActiveDate,
  getProtocolWeek,
  getWeekDates,
  parseDate,
  todayString,
} from "./protocol.js";
import {
  buildDefaultDayRecord,
  getChecklistItemsForDayType,
  groupChecklistItems,
  normalizeDayRecord,
} from "./checklist.js";
import {
  downloadSnapshot,
  exportAll,
  getAll,
  getOne,
  importAll,
  maybeRestoreMirror,
  putOne,
  setSetting,
  getSetting,
} from "./db.js";
import { mergeDietForDate } from "./diet.js";
import { buildWeeklyReport } from "./report.js";
import { openMealEditor } from "./meal-editor.js";
import {
  $,
  closeModal,
  confirmDialog,
  debounce,
  escapeHtml,
  formatHumanDate,
  haptic,
  longPress,
  nextTaskLabel,
  openModal,
  pctLabel,
  ringSvg,
  setTheme,
  textInput,
  toast,
  updateRing,
} from "./ui.js";

const SLIDES = [
  { id: "training", label: "Allenamento" },
  { id: "supplements", label: "Integratori" },
  { id: "nutrition", label: "Alimentazione" },
  { id: "habits", label: "Abitudini" },
];

const state = {
  startDate: null,
  today: todayString(),
  activeDate: todayString(),
  selectedWeek: 1,
  activeSlide: 0,
  lastPct: 0,
};

const saveTodayDebounced = debounce((record) => saveDay(record), 400);

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setTheme();
  bindGlobalEvents();
  await registerServiceWorker();
  try {
    await maybeRestoreMirror(async () => confirmDialog("Backup locale trovato", "IndexedDB è vuoto ma esiste un mirror locale. Ripristino dati?", "Ripristina"));
  } catch (error) {
    toast(error.message, "bad");
  }
  state.startDate = await getSetting("startDate", null);
  if (!state.startDate) {
    showOnboarding();
    return;
  }
  state.activeDate = getInitialActiveDate(state.today, state.startDate);
  state.selectedWeek = clampProtocolWeek(getProtocolWeek(state.today, state.startDate));
  await renderToday();
}

function bindGlobalEvents() {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-modal]")) closeModal();
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "manifesto") showManifesto();
    if (action === "panel-week") showWeekPanel();
    if (action === "panel-report") showReportPanel();
    if (action === "export") await exportBackup();
    if (action === "import") $("#importFile").click();
    if (action === "print") window.print();
  });
  $("#importFile").addEventListener("change", handleImport);
}

function showOnboarding() {
  openModal({
    title: "Inizio protocollo",
    body: `
      <p>Scegli il giorno 1. Calcolo settimane, allenamenti, checkpoint da qui.</p>
      <label class="field"><span>Data inizio</span><input id="startDateInput" type="text" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="AAAA-MM-GG" value="${state.today}"></label>
      <p style="margin-top:14px;font-size:12px;color:var(--text-mute)">Piano alimentare incluso è un template. Adatta in base a fame, recupero, sensazione. Long-press su un pasto per modificarlo.</p>
    `,
    actions: `<button class="button primary" type="button" id="saveStartDate">Inizia</button>`,
  });
  $("#saveStartDate").addEventListener("click", async () => {
    const value = $("#startDateInput").value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return toast("Formato data: AAAA-MM-GG.", "bad");
    await setSetting("startDate", value);
    state.startDate = value;
    state.activeDate = value > state.today ? value : state.today;
    state.selectedWeek = 1;
    closeModal();
    await renderToday();
  });
}

async function renderToday() {
  const host = $("#view-oggi");
  const existing = await getOne("days", state.activeDate);
  const record = existing ?? buildDefaultDayRecord(state.activeDate, state.startDate);
  const dayType = DAY_TYPES[record.dayType];
  const checklist = getChecklistItemsForDayType(record.dayType);
  const groups = groupChecklistItems(checklist);
  const milestone = MILESTONES[record.weekNumber];
  state.selectedWeek = clampProtocolWeek(record.weekNumber);
  state.lastPct = record.completedPct;

  document.documentElement.style.setProperty("--day-accent", dayType.accent);
  const next = nextTaskLabel(record, dayType);
  const overrides = await getAll("diet_overrides");

  host.innerHTML = `
    <div class="cockpit-hero">
      <div>
        <div class="head-eyebrow">${escapeHtml(formatHumanDate(record.date))}</div>
        <h1>Settimana ${record.weekNumber}/${PROTOCOL.totalWeeks}</h1>
        <div class="next-task">${next.time ? `<b>${escapeHtml(next.time)}</b>` : ""}<span>${escapeHtml(next.label)}</span></div>
        <div class="day-nav">
          <button type="button" data-day-shift="-1" aria-label="Giorno precedente">←</button>
          <button type="button" data-day-shift="1" aria-label="Giorno successivo">→</button>
          <button type="button" data-action="manifesto" aria-label="Manifesto" style="font-size:11px;padding:0 12px;width:auto">Manifesto</button>
        </div>
      </div>
      <div class="ring" id="ring">
        ${ringSvg(record.completedPct)}
        <div class="ring-label"><span class="num">${Math.round(record.completedPct * 100)}</span><small>%</small></div>
      </div>
    </div>

    ${renderWeekStrip(record)}

    ${milestone ? `<aside class="milestone">${escapeHtml(milestone.text)}</aside>` : ""}

    <div class="slide-header">
      <div class="slide-dots">
        ${SLIDES.map((_, i) => `<button class="slide-dot ${i === 0 ? "active" : ""}" data-slide-to="${i}" aria-label="Slide ${i+1}"></button>`).join("")}
      </div>
      <div class="slide-label" id="slideLabel">${escapeHtml(SLIDES[0].label)}</div>
    </div>

    <div class="daily-board" id="board">
      <section class="slide" data-slide-id="training">${renderTrainingSlide(record, dayType)}</section>
      <section class="slide" data-slide-id="supplements">${renderSupplementsSlide(record, groups.supplements)}</section>
      <section class="slide" data-slide-id="nutrition">${renderNutritionSlide(record, overrides)}</section>
      <section class="slide" data-slide-id="habits">${renderHabitsSlide(record, groups.habits)}</section>
    </div>

    <div class="panel-row">
      <button class="panel-button" type="button" data-action="panel-week">Settimana</button>
      <button class="panel-button" type="button" data-action="panel-report">Report</button>
    </div>
  `;

  bindTodayEvents(record, overrides);
}

function renderWeekStrip(record) {
  const dates = getWeekDates(state.startDate, clampProtocolWeek(record.weekNumber));
  return `
    <div class="week-strip" role="tablist" aria-label="Settimana">
      ${dates.map((date) => {
        const dayType = DAY_TYPES[getDayTypeForDate(date)];
        const isPastOrToday = date <= state.today;
        const isActive = date === record.date;
        const wkName = new Intl.DateTimeFormat("it-IT", { weekday: "short" }).format(parseDate(date));
        const wkDay = new Intl.DateTimeFormat("it-IT", { day: "2-digit" }).format(parseDate(date));
        const classes = ["week-cell", isPastOrToday ? "filled" : "", isActive ? "active" : ""].filter(Boolean).join(" ");
        return `
          <button class="${classes}" type="button" data-strip-date="${date}" style="--cell-accent:${dayType.accent}">
            <span class="wk-name">${escapeHtml(wkName.slice(0, 3))}</span>
            <span class="wk-day">${escapeHtml(wkDay)}</span>
            <span class="wk-dot"></span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderTrainingSlide(record, dayType) {
  return `
    <article class="card">
      <div class="card-eyebrow">${escapeHtml(dayType.label)}</div>
      <div class="card-title">
        <h3>${escapeHtml(dayType.training.title)}</h3>
        <span class="meta">${escapeHtml(dayType.training.time)}</span>
      </div>
      <label class="check-row primary">
        <input type="checkbox" data-item="training" ${record.items.training ? "checked" : ""}>
        <span>Allenamento completato</span>
      </label>
      <ol class="exercise-list">
        ${dayType.training.exercises.map((ex) => `<li>${escapeHtml(ex)}</li>`).join("")}
      </ol>
    </article>
  `;
}

function renderSupplementsSlide(record, items) {
  return `
    <article class="card">
      <div class="card-eyebrow">Cinque fasce orarie</div>
      <div class="card-title"><h3>Integratori</h3><span class="meta">${items.length} blocchi</span></div>
      <div class="tile-grid">
        ${items.map((item) => {
          const block = SUPPLEMENT_BLOCKS.find((b) => b.id === item.id);
          const checked = record.items[item.id] === true;
          return `
            <label class="supp-tile ${checked ? "checked" : ""}">
              <input type="checkbox" data-item="${item.id}" ${checked ? "checked" : ""}>
              <span class="time">${escapeHtml(block.time)}</span>
              <span class="label">${escapeHtml(block.label)}</span>
              <span class="items">${block.items.map((d) => `<em>${escapeHtml(d)}</em>`).join("")}</span>
            </label>
          `;
        }).join("")}
      </div>
    </article>
  `;
}

function renderNutritionSlide(record, overrides) {
  const weekday = parseDate(record.date).getUTCDay();
  const plan = DIET_PLAN[weekday] ?? DIET_PLAN[0];
  const meals = mergeDietForDate(record.date, plan.meals, overrides);
  return `
    <article class="card">
      <div class="card-eyebrow">${escapeHtml(plan.label)}</div>
      <div class="card-title"><h3>Alimentazione</h3><span class="meta">${meals.length} pasti</span></div>
      <div class="tile-grid">
        ${meals.map((meal) => {
          const checked = record.items[meal.id] === true;
          const classes = ["meal-tile", checked ? "checked" : "", meal.overridden ? "overridden" : ""].filter(Boolean).join(" ");
          return `
            <label class="${classes}" data-meal-id="${meal.id}">
              <input type="checkbox" data-item="${meal.id}" ${checked ? "checked" : ""}>
              <span class="time">${escapeHtml(meal.time)}</span>
              <span class="label">${escapeHtml(meal.label)}</span>
              <span class="items">${meal.items.map((i) => `<em>${escapeHtml(i)}</em>`).join("")}</span>
            </label>
          `;
        }).join("")}
      </div>
      <p style="margin: 10px 4px 0; font-size: 11px; color: var(--text-mute);">Tieni premuto un pasto per modificarlo.</p>
    </article>
  `;
}

function renderHabitsSlide(record, items) {
  const sleep = items.find((i) => i.id === "sleep");
  const others = items.filter((i) => i.id !== "sleep");
  return `
    <article class="card">
      <div class="card-eyebrow">Base giornaliera</div>
      <div class="card-title"><h3>Abitudini</h3><span class="meta">${items.length}</span></div>
      <div class="habit-grid">
        <div class="habit-num full">
          <small>${escapeHtml(sleep.label)}</small>
          <input type="number" inputmode="decimal" data-item="sleep" value="${escapeHtml(record.items.sleep ?? "")}" placeholder="0">
        </div>
        ${others.map((item) => `
          <label class="check-row full">
            <input type="checkbox" data-item="${item.id}" ${record.items[item.id] ? "checked" : ""}>
            <span>${escapeHtml(item.label)}</span>
          </label>
        `).join("")}
      </div>
    </article>
  `;
}

function bindTodayEvents(record, overrides) {
  const host = $("#view-oggi");
  const board = $("#board", host);
  const slideLabel = $("#slideLabel", host);
  const ringEl = $("#ring", host);

  host.querySelectorAll("[data-day-shift]").forEach((b) => {
    b.addEventListener("click", async () => {
      state.activeDate = addDays(state.activeDate, Number(b.dataset.dayShift));
      await renderToday();
    });
  });
  host.querySelectorAll("[data-strip-date]").forEach((b) => {
    b.addEventListener("click", async () => {
      state.activeDate = b.dataset.stripDate;
      await renderToday();
    });
  });
  host.querySelectorAll("[data-slide-to]").forEach((b) => {
    b.addEventListener("click", () => {
      const i = Number(b.dataset.slideTo);
      slideTo(board, i);
    });
  });

  const slides = host.querySelectorAll(".slide");
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        const i = Array.from(slides).indexOf(entry.target);
        setActiveSlide(i, slideLabel, host);
      }
    }
  }, { root: board, threshold: 0.5 });
  slides.forEach((s) => observer.observe(s));

  host.querySelectorAll(".meal-tile").forEach((tile) => {
    const mealId = tile.dataset.mealId;
    longPress(tile, async () => {
      const weekday = parseDate(record.date).getUTCDay();
      const plan = DIET_PLAN[weekday] ?? DIET_PLAN[0];
      const meals = mergeDietForDate(record.date, plan.meals, overrides);
      const meal = meals.find((m) => m.id === mealId);
      if (!meal) return;
      await openMealEditor({ date: record.date, meal, onSaved: () => renderToday() });
    });
  });

  host.addEventListener("change", (event) => {
    if (event.target.matches("[data-item]")) updateFromDom(host, record, ringEl);
  });
  host.addEventListener("input", (event) => {
    if (event.target.matches("input[type='number'][data-item]")) updateFromDom(host, record, ringEl);
  });
}

function setActiveSlide(i, labelEl, host) {
  if (state.activeSlide === i) return;
  state.activeSlide = i;
  host.querySelectorAll(".slide-dot").forEach((d, idx) => d.classList.toggle("active", idx === i));
  labelEl.classList.add("fading");
  setTimeout(() => {
    labelEl.textContent = SLIDES[i].label;
    labelEl.classList.remove("fading");
  }, 150);
}

function slideTo(board, i) {
  const width = board.clientWidth;
  board.scrollTo({ left: i * width, behavior: "smooth" });
}

function updateFromDom(host, record, ringEl) {
  const next = structuredClone(record);
  host.querySelectorAll("[data-item]").forEach((input) => {
    next.items[input.dataset.item] = input.type === "checkbox" ? input.checked : input.value;
  });
  const normalized = normalizeDayRecord(next, state.startDate);
  record.items = normalized.items;
  record.completedPct = normalized.completedPct;
  updateRing(ringEl, normalized.completedPct);

  host.querySelectorAll("[data-item]").forEach((input) => {
    if (input.type !== "checkbox") return;
    const tile = input.closest(".supp-tile, .meal-tile, .check-row");
    if (tile) tile.classList.toggle("checked", input.checked);
  });

  if (state.lastPct < 1 && normalized.completedPct === 1) haptic("complete-day");
  else haptic("tick");
  state.lastPct = normalized.completedPct;

  saveTodayDebounced(normalized);
}

async function saveDay(record) {
  try {
    await putOne("days", record);
  } catch (error) {
    toast(error.message, "bad");
  }
}

async function showWeekPanel() {
  openModal({
    title: `Settimana ${state.selectedWeek}`,
    body: `<div id="weekPanel"></div>`,
    actions: `
      <button class="button ghost" type="button" data-week-nav="-1">←</button>
      <button class="button ghost" type="button" data-week-nav="1">→</button>
      <button class="button primary" type="button" data-close-modal>Chiudi</button>
    `,
  });
  await renderWeekPanel();
  document.querySelectorAll("[data-week-nav]").forEach((b) => {
    b.addEventListener("click", async () => {
      state.selectedWeek = clampProtocolWeek(state.selectedWeek + Number(b.dataset.weekNav));
      $(".modal-title").textContent = `Settimana ${state.selectedWeek}`;
      await renderWeekPanel();
    });
  });
}

async function renderWeekPanel() {
  const host = $("#weekPanel");
  const dates = getWeekDates(state.startDate, state.selectedWeek);
  const days = await getAll("days");
  const records = dates.map((date) => days.find((d) => d.date === date) ?? buildDefaultDayRecord(date, state.startDate));
  host.innerHTML = `
    ${MILESTONES[state.selectedWeek] ? `<aside class="milestone" style="margin-bottom:10px">${escapeHtml(MILESTONES[state.selectedWeek].text)}</aside>` : ""}
    <div class="week-grid">
      ${records.map((r) => {
        const pct = Math.round(r.completedPct * 100);
        const tone = pct >= 80 ? "good" : pct >= 50 ? "warn" : "bad";
        const lbl = formatHumanDate(r.date).split(" ")[0];
        return `
          <button class="day-tile ${tone}" type="button" data-date="${r.date}">
            <span class="lbl">${escapeHtml(lbl)} · ${escapeHtml(r.date.slice(8))}</span>
            <span class="pct">${pct}%</span>
            <span class="sub">${escapeHtml(DAY_TYPES[r.dayType].label)}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
  host.querySelectorAll("[data-date]").forEach((b) => {
    b.addEventListener("click", async () => {
      state.activeDate = b.dataset.date;
      closeModal();
      await renderToday();
    });
  });
}

async function showReportPanel() {
  const dates = getWeekDates(state.startDate, state.selectedWeek);
  const [days, week, previousWeek] = await Promise.all([
    getAll("days"),
    getOne("weeks", state.selectedWeek),
    getOne("weeks", state.selectedWeek - 1),
  ]);
  const dayRecords = dates.map((date) => days.find((d) => d.date === date) ?? buildDefaultDayRecord(date, state.startDate));
  const report = buildWeeklyReport({
    weekNumber: state.selectedWeek,
    days: dayRecords,
    week: week ?? {},
    previousWeek: previousWeek ?? {},
    labsInWeek: [],
  });
  openModal({
    title: `Report settimana ${state.selectedWeek}`,
    body: `<pre class="report-pre">${escapeHtml(report.text)}</pre>`,
    actions: `
      <button class="button ghost" type="button" data-action="export">Backup JSON</button>
      <button class="button ghost" type="button" data-action="import">Ripristina</button>
      <button class="button ghost" type="button" data-action="print">Stampa</button>
      <button class="button primary" type="button" data-close-modal>Chiudi</button>
    `,
  });
}

function showManifesto() {
  openModal({
    title: "Quando voglio mollare",
    body: `<div class="manifesto-text">${escapeHtml(MANIFESTO).replaceAll("\n", "<br>")}</div>`,
    actions: `<button class="button primary" type="button" data-close-modal>Continuo</button>`,
  });
}

async function exportBackup() {
  const snapshot = await exportAll();
  downloadSnapshot(snapshot, state.today);
  toast("Backup JSON creato.");
}

async function handleImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  const confirmed = await confirmDialog("Ripristina backup", "Sostituisco tutti i dati locali con il file JSON?", "Ripristina");
  if (!confirmed) return;
  try {
    const payload = JSON.parse(await file.text());
    await importAll(payload, { replace: true });
    toast("Backup ripristinato.");
    await renderToday();
  } catch (error) {
    toast(error.message, "bad");
  } finally {
    event.target.value = "";
  }
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}
```

- [ ] **Step 2: Syntax check**

Run: `node --check js/app.js`
Expected: silent success.

- [ ] **Step 3: Existing tests still green**

Run: `node --test tests/*.test.js`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat(app): cockpit refactor — ring, week-strip v2, slide dots, long-press, haptic"
```

---

## Task 9: Service worker — drop dead files, bump cache

**Files:**
- Modify: `sw.js`

- [ ] **Step 1: Replace `sw.js` content**

Overwrite `sw.js`:

```js
const CACHE = "protocol-v11";
const LOCAL_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/app.js",
  "./js/db.js",
  "./js/protocol.js",
  "./js/checklist.js",
  "./js/diet.js",
  "./js/meal-editor.js",
  "./js/report.js",
  "./js/ui.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-512-maskable.png",
];
const OPTIONAL_ASSETS = [
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      await cache.addAll(LOCAL_SHELL);
      await Promise.allSettled(OPTIONAL_ASSETS.map((asset) => cache.add(asset)));
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      });
    }),
  );
});
```

- [ ] **Step 2: Syntax check**

Run: `node --check sw.js`
Expected: silent success.

- [ ] **Step 3: Commit**

```bash
git add sw.js
git commit -m "feat(sw): bump cache, drop charts/metrics, add diet.js + meal-editor.js"
```

---

## Task 10: Delete dead files, final verification

**Files:**
- Delete: `js/charts.js`
- Delete: `js/metrics.js`

- [ ] **Step 1: Delete dead modules**

Run:

```bash
git rm js/charts.js js/metrics.js
```

If the files were never committed, run `rm js/charts.js js/metrics.js` instead.

- [ ] **Step 2: Run full test suite**

Run: `node --test tests/*.test.js`
Expected: all tests pass (checklist, db-helpers, diet-overrides).

- [ ] **Step 3: Syntax check every JS module**

Run:

```bash
for f in js/*.js sw.js; do node --check "$f" || echo "FAIL: $f"; done
```

Expected: no FAIL lines.

- [ ] **Step 4: Smoke test in browser**

Run:

```bash
python3 -m http.server 5174 --bind 127.0.0.1
```

Open http://127.0.0.1:5174 in Safari/Chrome with mobile emulation (iPhone 13, 390×844). Verify:
- Page does not scroll vertically (`document.documentElement.scrollHeight === window.innerHeight` in console)
- Week-strip shows 7 cells with accent dots per day type
- Ring shows percentage matching current day completion
- Swipe between 4 slides works; dots track active slide; label cross-fades
- Long-press on a meal opens editor with current items
- Saving edited items shows the overridden indicator dot on the meal tile
- Reset removes the override and reverts items
- Tapping a check on iPhone fires `navigator.vibrate(10)` (no error in console)
- Console: zero errors

- [ ] **Step 5: Commit final state**

```bash
git add -A
git commit -m "chore: remove charts.js + metrics.js, finalize Editorial Dark refactor"
```

---

## Self-review checklist (already applied)

- Spec coverage: every section of `docs/superpowers/specs/2026-05-17-cockpit-redesign.md` maps to a task (visual system §3 → Task 5; layout §4 → Tasks 5+8; interactions §5 → Tasks 6+7+8; data model §6 → Task 1; DIET_PLAN §7 → Task 3; views §8 → Tasks 4+8+10; file structure §9 → entire plan; testing §10 → Tasks 1+2+10).
- No placeholders: every code block is complete, no "TBD" or "similar to above".
- Type consistency: `mergeDietForDate(date, defaultMeals, overrides)` signature used identically in Task 2 (definition), Task 7 (consumer in `meal-editor.js` via `buildOverrideId`), Task 8 (consumer in `app.js`). `buildOverrideId(date, mealId)` used in both `meal-editor.js` and `diet.js`. Store name `diet_overrides` consistent everywhere. `DB_VERSION = 2`, `BACKUP_VERSION = 2`, `MIRROR_KEY = "protocol_backup_v2"` consistent.
