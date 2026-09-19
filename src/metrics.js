// The metrics: every number the report card shows, computed from the four event frames.
// Pure module: no DOM, safe in Node tests.
//
// Every metric id is always returned. One that cannot be computed comes back with value
// null, band 'na' and a note saying why. Nothing is guessed. Tier D metrics (rotation in
// degrees from one camera) are never computed. A metric gated by the golfer's declared
// swing model keeps its value but is not scored (band 'na', note says why).
// Signs: toward the target and toward the ball are positive (CONTRACT.md).

import {
  px, world, mid, dist, jointAngleDeg, validFrame, sides, avgVisibility, movingAverage,
  NOSE, CORE_IDXS, LEFT_WRIST, RIGHT_WRIST, LEFT_ANKLE, RIGHT_ANKLE, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP,
} from './landmarks.js';
import { NORMS, METRIC_IDS, bandFor, uncertaintyFor, gateReason } from './norms.js';

const DEG = 180 / Math.PI;
const clamp01 = (v) => Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));

const NEED = {
  fo: 'Needs a face-on clip.',
  dtl: 'Needs a down-the-line clip.',
  unknown: 'The camera angle is unclear. Pick face-on or down-the-line.',
};

/**
 * computeMetrics(clip, events, angle, scale, handed, factor, { club, model }) -> Metric[]
 */
