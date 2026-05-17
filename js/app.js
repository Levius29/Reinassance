import {
  DAY_TYPES,
  LAB_FIELDS,
  MANIFESTO,
  MILESTONES,
  PROTOCOL,
  SUPPLEMENT_BLOCKS,
  addDays,
  clampProtocolWeek,
  getDayTypeForDate,
  getDietForDate,
  getInitialActiveDate,
  getProtocolWeek,
  getWeekDates,
  todayString,
} from "./protocol.js";
import {
  buildDefaultDayRecord,
  calculateCompletedPct,
  getChecklistItemsForDayType,
  groupChecklistItems,
  normalizeDayRecord,
} from "./checklist.js";
import {
  deleteOne,
  downloadSnapshot,
  exportAll,
  getAll,
  getOne,
  getSetting,
  importAll,
  maybeRestoreMirror,
  putOne,
  setSetting,
} from "./db.js";
import { metricOptions, summarizeWeek } from "./metrics.js";
import { buildWeeklyReport } from "./report.js";
import { renderChart } from "./charts.js";
import {
  $,
  $$,
  closeModal,
  confirmDialog,
  debounce,
  escapeHtml,
  field,
  formatHumanDate,
  numberInput,
  openModal,
  pctLabel,
  setTheme,
  textareaInput,
  textInput,
  toast,
} from "./ui.js";

const state = {
  startDate: null,
  route: "oggi",
  today: todayString(),
  activeDate: todayString(),
  selectedWeek: 1,
  selectedMetric: "weight",
  theme: "auto",
};

const saveTodayDebounced = debounce((record) => saveDay(record), 500);
const saveWeekDebounced = debounce((record) => saveWeek(record), 500);

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindGlobalEvents();
  await registerServiceWorker();
  try {
    await maybeRestoreMirror(async () => confirmDialog("Backup locale trovato", "IndexedDB è vuoto ma esiste un mirror locale. Ripristino dati?", "Ripristina"));
  } catch (error) {
    toast(error.message, "bad");
  }
  state.theme = await getSetting("theme", "auto");
  setTheme(state.theme);
  state.startDate = await getSetting("startDate", null);
  if (!state.startDate) {
    showOnboarding();
    return;
  }
  state.activeDate = getInitialActiveDate(state.today, state.startDate);
  state.selectedWeek = clampProtocolWeek(getProtocolWeek(state.today, state.startDate));
  routeFromHash();
  await render();
}

function bindGlobalEvents() {
  window.addEventListener("hashchange", async () => {
    routeFromHash();
    await render();
  });
  document.addEventListener("click", async (event) => {
    const close = event.target.closest("[data-close-modal]");
    if (close) closeModal();

    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!action) return;
    if (action === "theme") await cycleTheme();
    if (action === "backup") await exportBackup();
    if (action === "manifesto") showManifesto();
    if (action === "panel") await showPanel(event.target.closest("[data-panel]")?.dataset.panel);
    if (action === "new-lab") showLabForm();
    if (action === "print") window.print();
    if (action === "import") $("#importFile").click();
    if (action === "export") await exportBackup();
  });
  $("#importFile").addEventListener("change", handleImport);
}

function routeFromHash() {
  state.route = "oggi";
  $$(".view").forEach((view) => (view.hidden = view.id !== `view-${state.route}`));
}

