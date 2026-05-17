export function buildOverrideId(date, mealId) {
  return `${date}_${mealId}`;
}

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
      items: alternatives[safeIndex] ?? [],
      selectedIndex: safeIndex,
      overridden: Boolean(override),
    };
  });
}