export function computeMetrics(clip, events, angle, scale, handed = 'right', factor = 1, opts = {}) {
  const club = opts.club || null;
  const model = opts.model || null;
  const frames = clip && Array.isArray(clip.frames) ? clip.frames : [];
  const n = frames.length;
  const { lead, trail } = sides(handed);
  const view = angle && angle.view ? angle.view : 'unknown';
  const pxPerCm = scale && scale.pxPerCm > 0 ? scale.pxPerCm : null;
  const scaleConf = scale && Number.isFinite(scale.confidence) ? scale.confidence : 0;
  const targetDir = angle && angle.targetDir ? angle.targetDir : 0;
  const ballDir = angle && angle.ballDir ? angle.ballDir : 0;

  const at = (i) => (Number.isInteger(i) && i >= 0 && i < n && validFrame(frames[i]) ? frames[i] : null);
  const f1 = at(events.p1);
  const f4 = at(events.p4);
  const f7 = at(events.p7);
  const f7b = at(Math.min(n - 1, events.p7 + 2)) || f7;

  const out = [];
  const make = (id, value, extra = {}) => {
    const spec = NORMS[id];
    if (spec.suppressed) {
      out.push(metricRow(spec, id, null, 'na', 0, spec.suppressed, { suppressed: true }));
      return;
    }
    let v = value;
    if (typeof v === 'boolean') v = v ? 1 : 0;
    if (!Number.isFinite(v)) v = null;
    const gate = gateReason(spec, model);
    let band = v === null ? 'na' : bandFor(spec, v, { club, model, ref: extra.ref });
    let note = extra.note || '';
    if (v !== null && gate) { band = 'na'; note = `Not scored for your swing model: ${gate}${note ? ` ${note}` : ''}`; }
    const confidence = v === null ? 0 : Math.round(clamp01(extra.confidence ?? 1) * 100) / 100;
    const uncertainty = extra.uncertainty ?? uncertaintyFor(spec, v);
    out.push(metricRow(spec, id, v === null ? null : Math.round(v * 100) / 100, band, confidence, note, {
      uncertainty: uncertainty === null || uncertainty === undefined ? null : Math.round(uncertainty * 100) / 100,
      gated: !!(v !== null && gate),
    }));
  };
  const na = (id, note) => make(id, null, { note });
  const naAll = (ids, note) => ids.forEach((id) => na(id, note));

  const missingFrame = (fr, name) => (fr ? null : `No tracked pose at ${name}.`);
  const cm = (pxDelta) => (pxPerCm ? pxDelta / pxPerCm : null);
  const noseVis = (fr) => avgVisibility(fr, [NOSE]);
  const hipVis = (fr) => avgVisibility(fr, [lead.hip, trail.hip]);
  const shoulderVis = (fr) => avgVisibility(fr, [lead.shoulder, trail.shoulder]);
  const hipMid = (fr) => mid(px(fr, lead.hip), px(fr, trail.hip));
  const shoulderMid = (fr) => mid(px(fr, lead.shoulder), px(fr, trail.shoulder));

  // ---------- face-on ----------
  if (view !== 'fo') {
    naAll(METRIC_IDS.fo, view === 'dtl' ? NEED.fo : NEED.unknown);
  } else {
    const lateral = (id, fa, fb, pick, visFn, nameA, nameB) => {
      const why = missingFrame(fa, nameA) || missingFrame(fb, nameB);
      if (why) return na(id, why);
      if (!targetDir) return na(id, 'Could not tell which way the target is from the shoulders.');
      if (!pxPerCm) return na(id, 'No image scale, so distances in cm are not available.');
      const value = cm((pick(fb).x - pick(fa).x) * targetDir);
      make(id, value, { confidence: Math.min(visFn(fa), visFn(fb)) * scaleConf });
    };
    const nose = (fr) => px(fr, NOSE);
    lateral('headTop', f1, f4, nose, noseVis, 'address', 'the top');
    lateral('headImpact', f1, f7, nose, noseVis, 'address', 'impact');
    lateral('hipSway', f1, f4, hipMid, hipVis, 'address', 'the top');
    lateral('hipSlide', f1, f7, hipMid, hipVis, 'address', 'impact');

    // Rotation in degrees is tier D from one camera: reported as not measurable.
    make('shoulderTurn', null);
    make('hipTurn', null);

    const arm = (id, fr, name) => {
      const why = missingFrame(fr, name);
      if (why) return na(id, why);
      const value = jointAngleDeg(world(fr, lead.shoulder), world(fr, lead.elbow), world(fr, lead.wrist));
      if (value === null) return na(id, 'The lead arm points were degenerate.');
      make(id, value, { confidence: avgVisibility(fr, [lead.shoulder, lead.elbow, lead.wrist]) });
    };
    arm('leadArmTop', f4, 'the top');
    arm('leadArmImpact', f7b, 'just after impact');

    const tiltAddress = f1 ? tiltDeg(f1, lead, trail) : null;
    if (!f1) na('shoulderTiltAddress', missingFrame(f1, 'address'));
    else make('shoulderTiltAddress', tiltAddress, { confidence: shoulderVis(f1) });
    if (!f7) na('shoulderTiltImpact', missingFrame(f7, 'impact'));
    else {
      const t7 = tiltDeg(f7, lead, trail);
      const note = tiltAddress !== null
        ? (t7 > tiltAddress ? 'More tilt than at address.' : 'Less tilt than at address.')
        : 'No address tilt to compare with.';
      make('shoulderTiltImpact', t7, { confidence: shoulderVis(f7), ref: tiltAddress ?? undefined, note });
    }

    const weight = (id, fr, name) => {
      const why = missingFrame(f1, 'address') || missingFrame(fr, name);
      if (why) return na(id, why);
      const la = px(f1, lead.ankle);
      const ta = px(f1, trail.ankle);
      const span = la.x - ta.x;
      if (Math.abs(span) < 5) return na(id, 'The feet are not apart in the picture.');
      const value = ((hipMid(fr).x - ta.x) / span) * 100;
      make(id, value, { confidence: Math.min(hipVis(fr), avgVisibility(f1, [lead.ankle, trail.ankle])) });
    };
    weight('weightTop', f4, 'the top');
    weight('weightImpact', f7, 'impact');

    {
      const why = missingFrame(f1, 'address') || missingFrame(f4, 'the top');
      if (why) na('reversePivot', why);
      else if (!targetDir) na('reversePivot', 'Could not tell which way the target is from the shoulders.');
      else if (!pxPerCm) na('reversePivot', 'No image scale, so distances in cm are not available.');
      else {
        const lean4 = shoulderMid(f4).x - hipMid(f4).x;
        const lean1 = shoulderMid(f1).x - hipMid(f1).x;
        const delta = cm((lean4 - lean1) * targetDir);
        make('reversePivot', delta > 4, {
          confidence: Math.min(shoulderVis(f4), hipVis(f4)) * scaleConf,
          note: `Upper body ${Math.abs(Math.round(delta))} cm ${delta >= 0 ? 'toward' : 'away from'} the target at the top, relative to the hips.`,
        });
      }
    }
  }

  // ---------- down-the-line ----------
  if (view !== 'dtl') {
    naAll(METRIC_IDS.dtl, view === 'fo' ? NEED.dtl : NEED.unknown);
  } else {
    const spine = (fr) => spineDeg(fr, lead, trail, ballDir);
    if (!f1) na('spineAddress', missingFrame(f1, 'address'));
    else if (!ballDir) na('spineAddress', 'Could not tell which way you were facing from the feet.');
    else make('spineAddress', spine(f1), { confidence: Math.min(shoulderVis(f1), hipVis(f1)) });

    {
      const why = missingFrame(f1, 'address') || missingFrame(f7, 'impact');
      if (why) { na('spineDelta', why); na('earlyExtension', why); }
      else if (!ballDir) {
        na('spineDelta', 'Could not tell which way you were facing from the feet.');
        na('earlyExtension', 'Could not tell which way you were facing from the feet.');
      } else {
        make('spineDelta', spine(f7) - spine(f1), { confidence: Math.min(shoulderVis(f1), hipVis(f1), shoulderVis(f7), hipVis(f7)) });
        if (!pxPerCm) na('earlyExtension', 'No image scale, so distances in cm are not available.');
        else make('earlyExtension', cm((hipMid(f7).x - hipMid(f1).x) * ballDir), { confidence: Math.min(hipVis(f1), hipVis(f7)) * scaleConf });
      }
    }

    const headVert = (id, fr, name) => {
      const why = missingFrame(f1, 'address') || missingFrame(fr, name);
      if (why) return na(id, why);
      if (!pxPerCm) return na(id, 'No image scale, so distances in cm are not available.');
      make(id, cm(px(fr, NOSE).y - px(f1, NOSE).y), { confidence: Math.min(noseVis(f1), noseVis(fr)) * scaleConf });
    };
    headVert('headVertTop', f4, 'the top');
    headVert('headVertImpact', f7, 'impact');

    {
      const why = missingFrame(f1, 'address') || missingFrame(f4, 'the top') || missingFrame(f7, 'impact');
      if (why) na('handsPath', why);
      else if (!ballDir) na('handsPath', 'Could not tell which way you were facing from the feet.');
      else if (!pxPerCm) na('handsPath', 'No image scale, so distances in cm are not available.');
      else {
        const hp = handsPathPx(frames, events, shoulderMid(f1).y);
        if (hp === null) na('handsPath', 'The hands did not reach shoulder height on both the way up and the way down.');
        else make('handsPath', cm(hp * ballDir), { confidence: 0.5 * scaleConf, note: 'Estimate from the hands only. The club is not tracked.' });
      }
    }

    if (!f4) na('trailElbowTop', missingFrame(f4, 'the top'));
    else if (!pxPerCm) na('trailElbowTop', 'No image scale, so distances in cm are not available.');
    else make('trailElbowTop', cm(px(f4, trail.shoulder).y - px(f4, trail.elbow).y), { confidence: avgVisibility(f4, [trail.shoulder, trail.elbow]) * scaleConf });
  }

  // ---------- both views ----------
  const { p1, p4, p7, p10 } = events;
  const ok = Number.isInteger(p1) && Number.isInteger(p4) && Number.isInteger(p7) && p1 < p4 && p4 < p7 && p7 < n;
  if (!ok) {
    naAll(['tempo', 'backswingTime', 'downswingTime', 'downswingFrames'], 'The swing events were not found.');
  } else {
    const back = p4 - p1;
    const down = p7 - p4;
    const evConf = events.confidence ?? 1;
    const frameConf = down >= 8 ? 1 : down >= 4 ? 0.5 : 0.2;
    const tempo = back / down;
    make('tempo', tempo, {
      confidence: evConf * frameConf,
      uncertainty: tempo * (1 / down + 1 / back),
      note: down < 8 ? 'Rough: fewer than 8 samples in the downswing.' : '',
    });
    const fac = factor > 0 ? factor : 1;
    const t = (i) => frames[i].t;
    const interval = clip.stride && clip.fps ? clip.stride / (clip.fps * fac) : null;
    make('backswingTime', (t(p4) - t(p1)) / fac, { confidence: evConf, uncertainty: interval, note: `Assumes ${fac}x slow motion.` });
    make('downswingTime', (t(p7) - t(p4)) / fac, { confidence: evConf * frameConf, uncertainty: interval, note: `Assumes ${fac}x slow motion.` });
    make('downswingFrames', down, { confidence: 1, note: down < 8 ? 'Under 8 samples: timing numbers are rough. Use slow motion.' : '' });
  }
  {
    const lo = Number.isInteger(p1) ? p1 : 0;
    const hi = Number.isInteger(p10) ? Math.min(p10, n - 1) : n - 1;
    let sum = 0;
    let count = 0;
    for (let i = lo; i <= hi; i++) { sum += avgVisibility(frames[i], CORE_IDXS); count++; }
    if (!count) na('visibility', 'No frames.');
    else make('visibility', sum / count, { confidence: 1, note: sum / count < 0.6 ? 'Low tracking visibility on hips or shoulders.' : '' });
  }

  return out;
}

