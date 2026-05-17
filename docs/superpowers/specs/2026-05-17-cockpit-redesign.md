# Spec — Cockpit Redesign Editorial Dark

**Data:** 2026-05-17
**Progetto:** Protocollo 12 Settimane (PWA statica iPhone)
**Tipo:** Refactor grafico + UX + nuovi flussi
**Stato:** Approvato, pronto per piano implementazione

---

## 1. Obiettivo

Rifare l'esperienza grafica e interattiva del cockpit giornaliero della PWA in stile **Editorial Dark**, mantenendo zero build step, path relativi, viewport non scrollabile globalmente, e contratto dati invariato. Aggiungere flussi richiesti: swipe gesture, haptic feedback, edit dieta inline, hero giorno con summary. Compilare DIET_PLAN con piano sensato per protocollo TRT-recovery. Rimuovere viste inutilizzate (Valori, Grafici).

## 2. Vincoli non negoziabili

- Nessun build step, nessun bundler, nessun framework JS.
- Tutti i path locali restano relativi (`./`) per compatibilita' GitHub Pages.
- Niente backend, account, analytics, cloud.
- Pagina principale non scrolla globalmente: `html`/`body` `overflow: hidden`.
- Slide del cockpit restano `100%` larghezza viewport, una alla volta.
- Input `font-size` minimo 16px (no zoom iOS).
- Viewport meta: `maximum-scale=1, user-scalable=no` invariato.
- IndexedDB resta unica fonte verita', mirror localStorage compatto invariato.
- Esistenti test `node --test tests/*.test.js` devono passare dopo refactor.

## 3. Visual system

### 3.1 Palette (solo dark)

| Token | Valore | Uso |
|-------|--------|-----|
| `--ink` | `#08090d` | Background app |
| `--surface` | `#0f1218` | Cards |
| `--surface-2` | `#1a1e27` | Cards interne, meal/supp tiles |
| `--border` | `#262b36` | Bordi |
| `--text` | `#f5f6f8` | Testo primario |
| `--text-dim` | `#9aa3b2` | Testo secondario |
| `--text-mute` | `#5b6373` | Testo terziario, placeholder |
| `--accent-strength` | `#7c3aed` | Push/Pull/Legs |
| `--accent-combat` | `#f97316` | Muay Thai |
| `--accent-rest` | `#10b981` | Riposo attivo |
| `--good` | `#22c55e` | Stati positivi |
| `--warn` | `#f59e0b` | Avvisi |
| `--bad` | `#ef4444` | Errori, danger |

`--day-accent` resta variabile dinamica scritta da JS in base a `dayType`. Effetto radial wash: `radial-gradient(ellipse at top, color-mix(in srgb, var(--day-accent) 8%, transparent), transparent 60%)` su `body::before`.

Toggle theme rimosso. `setSetting("theme", ...)` non piu' invocato. `setTheme()` resta come no-op per compat (puo' essere rimosso). Schema `prefers-color-scheme: light` ignorato.

### 3.2 Tipografia

- Font display+body: **Outfit** 300/400/500/600/700/800/900 via Google Fonts CDN
- Font mono: **JetBrains Mono** 500/700 per orari, percentuali, badge tabular
- Scale:
  - H1 settimana: `clamp(22px, 6vw, 32px)`, weight 800, letter-spacing `-0.02em`
  - H2 modal: 20px weight 700
  - H3 card title: 15px weight 700
  - Eyebrow: 10px weight 700 uppercase letter-spacing `0.14em`
  - Body: 14-15px weight 500
  - Numeric badge: 18px JetBrains Mono 700 tabular
  - Small/caption: 11-12px weight 600

### 3.3 Spacing e radius

Scale: 4 / 8 / 12 / 16 / 20 / 24 / 32 px.
Radius: 10 (input), 12 (default), 16 (cards), 18 (modal), 999 (pill).
Shadow: `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.4)` per cards.

## 4. Layout cockpit "Oggi"

### 4.1 Struttura

