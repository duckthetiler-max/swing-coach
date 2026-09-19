// Pure helpers behind src/pose.js: sample strides, sample times, the motion window,
// detector timestamps, result conversion and progress reporting.
// No DOM, no MediaPipe, so Node can test every line.

import {
  LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_WRIST, RIGHT_WRIST, LEFT_HIP, RIGHT_HIP, LANDMARK_COUNT,
  validFrame, px, mid, dist,
} from './landmarks.js';

/** Coarse pass budget: at most this many samples across the whole file. */
export const COARSE_MAX_SAMPLES = 120;
/** Wrist-midpoint speed counts as motion above this fraction of the shoulder width. */
export const MOTION_FRACTION = 0.04;
/** File seconds added on each side of the motion window. */
export const WINDOW_PAD_S = 0.5;

/** Warnings attached to clip.warnings. Short and plain, shown to Duck as they are. */
export const NO_POSE_WARNING = 'No body was found in the clip. Film the whole body with the head in frame.';
export const NO_MOTION_WARNING = 'Nothing moved in the clip. Film one full swing with a still second at address first.';

/**
 * Decoded frames between samples so that `totalDecodedFrames` frames give at most
 * `maxSamples` samples. Always an integer >= 1.
 */
export function chooseStride(totalDecodedFrames, maxSamples) {
  const frames = Number.isFinite(totalDecodedFrames) ? Math.floor(totalDecodedFrames) : 0;
  const cap = Number.isFinite(maxSamples) && maxSamples >= 1 ? Math.floor(maxSamples) : 1;
  if (frames <= cap) return 1;
  return Math.ceil(frames / cap);
}

/**
 * Sample times in file seconds: startT, startT + step, ... while below endT.
 * The first time is always included, so a degenerate window still yields one sample.
 */
export function sampleTimes(startT, endT, step) {
  if (!Number.isFinite(startT) || !Number.isFinite(endT)) throw new Error('sampleTimes needs finite start and end times.');
  if (!(step > 0)) throw new Error('sampleTimes needs a positive step.');
  const times = [];
  const eps = step * 1e-6;
  for (let k = 0; ; k++) {
    const t = startT + k * step;
    if (k > 0 && t >= endT - eps) break;
    times.push(Math.round(t * 1e6) / 1e6);
  }
  return times;
}

/**
 * Find when the body moved from coarse samples of { t, wristMid: {x,y} | null,
 * shoulderWidth: px | null }. Speed per sample = wrist-midpoint distance since the previous
 * sample. A sample moves when its speed exceeds MOTION_FRACTION of the shoulder width at
 * that sample. The window runs from the first to the last moving sample, padded by
 * WINDOW_PAD_S each side (or to the neighbouring still sample when the samples are further
 * apart than the pad), clamped to [0, duration].
 * No pose or no motion => the whole file, moved false, and a warning in notes.
 */
export function findMotionWindow(samples, opts = {}) {
  const pad = Number.isFinite(opts.pad) ? opts.pad : WINDOW_PAD_S;
  const fraction = Number.isFinite(opts.fraction) ? opts.fraction : MOTION_FRACTION;
  const list = Array.isArray(samples) ? samples : [];
  const lastT = list.length ? list[list.length - 1].t : 0;
  const duration = Number.isFinite(opts.duration) ? Math.max(0, opts.duration) : lastT;
  const whole = { startT: 0, endT: duration, moved: false, notes: [] };

  if (!list.some((s) => s && s.wristMid)) {
    whole.notes.push(NO_POSE_WARNING);
    return whole;
  }

  let first = -1;
  let last = -1;
  for (let k = 1; k < list.length; k++) {
    if (!isMoving(list[k - 1], list[k], fraction)) continue;
    if (first < 0) first = k;
    last = k;
  }
  if (first < 0) {
    whole.notes.push(NO_MOTION_WARNING);
    return whole;
  }

  const stillBefore = list[first - 1].t;
  const stillAfter = last < list.length - 1 ? list[last + 1].t : list[last].t;
  return {
    startT: clamp(Math.min(stillBefore, list[first].t - pad), 0, duration),
    endT: clamp(Math.max(stillAfter, list[last].t + pad), 0, duration),
    moved: true,
    notes: [],
  };
}

