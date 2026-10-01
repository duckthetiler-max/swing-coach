// Result screen: the one thing, the report card, frozen positions, the scrubber.
// Simple mode puts a plain-words summary on top and folds all of that under "Show me the details".
import { el, button, segmented, select, section, hero, ANGLE_OPTIONS, PHASES, clubLabel, viewLabel, fmtDate, confidenceWord, toast } from './dom.js';
import { NORMS, NORMS_DISCLAIMER } from '../norms.js';
import { fmtValue, fmtUncertainty } from '../coach.js';
import { drawBody, drawGuides, drawCallouts } from '../overlay.js';
import { calloutsFor } from '../markers.js';
import { seekTo } from '../video.js';
import { simpleResult } from '../simple.js';
import { simpleResultView } from './simple.js';

const PHASE_KEYS = ['p1', 'p4', 'p7', 'p10'];

// Which swing's details are unfolded, so a re-render (new angle, new pictures) keeps them open.
let openDetailsFor = null;

export function renderResult(root, ctx) {
  const { mode, analysis, coaching, stills, club, settings, actions, record, live } = ctx;
  const view = analysis.view;
  const simple = settings.simpleMode === true;

  const header = el('section', { class: 'sec' },
    el('p', { class: 'kicker muted' }, `${clubLabel(club)}, ${viewLabel(view)}${record ? `, ${fmtDate(record.date)}` : ''}`),
    coaching.context ? el('p', { class: 'caption' }, coaching.context.measuredAgainst) : null,
    mode === 'live' ? el('h2', { class: 'kicker group' }, 'Camera angle') : null,
    mode === 'live' ? segmented(ANGLE_OPTIONS, live.viewOverride, (v) => actions.setView(v), 'Camera angle') : null,
    mode === 'live' ? el('p', { class: 'caption' }, `Auto read this clip as ${viewLabel(live.angleAuto.view).toLowerCase()} (ratio ${live.angleAuto.ratio === null ? 'n/a' : live.angleAuto.ratio.toFixed(2)}).`) : null);

  // In Simple mode this sits inside the details fold, under the plain-words one thing, so it
  // takes a sans line: a screen has one serif line.
  const big = (text) => (simple ? el('p', { class: 'subhead' }, text) : hero(text));

  const h = coaching.headline;
  const card = h && h.drillCard;
  const coachingOn = settings.coachHeadline !== false;
  const headline = !coachingOn
    ? el('section', { class: 'sec' },
      el('h2', { class: 'kicker' }, 'Coaching is off'),
      big('Numbers and pictures only.'),
      el('p', { class: 'muted' }, 'The coach headline is switched off in Settings until the measurements have been validated on your own footage. The report card and the positions below still show everything that was measured.'))
    : el('section', { class: 'sec' },
      el('h2', { class: 'kicker' }, h && h.cue && h.title ? `The one thing · ${h.title}` : 'The one thing'),
      big(h ? h.cue || h.title : 'Nothing to coach.'),
      coaching.context && coaching.context.unvalidated ? el('p', { class: 'caption' }, coaching.context.unvalidated) : null,
      h ? el('p', { class: 'lede' }, h.what) : null,
      h ? el('p', {}, h.why) : null,
      h && h.watchFor ? el('p', { class: 'caption' }, h.watchFor) : null);

  const drill = !coachingOn ? null
    : card ? section('The drill',
      el('p', { class: 'subhead' }, card.title),
      el('div', { class: 'kv' }, kv('Set up', card.setup), kv('Do', card.do), kv('Done when', card.doneWhen)),
      el('p', { class: 'caption' }, `${card.evidence === 'convention' ? 'Coaching convention, not a trial.' : card.evidence} Lead arm load: ${card.leadArmLoad}.`))
      : h && h.drill ? section('The drill', el('pre', { class: 'drill' }, h.drill)) : null;

  const also = coachingOn && coaching.others && coaching.others.length
    ? section('Also seen', el('ul', { class: 'plain' }, coaching.others.map((o) => el('li', {}, o.line))))
    : null;
  const notes = coachingOn && coaching.notes && coaching.notes.length
    ? section('Notes', el('ul', { class: 'plain caption' }, coaching.notes.map((n) => el('li', {}, n))))
    : null;

  const warnings = analysis.quality && analysis.quality.warnings && analysis.quality.warnings.length
    ? section('Clip quality', el('ul', { class: 'plain' }, analysis.quality.warnings.map((w) => el('li', {}, w))))
    : null;

  const shown = analysis.metrics.filter((m) => m.view === 'both' || m.view === view);
  const otherView = view === 'fo' ? 'Down-the-line metrics need a down-the-line clip.' : view === 'dtl' ? 'Face-on metrics need a face-on clip.' : 'Pick the camera angle above to see the body metrics.';
  const factorLine = mode === 'live' && live.captured
    ? el('p', { class: 'caption' }, `Auto capture at normal speed, ${live.retracked ? 'kept pictures re-read' : 'live frames only'}, about ${Math.round(analysis.fpsReal)} samples a second. ${live.frameStats ? `Kept ${live.frameStats.kept} of the ${live.frameStats.presented} frames the camera delivered through this swing.` : 'This browser does not report dropped frames, so some may be missing unseen.'} Timing numbers are rougher than a slow-motion clip.`)
    : mode === 'live'
    ? el('div', { class: 'field' },
      el('span', { class: 'field-label' }, `Times assume ${analysis.factor}x slow motion (${Math.round(analysis.fpsReal)} fps real time). Was it?`),
      select([['1', 'Normal speed'], ['2', '2x'], ['4', '4x (120 fps)'], ['8', '8x (240 fps)']], String(analysis.factor), (v) => actions.setFactor(Number(v))),
      el('p', { class: 'hint' }, live.factorInfo.reason))
    : el('p', { class: 'caption' }, `Times assume ${analysis.factor}x slow motion.`);

  const report = section('Report card',
    el('p', { class: 'caption' }, NORMS_DISCLAIMER),
    factorLine,
    el('div', { class: 'metrics' }, shown.map((m) => metricCard(m))),
    el('p', { class: 'caption' }, otherView),
    button('Where the numbers come from', () => actions.knowledge(), 'btn link'));

  const stillsCard = stills ? section('Positions',
    mode === 'live' ? segmented([['markers', 'Markers and numbers'], ['figure', 'Figure']], settings.overlayStyle, (v) => actions.setOverlay(v), 'Body overlay') : null,
    el('p', { class: 'caption' }, settings.overlayStyle === 'figure' && mode === 'live'
      ? 'Tap one to see it full screen.'
      : 'Dots are the tracked joints: white on your lead side, grey on the trail side, hollow where the tracker was unsure. The numbers are the same ones as the report card, written on the body part they describe, with the band square beside each. Tap a picture to read them full screen.'),
    el('div', { class: 'stills' }, PHASES.map(([key, label], i) => stills[key] ? el('figure', { class: 'still', onClick: () => lightbox(stills[key], label) },
      el('img', { src: stills[key], alt: label }),
      el('figcaption', {}, el('span', { class: 'n' }, String(i + 1).padStart(2, '0')), label)) : null))) : null;

  const scrub = mode === 'live' ? renderScrubber(live, settings) : null;

  const noteInput = el('textarea', { placeholder: 'Club, feel, where the ball went' });
  const noteCard = mode === 'live'
    ? section('Note for the history', noteInput)
    : (record && record.note ? section('Your note', el('p', {}, record.note)) : null);
  const saveBtn = button('Save this swing', async () => {
    try { await actions.save(noteInput.value.trim()); saveBtn.textContent = 'Saved'; saveBtn.disabled = true; toast('Saved to history'); } catch (err) { toast(`Could not save: ${err.message}`); }
  }, 'btn primary');
  if (mode === 'live' && live.saved) { saveBtn.textContent = 'Saved'; saveBtn.disabled = true; }
  const anotherLabel = live && live.captured ? 'Back to session' : simple ? 'Check another' : 'Analyse another';
  const actionbar = mode === 'live'
    ? el('div', { class: 'actionbar' }, button(anotherLabel, () => actions.another(), 'btn'), saveBtn)
    : el('div', { class: 'actionbar' }, button('Delete', () => actions.remove(), 'btn danger'), button('Back to history', () => actions.back(), 'btn primary'));

  const full = [header, headline, drill, also, notes, warnings, report, stillsCard, scrub, noteCard];
  if (!simple) {
    root.replaceChildren(el('div', { class: 'page' }, ...full, actionbar));
    return;
  }

  const model = simpleResult(analysis, coaching, { handed: analysis.handed || settings.handed, club, model: analysis.model, coachingOn });
  const meta = [clubLabel(club), model.viewLabel, record ? fmtDate(record.date) : null].filter(Boolean).join(' · ');
  const top = simpleResultView(model, {
    meta,
    unvalidated: !!(coaching.context && coaching.context.unvalidated),
    warnings: analysis.quality && analysis.quality.warnings,
    onPickView: mode === 'live' ? (v) => actions.setView(v) : null,
  });
  root.replaceChildren(el('div', { class: 'page' }, ...top, detailsFold(full, mode === 'live' ? live.clip : record), actionbar));
}

