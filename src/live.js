// Live swing detection for auto capture. Pure module: no DOM, safe in Node tests.
//
// Frames arrive one at a time from the camera tracker. The detector watches the wrist
// midpoint speed in body scales per second (shoulder width or torso length, whichever is
// larger, so the numbers do not depend on how far away the phone is) and cuts a segment
// when it sees: still (address) -> fast burst -> still (finish). The segment is then handed
// to findEvents, which does the real event finding exactly as it does for a filmed clip.
// A waggle, a walk or a bend to tee the ball never reaches the peak speed of a swing.

import { validFrame } from './landmarks.js';
import { frameToSample } from './pose-utils.js';

export const LIVE = Object.freeze({
  /** Seconds of stillness before the detector is ready for a swing. */
  stillSeconds: 0.5,
  /** Hands slower than this (body scales per second) count as still. */
  stillThr: 0.8,
  /** Hands faster than this count as moving. */
  movingThr: 1.6,
  /** A real swing peaks far above this; a waggle never reaches it. */
  peakMin: 5,
  /** Motion shorter than this is not a swing (seconds, takeaway to finish). */
  minSwingSeconds: 0.5,
  /** Motion longer than this is a walk or a practice routine, not a swing. */
  maxSwingSeconds: 4,
  /** Stillness after the burst that marks the finish. */
  settleSeconds: 0.6,
  /** Seconds of address kept before the first movement. */
  preRollSeconds: 1.0,
  /** Seconds of finish kept after the settle began. */
  postRollSeconds: 0.5,
  /** Ignore everything for this long after a capture (walking to the next ball). */
  cooldownSeconds: 1.0,
  /** Frames older than this are dropped from memory. */
  bufferSeconds: 8,
  /** Body lost for longer than this while moving aborts the capture. */
  lostSeconds: 0.5,
});

export const STATUS = Object.freeze({
  noBody: 'noBody',
  holdStill: 'holdStill',
  ready: 'ready',
  swinging: 'swinging',
  settling: 'settling',
  cooldown: 'cooldown',
});

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export class SwingDetector {
  constructor(opts = {}) {
    this.o = { ...LIVE, ...opts };
    this.buffer = []; // { frame, wm, scale, t, u }
    this.state = 'wait';
    this.stillSince = null;
    this.moveStart = null;
    this.moveStartIdx = -1;
    this.settleStart = null;
    this.peak = 0;
    this.lostSince = null;
    this.cooldownUntil = -Infinity;
    this.captures = 0;
    this.lastReason = '';
  }

  /** Public status word for the screen. */
  get status() {
    if (this.state === 'cooldown') return STATUS.cooldown;
    if (this.state === 'moving') return STATUS.swinging;
    if (this.state === 'settling') return STATUS.settling;
    if (this.state === 'ready') return STATUS.ready;
    const last = this.buffer[this.buffer.length - 1];
    if (!last || !last.wm) return STATUS.noBody;
    return STATUS.holdStill;
  }

  /**
   * Feed one Frame (image landmarks required, t in seconds). Returns null, or a segment
   * { frames, startT, endT, peak, durationS } when a swing has just finished.
   */
  push(frame) {
    const o = this.o;
    const t = frame.t;
    const s = frameToSample(frame);
    const wm = validFrame(frame) ? s.wristMid : null;
    const scale = wm ? s.bodyScale : null;
    const prev = this.buffer[this.buffer.length - 1];
    let u = 0;
    if (wm && prev && prev.wm && prev.scale && t > prev.t) {
      const d = Math.hypot(wm.x - prev.wm.x, wm.y - prev.wm.y);
      u = d / (t - prev.t) / Math.max(prev.scale, scale);
    }
    this.buffer.push({ frame, wm, scale, t, u });
    while (this.buffer.length && t - this.buffer[0].t > o.bufferSeconds) this.buffer.shift();
    // Smooth the speed over the last three samples so one jittery frame cannot flip a state.
    const n = this.buffer.length;
    const us = this.buffer.slice(Math.max(0, n - 3)).map((b) => b.u);
    const speed = mean(us);
    const idx = n - 1;

    if (this.state === 'cooldown') {
      if (t >= this.cooldownUntil) { this.state = 'wait'; this.stillSince = null; }
      return null;
    }

    if (!wm) {
      if (this.state === 'moving' || this.state === 'settling') {
        if (this.lostSince === null) this.lostSince = t;
        else if (t - this.lostSince > o.lostSeconds) { this.reset('Body lost mid swing.'); }
      } else {
        this.state = 'wait';
        this.stillSince = null;
      }
      return null;
    }
    this.lostSince = null;

    switch (this.state) {
      case 'wait':
        if (speed < o.stillThr) {
          if (this.stillSince === null) this.stillSince = t;
          if (t - this.stillSince >= o.stillSeconds) this.state = 'ready';
        } else {
          this.stillSince = null;
        }
        return null;
      case 'ready':
        if (speed > o.movingThr) {
          this.state = 'moving';
          this.moveStart = t;
          this.moveStartIdx = idx;
          this.peak = speed;
        }
        return null;
      case 'moving':
        this.peak = Math.max(this.peak, speed);
        if (t - this.moveStart > o.maxSwingSeconds) { this.reset('Moved for too long to be one swing.'); return null; }
        if (speed < o.stillThr) { this.state = 'settling'; this.settleStart = t; }
        return null;
      case 'settling': {
        if (speed > o.movingThr) {
          // Still part of the same movement (the finish can wobble).
          if (t - this.moveStart > o.maxSwingSeconds) { this.reset('Moved for too long to be one swing.'); return null; }
          this.state = 'moving';
          return null;
        }
        if (t - this.settleStart < o.settleSeconds) return null;
        const durationS = this.settleStart - this.moveStart;
        const ok = durationS >= o.minSwingSeconds && this.peak >= o.peakMin;
        const seg = ok ? this.cut(t) : null;
        this.lastReason = ok ? '' : durationS < o.minSwingSeconds ? 'Too short to be a swing.' : 'Too slow to be a swing.';
        this.state = 'cooldown';
        this.cooldownUntil = t + o.cooldownSeconds;
        this.stillSince = null;
        if (seg) this.captures++;
        return seg;
      }
      default:
        this.state = 'wait';
        return null;
    }
  }

  reset(reason) {
    this.lastReason = reason || '';
    this.state = 'wait';
    this.stillSince = null;
    this.moveStart = null;
    this.settleStart = null;
    this.peak = 0;
  }

  cut(now) {
    const o = this.o;
    const t0 = this.moveStart - o.preRollSeconds;
    const t1 = Math.min(now, this.settleStart + o.postRollSeconds);
    const frames = this.buffer.filter((b) => b.t >= t0 && b.t <= t1).map((b) => b.frame);
    return { frames, startT: t0, endT: t1, peak: this.peak, durationS: this.settleStart - this.moveStart };
  }
}

