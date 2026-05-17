export const PROTOCOL = {
  totalWeeks: 12,
  defaultStartDate: null,
  completionThreshold: 0.8,
  weekSchedule: {
    1: "push",
    2: "muaythai",
    3: "pull",
    4: "rest",
    5: "legs",
    6: "muaythai",
    0: "rest",
  },
};

export const SUPPLEMENT_BLOCKS = [
  {
    id: "suppl_morning",
    time: "07:45",
    label: "Colazione",
    items: ["Vitamina D3 4.000 UI", "B-complex (folati+B12)", "Vitamina C 1g", "Fermenti lattici"],
  },
  {
    id: "suppl_empty",
    time: "10:00",
    label: "Stomaco vuoto",
    items: ["Zinco 20 mg", "NAC 600 mg"],
  },
  {
    id: "suppl_lunch",
    time: "13:00",
    label: "Pranzo",
    items: ["Creatina 5 g", "Black Maca", "Coenzima Q10"],
  },
  {
    id: "suppl_dinner",
    time: "20:00",
    label: "Cena",
    items: ["Omega-3 2 cps", "Milk Thistle"],
  },
  {
    id: "suppl_presleep",
    time: "21:00",
    label: "Pre-sonno",
    items: ["Magnesio bisglicinato 350 mg", "Ashwagandha KSM-66 600 mg"],
  },
];

const DEFAULT_DAILY_MEALS = [
  { id: "meal_breakfast", label: "Colazione", time: "08:00", items: ["Da compilare"] },
  { id: "meal_lunch", label: "Pranzo", time: "13:00", items: ["Da compilare"] },
  { id: "meal_dinner", label: "Cena", time: "20:00", items: ["Da compilare"] },
];

export const DIET_PLAN = {
  1: { label: "Lunedì", meals: DEFAULT_DAILY_MEALS },
  2: { label: "Martedì", meals: DEFAULT_DAILY_MEALS },
  3: { label: "Mercoledì", meals: DEFAULT_DAILY_MEALS },
  4: { label: "Giovedì", meals: DEFAULT_DAILY_MEALS },
  5: { label: "Venerdì", meals: DEFAULT_DAILY_MEALS },
  6: { label: "Sabato", meals: DEFAULT_DAILY_MEALS },
  0: { label: "Domenica", meals: DEFAULT_DAILY_MEALS },
};

export const DAY_TYPES = {
  push: {
    label: "Forza · Push",
    accent: "#1d4ed8",
    training: {
      title: "FORZA — PUSH · panca + manubri",
      time: "18:30",
      exercises: [
        "Risc. 5': circoli spalle, 10 push-up leggeri",
        "Panca piana manubri — 4×5-6 (28-32 kg/m, pesante)",
        "Shoulder press manubri seduto — 4×6-8 (20-26 kg/m)",
        "Panca inclinata manubri — 3×8 (22-28 kg/m)",
        "Alzate laterali — 3×12 (8-12 kg/m, lento)",
        "French press manubri su panca — 3×10 (12-16 kg/m)",
        "Core 5': plank 3×45\" + hollow hold 2×30\"",
      ],
    },
  },
  pull: {
    label: "Forza · Pull",
    accent: "#1d4ed8",
    training: {
      title: "FORZA — PULL · panca + manubri",
      time: "18:30",
      exercises: [
        "Risc. 5': mobilità schiena/anche, cat-cow",
        "Stacco rumeno manubri — 4×6 (28-32 kg/m, pesante)",
        "Rematore 1 braccio su panca — 4×8/lato (24-30 kg/m)",
        "Rematore bilaterale manubri — 3×10 (20-26 kg/m)",
        "Superman / back extension a terra — 3×15",
        "Curl manubri — 3×10 (14-18 kg/m, lento)",
        "Core 5': hollow hold 3×30\" + plank 2×30\"",
      ],
    },
  },
  legs: {
    label: "Forza · Legs",
    accent: "#1d4ed8",
    training: {
      title: "FORZA — LEGS · manubri + corpo libero",
      time: "18:30",
      exercises: [
        "Risc. 5': mobilità anche, 10 air squat profondi",
        "Squat goblet manubrio — 4×6-8 (28-32 kg, pesante)",
        "Affondi alternati manubri — 3×10/gamba (20-26 kg/m)",
        "Hip thrust a terra — 3×12 (manubrio 28-32 kg sul bacino)",
        "Stacco rumeno manubri — 3×10 (20-24 kg/m)",
        "Polpacci in piedi su scalino — 4×15",
        "Core 5': plank laterale 3×30\"/lato + dead bug 2×10",
      ],
    },
  },
  muaythai: {
    label: "Muay Thai",
    accent: "#ea580c",
    training: {
      title: "MUAY THAI · sera 19:00-20:30",
      time: "19:00",
      exercises: [
        "Spuntino pre-MT 16:30 (banana + mandorle)",
        "Allenamento come di consueto",
        "Idratazione durante",
        "Doccia calda post → calma il simpatico",
        "NO forza in questo giorno",
      ],
    },
  },
  rest: {
    label: "Riposo attivo",
    accent: "#059669",
    training: {
      title: "RIPOSO ATTIVO — non divano",
      time: "18:30",
      exercises: ["Camminata 30-40'", "Target 8-10.000 passi", "Recupero attivo: niente sedentarietà totale"],
    },
  },
};