async function render() {
  if (!state.startDate) return;
  if (state.route === "oggi") await renderToday();
  if (state.route === "settimana") await renderWeek();
  if (state.route === "valori") await renderLabs();
  if (state.route === "grafici") await renderChartsView();
  if (state.route === "report") await renderReport();
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function showOnboarding() {
  openModal({
    title: "Inizio protocollo",
    body: `
      <p>Scegli il giorno 1. Da qui calcolo settimane, allenamenti e checkpoint.</p>
      <label class="field onboarding-field"><span>Data inizio</span><input id="startDateInput" class="onboarding-date" type="text" inputmode="numeric" autocomplete="off" maxlength="10" placeholder="AAAA-MM-GG" value="${state.today}"></label>
    `,
    actions: `<button class="button primary" type="button" id="saveStartDate">Inizia</button>`,
  });
  $("#saveStartDate").addEventListener("click", async () => {
    const value = $("#startDateInput").value;
    if (!value) return toast("Inserisci data inizio.", "bad");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return toast("Formato data: AAAA-MM-GG.", "bad");
    await setSetting("startDate", value);
    state.startDate = value;
    state.activeDate = value > state.today ? value : state.today;
    state.selectedWeek = 1;
    closeModal();
    await render();
  });
}

async function cycleTheme() {
  const next = state.theme === "auto" ? "dark" : state.theme === "dark" ? "light" : "auto";
  state.theme = next;
  setTheme(next);
  await setSetting("theme", next);
  toast(`Tema: ${next}`);
}

async function renderToday() {
  const host = $("#view-oggi");
  const existing = await getOne("days", state.activeDate);
  const record = existing ?? buildDefaultDayRecord(state.activeDate, state.startDate);
  const dayType = DAY_TYPES[record.dayType];
  const checklist = getChecklistItemsForDayType(record.dayType);
  const groups = groupChecklistItems(checklist);
  const milestone = MILESTONES[record.weekNumber];
  const streak = await calculateStreak();
  state.selectedWeek = clampProtocolWeek(record.weekNumber);
  host.style.setProperty("--day-accent", dayType.accent);
  host.innerHTML = `
    <div class="today-head cockpit-head">
      <div>
        <p class="eyebrow">${escapeHtml(formatHumanDate(record.date))}</p>
        <h2>Settimana ${record.weekNumber}/${PROTOCOL.totalWeeks}</h2>
      </div>
      <div class="progress-badge"><strong>${pctLabel(record.completedPct)}</strong><span>streak ${streak}</span></div>
    </div>
    <div class="progress-track"><span style="width:${Math.round(record.completedPct * 100)}%"></span></div>
    <div class="day-switcher">
      <button class="button ghost" type="button" data-day-shift="-1">←</button>
      <input type="date" value="${record.date}" data-active-date>
      <button class="button ghost" type="button" data-day-shift="1">→</button>
      <span class="pill" style="--pill:${dayType.accent}">${escapeHtml(dayType.label)}</span>
    </div>
    ${renderWeekStrip(record)}
    <div class="quick-panel-row" aria-label="Pannelli rapidi">
      <button class="quick-panel" type="button" data-action="panel" data-panel="week">Settimana</button>
    </div>
    ${milestone ? `<aside class="milestone">${escapeHtml(milestone.text)}</aside>` : ""}
    <div class="daily-board">
      ${renderTrainingCard(record, groups.training)}
      ${renderSupplements(record, groups.supplements)}
      ${renderNutritionCard(record)}
      ${renderHabits(record, groups.habits)}
    </div>
  `;
  bindTodayEvents(record);
}

function renderWeekStrip(record) {
  const dates = getWeekDates(state.startDate, clampProtocolWeek(record.weekNumber));
  const activeIndex = Math.max(0, dates.indexOf(record.date));
  return `
    <div class="week-progress" aria-label="Progressione settimana">
      <div class="week-strip">
        ${dates
          .map((date, index) => {
            const active = date === record.date ? "active" : "";
            const filled = index <= activeIndex ? "filled" : "";
            const label = new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "2-digit" }).format(new Date(`${date}T12:00:00`));
            return `
              <button class="week-strip-day ${filled} ${active}" type="button" data-strip-date="${date}">
                <span>${escapeHtml(label)}</span>
                <i>${index + 1}</i>
              </button>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

function renderTrainingCard(record) {
  const day = DAY_TYPES[record.dayType];
  return `
    <section class="card compact-card workout-card">
      <div class="card-title"><span>${escapeHtml(day.training.time)}</span><h3>${escapeHtml(day.training.title)}</h3></div>
      <label class="check-row primary-check">
        <input type="checkbox" data-item="training" ${record.items.training ? "checked" : ""}>
        <span>Allenamento fatto</span>
      </label>
      <div class="compact-details">
        <div class="static-section-title">Esercizi</div>
        <ul class="exercise-list">${day.training.exercises.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
      </div>
    </section>
  `;
}

function renderSupplements(record, items) {
  return `
    <section class="card compact-card supplement-card">
      <div class="card-title"><span>Orari + cosa prendere</span><h3>Integratori</h3></div>
      <div class="supplement-grid">
        ${items
          .map((item) => {
            const block = SUPPLEMENT_BLOCKS.find((entry) => entry.id === item.id);
            return `
              <label class="supplement-tile ${record.items[item.id] ? "checked" : ""}">
                <input type="checkbox" data-item="${item.id}" ${record.items[item.id] ? "checked" : ""}>
                <span class="supplement-time">${escapeHtml(block.time)}</span>
                <span class="supplement-label">${escapeHtml(block.label)}</span>
                <span class="supplement-items">${block.items.map((detail) => `<em>${escapeHtml(detail)}</em>`).join("")}</span>
              </label>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderNutritionCard(record) {
  const diet = getDietForDate(record.date);
  return `
    <section class="card compact-card nutrition-card">
      <div class="card-title"><span>${escapeHtml(diet.label)}</span><h3>Alimentazione</h3></div>
      <div class="meal-grid">
        ${diet.meals
          .map((meal) => {
            return `
              <label class="meal-tile ${record.items[meal.id] ? "checked" : ""}">
                <input type="checkbox" data-item="${meal.id}" ${record.items[meal.id] ? "checked" : ""}>
                <span class="meal-time">${escapeHtml(meal.time)}</span>
                <span class="meal-label">${escapeHtml(meal.label)}</span>
                <span class="meal-items">${meal.items.map((item) => `<em>${escapeHtml(item)}</em>`).join("")}</span>
              </label>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderHabits(record, items) {
  return `
    <section class="card compact-card habit-card">
      <div class="card-title"><span>Base</span><h3>Abitudini</h3></div>
      <div class="habit-grid">
        ${items
          .map((item) => {
            if (item.type === "number") {
              const suffix = item.id === "sleep" ? "ore" : "passi";
              return field(item.label, `<input type="number" inputmode="decimal" data-item="${item.id}" value="${escapeHtml(record.items[item.id])}" placeholder="${suffix}">`);
            }
            return `<label class="check-row"><input type="checkbox" data-item="${item.id}" ${record.items[item.id] ? "checked" : ""}><span>${escapeHtml(item.label)}</span></label>`;
          })
          .join("")}
      </div>
    </section>
  `;
}

async function showPanel(panel) {
  const map = {
    week: { title: "Settimana", render: renderWeek },
    labs: { title: "Valori clinici", render: renderLabs },
    charts: { title: "Grafici", render: renderChartsView },
    report: { title: "Report", render: renderReport },
  };
  const item = map[panel];
  if (!item) return;
  openModal({
    title: item.title,
    body: `<div id="panelHost" class="panel-host"></div>`,
    actions: `<button class="button primary" type="button" data-close-modal>Chiudi</button>`,
  });
  await item.render($("#panelHost"));
}

function bindTodayEvents(record) {
  const host = $("#view-oggi");
  host.onchange = handleTodayChange;
  host.oninput = handleTodayInput;
  host.querySelectorAll("[data-day-shift]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeDate = addDays(state.activeDate, Number(button.dataset.dayShift));
      await renderToday();
    });
  });
  host.querySelectorAll("[data-strip-date]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeDate = button.dataset.stripDate;
      await renderToday();
    });
  });
  $("[data-active-date]", host).addEventListener("change", async (event) => {
    state.activeDate = event.target.value;
    await renderToday();
  });

  function updateFromDom() {
    const next = structuredClone(record);
    host.querySelectorAll("[data-item]").forEach((input) => {
      next.items[input.dataset.item] = input.type === "checkbox" ? input.checked : input.value;
    });
    const note = $("[data-day-note]", host);
    if (note) next.note = note.value;
    const normalized = normalizeDayRecord(next, state.startDate);
    record.items = normalized.items;
    record.note = normalized.note;
    record.completedPct = normalized.completedPct;
    $(".progress-badge strong", host).textContent = pctLabel(normalized.completedPct);
    $(".progress-track span", host).style.width = `${Math.round(normalized.completedPct * 100)}%`;
    saveTodayDebounced(normalized);
  }

  function handleTodayChange(event) {
    if (event.target.matches("[data-item], [data-day-note]")) updateFromDom();
  }

  function handleTodayInput(event) {
    if (event.target.matches("[data-day-note], input[type='number']")) updateFromDom();
  }
}