function isMoving(prev, cur, fraction) {
  if (!prev || !cur || !prev.wristMid || !cur.wristMid) return false;
  // Body scale: the larger of shoulder width and torso length, so a down-the-line clip
  // (shoulders overlapping, width near zero) still gets a sensible threshold.
  const scale = cur.bodyScale > 0 ? cur.bodyScale : cur.shoulderWidth;
  if (!(scale > 0)) return false;
  const speed = Math.hypot(cur.wristMid.x - prev.wristMid.x, cur.wristMid.y - prev.wristMid.y);
  return speed > fraction * scale;
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Next detector timestamp in integer ms, strictly greater than lastMs.
 * Pass lastMs = -1 (or null) before the first sample.
 */
export function nextTimestamp(lastMs, tSeconds) {
  const last = Number.isFinite(lastMs) ? Math.floor(lastMs) : -1;
  const wanted = Number.isFinite(tSeconds) ? Math.round(tSeconds * 1000) : 0;
  return Math.max(wanted, last + 1);
}

/**
 * Convert a PoseLandmarkerResult into a Frame. Uses the first pose only. Both the image
 * landmarks and the world landmarks must be present, else lm and world are null.
 */
export function resultToFrame(result, i, t, w, h) {
  const lm = firstPose(result && result.landmarks);
  const world = firstPose(result && result.worldLandmarks);
  if (!lm || !world) return { i, t, w, h, lm: null, world: null };
  return { i, t, w, h, lm, world };
}

function firstPose(poses) {
  if (!Array.isArray(poses) || !poses.length) return null;
  const pose = poses[0];
  if (!Array.isArray(pose) || pose.length < LANDMARK_COUNT) return null;
  const out = new Array(LANDMARK_COUNT);
  for (let k = 0; k < LANDMARK_COUNT; k++) {
    const l = pose[k];
    if (!l || !Number.isFinite(l.x) || !Number.isFinite(l.y)) return null;
    out[k] = {
      x: l.x,
      y: l.y,
      z: Number.isFinite(l.z) ? l.z : 0,
      // Same default as landmarks.js when the model reports no visibility.
      visibility: Number.isFinite(l.visibility) ? l.visibility : 1,
    };
  }
  return out;
}

/** Reduce a Frame to the coarse-pass sample shape used by findMotionWindow (pixels). */
export function frameToSample(frame) {
  const t = frame && Number.isFinite(frame.t) ? frame.t : 0;
  if (!validFrame(frame)) return { t, wristMid: null, shoulderWidth: null };
  const wm = mid(px(frame, LEFT_WRIST), px(frame, RIGHT_WRIST));
  const ls = px(frame, LEFT_SHOULDER);
  const rs = px(frame, RIGHT_SHOULDER);
  const shoulderWidth = dist(ls, rs);
  const torsoLength = dist(mid(ls, rs), mid(px(frame, LEFT_HIP), px(frame, RIGHT_HIP)));
  return { t, wristMid: { x: wm.x, y: wm.y }, shoulderWidth, bodyScale: Math.max(shoulderWidth, torsoLength) };
}

/**
 * Progress across several passes. `createProgress(onProgress)` returns `pass(label, lo, hi)`;
 * each pass returns `tick(done, total)` which reports pct in lo..hi at done 0, every
 * `every` samples and at done == total. pct never goes down and never passes 100.
 */
export function createProgress(onProgress, every = 10) {
  const report = typeof onProgress === 'function' ? onProgress : () => {};
  let lastPct = 0;
  return function pass(label, lo, hi) {
    return function tick(done, total) {
      if (done !== 0 && done !== total && done % every !== 0) return;
      const frac = total > 0 ? Math.min(1, done / total) : 1;
      const pct = Math.round(lo + (hi - lo) * frac);
      lastPct = Math.max(lastPct, Math.min(100, pct));
      report(lastPct, label);
    };
  };
}
