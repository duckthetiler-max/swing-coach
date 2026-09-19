// The coach: turns an Analysis into Coaching (the one thing, a drill card, runner-up lines).
// Pure module: no DOM. Every sentence is built from measured values only. A metric with a
// null value is never mentioned anywhere in the output.
//
// Ranking (docs/research/02 section 7.2): each amber (1) or red (2) metric is multiplied
// by a weight for the club's miss pattern. Highest score wins and becomes the headline.
// Early extension outranks the over-the-top signals on purpose: the fixes are opposite,
// and early extension is the most prevalent, best-evidenced fault. Second and third get
// one line each in `others`. Ties: heavier weight first, then higher confidence.

import { DRILLS, drillLines } from './drills.js';
import { greenRange } from './norms.js';
import { SWING_MODELS, NOT_VISIBLE, PROTECT } from './knowledge.js';
import { weightProfile, clubWord as clubWordOf, clubGroup } from './clubs.js';

export const STOP_LINE = 'Stop straight away if the arm hurts.';
export const PROTECT_NOTE = 'PROTECT mode is on. Tempo and rotation drills only, nothing about speed.';
export const PROTECTIVE_LINE = 'Possibly protective, not coached.';
export const SKIPPED_LINE = 'Its drill is skipped in PROTECT mode.';
export const NOTHING_OUTSIDE = 'Nothing measured was outside its band.';
/** A metric is only coached when the tracker was sure enough of it. */
export const MIN_HEADLINE_CONFIDENCE = 0.5;
export const UNCLEAR_LINE = 'Not clear enough to coach: within its band of doubt of the green range, or tracked with low confidence.';
export const NOTHING_CLEAR = 'Nothing was clearly outside its band once the doubt is counted.';
export const UNVALIDATED_LINE = 'Not yet validated on real footage. Check the picture agrees before you act on this.';

/**
 * The headline rule. A number is coached only when the tracker was sure enough of it AND the
 * value, give or take its band of doubt, sits wholly outside the green range. Anything else
 * is reported, never coached. ctx.byId supplies the reference for relative bands.
 */
export function clearlyOutside(m, green, ctx) {
  const v = numValue(m);
  if (v === null) return false;
  if (typeof m.confidence === 'number' && m.confidence < MIN_HEADLINE_CONFIDENCE) return false;
  if (m.display === 'direction') return Math.abs(v) > 8;
  if (m.unit === 'bool') return true;
  const u = typeof m.uncertainty === 'number' && Number.isFinite(m.uncertainty) ? Math.abs(m.uncertainty) : 0;
  const norm = m.norm;
  if (norm && norm.relativeTo) {
    const ref = ctx && ctx.byId ? ctx.byId.get(norm.relativeTo) : null;
    const r = ref ? numValue(ref) : null;
    if (r === null) return m.band === 'red';
    return v + u < r; // green is "more than at address": even the top of the doubt falls short
  }
  if (!green) return m.band === 'red';
  if (green.lo !== null && v + u < green.lo) return true;
  if (green.hi !== null && v - u > green.hi) return true;
  return false;
}
export const NOT_VISIBLE_LINE = `Not visible from this video: ${NOT_VISIBLE.slice(0, 5).map((s) => s.toLowerCase()).join(', ')}.`;

// Clip-quality metrics: reported in notes, never coached as a swing fault.
const QUALITY_IDS = new Set(['downswingFrames', 'visibility']);
// Lead-arm metrics: in PROTECT mode they are reported, never the headline.
const PROTECTED_IDS = new Set(['leadArmTop', 'leadArmImpact']);
// Timing metrics never lead a session on their own.
const MODIFIER_IDS = new Set(['backswingTime', 'downswingTime']);

const BAND_SCORE = { red: 2, amber: 1 };

