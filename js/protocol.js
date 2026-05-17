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
    time: "08:00",
    label: "Colazione (con grassi)",
    items: [
      "Vitamina D3 4.000 UI",
      "Omega-3 2 cps",
      "B-complex (folati+B12)",
      "Vitamina C 1 g",
    ],
  },
  {
    id: "suppl_lunch",
    time: "13:00",
    label: "Pranzo",
    items: [
      "Creatina 5 g",
      "Black Maca",
      "Coenzima Q10",
      "Fermenti lattici",
    ],
  },
  {
    id: "suppl_afternoon",
    time: "16:30",
    label: "Pomeriggio (stomaco vuoto)",
    items: [
      "Zinco 20 mg",
      "NAC 600 mg",
    ],
  },
  {
    id: "suppl_presleep",
    time: "22:00",
    label: "Pre-sonno",
    items: [
      "Magnesio bisglicinato 350 mg",
      "Ashwagandha KSM-66 600 mg",
      "Milk Thistle",
    ],
  },
];

export const DIET_PLAN = {
  1: {
    label: "Lunedì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [
        ["Avena 80g cotta in acqua", "4 albumi + 1 uovo intero strapazzati", "Frutti rossi 100g", "Caffè nero"],
        ["Pane integrale 80g tostato", "Ricotta 150g + miele 1 cucchiaino", "1 mela", "Caffè nero"],
        ["Yogurt greco 0% 250g", "Granola 40g + noci 15g", "Frutti rossi 100g", "Caffè nero"],
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [
        ["Pollo 200g grigliato", "Riso basmati 100g (peso secco)", "Verdure miste cotte + 1 cucchiaio olio EVO"],
        ["Manzo magro 200g", "Patate 250g al forno", "Insalata mista + olio EVO"],
        ["Tonno al naturale 200g", "Pasta integrale 100g", "Pomodorini + rucola + olio EVO"],
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", alternatives: [
        ["Salmone 180g al forno", "Patate dolci 200g", "Insalata mista + limone"],
        ["Merluzzo 200g al vapore", "Riso 80g (peso secco)", "Broccoli + olio EVO"],
        ["Tacchino 200g", "Quinoa 80g (peso secco)", "Zucchine saltate + olio EVO"],
      ]},
    ],
  },
  2: {
    label: "Martedì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [
        ["Pane integrale 80g", "Ricotta 150g", "Miele 1 cucchiaino", "Frutta fresca 1 porzione"],
        ["Avena 80g cotta", "Whey 30g", "Banana", "Mandorle 15g"],
        ["3 uova strapazzate", "Pane integrale 60g", "Avocado mezzo", "Frutta fresca"],
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [
        ["Pasta integrale 100g", "Tonno al naturale 150g", "Pomodorini + olio EVO", "Spuntino 16:30: banana + mandorle 30g"],
        ["Riso 100g (peso secco)", "Pollo 180g", "Verdure grigliate + olio EVO", "Spuntino 16:30: pane integrale 50g + miele"],
        ["Patate 250g al forno", "Salmone 150g", "Insalata + olio EVO", "Spuntino 16:30: yogurt greco 0% 150g + frutti rossi"],
      ]},
      { id: "meal_dinner", label: "Cena post-MT", time: "21:30", alternatives: [
        ["Pollo 180g", "Quinoa 80g (peso secco)", "Verdure cotte"],
        ["Tacchino 180g", "Riso 80g (peso secco)", "Zucchine + olio EVO"],
        ["Manzo magro 180g", "Patate 200g", "Insalata + olio EVO"],
      ]},
    ],
  },
  3: {
    label: "Mercoledì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [
        ["Avena 80g cotta", "Whey 30g", "Banana", "Burro arachidi 15g"],
        ["Pancake avena (80g avena + 3 albumi)", "Frutti rossi 100g", "Sciroppo acero 1 cucchiaino"],
        ["Yogurt greco 0% 250g", "Granola 50g", "Banana", "Noci 15g"],
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [
        ["Manzo magro 200g", "Riso 100g (peso secco)", "Spinaci saltati + olio EVO"],
        ["Pollo 220g", "Patate dolci 250g", "Verdure grigliate + olio EVO"],
        ["Salmone 180g", "Pasta integrale 100g", "Pomodorini + rucola + olio EVO"],
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", alternatives: [
        ["Merluzzo 200g", "Patate 200g", "Broccoli al vapore"],
        ["Pesce azzurro 200g (sgombro/alici)", "Riso 80g (peso secco)", "Insalata + olio EVO"],
        ["Tacchino 200g", "Patate dolci 200g", "Zucchine al forno"],
      ]},
    ],
  },
  4: {
    label: "Giovedì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [
        ["Yogurt greco 0% 250g", "Granola 50g", "Frutta fresca", "Noci 20g"],
        ["Pane integrale 80g", "Ricotta 150g + miele", "Frutta fresca", "Mandorle 15g"],
        ["Avena 80g cotta", "2 uova strapazzate", "Frutti rossi 100g", "Caffè nero"],
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [
        ["Insalata mista grande", "3 uova sode", "Pane integrale 60g", "Olio EVO + aceto"],
        ["Quinoa 80g (peso secco)", "Pollo 180g", "Verdure grigliate + olio EVO"],
        ["Riso integrale 80g (peso secco)", "Tonno 150g", "Insalata + pomodorini + olio EVO"],
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", alternatives: [
        ["Zuppa legumi 300g (lenticchie/ceci/fagioli)", "Pane integrale 60g", "Formaggio fresco 60g"],
        ["Pasta e fagioli 250g", "Insalata mista + olio EVO", "Frutta fresca"],
        ["Hummus 150g + pane integrale 60g", "Verdure crude", "Uova sode 2"],
      ]},
    ],
  },
  5: {
    label: "Venerdì",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [
        ["Pancake avena (80g avena + 3 albumi + 1 uovo)", "Frutti rossi 100g", "Sciroppo acero 1 cucchiaino"],
        ["Avena 80g cotta", "Whey 30g", "Banana", "Burro arachidi 15g"],
        ["3 uova strapazzate", "Pane integrale 80g", "Avocado mezzo", "Frutta fresca"],
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [
        ["Pollo 200g", "Patate 250g al forno", "Verdure grigliate + olio EVO"],
        ["Manzo magro 200g", "Riso 100g (peso secco)", "Spinaci + olio EVO"],
        ["Salmone 180g", "Quinoa 100g (peso secco)", "Insalata mista + olio EVO"],
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", alternatives: [
        ["Tacchino 200g", "Riso 100g (peso secco)", "Zucchine saltate"],
        ["Pollo 200g", "Patate dolci 200g", "Verdure miste cotte"],
        ["Merluzzo 220g", "Patate 200g", "Broccoli al vapore + olio EVO"],
      ]},
    ],
  },
  6: {
    label: "Sabato",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [
        ["Toast integrale 2 fette", "2 uova alla coque", "Avocado mezzo", "Frutta fresca"],
        ["Pancake avena + ricotta 100g", "Frutti rossi 100g", "Miele 1 cucchiaino"],
        ["Yogurt greco 0% 300g", "Granola 50g + noci 20g", "Banana"],
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [
        ["Pasta 100g", "Ragù magro di manzo", "Parmigiano 15g", "Spuntino 16:30: banana + mandorle 30g"],
        ["Lasagna porzione media", "Insalata + olio EVO", "Frutta", "Spuntino 16:30: pane integrale 50g + miele"],
        ["Riso integrale 100g (peso secco)", "Pollo 200g", "Verdure miste + olio EVO", "Spuntino 16:30: yogurt greco 0% 150g + frutti rossi"],
      ]},
      { id: "meal_dinner", label: "Cena post-MT", time: "21:30", alternatives: [
        ["Pesce azzurro 200g (sgombro/alici)", "Verdure cotte + olio EVO", "Pane integrale 40g"],
        ["Salmone 180g", "Patate dolci 150g", "Insalata + olio EVO"],
        ["Tonno 180g", "Quinoa 70g (peso secco)", "Pomodorini + olio EVO"],
      ]},
    ],
  },
  0: {
    label: "Domenica",
    meals: [
      { id: "meal_breakfast", label: "Colazione", time: "09:00", alternatives: [
        ["3 uova alla benedict", "Pane integrale 60g", "Avocado mezzo", "Caffè + frutta"],
        ["Pancake avena 80g + 3 albumi + 1 uovo", "Frutti rossi", "Miele 1 cucchiaino"],
        ["Yogurt greco 0% 300g", "Granola 50g + noci", "Banana + frutti rossi"],
      ]},
      { id: "meal_lunch", label: "Pranzo", time: "13:30", alternatives: [
        ["Salmone 200g al forno", "Patate dolci 250g", "Insalata + olio EVO"],
        ["Sgombro 200g", "Riso 100g (peso secco)", "Verdure grigliate + olio EVO"],
        ["Legumi misti 300g + cereali integrali", "Insalata + olio EVO", "Frutta fresca"],
      ]},
      { id: "meal_dinner", label: "Cena", time: "20:00", alternatives: [
        ["Petto pollo 200g", "Insalatona ricca proteica", "Semi misti + olio EVO"],
        ["Tonno 180g", "Quinoa 80g (peso secco)", "Verdure cotte + olio EVO"],
        ["Uova sode 3", "Pane integrale 60g", "Hummus 100g + verdure crude"],
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
        "Push-up declinati piedi su panca — 3×10-12 (corpo libero, lento sul cedere)",
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
