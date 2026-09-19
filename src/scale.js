// Image scale: pixels per centimetre at address, from the segments whose real length the
// 3D world points give. Pure module: no DOM, safe in Node tests.
//
// A segment that lies in the image plane keeps its full length in the picture; one that
// points toward the camera looks shorter. So the LARGEST px-per-cm ratio over several
// segments is the least foreshortened and the closest to the true scale.

import { px, world, mid, dist, validFrame, sides, NOSE, LEFT_ANKLE, RIGHT_ANKLE } from './landmarks.js';

/** Nose sits at about this fraction of standing height above the ankles. */
export const NOSE_TO_ANKLE_FRACTION = 0.88;

const NONE = { pxPerCm: null, method: 'none', confidence: 0, modelHeightCm: null };

/**
 * estimateScale(frame, handed, userHeightCm) -> { pxPerCm, method, confidence, modelHeightCm }
 * userHeightCm (optional) corrects the model's own size estimate.
 */
export function estimateScale(frame, handed = 'right', userHeightCm = null) {
  if (!validFrame(frame)) return { ...NONE };
  const { lead, trail } = sides(handed);
  const segments = [
    ['shoulders', [lead.shoulder], [trail.shoulder]],
    ['torso', [lead.shoulder, trail.shoulder], [lead.hip, trail.hip]],
    ['lead thigh', [lead.hip], [lead.knee]],
    ['trail thigh', [trail.hip], [trail.knee]],
    ['lead shin', [lead.knee], [lead.ankle]],
    ['trail shin', [trail.knee], [trail.ankle]],
  ];

  let best = null;
  for (const [name, a, b] of segments) {
    const pa = pointPx(frame, a);
    const pb = pointPx(frame, b);
    const wa = pointWorld(frame, a);
    const wb = pointWorld(frame, b);
    const worldCm = dist(wa, wb) * 100;
    if (!(worldCm > 5)) continue;
    const ratio = dist(pa, pb) / worldCm;
    const vis = Math.min(pa.v, pb.v);
    if (!best || ratio > best.ratio) best = { name, ratio, vis };
  }
  if (!best || !(best.ratio > 0)) return { ...NONE, method: 'no usable segment' };

  const nose = world(frame, NOSE);
  const ankleMid = mid(world(frame, LEFT_ANKLE), world(frame, RIGHT_ANKLE));
  const noseToAnkle = ankleMid.y - nose.y; // y points down, so the nose has the smaller y
  const modelHeightCm = noseToAnkle > 0 ? Math.round((noseToAnkle / NOSE_TO_ANKLE_FRACTION) * 1000) / 10 : null;

  let pxPerCm = best.ratio;
  let method = best.name;
  if (Number.isFinite(userHeightCm) && userHeightCm > 0 && modelHeightCm) {
    pxPerCm /= userHeightCm / modelHeightCm;
    method += ` scaled to ${Math.round(userHeightCm)} cm`;
  }

  return {
    pxPerCm: Math.round(pxPerCm * 1000) / 1000,
    method,
    confidence: Math.round(Math.max(0, Math.min(1, best.vis)) * 100) / 100,
    modelHeightCm,
  };
}

function pointPx(frame, idxs) {
  if (idxs.length === 1) return px(frame, idxs[0]);
  return mid(px(frame, idxs[0]), px(frame, idxs[1]));
}

function pointWorld(frame, idxs) {
  if (idxs.length === 1) return world(frame, idxs[0]);
  return mid(world(frame, idxs[0]), world(frame, idxs[1]));
}
