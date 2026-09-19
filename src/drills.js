// Drill library. One drill per fault, in the format the practice research asks for:
// FAULT (plain words), CUE (one thing, under 10 words, outside the body where possible),
// DRILL (setup with range items), DO (ball count, club, speed), DONE WHEN (a marker the
// golfer can see or feel). No "do not" anywhere. protectSafe false means the drill loads
// the lead arm and is skipped while PROTECT is on. Written for a right-handed golfer; the
// coach swaps left and right for a left-hander with sideWords().
// Sources: docs/research/06 section 6.2 and the master table in section 2.1.

export const DRILLS = Object.freeze({
  earlyExtension: Object.freeze({
    title: 'Chair behind you',
    fault: 'Your hips push toward the ball on the way down.',
    cue: 'Keep your back pocket on the chair.',
    setup: 'Put a chair or your bag behind you so its edge touches your backside at address. Swing keeping contact until the ball is gone.',
    do: '10 slow swings with no ball. Then 10 balls with a wedge at half speed.',
    doneWhen: 'You hit 5 in a row without the chair losing contact before impact.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'low', evidence: 'convention',
    sources: ['golfcom_chair_2020', 'golfsmart_wall'],
  }),
  lossOfPosture: Object.freeze({
    title: 'Stick down the spine',
    fault: 'You stand up out of your address angles before impact.',
    cue: 'Keep all three contact points on the stick.',
    setup: 'Slide an alignment stick down the back of your collar so it touches your head, upper back and tailbone. Slow rehearsal swings, no ball.',
    do: '10 slow swings with no ball. Then 10 balls with a wedge at half speed with the stick out.',
    doneWhen: 'Your forward bend at impact matches address on 5 in a row on video.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'low', evidence: 'convention',
    sources: ['tpi_loss_of_posture'],
  }),
  hipSway: Object.freeze({
    title: 'Stick outside the trail foot',
    fault: 'Your hips slide away from the target going back.',
    cue: 'Turn your right pocket away from the stick.',
    setup: 'Push an alignment stick into the turf just outside your right foot, level with your right hip. Swing back without touching it.',
    do: '8 slow backswings with no ball. Then 10 balls with a wedge at half speed.',
    doneWhen: 'You make 8 backswings in a row without the stick moving.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'low', evidence: 'convention',
    sources: ['hackmotion_sway', 'tpi_sway'],
  }),
  hipSlide: Object.freeze({
    title: 'Step-through',
    fault: 'Your hips slide past the ball instead of turning.',
    cue: 'Walk toward the target after the ball is gone.',
    setup: 'Swing normally, then let your right foot step past your left foot down the target line after impact.',
    do: '5 practice swings with no ball. Then 10 balls with an 8 iron at three-quarter speed.',
    doneWhen: 'You finish balanced on your left side with the right toe light, 5 in a row.',
    club: '7i', speed: 'three-quarter', protectSafe: true, leadArmLoad: 'medium', evidence: 'convention',
    sources: ['tpi_slide', 'hackmotion_hanging_back'],
  }),
  hangingBack: Object.freeze({
    title: 'Towel behind the ball',
    fault: 'Your weight stays on the back foot at impact.',
    cue: 'Bruise the turf in front of the towel.',
    setup: 'Lay a towel flat about 10 inches behind the ball. Hit without touching it.',
    do: '10 balls with a wedge at half speed. Move the towel closer once you miss it every time.',
    doneWhen: 'The divot starts at or after the ball on 8 in a row.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'medium', evidence: 'convention',
    sources: ['hackmotion_hanging_back', 'hackmotion_towel', 'tpi_hanging_back'],
  }),
  overTheTop: Object.freeze({
    title: 'Headcover outside the ball',
    fault: 'The club comes down outside the line and cuts across the ball.',
    cue: 'Swing the clubhead past the inside of the headcover.',
    setup: 'Put a headcover on the ground about 4 inches outside the ball and 6 inches behind it, pointing at your target.',
    do: '5 slow swings with no ball, missing the headcover. Then 10 balls with a 7 iron, building speed only when you stop hitting it.',
    doneWhen: 'You hit 8 balls in a row without moving the headcover.',
    club: '7i', speed: 'build', protectSafe: true, leadArmLoad: 'medium', evidence: 'convention',
    sources: ['golftec_headcover_2018', 'tpi_over_the_top'],
  }),
  stuckInside: Object.freeze({
    title: 'Headcover inside the ball',
    fault: 'The club drops behind you and the hands flip to save it.',
    cue: 'Send the clubhead down the line, not out right.',
    setup: 'Put a headcover on the ground just inside your target line, about a foot behind the ball. Swing without clipping it.',
    do: '5 slow swings with no ball. Then 10 balls with an 8 iron at three-quarter speed.',
    doneWhen: '8 in a row miss the headcover and the ball starts left of where it used to.',
    club: '7i', speed: 'three-quarter', protectSafe: true, leadArmLoad: 'medium', evidence: 'convention',
    sources: ['stryper_stuck'],
  }),
  headVertical: Object.freeze({
    title: 'Shadow drill',
    fault: 'Your head lifts before the ball is gone.',
    cue: 'Keep your shadow on the same spot until impact.',
    setup: 'Stand so the sun puts the shadow of your head on the ground in front of you. Swing keeping the shadow on that spot. No sun? Lay an alignment stick on the ground where your head sits at address and keep your head behind it.',
    do: '8 practice swings with no ball. Then 10 balls with a wedge at half speed.',
    doneWhen: 'The shadow stays put on 8 in a row.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'low', evidence: 'convention',
    sources: ['sensors_2023_hht', 'hackmotion_reverse_pivot'],
  }),
  headLateral: Object.freeze({
    title: 'Stick as the head line',
    fault: 'Your head drifts sideways during the swing.',
    cue: 'Head stays behind the line until the ball is gone.',
    setup: 'Lay an alignment stick on the ground and note where your head sits against it at address. Swing keeping your head behind that mark.',
    do: '8 practice swings with no ball. Then 10 balls with a wedge at half speed.',
    doneWhen: 'Your head is still behind the line at impact on 8 in a row on video.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'low', evidence: 'convention',
    sources: ['hackmotion_reverse_pivot', 'left_rough_head'],
  }),
  reversePivot: Object.freeze({
    title: 'Pause at the top',
    fault: 'Your weight goes to your front foot going back, then to your back foot coming down.',
    cue: 'Settle your weight into your right heel at the top.',
    setup: 'Cross your arms on your shoulders with no club. Turn to the top, hold one second, then shift to your left foot and turn through.',
    do: '10 reps with no club. Then 8 half shots with a wedge, same pressure change.',
    doneWhen: 'You can hold the top for one second without leaning toward the target, 10 times.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'low', evidence: 'convention',
    sources: ['hackmotion_reverse_pivot', 'tpi_reverse_spine', 'perkins_ceccato_2003'],
  }),
  chickenWing: Object.freeze({
    title: 'Towel under the lead arm',
    fault: 'Your left elbow folds and points up just after impact.',
    cue: 'Keep the towel pinned until the ball is gone.',
    setup: 'Tuck a small towel or a glove under your left armpit. Swing keeping it there through impact, then let it fall.',
    do: '8 half swings with no ball. Then 10 balls with a wedge at half speed. Stop early if the left arm complains.',
    doneWhen: 'The towel stays in on 8 balls in a row and falls only after impact.',
    club: 'pw', speed: 'half', protectSafe: false, leadArmLoad: 'high', evidence: 'convention',
    sources: ['tpi_chicken_wing', 'hackmotion_chicken_wing'],
  }),
  tempo: Object.freeze({
    title: 'Count and nine-to-three',
    fault: 'Your backswing and downswing change speed from ball to ball.',
    cue: 'Same count on every ball: one-two-three, down.',
    setup: 'Wedge only. Swing from left arm at 9 o’clock to right arm at 3 o’clock, counting out loud, three beats back and one beat down.',
    do: '15 balls at half speed, one club, one target.',
    doneWhen: '10 in a row share the same count and land within one flag width of each other.',
    club: 'pw', speed: 'half', protectSafe: true, leadArmLoad: 'low', evidence: 'studied ratio, conventional drill',
    sources: ['novosel_tour_tempo', 'blast_tempo', 'rotaryswing_9to3'],
  }),
});

