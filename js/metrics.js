import { LAB_FIELDS } from "./protocol.js";

export const WEEKLY_METRICS = [
  { key: "weight", label: "Peso", unit: "kg" },
  { key: "waist", label: "Girovita", unit: "cm" },
  { key: "energy", label: "Energia", unit: "/10" },
  { key: "libido", label: "Libido", unit: "/10" },
  { key: "morningErections", label: "Erezioni", unit: "/7" },
  { key: "avgSleep", label: "Sonno medio", unit: "h" },
];

export function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return null;
  return Math.round((nums.reduce((sum, value) => sum + value, 0) / nums.length) * 100) / 100;
}

export function summarizeWeek(days = [], week = {}) {
  const completedDays = days.filter((day) => Number(day.completedPct) >= 0.8).length;
  const avgAdherence = average(days.map((day) => day.completedPct)) ?? 0;
  const strength = days.filter((day) => ["push", "pull", "legs"].includes(day.dayType) && day.items?.training === true).length;
  const muaythai = days.filter((day) => day.dayType === "muaythai" && day.items?.training === true).length;
  return {
    avgAdherence,
    completedDays,
    strength,
    muaythai,
    avgSleepFromDays: average(days.map((day) => day.items?.sleep)),
    week,
  };
}

export function getMetricSeries(metricKey, weeks = [], labs = []) {
  const weekly = WEEKLY_METRICS.find((metric) => metric.key === metricKey);
  if (weekly) {
    return weeks
      .filter((week) => week?.[metricKey] !== "" && week?.[metricKey] !== undefined && week?.[metricKey] !== null)
      .sort((a, b) => a.weekNumber - b.weekNumber)
      .map((week) => ({ x: `Sett ${week.weekNumber}`, y: Number(week[metricKey]) }));
  }
  const lab = LAB_FIELDS.find((field) => field.key === metricKey);
  if (lab) {
    return labs
      .filter((entry) => entry.panel?.[metricKey] !== "" && entry.panel?.[metricKey] !== undefined && entry.panel?.[metricKey] !== null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((entry) => ({ x: entry.date, y: Number(entry.panel[metricKey]) }));
  }
  return [];
}

export function metricOptions() {
  return [
    ...WEEKLY_METRICS,
    ...LAB_FIELDS.filter((field) => ["testosterone_total", "testosterone_free", "ferritin", "homa_ir", "alt", "vitamin_d"].includes(field.key)),
  ];
}