export const MILESTONES = {
  1: { type: "info", text: "Fase 1 — Ricostruzione. Forza 70-75%, reps 6-8." },
  4: { type: "info", text: "Settimana di scarico — forza −30%." },
  5: { type: "info", text: "Fase 2 — Carichi pieni (4-6 reps)." },
  6: { type: "exam", text: "Checkpoint esami: dosa D3, B12, folati.", labsToBook: ["vitamin_d", "b12", "folate"] },
  8: { type: "info", text: "Settimana di scarico (2°)." },
  12: {
    type: "exam",
    text: "Checkpoint maggiore: panel completo.",
    labsToBook: ["testosterone_total", "testosterone_free", "shbg", "lh", "fsh", "estradiol", "homa_ir", "hba1c", "alt", "ferritin", "vitamin_d"],
  },
};

export const LAB_FIELDS = [
  { key: "testosterone_total", label: "Testosterone totale", unit: "ng/dL", refLow: 300, refHigh: 900, betterDirection: "range" },
  { key: "testosterone_free", label: "Testosterone libero", unit: "pg/mL", refLow: 15, refHigh: 50, betterDirection: "range" },
  { key: "shbg", label: "SHBG", unit: "nmol/L", refLow: 18, refHigh: 54, betterDirection: "range" },
  { key: "lh", label: "LH", unit: "mIU/mL", refLow: 1.7, refHigh: 8.6, betterDirection: "range" },
  { key: "fsh", label: "FSH", unit: "mIU/mL", refLow: 1.5, refHigh: 12.4, betterDirection: "range" },
  { key: "estradiol", label: "Estradiolo", unit: "pg/mL", refLow: 11, refHigh: 44, betterDirection: "range" },
  { key: "inhibin_b", label: "Inibina B", unit: "pg/mL", refLow: null, refHigh: null, betterDirection: "up" },
  { key: "amh", label: "AMH", unit: "ng/mL", refLow: null, refHigh: null, betterDirection: "range" },
  { key: "ferritin", label: "Ferritina", unit: "ng/mL", refLow: 30, refHigh: 400, betterDirection: "range" },
  { key: "homa_ir", label: "HOMA-IR", unit: "", refLow: null, refHigh: 2.0, betterDirection: "down" },
  { key: "hba1c", label: "HbA1c", unit: "%", refLow: null, refHigh: 5.6, betterDirection: "down" },
  { key: "alt", label: "ALT", unit: "U/L", refLow: null, refHigh: 45, betterDirection: "down" },
  { key: "ast", label: "AST", unit: "U/L", refLow: null, refHigh: 40, betterDirection: "down" },
  { key: "vitamin_d", label: "Vitamina D", unit: "ng/mL", refLow: 30, refHigh: 80, betterDirection: "range" },
  { key: "b12", label: "Vitamina B12", unit: "pg/mL", refLow: 300, refHigh: 900, betterDirection: "range" },
  { key: "folate", label: "Folati", unit: "ng/mL", refLow: 4, refHigh: 20, betterDirection: "range" },
  { key: "homocysteine", label: "Omocisteina", unit: "µmol/L", refLow: null, refHigh: 15, betterDirection: "down" },
  { key: "zinc", label: "Zinco", unit: "µg/dL", refLow: 70, refHigh: 120, betterDirection: "range" },
];

export const MANIFESTO = `Il muscolo non se n'è andato: è in sciopero. Il testosterone non è perso, è soppresso
e reversibile. I sintomi — sonno, energia, erezioni — migliorano prima che cambi il
sangue. Se a 4 settimane il referto è ancora uguale, è normale e atteso: sto riparando
il sistema, l'asse risponde dopo.

Una settimana storta non è un fallimento. È una settimana storta. La settimana dopo
ricomincio identico, zero sensi di colpa, zero "vabbè ormai".

L'unico vero fallimento è smettere di ricominciare.

Sono lo scienziato e il soggetto dell'esperimento. La sola variabile sono io.`;

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayString(date = new Date()) {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return [
    local.getFullYear(),
    String(local.getMonth() + 1).padStart(2, "0"),
    String(local.getDate()).padStart(2, "0"),
  ].join("-");
}

export function addDays(dateString, offset) {
  return formatDate(new Date(parseDate(dateString).getTime() + offset * DAY_MS));
}

export function getProtocolDay(dateString, startDateString) {
  return Math.floor((parseDate(dateString).getTime() - parseDate(startDateString).getTime()) / DAY_MS) + 1;
}

export function getProtocolWeek(dateString, startDateString) {
  return Math.max(1, Math.floor((getProtocolDay(dateString, startDateString) - 1) / 7) + 1);
}

export function getDayTypeForDate(dateString) {
  return PROTOCOL.weekSchedule[parseDate(dateString).getUTCDay()] ?? "rest";
}

export function getDietForDate(dateString) {
  return DIET_PLAN[parseDate(dateString).getUTCDay()] ?? DIET_PLAN[0];
}

export function getWeekDates(startDateString, weekNumber) {
  const first = addDays(startDateString, (weekNumber - 1) * 7);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
}

export function clampProtocolWeek(weekNumber) {
  return Math.min(PROTOCOL.totalWeeks, Math.max(1, Number(weekNumber) || 1));
}

export function getInitialActiveDate(todayDateString, startDateString) {
  return startDateString > todayDateString ? startDateString : todayDateString;
}
