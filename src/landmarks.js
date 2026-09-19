// MediaPipe Pose landmark indices and small geometry helpers.
// "left" and "right" are the PERSON's left and right, not the image's.
// Pure module: no DOM, safe to import in Node tests.

export const NOSE = 0;
export const LEFT_EYE = 2;
export const RIGHT_EYE = 5;
export const LEFT_EAR = 7;
export const RIGHT_EAR = 8;
export const LEFT_SHOULDER = 11;
export const RIGHT_SHOULDER = 12;
export const LEFT_ELBOW = 13;
export const RIGHT_ELBOW = 14;
export const LEFT_WRIST = 15;
export const RIGHT_WRIST = 16;
export const LEFT_HIP = 23;
export const RIGHT_HIP = 24;
export const LEFT_KNEE = 25;
export const RIGHT_KNEE = 26;
export const LEFT_ANKLE = 27;
export const RIGHT_ANKLE = 28;
export const LEFT_HEEL = 29;
export const RIGHT_HEEL = 30;
export const LEFT_FOOT_INDEX = 31;
export const RIGHT_FOOT_INDEX = 32;

export const LANDMARK_COUNT = 33;

// Bones for drawing the skeleton (pairs of landmark indices).
export const BONES = [
  [LEFT_SHOULDER, RIGHT_SHOULDER],
  [LEFT_SHOULDER, LEFT_ELBOW], [LEFT_ELBOW, LEFT_WRIST],
  [RIGHT_SHOULDER, RIGHT_ELBOW], [RIGHT_ELBOW, RIGHT_WRIST],
  [LEFT_SHOULDER, LEFT_HIP], [RIGHT_SHOULDER, RIGHT_HIP],
  [LEFT_HIP, RIGHT_HIP],
  [LEFT_HIP, LEFT_KNEE], [LEFT_KNEE, LEFT_ANKLE],
  [RIGHT_HIP, RIGHT_KNEE], [RIGHT_KNEE, RIGHT_ANKLE],
  [LEFT_ANKLE, LEFT_HEEL], [LEFT_HEEL, LEFT_FOOT_INDEX], [LEFT_ANKLE, LEFT_FOOT_INDEX],
  [RIGHT_ANKLE, RIGHT_HEEL], [RIGHT_HEEL, RIGHT_FOOT_INDEX], [RIGHT_ANKLE, RIGHT_FOOT_INDEX],
  [LEFT_EAR, NOSE], [RIGHT_EAR, NOSE],
];

const LEFT_SIDE = Object.freeze({
  shoulder: LEFT_SHOULDER, elbow: LEFT_ELBOW, wrist: LEFT_WRIST, hip: LEFT_HIP,
  knee: LEFT_KNEE, ankle: LEFT_ANKLE, heel: LEFT_HEEL, foot: LEFT_FOOT_INDEX, ear: LEFT_EAR,
});
const RIGHT_SIDE = Object.freeze({
  shoulder: RIGHT_SHOULDER, elbow: RIGHT_ELBOW, wrist: RIGHT_WRIST, hip: RIGHT_HIP,
  knee: RIGHT_KNEE, ankle: RIGHT_ANKLE, heel: RIGHT_HEEL, foot: RIGHT_FOOT_INDEX, ear: RIGHT_EAR,
});

/** Lead side = the side nearest the target. Left for a right-handed golfer. */
export function sides(handed = 'right') {
  return handed === 'left'
    ? { lead: RIGHT_SIDE, trail: LEFT_SIDE }
    : { lead: LEFT_SIDE, trail: RIGHT_SIDE };
}

/** True when the frame carries a detected pose. */
export function validFrame(frame) {
  return !!(frame && Array.isArray(frame.lm) && Array.isArray(frame.world));
}

/** Image landmark in PIXELS (x right, y down). */
export function px(frame, idx) {
  const l = frame.lm[idx];
  return { x: l.x * frame.w, y: l.y * frame.h, v: l.visibility ?? 1 };
}

/** World landmark in metres (origin at hip centre, y down, z toward camera). */
export function world(frame, idx) {
  const l = frame.world[idx];
  return { x: l.x, y: l.y, z: l.z, v: l.visibility ?? 1 };
}

export function mid(a, b) {
  const out = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, v: Math.min(a.v ?? 1, b.v ?? 1) };
  if (a.z !== undefined && b.z !== undefined) out.z = (a.z + b.z) / 2;
  return out;
}

export function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
}

/** Angle at point b (degrees, 0..180) between ba and bc. Works for 2D or 3D. Null if degenerate. */
export function jointAngleDeg(a, b, c) {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (b.z ?? 0) };
  const m = Math.hypot(v1.x, v1.y, v1.z) * Math.hypot(v2.x, v2.y, v2.z);
  if (!m) return null;
  const cos = (v1.x * v2.x + v1.y * v2.y + v1.z * v2.z) / m;
  return Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
}

/** Centred moving average with window k (odd). Nulls are skipped, edges shrink the window. */
export function movingAverage(arr, k = 5) {
  const half = Math.floor(k / 2);
  const out = new Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(arr.length - 1, i + half); j++) {
      if (arr[j] === null || arr[j] === undefined || Number.isNaN(arr[j])) continue;
      sum += arr[j]; n++;
    }
    out[i] = n ? sum / n : null;
  }
  return out;
}

/** Mean visibility of the given landmark indices on a frame (0..1), or 0 if no pose. */
export function avgVisibility(frame, idxs) {
  if (!validFrame(frame)) return 0;
  let s = 0;
  for (const i of idxs) s += frame.lm[i].visibility ?? 1;
  return idxs.length ? s / idxs.length : 0;
}

export const CORE_IDXS = [LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP];
