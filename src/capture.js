// Auto capture: camera stream, live tracker loop, a picture of every camera frame, swing
// detection, and the every-frame re-track after a swing is cut. Browser only. The pure
// detection logic lives in live.js.
//
// Two rates matter. The camera rate (30 fps on a Samsung in a browser, sometimes 60) and
// the rate the tracker manages live. Every frame callback takes a small picture; the live
// tracker only runs on every Nth one, enough to spot the swing. Once the detector cuts a
// segment, every kept picture inside it is re-read by the full tracker. The tracker call is
// synchronous, so camera frames that arrive while it runs are lost; the browser's
// presentedFrames counter says how many, and that count is shown, never hidden. Nothing
// is recorded to disk and nothing leaves the phone.

import { resultToFrame } from './pose-utils.js';
import { SwingDetector, FrameStore, chooseTrackStride, LIVE } from './live.js';

export const JPEG_WIDTH = 480;
export const JPEG_QUALITY = 0.75;

/** Open the camera. facing: 'environment' (rear) or 'user' (front). Resolves { stream, video, track }. */
export async function openCamera(facing = 'environment') {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('This browser cannot open the camera. Use Analyse a clip instead.');
  }
  const constraints = {
    audio: false,
    video: {
      facingMode: facing === 'user' ? 'user' : { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 60, min: 24 },
    },
  };
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia(constraints);
  } catch (err) {
    if (err && (err.name === 'OverconstrainedError' || err.name === 'NotFoundError')) {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
    } else {
      throw cameraError(err);
    }
  }
  const track = stream.getVideoTracks()[0] || null;
  const video = document.createElement('video');
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('autoplay', '');
  await video.play();
  if (!video.videoWidth) {
    await new Promise((resolve) => {
      const done = () => { video.removeEventListener('loadedmetadata', done); resolve(); };
      video.addEventListener('loadedmetadata', done);
      setTimeout(done, 3000);
    });
  }
  return { stream, video, track };
}

/** What the camera says it is giving: { frameRate, width, height } or nulls. */
export function cameraSettings(cam) {
  try {
    const s = cam && cam.track ? cam.track.getSettings() : {};
    return { frameRate: Number.isFinite(s.frameRate) ? s.frameRate : null, width: s.width || null, height: s.height || null };
  } catch {
    return { frameRate: null, width: null, height: null };
  }
}

function cameraError(err) {
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return new Error('Camera blocked. Allow the camera for this site in the browser, then try again.');
  }
  if (name === 'NotReadableError' || name === 'AbortError') {
    return new Error('The camera is busy in another app. Close it and try again.');
  }
  return new Error(`Could not open the camera. ${err && err.message ? err.message : String(err)}`);
}

export function closeCamera(cam) {
  if (!cam) return;
  try { cam.video.pause(); } catch { /* ignore */ }
  try { cam.video.srcObject = null; } catch { /* ignore */ }
  for (const track of cam.stream.getTracks()) { try { track.stop(); } catch { /* ignore */ } }
}

function ema(prev, next, k = 0.2) {
  return prev === null ? next : prev + (next - prev) * k;
}

/**
 * Runs the tracker on the live video and feeds the detector; keeps a picture of every frame.
 * opts: { landmarker, video, onFrame(frame, info), onSwing(segment), onError(err) }
 * info: { trackerFps, cameraFps, stride, detectMs, status, detector }
 * segment: detector segment plus pictures: [{ index, t, blob }] for EVERY camera frame in it.
 */
