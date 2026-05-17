import test from "node:test";
import assert from "node:assert/strict";
import { mergeDietForDate } from "../js/diet.js";

const defaultMeals = [
  { id: "meal_breakfast", label: "Colazione", time: "08:00", items: ["A"] },
  { id: "meal_lunch", label: "Pranzo", time: "13:00", items: ["B"] },
  { id: "meal_dinner", label: "Cena", time: "20:00", items: ["C"] },
];

test("returns defaults when no overrides", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, []);
  assert.deepEqual(merged.map((m) => m.items), [["A"], ["B"], ["C"]]);
});

test("overrides matching meal for date", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["X", "Y"] },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["X", "Y"]);
  assert.deepEqual(merged.find((m) => m.id === "meal_breakfast").items, ["A"]);
});

test("ignores overrides for other dates", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-18_meal_lunch", date: "2026-05-18", mealId: "meal_lunch", items: ["Z"] },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["B"]);
});

test("last override wins for duplicate id", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["first"], updatedAt: 1 },
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["last"], updatedAt: 2 },
  ]);
  assert.deepEqual(merged.find((m) => m.id === "meal_lunch").items, ["last"]);
});

test("preserves meal order and time/label", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_dinner", date: "2026-05-17", mealId: "meal_dinner", items: ["new"] },
  ]);
  assert.deepEqual(merged.map((m) => m.id), ["meal_breakfast", "meal_lunch", "meal_dinner"]);
  assert.equal(merged[2].time, "20:00");
  assert.equal(merged[2].label, "Cena");
});

test("marks overridden meals so UI can show indicator", () => {
  const merged = mergeDietForDate("2026-05-17", defaultMeals, [
    { id: "2026-05-17_meal_lunch", date: "2026-05-17", mealId: "meal_lunch", items: ["X"] },
  ]);
  assert.equal(merged.find((m) => m.id === "meal_lunch").overridden, true);
  assert.equal(merged.find((m) => m.id === "meal_breakfast").overridden, false);
});
