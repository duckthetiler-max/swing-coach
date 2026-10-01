// Processing screen (the percentage, a progress line, cancel) and the "clip unusable" exit.
import { el, button, section, hero, stepsList } from './dom.js';
import { HOWTO_STEPS } from './howto.js';

export function renderProcessing(root, progress, onCancel) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.pct || 0)));
  root.replaceChildren(
    el('div', { class: 'page' },
      el('section', { class: 'sec progress-block' },
        el('p', { class: 'display', 'aria-hidden': 'true' }, `${pct}%`),
        el('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Progress', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': pct },
          el('div', { style: { width: `${pct}%` } })),
        el('p', { class: 'lede' }, progress.label || 'Working'),
        progress.detail ? el('p', { class: 'caption' }, progress.detail) : null),
      el('section', { class: 'sec' },
        el('p', { class: 'caption' }, 'Keep the screen on. A long slow-motion clip can take a minute. Nothing leaves the phone.'),
        button('Cancel', onCancel, 'btn big'))));
}

export function renderUnusable(root, info, onHome) {
  root.replaceChildren(
    el('div', { class: 'page' },
      el('section', { class: 'sec' },
        el('h2', { class: 'kicker' }, 'Could not read the swing'),
        hero(info.title || 'The swing could not be read.'),
        info.reasons && info.reasons.length ? el('ul', { class: 'plain' }, info.reasons.map((r) => el('li', { class: 'muted' }, r))) : null),
      section('The fix', stepsList(info.fix || HOWTO_STEPS)),
      el('div', { class: 'actionbar' }, button('Try another clip', onHome, 'btn primary'))));
}
