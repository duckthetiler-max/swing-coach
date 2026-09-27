// Simple mode: the result, tips and labels in plain words for a new golfer. Pure module:
// no DOM, safe in Node tests. Nothing here measures or ranks anything new. It reads the
// bands the metrics already carry and the coach's headline, and says them plainly. Like
// the coach, every sentence comes from a measured value, and "often" and "can" stay in:
// the camera sees the body, never the club or the ball.

import { NORMS, greenRange } from './norms.js';
import { KEEP_TEMPO_TITLE, MIN_HEADLINE_CONFIDENCE } from './coach.js';
import { clubGroup, clubLabel } from './clubs.js';

export const VIEW_WORDS = Object.freeze({
  dtl: 'Filmed from behind',
  fo: 'Filmed from the front',
  unknown: 'Camera angle unclear',
});

export function simpleViewLabel(view) {
  return VIEW_WORDS[view] || VIEW_WORDS.unknown;
}

/** 'left'/'right' words for the lead and trail side. */
export function sideWords(handed) {
  return handed === 'left' ? { lead: 'right', trail: 'left' } : { lead: 'left', trail: 'right' };
}

// ---------- at a glance ----------

/**
 * Body areas for the glance, each owning the metrics it summarises. Turn in degrees is not
 * measurable from one camera (norms.js suppresses it), so there is no Turn area.
 */
export const AREAS = Object.freeze([
  Object.freeze({ id: 'head', label: 'Head', ids: Object.freeze(['headTop', 'headImpact', 'headVertTop', 'headVertImpact']) }),
  Object.freeze({ id: 'hips', label: 'Hips', ids: Object.freeze(['earlyExtension', 'hipSway', 'hipSlide']) }),
  Object.freeze({ id: 'posture', label: 'Posture', ids: Object.freeze(['spineAddress', 'spineDelta']) }),
  Object.freeze({ id: 'balance', label: 'Balance', ids: Object.freeze(['weightTop', 'weightImpact', 'reversePivot']) }),
  Object.freeze({ id: 'shoulders', label: 'Shoulders', ids: Object.freeze(['shoulderTiltAddress', 'shoulderTiltImpact']) }),
  Object.freeze({ id: 'arms', label: 'Arms', ids: Object.freeze(['leadArmTop', 'leadArmImpact', 'trailElbowTop', 'handsPath']) }),
  Object.freeze({ id: 'rhythm', label: 'Rhythm', ids: Object.freeze(['tempo']) }),
]);

/** Never in the glance: timing information, clip quality, and the two turn angles. */
export const NOT_IN_GLANCE = Object.freeze(['backswingTime', 'downswingTime', 'downswingFrames', 'visibility', 'shoulderTurn', 'hipTurn']);

// In PROTECT mode a bent lead arm is reported, never coached, so the glance leaves it out.
const PROTECTED_IDS = new Set(['leadArmTop', 'leadArmImpact']);

export const STATUS_WORDS = Object.freeze({ good: 'Good', look: 'Worth a look', work: 'Work on this' });

/** Measured and scored: it has a value and a band. */
function scored(m) {
  return !!m && typeof m.value === 'number' && Number.isFinite(m.value)
    && (m.band === 'green' || m.band === 'amber' || m.band === 'red')
    && !m.suppressed && !m.gated;
}

/** Scored and tracked with enough confidence to call it good. */
function readable(m) {
  return scored(m) && (typeof m.confidence !== 'number' || m.confidence >= MIN_HEADLINE_CONFIDENCE);
}

function offBand(m) {
  return m.band === 'amber' || m.band === 'red';
}

/** True when the coach found a real fault, not the "keep your tempo" fallback. */
export function isRealFault(coaching) {
  const h = coaching && coaching.headline;
  return !!(h && h.metricId && h.title !== KEEP_TEMPO_TITLE);
}

