import test from "node:test";
import assert from "node:assert/strict";

import {
  addDays,
  getDayTypeForDate,
  getDietForDate,
  getInitialActiveDate,
  getProtocolDay,
  getProtocolWeek,
} from "../js/protocol.js";
import {
  buildDefaultDayRecord,
  calculateCompletedPct,
  getChecklistItemsForDayType,
} from "../js/checklist.js";

test("calculates protocol week and day from start date", () => {
  assert.equal(getProtocolWeek("2026-05-18", "2026-05-18"), 1);
  assert.equal(getProtocolWeek("2026-05-16", "2026-05-18"), 1);
  assert.equal(getProtocolDay("2026-05-18", "2026-05-18"), 1);
  assert.equal(getProtocolWeek("2026-05-24", "2026-05-18"), 1);
  assert.equal(getProtocolWeek("2026-05-25", "2026-05-18"), 2);
  assert.equal(getProtocolDay("2026-05-25", "2026-05-18"), 8);
  assert.equal(getProtocolWeek("2026-08-15", "2026-05-18"), 13);
});

test("derives day type from weekday schedule", () => {
  assert.equal(getDayTypeForDate("2026-05-18"), "push");
  assert.equal(getDayTypeForDate("2026-05-19"), "muaythai");
  assert.equal(getDayTypeForDate("2026-05-20"), "pull");
  assert.equal(getDayTypeForDate("2026-05-21"), "rest");
  assert.equal(getDayTypeForDate("2026-05-22"), "legs");
  assert.equal(getDayTypeForDate("2026-05-23"), "muaythai");
  assert.equal(getDayTypeForDate("2026-05-24"), "rest");
});

test("adds days using UTC-safe date math", () => {
  assert.equal(addDays("2026-05-18", 6), "2026-05-24");
  assert.equal(addDays("2026-05-18", 7), "2026-05-25");
});

test("uses start date as active date when protocol starts in the future", () => {
  assert.equal(getInitialActiveDate("2026-05-16", "2026-05-18"), "2026-05-18");
  assert.equal(getInitialActiveDate("2026-05-20", "2026-05-18"), "2026-05-20");
});

test("builds checklist items for strength day", () => {
  const items = getChecklistItemsForDayType("push");
  const ids = items.map((item) => item.id);
  assert.ok(ids.includes("training"));
  assert.ok(ids.includes("suppl_morning"));
  assert.ok(ids.includes("sleep"));
  assert.ok(ids.includes("noPorn"));
  assert.ok(ids.includes("meal_breakfast"));
  assert.ok(ids.includes("meal_lunch"));
  assert.ok(ids.includes("meal_dinner"));
});

test("gets diet plan for date by weekday", () => {
  const diet = getDietForDate("2026-05-18");
  assert.equal(diet.label, "Lunedì");
  assert.deepEqual(diet.meals.map((meal) => meal.id), ["meal_breakfast", "meal_lunch", "meal_dinner"]);
});

test("calculates completion percentage from weighted checkable items", () => {
  const checklist = [
    { id: "training", type: "boolean" },
    { id: "sleep", type: "number", completeWhen: (value) => value >= 7 },
    { id: "steps", type: "number", completeWhen: (value) => value >= 8000 },
    { id: "note", type: "text", counts: false },
  ];

  assert.equal(calculateCompletedPct({ training: true, sleep: 7, steps: 9000 }, checklist), 1);
  assert.equal(calculateCompletedPct({ training: true, sleep: 6, steps: 9000 }, checklist), 0.67);
  assert.equal(calculateCompletedPct({}, checklist), 0);
});

test("creates default day record with protocol metadata", () => {
  const record = buildDefaultDayRecord("2026-05-18", "2026-05-18");
  assert.equal(record.date, "2026-05-18");
  assert.equal(record.weekNumber, 1);
  assert.equal(record.dayType, "push");
  assert.equal(record.completedPct, 0);
  assert.equal(record.items.training, false);
});
