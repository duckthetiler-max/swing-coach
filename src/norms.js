// Coaching norms for every metric, with sources, measurement tiers, uncertainty rules
// and swing-model adjustments. Pure module: no DOM, safe in Node tests.
//
// Band rule (CONTRACT.md): the first band whose [lo, hi] holds the value wins; no match
// means 'red'; a null value means 'na'. Where a source gives only green and red, amber
// fills the gap. Signs: toward the target and toward the ball are positive.
//
// tier (docs/research/04): A a number is defensible; B direction and rough size, the
// number carries a wide band; C words or a picture only; D not measurable from one camera.
// Tier D metrics are suppressed: computed nowhere, reported as not measurable.
// byModel: band overrides when the golfer has declared a swing model (docs/research/03).
// gatedBy: models where the metric is a deliberate feature, so it is not scored at all.

import { bandProfile } from './clubs.js';

const INF = Infinity;

export const NORMS_DISCLAIMER =
  'These bands are coaching rules of thumb from published instruction and tour reference data, not lab results for you. Every number carries a band of doubt. Tune them against your own clips.';

export const METRIC_IDS = Object.freeze({
  fo: Object.freeze([
    'headTop', 'headImpact', 'hipSway', 'hipSlide', 'shoulderTurn', 'hipTurn',
    'leadArmTop', 'leadArmImpact', 'shoulderTiltAddress', 'shoulderTiltImpact',
    'weightTop', 'weightImpact', 'reversePivot',
  ]),
  dtl: Object.freeze([
    'spineAddress', 'earlyExtension', 'spineDelta', 'headVertTop', 'headVertImpact',
    'handsPath', 'trailElbowTop',
  ]),
  both: Object.freeze(['tempo', 'backswingTime', 'downswingTime', 'downswingFrames', 'visibility']),
});

export const ALL_METRIC_IDS = Object.freeze([...METRIC_IDS.fo, ...METRIC_IDS.dtl, ...METRIC_IDS.both]);

const g = (lo, hi) => ({ band: 'green', lo, hi });
const a = (lo, hi) => ({ band: 'amber', lo, hi });

// Uncertainty rules per unit: cm carries at least 15 to 25% (scale plane error), angles
// about 5 deg from one camera, the hip-centre percentage about 8 points.
const U_CM = { pct: 0.2, min: 1 };
const U_DEG = { abs: 5 };
const U_PCT = { abs: 8 };

