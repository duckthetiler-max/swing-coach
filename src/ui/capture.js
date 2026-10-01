// Auto capture screen: live camera with the body drawn on, a status line, the swings seen
// so far, and the session summary once you stop.
import { el, button, listRow, section, hero, stepsList, clubLabel, fmtDate } from './dom.js';
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
  return el('div', { class: 'page' },
    el('section', { class: 'sec' },
      el('p', { class: 'kicker muted' }, 'Auto capture, experimental'),
      hero('Prop the phone, hit balls.'),
      el('p', {}, 'The camera watches for a swing and reads each one on its own, so you never touch the phone between balls. A beep tells you a swing was seen.')),
    section('Before you start', stepsList([
      'Prop the phone still, chest height, whole body in frame with the club.',
      'Down-the-line (behind your hands, pointing at the target) shows early extension. Face-on shows sway and slide.',
      'Stand still at address for a second. Hit. Hold the finish for a second.',
    ])),
    section('Experimental',
      el('p', { class: 'muted' }, 'This has not been proven on a real camera yet. Analyse a clip is the dependable path.'),
      el('p', { class: 'caption' }, `Club: ${clubLabel(settings.club)}. Change it on Home. A Samsung gives a browser 30 fps, not slow motion, and frames that arrive while the tracker is busy are lost; the screen shows how many were kept. Timing numbers are rougher than a slow-motion clip.`)),
    el('section', { class: 'sec' },
      error ? el('h2', { class: 'kicker' }, 'The camera did not start') : null,
      error ? el('p', { class: 'lede' }, error) : null,
      button('Start the camera', () => actions.start(), 'btn primary big'),
      el('p', { class: 'caption' }, 'Nothing is recorded to the gallery and nothing leaves the phone. Only the swings you save are kept.')));
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
  const fps = el('div', { class: 'live-fps caption' }, session.camera && session.camera.frameRate ? `Camera says ${Math.round(session.camera.frameRate)} fps` : '');
  session.fpsEl = fps;
  const count = el('div', { class: 'live-count' }, `${session.swings.length}`);
  session.countEl = count;
  const last = el('p', { class: 'live-last' }, session.lastLine || 'No swing yet.');
  session.lastEl = last;

  const list = el('div', {}, session.swings.length ? swingList(session, actions) : null);
  session.listEl = list;

  return el('div', { class: 'page' },
    el('section', { class: 'sec' },
      box,
      el('div', { class: 'live-bar' },
        el('div', { class: 'live-badge' }, el('div', { class: 'kicker muted' }, 'Swings'), count),
        el('div', { class: 'live-text' }, status, fps)),
      last,
      el('div', { class: 'row' },
        button('Stop', () => actions.stop(), 'btn primary'),
        button(session.facing === 'user' ? 'Use rear camera' : 'Use front camera', () => actions.flip(), 'btn'))),
    list,
    el('p', { class: 'caption' }, 'Keep this screen open. If the phone locks, the camera stops. Tapping a swing stops the camera too; Start again carries the session on.'));
}

/** Called by the app for every tracked frame: draw the body and refresh the status line. */
export function paintLive(session, frame, info, settings) {
  const c = session.overlay;
  if (c && frame) {
    const v = session.cam.video;
    if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    if (frame.lm) drawBody(ctx, frame, { handed: settings.handed, style: settings.overlayStyle });
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
  return section('This session', el('div', { class: 'rows' },
    ...session.swings.slice().reverse().map((s) => listRow(
      `${s.n}. ${session.coachingOff ? 'Swing' : (s.coaching && s.coaching.headline ? s.coaching.headline.title : 'Swing')}`,
      `${s.band ? s.band.charAt(0).toUpperCase() + s.band.slice(1) + '. ' : ''}${s.saved ? 'Saved. ' : ''}${fmtDate(s.at)}`,
      null, () => actions.open(s.n)))));
}

function drillSection(card) {
  return section('The drill',
    el('p', { class: 'subhead' }, card.title),
    el('div', { class: 'kv' },
      el('div', {}, el('span', { class: 'k' }, 'Set up'), el('span', { class: 'v' }, card.setup)),
      el('div', {}, el('span', { class: 'k' }, 'Do'), el('span', { class: 'v' }, card.do)),
      el('div', {}, el('span', { class: 'k' }, 'Done when'), el('span', { class: 'v' }, card.doneWhen))));
}

function summary(session, settings, actions) {
  const swings = session.swings;
  const read = `Session done, ${swings.length} swing${swings.length === 1 ? '' : 's'} read`;
  session.coachingOff = settings.coachHeadline === false;
  if (session.coachingOff) {
    const left = swings.filter((s) => !s.saved).length;
    return el('div', { class: 'page' },
      el('section', { class: 'sec' },
        el('p', { class: 'kicker muted' }, read),
        hero('Numbers and pictures only.'),
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

  return el('div', { class: 'page' },
    el('section', { class: 'sec' },
      el('p', { class: 'kicker muted' }, read),
      h ? el('h2', { class: 'kicker' }, h.cue ? 'Your cue for the next bucket' : 'The one thing') : null,
      hero(h ? h.cue || h.title : 'Nothing to coach in these swings.'),
      h ? el('p', { class: 'lede' }, `The one thing in ${topN} of ${swings.length}: ${h.title}.`) : null),
    card ? drillSection(card) : null,
    swings.length ? swingList(session, actions) : null,
    button('Clear this session', () => actions.clear(), 'btn link'),
    el('div', { class: 'actionbar' },
      button('Start again', () => actions.start(), 'btn'),
      unsaved ? button(`Save ${unsaved === swings.length ? 'all' : unsaved} to history`, () => actions.saveAll(), 'btn primary') : button('Back to Home', () => actions.home(), 'btn primary')));
}

export { STATUS };
