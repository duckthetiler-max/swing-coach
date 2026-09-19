// Swing Coach: orchestration and routing. Everything runs on the phone; nothing is uploaded.
import { loadVideo, releaseVideo, probeFps, seekTo, captureFrame } from './video.js';
import { createLandmarker, processClip } from './pose.js';
import { findEvents, inferFactor } from './events.js';
import { detectView } from './angle.js';
import { estimateScale } from './scale.js';
import { computeMetrics, buildQuality } from './metrics.js';
import { coach } from './coach.js';
import { saveSwing, getSwing, deleteSwing, listSwings, getSettings, saveSettings } from './store.js';
import { composeStill, drawBody, drawGuides, drawCallouts } from './overlay.js';
import { calloutsFor } from './markers.js';
import { renderHome } from './ui/home.js';
import { renderProcessing, renderUnusable } from './ui/processing.js';
import { renderResult } from './ui/result.js';
import { renderHistory } from './ui/history.js';
import { renderSettings } from './ui/settings.js';
import { renderKnowledge } from './ui/knowledge.js';
import { HOWTO_STEPS } from './ui/howto.js';
import { toast } from './ui/dom.js';
import { openCamera, closeCamera, cameraSettings, LiveCapture, retrackPictures, warmUp, keepAwake, beep, speak, blobToDataUrl } from './capture.js';
import { buildLiveClip } from './live.js';
import { renderCapture, paintLive, refreshLiveCounters } from './ui/capture.js';

export const BUILD = '2026-09-17.5';

const root = document.getElementById('app');
const state = {
  settings: getSettings(),
  viewChoice: 'auto',
  landmarkers: new Map(),
  current: null,
  progress: null,
  unusable: null,
  lastRecord: null,
  installPrompt: null,
  updateReady: null,
  session: null,
  captureError: null,
};

// ---------- app chrome: title bar, back button, tab bar ----------

const chrome = {
  title: document.getElementById('title'),
  back: document.getElementById('back'),
  tabs: [...document.querySelectorAll('.tabbar a')],
  backTo: null,
};
chrome.back.addEventListener('click', () => { if (chrome.backTo) nav(chrome.backTo); });

/** Top-level screens show the tab bar; sub-screens show a back button instead; bare screens show neither. */
function setChrome({ title, tab = null, back = null, bare = false }) {
  chrome.title.textContent = title;
  chrome.backTo = back;
  chrome.back.hidden = !back;
  document.body.dataset.screen = bare ? 'bare' : back ? 'sub' : 'tab';
  for (const a of chrome.tabs) a.classList.toggle('active', a.dataset.tab === tab);
  document.title = title === 'Swing Coach' ? title : `${title}, Swing Coach`;
}

let lastScreen = null;
function enterScreen(key) {
  if (key === lastScreen) return;
  lastScreen = key;
  root.scrollTop = 0;
  root.classList.remove('enter');
  void root.offsetWidth;
  root.classList.add('enter');
}

// ---------- routing ----------

