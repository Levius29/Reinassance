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
  6: { type: "exam", text: "Checkpoint esami: dosa D3, B12, folati." },
  8: { type: "info", text: "Settimana di scarico (2°)." },
  12: { type: "exam", text: "Checkpoint maggiore: panel completo." },
};

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
