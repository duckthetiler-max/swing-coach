// Auto capture screen: live camera with the body drawn on, a status line, the swings seen
// so far, and the session summary once you stop.
import { el, button, listRow, clubLabel, fmtDate } from './dom.js';
import { statusWords, STATUS } from '../live.js';
import { drawBody } from '../overlay.js';

/**
 * ctx: { session, settings, actions: { start, stop, flip, open, saveAll, home }, error }
 * session: { running, starting, cam, swings: [...], status, trackerFps, lastLine, reading, mirror }
 */
export function renderCapture(root, ctx) {
  const { session, settings, actions, error } = ctx;
  if (!session || (!session.running && !session.starting && !session.swings.length)) {
    root.replaceChildren(intro(settings, actions, error));
    return;
  }
  if (session.running || session.starting) {
    root.replaceChildren(liveView(session, settings, actions));
    return;
  }
  root.replaceChildren(summary(session, settings, actions));
}

function intro(settings, actions, error) {
  return el('div', { class: 'stack' },
    el('div', { class: 'card stack' },
      el('div', {}, el('div', { class: 'eyebrow' }, 'Auto capture'), el('h2', {}, 'Prop the phone, hit balls')),
      el('p', {}, 'The camera watches for a swing and reads each one on its own, so you never touch the phone between balls. A beep tells you a swing was seen.'),
      el('ol', {},
        el('li', {}, 'Prop the phone still, chest height, whole body in frame with the club.'),
        el('li', {}, 'Down-the-line (behind your hands, pointing at the target) shows early extension. Face-on shows sway and slide.'),
        el('li', {}, 'Stand still at address for a second. Hit. Hold the finish for a second.')),
      el('div', { class: 'card warn flat' }, el('strong', {}, 'Experimental. '), 'This has not been proven on a real camera yet. Analyse a clip is the dependable path.'),
      el('p', { class: 'muted small' }, `Club: ${clubLabel(settings.club)}. Change it on Home. A Samsung gives a browser 30 fps, not slow motion, and frames that arrive while the tracker is busy are lost; the screen shows how many were kept. Timing numbers are rougher than a slow-motion clip.`),
      error ? el('div', { class: 'card bad flat' }, error) : null,
      button('Start the camera', () => actions.start(), 'btn primary big'),
      el('p', { class: 'muted small', style: { margin: 0 } }, 'Nothing is recorded to the gallery and nothing leaves the phone. Only the swings you save are kept.')));
}

function liveView(session, settings, actions) {
  session.coachingOff = settings.coachHeadline === false;
  const box = el('div', { class: `live${session.mirror ? ' mirror' : ''}` });
  const overlay = el('canvas', { class: 'live-overlay' });
  if (session.cam && session.cam.video) box.append(session.cam.video);
  box.append(overlay);
  session.overlay = overlay;

  const status = el('div', { class: `live-status s-${session.status || 'noBody'}` }, session.starting ? 'Starting the camera and the tracker.' : statusWords(session.status, { reading: session.reading }));
  session.statusEl = status;
  const fps = el('div', { class: 'live-fps muted small' }, session.camera && session.camera.frameRate ? `Camera says ${Math.round(session.camera.frameRate)} fps` : '');
  session.fpsEl = fps;
  const count = el('div', { class: 'live-count' }, `${session.swings.length}`);
  session.countEl = count;
  const last = el('div', { class: 'live-last' }, session.lastLine || 'No swing yet.');
  session.lastEl = last;

  const list = el('div', {}, session.swings.length ? swingList(session, actions) : null);
  session.listEl = list;

  return el('div', { class: 'stack' },
    el('div', { class: 'card live-card' },
      box,
      el('div', { class: 'live-bar' },
        el('div', { class: 'live-badge' }, el('div', { class: 'eyebrow' }, 'Swings'), count),
        el('div', { class: 'live-text' }, status, fps)),
      last),
    el('div', { class: 'row' },
      button('Stop', () => actions.stop(), 'btn primary'),
      button(session.facing === 'user' ? 'Use rear camera' : 'Use front camera', () => actions.flip(), 'btn')),
    list,
    el('p', { class: 'muted small' }, 'Keep this screen open. If the phone locks, the camera stops. Tapping a swing stops the camera too; Start again carries the session on.'));
}

