// Swing events from the wrist-midpoint trajectory: address P1, top P4, impact P7, finish P10.
// Plus the slow-motion factor guess. Pure module: no DOM, safe in Node tests.
//
// The trap this guards against: the finish is often HIGHER than the top, so the highest
// hands over the whole clip is not the top. The top is the highest hands between address
// and the fastest hand position (which sits around impact).

import {
  px, mid, dist, validFrame, movingAverage,
  LEFT_WRIST, RIGHT_WRIST, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP,
} from './landmarks.js';

/** Fraction of the body scale (shoulder width or torso length, whichever is larger) that counts as motion. */
export const MOTION_FRACTION = 0.02;
/** Fraction of the clip's own peak hand speed that counts as motion (keeps slow motion honest). */
export const PEAK_FRACTION = 0.06;
/** Minimum motion threshold in px so tracking jitter never counts as a swing. */
export const MIN_MOTION_PX = 3;

const NONE = (n, notes) => ({ p1: 0, p4: 0, p7: 0, p10: Math.max(0, n - 1), confidence: 0, notes });

/** Body scale in px on a frame: max(shoulder width, torso length). Null without a pose. */
export function bodyScalePx(frame) {
  if (!validFrame(frame)) return null;
  const ls = px(frame, LEFT_SHOULDER);
  const rs = px(frame, RIGHT_SHOULDER);
  const sw = dist(ls, rs);
  const torso = dist(mid(ls, rs), mid(px(frame, LEFT_HIP), px(frame, RIGHT_HIP)));
  return Math.max(sw, torso);
}

/**
 * Smoothed wrist-midpoint track in px and the speed per sample.
 * Samples without a pose have x, y null and speed 0 (they count as still).
 */
export function wristTrack(clip) {
  const frames = clip.frames;
  const rawX = frames.map((f) => (validFrame(f) ? mid(px(f, LEFT_WRIST), px(f, RIGHT_WRIST)).x : null));
  const rawY = frames.map((f) => (validFrame(f) ? mid(px(f, LEFT_WRIST), px(f, RIGHT_WRIST)).y : null));
  const x = movingAverage(rawX, 5);
  const y = movingAverage(rawY, 5);
  const speed = new Array(frames.length).fill(0);
  for (let i = 1; i < frames.length; i++) {
    if (x[i] === null || x[i - 1] === null) continue;
    speed[i] = Math.hypot(x[i] - x[i - 1], y[i] - y[i - 1]);
  }
  return { x, y, speed };
}

/**
 * findEvents(clip) -> { p1, p4, p7, p10, confidence, notes }
 * Indices into clip.frames. Confidence starts at 1 and drops 0.2 per fallback used;
 * 0 means no usable swing was found and the indices are placeholders.
 */