// Ranking weights per club profile (docs/research/02 section 7.2). Engineering
// judgement built on the sourced fault evidence, not published data. Unlisted: 0.02.
const WEIGHTS = {
  driver: { earlyExtension: 0.18, shoulderTiltImpact: 0.15, spineDelta: 0.13, handsPath: 0.12, headVertImpact: 0.09, weightImpact: 0.08, leadArmImpact: 0.08, reversePivot: 0.07, tempo: 0.02, hipSlide: 0.05, headTop: 0.03, hipSway: 0.03 },
  iron: { earlyExtension: 0.20, hipSlide: 0.15, spineDelta: 0.12, leadArmImpact: 0.12, weightImpact: 0.10, headImpact: 0.09, shoulderTiltImpact: 0.08, handsPath: 0.15, tempo: 0.05, headVertImpact: 0.03, hipSway: 0.03, headTop: 0.03 },
  pw: { weightImpact: 0.20, headVertImpact: 0.15, reversePivot: 0.13, hipSlide: 0.12, leadArmImpact: 0.11, spineDelta: 0.10, headImpact: 0.09, tempo: 0.06, earlyExtension: 0.04, headTop: 0.04, hipSway: 0.03 },
};
const DEFAULT_WEIGHT = 0.02;

function profileFor(club) {
  return WEIGHTS[weightProfile(club)] || WEIGHTS.iron;
}

/** True for clubs ranked with the driver's miss pattern (driver and fairway woods). */
function longClub(club) {
  return weightProfile(club) === 'driver';
}

/** True for wedges (contact game). */
function wedge(club) {
  return weightProfile(club) === 'pw';
}

/** Every drill id a metric can be coached with. Each id must exist in DRILLS. */
export const DRILL_MAP = Object.freeze({
  earlyExtension: ['earlyExtension'],
  spineDelta: ['lossOfPosture'],
  spineAddress: ['lossOfPosture'],
  hipSway: ['hipSway'],
  hipSlide: ['hipSlide', 'hangingBack'],
  weightTop: ['hipSway', 'reversePivot'],
  weightImpact: ['hangingBack', 'hipSlide'],
  handsPath: ['overTheTop', 'stuckInside'],
  headTop: ['headLateral'],
  headImpact: ['headLateral'],
  headVertTop: ['headVertical'],
  headVertImpact: ['headVertical'],
  reversePivot: ['reversePivot'],
  shoulderTiltImpact: ['reversePivot'],
  shoulderTiltAddress: ['reversePivot'],
  leadArmImpact: ['chickenWing'],
  leadArmTop: ['tempo'],
  trailElbowTop: ['tempo'],
  shoulderTurn: ['tempo'],
  hipTurn: ['tempo'],
  tempo: ['tempo'],
  backswingTime: ['tempo'],
  downswingTime: ['tempo'],
});

// Direction words for signed metrics: [positive, negative].
const DIRECTION = {
  headTop: ['toward the target', 'away from the target'],
  headImpact: ['toward the target', 'away from the target'],
  hipSway: ['toward the target', 'away from the target'],
  hipSlide: ['toward the target', 'away from the target'],
  earlyExtension: ['toward the ball', 'away from the ball'],
  handsPath: ['outside', 'inside'],
  headVertTop: ['dip', 'rise'],
  headVertImpact: ['dip', 'rise'],
  spineDelta: ['more bent over', 'standing up'],
  shoulderTiltAddress: ['trail shoulder lower', 'lead shoulder lower'],
  shoulderTiltImpact: ['trail shoulder lower', 'lead shoulder lower'],
  trailElbowTop: ['above the shoulder', 'below the shoulder'],
};

const HIP_SLIDE_OVER_CM = 15;
const WEIGHT_HANGING_BACK_PCT = 50;

// ---------- small helpers ----------

function numValue(m) {
  if (!m) return null;
  if (typeof m.value === 'boolean') return m.value ? 1 : 0;
  return typeof m.value === 'number' && Number.isFinite(m.value) ? m.value : null;
}

function measured(m) {
  return numValue(m) !== null && m.band !== 'na';
}

function offBand(m) {
  return m.band === 'red' || m.band === 'amber';
}

function labelOf(m) {
  if (m && typeof m.label === 'string' && m.label.trim()) return m.label.trim();
  return String(m?.id || 'Metric');
}

function lowerFirst(s) {
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function unitWord(unit) {
  if (unit === 'cm') return 'cm';
  if (unit === 'deg') return 'deg';
  if (unit === 's') return 's';
  if (unit === 'frames') return 'frames';
  return '';
}

/** Whole numbers for display; one decimal for tempo (ratio) and seconds. */
export function fmtNum(v, unit) {
  if (unit === 's' || unit === 'ratio') return (Math.round(v * 10) / 10).toFixed(1);
  const r = Math.round(v);
  return String(r === 0 ? 0 : r);
}

function fmtRange(n) {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10);
}