export class LiveCapture {
  constructor({ landmarker, video, onFrame, onSwing, onError, detectorOpts }) {
    this.landmarker = landmarker;
    this.video = video;
    this.onFrame = onFrame || (() => {});
    this.onSwing = onSwing || (() => {});
    this.onError = onError || (() => {});
    this.detector = new SwingDetector(detectorOpts);
    this.store = new FrameStore(LIVE.bufferSeconds);
    this.running = false;
    this.i = 0;
    this.t0 = null;
    this.lastTs = 0;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.detectTimes = [];
    this.frameTimes = [];
    this.trackerFps = 0;
    this.cameraFps = 0;
    this.keptShare = null; // kept / presented over the last two seconds, when the browser reports it
    this.pfWindow = [];
    this.detectMs = null;
    this.stride = 1;
    this.lastMediaTime = -1;
    this.raf = 0;
    this.rvfc = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.t0 = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.rvfc && this.video.cancelVideoFrameCallback) this.video.cancelVideoFrameCallback(this.rvfc);
    this.raf = 0;
    this.rvfc = 0;
    this.store.clear();
  }

  loop() {
    if (!this.running) return;
    const schedule = () => {
      if (!this.running) return;
      if (typeof this.video.requestVideoFrameCallback === 'function') {
        this.rvfc = this.video.requestVideoFrameCallback((now, metadata) => this.step(metadata));
      } else {
        this.raf = requestAnimationFrame(() => this.step());
      }
    };
    this.schedule = schedule;
    schedule();
  }

  info() {
    return { trackerFps: this.trackerFps, cameraFps: this.cameraFps, keptShare: this.keptShare, stride: this.stride, detectMs: this.detectMs, status: this.detector.status, detector: this.detector };
  }

  step(metadata) {
    if (!this.running) return;
    const pf = metadata && Number.isFinite(metadata.presentedFrames) ? metadata.presentedFrames : null;
    try {
      const v = this.video;
      if (v.readyState >= 2 && v.videoWidth && v.currentTime !== this.lastMediaTime) {
        this.lastMediaTime = v.currentTime;
        const now = performance.now();
        const t = (now - this.t0) / 1000;
        const index = this.i++;
        // Every frame: a picture, and the camera rate.
        this.store.add(index, t, this.snapshot(v), pf);
        if (pf !== null) {
          this.pfWindow.push({ now, pf });
          while (this.pfWindow.length && now - this.pfWindow[0].now > 2000) this.pfWindow.shift();
          const presented = pf - this.pfWindow[0].pf + 1;
          this.keptShare = presented > 0 ? Math.min(1, this.pfWindow.length / presented) : null;
        }
        this.frameTimes.push(now);
        while (this.frameTimes.length && now - this.frameTimes[0] > 2000) this.frameTimes.shift();
        if (this.frameTimes.length > 1) this.cameraFps = (this.frameTimes.length - 1) / ((now - this.frameTimes[0]) / 1000);
        // Every Nth frame: the live tracker, just to spot the swing.
        if (index % this.stride === 0) {
          const tsMs = Math.max(Math.floor(now), this.lastTs + 1);
          this.lastTs = tsMs;
          const d0 = performance.now();
          const result = this.landmarker.detectForVideo(v, tsMs);
          const took = performance.now() - d0;
          this.detectMs = ema(this.detectMs, took);
          const frameInterval = this.cameraFps > 1 ? 1000 / this.cameraFps : 1000 / 30;
          this.stride = chooseTrackStride(this.detectMs, frameInterval);
          const frame = resultToFrame(result, index, t, v.videoWidth, v.videoHeight);
          this.detectTimes.push(now);
          while (this.detectTimes.length && now - this.detectTimes[0] > 2000) this.detectTimes.shift();
          this.trackerFps = this.detectTimes.length > 1 ? (this.detectTimes.length - 1) / ((now - this.detectTimes[0]) / 1000) : 0;
          const seg = this.detector.push(frame);
          this.onFrame(frame, this.info());
          if (seg) this.emit(seg);
        }
        this.store.prune(t);
      }
    } catch (err) {
      this.onError(err);
      this.stop();
      return;
    }
    this.schedule();
  }

  /** Small JPEG of the current picture. Returns a Promise<Blob|null>. */
  snapshot(v) {
    const w = JPEG_WIDTH;
    const h = Math.round((w * v.videoHeight) / v.videoWidth);
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.ctx.drawImage(v, 0, 0, w, h);
    return new Promise((resolve) => {
      try {
        this.canvas.toBlob((blob) => resolve(blob || null), 'image/jpeg', JPEG_QUALITY);
      } catch {
        resolve(null);
      }
    });
  }

  async emit(seg) {
    const items = this.store.between(seg.startT, seg.endT);
    const blobs = await Promise.all(items.map((it) => it.picture));
    const pictures = items.map((it, k) => ({ index: it.index, t: it.t, blob: blobs[k] }));
    const counted = items.filter((it) => it.pf !== null);
    const frameStats = counted.length > 1
      ? { kept: counted.length, presented: counted[counted.length - 1].pf - counted[0].pf + 1 }
      : null;
    this.onSwing({ ...seg, pictures, frameStats, w: this.video.videoWidth, h: this.video.videoHeight });
  }
}

