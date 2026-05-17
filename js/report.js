import { MILESTONES } from "./protocol.js";

function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  if (!nums.length) return null;
  return Math.round((nums.reduce((sum, v) => sum + v, 0) / nums.length) * 100) / 100;
}

function summarizeWeek(days = [], week = {}) {
  const completedDays = days.filter((day) => Number(day.completedPct) >= 0.8).length;
  const avgAdherence = average(days.map((day) => day.completedPct)) ?? 0;
  const strength = days.filter((day) => ["push", "pull", "legs"].includes(day.dayType) && day.items?.training === true).length;
  const muaythai = days.filter((day) => day.dayType === "muaythai" && day.items?.training === true).length;
  return { avgAdherence, completedDays, strength, muaythai, avgSleepFromDays: average(days.map((day) => day.items?.sleep)), week };
}

function delta(current, previous, unit = "") {
  const now = Number(current);
  const before = Number(previous);
  if (!Number.isFinite(now) || !Number.isFinite(before)) return "—";
  const diff = Math.round((now - before) * 100) / 100;
  const sign = diff > 0 ? "+" : "";
  return `${sign}${diff}${unit}`;
}

export function buildWeeklyReport({ weekNumber, days, week, previousWeek, labsInWeek = [] }) {
  const summary = summarizeWeek(days, week);
  const phase = MILESTONES[weekNumber]?.text ?? "Protocollo attivo";
  const latestLab = labsInWeek.at(-1);
  const labLine = latestLab
    ? `Valori aggiornati: referto ${latestLab.date}${latestLab.source ? ` (${latestLab.source})` : ""}.`
    : "Valori aggiornati: —";

  return {
    summary,
    text: [
      `SETTIMANA ${weekNumber}/12 — ${phase}`,
      `Aderenza media: ${Math.round(summary.avgAdherence * 100)}% (${summary.completedDays}/7 giorni ≥80%)`,
      `Allenamenti: forza ${summary.strength}/3 · muay thai ${summary.muaythai}/2`,
      `Sonno medio dichiarato: ${week?.avgSleep ?? summary.avgSleepFromDays ?? "—"} h`,
      `Peso: ${week?.weight ?? "—"} kg (${delta(week?.weight, previousWeek?.weight, " kg")}) · Girovita: ${week?.waist ?? "—"} cm (${delta(week?.waist, previousWeek?.waist, " cm")})`,
      `Sintomi: erezioni mattutine ${week?.morningErections ?? "—"}/7 · energia ${week?.energy ?? "—"}/10 · libido ${week?.libido ?? "—"}/10`,
      labLine,
      `Nota personale: "${week?.note ?? ""}"`,
    ].join("\n"),
  };
}
