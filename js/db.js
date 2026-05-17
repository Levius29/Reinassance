export const DB_NAME = "protocol_db";
export const DB_VERSION = 2;
export const BACKUP_VERSION = 2;
export const MIRROR_KEY = "protocol_backup_v2";

const STORE_DEFS = {
  days: { keyPath: "date", indexes: [{ name: "weekNumber", keyPath: "weekNumber" }] },
  weeks: { keyPath: "weekNumber", indexes: [] },
  diet_overrides: { keyPath: "id", indexes: [{ name: "by-date", keyPath: "date" }] },
  settings: { keyPath: "key", indexes: [] },
  meta: { keyPath: "key", indexes: [] },
};

const STORE_NAMES = Object.keys(STORE_DEFS);
let dbPromise;
let mirrorTimer;

export function createEmptySnapshot() {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date(0).toISOString(),
    days: [],
    weeks: [],
    diet_overrides: [],
    settings: [],
    meta: [],
  };
}

export function normalizeSnapshot(payload) {
  return {
    version: payload?.version ?? BACKUP_VERSION,
    exportedAt: payload?.exportedAt ?? new Date().toISOString(),
    days: Array.isArray(payload?.days) ? payload.days : [],
    weeks: Array.isArray(payload?.weeks) ? payload.weeks : [],
    diet_overrides: Array.isArray(payload?.diet_overrides) ? payload.diet_overrides : [],
    settings: Array.isArray(payload?.settings) ? payload.settings : [],
    meta: Array.isArray(payload?.meta) ? payload.meta : [],
  };
}

export function validateBackupPayload(payload) {
  if (!payload || typeof payload !== "object") return { ok: false, error: "Backup non valido." };
  if (payload.version !== BACKUP_VERSION && payload.version !== 1) {
    return { ok: false, error: "Versione backup non supportata." };
  }
  for (const storeName of STORE_NAMES) {
    if (payload[storeName] !== undefined && !Array.isArray(payload[storeName])) {
      return { ok: false, error: `Store ${storeName} non valido.` };
    }
  }
  return { ok: true, error: "" };
}

function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

export function openDB() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB non disponibile in questo browser."));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains("labs")) db.deleteObjectStore("labs");
      for (const [name, def] of Object.entries(STORE_DEFS)) {
        const store = db.objectStoreNames.contains(name)
          ? request.transaction.objectStore(name)
          : db.createObjectStore(name, {
              keyPath: def.keyPath,
              autoIncrement: def.autoIncrement === true,
            });
        for (const index of def.indexes) {
          if (!store.indexNames.contains(index.name)) store.createIndex(index.name, index.keyPath);
        }
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
  return dbPromise;
}

export async function getAll(storeName) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readonly");
  return requestToPromise(tx.objectStore(storeName).getAll());
}

export async function getOne(storeName, key) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readonly");
  return requestToPromise(tx.objectStore(storeName).get(key));
}

export async function putOne(storeName, value) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  const result = await requestToPromise(tx.objectStore(storeName).put(value));
  await txDone(tx);
  scheduleMirrorWrite();
  return result;
}

export async function deleteOne(storeName, key) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  await requestToPromise(tx.objectStore(storeName).delete(key));
  await txDone(tx);
  scheduleMirrorWrite();
}

export async function clearStore(storeName) {
  const db = await openDB();
  const tx = db.transaction(storeName, "readwrite");
  await requestToPromise(tx.objectStore(storeName).clear());
  await txDone(tx);
  scheduleMirrorWrite();
}

export async function getSetting(key, fallback = null) {
  const record = await getOne("settings", key);
  return record?.value ?? fallback;
}

export function setSetting(key, value) {
  return putOne("settings", { key, value, updatedAt: Date.now() });
}

export async function exportAll() {
  const snapshot = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
  };
  for (const storeName of STORE_NAMES) {
    snapshot[storeName] = await getAll(storeName);
  }
  return snapshot;
}

export async function importAll(payload, { replace = true } = {}) {
  const normalized = normalizeSnapshot(payload);
  const validation = validateBackupPayload(normalized);
  if (!validation.ok) throw new Error(validation.error);

  const db = await openDB();
  const tx = db.transaction(STORE_NAMES, "readwrite");
  if (replace) {
    for (const storeName of STORE_NAMES) tx.objectStore(storeName).clear();
  }
  for (const storeName of STORE_NAMES) {
    const store = tx.objectStore(storeName);
    for (const record of normalized[storeName]) store.put(record);
  }
  await txDone(tx);
  await writeMirrorNow();
  return normalized;
}

export async function isDatabaseEmpty() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAMES, "readonly");
  const counts = await Promise.all(STORE_NAMES.map((storeName) => requestToPromise(tx.objectStore(storeName).count())));
  return counts.every((count) => count === 0);
}

export function readMirror() {
  if (typeof localStorage === "undefined") return null;
  const legacyKey = "protocol_backup_v1";
  const raw = localStorage.getItem(MIRROR_KEY) ?? localStorage.getItem(legacyKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const validation = validateBackupPayload(parsed);
    if (!validation.ok) return null;
    return normalizeSnapshot(parsed);
  } catch {
    return null;
  }
}

export async function writeMirrorNow() {
  if (typeof localStorage === "undefined") return;
  const snapshot = await exportAll();
  localStorage.setItem(MIRROR_KEY, JSON.stringify(snapshot));
}

export function scheduleMirrorWrite(delay = 2000) {
  if (typeof localStorage === "undefined") return;
  clearTimeout(mirrorTimer);
  mirrorTimer = setTimeout(() => {
    writeMirrorNow().catch((error) => console.error("Mirror backup failed", error));
  }, delay);
}

export async function maybeRestoreMirror(confirmRestore) {
  const mirror = readMirror();
  if (!mirror) return false;
  if (!(await isDatabaseEmpty())) return false;
  const shouldRestore = typeof confirmRestore === "function" ? await confirmRestore(mirror) : true;
  if (!shouldRestore) return false;
  await importAll(mirror, { replace: true });
  return true;
}

export function downloadSnapshot(snapshot, dateString) {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `protocollo-backup-${dateString}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