/**
 * The glance: one row per body area this clip measured. The area holding the coach's
 * headline says "Work on this", whatever its confidence. Any other area with an amber or
 * red metric says "Worth a look", including one tracked with low confidence: an unsure red
 * is never called good. "Good" needs every metric green and read with confidence. Areas
 * with nothing scored are left out.
 */
export function glance(analysis, coaching) {
  const metrics = analysis && Array.isArray(analysis.metrics) ? analysis.metrics : [];
  const byId = new Map(metrics.filter(Boolean).map((m) => [m.id, m]));
  const focus = isRealFault(coaching) ? coaching.headline.metricId : null;
  const protect = !!(coaching && coaching.protect);
  const out = [];
  for (const area of AREAS) {
    const all = area.ids
      .filter((id) => !(protect && PROTECTED_IDS.has(id)))
      .map((id) => byId.get(id))
      .filter(scored);
    const sure = all.filter(readable);
    const unsureOff = all.filter((m) => !readable(m) && offBand(m));
    const holdsFocus = !!focus && all.some((m) => m.id === focus);
    if (!sure.length && !unsureOff.length && !holdsFocus) continue;
    let status = 'good';
    if (holdsFocus) status = 'work';
    else if (unsureOff.length || sure.some(offBand)) status = 'look';
    const shown = holdsFocus ? all : [...sure, ...unsureOff];
    out.push({ id: area.id, label: area.label, status, word: STATUS_WORDS[status], metricIds: shown.map((m) => m.id) });
  }
  return out;
}

/** Why the coach fell back to rhythm: 'protected' (a lead-arm reading PROTECT keeps
 * uncoached), 'unclear' (a red or amber reading not clear enough to coach) or 'clean'. */
export function keepReason(analysis, coaching) {
  const metrics = analysis && Array.isArray(analysis.metrics) ? analysis.metrics.filter(Boolean) : [];
  const inGlance = new Set(AREAS.flatMap((a) => a.ids));
  const off = metrics.filter((m) => scored(m) && offBand(m) && inGlance.has(m.id));
  if (coaching && coaching.protect && off.some((m) => PROTECTED_IDS.has(m.id))) return 'protected';
  if (off.some((m) => !PROTECTED_IDS.has(m.id) || !(coaching && coaching.protect))) return 'unclear';
  return 'clean';
}

// ---------- nice work ----------

const NICE_ORDER = ['hips', 'posture', 'balance', 'head', 'rhythm', 'shoulders', 'arms'];

export const NICE_FALLBACK = 'We got a clear look at a full swing. That is the hard part done.';

function niceLine(area, handed) {
  const { lead, trail } = sideWords(handed);
  const has = (id) => area.metricIds.includes(id);
  switch (area.id) {
    case 'head': return 'Your head stayed nice and steady.';
    case 'hips': return has('earlyExtension') ? 'Your hips kept their space from the ball.' : 'Your hips moved nicely through the swing.';
    case 'posture': return has('spineDelta') ? 'You held your posture all the way to the ball.' : 'You set up in a good posture.';
    case 'balance': return has('weightImpact') ? 'Your weight moved nicely onto your front foot.' : 'You stayed nicely balanced at the top.';
    case 'shoulders': return has('shoulderTiltImpact') ? 'Your shoulders tilted nicely through the ball.' : 'Your shoulders were set up nicely.';
    case 'arms':
      if (has('leadArmTop') || has('leadArmImpact')) return `Your ${lead} arm stayed nice and straight.`;
      if (has('handsPath')) return 'Your hands came down on a good path.';
      return `Your ${trail} elbow stayed tucked in nicely.`;
    case 'rhythm': return 'Your rhythm looked good.';
    default: return `${area.label} looked good.`;
  }
}

/** Up to `max` encouraging lines, one per all-green area, most useful areas first. */
export function niceWork(analysis, coaching, { handed = 'right', max = 2 } = {}) {
  return glance(analysis, coaching)
    .filter((a) => a.status === 'good')
    .sort((a, b) => NICE_ORDER.indexOf(a.id) - NICE_ORDER.indexOf(b.id))
    .slice(0, max)
    .map((a) => ({ areaId: a.id, line: niceLine(a, handed) }));
}