/** Words for a tier C metric shown as a direction rather than a number. */
export function directionWords(m) {
  const v = numValue(m);
  if (v === null) return '';
  const dir = DIRECTION[m.id] || ['positive', 'negative'];
  const size = Math.abs(v);
  if (size <= 4) return 'about on the line';
  const word = v > 0 ? dir[0] : dir[1];
  return size <= 8 ? `a little ${word}` : `clearly ${word}`;
}

/** Value with unit and direction word, e.g. "8 cm toward the ball", "3.1 to 1", "yes". */
export function fmtValue(m) {
  const v = numValue(m);
  if (v === null) return '';
  if (m.display === 'direction') return directionWords(m);
  const unit = m.unit;
  if (unit === 'bool') return v ? 'yes' : 'no';
  if (unit === 'ratio') return m.id === 'tempo' ? `${fmtNum(v, unit)} to 1` : fmtNum(v, unit);
  if (unit === 's') return `${fmtNum(v, unit)} s`;
  if (unit === 'frames') return `${fmtNum(v, unit)} frames`;
  if (unit === 'pct') return `${fmtNum(v, unit)}% toward the lead foot`;
  const uw = unitWord(unit);
  const dir = DIRECTION[m.id];
  const n = fmtNum(Math.abs(v), unit);
  if (dir && Math.round(v) !== 0) return `${n} ${uw} ${v > 0 ? dir[0] : dir[1]}`.replace(/\s+/g, ' ').trim();
  return `${n} ${uw}`.trim();
}

/** "plus or minus" text for the report card, or empty. */
export function fmtUncertainty(m) {
  if (!m || m.display === 'direction' || m.uncertainty === null || m.uncertainty === undefined) return '';
  const u = m.uncertainty;
  if (m.unit === 'ratio' || m.unit === 's') return `give or take ${(Math.round(u * 100) / 100).toFixed(2)}`;
  if (m.unit === 'bool' || m.unit === 'frames') return '';
  return `give or take ${Math.round(u)} ${unitWord(m.unit) || (m.unit === 'pct' ? 'points' : '')}`.trim();
}

function greenBand(m, ctx) {
  const norm = m.norm;
  if (!norm) return null;
  return greenRange(norm, ctx.club, ctx.model);
}

/** 'low' | 'high' | 'unknown': which side of the green band the value sits on. */
function sideOf(m, green) {
  const v = numValue(m);
  if (!green || v === null) return 'unknown';
  if (green.lo !== null && v < green.lo) return 'low';
  if (green.hi !== null && v > green.hi) return 'high';
  return 'unknown';
}

function weightFor(m, club) {
  const profile = profileFor(club);
  const v = numValue(m);
  const id = m.id;
  let w = profile[id] ?? DEFAULT_WEIGHT;
  // Direction-aware adjustments from the fault evidence.
  if (id === 'handsPath' && longClub(club) && v < 0) w = 0.05;
  if (id === 'handsPath' && !longClub(club) && !wedge(club) && v > 0) w = 0.06;
  if (id === 'hipSlide' && !longClub(club) && !wedge(club) && v < HIP_SLIDE_OVER_CM && v >= 0) w = 0.06;
  if (id === 'weightImpact' && v >= WEIGHT_HANGING_BACK_PCT) w = Math.min(w, 0.06);
  return w;
}

/** Drill id for a measured metric. `side` from sideOf(). */
export function drillIdFor(m, side = 'unknown') {
  const v = numValue(m);
  if (m.id === 'handsPath') return v >= 0 ? 'overTheTop' : 'stuckInside';
  if (m.id === 'weightTop') return side === 'high' ? 'reversePivot' : 'hipSway';
  if (m.id === 'weightImpact') return side === 'high' ? 'hipSlide' : 'hangingBack';
  if (m.id === 'hipSlide') return side === 'low' || v < 0 ? 'hangingBack' : 'hipSlide';
  const list = DRILL_MAP[m.id];
  return list && list.length ? list[0] : 'tempo';
}

