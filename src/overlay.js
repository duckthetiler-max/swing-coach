// Canvas overlay: skeleton and guide lines drawn on top of a video frame or a still.
// Coordinates come from the Frame (normalized landmarks times the video size),
// then scaleX / scaleY map video pixels to canvas pixels.

import {
  sides, validFrame, px, mid, dist,
  NOSE, LEFT_EAR, RIGHT_EAR, LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW,
  LEFT_WRIST, RIGHT_WRIST, LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE,
  LEFT_HEEL, RIGHT_HEEL, LEFT_FOOT_INDEX, RIGHT_FOOT_INDEX,
} from './landmarks.js';

const DEFAULTS = Object.freeze({
  handed: 'right',
  scaleX: 1,
  scaleY: 1,
  accent: '#3ddc84',
  ink: '#ffffff',
  halo: 'rgba(0, 0, 0, 0.45)',
  minVisibility: 0.3,
  lineWidth: null,
  reference: null,
  label: true,
});

const PHASE_LABEL = { p1: 'P1 Address', p4: 'P4 Top', p7: 'P7 Impact', p10: 'P10 Finish' };

function options(opts) {
  return { ...DEFAULTS, ...(opts || {}) };
}

function baseWidth(ctx, o) {
  if (o.lineWidth) return o.lineWidth;
  return Math.max(2, Math.round(Math.min(ctx.canvas.width, ctx.canvas.height) / 220));
}

function point(frame, idx, o) {
  const p = px(frame, idx);
  return { x: p.x * o.scaleX, y: p.y * o.scaleY, v: p.v };
}

function leadIndices(handed) {
  return new Set(Object.values(sides(handed).lead));
}

function stroke(ctx, a, b, color, width) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}

// Limb segments with a thickness relative to the body: [from, to, width factor].
// Upper arms and thighs are thicker than forearms and shins, like a person.
const LIMBS = [
  [LEFT_SHOULDER, LEFT_ELBOW, 1.7], [LEFT_ELBOW, LEFT_WRIST, 1.35],
  [RIGHT_SHOULDER, RIGHT_ELBOW, 1.7], [RIGHT_ELBOW, RIGHT_WRIST, 1.35],
  [LEFT_HIP, LEFT_KNEE, 2.2], [LEFT_KNEE, LEFT_ANKLE, 1.7],
  [RIGHT_HIP, RIGHT_KNEE, 2.2], [RIGHT_KNEE, RIGHT_ANKLE, 1.7],
];
const FEET = [[LEFT_HEEL, LEFT_FOOT_INDEX, 1.5], [RIGHT_HEEL, RIGHT_FOOT_INDEX, 1.5]];

