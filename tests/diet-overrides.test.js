import test from "node:test";
import assert from "node:assert/strict";
import { mergeDietForDate } from "../js/diet.js";

const defaultMeals = [
  { id: "meal_breakfast", label: "Colazione", time: "08:00", alternatives: [["A1"], ["A2"], ["A3"]] },
  { id: "meal_lunch", label: "Pranzo", time: "13:00", alternatives: [["B1"], ["B2"]] },
  { id: "meal_dinner", label: "Cena", time: "20:00", alternatives: [["C1"], ["C2"], ["C3"]] },
];

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
