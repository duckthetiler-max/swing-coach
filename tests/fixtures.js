// Shared synthetic pose data for tests. Owned by the integrator; builders add their
// own helper files rather than editing this one.
//
// World coordinates are metres in the FO camera frame: origin at the hip centre,
// x = the golfer's LEFT (image right when facing the camera), y DOWN, z toward the
// face-on camera (= the golfer's front, toward the ball).
//
// Views:
//   'fo'  image x = X, image y = Y. World returned as-is.
//   'dtl' image x = ballDir * Z (the golfer's front points to image +x for ballDir 1),
//         image y = Y. World returned in the DTL camera frame: (Z, Y, -X).
//
// A right-handed golfer: target is +X (image right in FO), backswing takes the hands
// toward -X. Left-handed mirrors the motion, not the body.

import { LANDMARK_COUNT } from '../src/landmarks.js';

/** Address pose, world metres, FO frame, right- or left-handed (the body is symmetric). */
export const ADDRESS_FO = {
  0: [0.00, -0.60, 0.42],
  1: [0.03, -0.63, 0.40], 2: [0.04, -0.63, 0.40], 3: [0.05, -0.63, 0.39],
  4: [-0.03, -0.63, 0.40], 5: [-0.04, -0.63, 0.40], 6: [-0.05, -0.63, 0.39],
  7: [0.08, -0.62, 0.34], 8: [-0.08, -0.62, 0.34],
  9: [0.02, -0.57, 0.42], 10: [-0.02, -0.57, 0.42],
  11: [0.20, -0.46, 0.30], 12: [-0.20, -0.40, 0.30],
  13: [0.22, -0.17, 0.40], 14: [-0.22, -0.17, 0.40],
  15: [0.05, 0.06, 0.38], 16: [-0.05, 0.06, 0.38],
  17: [0.07, 0.10, 0.40], 18: [-0.07, 0.10, 0.40],
  19: [0.06, 0.11, 0.42], 20: [-0.06, 0.11, 0.42],
  21: [0.04, 0.09, 0.41], 22: [-0.04, 0.09, 0.41],
  23: [0.10, 0.00, 0.00], 24: [-0.10, 0.00, 0.00],
  25: [0.10, 0.44, 0.10], 26: [-0.10, 0.44, 0.10],
  27: [0.10, 0.86, 0.02], 28: [-0.10, 0.86, 0.02],
  29: [0.10, 0.89, -0.03], 30: [-0.10, 0.89, -0.03],
  31: [0.10, 0.89, 0.14], 32: [-0.10, 0.89, 0.14],
};

export const PX_PER_M = 780; // for a 1080x1920 portrait frame

function clonePose(p) {
  const out = {};
  for (let i = 0; i < LANDMARK_COUNT; i++) out[i] = p[i].slice();
  return out;
}

/** Build one Frame from a world pose (FO frame) for the given view. */
export function makeFrame(view, worldFO, { i = 0, t = 0, w = 1080, h = 1920, ballDir = 1, visibility = 1 } = {}) {
  const lm = new Array(LANDMARK_COUNT);
  const world = new Array(LANDMARK_COUNT);
  const cx = w / 2 + (view === 'dtl' ? -0.15 * PX_PER_M : 0);
  const cy = h * 0.55;
  for (let k = 0; k < LANDMARK_COUNT; k++) {
    const [X, Y, Z] = worldFO[k];
    let ix, iy;
    if (view === 'dtl') {
      ix = cx + ballDir * Z * PX_PER_M;
      iy = cy + Y * PX_PER_M;
      world[k] = { x: Z, y: Y, z: -X, visibility };
    } else {
      ix = cx + X * PX_PER_M;
      iy = cy + Y * PX_PER_M;
      world[k] = { x: X, y: Y, z: Z, visibility };
    }
    lm[k] = { x: ix / w, y: iy / h, z: 0, visibility };
  }
  return { i, t, w, h, lm, world };
}

/** Frame with no detected pose. */
export function emptyFrame({ i = 0, t = 0, w = 1080, h = 1920 } = {}) {
  return { i, t, w, h, lm: null, world: null };
}

