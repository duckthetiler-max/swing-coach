// "How to film" panel: the capture protocol in plain words.
import { el } from './dom.js';

export const HOWTO_STEPS = [
  'Prop the phone still: mini tripod, or leaning on the bag or the bay divider. Portrait or landscape both work.',
  'Whole body in frame with head room, and the club visible at address.',
  'Samsung Slow motion mode if you can. Normal video works, but under 12 frames in the downswing makes the timing numbers rough.',
  'Face-on: phone on the ball-to-target line extended, chest height, square to your chest.',
  'Down-the-line: phone behind your hands on the target line, hip to chest height, pointing at the target.',
  'One swing per clip. Stand still for a second at address first.',
  'Down-the-line is the priority angle if only one bay works: it shows early extension, the usual cause of a two-way miss.',
  'Auto capture: prop the phone, tap Start, hit balls. Each swing is read on its own and the one thing is said out loud. Normal speed only, so use a slow-motion clip when you want the timing numbers sharp.',
];

export function renderHowto(open = false) {
  const d = el('details', { class: 'card', open },
    el('summary', {}, 'How to film'),
    el('ol', {}, HOWTO_STEPS.map((s) => el('li', {}, s))),
    el('p', { class: 'muted small' }, 'The clip never leaves the phone. Tracking runs in the browser.'));
  return d;
}
