// Camera angle detection (face-on or down-the-line) and the direction signs.
// Pure module: no DOM, safe to import in Node tests.
//
// At address the ratio shoulder width / torso length (both in image pixels) tells the
// views apart: shoulders side by side => face-on, shoulders one behind the other =>
// down-the-line. Direction signs come from the landmarks, never from assumptions.

import {
  px, mid, dist, validFrame, sides, avgVisibility,
  LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, CORE_IDXS,
} from './landmarks.js';

/** ratio above this => face-on. */
export const FO_RATIO = 0.55;
/** ratio below this => down-the-line. */
export const DTL_RATIO = 0.30;

// Landmarks under this visibility are treated as missing for the direction signs.
const MIN_VIS = 0.2;

/** A direction only counts when it is clearly there and steady across the address frames. */
export const DIR = Object.freeze({
  /**
   * Toe minus heel, as a share of the torso length, needed for a frame to vote. Down-the-line the
   * feet point at the ball and the difference is about half a torso; the apparent foot length is
   * no use as the yardstick because it shrinks with the difference itself.
   */
  footDeadband: 0.12,
  /** Lead minus trail shoulder, as a share of the torso length, needed for a frame to vote. */
  shoulderDeadband: 0.15,
  /** Frames looked at, ending at address. */
  window: 8,
  /** Share of the voting frames that must agree. */
  agree: 0.75,
});

const UNKNOWN = Object.freeze({ view: 'unknown', ratio: null, confidence: 0, targetDir: 0, ballDir: 0 });

function sign(v) {
  if (v > 0) return 1;
  if (v < 0) return -1;
  return 0;
}

/** Image point in px, or null when the landmark is absent or too faint. */
function point(frame, idx, minVis = 0) {
  const l = frame.lm[idx];
  if (!l || !Number.isFinite(l.x) || !Number.isFinite(l.y)) return null;
  if ((l.visibility ?? 1) < minVis) return null;
  return px(frame, idx);
}

/**
 * Body scale of one frame in image px: shoulder width, torso length (shoulder mid to
 * hip mid) and their ratio. All null when the frame has no usable pose.
 */
export function bodyScale(frame) {
  const none = { shoulderWidth: null, torsoLength: null, ratio: null };
  if (!validFrame(frame)) return none;
  const ls = point(frame, LEFT_SHOULDER);
  const rs = point(frame, RIGHT_SHOULDER);
  const lh = point(frame, LEFT_HIP);
  const rh = point(frame, RIGHT_HIP);
  if (!ls || !rs || !lh || !rh) return none;
  const shoulderWidth = dist(ls, rs);
  const torsoLength = dist(mid(ls, rs), mid(lh, rh));
  const ratio = torsoLength > 0 ? shoulderWidth / torsoLength : null;
  return { shoulderWidth, torsoLength, ratio };
}

/** The address frame: events.p1 when it carries a pose, else the first valid frame. */
export function addressFrame(clip, events) {
  const frames = (clip && Array.isArray(clip.frames)) ? clip.frames : [];
  if (events && Number.isInteger(events.p1) && validFrame(frames[events.p1])) {
    return { frame: frames[events.p1], index: events.p1, fallback: false };
  }
  for (let i = 0; i < frames.length; i++) {
    if (validFrame(frames[i])) return { frame: frames[i], index: i, fallback: true };
  }
  return { frame: null, index: -1, fallback: true };
}

/** Up to DIR.window valid frames ending at `index` (the address frame). */
function addressWindow(clip, index) {
  const frames = (clip && Array.isArray(clip.frames)) ? clip.frames : [];
  const out = [];
  for (let i = index; i >= 0 && out.length < DIR.window; i--) {
    if (validFrame(frames[i])) out.push(frames[i]);
  }
  return out;
}

/** One frame's vote on the target side: +1, -1, or 0 when the shoulders are too close to call. */
function shoulderVote(frame, lead, trail) {
  const a = point(frame, lead.shoulder, MIN_VIS);
  const b = point(frame, trail.shoulder, MIN_VIS);
  const { torsoLength } = bodyScale(frame);
  if (!a || !b || !torsoLength) return 0;
  const dx = a.x - b.x;
  return Math.abs(dx) >= DIR.shoulderDeadband * torsoLength ? sign(dx) : 0;
}

/** One frame's vote on the ball side: +1, -1, or 0 when the feet do not clearly point anywhere. */
function footVote(frame, lead, trail) {
  const { torsoLength } = bodyScale(frame);
  if (!torsoLength) return 0;
  const diffs = [];
  for (const side of [lead, trail]) {
    const foot = point(frame, side.foot, MIN_VIS);
    const heel = point(frame, side.heel, MIN_VIS);
    if (foot && heel) diffs.push(foot.x - heel.x);
  }
  if (!diffs.length) return 0;
  const mean = diffs.reduce((p, q) => p + q, 0) / diffs.length;
  return Math.abs(mean) >= DIR.footDeadband * torsoLength ? sign(mean) : 0;
}

/** The sign most voting frames agree on, or 0 when too few agree. */
export function steadySign(votes) {
  const v = votes.filter((x) => x !== 0);
  if (!v.length) return 0;
  const pos = v.filter((x) => x > 0).length;
  const share = Math.max(pos, v.length - pos) / v.length;
  if (share < DIR.agree) return 0;
  return pos * 2 > v.length ? 1 : -1;
}

/**
 * detectView(clip, events, handed) -> AngleResult
 * { view: 'fo'|'dtl'|'unknown', ratio, confidence, targetDir: 1|-1|0, ballDir: 1|-1|0 }
 *
 * targetDir = which side the lead shoulder sits of the trail shoulder. +1 = target toward image +x.
 * ballDir = which way the feet point (toe minus heel). +1 = the ball line is toward image +x.
 * Each is voted on by the address frames (DIR.window of them), a frame only votes when the
 * difference clears a deadband, and the result is 0 unless DIR.agree of the votes match. A
 * fraction of a pixel can therefore never flip the meaning of a metric; 0 makes the
 * dependent metrics say they could not be read instead.
 */
export function detectView(clip, events, handed = 'right') {
  const { frame, index, fallback } = addressFrame(clip, events);
  if (!frame) return { ...UNKNOWN };

  const { ratio } = bodyScale(frame);
  if (ratio === null) return { ...UNKNOWN };

  let view = 'unknown';
  let margin = 0;
  if (ratio > FO_RATIO) { view = 'fo'; margin = ratio - FO_RATIO; }
  else if (ratio < DTL_RATIO) { view = 'dtl'; margin = DTL_RATIO - ratio; }

  const { lead, trail } = sides(handed);
  const window = addressWindow(clip, index);
  const targetDir = steadySign(window.map((f) => shoulderVote(f, lead, trail)));
  const ballDir = steadySign(window.map((f) => footVote(f, lead, trail)));

  // Confidence: landmark visibility, halved right at a threshold, full 0.1 beyond it,
  // and reduced when the frame is not a detected address.
  let confidence = 0;
  if (view !== 'unknown') {
    const vis = avgVisibility(frame, CORE_IDXS);
    confidence = vis * Math.min(1, 0.5 + margin / 0.2);
    if (fallback) confidence *= 0.7;
  }

  return {
    view,
    ratio,
    confidence: Math.round(confidence * 100) / 100,
    targetDir,
    ballDir,
  };
}
