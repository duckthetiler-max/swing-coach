// Simple mode: plain-words result, glance, nice work, tips and the settings upgrade.
// Run with: node --test tests/simple.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { synthSwing } from './fixtures.js';
import { findEvents } from '../src/events.js';
import { detectView } from '../src/angle.js';
import { estimateScale } from '../src/scale.js';
import { computeMetrics, buildQuality } from '../src/metrics.js';
import { coach, KEEP_TEMPO_TITLE } from '../src/coach.js';
import { ALL_METRIC_IDS } from '../src/norms.js';
import { CLUB_IDS } from '../src/clubs.js';
import { mergeSettings, upgradeStored, DEFAULT_SETTINGS } from '../src/store.js';
import {
  AREAS, NOT_IN_GLANCE, glance, niceWork, plainFault, simpleResult, isRealFault,
  tipsFor, tipOfTheDay, simpleViewLabel, NICE_FALLBACK, KEEP_WHAT, UNSEEN_WHAT,
} from '../src/simple.js';

function analyse(knobs, { handed = 'right', club = '7i', protect = true } = {}) {
  const clip = synthSwing(knobs);
  const events = findEvents(clip);
  const angle = detectView(clip, events, handed);
  const scale = estimateScale(clip.frames[events.p1], handed, null);
  const metrics = computeMetrics(clip, events, angle, scale, handed, 1, { club, model: 'neutral_rotary' });
  const quality = buildQuality(metrics, clip, events, angle, handed);
  const analysis = { view: angle.view, handed, model: 'neutral_rotary', metrics, quality };
  return { analysis, coaching: coach(analysis, { club, protect, handed }) };
}

const DTL_DEMO = { view: 'dtl', earlyExtension: 0.07, spineLossDeg: 6 };
const FO_DEMO = { hipImpact: 0.03, headTop: -0.06, shoulderTurnDeg: 74 };

test('every metric sits in exactly one glance area or is deliberately left out', () => {
  const seen = new Map();
  for (const a of AREAS) for (const id of a.ids) seen.set(id, (seen.get(id) || 0) + 1);
  for (const id of NOT_IN_GLANCE) seen.set(id, (seen.get(id) || 0) + 1);
  for (const id of ALL_METRIC_IDS) assert.equal(seen.get(id), 1, `${id} is in ${seen.get(id) || 0} places`);
  for (const id of seen.keys()) assert.ok(ALL_METRIC_IDS.includes(id), `${id} is not a metric`);
});

test('down-the-line demo: hips are the one thing, with the chair drill', () => {
  const { analysis, coaching } = analyse(DTL_DEMO);
  const r = simpleResult(analysis, coaching, { club: '7i' });
  assert.equal(r.state, 'fault');
  assert.equal(r.cue, 'Keep your back pocket on the chair.');
  assert.match(r.what, /hips move toward the ball/);
  assert.ok(r.why.length > 0);
  assert.equal(r.drill.title, 'Chair behind you');
  assert.deepEqual(r.drill.steps.map((s) => s.label), ['Set up', 'Do', 'You have got it when']);
  const byArea = Object.fromEntries(r.areas.map((a) => [a.id, a.status]));
  assert.equal(byArea.hips, 'work');
  assert.equal(byArea.head, 'good');
  assert.equal(byArea.posture, 'good');
  assert.equal(byArea.rhythm, 'good');
  assert.equal(r.areas.filter((a) => a.status === 'work').length, 1, 'only one area says work on this');
  assert.equal(r.viewLabel, 'Filmed from behind');
  assert.equal(r.nice.length, 2);
  assert.ok(r.nice.every((n) => n.areaId !== 'hips'));
});

test('face-on demo: nothing clearly off, so the one thing is rhythm', () => {
  const { analysis, coaching } = analyse(FO_DEMO);
  assert.equal(coaching.headline.title, KEEP_TEMPO_TITLE);
  assert.equal(isRealFault(coaching), false);
  const r = simpleResult(analysis, coaching, { club: '7i' });
  assert.equal(r.state, 'keep');
  assert.equal(r.what, KEEP_WHAT);
  assert.equal(r.drill.title, 'Count and nine-to-three');
  assert.ok(!r.areas.some((a) => a.status === 'work'));
  assert.equal(r.areas.find((a) => a.id === 'head').status, 'look');
  assert.equal(r.viewLabel, 'Filmed from the front');
});

test('PROTECT mode leaves the lead arm out of the glance', () => {
  const on = analyse(FO_DEMO, { protect: true });
  const off = analyse(FO_DEMO, { protect: false });
  assert.ok(!glance(on.analysis, on.coaching).some((a) => a.id === 'arms'));
  assert.equal(glance(off.analysis, off.coaching).find((a) => a.id === 'arms').status, 'good');
  assert.equal(simpleResult(on.analysis, on.coaching).protect, true);
});

test('coach switched off: no area is singled out and there is no drill', () => {
  const { analysis, coaching } = analyse(DTL_DEMO);
  const r = simpleResult(analysis, coaching, { coachingOn: false });
  assert.equal(r.state, 'off');
  assert.equal(r.drill, null);
  assert.equal(r.cue, '');
  assert.ok(!r.areas.some((a) => a.status === 'work'));
  assert.equal(r.areas.find((a) => a.id === 'hips').status, 'look');
});

