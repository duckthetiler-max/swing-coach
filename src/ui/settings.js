// Settings screen.
import { el, field, select, switchRow, segmented, button, listRow } from './dom.js';
import { renderHowto } from './howto.js';
import { SWING_MODELS } from '../knowledge.js';
import { CLUB_LIST, GROUPS, normaliseBag } from '../clubs.js';

export function renderSettings(root, ctx) {
  const { settings, build, app, onSave, onKnowledge } = ctx;

  const height = el('input', { type: 'number', inputmode: 'numeric', min: 100, max: 250, placeholder: 'e.g. 180', value: settings.heightCm ?? '' });
  height.addEventListener('change', () => onSave({ heightCm: height.value === '' ? null : Number(height.value) }));

  const modelOptions = Object.entries(SWING_MODELS).map(([id, m]) => [id, m.name]);
  const model = SWING_MODELS[settings.swingModel] || SWING_MODELS.neutral_rotary;

  const simple = settings.simpleMode === true;
  const simpleCard = el('div', { class: 'card' },
    switchRow('Simple mode', simple, (v) => onSave({ simpleMode: v }),
      simple
        ? 'On. One tip, one drill and plain words. Every number is still one tap away under "Show me the details".'
        : 'Off. The full view: every number, band and picture up front.'));

  const cards = [
      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'You'),
        field('Your height in cm', height, 'Turns pixel distances into real centimetres. Blank means the tracker guesses your size.'),
        field('Handedness', segmented([['right', 'Right-handed'], ['left', 'Left-handed']], settings.handed, (v) => onSave({ handed: v }), 'Handedness'),
          'Right-handed means the left arm is the lead arm.'),
        field('Swing model', select(modelOptions, settings.swingModel, (v) => onSave({ swingModel: v })),
          `${model.summary} The app never guesses a named method from video; pick one only if you are working on it with a coach.`)),

      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'My bag'),
        el('p', { class: 'small muted' }, 'Tap to add or drop a club. Home offers only what is in the bag. The putter is not here because the app cannot read a putt.'),
        bagPicker(settings, onSave)),

      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Tracking'),
        field('Body tracker', select([['lite', 'Lite (fastest)'], ['full', 'Full (default)'], ['heavy', 'Heavy (most accurate, needs the network once)']], settings.model, (v) => onSave({ model: v })),
          'Heavy downloads about 30 MB from Google the first time and is the most accurate of the three. Lite and Full are built in.'),
        field('Body overlay', segmented([['markers', 'Markers and numbers'], ['figure', 'Figure']], settings.overlayStyle, (v) => onSave({ overlayStyle: v }), 'Body overlay'),
          'Markers puts a dot on every tracked joint and writes the measured numbers on the picture, coloured by band. Figure draws a person instead. New pictures only; saved swings keep the style they were saved with.'),
        field('Slow motion default', select([['auto', 'Auto from the swing'], ['1', 'Normal speed (1x)'], ['2', '2x'], ['4', '4x (120 fps)'], ['8', '8x (240 fps)']], String(settings.factorDefault), (v) => onSave({ factorDefault: v === 'auto' ? 'auto' : Number(v) })),
          'Samsung saves slow motion as a 30 fps file with the action already slowed. Auto reads the factor from the downswing length and you confirm it on the result; the tempo ratio does not depend on it, the times in seconds do.')),

      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Auto capture'),
        field('Live tracker', segmented([['lite', 'Lite, keeps up'], ['full', 'Full, may skip frames']], settings.liveModel, (v) => onSave({ liveModel: v }), 'Live tracker'),
          'The live tracker only has to spot the swing; it runs on every second or third frame if it must. Once a swing is cut, every kept picture in it is re-read by the Body tracker above (Full by default). Frames the camera delivers while the tracker is busy are lost; the capture screen shows how many were kept.'),
        field('Camera', segmented([['environment', 'Rear'], ['user', 'Front']], settings.camera, (v) => onSave({ camera: v }), 'Camera'),
          'Rear is sharper. Front lets you see the screen while you set up.'),
        switchRow('Say the cue out loud (experimental)', settings.speakCue, (v) => onSave({ speakCue: v }), 'Off by default. The practice research says feedback on about one ball in four, and these numbers are not yet validated on real footage. A beep still tells you a swing was seen.')),

      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'Coaching'),
        switchRow('Coach headline', settings.coachHeadline, (v) => onSave({ coachHeadline: v }),
          settings.coachHeadline
            ? 'On. One headline, only when a number is clearly outside its band once the doubt is counted, and marked as not yet validated.'
            : 'Off. Numbers and pictures only. The stricter choice until your own footage has validated the measurements.')),

      renderHowto(true),

      el('div', { class: 'card' },
        el('div', { class: 'eyebrow' }, 'About'),
        listRow('Where the numbers come from', 'Every band, its tier and its sources. The coach only comments on what it measured.', null, onKnowledge),
        el('p', { class: 'muted small', style: { marginTop: '10px' } }, 'Clips never leave the phone. Saved swings live in this browser only.')),
  ];

  if (!simple) {
    root.replaceChildren(el('div', { class: 'stack' }, simpleCard, ...cards, appCard(app, build)));
    return;
  }

  // Simple mode: who you are and your bag on top, everything technical folded under Advanced.
  const [, bagCard, ...advanced] = cards;
  const you = el('div', { class: 'card' },
    el('div', { class: 'eyebrow' }, 'About you'),
    field('Which way do you swing?', segmented([['right', 'Right-handed'], ['left', 'Left-handed']], settings.handed, (v) => onSave({ handed: v }), 'Which way do you swing?'),
      'Right-handed golfers stand with their left side toward the target.'),
    field('Your height in cm (optional)', height, 'Helps turn the video into real distances. Leave it blank and the app makes a guess.'));
  const modelCard = el('div', { class: 'card' },
    field('Swing model', select(modelOptions, settings.swingModel, (v) => onSave({ swingModel: v })),
      `${model.summary} The app never guesses a named method from video; pick one only if you are working on it with a coach.`));
  root.replaceChildren(el('div', { class: 'stack' },
    you, bagCard, simpleCard,
    el('details', { class: 'more' }, el('summary', {}, 'Advanced'), el('div', { class: 'stack' }, modelCard, ...advanced)),
    appCard(app, build)));
}