export const NORMS = {
  // ---------------- Face-on ----------------
  headTop: {
    label: 'Head lateral at top', unit: 'cm', view: 'fo', tier: 'B', uncertainty: U_CM,
    direction: 'positive = toward the target',
    bands: [g(-5, 2), a(-10, -5), a(2, 5)],
    description: 'Nose at the top versus address. Green is up to 5 cm away from the target or 2 cm toward it. Red is over 10 cm away or over 5 cm toward. Instruction figures only, no tour database exists for this.',
    sources: ['left_rough_head', 'sportsbox_2024'],
    byModel: {
      stack_and_tilt: [g(-2, 4), a(-5, -2), a(4, 7)],
      classic: [g(-8, 2), a(-12, -8), a(2, 5)],
      two_plane: [g(-7, 2), a(-12, -7), a(2, 5)],
      austin: [g(-3, 2), a(-6, -3), a(2, 4)],
    },
  },
  headImpact: {
    label: 'Head lateral at impact', unit: 'cm', view: 'fo', tier: 'B', uncertainty: U_CM,
    direction: 'positive = toward the target',
    bands: [g(-3, 3), a(3, 6), a(-8, -3)],
    description: 'Nose at impact versus address. Green is within 3 cm. Red is over 6 cm toward the target or over 8 cm behind. Lateral head movement moves the low point; convention, not a measured band.',
    sources: ['tpi_hanging_back', 'left_rough_head'],
    byModel: { classic: [g(-6, 3), a(-10, -6), a(3, 6)] },
  },
  hipSway: {
    label: 'Hip sway (backswing)', unit: 'cm', view: 'fo', tier: 'B', uncertainty: U_CM,
    direction: 'positive = toward the target',
    bands: [g(-10, 8), a(-15, -10), a(8, 12)],
    description: 'Hip centre at the top versus address. The only tour benchmark (GOLFTEC, about 10 cm at the top) has an unverified direction convention, and Sportsbox reads under 5 cm away, so up to 10 cm either way is treated as within the published references. Sway, TPI’s fault, is excessive movement away: amber past 10 cm away, red past 15 cm.',
    sources: ['tpi_sway', 'golftec_swingtru', 'sportsbox_2024'],
    byModel: {
      stack_and_tilt: [g(-3, 12), a(-6, -3), a(12, 16)],
      classic: [g(-14, 8), a(-18, -14), a(8, 12)],
      one_plane: [g(-6, 8), a(-10, -6), a(8, 12)],
    },
  },
  hipSlide: {
    label: 'Hip slide (impact)', unit: 'cm', view: 'fo', tier: 'B', uncertainty: U_CM,
    direction: 'positive = toward the target',
    bands: [g(2, 12), a(0, 2), a(12, 18)],
    description: 'Hip centre at impact versus address. Green is 2 to 12 cm toward the target (GOLFTEC tour average 4 cm, Sportsbox up to 13 cm, TPI about 10 cm). Under 0 is a stall or hanging back; over 18 cm is a slide.',
    sources: ['tpi_slide', 'tpi_hanging_back', 'golftec_swingtru', 'sportsbox_2024'],
    byModel: {
      stack_and_tilt: [g(2, 16), a(0, 2), a(16, 22)],
      austin: [g(4, 16), a(0, 4), a(16, 22)],
    },
  },
  shoulderTurn: {
    label: 'Shoulder turn at top', unit: 'deg', view: 'fo', tier: 'D',
    direction: 'unsigned turn from address',
    bands: [g(80, 100), a(65, 80), a(100, INF)],
    description: 'Rotation in degrees needs depth, and depth from one phone camera is off by about 10 cm, so this number is not shown. For reference, 3D lab studies put good players at about 100 to 112 deg of thorax turn at the top, and the amount of turn does not separate skill levels.',
    suppressed: 'Turn in degrees is not measurable from one camera (Ingwersen et al. 2023).',
    sources: ['ingwersen_2023', 'okuda_2010', 'meister_2011', 'liu_2026'],
  },
  hipTurn: {
    label: 'Hip turn at top', unit: 'deg', view: 'fo', tier: 'D',
    direction: 'unsigned turn from address',
    bands: [g(38, 55), a(30, 38), a(55, 65)],
    description: 'Not shown for the same reason as shoulder turn. For reference, 3D studies put good players at about 40 to 52 deg of pelvis turn at the top, and high handicappers turn the pelvis more, not less, so "turn more" is never the coaching here.',
    suppressed: 'Turn in degrees is not measurable from one camera (Ingwersen et al. 2023).',
    sources: ['ingwersen_2023', 'meister_2011', 'yang_2024'],
  },
  leadArmTop: {
    label: 'Lead arm at top', unit: 'deg', view: 'fo', tier: 'B', uncertainty: { abs: 6 },
    direction: '180 = straight',
    bands: [g(165, 180), a(150, 165)],
    description: 'Lead elbow angle at the top. Green is 165 to 180 deg. Red is under 150. No measured tour band exists; this is a straightness check. In PROTECT mode it is reported, not coached.',
    sources: ['tpi_characteristics', 'skillest_stack_tilt'],
    byModel: {
      stack_and_tilt: [g(170, 180), a(155, 170)],
      single_plane: [g(172, 180), a(160, 172)],
    },
    gatedBy: { a_swing: 'The A Swing keeps the lead arm deliberately short and connected, so straightness is not scored.' },
  },
  leadArmImpact: {
    label: 'Lead arm after impact', unit: 'deg', view: 'fo', tier: 'B', uncertainty: { abs: 6 },
    direction: '180 = straight',
    bands: [g(160, 180), a(145, 160)],
    description: 'Lead elbow angle just after impact, the chicken wing check. Green is over 160 deg. Red is under 145. Read two samples after impact to avoid the blur at impact.',
    sources: ['tpi_chicken_wing'],
  },
  shoulderTiltAddress: {
    label: 'Shoulder tilt at address', unit: 'deg', view: 'fo', tier: 'B', uncertainty: U_DEG,
    direction: 'positive = trail shoulder lower',
    bands: [g(4, 12), a(2, 4), a(12, 18)],
    bandsByClub: { driver: [g(8, 16), a(3, 8), a(16, 22)] },
    description: 'Shoulder line slope at address, trail shoulder lower is positive. More with the driver, less with a wedge. The 8 to 10 deg figure in circulation is forum-grade, so treat this as a rule of thumb. Red is level or the lead shoulder lower.',
    sources: ['rotaryswing_axis_tilt', 'nicklaus_setup', 'golfwrx_axis_tilt_forum'],
  },
  shoulderTiltImpact: {
    label: 'Shoulder tilt at impact', unit: 'deg', view: 'fo', tier: 'B', uncertainty: U_DEG,
    direction: 'positive = trail shoulder lower',
    bands: [g(0, 90)],
    relativeTo: 'shoulderTiltAddress',
    description: 'Shoulder line slope at impact. Green when the trail shoulder is lower than at address (secondary tilt). Red when the lead shoulder is lower (reverse tilt): a steep, over-the-top, open-face pattern. Amber between. Measured against your own address tilt. 3D reference: pros about 25 deg of side tilt at impact with a 5 iron (Meister 2011), the best evidenced posture number in the literature.',
    sources: ['rotaryswing_axis_tilt', 'tpi_over_the_top', 'golftec_swingtru', 'meister_2011'],
    gatedBy: { stack_and_tilt: 'Stack and Tilt reverses the tilt direction on purpose in the backswing, so this comparison does not apply.' },
  },
  weightTop: {
    label: 'Hip centre between the feet at top', unit: 'pct', view: 'fo', tier: 'B', uncertainty: U_PCT,
    direction: '0 = over the trail foot, 100 = over the lead foot',
    bands: [g(28, 60), a(20, 28), a(60, 70)],
    description: 'Where the hip centre sits between the ankles at the top. This is a position estimate from video, not pressure: force plates read about 75 to 80% on the trail foot at the top, and no study links the hip position to that. Green is 28 to 60 (trail side to centred). Over 70 toward the lead foot is the reverse pivot pattern.',
    sources: ['swing_catalyst_mass_pressure', 'watson_2026', 'okuda_2010', 'tpi_reverse_spine'],
    byModel: { stack_and_tilt: [g(50, 80), a(40, 50), a(80, 90)], classic: [g(20, 55), a(12, 20), a(55, 65)], austin: [g(20, 55), a(12, 20), a(55, 65)] },
  },
  weightImpact: {
    label: 'Hip centre between the feet at impact', unit: 'pct', view: 'fo', tier: 'B', uncertainty: U_PCT,
    direction: '0 = over the trail foot, 100 = over the lead foot',
    bands: [g(52, 75), a(45, 52), a(75, 85)],
    description: 'Hip centre between the ankles at impact, a position estimate from video (force plates read about 70% on the lead foot at impact in skilled players). Green is 52 to 75 toward the lead foot. Under 45 is hanging back, the fault TPI names for divots behind the ball. No model asks for weight back at impact.',
    sources: ['tpi_hanging_back', 'okuda_2010', 'watson_2026', 'swing_catalyst_mass_pressure'],
    byModel: { stack_and_tilt: [g(65, 90), a(55, 65), a(90, 100)] },
  },
  reversePivot: {
    label: 'Reverse pivot', unit: 'bool', view: 'fo', tier: 'B',
    direction: '1 = yes, 0 = no',
    bands: [g(0, 0)],
    description: 'Upper body leaning toward the target at the top by more than 4 cm relative to the hips. Green is no. Red is yes. TPI calls the reverse spine angle a prime cause of lower back pain.',
    sources: ['tpi_reverse_spine'],
    gatedBy: { stack_and_tilt: 'Weight and upper body forward at the top is the Stack and Tilt method, not a reverse pivot.' },
  },

  // ---------------- Down-the-line ----------------
  spineAddress: {
    label: 'Forward bend at address', unit: 'deg', view: 'dtl', tier: 'B', uncertainty: { abs: 7 },
    direction: 'positive = bent toward the ball',
    bands: [g(32, 48), a(26, 32), a(48, 54)],
    bandsByClub: { driver: [g(21, 37), a(15, 21), a(37, 43)] },
    description: 'Forward bend of the hip-to-shoulder line from vertical at address, closest to what GOLFTEC calls shoulder bend. Tour average 41 deg with an iron and 29 deg with the driver; green is about 8 deg either side. Camera height changes this reading, so keep the phone at belt to chest height.',
    sources: ['golftec_bending_2015', 'golftec_head_drop_2015', 'edriss_2025'],
    byModel: {
      one_plane: [g(37, 53), a(31, 37), a(53, 59)],
      two_plane: [g(27, 43), a(21, 27), a(43, 49)],
    },
    gatedBy: { single_plane: 'Single-plane address geometry is out of scope for these bands.' },
  },
  earlyExtension: {
    label: 'Early extension', unit: 'cm', view: 'dtl', tier: 'B', uncertainty: U_CM,
    direction: 'positive = toward the ball',
    bands: [g(-3, 4), a(4, 7), a(-6, -3)],
    description: 'Hip centre moved toward the ball line from address to impact. Green is up to 4 cm toward the ball. Red is over 7 cm. TPI defines the fault without a number, so the cm lines are coaching convention. 67% of amateurs show it and 99% of tour pros do not; it is the usual cause of a two-way miss. Rising is normal, moving toward the ball is the fault.',
    sources: ['tpi_early_extension_article', 'tpi_early_extension', 'rapsodo_two_way_miss', 'sportsbox_2024', 'okuda_2010'],
  },
  spineDelta: {
    label: 'Forward bend change at impact', unit: 'deg', view: 'dtl', tier: 'B', uncertainty: { abs: 7 },
    direction: 'negative = standing up',
    bands: [g(-8, 8), a(-14, -8), a(8, 15)],
    description: 'Forward bend at impact minus address, negative is standing up. Tour players return to their setup numbers by impact, so green is within 8 deg. Red is past 14 deg of standing up or 15 deg of extra bend. Loss of posture produces the same block-and-hook pair as early extension. No published degree threshold exists; the band is convention widened for one-camera error.',
    sources: ['golftec_head_drop_2015', 'tpi_loss_of_posture', 'liu_2026'],
    gatedBy: { stack_and_tilt: 'The spine extends in the backswing by design in Stack and Tilt, so posture change is not scored against it.' },
  },
  headVertTop: {
    label: 'Head height at top', unit: 'cm', view: 'dtl', tier: 'B', uncertainty: U_CM,
    direction: 'positive = dipped',
    bands: [g(-5, 5), a(-9, -5), a(5, 9)],
    description: 'Nose height at the top versus address, positive is a dip. Green is within 5 cm. Red is over 9 cm either way. No published norm; convention.',
    sources: ['sensors_2023_hht'],
  },
  headVertImpact: {
    label: 'Head height at impact', unit: 'cm', view: 'dtl', tier: 'B', uncertainty: U_CM,
    direction: 'positive = dipped',
    bands: [g(-5, 5), a(-9, -5), a(5, 9)],
    description: 'Nose height at impact versus address, positive is a dip. Green is within 5 cm. Head-up motion at impact is associated with a slice in a 2023 motion study; a normal head rotation is not a fault. No published cm norm; convention.',
    sources: ['sensors_2023_hht', 'golftec_head_drop_2015'],
  },
  handsPath: {
    label: 'Hands path (estimate)', unit: 'cm', view: 'dtl', tier: 'C', uncertainty: { pct: 0.5, min: 3 },
    direction: 'positive = outside (over the top)',
    display: 'direction',
    bands: [g(-4, 4), a(-8, -4), a(4, 8)],
    description: 'Wrist path at shoulder height, downswing versus backswing. Shown as words, not a number: the hands are the worst-tracked joint and the club is not tracked. Clearly outside is the over-the-top pattern (slice); clearly inside is stuck (hook).',
    sources: ['ingwersen_2023', 'nakano_2020', 'tpi_over_the_top'],
  },
  trailElbowTop: {
    label: 'Trail elbow at top', unit: 'cm', view: 'dtl', tier: 'B', uncertainty: U_CM,
    direction: 'positive = above the trail shoulder',
    bands: [g(-INF, 0), a(0, 12)],
    description: 'Trail elbow height above the trail shoulder at the top. Green is at or below the shoulder line. Red is well above it, read here as over 12 cm (flying elbow). No published norm; a two-plane swing carries the elbow higher by design.',
    sources: ['tpi_characteristics', 'hardy_plane_truth'],
    byModel: { two_plane: [g(-INF, 10), a(10, 18)], a_swing: [g(-INF, -2), a(-2, 6)] },
    gatedBy: { austin: 'The Austin method sets the trail elbow under the hands on purpose.' },
  },

  // ---------------- Both views ----------------
  tempo: {
    label: 'Tempo', unit: 'ratio', view: 'both', tier: 'A',
    direction: 'backswing to downswing',
    bands: [g(2.0, 4.0), a(1.5, 2.0), a(4.0, 5.0)],
    description: 'Backswing samples divided by downswing samples. Tour players sit near 3 to 1 (Tour Tempo 21/7, 24/8, 27/9 frames; Blast 2.5 to 3.1; an accelerometer study 2.8), but the 3 to 1 figure has no peer-reviewed source and skilled women swing down slower than men. Green is a wide 2 to 4. What matters is repeating your own ratio swing to swing. Rough with fewer than 8 downswing samples.',
    sources: ['novosel_tour_tempo', 'blast_tempo', 'accelerometer_2010', 'cheetham_timing_video', 'horan_2010'],
  },
  backswingTime: {
    label: 'Backswing time', unit: 's', view: 'both', tier: 'A',
    direction: 'real seconds',
    bands: [],
    description: 'Address to the top in real seconds once the slow-motion factor is confirmed. Reference: about 0.73 s in an accelerometer study, Hogan about 0.70 s. Informational, no band.',
    sources: ['accelerometer_2010', 'novosel_tour_tempo', 'samsung_slomo'],
  },
  downswingTime: {
    label: 'Downswing time', unit: 's', view: 'both', tier: 'A',
    direction: 'real seconds',
    bands: [],
    description: 'Top to impact in real seconds once the slow-motion factor is confirmed. Reference: about 0.26 s in an accelerometer study, Hogan about 0.23 s. Informational, no band.',
    sources: ['accelerometer_2010', 'novosel_tour_tempo'],
  },
  downswingFrames: {
    label: 'Downswing frames', unit: 'frames', view: 'both', tier: 'A',
    direction: 'samples between the top and impact',
    bands: [],
    description: 'Samples between the top and impact. Under 8 makes the timing numbers rough; a tour downswing is about 7 frames at 30 fps. Use slow motion. Informational, no band.',
    sources: ['cheetham_timing_video', 'novosel_tour_tempo'],
  },
  visibility: {
    label: 'Tracking visibility', unit: 'ratio', view: 'both', tier: 'A',
    direction: '0 to 1, higher is better tracking',
    bands: [],
    description: 'Mean tracking visibility of hips and shoulders from address to finish. Under 0.6 is a quality warning. Informational, no band.',
    sources: ['mediapipe_docs'],
  },
};

