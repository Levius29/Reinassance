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
    const override = relevant.get(meal.id);
    if (!override) return { ...meal, overridden: false };
    return { ...meal, items: override.items, overridden: true };
  });
}