test('nothing readable: the swing is unseen, with no praise and no drill', () => {
  const { analysis, coaching } = analyse(DTL_DEMO);
  const blank = { ...analysis, metrics: analysis.metrics.map((m) => ({ ...m, value: null, band: 'na' })) };
  const r = simpleResult(blank, coaching);
  assert.equal(r.state, 'unseen');
  assert.equal(r.what, UNSEEN_WHAT);
  assert.deepEqual(r.nice, []);
  assert.equal(r.drill, null);
  assert.deepEqual(r.areas, []);
});

test('no all-green area still gets a kind word', () => {
  const { analysis, coaching } = analyse(DTL_DEMO);
  const amber = { ...analysis, metrics: analysis.metrics.map((m) => (m.band === 'green' ? { ...m, band: 'amber' } : m)) };
  assert.deepEqual(niceWork(amber, coaching), []);
  assert.deepEqual(simpleResult(amber, coaching).nice, [{ areaId: null, line: NICE_FALLBACK }]);
});

test('low-confidence readings say nothing either way', () => {
  const { analysis, coaching } = analyse(DTL_DEMO);
  const unsure = { ...analysis, metrics: analysis.metrics.map((m) => (m.id === 'tempo' ? { ...m, confidence: 0.2 } : m)) };
  assert.ok(!glance(unsure, coaching).some((a) => a.id === 'rhythm'));
});

test('left-handed golfers get the right-hand side words', () => {
  const m = { id: 'leadArmImpact', value: 140, band: 'red', confidence: 1 };
  assert.match(plainFault(m, { handed: 'right' }).what, /left elbow/);
  assert.match(plainFault(m, { handed: 'left' }).what, /right elbow/);
  const nice = niceWork({ view: 'fo', metrics: [{ id: 'leadArmTop', value: 178, band: 'green', confidence: 1 }] }, { protect: false, headline: null }, { handed: 'left' });
  assert.equal(nice[0].line, 'Your right arm stayed nice and straight.');
});

test('every glance metric has plain words on both sides of its band', () => {
  const ids = AREAS.flatMap((a) => a.ids);
  for (const id of ids) {
    for (const value of [-20, 0.5, 20, 200]) {
      const out = plainFault({ id, value, band: 'red', confidence: 1 }, { club: '7i' });
      assert.ok(out.what && !/undefined|null|NaN/.test(out.what + out.why), `${id} at ${value}: ${out.what} ${out.why}`);
      assert.ok(out.why, `${id} at ${value} has no reason`);
    }
  }
  assert.match(plainFault({ id: 'hipSlide', value: -3, band: 'red' }, { club: '7i' }).what, /move back/);
  assert.match(plainFault({ id: 'hipSlide', value: 25, band: 'red' }, { club: '7i' }).what, /slide past the ball/);
  assert.match(plainFault({ id: 'tempo', value: 1.4, band: 'red' }).what, /backswing is quick/);
  assert.match(plainFault({ id: 'tempo', value: 5.5, band: 'red' }).what, /backswing is slow/);
});

test('tips name the club, change daily and step through with Next', () => {
  for (const id of CLUB_IDS) {
    const tips = tipsFor(id);
    assert.ok(tips.length >= 8, `${id} has ${tips.length} tips`);
    assert.ok(tips.every((t) => t.title && t.body && !t.body.includes('{club}')), `${id} has an unfilled tip`);
  }
  assert.ok(tipsFor('7i').some((t) => t.body.includes('your 7 iron')));
  const day = new Date(2026, 8, 27, 9);
  assert.deepEqual(tipOfTheDay('7i', day), tipOfTheDay('7i', new Date(2026, 8, 27, 21)));
  assert.notEqual(tipOfTheDay('7i', day).index, tipOfTheDay('7i', new Date(2026, 8, 28, 9)).index);
  const first = tipOfTheDay('7i', day, 0);
  assert.equal(tipOfTheDay('7i', day, first.count).index, first.index);
  assert.equal(tipOfTheDay('7i', day, 1).index, (first.index + 1) % first.count);
});

test('plain camera angle words', () => {
  assert.equal(simpleViewLabel('dtl'), 'Filmed from behind');
  assert.equal(simpleViewLabel('fo'), 'Filmed from the front');
  assert.equal(simpleViewLabel('unknown'), 'Camera angle unclear');
  assert.equal(simpleViewLabel(undefined), 'Camera angle unclear');
});

test('Simple mode is on for new installs and off for settings saved before it existed', () => {
  assert.equal(DEFAULT_SETTINGS.simpleMode, true);
  assert.equal(mergeSettings(upgradeStored(null), null).simpleMode, true);
  assert.equal(mergeSettings(upgradeStored({ handed: 'left', protect: true }), null).simpleMode, false);
  assert.equal(mergeSettings(upgradeStored({ simpleMode: true }), null).simpleMode, true);
  assert.equal(mergeSettings(upgradeStored({ simpleMode: false }), null).simpleMode, false);
  assert.equal(mergeSettings({ simpleMode: false }, { simpleMode: true }).simpleMode, true);
  assert.equal(mergeSettings({ simpleMode: true }, { simpleMode: 'yes' }).simpleMode, true, 'a bad value keeps the current one');
});
