// Storage for Swing Coach.
// Saved swings live in IndexedDB ('swing-coach' v1, store 'swings', index 'date').
// Settings live in localStorage. Nothing here touches the DOM or window at import
// time, so the pure helpers (mergeSettings) can be tested in Node.

import { CLUB_IDS, DEFAULT_BAG, isClub, normaliseBag } from './clubs.js';

const DB_NAME = 'swing-coach';
const DB_VERSION = 1;
const STORE = 'swings';
const SETTINGS_KEY = 'swing-coach.settings';

export const DEFAULT_SETTINGS = Object.freeze({
  heightCm: null,
  handed: 'right',
  model: 'full',
  factorDefault: 'auto',
  protect: true,
  club: '7i',
  swingModel: 'neutral_rotary',
  protectStage: 1,
  liveModel: 'lite',
  speakCue: false,
  coachHeadline: true,
  camera: 'environment',
  bag: DEFAULT_BAG,
  overlayStyle: 'markers',
});

export const HANDED_OPTIONS = ['right', 'left'];
export const MODEL_OPTIONS = ['lite', 'full', 'heavy'];
export const FACTOR_OPTIONS = [1, 2, 4, 8];
export const CLUB_OPTIONS = CLUB_IDS;
export const SWING_MODEL_OPTIONS = ['neutral_rotary', 'stack_and_tilt', 'one_plane', 'two_plane', 'classic', 'single_plane', 'a_swing', 'austin'];
export const PROTECT_STAGES = [1, 2, 3, 4, 5];
export const LIVE_MODEL_OPTIONS = ['lite', 'full'];
export const CAMERA_OPTIONS = ['environment', 'user'];

/** Returns the cleaned value for one settings key, or undefined when the value is not acceptable. */
export function normaliseSetting(key, value) {
  switch (key) {
    case 'heightCm': {
      if (value === null || value === undefined || value === '') return null;
      const n = Number(value);
      return Number.isFinite(n) && n >= 100 && n <= 250 ? Math.round(n) : undefined;
    }
    case 'handed':
      return HANDED_OPTIONS.includes(value) ? value : undefined;
    case 'model':
      return MODEL_OPTIONS.includes(value) ? value : undefined;
    case 'factorDefault': {
      if (value === 'auto') return 'auto';
      const n = Number(value);
      return FACTOR_OPTIONS.includes(n) ? n : undefined;
    }
    case 'protect':
      return typeof value === 'boolean' ? value : undefined;
    case 'club':
      return isClub(value) ? value : undefined;
    case 'bag':
      return Array.isArray(value) ? normaliseBag(value) : undefined;
    case 'overlayStyle':
      return value === 'markers' || value === 'figure' ? value : undefined;
    case 'swingModel':
      return SWING_MODEL_OPTIONS.includes(value) ? value : undefined;
    case 'protectStage': {
      const n = Number(value);
      return PROTECT_STAGES.includes(n) ? n : undefined;
    }
    case 'liveModel':
      return LIVE_MODEL_OPTIONS.includes(value) ? value : undefined;
    case 'speakCue':
    case 'coachHeadline':
      return typeof value === 'boolean' ? value : undefined;
    case 'camera':
      return CAMERA_OPTIONS.includes(value) ? value : undefined;
    default:
      return undefined;
  }
}

/**
 * Pure merge: current settings (possibly stale or corrupt) plus a patch.
 * Every key ends up valid. A bad patch value keeps the current value; a bad
 * current value falls back to the default. Unknown keys are dropped.
 */
export function mergeSettings(current, patch) {
  const out = {};
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    const cur = normaliseSetting(key, current ? current[key] : undefined);
    const base = cur === undefined ? DEFAULT_SETTINGS[key] : cur;
    if (patch && Object.prototype.hasOwnProperty.call(patch, key)) {
      const next = normaliseSetting(key, patch[key]);
      out[key] = next === undefined ? base : next;
    } else {
      out[key] = base;
    }
  }
  return out;
}

function storage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

export function getSettings() {
  let parsed = null;
  const ls = storage();
  if (ls) {
    try {
      const raw = ls.getItem(SETTINGS_KEY);
      parsed = raw ? JSON.parse(raw) : null;
    } catch {
      parsed = null;
    }
  }
  return mergeSettings(parsed, null);
}

export function saveSettings(patch) {
  const next = mergeSettings(getSettings(), patch);
  const ls = storage();
  if (ls) {
    try {
      ls.setItem(SETTINGS_KEY, JSON.stringify(next));
    } catch {
      // Private mode or full storage: settings live for this page load only.
    }
  }
  return next;
}

// ---- IndexedDB ----

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const idb = globalThis.indexedDB;
    if (!idb) {
      reject(new Error('This browser has no IndexedDB, so swings cannot be saved.'));
      return;
    }
    const req = idb.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const os = db.createObjectStore(STORE, { keyPath: 'id' });
        os.createIndex('date', 'date', { unique: false });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error || new Error('Could not open the swing database.'));
    req.onblocked = () => reject(new Error('The swing database is blocked by another tab.'));
  });
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function request(mode, run) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error || new Error('Database transaction failed.'));
    t.onabort = () => reject(t.error || new Error('Database transaction aborted.'));
  }));
}

/** Store a SwingRecord. Overwrites a record with the same id. Resolves with the id. */
export async function saveSwing(rec) {
  if (!rec || typeof rec.id !== 'string' || !rec.id) throw new Error('A swing record needs an id.');
  if (typeof rec.date !== 'string' || !rec.date) throw new Error('A swing record needs an ISO date.');
  await request('readwrite', (store) => store.put(rec));
  return rec.id;
}

/** All saved swings, newest first. Optional club filter. */
export async function listSwings({ club } = {}) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const out = [];
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).index('date').openCursor(null, 'prev');
    req.onsuccess = () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(out);
        return;
      }
      if (!club || cursor.value.club === club) out.push(cursor.value);
      cursor.continue();
    };
    req.onerror = () => reject(req.error || new Error('Could not list swings.'));
  });
}

export async function getSwing(id) {
  const rec = await request('readonly', (store) => store.get(id));
  return rec || null;
}

export async function deleteSwing(id) {
  await request('readwrite', (store) => store.delete(id));
  return true;
}