export function findEvents(clip) {
  const frames = clip && Array.isArray(clip.frames) ? clip.frames : [];
  const n = frames.length;
  const notes = [];
  if (n < 5) return NONE(n, ['Too few frames to find a swing.']);

  const firstValid = frames.findIndex(validFrame);
  if (firstValid < 0) return NONE(n, ['No body was found in any frame.']);
  const missing = frames.reduce((c, f) => c + (validFrame(f) ? 0 : 1), 0);
  if (missing) notes.push(`${missing} of ${n} samples had no body detected; they count as still.`);

  const scale = bodyScalePx(frames[firstValid]);
  const { x, y, speed } = wristTrack(clip);
  // Threshold: a slice of the body size, but never more than a slice of the clip's own peak
  // hand speed. In slow motion the hands move a few px per sample, so the peak keeps the
  // threshold reachable; the floor keeps tracking jitter from counting as a swing.
  const peak = Math.max(...speed);
  const thr = Math.max(MIN_MOTION_PX, Math.min(MOTION_FRACTION * scale, PEAK_FRACTION * peak));
  const moving = speed.map((s) => s > thr);

  // First run of at least 3 moving samples.
  let m = -1;
  for (let i = 0; i + 2 < n; i++) {
    if (moving[i] && moving[i + 1] && moving[i + 2]) { m = i; break; }
  }
  if (m < 0) return NONE(n, [...notes, 'Nothing moved: no swing was found in this clip.']);

  let confidence = 1;
  let p1 = Math.max(0, m - 1);
  if (m <= 1) {
    // Sample 0 can never be "moving" (no previous sample), so a run starting at 0 or 1
    // means the clip was already moving when it began.
    p1 = 0;
    confidence -= 0.2;
    notes.push('The clip starts mid-motion, so address was taken as the first frame.');
  }
  if (x[p1] === null) {
    // Address landed on a sample without a pose: use the nearest valid one before it.
    let j = p1;
    while (j > 0 && x[j] === null) j--;
    if (x[j] === null) { j = p1; while (j < n && x[j] === null) j++; }
    if (j >= n) return NONE(n, [...notes, 'No pose near the start of the swing.']);
    p1 = j;
    confidence -= 0.2;
    notes.push('Address frame had no pose; the nearest tracked frame was used.');
  }

  // Impact candidate: the fastest hands after address.
  let maxSpeed = 0;
  let iMax = -1;
  for (let i = p1 + 1; i < n; i++) {
    if (speed[i] > maxSpeed) { maxSpeed = speed[i]; iMax = i; }
  }
  if (iMax < 0) return NONE(n, [...notes, 'The hands never moved after address.']);

  // Top: the highest hands between address and the impact candidate (smallest y).
  let minY = Infinity;
  for (let i = p1 + 1; i < iMax; i++) if (y[i] !== null && y[i] < minY) minY = y[i];
  if (!Number.isFinite(minY)) return NONE(n, [...notes, 'No tracked hands between address and impact.']);
  const tol = Math.max(2, 0.01 * scale);
  let p4 = -1;
  let p4Speed = Infinity;
  for (let i = p1 + 1; i < iMax; i++) {
    if (y[i] === null || y[i] > minY + tol) continue;
    if (speed[i] < p4Speed) { p4Speed = speed[i]; p4 = i; }
  }
  if (p4 <= p1) return NONE(n, [...notes, 'Could not separate the top of the backswing from address.']);

  // Impact: hands back near their address position at speed.
  const x1 = x[p1];
  const y1 = y[p1];
  let p7 = -1;
  for (let i = p4 + 1; i < n; i++) {
    if (x[i] === null) continue;
    const near = dist({ x: x[i], y: y[i] }, { x: x1, y: y1 }) <= 0.5 * scale;
    if (near && speed[i] >= 0.5 * maxSpeed) { p7 = i; break; }
  }
  if (p7 < 0) {
    p7 = iMax;
    confidence -= 0.2;
    notes.push('The hands did not come back near address, so impact was taken as the fastest hand position.');
  }
  if (p7 <= p4) return NONE(n, [...notes, 'Impact was found before the top; the swing could not be read.']);

  // Finish: the first run of 4 still samples after impact.
  let p10 = -1;
  for (let i = p7 + 1; i + 3 < n; i++) {
    if (!moving[i] && !moving[i + 1] && !moving[i + 2] && !moving[i + 3]) { p10 = i; break; }
  }
  if (p10 < 0) {
    p10 = n - 1;
    confidence -= 0.2;
    notes.push('The clip ended before the finish settled, so finish was taken as the last frame.');
  }
  if (p10 < p7) p10 = p7;

  return { p1, p4, p7, p10, confidence: Math.max(0, Math.round(confidence * 100) / 100), notes };
}

/** Real-time downswing range (seconds) a normal swing falls in. */
export const DOWNSWING_RANGE_S = [0.20, 0.45];
export const FACTORS = [1, 2, 4, 8];

/**
 * inferFactor(clip, events) -> { factor, downswingFileSeconds, reason }
 * Samsung saves slow motion as a 30 fps file with the action already slowed, so the file
 * time of the downswing tells the factor: 1 normal, 4 = 120 fps, 8 = 240 fps.
 */
export function inferFactor(clip, events) {
  const frames = clip && Array.isArray(clip.frames) ? clip.frames : [];
  const t4 = frames[events?.p4]?.t;
  const t7 = frames[events?.p7]?.t;
  const d = Number.isFinite(t4) && Number.isFinite(t7) ? t7 - t4 : null;
  if (clip && clip.fps > 60) {
    return { factor: 1, downswingFileSeconds: d, reason: `The file itself runs at ${Math.round(clip.fps)} fps, so its times are real time.` };
  }
  if (!(d > 0)) {
    return { factor: 1, downswingFileSeconds: d, reason: 'No downswing length could be measured, so the clip is treated as real time.' };
  }
  const [lo, hi] = DOWNSWING_RANGE_S;
  let best = 1;
  let bestGap = Infinity;
  for (const f of FACTORS) {
    const real = d / f;
    const gap = real < lo ? lo - real : real > hi ? real - hi : 0;
    if (gap < bestGap) { bestGap = gap; best = f; }
  }
  const real = d / best;
  const reason = best === 1
    ? `The downswing takes ${d.toFixed(2)} s in the file, a normal length, so the clip is treated as real time.`
    : `The downswing takes ${d.toFixed(2)} s in the file, which is ${real.toFixed(2)} s real time at ${best}x slow motion.`;
  return { factor: best, downswingFileSeconds: d, reason };
}