const smooth = (u) => u * u * (3 - 2 * u);
function lerp3(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
function keyframe(keys, u) {
  // keys: [[u, [x,y,z]], ...] sorted by u
  if (u <= keys[0][0]) return keys[0][1].slice();
  for (let k = 1; k < keys.length; k++) {
    if (u <= keys[k][0]) {
      const [u0, p0] = keys[k - 1];
      const [u1, p1] = keys[k];
      return lerp3(p0, p1, smooth((u - u0) / (u1 - u0)));
    }
  }
  return keys[keys.length - 1][1].slice();
}

// Hand (wrist midpoint) path for a right-hander, world FO frame. u runs 0..3:
// 0..1 backswing, 1..2 downswing, 2..3 follow-through.
const HAND_KEYS_RH = [
  [0.00, [0.00, 0.06, 0.38]],
  [0.35, [-0.30, -0.05, 0.35]],
  [0.65, [-0.40, -0.40, 0.15]],
  [1.00, [-0.25, -0.75, -0.05]],
  [1.60, [-0.30, -0.35, 0.20]],
  [2.00, [0.03, 0.06, 0.38]],
  [2.50, [0.40, -0.30, 0.20]],
  [3.00, [0.25, -0.80, -0.15]],
];

/**
 * Synthetic full swing. Returns a Clip. Timeline in samples (fps 30, stride 1):
 * still [0, stillStart), backswing to `top`, downswing to `impact`, follow to `finish`,
 * still to n-1. Defaults: n 72, motion starts at 10, top 40, impact 50, finish 62.
 *
 * mods(phase, u, pose, ctx) may mutate `pose` (world FO, metres) per frame.
 *   phase: 'still' | 'back' | 'down' | 'follow' | 'end'; u in 0..1 within the phase.
 *   ctx: { i, handed, dir } where dir = +1 right-handed, -1 left-handed.
 *
 * Built-in fault knobs (all default 0, metres, sign per the contract: toward target
 * and toward the ball are positive):
 *   headTop, hipTop        lateral (x) offset reached at the top, toward the target
 *   hipImpact              lateral hip offset at impact, toward the target
 *   earlyExtension         hip offset toward the ball (z) at impact
 *   spineLossDeg           reduction of forward tilt at impact (standing up)
 *   shoulderTurnDeg (90), hipTurnDeg (45)  turn at the top
 */
export function synthSwing({
  view = 'fo', handed = 'right', n = 72, motionStart = 10, top = 40, impact = 50, finish = 62,
  w = 1080, h = 1920, ballDir = 1, fps = 30, stride = 1, mods = null,
  headTop = 0, hipTop = 0, hipImpact = 0, earlyExtension = 0, spineLossDeg = 0,
  shoulderTurnDeg = 90, hipTurnDeg = 45, visibility = 1,
} = {}) {
  const dir = handed === 'left' ? -1 : 1;
  const frames = [];
  for (let i = 0; i < n; i++) {
    let phase, u, hu;
    if (i < motionStart) { phase = 'still'; u = motionStart > 1 ? i / (motionStart - 1) : 0; hu = 0; }
    else if (i <= top) { phase = 'back'; u = (i - motionStart) / (top - motionStart); hu = u; }
    else if (i <= impact) { phase = 'down'; u = (i - top) / (impact - top); hu = 1 + u; }
    else if (i <= finish) { phase = 'follow'; u = (i - impact) / (finish - impact); hu = 2 + u; }
    else { phase = 'end'; u = (i - finish) / Math.max(1, n - 1 - finish); hu = 3; }

    const pose = clonePose(ADDRESS_FO);
    // The address pose carries a right-hander's shoulder tilt (right shoulder lower).
    // A left-hander tilts the other way, so swap the shoulder heights.
    if (dir < 0) { const t = pose[11][1]; pose[11][1] = pose[12][1]; pose[12][1] = t; }

    // Torso turn about the vertical axis through the torso centre; positive = RH backswing.
    let turnFrac = 0;
    if (phase === 'back') turnFrac = smooth(u);
    else if (phase === 'down') turnFrac = 1 - smooth(u) * 1.15;      // slightly open at impact
    else if (phase === 'follow') turnFrac = -0.15 - smooth(u) * 0.9; // turned through at finish
    else if (phase === 'end') turnFrac = -1.05;
    const sTheta = dir * shoulderTurnDeg * Math.PI / 180 * turnFrac;
    const hTheta = dir * hipTurnDeg * Math.PI / 180 * turnFrac;
    rotatePair(pose, 11, 12, sTheta);
    rotatePair(pose, 23, 24, hTheta);

    // Lateral body moves (metres, toward target positive) and early extension (toward ball).
    const lat = (phaseVal) => phaseVal * dir;
    let headX = 0, hipX = 0, hipZ = 0, tiltLoss = 0;
    if (phase === 'back') { headX = lat(headTop) * smooth(u); hipX = lat(hipTop) * smooth(u); }
    else if (phase === 'down') {
      headX = lat(headTop) * (1 - smooth(u));
      hipX = lat(hipTop) + (lat(hipImpact) - lat(hipTop)) * smooth(u);
      hipZ = earlyExtension * smooth(u);
      tiltLoss = spineLossDeg * smooth(u);
    } else if (phase === 'follow' || phase === 'end') {
      hipX = lat(hipImpact); hipZ = earlyExtension; tiltLoss = spineLossDeg;
    }
    for (const k of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) pose[k][0] += headX;
    for (const k of [23, 24]) { pose[k][0] += hipX; pose[k][2] += hipZ; }
    for (const k of [11, 12]) { pose[k][0] += hipX; pose[k][2] += hipZ; }
    if (tiltLoss) {
      // stand up: rotate shoulders back toward vertical about the hip centre
      const rad = tiltLoss * Math.PI / 180;
      for (const k of [11, 12, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        const y = pose[k][1], z = pose[k][2] - hipZ;
        // Rotate toward vertical: less forward bend, the shoulders come back over the hips.
        pose[k][1] = y * Math.cos(rad) - z * Math.sin(rad);
        pose[k][2] = y * Math.sin(rad) + z * Math.cos(rad) + hipZ;
      }
    }

    // Hands follow the keyframe path (mirrored for left-handers); arms hang off the shoulders.
    const hand = keyframe(HAND_KEYS_RH, hu);
    hand[0] *= dir;
    hand[0] += hipX; hand[2] += hipZ;
    const spread = [0.05 * dir, 0, 0.02];
    pose[15] = [hand[0] + spread[0], hand[1] + spread[1], hand[2] + spread[2]];
    pose[16] = [hand[0] - spread[0], hand[1] - spread[1], hand[2] - spread[2]];
    for (const [wr, el, sh, bend] of [[15, 13, 11, dir > 0 ? 0.02 : 0.12], [16, 14, 12, dir > 0 ? 0.12 : 0.02]]) {
      // lead arm nearly straight, trail arm folds as the hands rise
      const s = pose[sh], wv = pose[wr];
      const m = lerp3(s, wv, 0.5);
      const d = Math.hypot(wv[0] - s[0], wv[1] - s[1], wv[2] - s[2]);
      const fold = Math.max(0, 0.58 - d) * (0.5 + bend * 4);
      pose[el] = [m[0], m[1] + fold * 0.3, m[2] + fold];
      // The trail elbow points down at the top: never above its own shoulder.
      if (bend > 0.05) pose[el][1] = Math.max(pose[el][1], s[1] + 0.03);
    }
    for (const k of [17, 19, 21]) pose[k] = [pose[15][0] + 0.02, pose[15][1] + 0.04, pose[15][2] + 0.02];
    for (const k of [18, 20, 22]) pose[k] = [pose[16][0] - 0.02, pose[16][1] + 0.04, pose[16][2] + 0.02];

    if (mods) mods(phase, u, pose, { i, handed, dir });

    frames.push(makeFrame(view, pose, { i, t: i * stride / fps, w, h, ballDir, visibility }));
  }
  return { frames, fps, stride, duration: n * stride / fps, w, h };
}

function rotatePair(pose, a, b, theta) {
  const A = pose[a], B = pose[b];
  const mx = (A[0] + B[0]) / 2, mz = (A[2] + B[2]) / 2;
  const hx = (A[0] - B[0]) / 2, hz = (A[2] - B[2]) / 2;
  const c = Math.cos(theta), s = Math.sin(theta);
  const rx = hx * c - hz * s, rz = hx * s + hz * c;
  pose[a] = [mx + rx, A[1], mz + rz];
  pose[b] = [mx - rx, B[1], mz - rz];
}

/** Convenience: a still clip (no swing) of n identical address frames. */
export function stillClip({ view = 'fo', n = 30, w = 1080, h = 1920 } = {}) {
  const frames = [];
  for (let i = 0; i < n; i++) frames.push(makeFrame(view, ADDRESS_FO, { i, t: i / 30, w, h }));
  return { frames, fps: 30, stride: 1, duration: n / 30, w, h };
}
