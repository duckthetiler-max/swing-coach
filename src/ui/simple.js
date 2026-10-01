// Simple mode building blocks: the friendly pieces a new golfer sees first. Browser only.
// The words come from ../simple.js; this file only lays them out.
import { el, button, section, hero, stepsList } from './dom.js';
import { FILM_STEPS, EARLY_DAYS_LINE } from '../simple.js';

export { stepsList };

/** The welcome: a greeting, the promise in one serif line, and what happens next. */
export function heroCard(greetingText) {
  return el('section', { class: 'sec' },
    el('p', { class: 'kicker muted' }, `${greetingText}, golfer`),
    hero('One simple tip for every swing.'),
    el('p', { class: 'muted' }, 'Film a swing and we will show you one thing to work on, plus a drill to fix it.'));
}

export function filmCard(title = 'How to film it') {
  return section(title, stepsList(FILM_STEPS));
}

/** Tip of the day. tip: { title, body }. onNext swaps in the next one. */
export function tipCard(tip, onNext) {
  return el('section', { class: 'sec', 'aria-live': 'polite' },
    el('h2', { class: 'kicker' }, 'Tip of the day'),
    el('p', { class: 'subhead' }, tip.title),
    el('p', { class: 'muted' }, tip.body),
    onNext ? button('Next tip', onNext, 'btn link') : null);
}

/** Good, Worth a look, Work on this: weight and a reversed label, never colour. */
export function statusPill(status, word) {
  return el('span', { class: `status ${status}` }, word);
}

function oneThingCard(model, { unvalidated }) {
  const early = unvalidated ? el('p', { class: 'caption' }, EARLY_DAYS_LINE) : null;
  switch (model.state) {
    case 'fault':
    case 'keep':
      return el('section', { class: 'sec' },
        el('h2', { class: 'kicker' }, 'Your one thing'),
        hero(model.cue),
        el('p', { class: 'lede' }, model.what),
        model.why ? el('p', { class: 'muted' }, model.why) : null,
        early);
    case 'unseen':
      return el('section', { class: 'sec' },
        el('h2', { class: 'kicker' }, 'We could not read this one'),
        hero('Try filming it again.'),
        el('p', { class: 'lede' }, model.what),
        el('p', { class: 'muted' }, model.why));
    default:
      return el('section', { class: 'sec' },
        el('h2', { class: 'kicker' }, 'Coaching is off'),
        hero('Numbers and pictures only.'),
        el('p', { class: 'muted' }, 'The coach is switched off in Settings, so nothing is singled out. Everything that was measured is in the details below.'));
  }
}

function niceCard(lines) {
  return section('Nice work', el('ul', { class: 'plain' }, lines.map((n) => el('li', {}, n.line))));
}

function drillCard(drill) {
  return section('Try this drill',
    el('p', { class: 'subhead' }, drill.title),
    stepsList(drill.steps.map((s) => ({ key: s.label, body: s.text }))));
}

function glanceCard(areas) {
  return section('Your swing at a glance',
    el('div', { class: 'glance' }, areas.map((a) => el('div', { class: 'glance-row' },
      el('span', { class: 'area' }, a.label),
      statusPill(a.status, a.word)))));
}

function askViewCard(onPick) {
  return section('Which way did you film?',
    el('p', { class: 'muted' }, 'We could not tell from the video. Pick one and the coaching updates.'),
    el('div', { class: 'row' },
      button('From behind', () => onPick('dtl'), 'btn primary'),
      button('From the front', () => onPick('fo'), 'btn')));
}

function clipCard(warnings) {
  return section('For a clearer read next time', el('p', { class: 'muted' }, warnings.slice(0, 2).join(' ')));
}

/**
 * The simple result, top to bottom: the one thing, nice work, the drill and the glance.
 * model: simpleResult() from ../simple.js. opts: { meta, unvalidated, warnings, onPickView }
 */
export function simpleResultView(model, opts = {}) {
  const warnings = Array.isArray(opts.warnings) ? opts.warnings.filter(Boolean) : [];
  return [
    el('p', { class: 'kicker muted dateline' }, opts.meta || model.viewLabel),
    model.askView && opts.onPickView ? askViewCard(opts.onPickView) : null,
    oneThingCard(model, { unvalidated: !!opts.unvalidated }),
    warnings.length && model.state !== 'unseen' ? clipCard(warnings) : null,
    model.nice.length ? niceCard(model.nice) : null,
    model.drill ? drillCard(model.drill) : null,
    model.state === 'unseen' ? filmCard('How to film it next time') : null,
    model.areas.length ? glanceCard(model.areas) : null,
  ];
}