// ---------- the one thing, in plain words ----------

/** 'low' | 'high' | 'unknown': which side of its green band a value sits on. */
function sideOf(m, club, model) {
  const green = greenRange(NORMS[m.id], club, model);
  if (!green || typeof m.value !== 'number') return 'unknown';
  if (green.lo !== null && m.value < green.lo) return 'low';
  if (green.hi !== null && m.value > green.hi) return 'high';
  return 'unknown';
}

const LOW_POINT = 'A moving head often moves the bottom of your swing too, so you can hit it fat or thin.';
const RHYTHM_WHY = 'A steady rhythm, the same on every swing, tends to make good contact easier to repeat.';
const ROUGH_READ = 'This is a rough read from your hands only.';

/**
 * What is happening and why it matters, for the metric the coach picked. Both sentences
 * are hedged the same way the coach's own text is.
 */
export function plainFault(m, { handed = 'right', club = null, model = null } = {}) {
  if (!m || typeof m.value !== 'number') return { what: 'One part of your swing was outside the usual range.', why: '' };
  const v = m.value;
  const side = sideOf(m, club, model);
  const { lead, trail } = sideWords(handed);
  switch (m.id) {
    case 'earlyExtension':
      return v > 0
        ? { what: 'Your hips move toward the ball as you swing down.', why: 'That often squeezes your arms, so one shot can go left and the next one right.' }
        : { what: 'Your hips move back, away from the ball, as you swing down.', why: 'That can change where the club meets the ground, so contact can suffer.' };
    case 'spineDelta':
      return v < 0
        ? { what: 'You stand up out of your posture before you hit the ball.', why: 'That often goes with the hands flicking at the ball, so shots can go left or right.' }
        : { what: 'You bend over more on the way down than you did at the start.', why: 'That can make the club hit the ground before the ball.' };
    case 'spineAddress':
      return side === 'low'
        ? { what: 'You stand quite tall over the ball at the start.', why: 'Standing tall at the start often leads to standing up during the swing.' }
        : { what: 'You bend over a lot at the start.', why: 'That is hard to hold, so you may stand up during the swing.' };
    case 'handsPath':
      return v >= 0
        ? { what: 'Your hands come down further out than they went back, a move called over the top.', why: `That can send the club across the ball, so shots can pull or slice. ${ROUGH_READ}` }
        : { what: 'Your hands drop in behind you on the way down.', why: `That can leave the club stuck behind you, and a late flick of the hands can hook the ball. ${ROUGH_READ}` };
    case 'hipSlide':
      if (side === 'high') return { what: 'Your hips slide past the ball instead of turning.', why: 'Your upper body can fall behind, so your hands can flick at the ball to catch up.' };
      if (v < 0) return { what: 'Your hips move back, away from the target, as you hit the ball.', why: 'That is called hanging back, and it often puts the club into the ground behind the ball.' };
      return { what: 'Your hips barely move toward the target by the time you hit the ball.', why: 'Good players have their hips clearly closer to the target when they hit it.' };
    case 'hipSway':
      return v < 0
        ? { what: 'Your hips slide away from the target as you swing back.', why: 'Then you often have to slide back to reach the ball, so contact can be hit and miss.' }
        : { what: 'Your hips drift toward the target as you swing back.', why: 'That can tip your upper body toward the target, and your weight can fall back later.' };
    case 'headTop':
      return { what: v < 0 ? 'Your head moves away from the target as you swing back.' : 'Your head moves toward the target as you swing back.', why: LOW_POINT };
    case 'headImpact':
      return v < 0
        ? { what: 'Your head hangs back, away from the target, as you hit the ball.', why: LOW_POINT }
        : { what: 'Your head moves toward the target as you hit the ball.', why: LOW_POINT };
    case 'headVertTop':
      return { what: v > 0 ? 'Your head dips down as you swing back.' : 'Your head lifts up as you swing back.', why: LOW_POINT };
    case 'headVertImpact':
      return { what: v > 0 ? 'Your head dips down as you hit the ball.' : 'Your head lifts up as you hit the ball.', why: LOW_POINT };
    case 'weightImpact':
      return side === 'low'
        ? { what: 'Your weight stays on your back foot as you hit the ball.', why: 'That often means the club hits the ground behind the ball.' }
        : { what: 'Your hips slide too far toward the target as you hit the ball.', why: 'That is more slide than turn, so your hands can flick to catch up.' };
    case 'weightTop':
      return side === 'high'
        ? { what: 'Your weight moves onto your front foot as you swing back.', why: 'Your weight then tends to fall back as you swing down.' }
        : { what: 'Your weight goes a long way onto your back foot as you swing back.', why: 'Getting back to the ball then tends to become a guess.' };
    case 'reversePivot':
      return { what: 'Your upper body leans toward the target at the top of your swing.', why: 'Your weight then tends to fall back as you swing through, and it can strain your lower back.' };
    case 'shoulderTiltImpact':
      return v < 0
        ? { what: `Your ${lead} shoulder is lower than your ${trail} shoulder as you hit the ball.`, why: 'That often makes the swing steep, so shots can slice.' }
        : { what: 'Your shoulders tilt less as you hit the ball than they did at the start.', why: 'That often makes the swing steep, so shots can slice.' };
    case 'shoulderTiltAddress':
      if (side === 'high') return { what: `Your ${trail} shoulder is set very low at the start.`, why: 'Too much tilt can make you sway and hit the ground first.' };
      return {
        what: v < 0 ? `Your ${lead} shoulder is lower than your ${trail} shoulder at the start.` : 'Your shoulders are nearly level at the start.',
        why: `Setting your ${trail} shoulder a little lower makes it easier to turn behind the ball.`,
      };
    case 'leadArmTop':
      return { what: `Your ${lead} arm bends a lot at the top of your swing.`, why: 'That often changes the length of your swing, so contact can vary. A shorter, smoother backswing can help.' };
    case 'leadArmImpact':
      return { what: `Your ${lead} elbow folds up just after you hit the ball.`, why: 'That can leave the clubface open, so shots can come out weak and slicing.' };
    case 'trailElbowTop':
      return { what: `Your ${trail} elbow flies up high at the top of your swing.`, why: 'That often makes the club come down steep and across the ball.' };
    case 'tempo':
      return side === 'low'
        ? { what: 'Your backswing is quick compared with your downswing.', why: RHYTHM_WHY }
        : { what: 'Your backswing is slow compared with your downswing.', why: RHYTHM_WHY };
    default:
      return { what: 'One part of your swing was outside the usual range.', why: '' };
  }
}

