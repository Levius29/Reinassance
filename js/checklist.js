import { DAY_TYPES, SUPPLEMENT_BLOCKS, getDayTypeForDate, getProtocolWeek } from "./protocol.js";

export function getChecklistItemsForDayType(dayType) {
  const training = DAY_TYPES[dayType]?.training ?? DAY_TYPES.rest.training;
  return [
    {
      id: "training",
      group: "training",
      type: "boolean",
      time: training.time,
      label: training.title,
    },
    ...SUPPLEMENT_BLOCKS.map((block) => ({
      id: block.id,
      group: "supplements",
      type: "boolean",
      time: block.time,
      label: block.label,
      details: block.items,
    })),
    { id: "meal_breakfast", group: "nutrition", type: "boolean", label: "Colazione" },
    { id: "meal_lunch", group: "nutrition", type: "boolean", label: "Pranzo" },
    { id: "meal_dinner", group: "nutrition", type: "boolean", label: "Cena" },
    { id: "sleep", group: "habits", type: "number", label: "Sonno", completeWhen: (value) => Number(value) >= 7 },
    { id: "protein", group: "habits", type: "boolean", label: "Proteine target" },
    { id: "noAlcohol", group: "habits", type: "boolean", label: "No alcol" },
    { id: "noPorn", group: "habits", type: "boolean", label: "No porno" },
  ];
}

export function isItemComplete(value, item) {
  if (item.counts === false) return true;
  if (typeof item.completeWhen === "function") return item.completeWhen(value);
  if (item.type === "number") return Number(value) > 0;
  return value === true;
}

export function calculateCompletedPct(items = {}, checklist = []) {
  const countable = checklist.filter((item) => item.counts !== false);
  if (!countable.length) return 0;
  const completed = countable.filter((item) => isItemComplete(items[item.id], item)).length;
  return Math.round((completed / countable.length) * 100) / 100;
}

export function buildDefaultItems(dayType) {
  return Object.fromEntries(
    getChecklistItemsForDayType(dayType).map((item) => [item.id, item.type === "number" ? "" : false]),
  );
}

export function normalizeDayRecord(record, startDateString) {
  const dayType = record?.dayType ?? getDayTypeForDate(record.date);
  const checklist = getChecklistItemsForDayType(dayType);
  const items = { ...buildDefaultItems(dayType), ...(record?.items ?? {}) };
  return {
    date: record.date,
    weekNumber: record.weekNumber ?? getProtocolWeek(record.date, startDateString),
    dayType,
    items,
    completedPct: calculateCompletedPct(items, checklist),
    note: record?.note ?? "",
    updatedAt: Date.now(),
  };
}

export function buildDefaultDayRecord(dateString, startDateString) {
  const dayType = getDayTypeForDate(dateString);
  return normalizeDayRecord(
    {
      date: dateString,
      weekNumber: getProtocolWeek(dateString, startDateString),
      dayType,
      items: buildDefaultItems(dayType),
      completedPct: 0,
      note: "",
    },
    startDateString,
  );
}

export function groupChecklistItems(items) {
  return items.reduce(
    (groups, item) => {
      groups[item.group] ??= [];
      groups[item.group].push(item);
      return groups;
    },
    { training: [], supplements: [], habits: [] },
  );
}
