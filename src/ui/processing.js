// Processing screen (progress ring + cancel) and the "clip unusable" exit.
import { el, svg, button } from './dom.js';
import { HOWTO_STEPS } from './howto.js';

const R = 70;
const CIRC = 2 * Math.PI * R;

export function renderProcessing(root, progress, onCancel) {
  const pct = Math.max(0, Math.min(100, Math.round(progress.pct || 0)));
  const ring = el('div', { class: 'ring' },
    svg('svg', { viewBox: '0 0 160 160', 'aria-hidden': 'true' },
      svg('circle', { class: 'track', cx: 80, cy: 80, r: R }),
      svg('circle', { class: 'bar', cx: 80, cy: 80, r: R, 'stroke-dasharray': CIRC.toFixed(1), 'stroke-dashoffset': (CIRC * (1 - pct / 100)).toFixed(1) })),
    el('div', { class: 'pct' }, `${pct}%`));
  root.replaceChildren(
    el('div', { class: 'stack' },
      el('div', { class: 'card stack' },
        el('div', { class: 'ring-wrap' },
          ring,
          el('h2', { style: { marginTop: '14px' } }, progress.label || 'Working'),
          progress.detail ? el('p', { class: 'muted small' }, progress.detail) : null),
        el('p', { class: 'muted small', style: { textAlign: 'center' } }, 'Keep the screen on. A long slow-motion clip can take a minute. Nothing leaves the phone.'),
        button('Cancel', onCancel, 'btn ghost big'))));
}

export function renderUnusable(root, info, onHome) {
  root.replaceChildren(
    el('div', { class: 'stack' },
      el('div', { class: 'card bad stack' },
        el('div', {}, el('div', { class: 'eyebrow' }, 'Could not read the swing'), el('h2', {}, info.title || 'The swing could not be read.')),
        info.reasons && info.reasons.length ? el('ul', {}, info.reasons.map((r) => el('li', {}, r))) : null,
        el('h3', {}, 'The fix'),
        el('ol', {}, (info.fix || HOWTO_STEPS).map((s) => el('li', {}, s)))),
      el('div', { class: 'actionbar' }, button('Try another clip', onHome, 'btn primary'))));
}
