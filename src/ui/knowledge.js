// Knowledge screen: where every number comes from, what the app cannot see, the swing
// models, setups, faults, tour and lab references, practice science and PROTECT evidence.
import { el } from './dom.js';
import {
  SOURCES, TIERS, NOT_VISIBLE, NOT_VISIBLE_SOURCES, SWING_MODELS, SETUP_BY_CLUB, FAULTS, BALL_FLIGHT,
  TOUR_REFERENCES, KINEMATICS, PROTECT, PRACTICE, CAPTURE,
} from '../knowledge.js';
import { NORMS, ALL_METRIC_IDS, NORMS_DISCLAIMER } from '../norms.js';
import { DRILLS } from '../drills.js';

const GRADE = { M: 'measured data', E: 'instruction or expert opinion', C: 'clinical protocol', R: 'review', D: 'documentation', U: 'unverified' };

export function sourceList(ids) {
  const seen = new Set();
  const items = [];
  for (const id of ids || []) {
    if (seen.has(id) || !SOURCES[id]) continue;
    seen.add(id);
    const s = SOURCES[id];
    items.push(el('li', { class: 'small' },
      el('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.title),
      el('span', { class: 'muted' }, ` ${s.by}${s.year ? `, ${s.year}` : ''}. ${GRADE[s.grade] || s.grade}.`)));
  }
  return items.length ? el('ul', { class: 'sources' }, items) : null;
}

function section(title, open, ...children) {
  return el('details', { class: 'card', open }, el('summary', {}, title), ...children);
}

export function renderKnowledge(root) {
  root.replaceChildren(
    el('div', { class: 'stack' },
      el('p', { class: 'muted' }, NORMS_DISCLAIMER),

      section('What this app cannot see', true,
        el('ul', {}, NOT_VISIBLE.map((s) => el('li', {}, s))),
        el('p', { class: 'small muted' }, 'Body evidence is correlated with ball flight, not a measurement of it. A slice or a hook is a clubface and path question, and a single phone camera cannot see either.'),
        sourceList(NOT_VISIBLE_SOURCES)),

      section('Every metric, its band and its sources', false,
        el('p', { class: 'small muted' }, `Tiers: A ${TIERS.A}. B ${TIERS.B}. C ${TIERS.C}. D ${TIERS.D}.`),
        ...ALL_METRIC_IDS.map((id) => {
          const n = NORMS[id];
          return el('div', { class: 'metric' },
            el('div', { class: 'metric-head' }, el('span', { class: 'metric-label' }, n.label), el('span', { class: 'pill na' }, `tier ${n.tier}`)),
            el('div', { class: 'metric-note' }, n.description),
            n.suppressed ? el('div', { class: 'metric-note' }, `Not shown: ${n.suppressed}`) : null,
            n.gatedBy ? el('div', { class: 'metric-note' }, `Not scored for: ${Object.keys(n.gatedBy).map((m) => SWING_MODELS[m].name).join(', ')}.`) : null,
            sourceList(n.sources));
        })),

      section('Tour reference values (references, not targets)', false,
        el('p', { class: 'small muted' }, 'Shown with attribution. A tour number is not a target for a returning amateur; your own previous clip is.'),
        ...TOUR_REFERENCES.map((r) => el('div', { class: 'metric' },
          el('div', { class: 'metric-label' }, NORMS[r.metricId].label),
          el('div', { class: 'metric-note' }, r.text),
          sourceList(r.sources)))),

      section('3D laboratory findings', false,
        ...KINEMATICS.map((k) => el('div', { class: 'metric' },
          el('div', { class: 'metric-label' }, k.name),
          el('div', { class: 'metric-note' }, k.value),
          sourceList(k.sources)))),

      section('Swing faults and the ball flight they produce', false,
        ...Object.values(FAULTS).map((f) => el('div', { class: 'metric' },
          el('div', { class: 'metric-head' }, el('span', { class: 'metric-label' }, f.name), el('span', { class: 'pill na' }, f.view === 'both' ? 'either angle' : f.view === 'fo' ? 'face-on' : 'down-the-line')),
          el('div', { class: 'metric-note' }, f.definition),
          el('div', { class: 'metric-note' }, el('strong', {}, 'Body cause: '), f.cause),
          el('div', { class: 'metric-note' }, el('strong', {}, 'Miss: '), f.miss),
          f.prevalence ? el('div', { class: 'metric-note' }, el('strong', {}, 'How common: '), f.prevalence) : null,
          sourceList(f.sources)))),

      section('Ball flight and the two-way miss', false,
        el('ul', {}, BALL_FLIGHT.facts.map((s) => el('li', {}, s))),
        el('p', {}, BALL_FLIGHT.twoWayMiss),
        el('p', { class: 'small muted' }, `Check first, in order: ${BALL_FLIGHT.checkFirst.map((id) => NORMS[id].label.toLowerCase()).join(', ')}.`),
        sourceList(BALL_FLIGHT.sources)),

      section('Swing models', false,
        el('p', { class: 'small muted' }, 'The app assumes the neutral baseline and never guesses a named method. Pick one in Settings only if you are working on it, because each model moves what counts as normal.'),
        ...Object.entries(SWING_MODELS).map(([id, m]) => el('div', { class: 'metric' },
          el('div', { class: 'metric-label' }, m.name),
          el('div', { class: 'metric-note' }, m.summary),
          el('div', { class: 'metric-note' }, el('strong', {}, 'Looks like: '), m.signature),
          m.typicalMiss ? el('div', { class: 'metric-note' }, el('strong', {}, 'Typical miss: '), m.typicalMiss) : null,
          m.caution ? el('div', { class: 'metric-note' }, el('strong', {}, 'Caution: '), m.caution) : null,
          sourceList(m.sources)))),

      section('Setup by club', false,
        el('p', { class: 'small muted' }, 'Only the driver, a mid iron and a pitching wedge have published setup numbers. Every other club shows what its sources say and is measured against the iron bands; the driver alone has driver bands.'),
        ...['driver', 'wood', 'hybrid', 'longIron', 'midIron', 'shortIron', 'wedge'].map((c) => setupBlock(SETUP_BY_CLUB[c]))),

      section('Drills and their evidence', false,
        el('p', { class: 'small muted' }, 'No controlled trial exists for any named swing drill. These are the drills most prescribed by TPI, GOLFTEC and top teachers, written to the practice-science rules: one cue, ball count first, done-when stated.'),
        ...Object.values(DRILLS).map((d) => el('div', { class: 'metric' },
          el('div', { class: 'metric-head' }, el('span', { class: 'metric-label' }, d.title), el('span', { class: 'pill na' }, d.protectSafe ? 'protect safe' : 'skipped in protect')),
          el('div', { class: 'metric-note' }, el('strong', {}, 'Cue: '), d.cue),
          el('div', { class: 'metric-note' }, d.setup),
          sourceList(d.sources)))),

      section('Practice science', false,
        el('ul', {}, PRACTICE.languageRules.map((s) => el('li', {}, s))),
        el('p', { class: 'small muted' }, `${PRACTICE.videoNote} ${PRACTICE.frequency}`),
        sourceList(PRACTICE.sources)),

      section('How to film, and the slow motion trap', false,
        el('ol', {}, CAPTURE.steps.map((s) => el('li', {}, s))),
        el('p', { class: 'small muted' }, CAPTURE.slowMotion),
        sourceList(CAPTURE.sources)),

      section('PROTECT mode evidence', false,
        el('p', {}, PROTECT.disclaimer),
        el('p', { class: 'small' }, PROTECT.painRule),
        el('p', { class: 'small' }, PROTECT.lines.followThrough),
        sourceList(PROTECT.sources))));
}

export function setupBlock(s) {
  if (!s) return null;
  const row = (k, v) => el('div', { class: 'metric-note' }, el('strong', {}, `${k}: `), v);
  return el('div', { class: 'metric' },
    el('div', { class: 'metric-label' }, s.name),
    row('Ball position', s.ballPosition), row('Stance', s.stance), row('Forward bend', s.forwardBend),
    row('Shoulder tilt', s.shoulderTilt), row('Weight', s.weight), row('Hands', s.hands), row('Attack angle', s.attackAngle),
    sourceList(s.sources));
}