function metricRow(spec, id, value, band, confidence, note, extra) {
  return {
    id,
    label: spec.label,
    value,
    unit: spec.unit,
    band,
    confidence,
    note,
    view: spec.view,
    direction: spec.direction,
    tier: spec.tier || 'B',
    display: spec.display || 'number',
    uncertainty: extra.uncertainty ?? null,
    gated: !!extra.gated,
    suppressed: !!extra.suppressed,
    norm: spec,
  };
}

/**
 * Quality block for the Analysis: downswing frames, mean visibility and plain warnings,
 * including camera checks (framing, squareness, movement).
 */
export function buildQuality(metrics, clip, events, angle = null, handed = 'right') {
  const byId = new Map(metrics.map((m) => [m.id, m]));
  const df = byId.get('downswingFrames');
  const vis = byId.get('visibility');
  const warnings = [];
  if (clip && Array.isArray(clip.warnings)) warnings.push(...clip.warnings);
  if (events && events.confidence < 1 && events.notes) warnings.push(...events.notes);
  if (df && df.value !== null && df.value < 8) warnings.push(`Only ${df.value} samples in the downswing. Use slow motion for better timing numbers.`);
  if (vis && vis.value !== null && vis.value < 0.6) warnings.push('Tracking visibility was low. Keep the whole body in frame with good light and the phone still.');
  warnings.push(...cameraChecks(clip, events, angle, handed));
  return {
    downswingFrames: df ? df.value : null,
    avgVisibility: vis ? vis.value : null,
    warnings,
  };
}