async function saveDay(record) {
  try {
    await putOne("days", record);
    if (record.completedPct === 1 && navigator.vibrate) navigator.vibrate(30);
  } catch (error) {
    toast(error.message, "bad");
  }
}

async function calculateStreak() {
  const days = await getAll("days");
  let streak = 0;
  for (let date = state.today; ; date = addDays(date, -1)) {
    const record = days.find((day) => day.date === date);
    if (!record || Number(record.completedPct) < PROTOCOL.completionThreshold) break;
    streak += 1;
  }
  return streak;
}

async function renderWeek(host = $("#view-settimana")) {
  const weekNumber = state.selectedWeek;
  const dates = getWeekDates(state.startDate, weekNumber);
  const days = await getAll("days");
  const dayRecords = dates.map((date) => days.find((day) => day.date === date) ?? buildDefaultDayRecord(date, state.startDate));
  host.innerHTML = `
    <div class="section-head">
      <button class="button ghost" data-week-nav="-1">←</button>
      <h2>Settimana ${weekNumber}/12</h2>
      <button class="button ghost" data-week-nav="1">→</button>
    </div>
    ${MILESTONES[weekNumber] ? `<aside class="milestone">${escapeHtml(MILESTONES[weekNumber].text)}</aside>` : ""}
    <section class="week-grid">${dayRecords.map(renderWeekDay).join("")}</section>
  `;
  host.querySelectorAll("[data-week-nav]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedWeek = clampProtocolWeek(state.selectedWeek + Number(button.dataset.weekNav));
      await renderWeek(host);
    });
  });
  host.querySelectorAll("[data-date]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.activeDate = button.dataset.date;
      closeModal();
      await renderToday();
    });
  });
}

