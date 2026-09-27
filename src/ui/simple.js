// Simple mode building blocks: the friendly pieces a new golfer sees first. Browser only.
// The words come from ../simple.js; this file only lays them out.
import { el, svg, button } from './dom.js';
import { FILM_STEPS, PROTECT_LINE, EARLY_DAYS_LINE } from '../simple.js';

const stroke = { fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' };

function icon(paths) {
  return svg('svg', { viewBox: '0 0 24 24', ...stroke }, paths.map((d) => svg('path', { d })));
}

const ICONS = {
  check: () => icon(['M5 12l5 5 9-10']),
  eye: () => svg('svg', { viewBox: '0 0 24 24', ...stroke }, svg('path', { d: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z' }), svg('circle', { cx: 12, cy: 12, r: 3 })),
  flag: () => icon(['M6 21V3', 'M6 4l11 4-11 4']),
  bulb: () => icon(['M9 18h6', 'M10 22h4', 'M12 2a7 7 0 0 0-4 12.7V16h8v-1.3A7 7 0 0 0 12 2z']),
  alert: () => icon(['M12 3l10 18H2L12 3z', 'M12 10v5', 'M12 18h.01']),
};

const STATUS_ICON = { good: ICONS.check, look: ICONS.eye, work: ICONS.flag };

/** Rolling fairway and a flag on the green along the bottom of the welcome card. */
function course() {
  return svg('svg', { class: 'course', viewBox: '0 0 390 86', preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true' },
    svg('path', { d: 'M0 46 C 80 24, 150 28, 230 44 S 350 54, 390 38 V 86 H 0 Z', fill: '#2E7A52' }),
    svg('path', { d: 'M0 64 C 90 50, 190 54, 270 66 S 360 72, 390 62 V 86 H 0 Z', fill: '#3E9464' }),
    svg('ellipse', { cx: 300, cy: 47, rx: 7, ry: 2.5, fill: '#173F31' }),
    svg('path', { d: 'M300 46 V 12', stroke: '#FFFFFF', 'stroke-width': 2 }),
    svg('path', { d: 'M301 13 L 318 19 L 301 25 Z', fill: '#E8B04B' }));
}

export function heroCard(greetingText) {
  return el('div', { class: 'card hero' },
    el('div', { class: 'greet' }, `${greetingText}, golfer`),
    el('h1', {}, 'One simple tip for every swing.'),
    el('p', {}, 'Film a swing and we will show you one thing to work on, plus a drill to fix it.'),
    course());
}

/** Numbered steps. items: [{ title, body }] */
export function stepsList(items, cls = '') {
  return el('ol', { class: `steps ${cls}`.trim() }, items.map((s, i) => el('li', {},
    el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1)),
    el('div', {}, el('div', { class: 't' }, s.title), s.body ? el('div', { class: 'b' }, s.body) : null))));
}

export function filmCard(title = 'How to film it') {
  return el('div', { class: 'card' }, el('h2', { class: 'section-title' }, title), stepsList(FILM_STEPS));
}

/** Tip of the day. tip: { title, body }. onNext swaps in the next one. */
export function tipCard(tip, onNext) {
  return el('div', { class: 'card tip', 'aria-live': 'polite' },
    el('div', { class: 'tip-head' }, ICONS.bulb(), 'Tip of the day'),
    el('div', { class: 'tip-title' }, tip.title),
    el('p', {}, tip.body),
    onNext ? button('Next tip', onNext, 'btn link') : null);
}

export function statusPill(status, word) {
  const make = STATUS_ICON[status] || ICONS.check;
  return el('span', { class: `status ${status}` }, make(), word);
}

function notice(text) {
  return el('div', { class: 'card notice' }, ICONS.alert(), el('p', {}, text));
}

function oneThingCard(model, { unvalidated }) {
  const early = unvalidated ? el('p', { class: 'early' }, EARLY_DAYS_LINE) : null;
  switch (model.state) {
    case 'fault':
    case 'keep':
      return el('div', { class: 'card one-thing' },
        el('div', { class: 'label' }, 'Your one thing'),
        el('h1', { class: 'big' }, model.cue),
        el('p', { class: 'what' }, model.what),
        model.why ? el('p', {}, model.why) : null,
        early);
    case 'unseen':
      return el('div', { class: 'card one-thing' },
        el('div', { class: 'label' }, 'We could not read this one'),
        el('h1', { class: 'big' }, 'Try filming it again.'),
        el('p', { class: 'what' }, model.what),
        el('p', {}, model.why));
    default:
      return el('div', { class: 'card one-thing' },
        el('div', { class: 'label' }, 'Coaching is off'),
        el('h1', { class: 'big' }, 'Numbers and pictures only.'),
        el('p', {}, 'The coach is switched off in Settings, so nothing is singled out. Everything that was measured is in the details below.'));
  }
}

function niceCard(lines) {
  return el('div', { class: 'card nice' },
    el('h2', { class: 'section-title' }, 'Nice work'),
    el('ul', {}, lines.map((n) => el('li', {}, ICONS.check(), el('span', {}, n.line)))));
}

function drillCard(drill) {
  return el('div', { class: 'card' },
    el('h2', { class: 'section-title' }, 'Try this drill'),
    el('div', { class: 'drill-name' }, drill.title),
    stepsList(drill.steps.map((s) => ({ title: s.label, body: s.text })), 'sun'));
}

function glanceCard(areas) {
  return el('div', { class: 'card' },
    el('h2', { class: 'section-title' }, 'Your swing at a glance'),
    areas.map((a) => el('div', { class: 'glance-row' }, el('span', {}, a.label), statusPill(a.status, a.word))));
}

function askViewCard(onPick) {
  return el('div', { class: 'card stack' },
    el('div', {},
      el('h2', { class: 'section-title' }, 'Which way did you film?'),
      el('p', { class: 'muted', style: { margin: 0 } }, 'We could not tell from the video. Pick one and the coaching updates.')),
    el('div', { class: 'row' },
      button('From behind', () => onPick('dtl'), 'btn primary'),
      button('From the front', () => onPick('fo'), 'btn')));
}

function clipCard(warnings) {
  return el('div', { class: 'card notice' }, ICONS.alert(),
    el('div', {},
      el('p', { style: { fontWeight: 700, marginBottom: '4px' } }, 'For a clearer read next time'),
      el('p', {}, warnings.slice(0, 2).join(' '))));
}

/**
 * The simple result, top to bottom: the one thing, nice work, the drill and the glance.
 * model: simpleResult() from ../simple.js. opts: { meta, unvalidated, warnings, onPickView }
 */
export function simpleResultView(model, opts = {}) {
  const warnings = Array.isArray(opts.warnings) ? opts.warnings.filter(Boolean) : [];
  return [
    el('div', { class: 'meta-line' }, opts.meta || model.viewLabel),
    model.protect ? notice(PROTECT_LINE) : null,
    model.askView && opts.onPickView ? askViewCard(opts.onPickView) : null,
    oneThingCard(model, { unvalidated: !!opts.unvalidated }),
    warnings.length && model.state !== 'unseen' ? clipCard(warnings) : null,
    model.nice.length ? niceCard(model.nice) : null,
    model.drill ? drillCard(model.drill) : null,
    model.state === 'unseen' ? filmCard('How to film it next time') : null,
    model.areas.length ? glanceCard(model.areas) : null,
  ];
}