```
.app-shell (100svh, overflow hidden, padding safe-area)
 └─ #view-oggi (grid-rows: auto auto auto auto 1fr auto)
    ├─ .cockpit-hero          (eyebrow + H1 + ring SVG progress)
    ├─ .week-strip-v2          (7 celle redesigned)
    ├─ .slide-header           (4 dots + label slide attiva + frecce opzionali)
    ├─ .milestone (opzionale, condizionata da MILESTONES[weekNumber])
    ├─ .daily-board            (scroll-snap-x, 4 slide 100% width)
    └─ .panel-row              (Settimana + Report)
```

Niente day-switcher con input date inline: navigazione data via swipe sulla week-strip (tap su cella) + bottoni `←/→` nel cockpit-hero sotto il ring. Input date HTML rimosso (zoom iOS, layout instabile).

### 4.2 Cockpit hero

```
EYEBROW   lun 17 mag 2026                ←  →
Settimana 5 / 12                       ╭───────╮
Prossimo · 18:30 Forza Push            │ ring  │
                                        │ 72%   │
                                        ╰───────╯
```

- Eyebrow line formatta data ITA (`formatHumanDate`)
- H1 mostra `Settimana N/12`
- Sub-line `next-task`: testo derivato — se ora < ora training, mostra "Prossimo · HH:MM TipoAllenamento"; se tutti i task del giorno completati, mostra "Giorno chiuso · streak N"; altrimenti "Tipo allenamento · HH:MM"
- Ring SVG 72×72px, stroke 6px:
  - Track: `var(--surface-2)`
  - Progress: `var(--day-accent)` con `stroke-dasharray` calcolato
  - Centro: percentuale 18px JetBrains Mono 700
  - Transition stroke-dashoffset 400ms cubic-bezier(0.4, 0, 0.2, 1)

### 4.3 Week-strip v2

```
┌──────────────────────────────────────────┐
│  L    M    M    G    V    S    D         │
│  17   18   19   20   21   22   23        │
│  ●    ●    ●    ◉    ○    ○    ○         │
└──────────────────────────────────────────┘
       push  MT   pull rest legs MT  rest
```

- Riga 1: weekday short 11px uppercase
- Riga 2: giorno mese 16px weight 800 mono
- Riga 3: pallino 6px, colore `var(--day-accent)` del tipo allenamento di quel giorno; pieno se data ≤ today, vuoto altrimenti; cerchio doppio se attivo
- Tap su cella: cambia `state.activeDate`, rirender
- Snap su pagina, non scrollabile lateralmente

### 4.4 Slide header

```
●  ○  ○  ○            Allenamento
```

- 4 dots cliccabili (3px gap, 6px diametro, attivo 10px allungato pill)
- Label slide attiva 13px weight 700 lato destro, cross-fade 150ms al cambio
- Frecce opzionali ai lati (nascoste su iPhone, visibili su desktop tramite `@media (min-width: 720px)`)

### 4.5 Daily board (4 slide)

`display: flex; overflow-x: auto; scroll-snap-type: x mandatory;`. Ogni slide `flex: 0 0 100%`.

**Slide 1 — Allenamento**
- Hero con `dayType.label` 11px eyebrow + `training.title` 18px weight 800 + `training.time` mono
- Primary check XL: `<label>` 56px alto con accent border-left 4px, icona ✓ animata su check
- Lista esercizi: `<ol>` con counter custom (numerali mono in cerchio accent), gap 10px, ogni li 14px

**Slide 2 — Integratori**
- Timeline verticale ore: ogni slot e' una riga con orario mono a sinistra (52px), tile a destra
- Tile checkbox + label + chips items (items come `<em>` pill)
- Checked state: `border-color: var(--day-accent)`, background `color-mix(in srgb, var(--day-accent) 12%, var(--surface))`, ✓ icona

