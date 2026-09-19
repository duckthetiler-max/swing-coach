// Video helpers: load a clip into a <video>, probe its frame rate, seek frame by frame and
// grab stills. Browser only (touches the DOM). No pose logic lives here.

const objectUrls = new WeakMap();
const SEEK_TIMEOUT_MS = 15000;
const FALLBACK_FPS = 30;

/**
 * Load a File, Blob or URL string into a muted, inline <video>. Resolves once the
 * picture size is known. Object URLs are tracked; call releaseVideo(video) when done.
 */
export function loadVideo(src) {
  return new Promise((resolve, reject) => {
    let url;
    if (typeof src === 'string') url = src;
    else if (typeof Blob !== 'undefined' && src instanceof Blob) url = URL.createObjectURL(src);
    else { reject(new TypeError('loadVideo needs a File, a Blob or a URL string.')); return; }

    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    if (url === src && /^https?:/i.test(url)) video.crossOrigin = 'anonymous';
    if (url !== src) objectUrls.set(video, url);

    const ready = () => video.videoWidth > 0 && video.videoHeight > 0;
    const finish = (fn) => {
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('loadeddata', onData);
      video.removeEventListener('error', onError);
      fn();
    };
    const fail = (message) => finish(() => { releaseVideo(video); reject(new Error(message)); });
    const onMeta = () => { if (ready()) finish(() => resolve(video)); };
    const onData = () => {
      if (ready()) finish(() => resolve(video));
      else fail('This file has no picture. Try another clip.');
    };
    const onError = () => fail(describeMediaError(video.error));

    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('loadeddata', onData);
    video.addEventListener('error', onError);
    video.src = url;
    video.load();
  });
}

/** Stop playback, revoke any object URL and free the decoder. */
export function releaseVideo(video) {
  if (!video) return;
  try { video.pause(); } catch { /* already gone */ }
  const url = objectUrls.get(video);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(video);
  }
  video.removeAttribute('src');
  try { video.load(); } catch { /* nothing to free */ }
}

/**
 * Decoded frames per second of the FILE. Plays muted for up to maxSeconds (or the clip
 * length) and divides the frames decoded by the media time played. Fallback 30, clamped
 * 10..300, rounded. Pauses and seeks back to 0 afterwards.
 */
export async function probeFps(video, { maxSeconds = 1.5 } = {}) {
  if (!video || typeof video.getVideoPlaybackQuality !== 'function') return FALLBACK_FPS;
  const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : maxSeconds;
  const target = Math.min(maxSeconds, duration);
  let fps = FALLBACK_FPS;
  try {
    video.muted = true;
    await seekTo(video, 0);
    const framesBefore = video.getVideoPlaybackQuality().totalVideoFrames;
    await video.play();
    await waitFor(() => video.currentTime >= target || video.ended, target * 1000 + 4000);
    video.pause();
    const played = video.currentTime;
    const frames = video.getVideoPlaybackQuality().totalVideoFrames - framesBefore;
    if (played > 0.1 && frames >= 2) {
      fps = Math.round(Math.min(300, Math.max(10, frames / played)));
    }
  } catch {
    fps = FALLBACK_FPS;
  }
  try { video.pause(); await seekTo(video, 0); } catch { /* leave it where it is */ }
  return fps;
}

/**
 * Seek to t (file seconds, clamped to the clip). Resolves after `seeked` plus one paint so
 * the decoded frame is on screen. Already within 1 ms: resolves after one paint.
 */
export function seekTo(video, t) {
  return new Promise((resolve, reject) => {
    const target = clampTime(video, t);
    if (!video.seeking && Math.abs(video.currentTime - target) <= 0.001) {
      nextPaint(resolve);
      return;
    }
    let timer = 0;
    const cleanup = () => {
      clearTimeout(timer);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
    const onSeeked = () => { cleanup(); nextPaint(resolve); };
    const onError = () => { cleanup(); reject(new Error(`Could not seek to ${target.toFixed(3)} s.`)); };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Seeking to ${target.toFixed(3)} s took too long.`));
    }, SEEK_TIMEOUT_MS);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.currentTime = target;
  });
}

let stillCanvas = null;

/** JPEG data URL of the current frame, scaled down to maxWidth if the video is wider. */
export function captureFrame(video, maxWidth = 480, quality = 0.82) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) throw new Error('No frame to capture.');
  const scale = Math.min(1, maxWidth / vw);
  const w = Math.max(1, Math.round(vw * scale));
  const h = Math.max(1, Math.round(vh * scale));
  if (!stillCanvas) stillCanvas = document.createElement('canvas');
  stillCanvas.width = w;
  stillCanvas.height = h;
  const ctx = stillCanvas.getContext('2d');
  ctx.drawImage(video, 0, 0, w, h);
  return stillCanvas.toDataURL('image/jpeg', quality);
}

function clampTime(video, t) {
  const want = Number.isFinite(t) ? Math.max(0, t) : 0;
  const duration = video.duration;
  return Number.isFinite(duration) && duration > 0 ? Math.min(want, duration) : want;
}

/** Run fn after the next animation frame, or after 100 ms if frames are not being painted. */
function nextPaint(fn) {
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(go);
  setTimeout(go, 100);
}

function waitFor(condition, timeoutMs) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const check = () => {
      if (condition()) { resolve(); return; }
      if (Date.now() - started > timeoutMs) { reject(new Error('Playback did not advance.')); return; }
      setTimeout(check, 40);
    };
    check();
  });
}

function describeMediaError(err) {
  const code = err && err.code;
  if (code === 4) return 'This video format is not supported on this phone. Try an mp4 from the camera app.';
  if (code === 3) return 'This video could not be decoded. Try another clip.';
  if (code === 2) return 'The video could not be downloaded. Check the connection and try again.';
  if (code === 1) return 'Loading the video was stopped.';
  return 'The video could not be loaded.';
}