export const DRILL_IDS = Object.freeze(Object.keys(DRILLS));

const SIDE_WORDS = [
  [/\bright pocket\b/g, 'LEADPOCKET'], [/\bright foot\b/g, 'LEADFOOT'], [/\bright hip\b/g, 'LEADHIP'],
  [/\bright heel\b/g, 'LEADHEEL'], [/\bright arm\b/g, 'LEADARM'], [/\bright toe\b/g, 'LEADTOE'], [/\bright side\b/g, 'LEADSIDE'],
];

/** Swap left and right in a drill string for a left-handed golfer. */
export function forHanded(text, handed = 'right') {
  if (handed !== 'left' || !text) return text;
  let out = text;
  for (const [re, tag] of SIDE_WORDS) out = out.replace(re, tag);
  out = out.replace(/\bleft\b/g, 'right').replace(/\bLeft\b/g, 'Right');
  out = out.replace(/LEADPOCKET/g, 'left pocket').replace(/LEADFOOT/g, 'left foot').replace(/LEADHIP/g, 'left hip')
    .replace(/LEADHEEL/g, 'left heel').replace(/LEADARM/g, 'left arm').replace(/LEADTOE/g, 'left toe').replace(/LEADSIDE/g, 'left side');
  return out;
}

/** The drill as five short lines, for the coaching card. */
export function drillLines(drill, handed = 'right') {
  const f = (s) => forHanded(s, handed);
  return {
    title: drill.title,
    fault: f(drill.fault),
    cue: f(drill.cue),
    setup: f(drill.setup),
    do: f(drill.do),
    doneWhen: f(drill.doneWhen),
  };
}
