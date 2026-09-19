// Result screen: the one thing, the report card, frozen positions, the scrubber.
import { el, button, segmented, select, ANGLE_OPTIONS, PHASES, clubLabel, viewLabel, fmtDate, confidenceWord, toast } from './dom.js';
import { NORMS, NORMS_DISCLAIMER } from '../norms.js';
import { fmtValue, fmtUncertainty } from '../coach.js';
import { drawBody, drawGuides, drawCallouts } from '../overlay.js';
import { calloutsFor } from '../markers.js';
import { seekTo } from '../video.js';

const PHASE_KEYS = ['p1', 'p4', 'p7', 'p10'];

export function renderResult(root, ctx) {
  const { mode, analysis, coaching, stills, club, settings, actions, record, live } = ctx;
  const view = analysis.view;
  const protect = coaching.protect;

  const header = el('div', {},
    el('div', { class: 'eyebrow' }, `${clubLabel(club)}, ${viewLabel(view)}${record ? `, ${fmtDate(record.date)}` : ''}`),
    coaching.context ? el('p', { class: 'muted small' }, coaching.context.measuredAgainst) : null,
    mode === 'live' ? el('div', { class: 'field' },
      el('span', { class: 'field-label' }, 'Camera angle'),
      segmented(ANGLE_OPTIONS, live.viewOverride, (v) => actions.setView(v), 'Camera angle'),
      el('p', { class: 'muted hint small' }, `Auto read this clip as ${viewLabel(live.angleAuto.view).toLowerCase()} (ratio ${live.angleAuto.ratio === null ? 'n/a' : live.angleAuto.ratio.toFixed(2)}).`)) : null);

  const protectCard = protect
    ? el('div', { class: 'card warn flat' }, el('strong', {}, 'PROTECT mode is on. '), 'No speed drills. Stop straight away if the lead arm hurts.')
    : null;

  const h = coaching.headline;
  const card = h && h.drillCard;
  const coachingOn = settings.coachHeadline !== false;
  const headline = !coachingOn
    ? el('div', { class: 'card flat stack' },
      el('div', {}, el('div', { class: 'eyebrow' }, 'Coaching is off'), el('h2', {}, 'Numbers and pictures only')),
      el('p', { class: 'muted' }, 'The coach headline is switched off in Settings until the measurements have been validated on your own footage. The report card and the positions below still show everything that was measured.'))
    : el('div', { class: 'card accent headline stack' },
    el('div', {}, el('div', { class: 'eyebrow' }, 'The one thing'), el('h2', {}, h ? h.title : 'Nothing to coach')),
    coaching.context && coaching.context.unvalidated ? el('p', { class: 'small', style: { color: 'var(--amber)', margin: 0 } }, coaching.context.unvalidated) : null,
    h ? el('p', { class: 'what' }, h.what) : null,
    h ? el('p', {}, h.why) : null,
    h && h.cue ? el('div', { class: 'cue' }, el('div', { class: 'eyebrow' }, 'Your cue'), el('div', { class: 'cue-text' }, h.cue)) : null,
    card ? el('div', { class: 'drill-card' },
      el('h3', {}, card.title),
      el('div', { class: 'kv' }, el('span', { class: 'k' }, 'Drill'), el('span', {}, card.setup)),
      el('div', { class: 'kv' }, el('span', { class: 'k' }, 'Do'), el('span', {}, card.do)),
      el('div', { class: 'kv' }, el('span', { class: 'k' }, 'Done when'), el('span', {}, card.doneWhen)),
      el('div', { class: 'muted small' }, `${card.evidence === 'convention' ? 'Coaching convention, not a trial.' : card.evidence} Lead arm load: ${card.leadArmLoad}.`))
      : (h && h.drill ? el('div', {}, el('h3', {}, 'Drill'), el('pre', { class: 'drill' }, h.drill)) : null),
    h ? el('p', { class: 'muted' }, h.watchFor) : null,
    coaching.others && coaching.others.length ? el('div', {}, el('h3', {}, 'Also seen'), el('ul', { class: 'others' }, coaching.others.map((o) => el('li', {}, o.line)))) : null,
    coaching.notes && coaching.notes.length ? el('ul', { class: 'muted small' }, coaching.notes.map((n) => el('li', {}, n))) : null);

  const warnings = analysis.quality && analysis.quality.warnings && analysis.quality.warnings.length
    ? el('div', { class: 'card warn' }, el('h3', {}, 'Clip quality'), el('ul', {}, analysis.quality.warnings.map((w) => el('li', {}, w))))
    : null;

  const shown = analysis.metrics.filter((m) => m.view === 'both' || m.view === view);
  const otherView = view === 'fo' ? 'Down-the-line metrics need a down-the-line clip.' : view === 'dtl' ? 'Face-on metrics need a face-on clip.' : 'Pick the camera angle above to see the body metrics.';
  const factorLine = mode === 'live' && live.captured
    ? el('p', { class: 'muted small' }, `Auto capture at normal speed, ${live.retracked ? 'kept pictures re-read' : 'live frames only'}, about ${Math.round(analysis.fpsReal)} samples a second. ${live.frameStats ? `Kept ${live.frameStats.kept} of the ${live.frameStats.presented} frames the camera delivered through this swing.` : 'This browser does not report dropped frames, so some may be missing unseen.'} Timing numbers are rougher than a slow-motion clip.`)
    : mode === 'live'
    ? el('div', { class: 'row' },
      el('span', {}, `Times assume ${analysis.factor}x slow motion (${Math.round(analysis.fpsReal)} fps real time). Was it?`),
      select([['1', 'Normal speed'], ['2', '2x'], ['4', '4x (120 fps)'], ['8', '8x (240 fps)']], String(analysis.factor), (v) => actions.setFactor(Number(v)), 'inline'),
      el('span', { class: 'muted small' }, live.factorInfo.reason))
    : el('p', { class: 'muted small' }, `Times assume ${analysis.factor}x slow motion.`);

  const table = el('div', { class: 'metrics' }, shown.map((m) => metricCard(m)));

  const report = el('div', { class: 'card stack' },
    el('h2', {}, 'Report card'),
    el('p', { class: 'muted small' }, NORMS_DISCLAIMER),
    factorLine,
    table,
    el('p', { class: 'muted small' }, otherView),
    button('Where the numbers come from', () => actions.knowledge(), 'btn link'));

  const stillsCard = stills ? el('div', { class: 'card' },
    el('h2', {}, 'Positions'),
    mode === 'live' ? segmented([['markers', 'Markers and numbers'], ['figure', 'Figure']], settings.overlayStyle, (v) => actions.setOverlay(v), 'Body overlay') : null,
    el('p', { class: 'muted small', style: { marginTop: '8px' } }, settings.overlayStyle === 'figure' && mode === 'live'
      ? 'Tap one to see it full screen.'
      : 'Dots are the tracked joints, green on your lead side, hollow where the tracker was unsure. The numbers are the same ones as the report card, written on the body part they describe and coloured by band. Tap a picture to read them full screen.'),
    el('div', { class: 'stills' }, PHASES.map(([key, label]) => stills[key] ? el('div', { class: 'still', onClick: () => lightbox(stills[key], label) },
      el('img', { src: stills[key], alt: label }), el('span', { class: 'label' }, label)) : null))) : null;

  const scrub = mode === 'live' ? renderScrubber(live, settings) : null;

  const noteInput = el('textarea', { placeholder: 'Note (optional): club, feel, where the ball went' });
  const noteCard = mode === 'live'
    ? el('div', { class: 'card' }, el('div', { class: 'eyebrow' }, 'Note for the history'), noteInput)
    : (record && record.note ? el('div', { class: 'card' }, el('div', { class: 'eyebrow' }, 'Your note'), el('p', { style: { margin: 0 } }, record.note)) : null);
  const saveBtn = button('Save this swing', async () => {
    try { await actions.save(noteInput.value.trim()); saveBtn.textContent = 'Saved'; saveBtn.disabled = true; toast('Saved to history'); } catch (err) { toast(`Could not save: ${err.message}`); }
  }, 'btn primary');
  if (mode === 'live' && live.saved) { saveBtn.textContent = 'Saved'; saveBtn.disabled = true; }
  const actionbar = mode === 'live'
    ? el('div', { class: 'actionbar' }, button(live.captured ? 'Back to the session' : 'Analyse another', () => actions.another(), 'btn'), saveBtn)
    : el('div', { class: 'actionbar' }, button('Delete', () => actions.remove(), 'btn danger'), button('Back to history', () => actions.back(), 'btn'));

  root.replaceChildren(el('div', { class: 'stack' }, header, protectCard, headline, warnings, report, stillsCard, scrub, noteCard, actionbar));
}