/** Called by the app for every tracked frame: draw the body and refresh the status line. */
export function paintLive(session, frame, info, settings) {
  const c = session.overlay;
  if (c && frame) {
    const v = session.cam.video;
    if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (frame.lm) drawBody(ctx, frame, { handed: settings.handed, accent: '#30d158', ink: '#ffffff', style: settings.overlayStyle });
  }
  if (session.statusEl && info) {
    const s = info.status;
    session.status = s;
    session.statusEl.textContent = statusWords(s, { reading: session.reading });
    session.statusEl.className = `live-status s-${s}`;
  }
  if (session.fpsEl && info && info.cameraFps) {
    const cam = Math.round(info.cameraFps);
    const every = info.stride > 1 ? `tracking every ${info.stride}${info.stride === 2 ? 'nd' : info.stride === 3 ? 'rd' : 'th'} frame live` : 'tracking every frame live';
    const kept = typeof info.keptShare === 'number' ? `kept ${Math.round(info.keptShare * 100)}% of delivered frames` : 'dropped frames not reported by this browser';
    session.fpsEl.textContent = `${cam} frames a second seen, ${kept}, ${every}`;
  }
}

export function refreshLiveCounters(session, actions) {
  if (session.countEl) session.countEl.textContent = `${session.swings.length}`;
  if (session.lastEl) session.lastEl.textContent = session.lastLine || 'No swing yet.';
  if (session.listEl && actions) session.listEl.replaceChildren(session.swings.length ? swingList(session, actions) : el('div', {}));
}

function swingList(session, actions) {
  return el('div', { class: 'card' },
    el('div', { class: 'eyebrow' }, 'This session'),
    ...session.swings.slice().reverse().map((s) => listRow(
      `${s.n}. ${session.coachingOff ? 'Swing' : (s.coaching && s.coaching.headline ? s.coaching.headline.title : 'Swing')}`,
      `${s.band ? s.band + '. ' : ''}${s.saved ? 'Saved. ' : ''}${fmtDate(s.at)}`,
      null, () => actions.open(s.n))));
}

function summary(session, settings, actions) {
  const swings = session.swings;
  session.coachingOff = settings.coachHeadline === false;
  if (session.coachingOff) {
    const left = swings.filter((s) => !s.saved).length;
    return el('div', { class: 'stack' },
      el('div', { class: 'card flat stack' },
        el('div', {}, el('div', { class: 'eyebrow' }, 'Session done'), el('h2', {}, `${swings.length} swing${swings.length === 1 ? '' : 's'} read`)),
        el('p', { class: 'muted' }, 'Coaching is switched off in Settings. Open a swing for its numbers and pictures.')),
      swings.length ? swingList(session, actions) : null,
      el('div', { class: 'actionbar' },
        button('Start again', () => actions.start(), 'btn'),
        left ? button(`Save ${left === swings.length ? 'all' : left} to history`, () => actions.saveAll(), 'btn primary') : button('Back to Home', () => actions.home(), 'btn primary')));
  }
  const counts = new Map();
  for (const s of swings) {
    const id = s.coaching && s.coaching.headline ? s.coaching.headline.metricId : null;
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  let topId = null; let topN = 0;
  for (const [id, n] of counts) if (n > topN) { topId = id; topN = n; }
  const top = topId ? swings.find((s) => s.coaching.headline.metricId === topId) : null;
  const h = top ? top.coaching.headline : null;
  const card = h && h.drillCard;
  const unsaved = swings.filter((s) => !s.saved).length;

  return el('div', { class: 'stack' },
    el('div', { class: 'card accent stack' },
      el('div', {}, el('div', { class: 'eyebrow' }, 'Session done'), el('h2', {}, `${swings.length} swing${swings.length === 1 ? '' : 's'} read`)),
      h ? el('p', { class: 'what' }, `The one thing in ${topN} of ${swings.length}: ${h.title}.`) : el('p', { class: 'muted' }, 'Nothing to coach in these swings.'),
      h && h.cue ? el('div', { class: 'cue' }, el('div', { class: 'eyebrow' }, 'Your cue for the next bucket'), el('div', { class: 'cue-text' }, h.cue)) : null,
      card ? el('div', { class: 'drill-card' },
        el('h3', {}, card.title),
        el('div', { class: 'kv' }, el('span', { class: 'k' }, 'Drill'), el('span', {}, card.setup)),
        el('div', { class: 'kv' }, el('span', { class: 'k' }, 'Do'), el('span', {}, card.do)),
        el('div', { class: 'kv' }, el('span', { class: 'k' }, 'Done when'), el('span', {}, card.doneWhen))) : null,
      settings.protect ? el('p', { class: 'muted small' }, 'PROTECT mode: stop straight away if the lead arm hurts. Check the arm the next morning.') : null),
    swings.length ? swingList(session, actions) : null,
    el('div', { class: 'actionbar' },
      button('Start again', () => actions.start(), 'btn'),
      unsaved ? button(`Save ${unsaved === swings.length ? 'all' : unsaved} to history`, () => actions.saveAll(), 'btn primary') : button('Back to Home', () => actions.home(), 'btn primary')),
    el('div', { class: 'row', style: { justifyContent: 'center' } }, button('Clear this session', () => actions.clear(), 'btn link')));
}

export { STATUS };
