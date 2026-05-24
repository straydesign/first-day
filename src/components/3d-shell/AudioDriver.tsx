"use client";

import { useEffect } from "react";
import { getCameraBreathPhase, getCameraForward, getCameraMotion, getCharacterFor, getRoomView, usePulse } from "./RoomRegistry";
import { COSMOS_DOORWAY_DIR } from "./cosmosDoorwayDir";
import { getDayWarmth } from "./timeOfDayIntent";

/**
 * Audio cues at transitions — VISION.md Phase 5 direct quote.
 * Three layered events fired off the room-pulse:
 *   - shatter burst (~300ms): filtered noise — tile percussion when the wall fragments
 *   - dolly rumble (~1.5s):   low sine swell — camera moving through architecture
 *   - assemble chime (~600ms after 1.4s): warm triad — entry-room walls land
 *
 * AudioContext must be unlocked by a user gesture before suspending browsers will
 * actually play anything (Safari + Chrome autoplay policy). We arm a one-shot
 * pointerdown/keydown listener at mount; until that fires we no-op silently.
 *
 * Reduced-motion users get full silence.
 */

let ctx: AudioContext | null = null;
let unlocked = false;
// Module-level dedupe so StrictMode dev-double-mount doesn't double-fire audio.
// (useRef gets a fresh instance on the second StrictMode mount and would re-trigger.)
let lastPulseSeen = -1;

// P2 v77 — UNIFY #9: sustained drone bridges audio into the unified motion field.
// First MODALITY bridge — every prior UNIFY cut (#1–#8) lived inside the visual
// pipeline. v77 wires the audio subsystem to the same motionAmount / cameraForward
// channels that walls, cosmos, floor, lintel, lights, fog, camera already share.
// Single cut consuming BOTH magnitude (gain ← cameraMotion) AND direction
// (pan ← cameraForward.x) — the first node in the field that uses the spatial
// directional channel since v75 introduced it.
//
// 55 Hz sine (sub-rumble, well below the 90–280 Hz pulse rumble band so it doesn't
// mask shatter/chime). Silent at rest (gain ≈ 0.002) so a parked user hears nothing;
// audible during dolly (peak ≈ 0.047) so transit *feels* tactile in the speakers.
// Panned by cameraForward.x: tilting the camera right pushes the drone right.
//
// RAF loop (AudioDriver is outside Canvas, no useFrame) lerps gain and pan toward
// targets at 0.08 smoothing — slow enough to avoid clicks, fast enough to track dolly.
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let dronePanner: StereoPannerNode | null = null;
let droneRAF: number | null = null;

