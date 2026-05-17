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

export function setTheme(theme) {
  if (theme === "dark" || theme === "light") {
    document.documentElement.dataset.theme = theme;
    return;
  }
  delete document.documentElement.dataset.theme;
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