**Slide 3 — Alimentazione**
- 3 meal card verticali, ognuna ~30% altezza
- Layout: orario mono | label | items list a chips
- Tap checkbox: check
- **Long-press 500ms** su area meal (non checkbox): apre `meal-editor` modal — vedi 5.4
- Indicatore "modificato" se override presente: pallino mono accent a destra

**Slide 4 — Abitudini**
- Grid 2 colonne tile XL: Sonno (input number ore) + Idratazione check primary
- Sotto: tile minori per altri habit items (1 colonna)

### 4.6 Panel row

Sostituisce attuale `.quick-panel-row`. Due bottoni inline:
```
[ Settimana ]   [ Report ]
```
Stesso stile pill outline, accent border `var(--day-accent)`. Bottone manifesto rimosso (non era piu' wired comunque).

## 5. Interazioni

### 5.1 Haptic feedback

Funzione `haptic(pattern)`:
- `tick` = `navigator.vibrate(10)` su ogni check toggle
- `complete-day` = `navigator.vibrate([20, 40, 20])` su `completedPct === 1`
- `complete-week` = `navigator.vibrate([30, 80, 30, 80, 50])` su `weekRecord.completedPct === 1`
- Guard: `if (!navigator.vibrate) return;`

### 5.2 Tap feedback

CSS class `.tappable`:
```css
.tappable { transition: transform 80ms ease; }
.tappable:active { transform: scale(0.96); }
```
Applicata a `.check-row`, `.supplement-tile`, `.meal-tile`, `.week-strip-cell`, `.slide-dot`, `.button`.

### 5.3 Slide change

- Dot click: `slideTo(index)` chiama `daily-board.scrollTo({ left: index * boardWidth, behavior: 'smooth' })`
- Label cross-fade: `keyframes 150ms opacity 1→0 + 0→1` con `requestAnimationFrame`
- IntersectionObserver su slide elements traccia indice attivo, aggiorna dots + label

### 5.4 Edit dieta inline (long-press)

- Pressione lunga 500ms su `.meal-tile` (escluso input checkbox) apre `<dialog>` modale `meal-editor`
- Modal mostra: data + label pasto + textarea (1 item per riga) + bottoni `Salva`, `Reset (usa default)`, `Annulla`
- Salva: chiama `putOne("diet_overrides", { id: "${date}_${mealId}", date, mealId, items, updatedAt })`
- Reset: `deleteOne("diet_overrides", "${date}_${mealId}")`
- Dopo salva/reset: `closeModal()` + rerender slide alimentazione
- Touch handling: `touchstart` parte timeout 500ms, `touchend`/`touchmove`/`pointercancel` lo cancella; in pointer events anche `pointerdown`/`pointerup`

## 6. Data model

### 6.1 IndexedDB schema v2

Bump `DB_VERSION` 1 → 2. In `onupgradeneeded`:
- Crea store `diet_overrides` con `keyPath: "id"`, index `by-date` su `date`
- Drop store `labs` se esiste (silenzioso, dato non critico)
- Mantieni stores: `days`, `weeks`, `settings`, `meta`

### 6.2 Override dieta

`getDietForDate(date)` in `protocol.js` diventa async/sync wrapper:
- Funzione pura `mergeDiet(defaultMeals, overrides)`: per ogni meal, se override per `{date, mealId}` esiste, usa items override, altrimenti default
- `app.js` carica overrides da DB prima del render slide alimentazione e passa a merge
- Funzione pura testabile in `tests/diet-overrides.test.js`

### 6.3 Migration

Test su startup: leggi `DB_VERSION` da `meta`, se < 2 esegui migration. Mirror localStorage scarta chiave `labs` se presente.

## 7. DIET_PLAN compilato

Piano template per protocollo TRT-recovery (target ~150-180g proteine, micronutrienti, ritmo allenamento). Non e' un piano medico — disclaimer in onboarding. Tutti gli items resterebbero modificabili via long-press.

| Giorno | DayType | Colazione 08:00 | Pranzo 13:00 | Cena 20:00 |
|--------|---------|-----------------|--------------|------------|
| Lun | Push | Avena 80g + 4 albumi + 1 uovo + frutti rossi 100g | Pollo 200g + riso basmati 100g + verdure miste + olio EVO | Salmone 180g + patate dolci 200g + insalata |
| Mar | Muay Thai | Pane integrale 80g + ricotta 150g + miele + frutta | Pasta integrale 100g + tonno 150g + pomodorini | Cena post-MT: pollo 180g + quinoa 80g + verdure cotte. Spuntino 16:30: banana + mandorle 30g |
| Mer | Pull | Avena 80g + whey 30g + banana + burro arachidi 15g | Manzo magro 200g + riso 100g + spinaci + olio | Merluzzo 200g + patate 200g + broccoli |
| Gio | Riposo | Yogurt greco 250g + granola 50g + frutta + noci 20g | Insalata mista + uova sode 3 + pane integrale 60g | Zuppa legumi 300g + pane 60g + formaggio fresco 60g |
| Ven | Legs | Pancake avena (80g avena + 3 albumi + 1 uovo) + frutti rossi | Pollo 200g + patate 250g + verdure grigliate | Tacchino 200g + riso 100g + zucchine |
| Sab | Muay Thai | Toast integrale + 2 uova + avocado + frutta | Pasta 100g + ragu' magro + parmigiano | Pesce azzurro 200g + verdure + olio EVO. Spuntino 16:30 |
| Dom | Riposo | Brunch libero: uova benedict / pancake / scelta | Pasto libero con focus omega-3 (salmone/sgombro) o legumi | Cena leggera: insalatona ricca proteica |

Disclaimer onboarding: "Piano alimentare e' un template. Adatta in base a sensazione, fame, recupero. Long-press su un pasto per modificarlo."

## 8. View secondarie

### 8.1 Drop completo

Rimuovo:
- `js/charts.js`, `js/metrics.js`
- `renderLabs`, `renderChartsView`, `showLabForm`, `saveLab` in `app.js`
- `LAB_FIELDS` in `protocol.js`
- Store `labs` in `db.js`
- `<section id="view-valori">`, `<section id="view-grafici">`, `<section id="view-report">` in HTML (Report resta solo come modal)
- `<script>` Chart.js CDN in `index.html`
- Skill MILESTONES `labsToBook` arrays (campo morto)

### 8.2 Settimana modal

Mantengo `renderWeek` ma:
- Stile coerente Editorial Dark
- Day-tile: 80px altezza, % grande mono al centro, etichetta giorno sopra, dayType sotto, accent border color del dayType
- Click su day-tile chiude modal + naviga al giorno

### 8.3 Report modal

Mantengo `renderReport` + `buildWeeklyReport`:
- Modal con `<pre>` formattato e bottoni Export JSON / Import / Stampa
- Stile pre-tipografia ridisegnato (font Outfit, line-height 1.55)
- Drop ricerca week da hash, sempre `state.selectedWeek`

## 9. File structure post-refactor

```
index.html              modificato: rimuovo Chart.js CDN, aggiungo Outfit+JetBrains Mono
css/style.css           rewrite completo, mobile-first dark
js/app.js               refactor: rimuovo lab/charts, aggiungo swipe-dots, ring, edit-meal, long-press
js/protocol.js          DIET_PLAN compilato, rimuovo LAB_FIELDS, rimuovo labsToBook in MILESTONES
js/checklist.js         invariato
js/db.js                aggiungo store diet_overrides, migration v2, drop labs
js/ui.js                aggiungo helper hapticTick / longPress
js/report.js            invariato
js/meal-editor.js       NUOVO ~80 righe, modal long-press
sw.js                   aggiorno cache list (rimuovo charts.js/metrics.js, aggiungo meal-editor.js)
manifest.webmanifest    invariato
tests/checklist.test.js aggiorno se necessario per nuovo schema
tests/db-helpers.test.js aggiorno per nuovo schema
tests/diet-overrides.test.js NUOVO
```

Files rimossi: `js/charts.js`, `js/metrics.js`.

## 10. Testing strategy

### 10.1 Test esistenti

- `tests/checklist.test.js`: verificare ancora valido (logica checklist invariata). Sistemare se rompe.
- `tests/db-helpers.test.js`: aggiornare se nomi stores cambiano. Add migration test (apertura DB v1 → v2 senza errori).

### 10.2 Test nuovi

- `tests/diet-overrides.test.js`:
  - `mergeDiet(default, [])` ritorna default
  - `mergeDiet(default, [override])` sostituisce items per giusto mealId
  - Override per `date` diverso ignorato
  - Multipli override per stesso date+meal: ultimo vince (Map dedupe by id)

### 10.3 Smoke manuale

- `python3 -m http.server 5174 --bind 127.0.0.1` poi browser desktop check layout 366px
- iPhone fisico su `http://<lan-ip>:5183`: verifica touch, scroll-snap, long-press, haptic
- Check `console.error` zero
- Check `document.documentElement.scrollHeight === innerHeight` (pagina non scrolla)
- Standalone PWA: `Add to Home Screen` → apertura senza chrome browser

## 11. Cosa NON cambia

- `js/checklist.js`: API e logica intatte
- `js/ui.js`: `openModal`, `closeModal`, `confirmDialog`, `toast`, `formatHumanDate`, `pctLabel`, `escapeHtml`, `field` invariati (aggiunge solo `longPress` helper)
- `js/report.js`: API `buildWeeklyReport` invariata
- `js/db.js` API pubblica: `getOne`, `getAll`, `putOne`, `deleteOne`, `getSetting`, `setSetting`, `exportAll`, `importAll`, `downloadSnapshot`, `maybeRestoreMirror` invariati. Cambia solo `DB_VERSION` e `onupgradeneeded`.
- `sw.js`: pattern cache invariato, solo lista file aggiornata
- Contratto `days` record: invariato (struttura `items`, `note`, `completedPct`, `weekNumber`, `dayType`)

## 12. Ordine di esecuzione consigliato

1. `js/db.js`: aggiungo store `diet_overrides`, bump version, migration
2. `js/protocol.js`: compilo DIET_PLAN, drop LAB_FIELDS+labsToBook
3. `tests/diet-overrides.test.js`: test merge funzione pura
4. `index.html`: font CDN + drop Chart.js
5. `css/style.css`: rewrite completo
6. `js/meal-editor.js`: modal long-press
7. `js/app.js`: refactor render — cockpit-hero+ring, week-strip-v2, slide-header dots, daily-board, drop lab/charts
8. `sw.js`: aggiorno cache list
9. Test: `node --test tests/*.test.js` + `node --check js/app.js`
10. Smoke browser

## 13. Rischi e mitigazioni

| Rischio | Mitigazione |
|---------|-------------|
| Outfit CDN bloccato offline alla prima apertura | Fallback `system-ui` nella font-family, app usabile |
| `navigator.vibrate` ignorato su iOS Safari | Guard, nessun crash; usare anche pattern visivo (scale tap) |
| Long-press conflitta con scroll-snap orizzontale | `touchmove` cancella timeout, threshold 8px movimento |
| Migration DB v1→v2 fallisce | `try/catch` su `onupgradeneeded`; in caso ko, rebuild DB da mirror localStorage |
| Ring stroke-dashoffset CSS bug su Safari vecchio | Test su iOS attuale; fallback width-bar nel caso |
| Slide IntersectionObserver non aggiorna dots correttamente | Threshold 0.5, rootMargin `-10% 0px` per stabilita' |

## 14. Definizione di "fatto"

- Tutti i test passano: `node --test tests/*.test.js`
- `node --check js/app.js && node --check sw.js && node --check js/meal-editor.js`
- Smoke iPhone: 4 slide swippabili, dots aggiornano, long-press apre editor, salva/reset funzionano, haptic vibra, week-strip cambia data on tap, ring si anima, scroll globale assente
- Spec coerente con codice (nessuna sezione obsoleta)