const DRONE_FREQ = 55;
const DRONE_BASE_GAIN = 0.002;
const DRONE_MOTION_AMP = 0.045;
const DRONE_PAN_AMP = 0.7;
const DRONE_LERP = 0.08;
// P3 v96 — UNIFY #28: drone PITCH rises with cameraMotion. SECOND consumer on
// the temporal-frequency axis opened by v95 (lintel breath rate), promoting
// frequency from a one-off into a 2-consumer CATEGORY on its very next cut —
// same categorical-promotion pattern v89 used for color and v87 used for
// polarity. ALSO the second magnitude consumer on the audio substrate (after
// v77 gain), so audio now carries two axes (magnitude + frequency) instead
// of one. Effective frequency = DRONE_FREQ × (1 + camMotion × AUDIO_PITCH_MIX),
// lerped through the same DRONE_LERP smoothing the gain/pan use so pitch
// glides instead of stepping. AUDIO_PITCH_MIX = 0.25 → at rest 55 Hz, at peak
// dolly ~68.75 Hz (≈3.85 semitone rise, a clear minor-third upward tug
// without becoming melodic). Pitch is perceptually exponential, so 0.25
// linear is already a substantial musical event — staying conservative
// relative to v95's LINTEL_BREATH_FREQ_MIX = 0.6 because pitch perception is
// far more sensitive than visual frequency. The pitch-up during dolly mirrors
// the warmer color (v84/v85/v89/v90/v94) and faster lintel breath (v95): the
// whole field rises together when the user transits, falls back to rest
// together when they park. Polarity-locked, axis-coupled, substrate-spanning.
const AUDIO_PITCH_MIX = 0.25;
// P3 v221 — ENVIRONMENTAL source crosses out of the CANVAS substrate for the
// FIRST time across all 10 prior env-source cuts (v211–v220). Two structural
// firsts land in one edit:
//   1) Temporal-frequency axis saturates to 4-substrate breadth (cosmos drift
//      v218 + lintel breath v219 + floor wave v220 + drone pitch v221) —
//      matching the color-axis 4-count (cosmos v211 / atmosphere v212 / lights
//      v213 / walls v214). Two of env-source's three axes now hold ≥4-substrate
//      coverage; only magnitude (3) trails by one.
//   2) Audio becomes the SECOND DOMAIN to host env-source (after canvas), the
//      mirror move to v77 which made audio the first non-canvas consumer of
//      cameraMotion. Env-source has now domain-crossed exactly as cameraMotion
//      did 144 cuts ago — same pattern, same beat: open a source in canvas,
//      saturate the axes, then jump to audio.
// ±6% chosen tighter than v220's ±8% floor wave because pitch perception is
// perceptually exponential — 6% linear is already ≈1 semitone of total swing,
// and pitch must NOT compete with v96's camMotion pitch lift (0–25% linear)
// during dolly transit. The wall-clock baseline shifts the rest pitch slightly
// (51.7 Hz deep night → 58.3 Hz peak afternoon); v96 motion still owns the
// upward TUG. Multiplies into the DRONE_FREQ baseline BEFORE the v96 motion
// factor so the existing DRONE_LERP=0.08 smoothing glides the baseline change
// without clicks.
const DRONE_PITCH_NIGHT_SCALE = 0.94;
const DRONE_PITCH_DAY_SCALE = 1.06;
// P3 v229 — env-source MAGNITUDE axis opens on AUDIO substrate. Before v229
// audio held a single env-source axis (TEMPORAL via v221 drone pitch). All
// other env-source axes (color, magnitude, spatial) lived on canvas + DOM
// substrates only — audio was the sole 1-axis env-source substrate, the
// thinnest leaf in the cube. Drone gain is the perceptual-magnitude analog of
// canvas brightness (v216 lights / v217 cosmos) and DOM brightness (v223): a
// loudness baseline that lifts at day and ducks at night. ±15% swing matches
// the canvas magnitude family (v215 fog reach, v216 light intensity, v217
// cosmos emissive) so all four magnitude substrates share one swing window.
// Multiplies the entire targetGain expression (BASE + MOTION_AMP * camMotion
// * ...) AFTER all cross-field / harmonic / derivative / phase-offset
// carriers — wall-clock is the SLOWEST modulator and rides outermost so it
// stretches the dynamic range of every faster carrier proportionally without
// fighting any of them. Single new const pair, single new scalar, single
// multiplicative term on targetGain. Audio promotes 1-axis → 2-axis
// env-source substrate; magnitude axis breadth ticks 4 → 5 substrates (fog
// reach v215 + lights v216 + cosmos v217 + DOM brightness v223 + AUDIO gain
// v229) — ties color (5) and temporal (5) at the 5-substrate parity mark.
// Three of four env-source axes now at 5-substrate breadth; SPATIAL (4) is
// the lone laggard.
const DRONE_GAIN_NIGHT_SCALE = 0.85;
const DRONE_GAIN_DAY_SCALE = 1.15;
// P3 v110 — UNIFY #42: PROMOTES HARMONIC CONVERGENCE meta-class from a
// 2-substrate visual category (v108 lintel breath + v109 floor wave) into a
// 3-substrate / FIRST NON-VISUAL category. v108 opened harmonic by phase-locking
// a visual consumer's accumulator to the camera's breath phase; v109 confirmed
// it as a category by adding a second visual consumer on the same channel. v110
// extends the SAME PHASE LOCK to the AUDIO substrate — drone tremolo
// (amplitude modulation) whose phase pulls toward getCameraBreathPhase() with
// strength rising with cameraMotion. Mirrors v95→v96 exactly: cross-axis #20
// opened temporal-FREQUENCY with one visual consumer (lintel breath rate), v96
// promoted it to audio (drone pitch). Harmonic follows the same beat:
// v108 opens visual, v109 promotes visual to category, v110 promotes audio.
// At rest cameraMotion=0 → lockStrength=0 AND tremoloDepth gate=0 → drone is
// silent on tremolo (only v77 gain + v96 pitch live). At peak dolly cameraMotion≈1
// → tremoloPhase locks to camera breath AND tremolo modulates gain ±40%, so the
// listener hears the drone "breathe" in sync with the visible lintel + floor
// rhythm. Three substrates beating with the camera, on ONE phase channel.
// TREMOLO_LOCK_STRENGTH=0.5 mirrors Room.tsx HARMONIC_LOCK_STRENGTH exactly —
// meta-class coherence: harmonic reads as ONE property across visual + audio.
// AudioDriver runs in a RAF tick (no useFrame delta), so the lock pull uses
// the existing DRONE_LERP=0.08 per-frame coefficient pattern that gain/pan/freq
// already use, rather than rate-based exp-lerp. Tremolo depth gated on
// camMotion so a parked listener hears flat drone, never AM warble at rest.
const TREMOLO_DEPTH = 0.4;
const TREMOLO_LOCK_STRENGTH = 0.5;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };
    const w = window as WindowWithWebkitAudio;
    const AC = window.AudioContext ?? w.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