function renderWeekDay(record) {
  const pct = Math.round(record.completedPct * 100);
  const tone = pct >= 80 ? "good" : pct >= 50 ? "warn" : "bad";
  return `
    <button class="day-tile ${tone}" type="button" data-date="${record.date}">
      <span>${escapeHtml(formatHumanDate(record.date).split(" ")[0])}</span>
      <strong>${pct}%</strong>
      <small>${escapeHtml(DAY_TYPES[record.dayType].label)}</small>
    </button>
  `;
}

async function saveWeek(record) {
  try {
    await putOne("weeks", record);
    toast("Settimana salvata.");
  } catch (error) {
    toast(error.message, "bad");
  }
}

async function renderLabs(host = $("#view-valori")) {
  const labs = (await getAll("labs")).sort((a, b) => b.date.localeCompare(a.date));
  host.innerHTML = `
    <div class="section-head">
      <h2>Valori clinici</h2>
      <button class="button primary" data-action="new-lab">+ Nuovo</button>
    </div>
    <div class="stack">
      ${
        labs.length
          ? labs.map(renderLabCard).join("")
          : `<section class="empty">Nessun referto inserito.</section>`
      }
    </div>
  `;
  host.querySelectorAll("[data-edit-lab]").forEach((button) => {
    button.addEventListener("click", () => showLabForm(labs.find((lab) => String(lab.id) === button.dataset.editLab)));
  });
}

function renderLabCard(lab) {
  const filled = LAB_FIELDS.filter((fieldDef) => lab.panel?.[fieldDef.key] !== "" && lab.panel?.[fieldDef.key] != null).slice(0, 6);
  return `
    <article class="card lab-card">
      <div class="card-title"><span>${escapeHtml(lab.date)}</span><h3>${escapeHtml(lab.source || "Referto")}</h3></div>
      <dl>${filled.map((fieldDef) => `<div><dt>${escapeHtml(fieldDef.label)}</dt><dd>${escapeHtml(lab.panel[fieldDef.key])} ${escapeHtml(fieldDef.unit)}</dd></div>`).join("")}</dl>
      <button class="button ghost" type="button" data-edit-lab="${lab.id}">Modifica</button>
    </article>
  `;
}

function showLabForm(lab = null) {
  const panel = lab?.panel ?? {};
  openModal({
    title: lab ? "Modifica referto" : "Nuovo referto",
    body: `
      <form id="labForm" class="form-grid">
        ${field("Data", `<input name="date" type="date" value="${escapeHtml(lab?.date ?? state.today)}" required>`)}
        ${field("Laboratorio", textInput("source", lab?.source ?? "", "placeholder='Nome libero'"))}
        ${LAB_FIELDS.map((fieldDef) => field(fieldDef.label, `${numberInput(fieldDef.key, panel[fieldDef.key], "step='any'")}<small>${rangeLabel(fieldDef)}</small>`)).join("")}
        ${field("Nota", textareaInput("note", lab?.note ?? ""))}
      </form>
    `,
    actions: `
      ${lab ? `<button class="button danger" type="button" id="deleteLab">Elimina</button>` : ""}
      <button class="button ghost" type="button" data-close-modal>Annulla</button>
      <button class="button primary" type="button" id="saveLab">Salva</button>
    `,
  });
  $("#saveLab").addEventListener("click", async () => saveLab(lab?.id));
  $("#deleteLab")?.addEventListener("click", async () => {
    if (await confirmDialog("Elimina referto", "Questa operazione non si annulla.", "Elimina")) {
      await deleteOne("labs", lab.id);
      closeModal();
      await renderLabs($("#panelHost") ?? $("#view-valori"));
    }
  });
}