function withAlpha(color, alpha) {
  if (typeof color !== 'string') return color;
  const hex = color.trim();
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (m) {
    const n = parseInt(m[1], 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const short = /^#([0-9a-f]{3})$/i.exec(hex);
  if (short) {
    const [r, g, b] = short[1].split('').map((c) => parseInt(c + c, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

/**
 * Draw the body of one frame as a figure: a head, a filled torso, tapered limbs, hands
 * and feet. The lead side (nearest the target) is in the accent colour, the rest in ink.
 * Returns false when the frame has no pose.
 */
export function drawSkeleton(ctx, frame, opts) {
  if (!validFrame(frame)) return false;
  const o = options(opts);
  const lead = leadIndices(o.handed);
  const P = (idx) => point(frame, idx, o);
  const visible = (idx) => P(idx).v >= o.minVisibility;

  const sm = mid(P(LEFT_SHOULDER), P(RIGHT_SHOULDER));
  const hm = mid(P(LEFT_HIP), P(RIGHT_HIP));
  const torso = dist(sm, hm);
  const unit = Math.max(1.5, torso / 16, baseWidth(ctx, o) * 0.6);
  const colorFor = (a, b) => (lead.has(a) && lead.has(b) ? o.accent : o.ink);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Halo under everything so the figure reads on any footage.
  const haloWidth = unit * 1.1;
  for (const [a, b, k] of [...LIMBS, ...FEET]) {
    if (!visible(a) || !visible(b)) continue;
    stroke(ctx, P(a), P(b), o.halo, unit * k + haloWidth);
  }

  // 2. Torso: a filled shape between the shoulders and the hips.
  if ([LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP].every(visible)) {
    const ls = P(LEFT_SHOULDER); const rs = P(RIGHT_SHOULDER);
    const lh = P(LEFT_HIP); const rh = P(RIGHT_HIP);
    ctx.beginPath();
    ctx.moveTo(ls.x, ls.y);
    ctx.lineTo(rs.x, rs.y);
    ctx.lineTo(rh.x, rh.y);
    ctx.lineTo(lh.x, lh.y);
    ctx.closePath();
    ctx.fillStyle = withAlpha(o.ink, 0.28);
    ctx.fill();
    ctx.strokeStyle = o.halo;
    ctx.lineWidth = unit * 1.6 + haloWidth;
    ctx.stroke();
    ctx.strokeStyle = o.ink;
    ctx.lineWidth = unit * 1.6;
    ctx.stroke();
    // Shoulder line and hip line in the side colours (lead half accent).
    stroke(ctx, ls, sm, lead.has(LEFT_SHOULDER) ? o.accent : o.ink, unit * 1.6);
    stroke(ctx, rs, sm, lead.has(RIGHT_SHOULDER) ? o.accent : o.ink, unit * 1.6);
    stroke(ctx, lh, hm, lead.has(LEFT_HIP) ? o.accent : o.ink, unit * 1.6);
    stroke(ctx, rh, hm, lead.has(RIGHT_HIP) ? o.accent : o.ink, unit * 1.6);
  }

  // 3. Limbs, tapered, then feet.
  for (const [a, b, k] of LIMBS) {
    if (!visible(a) || !visible(b)) continue;
    stroke(ctx, P(a), P(b), colorFor(a, b), unit * k);
  }
  for (const [a, b, k] of FEET) {
    if (!visible(a) || !visible(b)) continue;
    stroke(ctx, P(a), P(b), colorFor(a, b), unit * k);
  }

  // 4. Joints: soft dots at elbows and knees; hands as bigger discs at the wrists.
  for (const idx of [LEFT_ELBOW, RIGHT_ELBOW, LEFT_KNEE, RIGHT_KNEE]) {
    if (!visible(idx)) continue;
    disc(ctx, P(idx), unit * 0.9, lead.has(idx) ? o.accent : o.ink, o.halo);
  }
  for (const idx of [LEFT_WRIST, RIGHT_WRIST]) {
    if (!visible(idx)) continue;
    disc(ctx, P(idx), unit * 1.3, lead.has(idx) ? o.accent : o.ink, o.halo);
  }

  // 5. Head: a disc centred between the ears (or on the nose), with a nose mark that
  //    shows which way the face points.
  const earsVisible = visible(LEFT_EAR) && visible(RIGHT_EAR);
  if (earsVisible || visible(NOSE)) {
    const nose = P(NOSE);
    const centre = earsVisible ? mid(P(LEFT_EAR), P(RIGHT_EAR)) : nose;
    const earSpan = earsVisible ? dist(P(LEFT_EAR), P(RIGHT_EAR)) : 0;
    const radius = Math.max(earSpan * 0.85, torso * 0.19, unit * 3);
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(o.ink, 0.28);
    ctx.fill();
    ctx.strokeStyle = o.halo;
    ctx.lineWidth = unit * 1.2 + haloWidth;
    ctx.stroke();
    ctx.strokeStyle = o.ink;
    ctx.lineWidth = unit * 1.2;
    ctx.stroke();
    // Neck.
    if ([LEFT_SHOULDER, RIGHT_SHOULDER].every(visible)) {
      const dx = centre.x - sm.x; const dy = centre.y - sm.y;
      const len = Math.hypot(dx, dy) || 1;
      const neckEnd = { x: centre.x - (dx / len) * radius, y: centre.y - (dy / len) * radius };
      stroke(ctx, sm, neckEnd, o.halo, unit * 1.4 + haloWidth);
      stroke(ctx, sm, neckEnd, o.ink, unit * 1.4);
    }
    if (visible(NOSE)) {
      const dx = nose.x - centre.x; const dy = nose.y - centre.y;
      const len = Math.hypot(dx, dy);
      const tip = len > radius * 0.35
        ? { x: centre.x + (dx / len) * radius, y: centre.y + (dy / len) * radius }
        : nose;
      disc(ctx, tip, unit * 0.8, o.accent, o.halo);
    }
  }

  ctx.restore();
  return true;
}

function disc(ctx, p, r, fill, halo) {
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = halo;
  ctx.lineWidth = Math.max(1, r * 0.35);
  ctx.stroke();
}

function guideGeometry(frame, o) {
  const ls = point(frame, LEFT_SHOULDER, o);
  const rs = point(frame, RIGHT_SHOULDER, o);
  const lh = point(frame, LEFT_HIP, o);
  const rh = point(frame, RIGHT_HIP, o);
  const nose = point(frame, NOSE, o);
  const ears = dist(point(frame, LEFT_EAR, o), point(frame, RIGHT_EAR, o));
  const shoulder = mid(ls, rs);
  const hip = mid(lh, rh);
  const torso = dist(shoulder, hip);
  const head = Math.max(ears * 1.6, torso * 0.3, 8);
  return { shoulder, hip, nose, torso, head, minV: Math.min(ls.v, rs.v, lh.v, rh.v) };
}

function drawGuideSet(ctx, frame, o, { color, dashed, width }) {
  const g = guideGeometry(frame, o);
  if (g.minV < o.minVisibility) return null;
  const H = ctx.canvas.height;
  ctx.save();
  ctx.setLineDash(dashed ? [width * 3, width * 3] : []);
  ctx.lineCap = 'round';

  // Spine: hip mid to shoulder mid, extended a little past each end.
  const dx = g.shoulder.x - g.hip.x;
  const dy = g.shoulder.y - g.hip.y;
  const a = { x: g.hip.x - dx * 0.15, y: g.hip.y - dy * 0.15 };
  const b = { x: g.shoulder.x + dx * 0.35, y: g.shoulder.y + dy * 0.35 };
  if (!dashed) stroke(ctx, a, b, o.halo, width * 2.4);
  stroke(ctx, a, b, color, width);

  // Vertical hip line through the hip midpoint, full height.
  const top = { x: g.hip.x, y: 0 };
  const bottom = { x: g.hip.x, y: H };
  if (!dashed) stroke(ctx, top, bottom, o.halo, width * 2.2);
  stroke(ctx, top, bottom, color, width * 0.8);

  // Head box centred on the nose.
  const half = g.head / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (!dashed) {
    ctx.save();
    ctx.strokeStyle = o.halo;
    ctx.lineWidth = width * 2.4;
    ctx.strokeRect(g.nose.x - half, g.nose.y - half, g.head, g.head);
    ctx.restore();
  }
  ctx.strokeRect(g.nose.x - half, g.nose.y - half, g.head, g.head);
  ctx.restore();
  return g;
}

/**
 * Guides for a frozen position: spine line, head box and hip line. When
 * opts.reference is a Frame (normally P1), its guides are drawn dashed first so
 * the movement since address is visible. `view` and `phase` feed the label.
 */
export function drawGuides(ctx, frame, view, phase, opts) {
  if (!validFrame(frame)) return false;
  const o = options(opts);
  const width = baseWidth(ctx, o);
  if (o.reference && validFrame(o.reference) && o.reference !== frame) {
    drawGuideSet(ctx, o.reference, o, { color: o.ink, dashed: true, width: Math.max(1, width * 0.7) });
  }
  const g = drawGuideSet(ctx, frame, o, { color: o.accent, dashed: false, width });

  if (o.label && PHASE_LABEL[phase]) {
    const size = Math.max(12, Math.round(ctx.canvas.width / 24));
    const text = PHASE_LABEL[phase] + (view === 'fo' ? ', face-on' : view === 'dtl' ? ', down-the-line' : '');
    ctx.save();
    ctx.font = `600 ${size}px system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    const pad = Math.round(size * 0.4);
    const tw = ctx.measureText(text).width;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(pad, pad, tw + pad * 2, size + pad * 1.4);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, pad * 2, pad * 1.7);
    ctx.restore();
  }
  return !!g;
}

// ---------------------------------------------------------------------------
// Biometric markers: the tracked joints as dots on thin bones, plus callouts that write
// the measured numbers on the body part they describe.
// ---------------------------------------------------------------------------

const MARKER_BONES = [
  [LEFT_SHOULDER, RIGHT_SHOULDER], [LEFT_HIP, RIGHT_HIP],
  [LEFT_SHOULDER, LEFT_HIP], [RIGHT_SHOULDER, RIGHT_HIP],
  [LEFT_SHOULDER, LEFT_ELBOW], [LEFT_ELBOW, LEFT_WRIST],
  [RIGHT_SHOULDER, RIGHT_ELBOW], [RIGHT_ELBOW, RIGHT_WRIST],
  [LEFT_HIP, LEFT_KNEE], [LEFT_KNEE, LEFT_ANKLE],
  [RIGHT_HIP, RIGHT_KNEE], [RIGHT_KNEE, RIGHT_ANKLE],
  [LEFT_HEEL, LEFT_FOOT_INDEX], [RIGHT_HEEL, RIGHT_FOOT_INDEX],
];
const MARKER_JOINTS = [
  LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_ELBOW, RIGHT_ELBOW, LEFT_WRIST, RIGHT_WRIST,
  LEFT_HIP, RIGHT_HIP, LEFT_KNEE, RIGHT_KNEE, LEFT_ANKLE, RIGHT_ANKLE,
];

export const BAND_COLOR = Object.freeze({ green: '#30d158', amber: '#ffd60a', red: '#ff453a', na: '#8e8e93' });

/**
 * Draw the tracked joints as markers: thin bones, a dot on every joint (lead side in the
 * accent colour, hollow when the tracker was unsure), a ring for the head and crosshairs
 * on the two centres the measurements use (shoulder centre and hip centre).
 */
export function drawMarkers(ctx, frame, opts) {
  if (!validFrame(frame)) return false;
  const o = options(opts);
  const lead = leadIndices(o.handed);
  const P = (idx) => point(frame, idx, o);
  const visible = (idx) => P(idx).v >= o.minVisibility;
  const sm = mid(P(LEFT_SHOULDER), P(RIGHT_SHOULDER));
  const hm = mid(P(LEFT_HIP), P(RIGHT_HIP));
  const torso = dist(sm, hm);
  const unit = Math.max(1.2, torso / 40, baseWidth(ctx, o) * 0.5);
  const r = Math.max(3, torso / 16);

  ctx.save();
  ctx.lineCap = 'round';
  for (const [a, b] of MARKER_BONES) {
    if (!visible(a) || !visible(b)) continue;
    stroke(ctx, P(a), P(b), o.halo, unit * 2.6);
    stroke(ctx, P(a), P(b), lead.has(a) && lead.has(b) ? o.accent : o.ink, unit);
  }
  // Spine: shoulder centre to hip centre, the line the posture numbers are read from.
  if ([LEFT_SHOULDER, RIGHT_SHOULDER, LEFT_HIP, RIGHT_HIP].every(visible)) {
    stroke(ctx, sm, hm, o.halo, unit * 2.6);
    stroke(ctx, sm, hm, o.ink, unit);
    for (const c of [sm, hm]) {
      stroke(ctx, { x: c.x - r, y: c.y }, { x: c.x + r, y: c.y }, o.accent, unit);
      stroke(ctx, { x: c.x, y: c.y - r }, { x: c.x, y: c.y + r }, o.accent, unit);
    }
  }
  for (const idx of MARKER_JOINTS) {
    const p = P(idx);
    if (p.v < o.minVisibility) continue;
    const color = lead.has(idx) ? o.accent : o.ink;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.v >= 0.6 ? color : 'rgba(0, 0, 0, 0.35)';
    ctx.fill();
    ctx.lineWidth = Math.max(1.5, r * 0.4);
    ctx.strokeStyle = p.v >= 0.6 ? 'rgba(0, 0, 0, 0.75)' : color;
    ctx.stroke();
  }
  // Head ring.
  const earsVisible = visible(LEFT_EAR) && visible(RIGHT_EAR);
  if (earsVisible || visible(NOSE)) {
    const centre = earsVisible ? mid(P(LEFT_EAR), P(RIGHT_EAR)) : P(NOSE);
    const earSpan = earsVisible ? dist(P(LEFT_EAR), P(RIGHT_EAR)) : 0;
    const radius = Math.max(earSpan * 0.85, torso * 0.19, r * 1.5);
    ctx.beginPath();
    ctx.arc(centre.x, centre.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = o.halo; ctx.lineWidth = unit * 2.6; ctx.stroke();
    ctx.strokeStyle = o.ink; ctx.lineWidth = unit; ctx.stroke();
  }
  ctx.restore();
  return true;
}

/** Figure or markers, by opts.style ('figure' | 'markers'). Markers is the default. */
export function drawBody(ctx, frame, opts) {
  return opts && opts.style === 'figure' ? drawSkeleton(ctx, frame, opts) : drawMarkers(ctx, frame, opts);
}

function anchorPoint(frame, anchor, o) {
  const P = (idx) => point(frame, idx, o);
  const s = sides(o.handed);
  const sm = mid(P(LEFT_SHOULDER), P(RIGHT_SHOULDER));
  const hm = mid(P(LEFT_HIP), P(RIGHT_HIP));
  switch (anchor) {
    case 'head': return P(NOSE);
    case 'hips': return hm;
    case 'shoulders': return sm;
    case 'spine': return mid(sm, hm);
    case 'leadElbow': return P(s.lead.elbow);
    case 'trailElbow': return P(s.trail.elbow);
    default: return hm;
  }
}

/**
 * Write measured numbers on the picture. callouts = [{ label, text, band, anchor }] from
 * markers.js. Each gets a ring on its body part, a leader line and a two-line label at the
 * nearer edge of the picture, coloured by band. Labels on the same side stack downward.
 */
export function drawCallouts(ctx, frame, callouts, opts) {
  if (!validFrame(frame) || !Array.isArray(callouts) || !callouts.length) return 0;
  const o = options(opts);
  const W = ctx.canvas.width; const H = ctx.canvas.height;
  const size = Math.max(11, Math.round(W / 27));
  const small = Math.max(9, Math.round(size * 0.72));
  const pad = Math.round(size * 0.5);
  const centreX = anchorPoint(frame, 'hips', o).x;
  const ring = Math.max(6, dist(anchorPoint(frame, 'shoulders', o), anchorPoint(frame, 'hips', o)) / 8);
  const nextY = { left: Math.round(H * 0.16), right: Math.round(H * 0.16) };
  let flip = false;
  const placed = [];

  ctx.save();
  ctx.textBaseline = 'top';
  for (const c of callouts) {
    const a = anchorPoint(frame, c.anchor, o);
    if (!Number.isFinite(a.x) || !Number.isFinite(a.y)) continue;
    const color = BAND_COLOR[c.band] || BAND_COLOR.na;
    let side = a.x < centreX - 2 ? 'left' : a.x > centreX + 2 ? 'right' : (flip ? 'left' : 'right');
    if (Math.abs(a.x - centreX) <= 2) flip = !flip;

    ctx.font = `700 ${size}px system-ui, sans-serif`;
    const wText = ctx.measureText(c.text).width;
    ctx.font = `600 ${small}px system-ui, sans-serif`;
    const wLabel = ctx.measureText(c.label.toUpperCase()).width;
    const boxW = Math.min(W * 0.62, Math.max(wText, wLabel) + pad * 2 + 5);
    const boxH = small + size + pad * 2 + 3;
    const x = side === 'left' ? pad : W - boxW - pad;
    let y = Math.max(nextY[side], Math.min(a.y - boxH / 2, H - boxH - pad));
    y = Math.min(y, H - boxH - pad);
    nextY[side] = y + boxH + pad;

    placed.push({ c, a, color, side, x, y, boxW, boxH });
  }

  // Pass 1: rings on the body parts and leaders to the labels.
  for (const { a, color, side, x, y, boxW, boxH } of placed) {
    ctx.beginPath(); ctx.arc(a.x, a.y, ring, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)'; ctx.lineWidth = Math.max(3, size * 0.28); ctx.stroke();
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, size * 0.16); ctx.stroke();
    const edge = { x: side === 'left' ? x + boxW : x, y: y + boxH / 2 };
    const from = { x: a.x + (side === 'left' ? -ring : ring), y: a.y };
    stroke(ctx, from, edge, 'rgba(0, 0, 0, 0.6)', Math.max(3, size * 0.24));
    stroke(ctx, from, edge, color, Math.max(1.5, size * 0.12));
  }

  // Pass 2: labels on top. Band stripe, small caps name, the number in bold.
  for (const { c, color, side, x, y, boxW, boxH } of placed) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(x, y, boxW, boxH);
    ctx.fillStyle = color;
    ctx.fillRect(side === 'left' ? x : x + boxW - 5, y, 5, boxH);
    const tx = x + pad + (side === 'left' ? 5 : 0);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = `600 ${small}px system-ui, sans-serif`;
    ctx.fillText(c.label.toUpperCase(), tx, y + pad, boxW - pad * 2 - 5);
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${size}px system-ui, sans-serif`;
    ctx.fillText(c.text, tx, y + pad + small + 3, boxW - pad * 2 - 5);
  }
  ctx.restore();
  return placed.length;
}

/**
 * Take a JPEG data URL of a frame and return a new JPEG data URL with the
 * guides and skeleton drawn on. Resolves with the original when the image
 * cannot be decoded or the frame has no pose.
 */
export function composeStill(dataUrl, frame, opts) {
  return new Promise((resolve) => {
    if (!validFrame(frame) || !dataUrl) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const o = {
          ...(opts || {}),
          scaleX: canvas.width / frame.w,
          scaleY: canvas.height / frame.h,
        };
        drawGuides(ctx, frame, o.view || 'unknown', o.phase || null, o);
        drawBody(ctx, frame, o);
        drawCallouts(ctx, frame, o.callouts, o);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