export const KEEP_WHAT = 'Nothing in this swing was clearly off. Nice.';
export const KEEP_WHY = 'So your one thing is rhythm: keep the same count on every ball.';
export const UNCLEAR_WHAT = 'Nothing was clear enough to single out this time.';
export const UNCLEAR_WHY = 'Some readings were close to the line or hard to see, so your one thing is rhythm: keep the same count on every ball. The rest is under "Show me the details".';
export const PROTECTED_WHAT = 'Nothing we coach was clearly off.';
const protectedWhy = (lead) => `Your ${lead} arm is reported, not coached, while PROTECT mode is on. So your one thing is rhythm: keep the same count on every ball.`;
export const UNSEEN_WHAT = 'We could not see enough of your body to coach this swing.';
export const UNSEEN_WHY = 'Film it again with your whole body and the club in the picture.';
export const PROTECT_LINE = 'PROTECT mode is on: gentle drills only. Stop straight away if your arm hurts.';
export const EARLY_DAYS_LINE = 'Early days: these readings are not yet checked against real footage. If the pictures disagree, trust the pictures.';

/**
 * Everything the simple result shows, from an analysis and the coach's output.
 * state: 'fault' (a real one thing), 'keep' (the coach fell back to rhythm; `what` says why:
 * clean, unclear or protected), 'unseen' (no body reading), 'off' (the coach headline is
 * switched off in Settings).
 */
