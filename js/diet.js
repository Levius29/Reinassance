export function buildOverrideId(date, mealId) {
  return `${date}_${mealId}`;
}

export const NUTRITION_TARGETS = {
  kcal: { label: "Kcal", min: 2000, max: 2200, target: 2100, unit: "kcal" },
  protein: { label: "Proteine", min: 180, max: 180, target: 180, unit: "g" },
  fat: { label: "Grassi", min: 50, max: 60, target: 55, unit: "g" },
  carbs: { label: "Carboidrati", min: 200, max: 250, target: 225, unit: "g" },
};

export function mergeDietForDate(date, defaultMeals, overrides) {
  const relevant = new Map();
  for (const override of overrides) {
    if (override.date !== date) continue;
    relevant.set(override.mealId, override);
  }
  return defaultMeals.map((meal) => {
    const alternatives = Array.isArray(meal.alternatives) ? meal.alternatives : [meal.items ?? []];
    const override = relevant.get(meal.id);
    const selectedIndex = override?.selectedIndex ?? 0;
    const safeIndex = selectedIndex >= 0 && selectedIndex < alternatives.length ? selectedIndex : 0;
    return {
      id: meal.id,
      label: meal.label,
      time: meal.time,
      alternatives,
      macroAlternatives: Array.isArray(meal.macros) ? meal.macros : alternatives.map(() => meal.macros ?? null),
      items: alternatives[safeIndex] ?? [],
      macros: meal.macros?.[safeIndex] ?? meal.macros ?? null,
      selectedIndex: safeIndex,
      overridden: Boolean(override),
    };
  });
}

export function calculateDietMacroStatus(meals) {
  const totals = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  let missingMeals = 0;
  for (const meal of meals) {
    if (!meal.macros) {
      missingMeals += 1;
      continue;
    }
    totals.kcal += Number(meal.macros.kcal) || 0;
    totals.protein += Number(meal.macros.protein) || 0;
    totals.fat += Number(meal.macros.fat) || 0;
    totals.carbs += Number(meal.macros.carbs) || 0;
  }
  const rounded = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, Math.round(value)]));
  const inTarget = Object.fromEntries(
    Object.entries(NUTRITION_TARGETS).map(([key, target]) => [key, rounded[key] >= target.min && rounded[key] <= target.max]),
  );
  return {
    targets: NUTRITION_TARGETS,
    totals: rounded,
    inTarget,
    missingMeals,
    verified: missingMeals === 0,
  };
}