function kv(k, v) {
  return el('div', {}, el('span', { class: 'k' }, k), el('span', { class: 'v' }, v));
}

/** Everything the full view shows, folded away until asked for. key: the swing it belongs to. */
function detailsFold(parts, key) {
  const open = !!key && openDetailsFor === key;
  const summary = el('summary', {}, open ? 'Hide the details' : 'Show me the details');
  const fold = el('details', { class: 'more', open }, summary, el('div', { class: 'page' }, parts));
  fold.addEventListener('toggle', () => {
    summary.textContent = fold.open ? 'Hide the details' : 'Show me the details';
    if (fold.open) openDetailsFor = key;
    else if (openDetailsFor === key) openDetailsFor = null;
  });
  return fold;
}

/**
 * One report card row: the measure, its value and band, the band of doubt and confidence,
 * any caveat. What the measure is and where its band comes from opens on a tap.
 */
function metricCard(m) {
  const spec = NORMS[m.id];
  const pillText = m.suppressed ? 'not measurable' : m.gated ? 'not scored' : m.band === 'na' ? 'not measured' : m.band;
  const pillClass = m.suppressed || m.gated ? 'na' : m.band;
  const measured = !(m.value === null || m.suppressed);
  let valueText;
  if (m.suppressed) valueText = 'Not from one camera';
  else if (m.value === null) valueText = 'n/a';
  else valueText = fmtValue(m);
  const unc = measured ? fmtUncertainty(m) : '';
  const conf = measured ? `${confidenceWord(m.confidence)} confidence${m.tier ? `, tier ${m.tier}` : ''}` : '';
  const confText = [unc, conf].filter(Boolean).join(', ');
  const about = spec && spec.description ? spec.description : '';

  const parts = [
    el('span', { class: 'metric-head' },
      el('span', { class: 'metric-label' }, m.label),
      about ? el('span', { class: 'metric-toggle', 'aria-hidden': 'true' }) : null),
    el('span', { class: 'metric-value-row' },
      el('span', { class: `metric-value${measured ? '' : ' na'}` }, measured ? valueText.charAt(0).toUpperCase() + valueText.slice(1) : valueText),
      el('span', { class: `pill ${pillClass}` }, pillText)),
    confText ? el('span', { class: 'metric-conf' }, confText.charAt(0).toUpperCase() + confText.slice(1)) : null,
    m.note ? el('span', { class: 'metric-note' }, m.note) : null,
  ];
  if (!about) return el('div', { class: 'metric' }, ...parts);
  return el('details', { class: 'metric' },
    el('summary', {}, ...parts),
    el('div', { class: 'metric-body' }, el('p', { class: 'caption' }, about)));
}

