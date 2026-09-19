// Which measurements get written on the picture at each frozen position. Pure module.
//
// The markers are the tracked joints. The callouts are the same numbers as the report
// card, placed on the body part they describe and coloured by band. Nothing new is
// measured here, and anything the card will not print (turn in degrees, gated checks,
// unmeasured metrics) is never drawn.

import { fmtValue } from './coach.js';

/** metric id -> { phase, anchor, label }. anchor is a body part the overlay knows. */
export const CALLOUT_SPEC = Object.freeze({
  spineAddress: { phase: 'p1', anchor: 'spine', label: 'Forward bend' },
  shoulderTiltAddress: { phase: 'p1', anchor: 'shoulders', label: 'Shoulder tilt' },
  headTop: { phase: 'p4', anchor: 'head', label: 'Head' },
  headVertTop: { phase: 'p4', anchor: 'head', label: 'Head height' },
  hipSway: { phase: 'p4', anchor: 'hips', label: 'Hips' },
  leadArmTop: { phase: 'p4', anchor: 'leadElbow', label: 'Lead arm' },
  trailElbowTop: { phase: 'p4', anchor: 'trailElbow', label: 'Trail elbow' },
  earlyExtension: { phase: 'p7', anchor: 'hips', label: 'Hips' },
  hipSlide: { phase: 'p7', anchor: 'hips', label: 'Hips' },
  headImpact: { phase: 'p7', anchor: 'head', label: 'Head' },
  headVertImpact: { phase: 'p7', anchor: 'head', label: 'Head height' },
  spineDelta: { phase: 'p7', anchor: 'spine', label: 'Forward bend change' },
  leadArmImpact: { phase: 'p7', anchor: 'leadElbow', label: 'Lead arm' },
  shoulderTiltImpact: { phase: 'p7', anchor: 'shoulders', label: 'Shoulder tilt' },
});

export const MAX_CALLOUTS = 3;
const SEVERITY = { red: 0, amber: 1, green: 2 };

/**
 * calloutsFor('p7', analysis) -> [{ id, label, text, band, anchor }]
 * At most MAX_CALLOUTS, worst band first, one per anchor so labels never pile up.
 */
export function calloutsFor(phase, analysis) {
  if (!analysis || !Array.isArray(analysis.metrics)) return [];
  const view = analysis.view;
  const rows = [];
  for (const m of analysis.metrics) {
    const spec = CALLOUT_SPEC[m.id];
    if (!spec || spec.phase !== phase) continue;
    if (m.view !== 'both' && m.view !== view) continue;
    if (m.value === null || m.value === undefined || m.suppressed || m.gated) continue;
    if (!(m.band in SEVERITY)) continue;
    const text = fmtValue(m);
    if (!text) continue;
    rows.push({ id: m.id, label: spec.label, text, band: m.band, anchor: spec.anchor });
  }
  rows.sort((a, b) => SEVERITY[a.band] - SEVERITY[b.band]);
  const used = new Set();
  const out = [];
  for (const r of rows) {
    if (used.has(r.anchor)) continue;
    used.add(r.anchor);
    out.push(r);
    if (out.length >= MAX_CALLOUTS) break;
  }
  return out;
}
