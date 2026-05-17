import test from "node:test";
import assert from "node:assert/strict";

import {
  BACKUP_VERSION,
  createEmptySnapshot,
  normalizeSnapshot,
  validateBackupPayload,
} from "../js/db.js";

test("creates empty backup snapshot with all stores", () => {
  const snapshot = createEmptySnapshot();
  assert.equal(snapshot.version, BACKUP_VERSION);
  assert.deepEqual(snapshot.days, []);
  assert.deepEqual(snapshot.weeks, []);
  assert.deepEqual(snapshot.labs, []);
  assert.deepEqual(snapshot.settings, []);
  assert.deepEqual(snapshot.meta, []);
});

test("normalizes missing optional stores", () => {
  const snapshot = normalizeSnapshot({
    version: BACKUP_VERSION,
    days: [{ date: "2026-05-18" }],
  });
  assert.equal(snapshot.days.length, 1);
  assert.deepEqual(snapshot.weeks, []);
  assert.deepEqual(snapshot.labs, []);
});

test("validates backup payload shape", () => {
  assert.equal(validateBackupPayload(createEmptySnapshot()).ok, true);
  assert.equal(validateBackupPayload({}).ok, false);
  assert.equal(validateBackupPayload({ version: BACKUP_VERSION, days: {} }).ok, false);
  assert.equal(validateBackupPayload({ version: 999, days: [] }).ok, false);
});
