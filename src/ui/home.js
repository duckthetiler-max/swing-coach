// Home screen: pick a clip, choose the club and angle, today's plan, setup for the club.
import { el, button, segmented, switchRow, listRow, clubStrip, ANGLE_OPTIONS, clubLabel, viewLabel, fmtDate } from './dom.js';
import { clubsToOffer, clubGroup } from '../clubs.js';
import { renderHowto } from './howto.js';
import { PROTECT, PRACTICE, SETUP_BY_CLUB } from '../knowledge.js';
import { setupBlock } from './knowledge.js';

export function renderHome(root, ctx) {
  const { settings, viewChoice, lastRecord, app, onPick, onCapture, onSetting, onViewChoice, onOpenLast, onKnowledge } = ctx;

  const fileInput = el('input', { type: 'file', accept: 'video/*', style: { display: 'none' } });
  fileInput.addEventListener('change', () => { if (fileInput.files && fileInput.files[0]) onPick(fileInput.files[0]); fileInput.value = ''; });
  const camInput = el('input', { type: 'file', accept: 'video/*', capture: 'environment', style: { display: 'none' } });
  camInput.addEventListener('change', () => { if (camInput.files && camInput.files[0]) onPick(camInput.files[0]); camInput.value = ''; });

  const hero = el('div', { class: 'card stack' },
    el('div', {},
      el('div', { class: 'eyebrow' }, 'Analyse a swing'),
      el('p', { class: 'muted', style: { margin: 0 } }, 'Film a swing in slow motion with the camera app, then pick it here. The phone tracks your body and tells you the one thing to fix next.')),
    el('div', { class: 'field' }, el('span', { class: 'field-label' }, `Club: ${clubLabel(settings.club)}`),
      clubStrip(clubsToOffer(settings.bag, settings.club), settings.club, (v) => onSetting({ club: v })),
      el('p', { class: 'muted hint small' }, 'Your bag. Add or drop clubs in Settings.')),
    el('div', { class: 'field' }, el('span', { class: 'field-label' }, 'Camera angle'),
      segmented(ANGLE_OPTIONS, viewChoice, (v) => onViewChoice(v), 'Camera angle'),
      el('p', { class: 'muted hint small' }, 'Auto reads the angle from your shoulders. Down-the-line first if you can only film one.')),
    button('Analyse a clip', () => fileInput.click(), 'btn primary big'),
    button('Auto capture (experimental)', () => onCapture(), 'btn big'),
    el('div', { class: 'row', style: { justifyContent: 'center' } }, button('Record one clip with the camera app', () => camInput.click(), 'btn link')),
    fileInput, camInput);

  const protectRow = el('div', { class: 'card', style: { paddingTop: '6px', paddingBottom: '6px' } },
    switchRow('PROTECT mode', settings.protect, (v) => onSetting({ protect: v }),
      settings.protect ? 'On. No speed drills. Stop if the lead arm hurts.' : 'Off. Full coaching, including the lead arm.'));

  const install = app && app.canInstall
    ? el('div', { class: 'banner' },
      el('div', { class: 'text' }, el('div', { style: { fontWeight: 600 } }, 'Put it on your home screen'), el('div', { class: 'small muted' }, 'Opens full screen like an app and works offline at the range.')),
      button('Add', () => app.install(), 'btn primary'))
    : null;

  const last = lastRecord
    ? listRow(lastRecord.coaching && lastRecord.coaching.headline ? lastRecord.coaching.headline.title : 'Saved swing',
      `Last swing, ${fmtDate(lastRecord.date)}. ${clubLabel(lastRecord.club)}, ${viewLabel(lastRecord.view)}.`, null, () => onOpenLast(lastRecord.id))
    : null;

  root.replaceChildren(
    el('div', { class: 'stack' },
      hero,
      protectRow,
      install,
      sessionPlan(settings),
      last,
      el('details', { class: 'card' }, el('summary', {}, `Setting up with the ${clubLabel(settings.club).toLowerCase()}`),
        setupBlock(SETUP_BY_CLUB[clubGroup(settings.club)] || SETUP_BY_CLUB.midIron)),
      renderHowto(false),
      listRow('Where the numbers come from', 'Every band, its tier and its sources.', null, onKnowledge)));
}

function sessionPlan(settings) {
  if (settings.protect) {
    const stage = PROTECT.stages.find((s) => s.n === settings.protectStage) || PROTECT.stages[0];
    return el('div', { class: 'card warn stack' },
      el('div', {}, el('div', { class: 'eyebrow' }, "Today's plan"), el('h2', {}, `Stage ${stage.n}, ${stage.name.toLowerCase()}`)),
      el('p', { class: 'what', style: { fontWeight: 600 } }, PROTECT.lines.stop),
      el('ol', {}, stage.sessions.map((s, i) => el('li', {}, `Session ${'ABC'[i]}: ${s}`))),
      el('p', { class: 'small' }, 'Pick the session you have not done this week. Every other day, three a week.'),
      el('p', { class: 'small muted' }, PROTECT.lines.warmUp),
      el('p', { class: 'small muted' }, PROTECT.lines.surface),
      el('details', {}, el('summary', {}, 'Red flags'),
        el('ul', {}, PROTECT.redFlags.map((f) => el('li', {}, f))),
        el('p', { class: 'small muted' }, PROTECT.redFlagFooter)),
      el('p', { class: 'small muted' }, 'Change the stage in Settings when you finish one cleanly.'));
  }
  return el('details', { class: 'card' }, el('summary', {}, 'A range session that sticks'),
    el('ol', {}, PRACTICE.session.map((b) => el('li', {}, el('strong', {}, `${b.name}. `), b.detail))),
    el('p', { class: 'small muted' }, `${PRACTICE.videoNote} ${PRACTICE.frequency}`));
}