function metricCard(m) {
  const spec = NORMS[m.id];
  const pillText = m.suppressed ? 'not measurable' : m.gated ? 'not scored' : m.band === 'na' ? 'not measured' : m.band;
  const pillClass = m.suppressed || m.gated ? 'na' : m.band;
  let valueText;
  if (m.suppressed) valueText = 'Not from one camera';
  else if (m.value === null) valueText = 'n/a';
  else valueText = fmtValue(m);
  const unc = m.value === null || m.suppressed ? '' : fmtUncertainty(m);
  const note = m.value === null || m.suppressed
    ? m.note
    : `${spec ? spec.description : ''}${m.note ? ` ${m.note}` : ''}`;
  return el('div', { class: `metric band-${pillClass}` },
    el('div', { class: 'metric-head' },
      el('span', { class: 'metric-label' }, m.label),
      el('span', { class: `pill ${pillClass}` }, pillText)),
    el('div', { class: 'metric-value' },
      valueText,
      unc ? el('span', { class: 'metric-conf' }, unc) : null,
      m.value === null || m.suppressed ? null : el('span', { class: 'metric-conf' }, `${confidenceWord(m.confidence)} confidence${m.tier ? `, tier ${m.tier}` : ''}`)),
    el('div', { class: 'metric-note' }, note));
}

