import { $, $$, closeModal, escapeHtml, openModal, toast } from "./ui.js?v=18";
import { buildOverrideId } from "./diet.js?v=18";
import { deleteOne, putOne } from "./db.js?v=18";

function renderMacros(macros) {
  if (!macros) return "";
  return `
    <div class="alt-macros">
      <span>${macros.kcal} kcal</span>
      <span>P ${macros.protein}g</span>
      <span>F ${macros.fat}g</span>
      <span>C ${macros.carbs}g</span>
    </div>
  `;
}

export async function openMealPicker({ date, meal, onSaved }) {
  const overrideId = buildOverrideId(date, meal.id);
  const alternatives = meal.alternatives ?? [meal.items ?? []];
  const macroAlternatives = meal.macroAlternatives ?? alternatives.map(() => meal.macros ?? null);
  const currentIndex = meal.selectedIndex ?? 0;

  openModal({
    title: `${meal.label} · ${meal.time}`,
    body: `
      <p>Scegli una variante. Tutte restano nel target giornaliero: 2100 kcal · P 180g · F 50-60g · C 200-250g.</p>
      <div class="alt-list" id="altList">
        ${alternatives.map((items, i) => `
          <button class="alt-card ${i === currentIndex ? "selected" : ""}" type="button" data-alt-index="${i}">
            <div class="alt-card-head">
              <span class="alt-badge">${String.fromCharCode(65 + i)}</span>
              ${i === currentIndex ? `<span class="alt-tag">Selezionata</span>` : ""}
            </div>
            ${renderMacros(macroAlternatives[i])}
            <ul class="alt-items">
              ${items.map((it) => `<li>${escapeHtml(it)}</li>`).join("")}
            </ul>
          </button>
        `).join("")}
      </div>
    `,
    actions: `
      ${meal.overridden ? `<button class="button ghost" type="button" id="resetMeal">Default</button>` : ""}
      <button class="button primary" type="button" data-close-modal>Chiudi</button>
    `,
  });

  $$("[data-alt-index]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const index = Number(btn.dataset.altIndex);
      await putOne("diet_overrides", {
        id: overrideId,
        date,
        mealId: meal.id,
        selectedIndex: index,
        updatedAt: Date.now(),
      });
      closeModal();
      toast("Variante selezionata.");
      onSaved?.();
    });
  });

  $("#resetMeal")?.addEventListener("click", async () => {
    await deleteOne("diet_overrides", overrideId);
    closeModal();
    toast("Variante ripristinata al default.");
    onSaved?.();
  });
}