export function simpleResult(analysis, coaching, { handed = 'right', club = null, model = null, coachingOn = true } = {}) {
  const h = coaching && coaching.headline ? coaching.headline : null;
  // With the coach switched off nothing is singled out: no area says "Work on this".
  const seen = coachingOn ? coaching : { protect: !!(coaching && coaching.protect), headline: null };
  const areas = glance(analysis, seen);
  // Rhythm alone says nothing about the body, unless rhythm is the coach's one thing.
  const bodyRead = areas.some((a) => a.id !== 'rhythm' || a.status === 'work');
  let state;
  if (!coachingOn) state = 'off';
  else if (!bodyRead) state = 'unseen';
  else if (isRealFault(coaching)) state = 'fault';
  else state = 'keep';

  let what = '';
  let why = '';
  if (state === 'fault') {
    const m = (analysis.metrics || []).find((x) => x && x.id === h.metricId);
    ({ what, why } = plainFault(m, { handed, club, model: model || analysis.model || null }));
  } else if (state === 'keep') {
    const reason = keepReason(analysis, coaching);
    if (reason === 'protected') { what = PROTECTED_WHAT; why = protectedWhy(sideWords(handed).lead); }
    else if (reason === 'unclear') { what = UNCLEAR_WHAT; why = UNCLEAR_WHY; }
    else { what = KEEP_WHAT; why = KEEP_WHY; }
  } else if (state === 'unseen') {
    what = UNSEEN_WHAT;
    why = UNSEEN_WHY;
  }

  const card = h && h.drillCard ? h.drillCard : null;
  const coached = state === 'fault' || state === 'keep';
  const nice = state === 'unseen' ? [] : niceWork(analysis, seen, { handed });
  return {
    state,
    // Swings saved by the first build have no cue: fall back to the headline's title.
    cue: coached && h ? h.cue || h.title || '' : '',
    what,
    why,
    drill: coached && card ? {
      title: card.title,
      steps: [
        { label: 'Set up', text: card.setup },
        { label: 'Do', text: card.do },
        { label: 'You have got it when', text: card.doneWhen },
      ],
    } : null,
    nice: nice.length || state === 'unseen' ? nice : [{ areaId: null, line: NICE_FALLBACK }],
    areas,
    askView: analysis.view === 'unknown',
    protect: !!(coaching && coaching.protect),
    viewLabel: simpleViewLabel(analysis.view),
  };
}

// ---------- filming, tips, greeting ----------

export const FILM_STEPS = Object.freeze([
  Object.freeze({ title: 'Prop your phone at hip height.', body: 'Lean it on your bag or a shoe, about 3 big steps (3 metres) away. It has to stay still.' }),
  Object.freeze({ title: 'Film from behind you.', body: 'Put the phone behind your hands, looking toward your target, with your whole body and the club in the picture.' }),
  Object.freeze({ title: 'Use slow motion if you have it.', body: 'Start recording, stand still for a second, make one swing and hold your finish.' }),
]);