function unlockOnGesture() {
  if (unlocked) return;
  const c = ensureCtx();
  if (!c) return;
  if (c.state !== "running") c.resume();
  unlocked = true;
  startDrone(c);
  if (process.env.NODE_ENV !== "production") {
    type WindowWithDebug = Window & { __audio?: AudioContext };
    (window as WindowWithDebug).__audio = c;
  }
}

function startDrone(c: AudioContext) {
  if (droneOsc) return;
  // Respect reduced-motion: drone is part of the motion field, so motion-averse
  // users get silence here just like they get silence on pulse cues.
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.(REDUCED_MOTION_QUERY).matches
  ) {
    return;
  }
  droneOsc = c.createOscillator();
  droneOsc.type = "sine";
  droneOsc.frequency.value = DRONE_FREQ;
  droneGain = c.createGain();
  droneGain.gain.value = DRONE_BASE_GAIN;
  dronePanner = c.createStereoPanner();
  dronePanner.pan.value = 0;
  droneOsc.connect(droneGain);
  droneGain.connect(dronePanner);
  dronePanner.connect(c.destination);
  droneOsc.start();
  let lastGain = DRONE_BASE_GAIN;
  let lastPan = 0;
  // P3 v96 — drone pitch state. Lerp toward target frequency through the same
  // DRONE_LERP smoothing that gain/pan use, so the pitch GLIDES instead of
  // stepping. Setting OscillatorNode.frequency.value directly is the gain/pan
  // idiom — AudioParams accept direct .value writes per-frame.
  let lastFreq = DRONE_FREQ;
  // P3 v110 — tremolo phase accumulator. Locked toward getCameraBreathPhase()
  // with strength = camMotion × TREMOLO_LOCK_STRENGTH each tick. Wrap-around-safe
  // shortest-path lerp mirrors the visual harmonic consumers in Room.tsx
  // (lintel v108, floor v109).
  let tremoloPhase = 0;
  // P3 v189 — META-PIVOT cut #26: accumulator for cross-field × temporal-
  // DERIVATIVE axis. v186/v187/v188 substrate-saturated the cross-field ×
  // harmonic axis (one meta×meta carrier: sin(breathPhase) — a steady
  // oscillation). v189 OPENS a 2ND meta×meta axis on top of the cross-
  // field grid, with a different temporal carrier: d(alignment)/dt — the
  // rate-of-change of the wayfinding scalar. The harmonic carrier breathes
  // (it returns); the derivative carrier PUNCHES (it spikes on motion and
  // decays back). Two structurally distinct temporal modulators above the
  // same lit grid — meta×meta promoted from one-axis to two-axis category.
  let prevDroneAlign = 0;
  const tick = () => {
    const camMotion = getCameraMotion();
    const fwd = getCameraForward();
    const camBreathPhase = getCameraBreathPhase();
    // P3 v221 — env-source wall-clock scalar for drone pitch baseline. Same
    // [0,1] sinusoid as the canvas substrates already use (cosmos v211, fog
    // v212, lights v213, walls v214, atmosphere reach v215, lights intensity
    // v216, cosmos intensity v217, cosmos drift v218, lintel breath v219,
    // floor wave v220). Single read per tick; consumed by targetFreq below.
    const dayWarmth = getDayWarmth();
    const dayPitchScale = DRONE_PITCH_NIGHT_SCALE + (DRONE_PITCH_DAY_SCALE - DRONE_PITCH_NIGHT_SCALE) * dayWarmth;
    const dayGainScale = DRONE_GAIN_NIGHT_SCALE + (DRONE_GAIN_DAY_SCALE - DRONE_GAIN_NIGHT_SCALE) * dayWarmth;
    const tremoloLockStrength = camMotion * TREMOLO_LOCK_STRENGTH;
    if (tremoloLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const rawDiff = camBreathPhase - tremoloPhase;
      const phaseDiff = ((rawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      tremoloPhase += phaseDiff * tremoloLockStrength * DRONE_LERP;
    }
    // Tremolo modulation gates on camMotion so a parked listener hears no AM
    // warble — same gating principle as v77 gain (silent at rest, audible in
    // transit). At peak motion the drone gain swings ±TREMOLO_DEPTH around its
    // v77 target in sync with the camera breath.
    const tremoloMod = 1 + Math.sin(tremoloPhase) * TREMOLO_DEPTH * camMotion;
    // P3 v181 — META-PIVOT cut #28: FIRST AUDIO consumer of the cross-field
    // meta-class — opens audio as the 3rd cross-field domain after canvas
    // and DOM. Pre-v181 the audio substrate consumed motion (v77 gain,
    // v96 pitch, v110 tremolo) and wayfinding (v164 pan) ON SEPARATE
    // PARAMS — never multiplicatively. v181 lands the first POS×POS
    // CROSS-FIELD audio consumer: drone gain rises with motion (v77)
    // AMPLIFIED by forward·doorway alignment when gazing down a doorway.
    //   motion contribution = DRONE_MOTION_AMP × camMotion × (1 + align × 0.5)
    // Listener hears the drone get LOUDER during transits aimed at an
    // open doorway than during transits aimed off-axis. Pairs sonically
    // with v175 cosmos doorway-lane brightness (canvas POS×POS) and
    // v176 DOM letter-spacing (DOM POS×POS) — same POS×POS quadrant now
    // spans canvas + DOM + AUDIO. Cross-field matrix advances 4×2 → 4×3
    // breadth on the POS×POS cell first (canonical opener pattern from
    // v75→v77 motion-field originally crossing visual→audio).
    const _droneDoorwayDot =
      fwd.x * COSMOS_DOORWAY_DIR[0] +
      fwd.y * COSMOS_DOORWAY_DIR[1] +
      fwd.z * COSMOS_DOORWAY_DIR[2];
    const _droneDoorwayAlign = _droneDoorwayDot > 0 ? _droneDoorwayDot : 0;
    const DRONE_DOORWAY_GAIN_BOOST = 0.5;
    // P3 v183 — META-PIVOT cut #30: 3rd cross-field AUDIO consumer —
    // lights the NEG×POS quadrant on the audio matrix. v181 gave audio
    // POS×POS (gain rises with motion AND alignment). v182 gave audio
    // POS×NEG (pitch rises with motion BUT yields on alignment). v183
    // lifts the at-rest base hum when forward aligns with the doorway:
    // motion-NEG × wayfinding-POS. Listener parked facing an open way
    // hears the room "lean forward" — the static substrate carries the
    // wayfinding signal even when the camera is still. Reuses
    // _droneDoorwayAlign from v181 (same RAF tick scope, zero new
    // state). REST_DOORWAY_BASE_BOOST = 1.8 → at rest off-axis hum
    // stays at DRONE_BASE_GAIN (0.002); at rest fully aligned hum
    // climbs to ~0.0056 — audible but still well below transit gain
    // peak (~0.07). Audio matrix coverage now 3/4 polarity quadrants.
    const REST_DOORWAY_BASE_BOOST = 1.8;
    // P3 v186 — META-PIVOT cut #33: FIRST cross-field × harmonic-
    // convergence consumer. The cross-field meta-class reached a
    // saturated 4×3 grid at v185 (12 cells lit across canvas + DOM
    // + audio). v186 opens a NEW MULTIPLICATIVE AXIS above the grid:
    // a saturated cell can itself pulse in tempo with the camera-
    // breath phase. tremoloPhase is already locked to
    // getCameraBreathPhase() via v110 (with gain proportional to
    // camMotion), so it carries the visual breath rhythm into audio
    // for free — reusing it as the harmonic carrier for cross-field
    // is zero new state. The cross-field amplifier itself
    // (_droneDoorwayAlign × DRONE_DOORWAY_GAIN_BOOST in v181) now
    // breathes:
    //   amp = boost × (1 + sin(tremoloPhase) × HARMONIC_DEPTH × camMotion)
    // At rest camMotion=0 → breath factor = 1, v181 cross-field cell
    // is unchanged. At peak transit aligned → cross-field amp swings
    // ±25% in tempo with the visible lintel/floor breath. Listener
    // hears the doorway boost *pulse* in time with the room breath
    // — the cell is no longer a static amplifier, it's a tempo-
    // coupled amplifier. First time meta-class × meta-class.
    const CROSS_FIELD_HARMONIC_DEPTH = 0.25;
    const _crossFieldHarmonic =
      1 + Math.sin(tremoloPhase) * CROSS_FIELD_HARMONIC_DEPTH * camMotion;
    // P3 v193 — META-PIVOT cut #30: 2ND META³ COMPOSITION CELL — promotes
    // meta³ from one-off (v192 DOM contrast) to 2-substrate CATEGORY by
    // crossing into AUDIO. v186 lit this drone gain POS×POS cell with
    // axis-1 (harmonic — _crossFieldHarmonic above). v193 multiplies the
    // SAME cell ALSO by axis-2 (derivative — d(align)/dt). Reuses the
    // outer-scope `prevDroneAlign` accumulator that v189 already writes
    // per tick (v189 pitch cell reads-and-updates at line ~294; v193 reads
    // BEFORE that update, so both cells see the SAME delta this tick — the
    // single derivative carrier feeds two audio cells once). Depth 5 is
    // gentler than v189's 8 because loudness is more perceptually sensitive
    // than pitch and the harmonic factor already swings ±25%. Combined
    // factor: (1 + align × boost × harmonic × derivative) — same 4-factor
    // nested structure as v192 DOM contrast, now on audio drone gain.
    // Meta³ composition is now 2/3 substrates (DOM v192 + audio v193) =
    // CATEGORY by the same promotion arithmetic that made cross-field a
    // category at v89, harmonic at v187, derivative at v190.
    const CROSS_FIELD_GAIN_DERIV_DEPTH = 5;
    const _gainAlignDelta = Math.max(0, _droneDoorwayAlign - prevDroneAlign);
    const _crossFieldGainDeriv =
      1 + _gainAlignDelta * CROSS_FIELD_GAIN_DERIV_DEPTH * camMotion;
    // P3 v198 — META-PIVOT cut #35: 2ND META⁴ COMPOSITION CELL — promotes
    // meta⁴ from one-off (v196 canvas floor POS×NEG yield) to 2-substrate
    // CATEGORY by crossing into AUDIO on the v193 drone gain POS×POS cell.
    // v186 lit this cell with axis-1 (_crossFieldHarmonic). v193 added
    // axis-2 (_crossFieldGainDeriv). v198 adds axis-3 (phase-offset) —
    // the cell now nests cross-field × axis-1 × axis-2 × axis-3 = first
    // audio meta⁴ composition. Phase-offset carrier shape mirrors audio
    // v195's exactly: sin(tremoloPhase + π·(1-doorwayAlign)), wave anti-
    // phase at off-axis, in-phase at fully aligned. Depth 0.2 conservative
    // because this nests INSIDE a yield amplifier that already swings
    // ±25% (harmonic) and spikes 5× on swing-in (derivative). Polarity
    // POS×POS: cell-native (rides motion-POS × align-POS), all four
    // factors collapse harmlessly to 1 at rest or off-axis. Promotes
    // axis-3's promotion arc instance count too — phase-offset is now
    // 3/3 substrates (audio v195 NEG×NEG + canvas v196 POS×NEG + DOM
    // v197 NEG×NEG); v198 adds a 4TH consumer of phase-offset on a NEW
    // polarity quadrant (POS×POS) — first time any meta×meta axis has
    // hit 4-substrate polarity coverage on its own carrier. Two
    // structural products in one edit: (1) meta⁴ category, (2) axis-3
    // polarity expansion beyond saturation.
    const GAIN_PHASE_OFFSET_DEPTH = 0.2;
    const _gainPhaseOffsetCarrier =
      1 + GAIN_PHASE_OFFSET_DEPTH * Math.sin(tremoloPhase + Math.PI * (1 - _droneDoorwayAlign));
    const targetGain =
      (DRONE_BASE_GAIN *
        (1 + (1 - camMotion) * _droneDoorwayAlign * REST_DOORWAY_BASE_BOOST) +
        DRONE_MOTION_AMP *
          camMotion *
          (1 + _droneDoorwayAlign * DRONE_DOORWAY_GAIN_BOOST * _crossFieldHarmonic * _crossFieldGainDeriv * _gainPhaseOffsetCarrier)) *
      tremoloMod *
      dayGainScale;
    // v164 — WAYFINDING crosses into 6th substrate (AUDIO). Drone pan target
    // gains an additive bias from COSMOS_DOORWAY_DIR[0] so at rest the drone
    // is panned toward whichever side of the camera the active room opens.
    // Active at rest, matches v158/v160/v161/v162/v163 wayfinding semantics.
    // Existing DRONE_LERP smoothing in line 172 glides the pan across room
    // transitions — listener hears the drone slide left/right as they walk
    // through doorways even when the camera is stationary. DOORWAY_PAN_AMP
    // (0.55) is smaller than DRONE_PAN_AMP (1.5 effective) so cameraForward
    // remains the dominant pan source during motion; doorway-direction is the
    // at-rest baseline.
    const DOORWAY_PAN_AMP = 0.55;
    const targetPan = Math.max(-1, Math.min(1, fwd.x * DRONE_PAN_AMP + COSMOS_DOORWAY_DIR[0] * DOORWAY_PAN_AMP));
    // P3 v182 — META-PIVOT cut #29: 2nd cross-field AUDIO consumer —
    // PROMOTES audio from one-off (v181) to CATEGORY in the cross-field
    // meta-class. v181 landed POS×POS on drone gain; v182 lands POS×NEG
    // on drone pitch: motion-POS pitch lift YIELDS when camera-forward
    // aligns with the active doorway. Reuses _droneDoorwayAlign from v181
    // (same RAF tick scope). DRONE_PITCH_DOORWAY_YIELD = 0.6 → off-axis
    // dolly retains full pitch lift; doorway-aligned dolly attenuates
    // ~60% so the rumble bows out as the path opens. Pairs sonically with
    // v177 floor amp yield + v179 DOM text-shadow yield (same POS×NEG
    // quadrant on canvas + DOM + AUDIO).
    const DRONE_PITCH_DOORWAY_YIELD = 0.6;
    // P3 v184 — META-PIVOT cut #31: 4th cross-field AUDIO consumer —
    // CLOSES audio polarity matrix 3/4 → 4/4. NEG×NEG quadrant: pitch
    // SINKS when parked AND off-axis from any doorway — the "lost in
    // the room" sound. v181/v182/v183 covered POS×POS, POS×NEG,
    // NEG×POS; v184 lights NEG×NEG, so audio is the first domain in
    // the cross-field meta-class to reach FULL 4-quadrant coverage.
    // Reuses _droneDoorwayAlign from v181 + (1 − camMotion) gating
    // from v183 — zero new state. REST_OFFAXIS_DETUNE = 0.06 → fully
    // parked + fully off-axis pulls freq from 55 Hz to ~51.7 Hz
    // (≈1 semitone drop), a clear pitch sink without crossing into
    // sub-audible territory. As either camMotion or alignment rises,
    // the detune factor decays multiplicatively and the v182 transit
    // pitch lift takes over. Audio matrix: 4/4. Mirrors v178 closing
    // the visual matrix on the same chain.
    const REST_OFFAXIS_DETUNE = 0.06;
    // P3 v195 — META-PIVOT cut #32: OPENS META×META AXIS-3 — cross-field ×
    // PHASE-OFFSET carrier. The 4 prior arc instances (cross-field, harmonic,
    // derivative, meta³) use carriers whose AMPLITUDE varies with cross-field
    // state. Axis-3 is structurally distinct: the WAVE PHASE TIMING ITSELF
    // varies with cross-field state — a free-running sin(phase + K × field)
    // wave whose temporal offset shifts as alignment changes. When fully
    // off-axis, offset = π → carrier inverts (anti-phase); when fully
    // aligned, offset = 0 → carrier rides tremoloPhase directly. So
    // rotating from off-axis to aligned makes the carrier APPEAR to run
    // BACKWARD through a half-cycle. Reads as "shimmer texture" — distinct
    // from harmonic (breath) and derivative (punch). v195 lands on v184's
    // NEG×NEG pitch sink cell (still open on every prior meta×meta axis) so
    // axis-3 opens in an unlit polarity quadrant. Phenomenology: parked +
    // off-axis pitch sink no longer holds a static detune of 0.06 — it
    // FLUTTERS ±50% in tempo with tremoloPhase, with the flutter TIMING
    // PHASE-SHIFTED by alignment. As the user slowly rotates while parked,
    // the shimmer timing inverts. Carrier collapses harmlessly when cell
    // gating goes to 0 (i.e., during motion or alignment). Axis-3 is a
    // ONE-OFF (1/3 substrates); promotion to category needs a 2nd consumer
    // in a different substrate.
    const PHASE_OFFSET_DEPTH = 0.5;
    const _v184PhaseOffsetCarrier =
      1 + PHASE_OFFSET_DEPTH * Math.sin(tremoloPhase + Math.PI * (1 - _droneDoorwayAlign));
    // P3 v189 — META-PIVOT cut #26 (continued): FIRST cross-field ×
    // temporal-DERIVATIVE consumer. Lands on v182's POS×NEG pitch yield
    // cell (a different cross-field cell from v186's POS×POS gain — so
    // the two meta×meta carriers are perceptually separable: gain
    // BREATHES, pitch PUNCHES). _alignDelta is the per-frame positive
    // increase in doorway-alignment — captures only swing-IN to the lane,
    // not swing-out, so the punch is asymmetric (mirrors v172 shake yield
    // gating). DERIV_DEPTH × camMotion gates the punch to transit only:
    // parked listener never hears spurious pitch jumps. Yield deepens
    // momentarily as the user rotates INTO the lane (the lane "grabs" the
    // pitch), then relaxes back to v182's steady yield once aligned —
    // textural signature of arrival.
    const CROSS_FIELD_DERIV_DEPTH = 8;
    const _alignDelta = Math.max(0, _droneDoorwayAlign - prevDroneAlign);
    // v200 — META-PIVOT cut #37: NEG-delta capture (swing-OUT of lane) —
    // structurally novel carrier family. v189/v190/v191/v194 all use POS
    // delta (max(0, current - prev)) — captures swing-INTO alignment.
    // v200 introduces NEG delta (max(0, prev - current)) — captures
    // swing-AWAY from alignment. Read BEFORE prevDroneAlign update on
    // the next line so it uses the SAME old-prev reference as the POS
    // delta in v189 — mutually exclusive (one is 0 when the other is
    // nonzero), shares the same accumulator, zero new state. NEG-delta
    // carrier is the polarity mirror of POS-delta — they cover opposite
    // halves of doorway-alignment temporal change.
    const _alignDeltaNeg = Math.max(0, prevDroneAlign - _droneDoorwayAlign);
    prevDroneAlign = _droneDoorwayAlign;
    const _crossFieldDeriv = 1 + _alignDelta * CROSS_FIELD_DERIV_DEPTH * camMotion;
    // v200 — META-PIVOT cut #37: OPENS 7TH PROMOTION ARC — meta⁴
    // composition on the 4TH POLARITY QUADRANT (NEG×NEG). v184/v195
    // already carried cross-field × axis-3 (phase-offset, _v184PhaseOffset
    // Carrier above). v200 adds axis-1 (harmonic, rest-gated) + axis-2
    // (NEG-delta derivative, rest-gated) to the SAME cell, making the
    // first NEG×NEG meta⁴ composition cell. Together with canvas v196
    // POS×NEG + audio v198 POS×POS + DOM v199 NEG×POS, meta⁴ now lands
    // on 4 polarity quadrants across 3 substrates — opens "meta⁴
    // polarity-quadrant saturation" as a new arc family distinct from
    // the 3-substrate saturation pattern.
    //
    // Polarity invariants. v184 NEG×NEG cell is gated by (1-camMotion) ×
    // (1-_droneDoorwayAlign) outside. Carriers nested inside ride the
    // MOTION polarity dimension of the cell:
    //   - Axis-1 harmonic gates by (1 - camMotion): rest-active.
    //   - Axis-2 derivative uses _alignDeltaNeg (NEG delta) gated by
    //     (1 - camMotion): NEG×NEG axis-2 polarity = swing-OUT of
    //     alignment WHILE parked. Structurally novel — first NEG-delta
    //     consumer. Reads as "the room briefly pulls deeper when the
    //     user rotates AWAY from the doorway while standing still."
    //
    // Depths conservative because cell is `(1 - X)` and X is already
    // a 3-factor product (detune × offset × ...). Total max nested
    // product bounded so X stays < 1: NEG_HARMONIC_DEPTH=0.15 (vs POS
    // axis-1 0.25), NEG_DERIV_DEPTH=2 (vs POS axis-2 5-8) — magnitude
    // budget preserved.
    //
    // TWO structural products in one edit: (1) opens 7th arc (meta⁴
    // NEG×NEG polarity-quadrant coverage starts), (2) introduces NEG-
    // delta axis-2 carrier family (mirror of all prior POS-delta
    // carriers).
    const NEG_HARMONIC_DEPTH = 0.15;
    const NEG_DERIV_DEPTH = 2;
    const _v184Harmonic = 1 + Math.sin(tremoloPhase) * NEG_HARMONIC_DEPTH * (1 - camMotion);
    const _v184DerivNeg = 1 + _alignDeltaNeg * NEG_DERIV_DEPTH * (1 - camMotion);
    const targetFreq =
      DRONE_FREQ * dayPitchScale *
      (1 + camMotion * AUDIO_PITCH_MIX * (1 - _droneDoorwayAlign * DRONE_PITCH_DOORWAY_YIELD * _crossFieldDeriv)) *
      (1 - (1 - camMotion) * (1 - _droneDoorwayAlign) * REST_OFFAXIS_DETUNE * _v184PhaseOffsetCarrier * _v184Harmonic * _v184DerivNeg);
    lastGain += (targetGain - lastGain) * DRONE_LERP;
    lastPan += (targetPan - lastPan) * DRONE_LERP;
    lastFreq += (targetFreq - lastFreq) * DRONE_LERP;
    if (droneGain) droneGain.gain.value = lastGain;
    if (dronePanner) dronePanner.pan.value = lastPan;
    if (droneOsc) droneOsc.frequency.value = lastFreq;
    if (process.env.NODE_ENV !== "production") {
      type WindowWithDrone = Window & {
        __drone?: { gain: number; pan: number; freq: number; camMotion: number; fwdX: number };
      };
      (window as WindowWithDrone).__drone = {
        gain: lastGain,
        pan: lastPan,
        freq: lastFreq,
        camMotion,
        fwdX: fwd.x,
      };
    }
    droneRAF = requestAnimationFrame(tick);
  };
  droneRAF = requestAnimationFrame(tick);
}

// P3 v41 — per-room audio cue character. Each room's RoomCharacter declares
// shatter frequency/gain, rumble frequency/gain, chime root/intervals/gain so
// every transition pulse sounds like the room you're arriving into.
function playShatter(c: AudioContext, t: number, freq: number, gain: number) {
  // 0.3s noise burst through bandpass — tile percussion.
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.3), c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "bandpass";
  filt.frequency.value = freq;
  filt.Q.value = 1.6;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
  src.connect(filt);
  filt.connect(g);
  g.connect(c.destination);
  src.start(t);
  src.stop(t + 0.32);
}