/**
 * Re-read every picture of a cut swing with a tracker of its own (VIDEO mode needs its own
 * increasing timestamps, so never share the live tracker). Yields between frames so the live
 * loop keeps running. Returns frames aligned with `pictures`; frames without a body have
 * lm null. counter = { ts } persists across calls on the same tracker.
 */
export async function retrackPictures(landmarker, pictures, { w, h, counter, onProgress }) {
  const frames = [];
  for (let k = 0; k < pictures.length; k++) {
    const p = pictures[k];
    let frame = { i: k, t: p.t, w, h, lm: null, world: null };
    if (p.blob) {
      let bmp = null;
      try { bmp = await createImageBitmap(p.blob); } catch { bmp = null; }
      if (bmp) {
        counter.ts = Math.max(counter.ts + 1, Math.round(p.t * 1000));
        try {
          const result = landmarker.detectForVideo(bmp, counter.ts);
          frame = resultToFrame(result, k, p.t, w, h);
        } catch (err) {
          console.warn('Re-track failed on a frame', err);
        }
        bmp.close();
      }
    }
    frames.push(frame);
    if (onProgress && k % 10 === 0) onProgress(k + 1, pictures.length);
  }
  return frames;
}

/**
 * The first detection on a fresh tracker compiles its GPU programs and can take seconds.
 * Run one on a blank picture now so that cost lands while the camera is starting, not on
 * the first swing. counter = { ts } is the tracker's own timestamp counter.
 */
export async function warmUp(landmarker, counter) {
  try {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#444'; ctx.fillRect(0, 0, 64, 64);
    const bmp = await createImageBitmap(c);
    counter.ts = Math.max(counter.ts + 1, 1);
    landmarker.detectForVideo(bmp, counter.ts);
    bmp.close();
    return true;
  } catch (err) {
    console.warn('Tracker warm-up failed', err);
    return false;
  }
}

/** Keep the screen on while capturing. Returns a release function. */
export async function keepAwake() {
  let lock = null;
  const request = async () => {
    try { lock = await navigator.wakeLock.request('screen'); } catch { lock = null; }
  };
  if (!('wakeLock' in navigator)) return () => {};
  await request();
  const onVisible = () => { if (document.visibilityState === 'visible' && (!lock || lock.released)) request(); };
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    if (lock) { try { lock.release(); } catch { /* ignore */ } }
    lock = null;
  };
}

/** Short beep so you know the swing was seen without looking at the screen. */
export function beep(audio, { freq = 880, ms = 120 } = {}) {
  try {
    const ctx = audio || new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + ms / 1000);
    return ctx;
  } catch {
    return audio || null;
  }
}

/** Say a line out loud. Cancels anything still being said. */
export function speak(text) {
  try {
    if (!('speechSynthesis' in window) || !text) return false;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-AU';
    u.rate = 1.0;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

/** Blob -> data URL (for stills and saved records). */
export function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    if (!blob) { resolve(null); return; }
    const r = new FileReader();
    r.onload = () => resolve(typeof r.result === 'string' ? r.result : null);
    r.onerror = () => resolve(null);
    r.readAsDataURL(blob);
  });
}