function drillCard(drillId, handed) {
  const d = DRILLS[drillId] || DRILLS.tempo;
  return { id: drillId, ...drillLines(d, handed), protectSafe: d.protectSafe, leadArmLoad: d.leadArmLoad, evidence: d.evidence, sources: d.sources };
}

function drillText(card) {
  return [`Cue: ${card.cue}`, `Drill: ${card.setup}`, `Do: ${card.do}`, `Done when: ${card.doneWhen}`].join('\n');
}

function clubMissClause(club) {
  const g = clubGroup(club);
  if (g === 'driver') return ' With the driver that often shows up as a slice.';
  if (g === 'wood') return ' With a fairway wood that often shows up as a slice.';
  if (g === 'wedge') return ' With a wedge it tends to show up in contact.';
  return ' With the irons that often shows up as a hook.';
}

function sideWords(handed) {
  return handed === 'left' ? { lead: 'right', trail: 'left' } : { lead: 'left', trail: 'right' };
}

// ---------- text builders (all from measured values) ----------

function whatText(m) {
  const u = fmtUncertainty(m);
  return `${labelOf(m)}: ${fmtValue(m)}${u ? `, ${u}` : ''}. That is ${m.band}.`;
}

function lineText(m) {
  return `${labelOf(m)}: ${fmtValue(m)} (${m.band}).`;
}

