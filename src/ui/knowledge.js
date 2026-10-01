// Knowledge screen: where every number comes from, what the app cannot see, the swing
// models, setups, faults, tour and lab references, and practice science.
import { el, stepsList } from './dom.js';
import {
  SOURCES, TIERS, NOT_VISIBLE, NOT_VISIBLE_SOURCES, SWING_MODELS, SETUP_BY_CLUB, FAULTS, BALL_FLIGHT,
  TOUR_REFERENCES, KINEMATICS, PRACTICE, CAPTURE,
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
    items.push(el('li', {},
      el('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.title),
      el('span', { class: 'muted' }, ` ${s.by}${s.year ? `, ${s.year}` : ''}. ${GRADE[s.grade] || s.grade}.`)));
  }
  return items.length ? el('ul', { class: 'sources' }, items) : null;
}

function fold(title, open, ...children) {
  return el('details', { class: 'fold', open }, el('summary', {}, title), el('div', { class: 'stack' }, ...children));
}

/** One reference entry: a title, an optional tag, the text, its sources. */
function ref(title, tag, ...children) {
  return el('div', { class: 'ref' },
    el('div', { class: 'ref-head' }, el('span', { class: 'ref-title' }, title), tag ? el('span', { class: 'pill na' }, tag) : null),
    ...children);
}

const line = (text) => el('p', { class: 'caption' }, text);
const keyed = (k, v) => el('p', { class: 'caption' }, el('strong', {}, `${k}: `), v);

export function renderKnowledge(root) {
  root.replaceChildren(
    el('div', { class: 'page' },
      el('section', { class: 'sec' }, el('p', { class: 'lede' }, NORMS_DISCLAIMER)),

      el('section', { class: 'sec folds' },
        fold('What this app cannot see', true,
          el('ul', { class: 'plain' }, NOT_VISIBLE.map((s) => el('li', {}, s))),
          line('Body evidence is correlated with ball flight, not a measurement of it. A slice or a hook is a clubface and path question, and a single phone camera cannot see either.'),
          sourceList(NOT_VISIBLE_SOURCES)),

        fold('Every metric, its band and its sources', false,
          line(`Tiers: A ${TIERS.A}. B ${TIERS.B}. C ${TIERS.C}. D ${TIERS.D}.`),
          el('div', { class: 'refs' }, ALL_METRIC_IDS.map((id) => {
            const n = NORMS[id];
            return ref(n.label, `tier ${n.tier}`,
              line(n.description),
              n.suppressed ? line(`Not shown: ${n.suppressed}`) : null,
              n.gatedBy ? line(`Not scored for: ${Object.keys(n.gatedBy).map((m) => SWING_MODELS[m].name).join(', ')}.`) : null,
              sourceList(n.sources));
          }))),

        fold('Tour reference values (references, not targets)', false,
          line('Shown with attribution. A tour number is not a target for a returning amateur; your own previous clip is.'),
          el('div', { class: 'refs' }, TOUR_REFERENCES.map((r) => ref(NORMS[r.metricId].label, null, line(r.text), sourceList(r.sources))))),

        fold('3D laboratory findings', false,
          el('div', { class: 'refs' }, KINEMATICS.map((k) => ref(k.name, null, line(k.value), sourceList(k.sources))))),

        fold('Swing faults and the ball flight they produce', false,
          el('div', { class: 'refs' }, Object.values(FAULTS).map((f) => ref(f.name, f.view === 'both' ? 'either angle' : f.view === 'fo' ? 'face-on' : 'down-the-line',
            line(f.definition),
            keyed('Body cause', f.cause),
            keyed('Miss', f.miss),
            f.prevalence ? keyed('How common', f.prevalence) : null,
            sourceList(f.sources))))),

        fold('Ball flight and the two-way miss', false,
          el('ul', { class: 'plain' }, BALL_FLIGHT.facts.map((s) => el('li', {}, s))),
          el('p', {}, BALL_FLIGHT.twoWayMiss),
          line(`Check first, in order: ${BALL_FLIGHT.checkFirst.map((id) => NORMS[id].label.toLowerCase()).join(', ')}.`),
          sourceList(BALL_FLIGHT.sources)),

        fold('Swing models', false,
          line('The app assumes the neutral baseline and never guesses a named method. Pick one in Settings only if you are working on it, because each model moves what counts as normal.'),
          el('div', { class: 'refs' }, Object.entries(SWING_MODELS).map(([, m]) => ref(m.name, null,
            line(m.summary),
            keyed('Looks like', m.signature),
            m.typicalMiss ? keyed('Typical miss', m.typicalMiss) : null,
            m.caution ? keyed('Caution', m.caution) : null,
            sourceList(m.sources))))),

        fold('Setup by club', false,
          line('Only the driver, a mid iron and a pitching wedge have published setup numbers. Every other club shows what its sources say and is measured against the iron bands; the driver alone has driver bands.'),
          el('div', { class: 'refs' }, ['driver', 'wood', 'hybrid', 'longIron', 'midIron', 'shortIron', 'wedge'].map((c) => setupBlock(SETUP_BY_CLUB[c])))),

        fold('Drills and their evidence', false,
          line('No controlled trial exists for any named swing drill. These are the drills most prescribed by TPI, GOLFTEC and top teachers, written to the practice-science rules: one cue, ball count first, done-when stated.'),
          el('div', { class: 'refs' }, Object.values(DRILLS).map((d) => ref(d.title, `lead arm load: ${d.leadArmLoad}`,
            keyed('Cue', d.cue),
            line(d.setup),
            sourceList(d.sources))))),

        fold('Practice science', false,
          el('ul', { class: 'plain' }, PRACTICE.languageRules.map((s) => el('li', {}, s))),
          line(`${PRACTICE.videoNote} ${PRACTICE.frequency}`),
          sourceList(PRACTICE.sources)),

        fold('How to film, and the slow motion trap', false,
          stepsList(CAPTURE.steps),
          line(CAPTURE.slowMotion),
          sourceList(CAPTURE.sources)))));
}

export function setupBlock(s) {
  if (!s) return null;
  return el('div', { class: 'ref' },
    el('div', { class: 'ref-head' }, el('span', { class: 'ref-title' }, s.name)),
    keyed('Ball position', s.ballPosition), keyed('Stance', s.stance), keyed('Forward bend', s.forwardBend),
    keyed('Shoulder tilt', s.shoulderTilt), keyed('Weight', s.weight), keyed('Hands', s.hands), keyed('Attack angle', s.attackAngle),
    sourceList(s.sources));
}
