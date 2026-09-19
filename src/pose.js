// Pose tracking for a whole clip with the vendored MediaPipe Pose Landmarker.
//
// Two-pass design:
//   1. Coarse pass over the WHOLE file at a stride that gives at most 120 samples. Each sample
//      is seeked, painted and run through the landmarker. The wrist-midpoint speed between
//      samples (over 4 percent of the shoulder width) says when the body moved. That span is
//      padded by 0.5 s of file time each side and clamped to the file. No pose or no motion:
//      the window is the whole file and a warning goes on clip.warnings.
//   2. Fine pass over that window only, at a stride that gives at most maxSamples samples
//      (stride >= 1). These frames are the Clip, i renumbered from 0 and t in file seconds.
// detectForVideo needs strictly increasing integer timestamps, so one counter spans both
// passes (see nextTimestamp in pose-utils.js). All the pure logic lives in pose-utils.js.

import { FilesetResolver, PoseLandmarker } from '../vendor/tasks-vision/vision_bundle.mjs';
import { seekTo } from './video.js';
import { validFrame } from './landmarks.js';
import {
  COARSE_MAX_SAMPLES, NO_POSE_WARNING,
  chooseStride, sampleTimes, findMotionWindow, nextTimestamp, resultToFrame, frameToSample,
  createProgress,
} from './pose-utils.js';

/** The heavy model is not vendored (about 30 MB). See models/README.md. */
export const HEAVY_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task';

const MODEL_FILES = {
  lite: 'pose_landmarker_lite.task',
  full: 'pose_landmarker_full.task',
};

/** Where a model loads from: lite and full are self-hosted, heavy comes from Google. */
export function modelUrl(model, basePath = '.') {
  if (model === 'heavy') return HEAVY_MODEL_URL;
  const file = MODEL_FILES[model];
  if (!file) throw new Error(`Unknown model "${model}". Use lite, full or heavy.`);
  return `${basePath}/models/${file}`;
}

/**
 * Create a PoseLandmarker in VIDEO mode for one pose. Tries the GPU delegate first and falls
 * back to CPU when creation throws. The delegate used is recorded on `landmarker.delegateUsed`.
 */
export async function createLandmarker({ model = 'full', basePath = '.' } = {}) {
  const assetPath = modelUrl(model, basePath);
  const fileset = await FilesetResolver.forVisionTasks(basePath + '/vendor/tasks-vision/wasm');
  const options = (delegate) => ({
    baseOptions: { modelAssetPath: assetPath, delegate },
    runningMode: 'VIDEO',
    numPoses: 1,
  });
  let landmarker;
  let delegateUsed = 'GPU';
  try {
    landmarker = await PoseLandmarker.createFromOptions(fileset, options('GPU'));
  } catch (err) {
    console.warn('GPU pose tracking is not available here. Using the CPU.', err);
    landmarker = await PoseLandmarker.createFromOptions(fileset, options('CPU'));
    delegateUsed = 'CPU';
  }
  landmarker.delegateUsed = delegateUsed;
  return landmarker;
}

/**
 * Track the swing in a loaded <video>. Returns a Clip: { frames, fps, stride, duration, w, h,
 * warnings, window }. opts.fps is the file frame rate from probeFps (default 30); nothing is
 * probed here. onProgress(pct, label) runs at least every 10 samples across both passes.
 * Aborting `signal` throws a DOMException named AbortError between samples.
 */
export async function processClip(video, landmarker, opts = {}) {
  const { onProgress = null, signal = null } = opts;
  const fps = Number.isFinite(opts.fps) && opts.fps > 0 ? opts.fps : 30;
  const maxSamples = Number.isFinite(opts.maxSamples) && opts.maxSamples >= 1 ? Math.floor(opts.maxSamples) : 360;
  const w = video.videoWidth;
  const h = video.videoHeight;
  const duration = video.duration;
  if (!(duration > 0) || !Number.isFinite(duration) || !w || !h) {
    throw new Error('This clip has no length or no picture. Try another clip.');
  }
  throwIfAborted(signal);
  video.pause();

  const totalFrames = Math.max(1, Math.round(duration * fps));
  const ts = { last: -1 };
  const progress = createProgress(onProgress);

  // Pass 1: coarse, whole file. Only used to find when the body moved.
  const coarseStride = chooseStride(totalFrames, COARSE_MAX_SAMPLES);
  const coarseTimes = sampleTimes(0, duration, coarseStride / fps);
  const fineBudget = Math.min(maxSamples, totalFrames);
  const split = Math.round(100 * coarseTimes.length / (coarseTimes.length + fineBudget));
  const coarseFrames = await runPass(video, landmarker, coarseTimes, {
    w, h, ts, signal, tick: progress('Finding the swing', 0, split),
  });
  const motion = findMotionWindow(coarseFrames.map(frameToSample), { duration });
  const warnings = motion.notes.slice();

  // Pass 2: fine, the window only. These frames are the clip.
  const windowFrames = Math.max(1, Math.round((motion.endT - motion.startT) * fps));
  const fineStride = chooseStride(windowFrames, maxSamples);
  const fineTick = progress('Tracking the body', split, 100);
  let frames;
  if (!motion.moved && fineStride === coarseStride) {
    // The coarse pass already covered the whole file at this stride: nothing new to track.
    frames = coarseFrames;
    fineTick(1, 1);
  } else {
    const fineTimes = sampleTimes(motion.startT, motion.endT, fineStride / fps);
    frames = await runPass(video, landmarker, fineTimes, { w, h, ts, signal, tick: fineTick });
  }
  if (!frames.some(validFrame) && !warnings.includes(NO_POSE_WARNING)) warnings.push(NO_POSE_WARNING);

  return {
    frames, fps, stride: fineStride, duration, w, h, warnings,
    window: { startT: motion.startT, endT: motion.endT, moved: motion.moved },
  };
}

/** Seek to each time, run the landmarker, collect Frames numbered from 0. */
async function runPass(video, landmarker, times, { w, h, ts, signal, tick }) {
  const frames = [];
  // Shift this pass past the counter so timestamps keep increasing while the real spacing
  // between its samples is kept (the tracker uses timestamps for smoothing).
  const shiftS = Math.max(0, (ts.last + 1) / 1000 - times[0]);
  tick(0, times.length);
  for (let k = 0; k < times.length; k++) {
    throwIfAborted(signal);
    const t = times[k];
    await seekTo(video, t);
    ts.last = nextTimestamp(ts.last, t + shiftS);
    const result = detect(landmarker, video, ts.last, t);
    frames.push(resultToFrame(result, k, t, w, h));
    tick(k + 1, times.length);
  }
  return frames;
}

function detect(landmarker, video, tsMs, t) {
  try {
    return landmarker.detectForVideo(video, tsMs);
  } catch (err) {
    const detail = err && err.message ? err.message : String(err);
    const wrapped = new Error(`Tracking failed at ${t.toFixed(2)} s. ${detail}`);
    wrapped.cause = err;
    throw wrapped;
  }
}

function throwIfAborted(signal) {
  if (signal && signal.aborted) throw new DOMException('Aborted', 'AbortError');
}
