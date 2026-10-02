// Home screen: pick a clip, choose the club and angle, today's plan, setup for the club.
// Simple mode: a welcome, the club, one big button, how to film, and a tip of the day.
import { el, button, segmented, listRow, linkRow, section, hero, clubStrip, ANGLE_OPTIONS, clubLabel, viewLabel, fmtDate } from './dom.js';
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

  const intro = el('section', { class: 'sec' },
    el('p', { class: 'kicker muted' }, 'Analyse a swing'),
    hero('Film one swing. Fix one thing.'),
    el('p', { class: 'muted' }, 'Film in slow motion with the camera app, then pick the clip here.'));

  const start = el('section', { class: 'sec' },
    el('h2', { class: 'kicker' }, `Club · ${clubLabel(settings.club)}`),
    clubStrip(clubsToOffer(settings.bag, settings.club), settings.club, (v) => onSetting({ club: v })),
    el('p', { class: 'caption' }, 'Your bag. Add or drop clubs in Settings.'),
    el('h2', { class: 'kicker' }, 'Camera angle'),
    segmented(ANGLE_OPTIONS, viewChoice, (v) => onViewChoice(v), 'Camera angle'),
    el('p', { class: 'caption' }, 'Auto reads the angle from your shoulders.'),
    button('Analyse a clip', () => fileInput.click(), 'btn primary big'),
    button('Auto capture (experimental)', () => onCapture(), 'btn big'),
    button('Record one clip with the camera app', () => camInput.click(), 'btn link'),
    fileInput, camInput);

  const install = installSection(app, 'Opens full screen like an app and works offline at the range.');

  const last = lastRecord
    ? section('Last swing', listRow(lastRecord.coaching && lastRecord.coaching.headline ? lastRecord.coaching.headline.title : 'Saved swing',
      `${fmtDate(lastRecord.date)}. ${clubLabel(lastRecord.club)}, ${viewLabel(lastRecord.view)}.`, null, () => onOpenLast(lastRecord.id)))
    : null;

  const reference = el('section', { class: 'sec folds' },
    sessionPlan(),
    el('details', { class: 'fold' }, el('summary', {}, `Setting up with the ${clubLabel(settings.club).toLowerCase()}`),
      setupBlock(SETUP_BY_CLUB[clubGroup(settings.club)] || SETUP_BY_CLUB.midIron)),
    renderHowto(false),
    linkRow('Where the numbers come from', onKnowledge));

  root.replaceChildren(el('div', { class: 'page' }, intro, start, install, last, reference));
}

function installSection(app, detail) {
  if (!app || !app.canInstall) return null;
  return section('Put it on your home screen',
    el('p', { class: 'muted' }, detail),
    button('Add to home screen', () => app.install(), 'btn'));
}

function sessionPlan() {
  return el('details', { class: 'fold' }, el('summary', {}, 'A range session that sticks'),
    el('div', { class: 'stack' },
      el('ol', { class: 'steps' }, PRACTICE.session.map((b, i) => el('li', {},
        el('span', { class: 'n', 'aria-hidden': 'true' }, String(i + 1).padStart(2, '0')),
        el('div', {}, el('div', { class: 't' }, b.name), el('div', { class: 'b' }, b.detail))))),
      el('p', { class: 'caption' }, `${PRACTICE.videoNote} ${PRACTICE.frequency}`)));
}

function renderSimpleHome(root, ctx, fileInput, camInput) {
  const { settings, lastRecord, app, onSetting, onOpenLast } = ctx;

  const start = el('section', { class: 'sec' },
    el('h2', { class: 'kicker' }, 'Which club are you hitting?'),
    clubStrip(clubsToOffer(settings.bag, settings.club), settings.club, (v) => onSetting({ club: v })),
    button('Check my swing', () => fileInput.click(), 'btn primary big'),
    button('Film a new swing now', () => camInput.click(), 'btn link'),
    fileInput, camInput);

  const install = installSection(app, 'Opens like an app and works at the range without signal.');

  const lastCue = lastRecord && lastRecord.coaching && lastRecord.coaching.headline
    ? lastRecord.coaching.headline.cue || lastRecord.coaching.headline.title
    : null;
  const last = lastRecord
    ? section('Last time', listRow(lastCue || 'Your last swing', `${fmtDate(lastRecord.date)} · ${clubLabel(lastRecord.club)}`, null, () => onOpenLast(lastRecord.id)))
    : null;

  const makeTip = () => tipCard(tipOfTheDay(settings.club, new Date(), tipOffset), () => {
    tipOffset += 1;
    const next = makeTip();
    tip.replaceWith(next);
    tip = next;
  });
  let tip = makeTip();

  root.replaceChildren(
    el('div', { class: 'page' },
      heroCard(greeting()),
      start,
      install,
      last,
      filmCard(),
      tip));
}