// Setup tips per club group, in plain words, from SETUP_BY_CLUB in knowledge.js.
// {club} becomes the club's name, e.g. "With your 7 iron".
const SETUP_TIPS = {
  driver: [
    { title: 'Tee it forward.', body: 'With your driver, play the ball level with your front heel.' },
    { title: 'Go wide.', body: 'Your driver gets your widest stance, a little wider than your shoulders.' },
    { title: 'Hands level with the ball.', body: 'With your driver, keep your hands level with the ball or just behind it.' },
    { title: 'Catch it on the way up.', body: 'The driver is the one club you want to meet the ball slightly on the way up.' },
  ],
  wood: [
    { title: 'Ball forward of the middle.', body: 'With your {club}, play the ball a little forward of the middle, not as far forward as the driver.' },
    { title: 'A stance in between.', body: 'With your {club}, stand a bit wider than for an iron but narrower than for the driver.' },
    { title: 'Brush the grass.', body: 'Off the grass, a fairway wood meets the ball slightly on the way down.' },
  ],
  hybrid: [
    { title: 'Ball a touch forward.', body: 'With your {club}, play the ball a little forward of the middle of your stance.' },
    { title: 'Just past shoulder width.', body: 'With your {club}, stand a touch wider than your shoulders.' },
    { title: 'Hit down on it.', body: 'A hybrid meets the ball on the way down, like an iron.' },
  ],
  longIron: [
    { title: 'Ball a touch forward.', body: 'With your {club}, play the ball a touch forward of the middle of your stance.' },
    { title: 'Shoulder-width stance.', body: 'With your {club}, stand with your feet about as wide as your shoulders.' },
    { title: 'Hands a little ahead.', body: 'At address, set your hands slightly ahead of the ball.' },
  ],
  midIron: [
    { title: 'Ball in the middle.', body: 'With your {club}, play the ball in the middle of your stance, or a touch toward your front foot.' },
    { title: 'Feet about shoulder-width.', body: 'With your {club}, stand with your feet about as wide as your shoulders.' },
    { title: 'Weight even.', body: 'At address, feel your weight shared evenly between both feet.' },
    { title: 'Hands a little ahead.', body: 'At address, set your hands slightly ahead of the ball.' },
    { title: 'Ball first, then grass.', body: 'Irons hit down: the club meets the ball first, then the ground.' },
  ],
  shortIron: [
    { title: 'Ball in the middle.', body: 'With your {club}, play the ball in the middle of your stance.' },
    { title: 'A bit narrower.', body: 'With your {club}, stand a little narrower than for a 7 iron.' },
    { title: 'Hands ahead.', body: 'At address, set your hands ahead of the ball.' },
  ],
  wedge: [
    { title: 'Ball in the middle.', body: 'With your {club}, play the ball in the middle of your stance, or a touch back.' },
    { title: 'Narrow stance.', body: 'With a wedge, stand about a hand-width narrower than for an iron.' },
    { title: 'Hands ahead.', body: 'Wedges have the most forward lean in the bag: set your hands ahead of the ball.' },
    { title: 'Weight even or a little forward.', body: 'With a wedge, share your weight evenly, or lean a little onto your front foot.' },
  ],
};

// Practice tips from PRACTICE in knowledge.js.
const PRACTICE_TIPS = [
  { title: 'Warm up first.', body: 'Five minutes of brisk walking, arm circles and slow turns before you hit a ball.' },
  { title: 'Wedges first.', body: 'Start with 10 to 20 easy half swings with a wedge before any full swing.' },
  { title: 'One thing at a time.', body: 'Work on one fix per session, with one short cue for each ball.' },
  { title: 'Film two swings, not twenty.', body: 'The first ball and the last one of the session is plenty to see what changed.' },
  { title: 'Rest days count.', body: 'Practise every other day. Three sessions a week beat five.' },
  { title: 'Play pretend holes.', body: 'End a session hitting a different club at a different target with every ball.' },
];

/** Every tip for a club: its setup tips first, then the practice tips. */
export function tipsFor(club) {
  const setup = SETUP_TIPS[clubGroup(club)] || SETUP_TIPS.midIron;
  const name = clubLabel(club);
  return [...setup.map((t) => ({ title: t.title, body: t.body.replace('{club}', name) })), ...PRACTICE_TIPS];
}

/** Today's tip: it changes once a day, and `offset` steps through the rest ("Next tip"). */
export function tipOfTheDay(club, date = new Date(), offset = 0) {
  const tips = tipsFor(club);
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  const n = tips.length;
  const i = (((day + offset) % n) + n) % n;
  return { ...tips[i], index: i, count: n };
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