function whyText(entry, ctx) {
  const { m, side } = entry;
  const v = numValue(m);
  const val = fmtValue(m);
  const n = fmtNum(Math.abs(v), m.unit);
  const { lead, trail } = sideWords(ctx.handed);
  const label = labelOf(m);
  const band = m.band;

  // Wording rule: say what was measured, then what it often goes with. The camera sees
  // the body, never the club or the ball, so nothing here claims a cause as fact.
  switch (m.id) {
    case 'earlyExtension':
      if (v > 0) {
        return `The hips moved ${val} through impact. That pattern often goes with trapped arms and a late flip of the hands, ` +
          `which can hook one swing and block or slice the next: the two-way miss. It is the most common fault in screened amateurs (67% of 90,000) and almost absent in tour players.${clubMissClause(ctx.club)}`;
      }
      return `The hips moved ${val} through impact, so the body dropped back rather than holding its posture. ` +
        'That often moves the low point, and contact and direction tend to suffer.';

    case 'spineDelta':
      if (v < 0) {
        return `The forward bend changed ${val} by impact. Standing up is the same family as early extension, ` +
          `and it often goes with a late flip of the hands, which can hook or block.${clubMissClause(ctx.club)}`;
      }
      return `The forward bend changed ${val} by impact, more bent over than at address. ` +
        'That tends to drop the low point and make contact fat. Tour players return to their setup numbers by impact.';

    case 'spineAddress':
      if (side === 'low') {
        return `At address the forward bend was ${val} from vertical, more upright than the tour reference. A tall address often goes with ` +
          'standing up through impact, the early extension family.';
      }
      return `At address the forward bend was ${val} from vertical, more bent over than the tour reference. That is hard to hold through the swing, ` +
        'and it often goes with standing up at impact, the early extension family.';

    case 'handsPath':
      if (v >= 0) {
        return `The hands came down ${val} the line they went back on: the over-the-top pattern. It often goes with the club travelling across the ball, ` +
          'which tends to pull or slice. This is a rough read from the hands only; the club is not tracked.';
      }
      return `The hands came down ${val} the line they went back on. That often goes with the club getting stuck behind you and a late flip of the hands, ` +
        'a hook pattern. This is a rough read from the hands only; the club is not tracked.';

    case 'hipSlide':
      if (side === 'high') {
        return `The hips slid ${val} by impact, past the ball. That often goes with the upper body stalling and the hands flipping to catch up, a hook pattern.`;
      }
      if (v < 0) {
        return `The hips moved ${val} by impact, backwards: hanging back. ` +
          'That often goes with divots behind the ball and a face left open or flipped.';
      }
      return `The hips moved only ${val} by impact. Good players finish with the hips clearly closer to the target than at address.`;

    case 'hipSway':
      if (v < 0) {
        return `The hips swayed ${val} in the backswing rather than turning. Getting back to the ball then tends to need a slide or a stall, ` +
          'and contact and direction often suffer. Tour players move toward the target at the top, not away.';
      }
      return `The hips moved ${val} in the backswing, further toward the target than the band allows. That often goes with the upper body tipping toward the target, the reverse pivot pattern.`;

    case 'headTop':
      return `The head moved ${val} at the top. A moving head often goes with a moving low point, which tends to show up as fat or thin contact.`;

    case 'headImpact':
      if (v < 0) {
        return `The head was ${val} at impact. That often goes with a low point further back: fat and thin contact, and room for the hands to flip.`;
      }
      return `The head moved ${val} by impact. That often goes with a low point further forward: thin contact and an open face.`;

    case 'headVertTop':
    case 'headVertImpact': {
      const when = m.id === 'headVertTop' ? 'by the top' : 'by impact';
      const moved = v > 0 ? 'dipped' : 'rose';
      const extra = m.id === 'headVertImpact' && v < 0 ? ' Head-up motion at impact is the one head move a motion study links to a slice.' : '';
      return `The head ${moved} ${n} ${unitWord(m.unit)} ${when}. A moving head often goes with a moving low point, which tends to show up as fat or thin contact.${extra}`;
    }

    case 'weightImpact':
      if (side === 'low') {
        return `The hip centre was ${val} at impact, back toward the trail foot. Hanging back often goes with fat and thin contact ` +
          'and a late flip of the hands, a hook pattern. This is a mass estimate from video, not pressure.';
      }
      return `The hip centre was ${val} at impact, further than the band. That is more slide than turn, and it often goes with the hands flipping to catch up.`;

    case 'weightTop':
      if (side === 'high') {
        return `The hip centre was ${val} at the top, over the lead foot. That is the reverse pivot pattern, which often goes with the weight falling back ` +
          'in the downswing.';
      }
      return `The hip centre was ${val} at the top, far onto the trail foot. That is a sway, and getting back to the ball tends to become a guess.`;

    case 'reversePivot':
      return 'The upper body leaned toward the target at the top, a reverse pivot. It often goes with the weight falling back in the downswing, ' +
        'and TPI names it a prime cause of lower back pain.';

    case 'shoulderTiltImpact':
      if (v < 0) {
        return `At impact the ${lead} shoulder was ${n} deg lower than the ${trail} shoulder, a reverse tilt. ` +
          'That often goes with a steeper strike and an open face: the over-the-top slice pattern.';
      }
      return `At impact the ${trail} shoulder was only ${n} deg lower than the ${lead} shoulder, less tilt than at address. Less tilt at impact often goes with ` +
        'a steeper strike and an open face, a slice pattern.';

    case 'shoulderTiltAddress':
      if (Math.round(v) === 0) {
        return `At address the shoulders were level. Without the ${trail} shoulder set lower it tends to be harder to turn behind the ball, ` +
          'the reverse pivot pattern.';
      }
      if (v < 0) {
        return `At address the ${lead} shoulder was ${n} deg lower than the ${trail} shoulder. Without the ${trail} shoulder set lower ` +
          'it tends to be harder to turn behind the ball, the reverse pivot pattern.';
      }
      if (side === 'high') {
        return `The ${trail} shoulder was ${n} deg lower at address, more than the band. Too much tilt often sets up a sway and a fat strike.`;
      }
      return `The ${trail} shoulder was only ${n} deg lower at address. Without enough tilt it tends to be harder to turn behind the ball, ` +
        'the reverse pivot pattern.';

    case 'leadArmTop':
      return `The ${lead} arm (lead) was bent to ${val} at the top. A changing swing radius often shows up in contact. ` +
        'A shorter, smoother backswing tends to keep it straighter, so it is coached with the tempo drill.';

    case 'leadArmImpact':
      return `The ${lead} arm (lead) bent to ${val} just after impact, the chicken wing. It often goes with a face left open through the strike, ` +
        'which adds loft and spin: a weak slice.';

    case 'trailElbowTop':
      return `The ${trail} elbow was ${val} at the top, a flying elbow. It often goes with a steep downswing across the ball, a slice pattern. ` +
        'There is no drill of its own yet, so use the tempo drill and keep the backswing shorter.';

    case 'tempo':
      return `Tempo was ${val} (${band}). Tour players sit near 3 to 1, but what they repeat is their own number. The aim is the same ratio every swing.`;

    case 'backswingTime':
    case 'downswingTime':
      return `${label} was ${val} (${band}). Times depend on the slow motion factor, so check the factor before trusting them.`;

    default:
      return `${label} was ${val} (${band}).`;
  }
}