Object.freeze(NORMS);

/** Bands to apply for a club and a swing model. Model overrides win, then the club's band profile, then base. */
export function bandsFor(spec, club = null, model = null) {
  if (!spec) return [];
  if (model && spec.byModel && Array.isArray(spec.byModel[model])) return spec.byModel[model];
  const profile = club ? bandProfile(club) : null;
  if (profile && spec.bandsByClub && Array.isArray(spec.bandsByClub[profile])) return spec.bandsByClub[profile];
  return Array.isArray(spec.bands) ? spec.bands : [];
}

/** Reason a metric is not scored for this model, or null. */
export function gateReason(spec, model = null) {
  if (!spec || !model || !spec.gatedBy) return null;
  return spec.gatedBy[model] || null;
}

/**
 * Band for a value under a NormSpec. First matching [lo, hi] wins, none is 'red',
 * null is 'na'. opts.club picks club bands, opts.model picks model bands, opts.ref feeds
 * a relative spec (shoulderTiltImpact): green above ref, red below zero, amber between.
 */
export function bandFor(spec, value, opts = {}) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'na';
  if (!spec) return 'na';
  if (spec.relativeTo && typeof opts.ref === 'number' && Number.isFinite(opts.ref)) {
    if (value < 0) return 'red';
    if (value > opts.ref) return 'green';
    return 'amber';
  }
  const bands = bandsFor(spec, opts.club, opts.model);
  if (bands.length === 0) return 'na';
  for (const b of bands) {
    if (value >= b.lo && value <= b.hi) return b.band;
  }
  return 'red';
}

/** Uncertainty in the metric's own unit for a value, from the spec's rule. */
export function uncertaintyFor(spec, value) {
  if (!spec || !spec.uncertainty || typeof value !== 'number' || !Number.isFinite(value)) return null;
  const u = spec.uncertainty;
  if (Number.isFinite(u.abs)) return u.abs;
  const rel = Math.abs(value) * (u.pct || 0);
  return Math.max(u.min || 0, rel);
}

/** The green band in words, for the "what to look for next clip" line. */
export function greenRange(spec, club = null, model = null) {
  const gb = bandsFor(spec, club, model).find((b) => b.band === 'green');
  if (!gb) return null;
  return { lo: Number.isFinite(gb.lo) ? gb.lo : null, hi: Number.isFinite(gb.hi) ? gb.hi : null };
}