/** Camera validity checks that need no extra hardware: framing, squareness, movement. */
export function cameraChecks(clip, events, angle, handed = 'right') {
  const out = [];
  const frames = clip && Array.isArray(clip.frames) ? clip.frames : [];
  if (!frames.length || !events) return out;
  const { lead, trail } = sides(handed);
  const lo = Number.isInteger(events.p1) ? events.p1 : 0;
  const hi = Number.isInteger(events.p10) ? Math.min(events.p10, frames.length - 1) : frames.length - 1;

  // Framing: any key landmark outside the picture between address and finish.
  const keys = [NOSE, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP, LEFT_WRIST, RIGHT_WRIST, LEFT_ANKLE, RIGHT_ANKLE];
  let left = false;
  for (let i = lo; i <= hi && !left; i++) {
    const f = frames[i];
    if (!validFrame(f)) continue;
    for (const k of keys) {
      const l = f.lm[k];
      if (l.x < -0.02 || l.x > 1.02 || l.y < -0.02 || l.y > 1.02) { left = true; break; }
    }
  }
  if (left) out.push('Part of the body left the picture during the swing. Stand further from the phone or re-aim it.');

  const f1 = validFrame(frames[events.p1]) ? frames[events.p1] : frames.find(validFrame);
  if (!f1) return out;
  const torso = dist(mid(px(f1, lead.shoulder), px(f1, trail.shoulder)), mid(px(f1, lead.hip), px(f1, trail.hip))) || 1;

  // Squareness (face-on): the feet should sit at about the same height in the picture.
  if (angle && angle.view === 'fo') {
    const dy = Math.abs(px(f1, lead.ankle).y - px(f1, trail.ankle).y);
    if (dy > 0.12 * torso) out.push('The phone may not be square to you: the feet sit at different heights in the picture. Sway, slide and head numbers are less reliable.');
  }

  // Movement: the lead ankle should not drift sideways between address and finish.
  const f10 = validFrame(frames[hi]) ? frames[hi] : null;
  if (f10) {
    const dx = Math.abs(px(f10, lead.ankle).x - px(f1, lead.ankle).x);
    if (dx > 0.08 * torso) out.push('The lead foot moved in the picture between address and finish. Either the phone moved or you stepped, so distances are less reliable.');
  }
  return out;
}