/**
 * Turn a run of live frames into a Clip for findEvents and computeMetrics. Frames are
 * re-indexed; fps is the measured sample rate, stride 1, real time (factor 1).
 */
export function buildLiveClip(frames, { w, h } = {}) {
  const list = frames.map((f, i) => ({ ...f, i }));
  const n = list.length;
  const span = n > 1 ? list[n - 1].t - list[0].t : 0;
  const fps = n > 1 && span > 0 ? (n - 1) / span : 30;
  const width = w || (list[0] && list[0].w) || 0;
  const height = h || (list[0] && list[0].h) || 0;
  return { frames: list, fps, stride: 1, duration: span, w: width, h: height, warnings: [], live: true };
}

/**
 * How many camera frames to skip between live detections so the tracker never falls behind
 * the camera: the detection must fit in (stride x frame interval) with a little headroom.
 * Detection only needs to spot the swing; every frame is re-read after the cut.
 */
export function chooseTrackStride(detectMs, frameIntervalMs, headroom = 0.85) {
  if (!Number.isFinite(detectMs) || !Number.isFinite(frameIntervalMs) || frameIntervalMs <= 0) return 1;
  const stride = Math.ceil(detectMs / (frameIntervalMs * headroom));
  return Math.min(4, Math.max(1, stride));
}

/**
 * Rolling store of every camera frame's picture, keyed by camera frame index, with its time.
 * Pictures are opaque (Blob promises in the browser). Pruned by age, never by count.
 */
export class FrameStore {
  constructor(keepSeconds = LIVE.bufferSeconds) {
    this.keepSeconds = keepSeconds;
    this.items = []; // { index, t, picture } in time order
  }

  get size() { return this.items.length; }

  /** pf = the camera's running count of presented frames at this picture, when the browser reports it. */
  add(index, t, picture, pf = null) {
    this.items.push({ index, t, picture, pf });
    return this;
  }

  /** Drop everything older than keepSeconds before `now`. */
  prune(now) {
    const cutoff = now - this.keepSeconds;
    let k = 0;
    while (k < this.items.length && this.items[k].t < cutoff) k++;
    if (k) this.items.splice(0, k);
    return this;
  }

  /** Every stored frame with t0 <= t <= t1, in order. */
  between(t0, t1) {
    return this.items.filter((it) => it.t >= t0 && it.t <= t1);
  }

  clear() { this.items.length = 0; }
}

/** Plain words for the status, for the screen and for speech. */
export function statusWords(status, opts = {}) {
  switch (status) {
    case STATUS.noBody: return 'Looking for you. Whole body in frame.';
    case STATUS.holdStill: return 'Hold still at address.';
    case STATUS.ready: return 'Ready. Swing when you like.';
    case STATUS.swinging: return 'Swinging.';
    case STATUS.settling: return 'Hold the finish.';
    case STATUS.cooldown: return opts.reading ? 'Reading that swing.' : 'Got it. Next ball.';
    default: return '';
  }
}