function lightbox(src, label) {
  const box = el('div', { class: 'lightbox', role: 'dialog', 'aria-label': label, onClick: () => box.remove() },
    el('img', { src, alt: label }),
    el('p', { class: 'kicker' }, label));
  document.body.append(box);
}

/** Video with a skeleton overlay and a frame scrubber. Works without a video (demo) too. */
function renderScrubber(live, settings) {
  const { clip, events, video, images } = live;
  const frames = clip.frames;
  const canvas = el('canvas', { width: clip.w, height: clip.h });
  const ctx2d = canvas.getContext('2d');
  const box = el('div', { class: 'scrub' });
  if (video) { video.controls = false; box.append(video); } else { canvas.style.position = 'static'; canvas.style.background = '#1a1a1a'; }
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

  const range = el('input', { type: 'range', min: 0, max: frames.length - 1, step: 1, value: events.p1, 'aria-label': 'Frame' });
  const info = el('p', { class: 'caption' });
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
      ctx2d.fillStyle = '#1a1a1a';
      ctx2d.fillRect(0, 0, canvas.width, canvas.height);
    }
    const phase = PHASE_KEYS.find((k) => events[k] === i) || null;
    const o = { ...drawOpts(bmp), handed: settings.handed, style: settings.overlayStyle };
    drawGuides(ctx2d, frame, live.analysis ? live.analysis.view : 'unknown', phase, { ...o, reference: frames[events.p1], label: !!phase });
    drawBody(ctx2d, frame, o);
    if (phase && settings.overlayStyle !== 'figure' && live.analysis) drawCallouts(ctx2d, frame, calloutsFor(phase, live.analysis), o);
  };
  range.addEventListener('input', () => show(Number(range.value)));
  const jump = (key, label) => button(label, () => { range.value = events[key]; show(events[key]); }, 'btn quiet');
  const controls = el('div', { class: 'scrub-controls' },
    range,
    el('div', { class: 'jumps' }, jump('p1', 'Address'), jump('p4', 'Top'), jump('p7', 'Impact'), jump('p10', 'Finish')),
    info);
  setTimeout(() => show(events.p1), 0);
  return section('Scrub the swing', box, controls);
}
