// Home screen: pick a clip, choose the club and angle, today's plan, setup for the club.
// Simple mode: a welcome, the club, one big button, how to film, and a tip of the day.
import { el, button, segmented, listRow, clubStrip, ANGLE_OPTIONS, clubLabel, viewLabel, fmtDate } from './dom.js';
import { clubsToOffer, clubGroup } from '../clubs.js';
import { renderHowto } from './howto.js';
import { PRACTICE, SETUP_BY_CLUB } from '../knowledge.js';
import { setupBlock } from './knowledge.js';
import { tipOfTheDay, greeting } from '../simple.js';
import { heroCard, filmCard, tipCard } from './simple.js';

// How many times "Next tip" was pressed this visit.
let tipOffset = 0;

export function renderHome(root, ctx) {
  const { settings, viewChoice, lastRecord, app, onPick, onCapture, onSetting, onViewChoice, onOpenLast, onKnowledge } = ctx;

  const fileInput = el('input', { type: 'file', accept: 'video/*', style: { display: 'none' } });
  fileInput.addEventListener('change', () => { if (fileInput.files && fileInput.files[0]) onPick(fileInput.files[0]); fileInput.value = ''; });
  const camInput = el('input', { type: 'file', accept: 'video/*', capture: 'environment', style: { display: 'none' } });
  camInput.addEventListener('change', () => { if (camInput.files && camInput.files[0]) onPick(camInput.files[0]); camInput.value = ''; });

  if (settings.simpleMode) {
    renderSimpleHome(root, ctx, fileInput, camInput);
    return;
  }

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
      install,
      sessionPlan(),
      last,
      el('details', { class: 'card' }, el('summary', {}, `Setting up with the ${clubLabel(settings.club).toLowerCase()}`),
        setupBlock(SETUP_BY_CLUB[clubGroup(settings.club)] || SETUP_BY_CLUB.midIron)),
      renderHowto(false),
      listRow('Where the numbers come from', 'Every band, its tier and its sources.', null, onKnowledge)));
}

function sessionPlan() {
  return el('details', { class: 'card' }, el('summary', {}, 'A range session that sticks'),
    el('ol', {}, PRACTICE.session.map((b) => el('li', {}, el('strong', {}, `${b.name}. `), b.detail))),
    el('p', { class: 'small muted' }, `${PRACTICE.videoNote} ${PRACTICE.frequency}`));
}

function renderSimpleHome(root, ctx, fileInput, camInput) {
  const { settings, lastRecord, app, onSetting, onOpenLast } = ctx;

  const start = el('div', { class: 'card stack' },
    el('div', { class: 'field' },
      el('h2', { class: 'section-title', style: { margin: 0 } }, 'Which club are you hitting?'),
      clubStrip(clubsToOffer(settings.bag, settings.club), settings.club, (v) => onSetting({ club: v }))),
    button('Check my swing', () => fileInput.click(), 'btn primary big'),
    el('div', { class: 'row', style: { justifyContent: 'center', marginTop: '6px' } }, button('Film a new swing now', () => camInput.click(), 'btn link')),
    fileInput, camInput);

  const install = app && app.canInstall
    ? el('div', { class: 'banner' },
      el('div', { class: 'text' }, el('div', { style: { fontWeight: 600 } }, 'Put it on your home screen'), el('div', { class: 'muted' }, 'Opens like an app and works at the range without signal.')),
      button('Add', () => app.install(), 'btn primary'))
    : null;

  const lastCue = lastRecord && lastRecord.coaching && lastRecord.coaching.headline
    ? lastRecord.coaching.headline.cue || lastRecord.coaching.headline.title
    : null;
  const last = lastRecord
    ? listRow(lastCue ? `Last time: ${lastCue}` : 'Your last swing', `${fmtDate(lastRecord.date)} · ${clubLabel(lastRecord.club)}`, null, () => onOpenLast(lastRecord.id))
    : null;

  const makeTip = () => tipCard(tipOfTheDay(settings.club, new Date(), tipOffset), () => {
    tipOffset += 1;
    const next = makeTip();
    tip.replaceWith(next);
    tip = next;
  });
  let tip = makeTip();

  root.replaceChildren(
    el('div', { class: 'stack' },
      heroCard(greeting()),
      start,
      install,
      last,
      filmCard(),
      tip));
}