function rangeText(m, green, ctx) {
  if (m.id === 'shoulderTiltImpact') {
    const addr = ctx.byId.get('shoulderTiltAddress');
    if (addr && measured(addr)) {
      return `the trail shoulder lower than at address, so more than ${fmtNum(numValue(addr), 'deg')} deg`;
    }
    return 'the trail shoulder lower than it was at address';
  }
  if (m.display === 'direction') return 'about on the line';
  if (!green) return null;
  const { lo, hi } = green;
  if (lo === null && hi === null) return null;
  const unit = m.unit;
  if (unit === 'bool') return hi ? 'yes' : 'no';
  if (unit === 'pct') return `${fmtRange(lo)} to ${fmtRange(hi)}% toward the lead foot`;
  if (unit === 'ratio' && m.id === 'tempo') return `between ${fmtRange(lo)} to 1 and ${fmtRange(hi)} to 1`;
  const uw = unitWord(unit);
  const dir = DIRECTION[m.id];
  if (dir) {
    if (lo === null) return `at most ${fmtRange(hi)} ${uw} ${dir[0]}`;
    if (hi === null) return `at least ${fmtRange(lo)} ${uw} ${dir[0]}`;
    if (lo < 0 && hi > 0) {
      return -lo === hi
        ? `within ${fmtRange(hi)} ${uw} either way`
        : `${fmtRange(-lo)} ${uw} ${dir[1]} to ${fmtRange(hi)} ${uw} ${dir[0]}`;
    }
    if (hi <= 0) return `${fmtRange(-hi)} to ${fmtRange(-lo)} ${uw} ${dir[1]}`;
    return `${fmtRange(lo)} to ${fmtRange(hi)} ${uw} ${dir[0]}`;
  }
  if (lo === null) return `at most ${fmtRange(hi)} ${uw}`.trim();
  if (hi === null) return `at least ${fmtRange(lo)} ${uw}`.trim();
  return `${fmtRange(lo)} to ${fmtRange(hi)} ${uw}`.trim();
}

function watchForText(entry, ctx) {
  const { m, green } = entry;
  const label = lowerFirst(labelOf(m));
  const range = rangeText(m, green, ctx);
  if (range) return `Next clip: look for ${label} in the green band, ${range}. This clip: ${fmtValue(m)}.`;
  return `Next clip: look for ${label} to move toward green. This clip: ${fmtValue(m)}.`;
}

function qualityNote(m) {
  if (m.id === 'downswingFrames') return `${fmtValue(m)} in the downswing (${m.band}). Timing numbers are rough.`;
  if (m.id === 'visibility') return `Tracking visibility was ${fmtValue(m)} (${m.band}). Numbers are less reliable.`;
  return lineText(m);
}

function compareEntries(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  if (b.weight !== a.weight) return b.weight - a.weight;
  const ca = typeof a.m.confidence === 'number' ? a.m.confidence : 0;
  const cb = typeof b.m.confidence === 'number' ? b.m.confidence : 0;
  if (cb !== ca) return cb - ca;
  return a.index - b.index;
}

function tempoHeadline(ctx, whatLine) {
  const tempo = ctx.byId.get('tempo');
  const hasTempo = tempo && measured(tempo);
  const what = hasTempo ? `${whatLine} Tempo: ${fmtValue(tempo)} (${tempo.band}).` : whatLine;
  const watchFor = hasTempo
    ? `Next clip: look for the same tempo, about ${fmtValue(tempo)}.`
    : 'Next clip: look for a steady tempo swing after swing.';
  const card = drillCard('tempo', ctx.handed);
  return {
    metricId: 'tempo',
    title: 'Keep your tempo',
    what,
    why: 'With nothing to fix, the useful signal is tempo. Tour players repeat their own ratio; the same rhythm every swing matters more than the number itself.',
    cue: card.cue,
    drill: drillText(card),
    drillCard: card,
    watchFor,
  };
}

// ---------- main ----------

/**
 * coach(analysis, { club, protect, handed, model }) -> Coaching
 * club: any id in clubs.js. protect: PROTECT mode. handed: 'right' | 'left'.
 * model: swing model id from knowledge.js (default neutral_rotary).
 */