function nav(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

let prevRoute = null;

async function route() {
  const [name, arg] = (location.hash.replace(/^#/, '') || 'home').split('/');
  if (prevRoute === 'capture' && name !== 'capture') stopCapture();
  prevRoute = name;
  enterScreen(`${name}/${arg || ''}`);
  switch (name) {
    case 'capture':
      setChrome({ title: 'Auto capture', back: '#home' });
      renderCapture(root, { session: state.session, settings: state.settings, error: state.captureError, actions: captureActions });
      break;
    case 'processing':
      setChrome({ title: 'Tracking the swing', bare: true });
      if (state.progress) renderProcessing(root, state.progress, cancel);
      else nav('#home');
      break;
    case 'unusable':
      setChrome({ title: 'Clip unusable', back: '#home' });
      if (state.unusable) renderUnusable(root, state.unusable, () => nav('#home'));
      else nav('#home');
      break;
    case 'result':
      if (arg) { setChrome({ title: 'Saved swing', back: '#history' }); await openSaved(arg); }
      else if (state.current && state.current.analysis) { setChrome({ title: state.current.captured ? `Swing ${state.current.n}` : 'Your swing', back: state.current.captured ? '#capture' : '#home' }); showResult(); }
      else nav('#home');
      break;
    case 'history':
      setChrome({ title: 'History', tab: 'history' });
      await renderHistory(root, { onOpen: (id) => nav(`#result/${id}`) });
      break;
    case 'settings':
      setChrome({ title: 'Settings', tab: 'settings' });
      renderSettings(root, {
        settings: state.settings, build: BUILD, app: appInfo(),
        onSave: (patch) => { state.settings = saveSettings(patch); route(); },
        onKnowledge: () => nav('#knowledge'),
      });
      break;
    case 'knowledge':
      setChrome({ title: 'Where the numbers come from', back: '#settings' });
      renderKnowledge(root);
      break;
    default:
      setChrome({ title: 'Swing Coach', tab: 'home' });
      if (!state.lastRecord) {
        try { state.lastRecord = (await listSwings())[0] || null; } catch { state.lastRecord = null; }
      }
      renderHome(root, {
        settings: state.settings,
        viewChoice: state.viewChoice,
        lastRecord: state.lastRecord,
        app: appInfo(),
        onPick: (file) => analyze(file),
        onCapture: () => nav('#capture'),
        onSetting: (patch) => { state.settings = saveSettings(patch); route(); },
        onViewChoice: (v) => { state.viewChoice = v; route(); },
        onOpenLast: (id) => nav(`#result/${id}`),
        onKnowledge: () => nav('#knowledge'),
      });
  }
}

// ---------- auto capture ----------

const captureActions = {
  start: () => startCapture(),
  stop: () => { stopCapture(); route(); },
  flip: async () => {
    const next = state.settings.camera === 'user' ? 'environment' : 'user';
    state.settings = saveSettings({ camera: next });
    stopCapture();
    await startCapture();
  },
  open: (n) => {
    const sw = state.session && state.session.swings.find((x) => x.n === n);
    if (!sw) return;
    state.current = sw;
    nav('#result');
  },
  saveAll: async () => {
    const sess = state.session;
    if (!sess) return;
    let saved = 0;
    for (const sw of sess.swings) {
      if (sw.saved) continue;
      try {
        const rec = buildRecordFor(sw, `Auto capture, swing ${sw.n}`);
        await saveSwing(rec);
        sw.saved = true;
        state.lastRecord = rec;
        saved++;
      } catch (err) {
        toast(`Could not save swing ${sw.n}: ${err.message}`);
        break;
      }
    }
    if (saved) toast(`Saved ${saved} swing${saved === 1 ? '' : 's'} to history`);
    route();
  },
  home: () => nav('#home'),
  clear: () => { stopCapture(); state.session = null; route(); },
};

async function startCapture() {
  if (!state.session) state.session = { swings: [], n: 0 };
  const sess = state.session;
  if (sess.running || sess.starting) return;
  sess.starting = true;
  sess.error = null;
  state.captureError = null;
  sess.facing = state.settings.camera;
  sess.mirror = sess.facing === 'user';
  sess.lastLine = sess.swings.length ? sess.lastLine : '';
  sess.audio = beep(sess.audio, { freq: 660, ms: 40 });
  if (location.hash !== '#capture') location.hash = '#capture';
  else route();
  try {
    const landmarker = await getLandmarker(state.settings.liveModel);
    if (!sess.liveCounter) sess.liveCounter = { ts: 0 };
    await warmUp(landmarker, sess.liveCounter);
    const cam = await openCamera(sess.facing);
    sess.cam = cam;
    sess.camera = cameraSettings(cam);
    sess.releaseWake = await keepAwake();
    // The re-track tracker loads and warms up in the background; the first swing waits for it if needed.
    sess.retrackModel = state.settings.model === 'heavy' ? 'full' : state.settings.model;
    if (!sess.retrackCounter) sess.retrackCounter = { ts: 0 };
    sess.retrackReady = getLandmarker(sess.retrackModel, 'retrack').then((lm) => warmUp(lm, sess.retrackCounter)).catch(() => false);
    sess.live = new LiveCapture({
      landmarker,
      video: cam.video,
      onFrame: (frame, info) => paintLive(sess, frame, info, state.settings),
      onSwing: (seg) => queueLiveSwing(seg, { w: cam.video.videoWidth, h: cam.video.videoHeight }),
      onError: (err) => { console.error(err); toast(`Tracking stopped: ${err.message}`); stopCapture(); route(); },
    });
    sess.starting = false;
    sess.running = true;
    route();
    sess.live.start();
  } catch (err) {
    console.error(err);
    sess.starting = false;
    sess.running = false;
    if (sess.cam) { closeCamera(sess.cam); sess.cam = null; }
    state.captureError = err && err.message ? err.message : String(err);
    route();
  }
}

function stopCapture() {
  const sess = state.session;
  if (!sess) return;
  if (sess.live) { sess.live.stop(); sess.live = null; }
  if (sess.cam) { closeCamera(sess.cam); sess.cam = null; }
  if (sess.releaseWake) { sess.releaseWake(); sess.releaseWake = null; }
  sess.running = false;
  sess.starting = false;
  sess.reading = false;
  for (const k of ['overlay', 'statusEl', 'fpsEl', 'countEl', 'lastEl', 'listEl']) sess[k] = null;
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && state.session && state.session.running) {
    stopCapture();
    if (location.hash === '#capture') route();
  }
});

let liveQueue = Promise.resolve();

/** Swings are read one at a time, in order, so the re-track tracker's timestamps stay increasing. */
function queueLiveSwing(seg, dims) {
  liveQueue = liveQueue.then(() => ingestLiveSwing(seg, dims)).catch((err) => { console.error(err); toast(`Could not read that swing: ${err.message}`); });
  return liveQueue;
}

/**
 * Every picture in the cut swing is re-read by the full tracker, so the analysis sees the
 * camera's full rate whatever the live tracker managed. Falls back to the live frames when
 * the re-track finds no swing. Returns { frames, images } aligned by index.
 */
async function retrackSegment(seg, { w, h }) {
  const sess = state.session;
  const pictures = seg.pictures || null;
  const liveFrames = seg.frames;
  const liveImages = pictures ? liveFrames.map((f) => { const p = pictures.find((x) => x.index === f.i); return p ? p.blob : null; }) : null;
  if (!pictures || pictures.length < liveFrames.length) return { frames: liveFrames, images: liveImages, retracked: false };
  let landmarker = null;
  try {
    if (sess.retrackReady) await sess.retrackReady;
    landmarker = await getLandmarker(sess.retrackModel || 'full', 'retrack');
  } catch (err) { console.warn('No re-track tracker', err); }
  if (!landmarker) return { frames: liveFrames, images: liveImages, retracked: false };
  if (!sess.retrackCounter) sess.retrackCounter = { ts: 0 };
  const frames = await retrackPictures(landmarker, pictures, {
    w, h, counter: sess.retrackCounter,
    onProgress: (k, n) => { if (sess.statusEl) sess.statusEl.textContent = `Reading that swing, frame ${k} of ${n}.`; },
  });
  const ev = findEvents(buildLiveClip(frames, { w, h }));
  if (ev.confidence === 0) return { frames: liveFrames, images: liveImages, retracked: false };
  return { frames, images: pictures.map((p) => p.blob), retracked: true };
}

/** A swing segment from the live detector (or the demo) becomes an analysed swing in the session. */
async function ingestLiveSwing(seg, { w, h }) {
  const sess = state.session;
  if (!sess) return;
  const s = state.settings;
  sess.reading = true;
  if (sess.statusEl) sess.statusEl.textContent = 'Reading that swing.';
  if (sess.live) beep(sess.audio);
  const read = await retrackSegment(seg, { w, h });
  if (!state.session) return;
  const clip = buildLiveClip(read.frames, { w, h });
  const events = findEvents(clip);
  if (events.confidence === 0 || events.p7 - events.p4 < 2) {
    sess.lastLine = 'Saw movement, but not a full swing. Stand still at address, swing, hold the finish.';
    sess.reading = false;
    refreshLiveCounters(sess, captureActions);
    return;
  }
  const angleAuto = detectView(clip, events, s.handed);
  const swing = {
    n: ++sess.n, at: new Date().toISOString(), video: null, clip, events, angleAuto,
    factorInfo: { factor: 1, downswingFileSeconds: clip.frames[events.p7].t - clip.frames[events.p4].t, reason: 'Live capture runs in real time.' },
    factor: 1, viewOverride: state.viewChoice || 'auto', club: s.club, stills: null, demo: !read.images, captured: true,
    images: read.images || null, retracked: read.retracked, frameStats: seg.frameStats || null, cameraFps: sess.live ? sess.live.cameraFps : null, saved: false,
  };
  recomputeFor(swing);
  const hl = swing.coaching.headline;
  const metric = hl ? swing.analysis.metrics.find((m) => m.id === hl.metricId) : null;
  swing.band = metric && metric.band && metric.band !== 'na' ? metric.band : null;
  try {
    swing.stills = swing.images ? await stillsFromImages(swing) : drawStills(swing);
  } catch (err) {
    console.warn('Stills failed', err);
    swing.stills = null;
  }
  sess.swings.push(swing);
  if (!s.coachHeadline) sess.lastLine = `${swing.n}. Captured. Coaching is off; open it for the numbers and pictures.`;
  else sess.lastLine = hl ? `${swing.n}. ${hl.title}${swing.band ? `, ${swing.band}` : ''}. ${hl.cue || ''}`.trim() : `${swing.n}. Nothing to coach.`;
  if (s.speakCue && s.coachHeadline && sess.live && hl) speak(`${hl.title}${swing.band ? `, ${swing.band}` : ''}. ${hl.cue || ''}`);
  sess.reading = false;
  refreshLiveCounters(sess, captureActions);
}

async function stillsFromImages(c) {
  const out = {};
  const ref = c.clip.frames[c.events.p1];
  let fallback = null;
  for (const key of ['p1', 'p4', 'p7', 'p10']) {
    const i = c.events[key];
    const frame = c.clip.frames[i];
    if (!frame) continue;
    const raw = await blobToDataUrl(c.images[i]);
    if (!raw) { if (!fallback) fallback = drawStills(c); out[key] = fallback[key]; continue; }
    out[key] = await composeStill(raw, frame, { ...STILL_OPTS, ...stillStyle(c, key), handed: state.settings.handed, view: c.analysis.view, phase: key, reference: key === 'p1' ? null : ref });
  }
  return out;
}

window.addEventListener('hashchange', () => { route(); });

// ---------- install to the home screen, offline, updates ----------

const standalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

function appInfo() {
  return {
    installed: standalone(),
    canInstall: !!state.installPrompt && !standalone(),
    install: installApp,
    updateReady: !!state.updateReady,
    applyUpdate,
    checkUpdate,
    offlineReady: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
  };
}

async function installApp() {
  const p = state.installPrompt;
  if (!p) return;
  state.installPrompt = null;
  try {
    p.prompt();
    const choice = await p.userChoice;
    toast(choice && choice.outcome === 'accepted' ? 'Added to your home screen' : 'Not added');
  } catch (err) {
    toast(`Could not install: ${err.message}`);
  }
  route();
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.installPrompt = e;
  if ((location.hash || '#home') === '#home' || location.hash === '#settings') route();
});
window.addEventListener('appinstalled', () => { state.installPrompt = null; toast('Swing Coach is on your home screen'); route(); });