function playRumble(c: AudioContext, t: number, freq: number, gain: number) {
  // 1.5s low sine swell — camera traveling through wall.
  // Sustain (the .04 stretch in the baseline) scales to peak × 0.667.
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.4);
  g.gain.linearRampToValueAtTime(gain * 0.667, t + 1.0);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t);
  osc.stop(t + 1.55);
}

function playChime(
  c: AudioContext,
  t: number,
  root: number,
  intervals: number[],
  gain: number,
) {
  // Warm triad — root × per-room intervals defines the harmonic *quality*
  // of arrival (major / minor / diminished / fanfare-with-octave).
  for (const ratio of intervals) {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = root * ratio;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.65);
  }
}

// P3 v34 — chime delay tracks the IN-room's pulseDuration so the warm triad
// lands the moment the entry-room walls finish assembling, in every room.
// Pre-v34 baseline only used if a room hasn't declared a pulseDuration.
const PULSE_TO_CHIME_DELAY_FALLBACK = 1.4;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function AudioDriver() {
  const { pulse } = usePulse();

  useEffect(() => {
    const onGesture = () => unlockOnGesture();
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
    };
  }, []);

  useEffect(() => {
    if (pulse === lastPulseSeen) return;
    lastPulseSeen = pulse;
    if (pulse === 0) return; // initial state — no transition has fired yet

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.(REDUCED_MOTION_QUERY).matches;
    if (reduced) return;
    if (!unlocked) return;

    const c = ensureCtx();
    if (!c || c.state !== "running") return;
    const now = c.currentTime;
    // IN-room character drives audio — same destination-room lookup pattern as
    // v34 (chime delay) and v40 (camera shake). setRoomView updates state.view
    // before incrementing state.pulse, so by the time this effect runs,
    // getRoomView() returns the room you're arriving into.
    const ch = getCharacterFor(getRoomView());
    playShatter(c, now, ch.audioShatterFreq, ch.audioShatterGain);
    playRumble(c, now + 0.05, ch.audioRumbleFreq, ch.audioRumbleGain);
    const chimeDelay = ch.pulseDuration ?? PULSE_TO_CHIME_DELAY_FALLBACK;
    playChime(c, now + chimeDelay, ch.audioChimeRoot, ch.audioChimeIntervals, ch.audioChimeGain);
    if (process.env.NODE_ENV !== "production") {
      type WindowWithAudioLast = Window & {
        __audioLast?: {
          view: string;
          shatterFreq: number;
          shatterGain: number;
          rumbleFreq: number;
          rumbleGain: number;
          chimeRoot: number;
          chimeIntervals: number[];
          chimeGain: number;
          firedAt: number;
        };
      };
      (window as WindowWithAudioLast).__audioLast = {
        view: getRoomView(),
        shatterFreq: ch.audioShatterFreq,
        shatterGain: ch.audioShatterGain,
        rumbleFreq: ch.audioRumbleFreq,
        rumbleGain: ch.audioRumbleGain,
        chimeRoot: ch.audioChimeRoot,
        chimeIntervals: ch.audioChimeIntervals,
        chimeGain: ch.audioChimeGain,
        firedAt: now,
      };
    }
  }, [pulse]);

  return null;
}