// ---------- geometry helpers ----------

/** Turn of the a->b line between two frames, projected on the ground plane (x-z), degrees. Kept for reference; tier D, not shown. */
export function turnDeg(fa, fb, iA, iB) {
  const va = sub(world(fa, iA), world(fa, iB));
  const vb = sub(world(fb, iA), world(fb, iB));
  const ma = Math.hypot(va.x, va.z);
  const mb = Math.hypot(vb.x, vb.z);
  if (!ma || !mb) return null;
  const cos = (va.x * vb.x + va.z * vb.z) / (ma * mb);
  return Math.acos(Math.max(-1, Math.min(1, cos))) * DEG;
}

/** Shoulder line slope in image px, degrees, positive when the trail shoulder is lower. */
export function tiltDeg(frame, lead, trail) {
  const ls = px(frame, lead.shoulder);
  const ts = px(frame, trail.shoulder);
  const dx = Math.abs(ts.x - ls.x);
  const dy = ts.y - ls.y; // y down: positive = trail lower
  return Math.atan2(dy, dx) * DEG;
}

/** Forward bend of hip mid -> shoulder mid from vertical, degrees, positive toward the ball. */
export function spineDeg(frame, lead, trail, ballDir) {
  const sm = mid(px(frame, lead.shoulder), px(frame, trail.shoulder));
  const hm = mid(px(frame, lead.hip), px(frame, trail.hip));
  const dx = (sm.x - hm.x) * (ballDir || 1);
  const dy = hm.y - sm.y; // shoulders above hips => positive
  return Math.atan2(dx, dy) * DEG;
}

/**
 * Wrist-midpoint x when the hands cross shoulder height going up (P1..P4) and coming down
 * (P4..P7), in px. Returns down minus up, or null when either crossing is missing.
 */
export function handsPathPx(frames, events, shoulderY) {
  const n = frames.length;
  const rawX = frames.map((f) => (validFrame(f) ? mid(px(f, LEFT_WRIST), px(f, RIGHT_WRIST)).x : null));
  const rawY = frames.map((f) => (validFrame(f) ? mid(px(f, LEFT_WRIST), px(f, RIGHT_WRIST)).y : null));
  const x = movingAverage(rawX, 3);
  const y = movingAverage(rawY, 3);
  const cross = (from, to, goingUp) => {
    for (let i = from + 1; i <= to && i < n; i++) {
      if (y[i] === null || y[i - 1] === null) continue;
      const hit = goingUp ? (y[i] <= shoulderY && y[i - 1] > shoulderY) : (y[i] >= shoulderY && y[i - 1] < shoulderY);
      if (!hit) continue;
      const span = y[i] - y[i - 1];
      const u = span === 0 ? 0 : (shoulderY - y[i - 1]) / span;
      return x[i - 1] + (x[i] - x[i - 1]) * u;
    }
    return null;
  };
  const up = cross(events.p1, events.p4, true);
  const down = cross(events.p4, events.p7, false);
  if (up === null || down === null) return null;
  return down - up;
}

function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
