// Swing Coach knowledge base. Pure data with sources. Nothing in here is a guess without
// saying so: every entry carries source ids, and every source has a grade.
//
// Grades: M measured data, E expert or instruction opinion, C clinical protocol,
// R review, D documentation, U unverified. Built from docs/research/01..06 (Sept 2026).
// The reports in docs/research are the long form; this file is what the app reads.

export const SOURCES = {
  tpi_characteristics: { title: 'Swing Characteristics (index)', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics' },
  tpi_early_extension_article: { title: 'Early Extension Swing Characteristic (67% of 90,000+ golfers screened; 99% of 100+ tour pros without it)', by: 'Titleist Performance Institute', grade: 'M', url: 'https://www.mytpi.com/articles/swing/early-extension-swing-characteristic' },
  tpi_early_extension: { title: 'Early Extension (blocks right and hooks left)', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/early-extension' },
  tpi_loss_of_posture: { title: 'Loss of Posture', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/loss-of-posture' },
  tpi_sway: { title: 'Sway', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/sway' },
  tpi_slide: { title: 'Slide', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/slide' },
  tpi_reverse_spine: { title: 'Reverse Spine Angle', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/reverse-spine-angle' },
  tpi_hanging_back: { title: 'Hanging Back (good players about four inches closer to the target at impact)', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/hanging-back' },
  tpi_over_the_top: { title: 'Over the Top', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/over-the-top' },
  tpi_chicken_wing: { title: 'Chicken Winging', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/chicken-winging' },
  tpi_flat_shoulder: { title: 'Flat Shoulder Plane', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/flat-shoulder-plane' },
  tpi_casting: { title: 'Casting', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/casting' },
  tpi_s_posture: { title: 'S-Posture', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/s-posture' },
  tpi_c_posture: { title: 'C-Posture', by: 'Titleist Performance Institute', grade: 'E', url: 'https://www.mytpi.com/improve-my-game/swing-characteristics/c-posture' },
  gulgin_2014: { title: 'Correlation of TPI Level 1 Movement Screens and Golf Swing Faults (36 golfers; failed toe touch: 82% early extension; failed trail single-leg bridge: 68% loss of posture)', by: 'Gulgin, Schulte and Crawley, J Strength Cond Res', year: 2014, grade: 'M', url: 'https://pubmed.ncbi.nlm.nih.gov/24476744/' },
  golftec_swingtru: { title: 'SwingTRU Motion Study (13,000+ golfers, 3D sensors; tour averages for six positions)', by: 'GOLFTEC', year: 2016, grade: 'M', url: 'https://www.golftec.ca/swingtru' },
  sportsbox_2024: { title: '10 advanced golf swing stats (Sportsbox AI 3D tour data)', by: 'Golf Digest Australia', year: 2024, grade: 'M', url: 'https://www.australiangolfdigest.com.au/useful-golf-swingfacts-sportsbox-ai-graph/' },
  trackman_pga_averages_sheet: { title: 'TrackMan PGA Tour averages sheet, older dataset (attack angle per club: driver -1.3, 3 wood -2.9, 5 wood -3.3, hybrid -3.5, 3 iron -3.1, 4 iron -3.4, 5 iron -3.7, 6 iron -4.1, 7 iron -4.3, 8 iron -4.5, 9 iron -4.7, PW -5.0 deg)', by: 'TrackMan, via Tee It Up RVA', year: 2019, grade: 'M', url: 'https://teeituprva.com/wp-content/uploads/2019/03/PGA-AVERAGES-INTERACTIVE.pdf' },
  trackman_attack_angle: { title: 'What is Attack Angle? (tour averages and amateur averages by handicap)', by: 'TrackMan', year: 2024, grade: 'M', url: 'https://www.trackman.com/blog/golf/attack-angle' },
  trackman_spin_loft: { title: 'What is Spin Loft? (PGA Tour driver 14.7 deg, 6-iron 24.3 deg)', by: 'TrackMan', grade: 'M', url: 'https://www.trackman.com/blog/spin-loft' },
  pga_australia_start_line: { title: 'Starting Line: Path or Face? (face sets about 85% of driver start direction, 75% for a mid iron)', by: 'PGA of Australia Academy', grade: 'E', url: 'https://pgaacademy.com.au/trackman/starting-line-path-or-face/' },
  trackman_impact_location: { title: '6 TrackMan Numbers All Amateur Golfers Should Know (heel and toe strikes curve the ball independent of path)', by: 'TrackMan', grade: 'E', url: 'https://www.trackman.com/blog/golf/6-trackman-numbers-all-amateur-golfers-should-know' },
  rapsodo_two_way_miss: { title: 'Why Early Extension Could Be The Cause of Your Two-Way Miss', by: 'Rapsodo Golf', year: 2022, grade: 'E', url: 'https://rapsodo.com/blogs/golf/early-extension-and-two-way-miss' },
  hackmotion_slice_driver: { title: 'Why Do I Slice My Driver But Not My Irons?', by: 'HackMotion', year: 2025, grade: 'E', url: 'https://hackmotion.com/slice-driver-but-not-irons/' },
  golftec_bending_2015: { title: 'Bending in the Golf Swing (tour average at address with an iron: shoulder bend 41 deg, hip bend 16 deg)', by: 'GOLFTEC Scramble', year: 2015, grade: 'M', url: 'https://scramble.golftec.com/blog/2015/03/what-is-bending-in-golf-swing/' },
  golftec_head_drop_2015: { title: 'Head Drop During the Golf Swing (tour average with the driver: shoulder bend 29 deg, hip bend 12 deg; tour players return to their setup numbers by impact)', by: 'GOLFTEC Scramble', year: 2015, grade: 'M', url: 'https://scramble.golftec.com/blog/2015/04/explaining-head-drop-golf-swing/' },
  cheetham_x_factor_2011: { title: 'The Difference Between X-Factor and X-Factor Stretch (tour X-factor about 42 deg at transition, stretch about 5 deg)', by: 'Phil Cheetham, TPI', year: 2011, grade: 'M', url: 'https://mytpi.com/articles/biomechanics/the_difference_between_x-factor_and_x-factor_stretch' },
  cheetham_kinematic_sequence: { title: 'Kinematic Sequence (pros peak pelvis, thorax, arm, club in order)', by: 'Phil Cheetham', grade: 'M', url: 'https://www.philcheetham.com/category/kinematic-sequence/' },
  swing_catalyst_mass_pressure: { title: 'Body mass and pressure (centre of mass and centre of pressure are independent)', by: 'David McGhie, Swing Catalyst', grade: 'M', url: 'https://swingcatalyst.com/articles/body-mass-and-pressure/' },
  keiser_weight_transfer: { title: 'Mastering Weight Transfer in the Golf Swing (tour pressure traces)', by: 'Donna White, Keiser University College of Golf', grade: 'M', url: 'https://collegeofgolf.keiseruniversity.edu/mastering-weight-transfer-in-the-golf-swing-balance-power-and-timing/' },
  novosel_tour_tempo: { title: 'Tour Tempo (3 to 1 backswing to downswing from 30 fps frame counts: 21/7, 24/8, 27/9)', by: 'John Novosel', year: 2004, grade: 'M', url: 'https://tourtempo.com/pages/tour-tempo-app' },
  blast_tempo: { title: 'What Is Golf Swing Tempo Ratio (tour range about 2.5 to 3.1 to 1)', by: 'Blast Motion', grade: 'E', url: 'https://blastmotion.com/blog/what-is-golf-swing-tempo-ratio/' },
  accelerometer_2010: { title: 'An Accelerometer Based Instrumentation of the Golf Club (mean backswing 731 ms, downswing 258 ms)', by: 'arXiv 1001.0761', year: 2010, grade: 'M', url: 'https://arxiv.org/pdf/1001.0761' },
  sensors_2023_hht: { title: 'Biomechanical Analysis of Golf Swing Motion Using Hilbert-Huang Transform (head-up motion at impact associated with a slice)', by: 'Sensors 23(15)', year: 2023, grade: 'M', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10422357/' },
  left_rough_head: { title: 'The Truth about Head Movement in the Golf Swing (under 4 inches for experts; about 1.5 inches as a margin)', by: 'The Left Rough', grade: 'E', url: 'https://theleftrough.com/head-movement-in-golf-swing/' },
  golfwrx_axis_tilt_forum: { title: 'How to setup with Secondary Axis Tilt (origin of the 8 to 10 degree tilt figure; forum, lowest grade)', by: 'GolfWRX forum', grade: 'U', url: 'https://forums.golfwrx.com/topic/1358790-how-to-setup-with-secondary-axis-tilt-spine-tilt/' },
  ingwersen_2023: { title: 'Evaluating current state of monocular 3D pose models for golf (depth error about 100 mm; hands the worst joint; kinematic sequence from one camera gave a wrong coaching conclusion)', by: 'Ingwersen, Jensen, Hannemose and Dahl, NLDL', year: 2023, grade: 'M', url: 'https://septentrio.uit.no/index.php/nldl/article/view/6793' },
  edriss_2025: { title: 'Commercial vision sensors and AI-based pose estimation frameworks in sports: a mini review (MediaPipe joint angles typically under 10 deg error)', by: 'Edriss et al., Frontiers in Physiology', year: 2025, grade: 'R', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12378739/' },
  aleksic_2024: { title: 'Validation of markerless pose estimation vs 3D motion capture in jumps (knee about 7 deg RMSE, hip about 8 deg)', by: 'Aleksic et al., Sensors', year: 2024, grade: 'M', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11511341/' },
  nakano_2020: { title: 'Evaluation of 3D markerless motion capture accuracy using OpenPose (wrist the worst joint, 40 to 47 mm)', by: 'Nakano et al., Frontiers', year: 2020, grade: 'M', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7739760/' },
  mediapipe_docs: { title: 'Pose landmark detection guide (world landmarks in metres from the hip centre)', by: 'Google AI Edge', grade: 'D', url: 'https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker' },
  apple_slomo: { title: 'nominalFrameRate is 30 for 240 fps slow motion video (duration stretched 8x)', by: 'Apple Developer Forums', grade: 'D', url: 'https://developer.apple.com/forums/thread/731460' },
  samsung_slomo: { title: 'Difference between Super Slow-mo and Slow motion video (Slow motion 240 fps plays 8x slower; Super Slow-mo captures a fraction of a second)', by: 'Samsung', grade: 'D', url: 'https://www.samsung.com/sg/support/mobile-devices/what-is-super-slow-mo-and-how-is-it-different-from-slow-motion-video/' },
  cheetham_timing_video: { title: 'Measuring the Timing of the Golf Swing from Video', by: 'Phil Cheetham, TPI', grade: 'E', url: 'https://www.mytpi.com/articles/biomechanics/measuring-the-timing-of-the-golf-swing-from-video' },
  bochnia_2024: { title: 'An Ergonomic Golf Grip Leads to Lower Forearm Muscle Activity (30 golfers; lead biceps activity lowest at takeaway, highest in late follow-through; no biceps change with the grip)', by: 'Bochnia et al., BMC Musculoskeletal Disorders', year: 2024, grade: 'M', url: 'https://doi.org/10.1186/s12891-024-07774-7' },
  jukes_2022: { title: 'Challenging the mechanism of distal biceps tendon rupture (57 video cases: forearm supinated, elbow near straight, isometric force)', by: 'Jukes et al., Bone and Joint Open', year: 2022, grade: 'M', url: 'https://doi.org/10.1302/2633-1462.310.BJO-2022-0123.R1' },
  mchardy_2007: { title: 'One-Year Follow-up Study on Golf Injuries in Australian Amateur Golfers (amount of play odds ratio 3.73; no warm-up 3.2x; elbow and forearm 17.2% of injuries)', by: 'McHardy, Pollard and Luo, Am J Sports Med', year: 2007, grade: 'M', url: 'https://doi.org/10.1177/0363546507300188' },
  ortho_virginia_interval: { title: 'Example Interval Golf Program (every other day; dull ache expected, sharp joint pain means stop; no fixed timeline)', by: 'OrthoVirginia', grade: 'C', url: 'https://www.orthovirginia.com/wp-content/uploads/2022/04/Owusu-Akyaw-Return-to-Golf-Example-Protocol.pdf' },
  acei_interval: { title: 'Interval Golf Rehabilitation Program (weekly ball counts)', by: 'Advanced Continuing Education Institute', grade: 'C', url: 'https://www.drgarrettkerns.com/pdfs/rehabilitation-protocols/interval-return-to-sport/interval-sport-interval-golf-rehabilitation-program.pdf' },
  wilk_2002: { title: 'Interval Sport Programs: Guidelines for Baseball, Tennis, and Golf', by: 'Wilk, Reinold and Andrews, JOSPT', year: 2002, grade: 'C', url: 'https://www.jospt.org/doi/pdf/10.2519/jospt.2002.32.6.293' },
  silbernagel_2007: { title: 'Continued sports activity using a pain-monitoring model (pain up to 5 of 10 acceptable if it settles by the next morning and does not climb week on week; Achilles tendinopathy)', by: 'Silbernagel et al., Am J Sports Med', year: 2007, grade: 'M', url: 'https://doi.org/10.1177/0363546506298279' },
  hsu_statpearls: { title: 'Biceps Tendon Rupture (red flags: pop at the elbow, bulge in the upper arm, bruising, weak palm-up turning)', by: 'Hsu et al., StatPearls', year: 2023, grade: 'R', url: 'https://www.ncbi.nlm.nih.gov/books/NBK513235/' },
  obrien_2021: { title: 'Leading Wrist Injuries in a Golfing Population (hard range mats linked to lead-side injury)', by: "O'Brien, IntechOpen", year: 2021, grade: 'M', url: 'https://doi.org/10.5772/intechopen.96979' },
  wulf_su_2007: { title: 'An External Focus of Attention Enhances Golf Shot Accuracy in Beginners and Experts', by: 'Wulf and Su, RQES', year: 2007, grade: 'M', url: 'https://gwulf.faculty.unlv.edu/wp-content/uploads/2020/01/Wulf_Su_2007.pdf' },
  mckay_2024: { title: 'Reporting bias, not external focus: a robust Bayesian meta-analysis (external-focus effect smaller than reported)', by: 'McKay et al., SportRxiv', year: 2024, grade: 'M', url: 'https://sportrxiv.org/index.php/server/preprint/view/304' },
  perkins_ceccato_2003: { title: 'Effects of focus of attention depend on golfers skill (less skilled golfers did better with form-focused cues)', by: 'Perkins-Ceccato, Passmore and Lee, J Sports Sci', year: 2003, grade: 'M', url: 'https://www.researchgate.net/publication/10650249' },
  guadagnoli_2002: { title: 'The efficacy of video feedback for learning the golf swing (video helps at two weeks, hurts immediately)', by: 'Guadagnoli, Holcomb and Davis, J Sports Sci', year: 2002, grade: 'M', url: 'https://pubmed.ncbi.nlm.nih.gov/12190281/' },
  guadagnoli_lee_2004: { title: 'Challenge Point: a framework for the effects of practice conditions (one thing at a time)', by: 'Guadagnoli and Lee, J Motor Behav', year: 2004, grade: 'M', url: 'https://www.researchgate.net/publication/8574634' },
  porter_magill_2010: { title: 'Systematically increasing contextual interference is beneficial for learning sport skills (blocked, then serial, then random)', by: 'Porter and Magill, J Sports Sci', year: 2010, grade: 'M', url: 'https://www.tandfonline.com/doi/abs/10.1080/02640414.2010.502946' },
  liao_masters_2001: { title: 'Analogy learning: a means to implicit motor learning', by: 'Liao and Masters, J Sports Sci', year: 2001, grade: 'M', url: 'https://www.tandfonline.com/doi/pdf/10.1080/02640410152006081' },
  golftec_headcover_2018: { title: 'Rid Your Slice: Learn to Draw with a Headcover (about 4 inches outside and 6 inches behind the ball)', by: 'GOLFTEC', year: 2018, grade: 'E', url: 'https://scramble.golftec.com/blog/2018/04/rid-your-slice-learn-to-draw-with-a-headcover/' },
  golfcom_chair_2020: { title: 'Drill Skills: how a chair can fix early extension', by: 'GOLF.com, Alison Curdt', year: 2020, grade: 'E', url: 'https://golf.com/instruction/drill-skills-how-a-chair-can-fix-the-problem-plaguing-70-percent-of-amateur-golfers/' },
  hackmotion_towel: { title: 'Towel-on-the-Ground Drill: fix casting and improve impact', by: 'HackMotion', year: 2026, grade: 'E', url: 'https://hackmotion.com/towel-on-ground-drill/' },
  hackmotion_reverse_pivot: { title: 'Reverse Pivot in Golf? 6 ways to fix it', by: 'HackMotion', year: 2026, grade: 'E', url: 'https://hackmotion.com/reverse-pivot-in-golf/' },
  hackmotion_sway: { title: '5 Simple Ways to Fix Swaying in the Golf Swing', by: 'HackMotion', year: 2025, grade: 'E', url: 'https://hackmotion.com/stop-swaying-in-golf-swing/' },
  hackmotion_hanging_back: { title: 'How to Stop Hanging Back in the Golf Swing', by: 'HackMotion, Clint McCormick', grade: 'E', url: 'https://hackmotion.com/stop-hanging-back-in-golf-swing/' },
  hackmotion_chicken_wing: { title: 'Fix Your Chicken Wing Golf Swing', by: 'HackMotion', grade: 'E', url: 'https://hackmotion.com/chicken-wing-in-golf/' },
  stryper_stuck: { title: 'Getting Stuck Inside in Golf: causes and fixes', by: 'Stryper Golf', grade: 'E', url: 'https://www.strypergolf.com.au/blogs/learn/getting-stuck-inside' },
  rotaryswing_9to3: { title: '9 to 3 Golf Swing Drill', by: 'RotarySwing', grade: 'E', url: 'https://rotaryswing.com/golf-instruction/golfbiomechanics/9-to-3-drill-golf-swing-drill' },
  golfsmart_wall: { title: 'Head-on-the-wall and butt-fingerprint drills', by: 'Golf Smart Academy', grade: 'E', url: 'https://www.golfsmartacademy.com/golf-instruction/wall-outside-left-ear/' },
  hardy_plane_truth: { title: 'The Plane Truth: one and two plane swings (summary of Jim Hardy)', by: 'Golf Today', year: 2018, grade: 'E', url: 'https://golftoday.co.uk/the-plane-truth-part-3-one-two-plane-golf-swings/' },
  stack_tilt_revisited: { title: 'Stack and Tilt Revisited', by: 'Bennett and Plummer, Golf Tips', year: 2010, grade: 'E', url: 'https://golftipsmag.com/instruction/full-swing/stack-and-tilt/' },
  skillest_stack_tilt: { title: 'What is Stack and Tilt? (about 55% on the lead foot at address, arms straight)', by: 'Skillest', year: 2021, grade: 'E', url: 'https://skillest.com/blog/what-is-stack-tilt/' },
  mann_stack_tilt: { title: 'Book review: Stack and Tilt (critical secondary summary of the 2009 book)', by: 'Jeff Mann', grade: 'E', url: 'https://www.perfectgolfswingreview.net/stackandtilt.htm' },
  ncg_a_swing: { title: 'David Leadbetter A Swing: the key principles', by: 'National Club Golfer', year: 2024, grade: 'E', url: 'https://www.nationalclubgolfer.com/golf-tips/long-game/david-leadbetter-key-principles-swing/' },
  graves_moe_norman: { title: 'Moe Norman Natural Swing Plane: the single plane', by: 'Graves Golf', grade: 'E', url: 'https://gravesgolf.com/moe-normans-natural-swing-plane-the-single-plane/' },
  mann_austin: { title: 'Mike Austin review (secondary summary)', by: 'Jeff Mann', grade: 'E', url: 'https://www.perfectgolfswingreview.net/austin.htm' },
  nicklaus_setup: { title: 'Jack Nicklaus shares 5 setup keys', by: 'GOLF.com', year: 2024, grade: 'E', url: 'https://golf.com/instruction/approach-shots/jack-nicklaus-five-setup-keys-timeless-tips/' },
  rotaryswing_axis_tilt: { title: 'Axis Tilt at Setup', by: 'RotarySwing', grade: 'E', url: 'https://rotaryswing.com/axis-tilt' },
  pgaplay_ball_position: { title: 'Understanding correct ball position and set up for different clubs', by: 'Amy Taylor, PGA Play', year: 2025, grade: 'E', url: 'https://www.pgaplay.co.uk/learn/understanding-correct-ball-position-and-set-up-for-different-clubs/' },
  hogan_five_lessons_2nd: { title: 'Five Lessons: stance and posture notes (secondary summary)', by: 'Ben Hogan, 1957, via Coach Ortiz PE', grade: 'E', url: 'https://sites.google.com/site/coachortizpe/home/blog/benhogansfivelessons02stanceandposturenotes' },
  // 3D laboratory kinematics (docs/research/01)
  meister_2011: { title: 'Rotational biomechanics of the elite golf swing: benchmarks for amateurs (pros: upper torso 99 deg, pelvis 46 deg at the top; side tilt 25 deg at impact; X-factor at impact 33 deg correlates with clubhead speed)', by: 'Meister et al., J Applied Biomechanics', year: 2011, grade: 'M', url: 'https://journals.humankinetics.com/view/journals/jab/27/3/article-p242.xml' },
  okuda_2010: { title: 'Trunk rotation and weight transfer patterns between skilled and low skilled golfers (thorax turn at the top does not separate skill; force about 75% trail at the top and 70% lead at impact)', by: 'Okuda, Gribble and Armstrong, J Sports Sci Med', year: 2010, grade: 'M', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3737954/' },
  yang_2024: { title: 'The effects of different iron shaft weights on golf swing performance (high handicappers turned the pelvis more, 56 vs 49 deg, and the thorax less)', by: 'Yang et al., Frontiers in Bioengineering', year: 2024, grade: 'M', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10877370/' },
  liu_2026: { title: 'Biomechanical characteristics of the swing planes for the driver and 7 iron (driver turns more and bends less than the iron, same golfers)', by: 'Liu et al., Frontiers in Bioengineering', year: 2026, grade: 'M', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13272296/' },
  watson_2026: { title: 'Ground reaction force and centre of pressure during the golf swing: a systematic review (weight shift and centre of pressure are not interchangeable)', by: 'Watson et al., Sports Medicine', year: 2026, grade: 'R', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13198453/' },
  mchugh_2024: { title: 'Kinematic, kinetic and temporal metrics associated with golf proficiency (X-factor at impact, not at the top, marks skill)', by: 'McHugh et al., J Strength Cond Res', year: 2024, grade: 'M', url: 'https://doi.org/10.1519/jsc.0000000000004663' },
  kim_2023: { title: 'Validation of inertial measurement units for golf swing rotation (X-factor limits of agreement about 20 deg even between lab systems)', by: 'Kim et al., Sensors', year: 2023, grade: 'M', url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10611231/' },
  wheare_2021: { title: 'Reliability and validity of the Polhemus Liberty system for elite golfers (two lab systems disagree by up to 27 deg at the wrist at impact)', by: 'Wheare et al., Sensors', year: 2021, grade: 'M', url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8271493/' },
  steele_2018: { title: 'Golf swing rotational velocity: the essential follow-through (pros: upper torso 552 deg/s, pelvis 415 deg/s)', by: 'Steele et al., Annals of Rehabilitation Medicine', year: 2018, grade: 'M', url: 'https://www.e-arm.org/journal/view.php?number=4036' },
  horan_2010: { title: 'Thorax and pelvis kinematics during the downswing of male and female skilled golfers (women have a longer downswing)', by: 'Horan et al., J Biomechanics', year: 2010, grade: 'M', url: 'https://doi.org/10.1016/j.jbiomech.2010.02.005' },
  cheetham_stretch_2000: { title: 'The importance of stretching the X-Factor in the downswing (X-factor stretch, not X-factor at the top, separates skill)', by: 'Cheetham et al., Pre-Olympic Congress', year: 2000, grade: 'M', url: 'https://www.philcheetham.com/wp-content/uploads/2011/11/Stretching-the-X-Factor-Paper.pdf' },
};

// ---------------------------------------------------------------------------
// 3D laboratory reference values (docs/research/01). Shown in the knowledge panel for
// context. None of these are measurable from one phone camera, which is why the app
// does not print turn angles; they are here so the coach never says "turn more".
// ---------------------------------------------------------------------------

export const KINEMATICS = [
  { name: 'Thorax turn at the top', value: 'About 99 to 112 deg in good players. Does not separate skill levels: scratch 102 deg vs 30 handicap 98 deg was not significant.', sources: ['meister_2011', 'okuda_2010', 'liu_2026'] },
  { name: 'Pelvis turn at the top', value: 'About 39 to 52 deg in good players. High handicappers turned the pelvis more (56 deg) than low handicappers (49 deg) in a 2024 study, while turning the thorax less.', sources: ['meister_2011', 'yang_2024'] },
  { name: 'Driver versus 7 iron', value: 'Same golfers: the driver turns more (torso 112 vs 104 deg, pelvis 59 vs 52 deg) and bends forward less.', sources: ['liu_2026'] },
  { name: 'X-factor', value: 'About 42 deg at transition (TPI) or 56 deg sampled at the top. The gap at the top does not separate skill; the stretch into the downswing and the gap at impact do. Not shown by this app: even lab systems disagree by about 20 deg.', sources: ['cheetham_x_factor_2011', 'cheetham_stretch_2000', 'mchugh_2024', 'kim_2023'] },
  { name: 'Side tilt at impact', value: 'Pros about 25 deg with a 5 iron, rising to about 48 deg just after impact. GOLFTEC tour reference 39 deg by its own definition.', sources: ['meister_2011', 'golftec_swingtru'] },
  { name: 'Pressure between the feet', value: 'Force plates read about 75 to 80% on the trail foot at the top and about 70% on the lead foot at impact in skilled players. Video sees where the hips are, not pressure, and the two are not interchangeable.', sources: ['okuda_2010', 'watson_2026', 'swing_catalyst_mass_pressure'] },
  { name: 'Peak rotation speed', value: 'Pros: upper torso about 552 deg/s, pelvis about 415 deg/s in the downswing. The pelvis reverses first, then the thorax, then the arms, then the club.', sources: ['steele_2018', 'cheetham_kinematic_sequence'] },
  { name: 'Tempo', value: 'About 0.73 s back and 0.26 s down in an accelerometer study; skilled women swing down slower than men. The 3 to 1 ratio is a coaching convention from 30 fps frame counts, not a peer-reviewed finding.', sources: ['accelerometer_2010', 'horan_2010', 'novosel_tour_tempo'] },
  { name: 'What has no published number', value: 'Head movement in cm, early extension in cm, forward bend at address in degrees, lead elbow angle, trail elbow height. Those bands are coaching convention and the report card says so.', sources: ['meister_2011'] },
];

/** Look up a source; unknown ids throw so a typo fails the tests, not the golfer. */
export function source(id) {
  const s = SOURCES[id];
  if (!s) throw new Error(`Unknown source id: ${id}`);
  return { id, ...s };
}

// ---------------------------------------------------------------------------
// Measurement tiers from a single phone camera (docs/research/04). A = a number is
// defensible, B = direction and rough size, C = show as words or a picture, never a
// number, D = do not attempt.
// ---------------------------------------------------------------------------

export const TIERS = {
  A: 'a number is defensible',
  B: 'direction and rough size are defensible; the number carries a wide band',
  C: 'words or a picture only, never a number',
  D: 'not measurable from one camera',
};

export const NOT_VISIBLE = [
  'Grip and lead wrist angles',
  'Clubface angle',
  'Club path and swing plane',
  'Attack angle',
  'Clubhead speed and ball speed',
  'Pressure between the feet (video sees mass, not pressure)',
  'Shoulder and hip turn in degrees (depth from one camera is too noisy)',
];
export const NOT_VISIBLE_SOURCES = ['ingwersen_2023', 'swing_catalyst_mass_pressure'];

// ---------------------------------------------------------------------------
// Swing models. Default is a neutral rotary baseline; a named model changes what
// counts as normal, so the app asks rather than guesses (docs/research/03).
// ---------------------------------------------------------------------------

export const SWING_MODELS = {
  neutral_rotary: {
    name: 'Neutral (default)',
    summary: 'A modern rotary swing measured against the amateur and tour reference data. Assume this unless you are working on a named method with a coach.',
    signature: 'Weight loads the trail side going back, the head stays roughly centred, posture is held, weight moves to the lead side by impact.',
    sources: ['tpi_early_extension_article', 'trackman_attack_angle', 'golftec_bending_2015'],
  },
  stack_and_tilt: {
    name: 'Stack and Tilt',
    summary: 'Bennett and Plummer. Weight stays on the lead side going back (about 55% at address, majority at the top), the spine extends and tilts toward the target in the backswing, the hips slide and turn forward. Looks like a reverse pivot to a classic eye, on purpose.',
    signature: 'Weight stays lead side at the top, the head does not drift away from the target, the trail leg straightens going back.',
    typicalMiss: 'Slice when the extension fails; thin when the slide outruns the turn.',
    caution: 'Has a documented spinal criticism; ask about back history before pushing it.',
    sources: ['stack_tilt_revisited', 'skillest_stack_tilt', 'mann_stack_tilt'],
  },
  one_plane: {
    name: 'One plane (Hardy)',
    summary: 'More forward bend at address, held unchanged. Lead arm sits on the shoulder plane at the top. Body release, minimal lateral shift.',
    signature: 'Bent-over address, wide stance, lead arm on or under the shoulder line at the top.',
    typicalMiss: 'Degrades wide and shallow.',
    sources: ['hardy_plane_truth'],
  },
  two_plane: {
    name: 'Two plane (Hardy)',
    summary: 'More upright address, arms swing on a steeper plane than the shoulders, higher trail elbow, a small lateral shift is part of it. Arm and hand release, timing dependent.',
    signature: 'Upright address, narrower stance, lead arm clearly above the shoulder line at the top.',
    typicalMiss: 'Two-way and timing dependent; degrades steep and narrow.',
    sources: ['hardy_plane_truth'],
  },
  classic: {
    name: 'Classic (Hogan, Nicklaus)',
    summary: 'Real trail-side load, steady head that starts and stays behind the ball, forward bend held, full turn and a big arc, arm and hand release.',
    signature: 'Head behind the ball throughout, weight clearly on the trail side at the top.',
    typicalMiss: 'Hanging back, fat, push.',
    sources: ['nicklaus_setup', 'hogan_five_lessons_2nd'],
  },
  single_plane: {
    name: 'Single plane (Moe Norman)',
    summary: 'Hands set high and far from the body at address with the shaft in line with the arms, wide stance, minimal knee bend, arms straight at address and throughout. The whole address geometry differs, so conventional posture bands do not apply.',
    signature: 'Shaft and lead arm in one line at address, very wide stance.',
    typicalMiss: 'Fat or hook if shallowed further; thin if steepened.',
    sources: ['graves_moe_norman'],
  },
  a_swing: {
    name: 'A Swing (Leadbetter)',
    summary: 'Steep backswing and shallow downswing (the V plane). Lead arm short and connected to the chest, trail bicep pinched to the chest. Built for golfers with limited practice time.',
    signature: 'Shaft near vertical halfway back, markedly shallower halfway down, short backswing, lead arm tight to the chest.',
    typicalMiss: 'Steep over-the-top slice if the shallowing is not learned.',
    sources: ['ncg_a_swing'],
  },
  austin: {
    name: 'Mike Austin',
    summary: 'Stationary head, 45 degrees or more of hip turn, trail elbow under the hands at the top, large secondary tilt in the downswing, a full hand release with a trail-arm throw. Needs a flexible spine.',
    signature: 'Hip turn well past 45 degrees at the top, trail elbow under the hands, very active trail arm through impact.',
    typicalMiss: 'Hook, block.',
    caution: 'Contra-indicated for a stiff spine.',
    sources: ['mann_austin'],
  },
};

export const MODEL_IDS = Object.keys(SWING_MODELS);

// ---------------------------------------------------------------------------
// Setup by club group (docs/research/03 section 3, plus the TrackMan per-club sheet).
// Only the driver, a mid iron and a pitching wedge have published setup numbers. Where a
// source says nothing about a group, the entry says so rather than guessing.
// Sources: pgaplay_ball_position (driver, 7 iron, wedge), nicklaus_setup (driver ball
// position; every other club behind the low point), hogan_five_lessons_2nd (stance width
// gradient: shoulder width at the 5 iron, wider toward the driver), golftec bending and
// head drop (tour forward bend, iron and driver), trackman_attack_angle (current tour
// driver, 6 iron, PW), trackman_pga_averages_sheet (older per-club attack angles).

const NO_WOOD_NUMBERS = 'No published figure for this club. Measured against the iron bands.';

export const SETUP_BY_CLUB = {
  driver: {
    name: 'Driver',
    ballPosition: 'Level with the lead heel, just inside the lead foot. Nicklaus: opposite the lead instep.',
    stance: 'Wide, wider than the shoulders. Hogan: the widest stance in the bag.',
    forwardBend: 'Tour average with the driver: shoulder bend 29 deg, hip bend 12 deg (GOLFTEC).',
    shoulderTilt: 'The most of any club, trail shoulder clearly lower. No reliable degree figure exists.',
    weight: 'Even, or a slight trail-side bias.',
    hands: 'Level with or slightly behind the ball, minimal forward lean.',
    attackAngle: 'Up. PGA Tour average is -0.9 deg (slightly down); the older TrackMan sheet has -1.3 deg. Amateurs hit down more as handicap rises (about -1.8 deg for a 14 handicap, -2.1 for a bogey golfer). A slightly upward strike is the aim.',
    sources: ['pgaplay_ball_position', 'nicklaus_setup', 'hogan_five_lessons_2nd', 'golftec_head_drop_2015', 'trackman_attack_angle', 'trackman_pga_averages_sheet', 'keiser_weight_transfer'],
  },
  wood: {
    name: 'Fairway woods (3, 5, 7)',
    ballPosition: 'Nicklaus: every club but the driver a little behind the lowest point of the arc. Forward of centre, but not as far forward as the driver.',
    stance: 'Hogan: progressively wider from the 5 iron toward the driver, so a wood sits between the two.',
    forwardBend: NO_WOOD_NUMBERS,
    shoulderTilt: NO_WOOD_NUMBERS,
    weight: 'No published wood figure. The iron guide (about 50/50) is what the app measures against.',
    hands: 'No published wood figure.',
    attackAngle: 'Slightly down off the deck. Older TrackMan tour sheet: 3 wood -2.9 deg, 5 wood -3.3 deg.',
    sources: ['nicklaus_setup', 'hogan_five_lessons_2nd', 'trackman_pga_averages_sheet'],
  },
  hybrid: {
    name: 'Hybrids',
    ballPosition: 'Nicklaus: a little behind the lowest point of the arc, like every club but the driver. Between a fairway wood and a long iron.',
    stance: 'Hogan: between the 5 iron (shoulder width) and the driver (widest).',
    forwardBend: NO_WOOD_NUMBERS,
    shoulderTilt: NO_WOOD_NUMBERS,
    weight: 'No published hybrid figure. Measured against the iron guide.',
    hands: 'No published hybrid figure.',
    attackAngle: 'Down. Older TrackMan tour sheet: hybrid (15 to 18 deg) -3.5 deg.',
    sources: ['nicklaus_setup', 'hogan_five_lessons_2nd', 'trackman_pga_averages_sheet'],
  },
  longIron: {
    name: 'Long irons (2 to 5)',
    ballPosition: 'Nicklaus: a little behind the lowest point of the arc. A touch forward of centre.',
    stance: 'Hogan: shoulder width at the 5 iron, wider for each longer club.',
    forwardBend: 'Tour average with an iron: shoulder bend 41 deg, hip bend 16 deg (GOLFTEC, club unspecified). Measured against the iron bands.',
    shoulderTilt: 'Present but smaller than the driver.',
    weight: 'About 50/50.',
    hands: 'Slightly ahead of the ball.',
    attackAngle: 'Down. Older TrackMan tour sheet: 3 iron -3.1, 4 iron -3.4, 5 iron -3.7 deg.',
    sources: ['nicklaus_setup', 'hogan_five_lessons_2nd', 'golftec_bending_2015', 'trackman_pga_averages_sheet'],
  },
  midIron: {
    name: 'Mid irons (6 to 8)',
    ballPosition: 'Centre, or a touch forward of centre.',
    stance: 'About shoulder width, a little narrower than the 5 iron.',
    forwardBend: 'Tour average with an iron: shoulder bend 41 deg, hip bend 16 deg (GOLFTEC). A common teaching figure is about 25 deg from vertical.',
    shoulderTilt: 'Present but smaller than the driver.',
    weight: 'About 50/50.',
    hands: 'Slightly ahead of the ball.',
    attackAngle: 'Down. PGA Tour 6 iron about -3.7 deg (current TrackMan article). Older sheet: 6 iron -4.1, 7 iron -4.3, 8 iron -4.5 deg.',
    sources: ['pgaplay_ball_position', 'hogan_five_lessons_2nd', 'golftec_bending_2015', 'trackman_attack_angle', 'trackman_pga_averages_sheet'],
  },
  shortIron: {
    name: 'Short iron (9)',
    ballPosition: 'Centre.',
    stance: 'Narrower than the mid irons, wider than a wedge.',
    forwardBend: 'Steeper than a mid iron because you stand closer to the ball. Measured against the iron bands.',
    shoulderTilt: 'Small.',
    weight: 'About 50/50.',
    hands: 'Ahead of the ball.',
    attackAngle: 'Down. Older TrackMan tour sheet: 9 iron -4.7 deg.',
    sources: ['pgaplay_ball_position', 'hogan_five_lessons_2nd', 'trackman_pga_averages_sheet'],
  },
  wedge: {
    name: 'Wedges (PW, GW, SW, LW)',
    ballPosition: 'Centre or slightly behind centre for a standard full shot.',
    stance: 'Narrow, about a hand-width narrower than the irons.',
    forwardBend: 'Steeper than a mid iron because you stand closer to the ball.',
    shoulderTilt: 'The least; near level is fine for delicate shots.',
    weight: 'About 50/50, or slightly on the lead side.',
    hands: 'The most forward lean in the bag.',
    attackAngle: 'Down, the steepest. TrackMan standard assumption for a pitching wedge is about -3.9 deg; the older tour sheet has -5.0 deg. Bunker and flop-shot setups for the sand and lob wedge are a different shot and are not covered here.',
    sources: ['pgaplay_ball_position', 'trackman_attack_angle', 'trackman_pga_averages_sheet'],
  },
};
SETUP_BY_CLUB.other = { ...SETUP_BY_CLUB.midIron, name: 'Other club (treated as a mid iron)' };

// ---------------------------------------------------------------------------
// Faults (TPI vocabulary) and the ball flight they produce (docs/research/02).
// ---------------------------------------------------------------------------

export const FAULTS = {
  earlyExtension: {
    name: 'Early extension',
    view: 'dtl',
    definition: 'Any forward movement of the lower body toward the ball during the downswing.',
    cause: 'Limited deep squat and hip hinge, limited pelvis rotation around the lead hip, short lats, weak glutes and abdominals. A failed toe touch made it 6x more likely in one study.',
    miss: 'Two-way miss: block right and hook left. The arms get trapped, the hands must flip to square the face; flip and it hooks, hold and it blocks.',
    prevalence: '67% of more than 90,000 golfers screened; 99% of 100+ tour pros do not have it.',
    metricIds: ['earlyExtension'],
    sources: ['tpi_early_extension_article', 'tpi_early_extension', 'gulgin_2014', 'rapsodo_two_way_miss'],
  },
  lossOfPosture: {
    name: 'Loss of posture',
    view: 'dtl',
    definition: 'Any significant change from the address angles during the swing.',
    cause: 'Same family as early extension: hip and lower body mobility, core stability. A failed trail single-leg bridge made it 6x more likely.',
    miss: 'Block right and hook left.',
    prevalence: 'One of the three most frequent faults in a 36-golfer screened sample.',
    metricIds: ['spineDelta', 'spineAddress', 'headVertImpact'],
    sources: ['tpi_loss_of_posture', 'gulgin_2014'],
  },
  sway: {
    name: 'Sway',
    view: 'fo',
    definition: 'Excessive lower body movement away from the target in the backswing, weight to the outside of the trail foot.',
    cause: 'Restricted trail hip internal rotation, limited trunk to pelvis separation, weak glute medius.',
    miss: 'Poor low point control, fat and thin, lost speed.',
    metricIds: ['hipSway', 'headTop'],
    sources: ['tpi_sway'],
  },
  slide: {
    name: 'Slide',
    view: 'fo',
    definition: 'Excessive lower body movement toward the target in the downswing.',
    cause: 'Restricted lead hip internal rotation, limited separation, weak glute medius.',
    miss: 'The upper body stalls, the face stays open: blocks and high weak shots. With irons the hands rescue it and it hooks.',
    metricIds: ['hipSlide', 'weightImpact'],
    sources: ['tpi_slide'],
  },
  reverseSpine: {
    name: 'Reverse spine angle',
    view: 'fo',
    definition: 'The upper body leans toward the target, or bends too far to the lead side, at the top.',
    cause: 'Limited separation, restricted trail hip rotation, weak core, excessive pelvic tilt at address.',
    miss: 'Path problems and lost power; a prime cause of lower back pain in golfers.',
    metricIds: ['reversePivot', 'weightTop', 'shoulderTiltImpact'],
    sources: ['tpi_reverse_spine'],
  },
  hangingBack: {
    name: 'Hanging back',
    view: 'fo',
    definition: 'No weight shift toward the target in the downswing; still on the trail foot at impact.',
    cause: 'Lead hip and ankle mobility, core and lead-leg stability, a reverse pivot upstream.',
    miss: 'Divots behind the ball, fat and thin, lost speed. With the driver a weak upward strike. Good players are about four inches closer to the target at impact than at address.',
    metricIds: ['weightImpact', 'headImpact', 'hipSlide'],
    sources: ['tpi_hanging_back'],
  },
  overTheTop: {
    name: 'Over the top',
    view: 'dtl',
    definition: 'Overuse of the upper body in the downswing throws the club outside the plane; the head approaches from out to in.',
    cause: 'Hip mobility, core and glute strength, upper and lower body separation, weight shift sequence.',
    miss: 'A pull with a square face, a slice with an open face. Perhaps the most common fault among high handicappers.',
    metricIds: ['handsPath', 'shoulderTiltImpact'],
    sources: ['tpi_over_the_top'],
  },
  chickenWing: {
    name: 'Chicken wing',
    view: 'fo',
    definition: 'The lead elbow bends and the lead wrist cups through impact.',
    cause: 'Upper body breakdown through impact, poor sequencing, a steep path, lost lead shoulder external rotation.',
    miss: 'Added loft and spin, toe strikes, high weak shots; the steep-path version slices.',
    metricIds: ['leadArmImpact'],
    sources: ['tpi_chicken_wing'],
  },
  flyingElbow: {
    name: 'Flying elbow',
    view: 'dtl',
    definition: 'An extremely elevated trail elbow in the backswing.',
    cause: 'Connection loss; normal in a two-plane swing and by design in the Austin method (elbow under the hands).',
    miss: 'Plane shift, across the line or laid off at the top.',
    metricIds: ['trailElbowTop'],
    sources: ['tpi_characteristics', 'hardy_plane_truth'],
  },
  headMovement: {
    name: 'Head movement',
    view: 'both',
    definition: 'Lateral drift in the backswing or transition, and vertical lift or dip through impact.',
    cause: 'Sway, a reverse pivot, standing up through the ball.',
    miss: 'The low point moves, so contact goes fat or thin. Head-up motion at impact is associated with a slice in a 2023 motion study. Normal head rotation is not a fault.',
    metricIds: ['headTop', 'headImpact', 'headVertTop', 'headVertImpact'],
    sources: ['sensors_2023_hht', 'left_rough_head'],
  },
};

export const BALL_FLIGHT = {
  facts: [
    'The face sets the start line: about 85% for the driver and 75% for a mid iron. The curve comes from the face relative to the path.',
    'Loft decides how much a face-to-path gap curves the ball. PGA Tour spin loft is about 14.7 deg with the driver and 24.3 deg with a 6 iron, so the same error curves the driver far more.',
    'Amateurs hit down on the driver, and more so as handicap rises (about -1.8 deg at a 14 handicap). A downward driver strike drags the path left and raises spin, which feeds a slice.',
    'Heel strikes curve the ball left to right and toe strikes right to left, independent of the path. Driver faces amplify this; iron faces barely do.',
  ],
  twoWayMiss: 'A driver slice and an iron hook are usually one swing pattern seen through two lofts, not two problems. When the hips move toward the ball in the downswing the arms get trapped and the hands have to time the face: hold it and it blocks or slices, flip it and it hooks. Fix the body pattern that makes the face a timing job and both misses shrink together. Fixing the slice alone by strengthening the grip makes the iron hook worse.',
  checkFirst: ['earlyExtension', 'spineDelta', 'weightImpact', 'shoulderTiltImpact', 'handsPath'],
  sources: ['pga_australia_start_line', 'trackman_spin_loft', 'trackman_attack_angle', 'trackman_impact_location', 'rapsodo_two_way_miss', 'hackmotion_slice_driver'],
};

// Tour reference values, shown as references with attribution, never as targets for an
// amateur (docs/research/02 section 5, /06 recommendation 9).
export const TOUR_REFERENCES = [
  { metricId: 'hipSway', text: 'GOLFTEC tour average hip position at the top: 3.9 inches (10 cm) toward the target versus address. Lower handicaps move more toward the target, not away.', sources: ['golftec_swingtru'] },
  { metricId: 'hipSlide', text: 'GOLFTEC tour average hip position at impact: 1.6 inches (4 cm) toward the target. Sportsbox 3D: pelvis up to 5 inches toward the target by impact. TPI: about four inches closer to the target at impact than at address.', sources: ['golftec_swingtru', 'sportsbox_2024', 'tpi_hanging_back'] },
  { metricId: 'spineAddress', text: 'GOLFTEC tour average forward bend at address: shoulder bend 41 deg with an iron, 29 deg with the driver; tour players return to their setup numbers by impact.', sources: ['golftec_bending_2015', 'golftec_head_drop_2015'] },
  { metricId: 'earlyExtension', text: 'Sportsbox 3D: a tour pelvis rises about 1 inch above its start height by impact. Rising is normal; moving toward the ball line is the fault.', sources: ['sportsbox_2024'] },
  { metricId: 'tempo', text: 'Tour Tempo frame counts at 30 fps: 21/7, 24/8 or 27/9, about 3 to 1. Blast Motion tour range 2.5 to 3.1. What tour players repeat is their own ratio, not a magic number.', sources: ['novosel_tour_tempo', 'blast_tempo', 'accelerometer_2010'] },
  { metricId: 'headTop', text: 'Instruction figures only: under 4 inches for experts, about 1.5 inches as a working margin. No tour database figure was found.', sources: ['left_rough_head'] },
];

// ---------------------------------------------------------------------------
// PROTECT mode: a volume and shot-selection assistant, not a treatment
// (docs/research/05). Lines are shown verbatim.
// ---------------------------------------------------------------------------

export const PROTECT = {
  disclaimer: 'This is a coaching app, not a physio. If your physio or doctor says something different, do what they say. Nothing here is medical advice.',
  lines: {
    on: 'PROTECT mode is on. Your lead arm is the sore one. While this is on I will track your swing and I will not push you for speed or distance.',
    stop: 'Stop if it hurts. Not "ease off". Stop. Put the club down and end the session. Soreness that fades is one thing. Sharp pain is a different thing and it means stop.',
    warmUp: 'Warm up first. Get moving, get some blood into the arm, then take some easy swings before you hit anything. Ease into the first few. Do not go at the first ball full tilt.',
    volume: 'Fewer balls is the part of this with the most evidence behind it. How much you play is the biggest risk factor anyone has measured in golfers. If you finish the plan and feel fine, that is the session. Do not add a bucket.',
    order: 'Order we work in: putts, then chips, then wedges and short irons, then middle irons, then long clubs, then driver last. Driver goes last because it is the longest club and the fastest swing.',
    surface: 'Tee it up, or hit off grass if you can. Hitting hard off a mat is the shot that jars the arms. Teeing the ball takes the ground out of it completely.',
    bentArm: 'Your lead arm was bent through the ball on that one. I am noting it, not fixing it. While your arm is sore that bend might be your body protecting itself. We will leave it alone.',
    followThrough: 'One thing worth knowing. The EMG studies show your lead biceps works hardest in the follow-through, not at impact. It is braking the arm as the elbow folds. So if any part of the swing is going to nip, it is the finish. A softer, shorter finish is a reasonable thing to try. To be straight with you: nobody has tested that in a study. It is reasoning, not proof.',
    morning: 'How is the arm this morning compared to yesterday before you hit? Back to normal by the next morning is the usual line physios draw. If it is worse today than before you played, that is a smaller session next time, not a bigger one.',
    work: 'If the arm is also loaded hard at work, the golf plan only works if that load is handled too. That is a conversation for your physio.',
    progress: 'You move up a stage when you finish a stage cleanly, not when a certain number of weeks have passed. There is no timetable. There is a checklist.',
    off: 'I am not the one who turns this off. When your physio or your doctor says you are right to load it normally, tell me and I will switch back.',
  },
  redFlags: [
    'A pop or snap at the front of the elbow',
    'A bulge or a change in the shape of your upper arm',
    'Bruising in the crease of your elbow',
    'Real weakness turning your palm up, like a screwdriver or a jar lid',
    'Pins and needles or numbness',
    'Pain that is worse each week instead of better',
  ],
  redFlagFooter: 'Get this looked at, today if you can. I am an app. I cannot tell you what any of that means. A doctor can.',
  painRule: 'Physios commonly allow pain up to about 5 out of 10 during and after loading, provided it settles by the next morning and does not climb week on week. That rule comes from Achilles tendon research, so treat it as the common rule, not a rule for your injury, and defer to your physio.',
  // Interval golf program ladder. Ball counts are from two published copies of the
  // Wilk-lineage program. Three sessions a week, hitting every other day.
  stages: [
    { n: 1, name: 'Putts and chips', sessions: ['20 putts, 15 chips, 5 min rest, 15 chips', '25 putts, 15 chips, 5 min rest, 25 chips', '20 putts, 20 chips, 5 min rest, 20 putts, 20 chips, 10 irons off a tee, 5 min rest, 10 chips, 5 irons off a tee'], clubs: ['wedge'] },
    { n: 2, name: 'Short and medium irons', sessions: ['20 chips, 10 short irons, 5 min rest, 10 short irons, 15 medium irons off a tee', '20 chips, 15 short irons, 10 min rest, 15 short irons, 15 chips, putting, 15 medium irons', '15 short irons, 10 medium irons, 10 min rest, 20 short irons, 15 chips'], clubs: ['wedge', 'shortIron', 'midIron'] },
    { n: 3, name: 'Long irons and woods', sessions: ['15 short, 20 medium, 10 min rest, 5 long, 15 short, 15 medium, 10 min rest, 20 chips', '15 short, 10 medium, 10 long, 10 min rest, 10 short, 10 medium, 5 long, 5 wood', '15 short, 15 medium, 10 long, 10 min rest, 10 short, 10 medium, 10 long, 10 wood'], clubs: ['wedge', 'shortIron', 'midIron', 'longIron', 'hybrid', 'wood'] },
    { n: 4, name: 'Driver introduced', sessions: ['15 short, 10 medium, 10 long, 10 drives, 15 min rest, repeat the block', 'Play 9 holes', 'Play 9 holes'], clubs: ['wedge', 'shortIron', 'midIron', 'longIron', 'hybrid', 'wood', 'driver'] },
    { n: 5, name: 'Full play', sessions: ['Play 9 holes', 'Play 9 holes', 'Play 18 holes'], clubs: ['wedge', 'shortIron', 'midIron', 'longIron', 'hybrid', 'wood', 'driver'] },
  ],
  stageRule: 'Whole stage done with no increase in pain and good mechanics before moving up. Every other day, three sessions a week. Flexibility before hitting.',
  mustNotSay: [
    'Anything that names or grades the injury',
    'You are healed, or your arm is ready',
    'Any medical timeline stated as fact',
    'Push through it',
    'Keep your lead arm straight, while PROTECT is on',
    'Any speed or distance target',
    'A force number at the elbow',
    'Treatment advice',
  ],
  sources: ['bochnia_2024', 'jukes_2022', 'mchardy_2007', 'ortho_virginia_interval', 'acei_interval', 'wilk_2002', 'silbernagel_2007', 'hsu_statpearls', 'obrien_2021'],
};

// ---------------------------------------------------------------------------
// Practice science and coaching language (docs/research/06).
// ---------------------------------------------------------------------------

export const PRACTICE = {
  languageRules: [
    'One cue per ball. One fault per session.',
    'Put the cue outside the body where you can: the headcover, the chair, the shadow.',
    'Under 10 words per cue.',
    'Never say "do not". Say the movement you want.',
    'Give the ball count before the drill, and say what done looks like.',
    'Ask "what did that feel like" before giving feedback. Feedback on about one ball in four.',
    'Offer a choice somewhere: which club, which target, which of two drills.',
  ],
  session: [
    { name: 'Warm-up', detail: '5 to 8 minutes. Walk briskly or skip, then arm circles, trunk rotations, hip openers, slow squats. No static stretching before hitting.' },
    { name: 'Club warm-up', detail: '10 to 15 swings with a wedge, no ball. Half swings building to three-quarter. If the lead arm sharpens, the session ends here.' },
    { name: 'Wedge first', detail: '10 to 20 balls. Nine-to-three swings with a wedge at half to three-quarter speed. Always before any full swing.' },
    { name: 'The one drill', detail: '15 to 20 balls in blocks of 5 with rest between. One fault, one cue. Film the first ball and the last, not every ball.' },
    { name: 'Vary it', detail: '10 to 15 balls. Same drill, change the target or the club every few balls.' },
    { name: 'Transfer', detail: '8 to 12 balls, one ball per shot, full routine, random club and target. Play three imaginary holes.' },
    { name: 'Record', detail: 'One last clip from the same angle as the first. One sentence on what changed.' },
  ],
  videoNote: 'Video feedback helps at two weeks and can hurt on the day. Two clips per session is plenty.',
  frequency: 'Every other day. Three sessions a week beat five.',
  sources: ['guadagnoli_lee_2004', 'wulf_su_2007', 'mckay_2024', 'perkins_ceccato_2003', 'porter_magill_2010', 'guadagnoli_2002', 'liao_masters_2001', 'ortho_virginia_interval'],
};

// ---------------------------------------------------------------------------
// Capture protocol and the frame-rate trap (docs/research/04).
// ---------------------------------------------------------------------------

export const CAPTURE = {
  steps: [
    'Highest frame rate you have: Samsung Slow motion at 240 fps, or 120. Not Super Slow-mo, which films a fraction of a second and usually misses the swing.',
    'Tripod or something solid. A handheld phone makes every sway and head reading meaningless.',
    'Face-on: phone directly in front of you, square to the target line, level with the middle of your stance, 3 to 3.7 m away, belt to chest height, aimed at the centre of your body.',
    'Down-the-line: phone on the target line extended behind you, roughly in line with your trail toes, 3 to 3.7 m away, belt to chest height, aimed at your hands.',
    'Whole body in frame with room above the head and below the feet. Check the top of the swing and the finish fit.',
    'Bright, even light with the sun behind the camera. Fitted clothes that contrast with the background.',
    'Start recording before you address the ball and stop after you hold the finish. Three swings, not one, without moving the phone.',
  ],
  slowMotion: 'Samsung Slow motion is saved as a 30 fps file with the action already slowed 8x (240 fps) or 4x (120 fps). The tempo ratio survives that; times in seconds do not, so the app reads the factor from the downswing length and asks you to confirm it.',
  sources: ['samsung_slomo', 'apple_slomo', 'ingwersen_2023', 'cheetham_timing_video'],
};
