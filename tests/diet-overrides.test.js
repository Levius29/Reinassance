import test from "node:test";
import assert from "node:assert/strict";
import { calculateDietMacroStatus, mergeDietForDate, NUTRITION_TARGETS } from "../js/diet.js";
import { DIET_PLAN } from "../js/protocol.js";

const defaultMeals = [
  { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [["A1"], ["A2"], ["A3"]] },
  { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [["B1"], ["B2"]] },
  { id: "meal_dinner", label: "Cena", time: "20:00", alternatives: [["C1"], ["C2"], ["C3"]] },
];

test("reports nutrition targets as unverified when alternatives have no macro data", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, []);
  const status = calculateDietMacroStatus(merged);
  assert.equal(status.verified, false);
  assert.equal(status.missingMeals, 3);
  assert.deepEqual(status.targets, NUTRITION_TARGETS);
});

test("calculates macro totals and target ranges when macro data exists", () => {
  const meals = [
    { id: "meal_breakfast", macros: { kcal: 700, protein: 60, fat: 20, carbs: 70 } },
    { id: "meal_lunch", macros: { kcal: 700, protein: 60, fat: 20, carbs: 80 } },
    { id: "meal_dinner", macros: { kcal: 700, protein: 60, fat: 15, carbs: 70 } },
  ];
  const status = calculateDietMacroStatus(meals);
  assert.equal(status.verified, true);
  assert.deepEqual(status.totals, { kcal: 2100, protein: 180, fat: 55, carbs: 220 });
  assert.equal(status.inTarget.kcal, true);
  assert.equal(status.inTarget.protein, true);
  assert.equal(status.inTarget.fat, true);
  assert.equal(status.inTarget.carbs, true);
});

test("every diet plan variant combination stays inside daily macro targets", () => {
  for (const [weekday, plan] of Object.entries(DIET_PLAN)) {
    for (const meal of plan.meals) {
      assert.equal(meal.macros.length, meal.alternatives.length, `${plan.label} ${meal.label} macro count`);
    }

    for (let breakfast = 0; breakfast < 3; breakfast += 1) {
      for (let lunch = 0; lunch < 3; lunch += 1) {
        for (let dinner = 0; dinner < 3; dinner += 1) {
          const merged = mergeDietForDate("2026-05-17", plan.meals, [
            { date: "2026-05-17", mealId: "meal_breakfast", selectedIndex: breakfast },
            { date: "2026-05-17", mealId: "meal_lunch", selectedIndex: lunch },
            { date: "2026-05-17", mealId: "meal_dinner", selectedIndex: dinner },
          ]);
          const status = calculateDietMacroStatus(merged);
          assert.equal(status.verified, true, `${plan.label} combo ${breakfast}${lunch}${dinner}`);
          assert.equal(Object.values(status.inTarget).every(Boolean), true, `${weekday} combo ${breakfast}${lunch}${dinner}`);
          assert.deepEqual(status.totals, { kcal: 2100, protein: 180, fat: 54, carbs: 225 });
        }
      }
    }
  }
});

test("returns first alternative when no override", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, []);
  assert.deepEqual(merged.map((m) => m.items), [["A1"], ["B1"], ["C1"]]);
  assert.equal(merged.every((m) => m.selectedIndex === 0), true);
  assert.equal(merged.every((m) => m.overridden === false), true);
});

test("override picks alternative by selectedIndex", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", selectedIndex: 1 },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["B2"]);
  assert.equal(merged.find((m) => m.id === "meal_lunch").selectedIndex, 1);
  assert.equal(merged.find((m) => m.id === "meal_lunch").overridden, true);
  assert.deepEqual(merged.find((m) => m.id === "meal_breakfast").items, ["A1"]);
});

test("ignores overrides for other dates", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-18_meal_lunch", date: "2026-05-18", mealId: "meal_lunch", selectedIndex: 1 },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["B1"]);
  assert.equal(merged.find((m) => m.id === "meal_lunch").overridden, false);
});

test("last override wins for duplicate id", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", selectedIndex: 0, updatedAt: 1 },
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", selectedIndex: 1, updatedAt: 2 },
  ]);
  assert.equal(merged.find((m) => m.id === "meal_lunch").selectedIndex, 1);
});

test("out-of-bounds selectedIndex falls back to first alternative", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", selectedIndex: 99 },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["B1"]);
  assert.equal(merged.find((m) => m.id === "meal_lunch").selectedIndex, 0);
});

test("preserves order and exposes alternatives array", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, []);
  assert.deepEqual(merged.map((m) => m.id), ["meal_breakfast", "meal_lunch", "meal_dinner"]);
  assert.equal(merged[2].time, "20:00");
  assert.equal(merged[2].label, "Cena");
  assert.deepEqual(merged[2].alternatives, [["C1"], ["C2"], ["C3"]]);
});

test("legacy meal with items but no alternatives still works", () => {
  const legacy = [{ id: "meal_legacy", label: "Legacy", time: "12:00", items: ["X"] }];
  const merged = mergeDietForDate("2026-05-17", legacy, []);
  assert.deepEqual(merged[0].items, ["X"]);
  assert.deepEqual(merged[0].alternatives, [["X"]]);
});