function bagPicker(settings, onSave) {
  const bag = normaliseBag(settings.bag);
  const groups = [];
  for (const [g, name] of Object.entries(GROUPS)) {
    const clubs = CLUB_LIST.filter((c) => c.group === g && c.id !== 'other');
    if (!clubs.length) continue;
    groups.push(el('div', { class: 'field' }, el('span', { class: 'field-label small' }, name),
      el('div', { class: 'chips' }, clubs.map((c) => el('button', {
        type: 'button', class: 'chip', 'aria-pressed': String(bag.includes(c.id)),
        onClick: () => {
          const next = bag.includes(c.id) ? bag.filter((id) => id !== c.id) : [...bag, c.id];
          if (!next.length) return;
          const patch = { bag: next };
          if (!next.includes(settings.club)) patch.club = normaliseBag(next)[0];
          onSave(patch);
        },
      }, c.short)))));
  }
  return el('div', {}, ...groups);
}

function appCard(app, build) {
  const a = app || {};
  const rows = [];
  if (a.installed) rows.push(listRow('On your home screen', 'Opens full screen and works offline.', el('span', { class: 'pill green' }, 'installed')));
  else if (a.canInstall) rows.push(listRow('Put it on your home screen', 'Opens full screen like an app and works offline at the range.', button('Add', () => a.install(), 'btn primary')));
  else rows.push(listRow('Home screen', 'Open this page in Chrome or Samsung Internet and choose Add to home screen from the browser menu.', null));
  rows.push(listRow('Offline', a.offlineReady ? 'Ready. The app and the body tracker are stored on this phone.' : 'Not stored yet. Reload once while online and it will be.',
    el('span', { class: `pill ${a.offlineReady ? 'green' : 'na'}` }, a.offlineReady ? 'ready' : 'not yet')));
  rows.push(a.updateReady
    ? listRow('Update ready', 'A newer build is waiting. Applying it reloads the app.', button('Apply', () => a.applyUpdate(), 'btn primary'))
    : listRow(`Build ${build}`, 'Checks for a newer build when online.', button('Check', () => a.checkUpdate(), 'btn')));
  return el('div', { class: 'card' }, el('div', { class: 'eyebrow' }, 'App'), ...rows);
}