function lightbox(src, label) {
  const box = el('div', { class: 'lightbox', onClick: () => box.remove() }, el('img', { src, alt: label }));
  document.body.append(box);
}

/** Video with a skeleton overlay and a frame scrubber. Works without a video (demo) too. */
function renderScrubber(live, settings) {
  const { clip, events, video, images } = live;
  const frames = clip.frames;
  const canvas = el('canvas', { width: clip.w, height: clip.h });
  const ctx2d = canvas.getContext('2d');
  const box = el('div', { class: 'scrub' });
  if (video) { video.controls = false; box.append(video); } else { canvas.style.position = 'static'; canvas.style.background = '#222'; }
  box.append(canvas);
  // Captured swings carry small pictures per frame: a flipbook instead of a video.
  const bitmaps = new Map();
  const picture = async (i) => {
    const blob = images && images[i];
    if (!blob) return null;
    if (bitmaps.has(i)) return bitmaps.get(i);
    try {
      const bmp = await createImageBitmap(blob);
      if (bitmaps.size > 40) { const first = bitmaps.keys().next().value; bitmaps.delete(first); }
      bitmaps.set(i, bmp);
      return bmp;
    } catch { return null; }
  };
  const drawOpts = (bmp) => (bmp ? { scaleX: canvas.width / clip.w, scaleY: canvas.height / clip.h } : {});

  const range = el('input', { type: 'range', min: 0, max: frames.length - 1, step: 1, value: events.p1 });
  const info = el('span', { class: 'muted small' });
  let pending = null;
  const show = async (i) => {
    const frame = frames[i];
    if (!frame) return;
    info.textContent = `Sample ${i + 1} of ${frames.length}, ${(frame.t - frames[0].t).toFixed(2)} s in`;
    let bmp = null;
    if (video) {
      pending = i;
      try { await seekTo(video, frame.t); } catch { /* keep going */ }
      if (pending !== i) return;
    } else if (images) {
      pending = i;
      bmp = await picture(i);
      if (pending !== i) return;
      if (bmp && (canvas.width !== bmp.width || canvas.height !== bmp.height)) { canvas.width = bmp.width; canvas.height = bmp.height; }
    }
    ctx2d.clearRect(0, 0, canvas.width, canvas.height);
    if (bmp) {
      ctx2d.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    } else if (!video) {
      const sky = ctx2d.createLinearGradient(0, 0, 0, canvas.height);
      sky.addColorStop(0, '#2a2a2a'); sky.addColorStop(1, '#141414');
      ctx2d.fillStyle = sky; ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    }
    const phase = PHASE_KEYS.find((k) => events[k] === i) || null;
    const o = { ...drawOpts(bmp), handed: settings.handed, accent: '#30d158', ink: '#ffffff', style: settings.overlayStyle };
    drawGuides(ctx2d, frame, live.analysis ? live.analysis.view : 'unknown', phase, { ...o, reference: frames[events.p1], label: !!phase });
    drawBody(ctx2d, frame, o);
    if (phase && settings.overlayStyle !== 'figure' && live.analysis) drawCallouts(ctx2d, frame, calloutsFor(phase, live.analysis), o);
  };
  range.addEventListener('input', () => show(Number(range.value)));
  const jump = (key, label) => button(label, () => { range.value = events[key]; show(events[key]); }, 'btn');
  const controls = el('div', { class: 'scrub-controls' },
    range, jump('p1', 'Address'), jump('p4', 'Top'), jump('p7', 'Impact'), jump('p10', 'Finish'), info);
  setTimeout(() => show(events.p1), 0);
  return el('div', { class: 'card' }, el('h2', {}, 'Scrub the swing'), box, controls);
}
