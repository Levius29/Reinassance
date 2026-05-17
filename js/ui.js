export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function toast(message, tone = "info") {
  const host = $("#toastHost");
  if (!host) return;
  const node = document.createElement("div");
  node.className = `toast toast-${tone}`;
  node.textContent = message;
  host.append(node);
  setTimeout(() => node.remove(), 3200);
}

export function setTheme() {
  document.documentElement.dataset.theme = "dark";
}

export function openModal({ title, body, actions = "" }) {
  const modal = $("#modal");
  $(".modal-title", modal).textContent = title;
  $(".modal-body", modal).innerHTML = body;
  $(".modal-actions", modal).innerHTML = actions || `<button class="button primary" data-close-modal>Chiudi</button>`;
  modal.showModal();
}

export function closeModal() {
  const modal = $("#modal");
  if (modal?.open) modal.close();
}

export function confirmDialog(title, body, confirmLabel = "Conferma") {
  return new Promise((resolve) => {
    openModal({
      title,
      body: `<p>${escapeHtml(body)}</p>`,
      actions: `
        <button class="button ghost" data-confirm="no">Annulla</button>
        <button class="button danger" data-confirm="yes">${escapeHtml(confirmLabel)}</button>
      `,
    });
    const modal = $("#modal");
    const onClick = (event) => {
      const choice = event.target.closest("[data-confirm]")?.dataset.confirm;
      if (!choice) return;
      modal.removeEventListener("click", onClick);
      closeModal();
      resolve(choice === "yes");
    };
    modal.addEventListener("click", onClick);
  });
}

export function field(label, input) {
  return `<label class="field"><span>${escapeHtml(label)}</span>${input}</label>`;
}

export function numberInput(name, value, attrs = "") {
  return `<input name="${escapeHtml(name)}" type="number" inputmode="decimal" value="${escapeHtml(value ?? "")}" ${attrs}>`;
}

export function textInput(name, value, attrs = "") {
  return `<input name="${escapeHtml(name)}" type="text" value="${escapeHtml(value ?? "")}" ${attrs}>`;
}

export function textareaInput(name, value, attrs = "") {
  return `<textarea name="${escapeHtml(name)}" rows="3" ${attrs}>${escapeHtml(value ?? "")}</textarea>`;
}

export function pctLabel(value) {
  return `${Math.round((Number(value) || 0) * 100)}%`;
}

export function formatHumanDate(dateString) {
  return new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "2-digit", month: "short" }).format(new Date(`${dateString}T12:00:00`));
}

export function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function haptic(pattern = "tick") {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  const patterns = {
    tick: 10,
    "complete-day": [20, 40, 20],
    "complete-week": [30, 80, 30, 80, 50],
  };
  navigator.vibrate(patterns[pattern] ?? pattern);
}

export function longPress(element, onLongPress, { delay = 500, moveThreshold = 8 } = {}) {
  let timer = null;
  let startX = 0;
  let startY = 0;
  let fired = false;

  function cancel() {
    if (timer) clearTimeout(timer);
    timer = null;
  }
  function onDown(event) {
    const point = event.touches ? event.touches[0] : event;
    startX = point.clientX;
    startY = point.clientY;
    fired = false;
    cancel();
    timer = setTimeout(() => {
      fired = true;
      onLongPress(event);
    }, delay);
  }
  function onMove(event) {
    if (!timer) return;
    const point = event.touches ? event.touches[0] : event;
    const dx = Math.abs(point.clientX - startX);
    const dy = Math.abs(point.clientY - startY);
    if (dx > moveThreshold || dy > moveThreshold) cancel();
  }
  function onUp() { cancel(); }
  function onClick(event) {
    if (fired) {
      event.preventDefault();
      event.stopPropagation();
      fired = false;
    }
  }
  element.addEventListener("pointerdown", onDown);
  element.addEventListener("pointermove", onMove);
  element.addEventListener("pointerup", onUp);
  element.addEventListener("pointercancel", onUp);
  element.addEventListener("pointerleave", onUp);
  element.addEventListener("click", onClick, true);
  return () => {
    cancel();
    element.removeEventListener("pointerdown", onDown);
    element.removeEventListener("pointermove", onMove);
    element.removeEventListener("pointerup", onUp);
    element.removeEventListener("pointercancel", onUp);
    element.removeEventListener("pointerleave", onUp);
    element.removeEventListener("click", onClick, true);
  };
}

export function ringSvg(pct, { size = 72, stroke = 6 } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(1, pct)));
  return `
    <svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}"></circle>
      <circle class="fill" cx="${size/2}" cy="${size/2}" r="${r}"
              stroke-dasharray="${c.toFixed(2)}"
              stroke-dashoffset="${offset.toFixed(2)}"></circle>
    </svg>
  `;
}

export function updateRing(ringEl, pct) {
  const fill = ringEl.querySelector("svg .fill");
  if (!fill) return;
  const r = Number(fill.getAttribute("r"));
  const c = 2 * Math.PI * r;
  fill.setAttribute("stroke-dashoffset", (c * (1 - Math.max(0, Math.min(1, pct)))).toFixed(2));
  const label = ringEl.querySelector(".ring-label .num");
  if (label) label.textContent = Math.round(pct * 100);
}

export function nextTaskLabel(record, dayType, now = new Date()) {
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const nowHHMM = `${hh}:${mm}`;
  if (record.completedPct === 1) return { time: "", label: `Giorno chiuso · streak +1` };
  const trainingDone = record.items.training === true;
  if (!trainingDone && dayType.training.time > nowHHMM) {
    return { time: dayType.training.time, label: dayType.training.title.split(" · ")[0] };
  }
  return { time: dayType.training.time, label: dayType.label };
}
