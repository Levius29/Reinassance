import { $, $$, closeModal, escapeHtml, openModal, toast } from "./ui.js";
import { buildOverrideId } from "./diet.js";
import { deleteOne, putOne } from "./db.js";

export async function openMealPicker({ date, meal, onSaved }) {
  const overrideId = buildOverrideId(date, meal.id);
  const alternatives = meal.alternatives ?? [meal.items ?? []];
  const currentIndex = meal.selectedIndex ?? 0;

  openModal({
    title: `${meal.label} · ${meal.time}`,
    body: `
      <p>Scegli una variante. Tutte hanno macronutrienti equivalenti per questo pasto.</p>
      <div class="alt-list" id="altList">
        ${alternatives.map((items, i) => `
          <button class="alt-card ${i === currentIndex ? "selected" : ""}" type="button" data-alt-index="${i}">
            <div class="alt-card-head">
              <span class="alt-badge">${String.fromCharCode(65 + i)}</span>
              ${i === currentIndex ? `<span class="alt-tag">Selezionata</span>` : ""}
            </div>
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
