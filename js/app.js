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
import { openMealPicker } from "./meal-picker.js";
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
      <p style="margin: 10px 4px 0; font-size: 11px; color: var(--text-mute);">Tieni premuto un pasto per vedere le varianti equivalenti.</p>
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
      await openMealPicker({ date: record.date, meal, onSaved: () => renderToday() });
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