let swRegistration = null;

function watchWorker(worker) {
  if (!worker) return;
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
      state.updateReady = worker;
      toast('An update is ready. Apply it in Settings.');
      if (location.hash === '#settings') route();
    }
  });
}

function applyUpdate() {
  const w = state.updateReady;
  if (!w) return;
  if (state.progress) { toast('Wait for the analysis to finish first.'); return; }
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloaded) { reloaded = true; location.reload(); } });
  w.postMessage({ type: 'SKIP_WAITING' });
}

async function checkUpdate() {
  if (!swRegistration) { toast('Offline mode is not set up in this browser.'); return; }
  try {
    await swRegistration.update();
    toast(state.updateReady ? 'An update is ready.' : 'You have the latest build.');
  } catch (err) {
    toast(`Could not check: ${err.message}`);
  }
  route();
}

async function registerWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    swRegistration = await navigator.serviceWorker.register('./sw.js');
    if (swRegistration.waiting && navigator.serviceWorker.controller) state.updateReady = swRegistration.waiting;
    watchWorker(swRegistration.installing);
    swRegistration.addEventListener('updatefound', () => watchWorker(swRegistration.installing));
  } catch (err) {
    console.warn('Service worker failed', err);
  }
}

// ---------- the pipeline ----------

function cancel() {
  if (state.progress && state.progress.abort) state.progress.abort.abort();
}