function rangeLabel(fieldDef) {
  if (fieldDef.refLow != null && fieldDef.refHigh != null) return `Range ${fieldDef.refLow}-${fieldDef.refHigh} ${fieldDef.unit}`;
  if (fieldDef.refHigh != null) return `Target sotto ${fieldDef.refHigh} ${fieldDef.unit}`;
  if (fieldDef.refLow != null) return `Target sopra ${fieldDef.refLow} ${fieldDef.unit}`;
  return fieldDef.unit || "Campo libero";
}

async function saveLab(id = null) {
  const form = $("#labForm");
  const data = Object.fromEntries(new FormData(form));
  const panel = {};
  for (const fieldDef of LAB_FIELDS) panel[fieldDef.key] = optionalNumber(data[fieldDef.key]);
  await putOne("labs", {
    ...(id ? { id } : {}),
    date: data.date,
    source: data.source,
    panel,
    note: data.note,
    updatedAt: Date.now(),
  });
  closeModal();
  await renderLabs();
  toast("Referto salvato.");
}

async function renderChartsView(host = $("#view-grafici")) {
  const [weeks, labs] = await Promise.all([getAll("weeks"), getAll("labs")]);
  host.innerHTML = `
    <div class="section-head"><h2>Grafici</h2></div>
    <section class="card">
      <label class="field"><span>Metrica</span>
        <select id="metricSelect">${metricOptions().map((metric) => `<option value="${metric.key}" ${metric.key === state.selectedMetric ? "selected" : ""}>${escapeHtml(metric.label)}</option>`).join("")}</select>
      </label>
      <div class="chart-wrap">
        <canvas id="mainChart" width="800" height="360"></canvas>
        <p class="chart-fallback" hidden>Grafico non disponibile offline finché Chart.js non è stato caricato almeno una volta.</p>
      </div>
    </section>
  `;
  $("#metricSelect", host).addEventListener("change", async (event) => {
    state.selectedMetric = event.target.value;
    await renderChartsView(host);
  });
  renderChart($("#mainChart", host), state.selectedMetric, weeks, labs);
}

async function renderReport(host = $("#view-report")) {
  const weekNumber = state.selectedWeek;
  const dates = getWeekDates(state.startDate, weekNumber);
  const [days, week, previousWeek, labs] = await Promise.all([
    getAll("days"),
    getOne("weeks", weekNumber),
    getOne("weeks", weekNumber - 1),
    getAll("labs"),
  ]);
  const dayRecords = dates.map((date) => days.find((day) => day.date === date) ?? buildDefaultDayRecord(date, state.startDate));
  const labsInWeek = labs.filter((lab) => lab.date >= dates[0] && lab.date <= dates[6]).sort((a, b) => a.date.localeCompare(b.date));
  const report = buildWeeklyReport({ weekNumber, days: dayRecords, week: week ?? {}, previousWeek: previousWeek ?? {}, labsInWeek });
  host.innerHTML = `
    <div class="section-head">
      <button class="button ghost" data-report-week="-1">←</button>
      <h2>Report settimana ${weekNumber}</h2>
      <button class="button ghost" data-report-week="1">→</button>
    </div>
    <section class="card report-card">
      <pre>${escapeHtml(report.text)}</pre>
      <div class="button-row">
        <button class="button primary" data-action="print">Stampa / PDF</button>
        <button class="button ghost" data-action="export">Backup JSON</button>
        <button class="button ghost" data-action="import">Ripristina</button>
      </div>
    </section>
  `;
  host.querySelectorAll("[data-report-week]").forEach((button) => {
    button.addEventListener("click", async () => {
      state.selectedWeek = clampProtocolWeek(state.selectedWeek + Number(button.dataset.reportWeek));
      await renderReport(host);
    });
  });
}

function showManifesto() {
  openModal({
    title: "Quando voglio mollare",
    body: `<div class="manifesto-text">${escapeHtml(MANIFESTO).replaceAll("\n", "<br>")}</div>`,
    actions: `<button class="button primary" type="button" data-close-modal>Chiudi, continuo</button>`,
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
  const confirmed = await confirmDialog("Ripristina backup", "Sostituisco tutti i dati locali con il file JSON selezionato?", "Ripristina");
  if (!confirmed) return;
  try {
    const payload = JSON.parse(await file.text());
    await importAll(payload, { replace: true });
    toast("Backup ripristinato.");
    await render();
  } catch (error) {
    toast(error.message, "bad");
  } finally {
    event.target.value = "";
  }
}

function optionalNumber(value) {
  if (value === "" || value === null || value === undefined) return "";
  const num = Number(value);
  return Number.isFinite(num) ? num : "";
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./sw.js");
  } catch (error) {
    console.warn("Service worker registration failed", error);
  }
}
