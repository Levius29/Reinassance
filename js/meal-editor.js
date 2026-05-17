import { $, closeModal, escapeHtml, openModal, toast } from "./ui.js";
import { buildOverrideId } from "./diet.js";
import { deleteOne, getOne, putOne } from "./db.js";

export async function openMealEditor({ date, meal, onSaved }) {
  const overrideId = buildOverrideId(date, meal.id);
  const existing = await getOne("diet_overrides", overrideId);
  const initial = existing?.items ?? meal.items;
  const isOverridden = Boolean(existing);

  openModal({
    title: `${meal.label} · ${date}`,
    body: `
      <p>Un item per riga. Salvataggio sostituisce il contenuto del pasto per questa data.</p>
      <label class="field"><span>Items</span><textarea id="mealItems" rows="10">${escapeHtml(initial.join("\n"))}</textarea></label>
    `,
    actions: `
      ${isOverridden ? `<button class="button danger" type="button" id="resetMeal">Reset default</button>` : ""}
      <button class="button ghost" type="button" data-close-modal>Annulla</button>
      <button class="button primary" type="button" id="saveMeal">Salva</button>
    `,
  });

  $("#saveMeal").addEventListener("click", async () => {
    const raw = $("#mealItems").value || "";
    const items = raw.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!items.length) {
      toast("Inserisci almeno un item.", "bad");
      return;
    }
    await putOne("diet_overrides", {
      id: overrideId,
      date,
      mealId: meal.id,
      items,
      updatedAt: Date.now(),
    });
    closeModal();
    toast("Pasto aggiornato.");
    onSaved?.();
  });

  $("#resetMeal")?.addEventListener("click", async () => {
    await deleteOne("diet_overrides", overrideId);
    closeModal();
    toast("Pasto ripristinato al default.");
    onSaved?.();
  });
}
