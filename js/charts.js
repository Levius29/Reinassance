import { LAB_FIELDS } from "./protocol.js";
import { getMetricSeries, metricOptions } from "./metrics.js";

let chart;

export function renderChart(canvas, metricKey, weeks, labs) {
  const Chart = window.Chart;
  if (!Chart) {
    const fallback = canvas.closest(".chart-wrap")?.querySelector(".chart-fallback");
    if (fallback) fallback.hidden = false;
    return;
  }
  const metric = metricOptions().find((item) => item.key === metricKey);
  const labField = LAB_FIELDS.find((field) => field.key === metricKey);
  const points = getMetricSeries(metricKey, weeks, labs);
  chart?.destroy();
  chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: points.map((point) => point.x),
      datasets: [
        {
          label: metric?.label ?? metricKey,
          data: points.map((point) => point.y),
          borderColor: "#1d4ed8",
          backgroundColor: "rgba(29, 78, 216, .12)",
          tension: 0.25,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} ${metric?.unit ?? labField?.unit ?? ""}` } },
      },
      scales: {
        y: { beginAtZero: false },
      },
    },
  });
}