function cleanupCurrent() {
  if (state.current && state.current.video) releaseVideo(state.current.video);
  state.current = null;
}

function updateProgress(patch) {
  if (!state.progress) return;
  Object.assign(state.progress, patch);
  if (location.hash === '#processing') renderProcessing(root, state.progress, cancel);
}

async function getLandmarker(model, tag = '') {
  const key = tag ? `${tag}:${model}` : model;
  if (!state.landmarkers.has(key)) {
    const p = createLandmarker({ model, basePath: '.' }).catch((err) => { state.landmarkers.delete(key); throw err; });
    state.landmarkers.set(key, p);
  }
  return state.landmarkers.get(key);
}

async function analyze(src) {
  cleanupCurrent();
  const s = state.settings;
  const abort = new AbortController();
  state.progress = { pct: 0, label: 'Loading the clip', detail: '', abort };
  nav('#processing');
  let video = null;
  try {
    video = await loadVideo(src);
    updateProgress({ label: 'Reading the frame rate' });
    const fps = await probeFps(video);
    updateProgress({ label: `Loading the ${s.model} body tracker`, detail: `${video.videoWidth} x ${video.videoHeight}, ${fps} fps file, ${video.duration.toFixed(1)} s` });
    const landmarker = await getLandmarker(s.model);
    if (abort.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const clip = await processClip(video, landmarker, {
      fps, maxSamples: 360, signal: abort.signal,
      onProgress: (pct, label) => updateProgress({ pct, label }),
    });
    await finishAnalysis({ video, clip, club: s.club, viewChoice: state.viewChoice, demo: false });
  } catch (err) {
    if (err && err.name === 'AbortError') { if (video) releaseVideo(video); nav('#home'); return; }
    console.error(err);
    if (video) releaseVideo(video);
    showUnusable('The clip could not be analysed.', [err && err.message ? err.message : String(err)]);
  } finally {
    state.progress = null;
  }
}

async function finishAnalysis({ video, clip, club, viewChoice, demo }) {
  const s = state.settings;
  const events = findEvents(clip);
  if (events.confidence === 0) {
    if (video) releaseVideo(video);
    showUnusable('No full swing was found in this clip.', [...events.notes, ...(clip.warnings || [])]);
    return;
  }
  const factorInfo = inferFactor(clip, events);
  const factor = s.factorDefault === 'auto' ? factorInfo.factor : Number(s.factorDefault);
  const angleAuto = detectView(clip, events, s.handed);
  state.current = { video, clip, events, factorInfo, factor, angleAuto, viewOverride: viewChoice || 'auto', club, stills: null, demo };
  recompute();
  if (events.p7 - events.p4 < 3) {
    cleanupCurrent();
    showUnusable('Fewer than 3 frames between the top and impact.', ['The downswing went by too fast for this clip.'], ['Film in slow motion.', 'Keep the phone still and the whole body in frame.']);
    return;
  }
  updateProgress({ pct: 100, label: 'Capturing the positions' });
  try {
    state.current.stills = video ? await captureStills(state.current) : drawStills(state.current);
  } catch (err) {
    console.warn('Stills failed', err);
    state.current.stills = null;
  }
  window.__swing = state.current;
  nav('#result');
}

function recompute() {
  recomputeFor(state.current);
}

function recomputeFor(c) {
  const s = state.settings;
  const angle = c.viewOverride === 'auto' ? c.angleAuto : { ...c.angleAuto, view: c.viewOverride };
  const scale = estimateScale(c.clip.frames[c.events.p1], s.handed, s.heightCm);
  const metrics = computeMetrics(c.clip, c.events, angle, scale, s.handed, c.factor, { club: c.club, model: s.swingModel });
  const quality = buildQuality(metrics, c.clip, c.events, angle, s.handed);
  c.analysis = {
    view: angle.view, handed: s.handed, model: s.swingModel, events: c.events, angle, scale, factor: c.factor,
    fpsReal: (c.clip.fps * c.factor) / c.clip.stride, metrics, quality,
  };
  c.coaching = coach(c.analysis, { club: c.club, protect: s.protect, handed: s.handed, model: s.swingModel });
}

const STILL_OPTS = { accent: '#30d158', ink: '#ffffff' };

async function captureStills(c) {
  const out = {};
  const ref = c.clip.frames[c.events.p1];
  for (const key of ['p1', 'p4', 'p7', 'p10']) {
    const frame = c.clip.frames[c.events[key]];
    if (!frame) continue;
    await seekTo(c.video, frame.t);
    const raw = captureFrame(c.video, 480);
    out[key] = await composeStill(raw, frame, { ...STILL_OPTS, ...stillStyle(c, key), handed: state.settings.handed, view: c.analysis.view, phase: key, reference: key === 'p1' ? null : ref });
  }
  return out;
}

/** Overlay style and the numbers to write on one frozen position. */
function stillStyle(c, key) {
  return { style: state.settings.overlayStyle, callouts: state.settings.overlayStyle === 'figure' ? [] : calloutsFor(key, c.analysis) };
}

/** Build the four stills whatever the source: a video, captured pictures, or the demo. */
async function makeStills(c) {
  if (c.video) return captureStills(c);
  if (c.images) return stillsFromImages(c);
  return drawStills(c);
}

/** Demo stills: the skeleton on a plain background (no video to draw). */
function drawStills(c) {
  const out = {};
  const w = 480;
  const h = Math.round((w * c.clip.h) / c.clip.w);
  const ref = c.clip.frames[c.events.p1];
  for (const key of ['p1', 'p4', 'p7', 'p10']) {
    const frame = c.clip.frames[c.events[key]];
    if (!frame) continue;
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    // A plain backdrop with a ground line under the feet, so the figure stands on something.
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2a2a2a'); sky.addColorStop(1, '#141414');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const groundY = Math.max(frame.lm[27].y, frame.lm[28].y, frame.lm[29].y, frame.lm[30].y) * h + 6;
    ctx.fillStyle = '#333333'; ctx.fillRect(0, groundY, w, h - groundY);
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
    const o = { ...STILL_OPTS, handed: state.settings.handed, scaleX: w / frame.w, scaleY: h / frame.h, reference: key === 'p1' ? null : ref };
    drawGuides(ctx, frame, c.analysis.view, key, o);
    drawBody(ctx, frame, { ...o, ...stillStyle(c, key) });
    drawCallouts(ctx, frame, stillStyle(c, key).callouts, o);
    out[key] = canvas.toDataURL('image/jpeg', 0.82);
  }
  return out;
}

function showUnusable(title, reasons, fix) {
  state.unusable = { title, reasons: (reasons || []).filter(Boolean), fix: fix || HOWTO_STEPS };
  state.progress = null;
  nav('#unusable');
}

function stripAnalysis(a) {
  return { ...a, metrics: a.metrics.map(({ norm, ...m }) => m) };
}

function buildRecord(note) {
  return buildRecordFor(state.current, note);
}

function buildRecordFor(c, note) {
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `s-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return {
    id, date: new Date().toISOString(), club: c.club, view: c.analysis.view, protect: state.settings.protect,
    analysis: stripAnalysis(c.analysis), coaching: c.coaching, stills: c.stills, note: note || '',
  };
}

function showResult() {
  const c = state.current;
  renderResult(root, {
    mode: 'live', analysis: c.analysis, coaching: c.coaching, stills: c.stills, club: c.club, settings: state.settings,
    live: { video: c.video, clip: c.clip, events: c.events, factorInfo: c.factorInfo, angleAuto: c.angleAuto, viewOverride: c.viewOverride, analysis: c.analysis, captured: !!c.captured, retracked: !!c.retracked, frameStats: c.frameStats || null, images: c.images || null, saved: !!c.saved },
    actions: {
      setView: async (v) => { c.viewOverride = v; recompute(); showResult(); try { c.stills = await makeStills(c); } catch { /* keep the old ones */ } if (state.current === c && location.hash === '#result') showResult(); },
      setFactor: (f) => { c.factor = f; recompute(); showResult(); },
      setOverlay: async (style) => { state.settings = saveSettings({ overlayStyle: style }); showResult(); try { c.stills = await makeStills(c); } catch { /* keep the old ones */ } if (state.current === c && location.hash === '#result') showResult(); },
      save: async (note) => { const rec = buildRecord(note); await saveSwing(rec); state.lastRecord = rec; c.saved = true; },
      another: () => { if (c.captured) { state.current = null; nav('#capture'); } else { cleanupCurrent(); nav('#home'); } },
      knowledge: () => nav('#knowledge'),
    },
  });
}

async function openSaved(id) {
  let rec = null;
  try { rec = await getSwing(id); } catch (err) { toast(`Could not open: ${err.message}`); }
  if (!rec) { nav('#history'); return; }
  renderResult(root, {
    mode: 'saved', analysis: rec.analysis, coaching: rec.coaching, stills: rec.stills, club: rec.club, settings: state.settings, record: rec,
    actions: {
      back: () => nav('#history'),
      knowledge: () => nav('#knowledge'),
      remove: async () => {
        if (!window.confirm('Delete this saved swing?')) return;
        await deleteSwing(id);
        if (state.lastRecord && state.lastRecord.id === id) state.lastRecord = null;
        nav('#history');
      },
    },
  });
}

// ---------- dev hooks ----------

async function runDemo(kind) {
  const { synthSwing } = await import('../tests/fixtures.js');
  if (kind === 'capture') {
    // Three synthetic swings through the live path, then the session summary.
    state.session = { swings: [], n: 0 };
    const knobs = [
      { view: 'dtl', earlyExtension: 0.07, spineLossDeg: 6 },
      { view: 'dtl', earlyExtension: 0.05, spineLossDeg: 2 },
      { view: 'dtl', earlyExtension: 0.01, spineLossDeg: 12 },
    ];
    for (const k of knobs) {
      const c = synthSwing(k);
      await ingestLiveSwing({ frames: c.frames, pictures: null }, { w: c.w, h: c.h });
    }
    nav('#capture');
    return;
  }
  const clip = kind === 'dtl'
    ? synthSwing({ view: 'dtl', earlyExtension: 0.07, spineLossDeg: 6 })
    : synthSwing({ hipImpact: 0.03, headTop: -0.06, shoulderTurnDeg: 74 });
  clip.warnings = ['Demo clip: synthetic body, no video.'];
  state.progress = { pct: 100, label: 'Demo', detail: '', abort: new AbortController() };
  await finishAnalysis({ video: null, clip, club: state.settings.club, viewChoice: 'auto', demo: true });
  state.progress = null;
}

/** Dev hook: `?screen=processing` or `?screen=unusable` shows that screen with sample text. */
function showDevScreen(which) {
  if (which === 'processing') {
    state.progress = { pct: 42, label: 'Tracking the body, pass 2 of 2', detail: '1080 x 1920, 30 fps file, 6.2 s', abort: new AbortController() };
    nav('#processing');
    return true;
  }
  if (which === 'unusable') {
    showUnusable('No full swing was found in this clip.', ['The hands never moved more than 3 px between samples.']);
    return true;
  }
  return false;
}

async function start() {
  const params = new URLSearchParams(location.search);
  if (params.get('club')) state.settings = saveSettings({ club: params.get('club') });
  registerWorker();
  if (params.get('screen') === 'capture') { state.session = null; nav('#capture'); return; }
  if (params.get('screen') && showDevScreen(params.get('screen'))) return;
  if (params.get('demo')) { await runDemo(params.get('demo')); return; }
  if (params.get('clip')) { await analyze(params.get('clip')); return; }
  route();
}

start();
