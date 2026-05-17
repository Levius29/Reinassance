import { MILESTONES } from "./protocol.js";
import { summarizeWeek } from "./metrics.js";

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