export function coach(analysis, { club = 'other', protect = true, handed, model } = {}) {
  const metrics = Array.isArray(analysis?.metrics) ? analysis.metrics.filter(Boolean) : [];
  const measuredMetrics = metrics.filter(measured);
  const modelId = model || analysis?.model || 'neutral_rotary';
  const ctx = {
    club,
    protect: !!protect,
    handed: handed || analysis?.handed || 'right',
    model: modelId,
    byId: new Map(measuredMetrics.map((m) => [m.id, m])),
  };
  const notes = [];
  if (ctx.protect) notes.push(PROTECT_NOTE, STOP_LINE);

  const candidates = [];
  const protectedEntries = [];
  metrics.forEach((m, index) => {
    if (!measured(m) || !offBand(m)) return;
    if (QUALITY_IDS.has(m.id)) { notes.push(qualityNote(m)); return; }
    if (MODIFIER_IDS.has(m.id)) return;
    const green = greenBand(m, ctx);
    const side = sideOf(m, green);
    const weight = weightFor(m, club);
    const score = (BAND_SCORE[m.band] || 0) * weight;
    const drillId = drillIdFor(m, side);
    const entry = { m, green, side, weight, score, drillId, index, clear: clearlyOutside(m, green, ctx) };
    if (ctx.protect && PROTECTED_IDS.has(m.id)) { protectedEntries.push(entry); return; }
    candidates.push(entry);
  });
  candidates.sort(compareEntries);

  let head = null;
  const runners = [];
  const skipped = [];
  const unclear = [];
  for (const c of candidates) {
    if (!c.clear) { unclear.push(c); continue; }
    if (!head) {
      const drill = DRILLS[c.drillId];
      if (ctx.protect && drill && !drill.protectSafe) { skipped.push(c); continue; }
      head = c;
      continue;
    }
    if (runners.length < 2) runners.push(c);
  }

  const others = [];
  for (const r of runners) others.push({ metricId: r.m.id, line: lineText(r.m) });
  for (const s of skipped) others.push({ metricId: s.m.id, line: `${lineText(s.m)} ${SKIPPED_LINE}` });
  for (const p of protectedEntries) others.push({ metricId: p.m.id, line: `${lineText(p.m)} ${PROTECTIVE_LINE}` });
  for (const x of unclear.slice(0, 3)) others.push({ metricId: x.m.id, line: `${lineText(x.m)} ${UNCLEAR_LINE}` });

  let headline;
  if (head) {
    const card = drillCard(head.drillId, ctx.handed);
    headline = {
      metricId: head.m.id,
      title: labelOf(head.m),
      what: whatText(head.m),
      why: whyText(head, ctx),
      cue: card.cue,
      drill: drillText(card),
      drillCard: card,
      watchFor: watchForText(head, ctx),
    };
    if (ctx.protect && card.leadArmLoad === 'high') {
      notes.push('This drill loads the lead arm. Half swings only, and stop early if the arm complains.');
    }
  } else if (measuredMetrics.length === 0) {
    headline = tempoHeadline(ctx, 'Nothing could be measured in this clip.');
  } else if (unclear.length) {
    headline = tempoHeadline(ctx, `${NOTHING_CLEAR} Closest: ${lineText(unclear[0].m)}`);
  } else if (skipped.length || protectedEntries.length) {
    headline = tempoHeadline(ctx, 'Nothing coached was outside its band. The lines below were reported, not coached.');
  } else {
    headline = tempoHeadline(ctx, NOTHING_OUTSIDE);
  }

  if (ctx.protect && head && (head.m.id === 'leadArmImpact' || head.m.id === 'leadArmTop')) {
    notes.push(PROTECT.lines.bentArm);
  }
  notes.push(NOT_VISIBLE_LINE);
  const modelName = SWING_MODELS[modelId] ? SWING_MODELS[modelId].name : modelId;
  const clubWord = clubWordOf(club);
  const context = { model: modelId, modelName, measuredAgainst: `Measured against the ${modelName} bands for ${clubWord}.`, unvalidated: UNVALIDATED_LINE };

  return { headline, others, protect: ctx.protect, notes, context };
}
