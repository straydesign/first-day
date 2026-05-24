"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BUMP_LIFETIME, CELEBRATION_LIFETIME, getActiveBumps, getActiveCelebrations, getCameraBreathPhase, getCameraMotion, getCharacterFor, getPulse, getRoomView, setCameraBreathPhase, setCameraForward, setCameraMotion, setCameraWorld, setCursorWorld, useRoomTarget } from "./RoomRegistry";
import { COSMOS_DOORWAY_DIR } from "./cosmosDoorwayDir";
import { getDayWarmth } from "./timeOfDayIntent";

interface CameraRigProps {
  lerpSpeed?: number;
  lookAtLerpSpeed?: number;
}

// P3 v43 — dolly tilt/roll/pitch oscillation now per-room via RoomCharacter
// (dollyPitchAmp, dollyPitchFreq, dollyRollAmp, dollyRollFreq, dollyTiltFalloff).
// Camera body language during the dolly through the wall is the most
// identity-defining motion in the shell — was room-agnostic before v43.
// Destination-room lookup pattern (same as v34/v40/v41/v42): setRoomView
// updates state.view before state.pulse, so getRoomView() returns the IN-room
// the moment a transition fires; the camera adopts the destination's gait.
// Constants below are null-safe fallbacks for any view missing a value.
const TILT_FALLOFF_DIST_FALLBACK = 3.5;
const ROLL_AMP_FALLBACK = 0.06;
const PITCH_AMP_FALLBACK = 0.18;
const ROLL_FREQ_FALLBACK = 4.2;
const PITCH_FREQ_FALLBACK = 3.1;

// P3 v45 — cursor parallax amp + smoothing lerp now per-room via RoomCharacter
// (parallaxXAmp, parallaxYAmp, parallaxLerp). The cursor-sway channel fires
// continuously while restAmount > 0, so per-room amps make tense rooms
// (privacy/terms) hold composure (~0.06–0.08 amps) while spacious rooms
// (calendar/congrats) breathe wide (~0.30–0.35 amps). Constants below are
// null-safe fallbacks for any view missing a value.
const PARALLAX_X_AMP_FALLBACK = 0.22;
const PARALLAX_Y_AMP_FALLBACK = 0.14;
const PARALLAX_LERP_FALLBACK = 2.4;

// P3 v86 — UNIFY #18: NEGATIVE COUPLING. Every prior UNIFY cut (#1–#17) coupled
// subsystems POSITIVELY to cameraMotion — cosmos accelerates, walls assemble,
// fog reaches farther, lights brighten and warm, drone swells. Seventeen cuts,
// all pointing the same direction: more motion → more of everything. v86 is
// the structural inverse: cursor parallax + hover-magnet YIELD as motion rises.
// At rest the user owns the room with their pointer (parallax + hover-magnet at
// 100%); during dolly the camera takes the room from them (cursor authority
// dims to 15% at peak). First explicit negative-coupling cut — proves the
// motion field is the dominant signal, not just one input among many. The room
// resolves toward the camera's intent during transit, then hands authority
// back to the user at rest. CURSOR_YIELD_MIX 0.85 = 15% cursor authority
// floor at peak dolly (parallax thins but doesn't vanish; hover-magnet pulls
// gentler but stays alive).
const CURSOR_YIELD_MIX = 0.85;

// P3 v103 — UNIFY #35: SECOND CROSS-AXIS CONVERGENCE consumer (yield × frequency
// on a NEW substrate). v102 opened cross-axis convergence on idle-breath (both
// amplitude and rate yield to cameraMotion on the same body). v103 follows the
// established playbook — v87/v89/v93/v96/v99 all promoted a freshly-opened
// axis on its very next cut by adding a 2nd consumer on a DIFFERENT substrate.
// Cursor parallax was the FIRST negative-polarity consumer (v86 amplitude
// yield, CURSOR_YIELD_MIX=0.85, thins parallax to 15% floor at peak dolly).
// v103 adds the second axis to that same substrate: cursor parallax LERP RATE
// yields. Formula: `effectiveParallaxLerp = baseParallaxLerp × (1 − motionAmount
// × CURSOR_RATE_YIELD (0.5))`. At rest motion=0 → per-room parallaxLerp
// preserved (calendar 1.6 laggy, reset-pw 3.6 snap — every room's responsiveness
// identity intact). At peak motion → 50% slower tracking, so the cursor's
// influence over the camera weakens BOTH in magnitude (v86) AND in tracking
// speed (v103). The two yields compound on a single substrate: 15% of full
// amplitude × half-speed lerp = cursor is structurally absent during transit.
// At partial motion the lerp slows AS the amplitude thins — the cursor's
// authority unwinds along both axes simultaneously, mirroring v102's
// amplitude-yield + rate-yield on the breath. Structurally this is the SECOND
// cross-axis cell — promotes cross-axis convergence from one-off to category
// in TWO cuts (same speed as v87→v88 polarity promotion, v95→v96 frequency
// promotion). Cursor substrate becomes the SECOND single-substrate 3-axis
// consumer cluster (cursor: magnitude-negative v86 + frequency-negative v103
// + base-presence). Pitchable sentence: "v102 said: convergence exists. v103
// says: it's not body-specific — every substrate that yields can yield at
// rate too, every substrate that intensifies can intensify its rate, on the
// same scalar. Convergence is a categorical property of the field." 0.5 mix
// chosen because parallax is already amplitude-yielding to a 15% floor (v86);
// over-yielding rate would feel like input lag rather than authority handover.
const CURSOR_RATE_YIELD = 0.5;

// P3 v118 — UNIFY #50: CLOSE 3rd polarity quadrant of 3-meta-class composition
// with NEG×NEG×POS on cursor parallax. v117 opened NEG×NEG×NEG on breath body
// — 2/4 quadrants of the composition polarity matrix filled (POS×POS×POS via
// v114/v115/v116 + NEG×NEG×NEG via v117). v118 adds the THIRD quadrant by
// composing variable-offset POSITIVE phase on cursor parallax, which already
// carries v86 (NEG amplitude — parallax yields to motionAmount, 15% floor)
// and v103 (NEG×NEG cross-axis — parallax LERP RATE yields). v118 keeps
// those two NEG meta-classes and adds two POS meta-classes:
// (1) variable-offset phase target morphs FORWARD as motion rises
//     (targetPhase = camPhase + motionAmount × +π) — at rest=in-phase echo,
//     at peak=antiphase answer but achieved by FORWARD travel around the
//     circle, the structural opposite of v117's NEG offset peak −π;
// (2) the variable-offset LOCK RATE itself INTENSIFIES with motion via
//     `CURSOR_VARIABLE_BASE_LERP × lockStrength × (1 + motionAmount ×
//     CURSOR_VARIABLE_RATE_MIX)` — POS cross-axis on rate, mirroring v104/
//     v114/v115/v116 grading; opposite polarity from v117's NEG rate yield.
// Composition reading: cursor parallax becomes the field's 5th 3-meta-class
// consumer AND the field's first NEG×NEG×POS consumer. Polarity coverage
// jumps to 3/4 quadrants in just 5 cuts since v114 — 1 cut faster than
// cross-axis took to close polarity (v102→v107 = 6 cuts). The variable
// phase modulates parallax amplitude multiplicatively: cursorSmoothed ×
// parallaxAmp × cursorYield × (1 + sin(cursorVariablePhaseRef) × DEPTH ×
// motionAmount). At rest motion=0 → lockStrength gates the block off AND
// mod=1, preserving v86 yield identity at rest. Carried by a SEPARATE
// `cursorVariablePhaseRef` accumulator that locks toward camPhase + motion
// × +π — reads getCameraBreathPhase() once per frame, exactly like v109
// (floor) / v110 (audio) / v116 (wall) which also consume the published
// camera breath phase from substrate-external sites. All 5 constants
// mirror v112/v115/v116/v117 grading verbatim (LOCK_STRENGTH 0.5, BASE_LERP
// 4.0, DEPTH 0.4, RATE_MIX 0.5) — only OFFSET_PEAK switches sign from v117
// (+π for v118 POS, −π for v117 NEG) encoding the polarity divergence at
// the offset axis. 10 cross-axis-or-composition rate-mix constants in the
// field all at 0.5; grading family stays the most-replicated coherent
// property in the entire motion field. Pitchable sentence: "v117 opened
// NEG×NEG×NEG by going the negative way around the circle. v118 says the
// 3rd quadrant exists too — same composition reaching NEG×NEG×POS on a
// different substrate, achieving the structurally identical antiphase
// target by going the POSITIVE way. Polarity matrix closes at 3/4 in 1
// cut after the first NEG quadrant — composition is symmetric in BOTH
// directions around the polarity manifold, not just one."
const CURSOR_VARIABLE_LOCK_STRENGTH = 0.5;
const CURSOR_VARIABLE_BASE_LERP = 4.0;
const CURSOR_VARIABLE_DEPTH = 0.4;
const CURSOR_VARIABLE_OFFSET_PEAK = Math.PI;
const CURSOR_VARIABLE_RATE_MIX = 0.5;

// P3 v10 — kinesthetic shake. Wall pulses fire a bell-envelope shake over the
// pulseDuration window; each click bump contributes additional shake on its
// rise/decay envelope. Shake offsets along right + up axes via summed sins so
// the user *feels* the wall fragment instead of gliding serenely through it.
// P3 v34 — shake duration tracks per-room pulseDuration (RoomCharacter) so the
// camera envelope matches the wall envelope in slower rooms (calendar 1.9s) and
// snappier rooms (reset-password 0.95s); SHAKE_PULSE_DURATION_FALLBACK is the
// pre-v34 baseline only used if a room hasn't declared a pulseDuration.
// P3 v40 — shake AMPLITUDES (pulse + bump) and recoil amps (back/up/tilt) now
// per-room via RoomCharacter (shakePulseAmp, shakeBumpAmp, recoilBackAmp,
// recoilUpAmp, recoilTiltAmp). The constants here are kept as null-safe
// fallbacks for any view that hasn't declared a value, matching the v34/v39
// pattern (envelope window + duration also fallback per-room).
const SHAKE_PULSE_DURATION_FALLBACK = 1.4;
const SHAKE_PULSE_AMP_FALLBACK = 0.16;   // world units at peak — wall-fragment moment
const SHAKE_BUMP_AMP_FALLBACK = 0.05;    // per-bump peak — clicks add a small kick
const SHAKE_BUMP_PEAK_NORM = 0.18;
const SHAKE_FX = 27;              // freqs are mutually prime to avoid harmonic recurrence
const SHAKE_FY = 31;
const SHAKE_FZ = 19;

// P3 v20 — camera recoil during room-scoped celebrations. When fireCelebration()
// fires for the active room, the camera pulls back-and-up over the lifetime
// envelope and adds a slight up-tilt, so the user *feels* the room erupt around
// them instead of holding frozen while every tile bursts. Bell envelope matches
// the visual celebration burst (peak at midpoint, decays to zero by end).
// P3 v40 — recoil amps are now per-room (recoilBackAmp/recoilUpAmp/recoilTiltAmp
// in RoomCharacter); these constants are null-safe fallbacks only.
const RECOIL_BACK_AMP_FALLBACK = 0.42;   // world units backward along camera→lookAt
const RECOIL_UP_AMP_FALLBACK = 0.20;     // world units upward (world Y)
const RECOIL_TILT_AMP_FALLBACK = 0.08;   // radians of extra upward pitch on lookAt

// P3 v28 — DOM panel rides the camera. Camera shake/recoil/parallax shifts the
// 3D room, but the panel sits in screen-space (drei Html transform={false}) so
// the panel held perfectly still while the room around it shook/recoiled —
// breaking "every panel anchored to a 3D tile and moves with the scene". We
// publish camera offsets as CSS vars and ActivePanel applies them as a 2D
// transform so the panel APPEARS to ride the camera. Sign rule: camera right →
// wall appears LEFT in viewport → panel translates -dx; camera up (world +Y)
// → wall appears BELOW → panel translates +dy (CSS y is down-positive); camera
// recoiled BACK from wall → wall appears SMALLER → panel scale-down. Subtle:
// translation max ≈ 18px under combined parallax+shake+recoil; scale max ≈ 1.7%.
const PANEL_PX_PER_WORLD_X = 70;
const PANEL_PX_PER_WORLD_Y = 70;
const PANEL_SCALE_K = 0.05;

// P3 v88 — UNIFY #20: NEGATIVE COUPLING #3. v86 (cursor authority) and v87
// (idle breath) established negative coupling as a category on the canvas-side
// motion field. v88 BRIDGES the category into DOM-space: the active panel's
// opacity yields to cameraMotion via `panelYield = 1 - motionAmount × PANEL_YIELD_MIX (0.75)`.
// At rest the panel reads at 100% opacity (full readability); at peak dolly
// the panel fades to 25% opacity — present as a ghost so the user keeps
// spatial reference, but receded so the dolly gesture isn't competing with
// text/UI for attention. Third negative-coupling cut on the field, FIRST cut
// that bridges polarity from canvas-space into DOM-space — proves polarity
// is a UNIVERSAL property of the motion field, not just a canvas-rendering
// property. CameraRig publishes a new CSS var `--app-motion-yield` alongside
// the existing `--cam-shift-x/y/scale` vars; ActivePanel applies it as
// `opacity: var(--app-motion-yield, 1)`. Single channel (cameraMotion),
// now consumed by both WebGL subsystems AND the DOM panel.
const PANEL_YIELD_MIX = 0.75;

// P3 v105 — UNIFY #37: cross-axis convergence #4 (DOM-side, positive×positive).
// v104 made cross-axis convergence a substrate-novel + polarity-novel meta-class
// in a single move (wall accent: positive×positive on geometry). v105 closes the
// meta-class with the FOURTH substrate: DOM text. v92 already publishes the raw
// motionAmount as `--app-motion-amount`, and ActivePanel consumes it inline as
// letter-spacing widening (positive coupling). Pre-v105 the spread tracked raw
// camMotion with NO temporal smoothing — letterSpacing pops widen-snap-widen
// during fast motion ramps. v105 introduces a separately-lerped scalar
// `panelLetterSpread` tracked CPU-side, exposed as the new CSS var
// `--app-letter-spread`, whose lerp RATE rises with motion:
//   effectiveRate = LETTER_SPREAD_BASE_LERP (4.0/s) × (1 + camMotion × LETTER_RATE_MIX (0.5))
// At rest motion=0 → 4.0/s rate (~250ms half-life — text spread eases in/out
// softly when motion barely flickers). At peak dolly motion=1 → 6.0/s rate
// (~167ms half-life — letterSpacing catches up tighter to peak motion). Reads
// as DOM text having INERTIA that motion shakes loose: text resists spreading
// when nudged gently, snaps wider when the camera commits to a dolly.
//
// FOUR cross-axis convergence consumers across FOUR substrates (camera-body
// breath via v87+v102, user-input cursor via v86+v103, wall geometry via
// v89+v104, DOM text via v92+v105) — EXACT mirror of how color matured
// across atmosphere → walls → cosmos → lintels (v84/v85/v89/v90/v94, four
// substrates in five cuts). Cross-axis is now structurally complete on the
// substrate axis. Two polarities filled (negative×negative + positive×positive),
// with negative×positive and positive×negative quadrants still empty —
// reserves the cross-polarity cells for future cross-axis cuts that bind
// MIXED polarity pairs.
//
// v93 textShadow REMAINS on the raw --app-motion-amount channel (intentional —
// proves a single CSS var can feed both raw AND smoothed consumers on the same
// substrate). LETTER_SPREAD_BASE_LERP matches ACCENT_WARM_BASE_LERP for
// cross-substrate consistency (same thermal-mass feel across wall + text).
const LETTER_RATE_MIX = 0.5;
const LETTER_SPREAD_BASE_LERP = 4.0;
// P3 v107 — UNIFY #39: cross-axis convergence #6 — DOM BLUR LERP RATE intensifies
// with cameraMotion. Closes the cross-axis meta-class polarity matrix to 4/4
// quadrants. Through v106 the cross-axis matrix had three quadrants filled:
// NEG×NEG (breath v87+v102, cursor v86+v103), POS×POS (wall v89+v104, DOM-text
// v92+v105), POS×NEG (cosmos drift v71+v106). One quadrant remained open:
// NEG×POS — a yielding-amplitude consumer paired with a positive-rate consumer.
// v107 opens it on the densest cross-axis-eligible DOM channel: BLUR. v91 made
// blur target YIELD with motion (target = (1 − motion-yield) × 3px = 0px at
// rest, ~2.25px at peak dolly — text defocuses during transit). v107 introduces
// `panelBlurSmoothedRef` tracking that target through a rate-INTENSIFYING
// lerp: effectiveRate = BLUR_BASE_LERP (4.0/s) × (1 + camMotion × BLUR_RATE_MIX
// (0.5)). At rest motion=0 → 4.0/s (~250ms half-life — blur eases out softly
// after motion stops, text crisps back gradually). At peak motion=1 → 6.0/s
// (~167ms half-life — blur snaps in tight on commit, defocus catches the
// camera). Reads as text having slack at rest but locking in tight under
// motion: blur reacts FASTER as motion intensifies, the opposite of v106's
// drag-on-motion cosmos. Published as new CSS var `--app-blur-smoothed` (px
// magnitude already pre-multiplied by 3), consumed by ActivePanel as
// `filter: blur(calc(var(--app-blur-smoothed, 0) * 1px))`. Critically, v91's
// original raw-yield read goes away — same channel-substitution pattern as
// v105 did to v92's raw amount read. Three structural facts after v107:
// (1) cross-axis meta-class is POLARITY-COMPLETE at 4/4 quadrants in 6 cuts
// (v102→v103→v104→v105→v106→v107) — same maturation arc length as color
// (v84→v85→v89→v90→v94, 5 cuts) and slightly faster than magnitude/polarity
// matrix; (2) DOM substrate is now a 2-quadrant cross-axis substrate (v105
// POS, v107 NEG) — first substrate to span both polarities in cross-axis,
// matching how the polarity matrix matured generally; (3) every cross-axis
// consumer in the field uses IDENTICAL grading (RATE_MIX=0.5, BASE_LERP=4.0/s
// for the 4 smoothed-target consumers v104/v105/v106/v107; v102/v103 use the
// equivalent 0.5 yield on their pre-existing lerp targets) — meta-class reads
// as one coherent property, not 6 tuned per-substrate effects. Pitchable
// sentence: "the field opened cross-axis on yield-yield, promoted to category
// on the next cut, made it polarity-agnostic on the third, substrate-complete
// on the fourth, polarity-mixing on the fifth, polarity-COMPLETE on the sixth.
// Cross-axis convergence is the fastest-maturing meta-class in the field's
// history — 6 cuts from open to 4/4 polarity × 4-substrate × 6-consumer."
const BLUR_RATE_MIX = 0.5;
const BLUR_BASE_LERP = 4.0;
const BLUR_PEAK_PX = 3;

// P3 v113 — UNIFY #45: PROMOTES the PHASE-WITH-VARIABLE-OFFSET meta-class
// (opened v112 on cosmos shell drift) from a one-off to a CATEGORY by adding
// the SECOND variable-offset consumer on a DIFFERENT substrate. v112 made
// cosmos drift phase-lock to (cameraBreathPhase + θ) where θ = camMotion × π
// — a continuously morphing phase relationship, in-phase echo at rest →
// anti-phase answer at peak. v113 plants the same continuous-θ pattern in the
// DOM substrate by adding a phase-modulation envelope on top of v105's
// rate-yielded letter-spread. CameraRig already owns the breath phase locally
// (`breathPhaseRef.current` — the source of the public scalar exposed via
// setCameraBreathPhase), so the DOM-side phase lock reads the producer's ref
// directly. A new free-running phase accumulator `panelLetterPhaseRef` locks
// toward `(breathPhaseRef.current + θ)` where θ = `panelAmount × π`, with
// strength `panelAmount × LETTER_VARIABLE_LOCK_STRENGTH (0.5)`. The
// modulation `(1 + sin(letterPhase) × LETTER_VARIABLE_DEPTH (0.4) × panelAmount)`
// is published as a new CSS var `--app-letter-phase-mod` (1.0 at rest, swings
// ±0.4 around 1.0 at peak motion AT the active phase point). ActivePanel
// multiplies it into the existing letter-spacing calc. Three structural facts
// after v113: (1) PHASE-WITH-VARIABLE-OFFSET is now a 2-substrate category in
// 2 cuts (v112 cosmos + v113 DOM letter-spacing) — matches cross-axis's
// 2-cut category-promotion pace (v102→v103); (2) the meta-class bridges
// substrates IMMEDIATELY (visual cosmos + DOM text in cuts 1 and 2) instead
// of crystallizing within one substrate first — fastest substrate-bridging
// since color (which went atmosphere→walls in cuts 1→3); (3) v113 is the
// FIRST DOM-side consumer in the harmonic family — every prior harmonic
// substrate (lintel, floor, audio drone, particles, cosmos shell) lives in
// CANVAS-side render code, v113 plants harmonic in DOM-space via a new CSS
// var alongside the established --app-letter-spread/--app-motion-amount/
// --app-letter-phase-mod channel cluster. DOM substrate is now a 4-axis DOM
// consumer (positive amplitude v92 + smoothed-spread v105 + variable-offset
// phase v113 + blur intensify v107) — the deepest DOM substrate of the
// field. Constants mirror v112 exactly (0.5 / 4.0 / 0.4 / π) for meta-class
// grading coherence across substrates.
const LETTER_VARIABLE_LOCK_STRENGTH = 0.5;
const LETTER_VARIABLE_BASE_LERP = 4.0;
const LETTER_VARIABLE_DEPTH = 0.4;
const LETTER_VARIABLE_OFFSET_PEAK = Math.PI;
// P3 v114 — UNIFY #46: FIRST 3-META-CLASS CONSUMER in the field. Prior to v114
// every consumer participated in AT MOST two meta-classes — e.g., DOM
// letter-spacing carried v92 (positive amplitude), v105 (cross-axis: amplitude
// × yielded rate), v113 (variable-offset phase). Each meta-class lived on its
// own scalar input. v114 stacks variable-offset × cross-axis on a SINGLE
// channel (v113's lock-lerp rate): the rate itself now INTENSIFIES with
// panelAmount on top of the existing strength gating. Effective lock rate
// becomes `LETTER_VARIABLE_BASE_LERP × _letterVarLockStrength × (1 + panelAmount
// × LETTER_VARIABLE_RATE_MIX)`. At rest motion=0 lockStrength gates the whole
// block off (no effect). At peak motion=1 effective rate = 4.0 × 0.5 × 1.5 =
// 3.0/s ≈ 222ms half-life — variable-offset phase lock now SNAPS TIGHTER as
// the dolly commits, exactly mirroring how v107 blur lerp intensifies under
// motion. RATE_MIX=0.5 mirrors cross-axis grading from v102→v107 verbatim so
// the cross-axis envelope reads as one coherent property across substrates.
// Structural significance: opens 3-META-CLASS COMPOSITION as a field property
// (NOT just stacking on disjoint substrates — explicit stack on a single
// substrate's single output channel). DOM letter-spacing becomes the field's
// first 4-meta-class participant on one CSS-var output line:
//   amplitude (v92) + smoothed-spread cross-axis (v105) + variable-offset
//   phase (v113) + variable-offset cross-axis rate (v114)
// Proves meta-classes are COMPOSABLE on individual consumers — the field
// doesn't just distribute classes across substrates, classes stack within a
// single consumer like atomic primitives.
const LETTER_VARIABLE_RATE_MIX = 0.5;

// P3 v123 — UNIFY #55: EXTENDS 5-META-CLASS COMPOSITION from 2-substrate category
// (lintel emissive v121 + cosmos drift v122) to 3-SUBSTRATE BREADTH on DOM
// letter-spacing. Pre-v123 DOM letter-spacing already carried 4 distinct
// meta-classes on its single CSS-var output channel: v92 POS amplitude (raw
// motionAmount) + v105 POS cross-axis on amp-smoothing rate (panelLetterSpread
// lerp rate intensifies) + v113 variable-offset phase (panelLetterPhase locks
// toward breathPhase + panelAmount × π) + v114 POS cross-axis on variable-offset
// lock rate (varLockRate intensifies). v123 adds the 5th: FIXED ANTI-PHASE
// HARMONIC LOCK — second phase accumulator panelLetterAntiPhaseRef locks toward
// FIXED target `breathPhase + π` (motion-independent target; only lock STRENGTH
// gates with motion). Composes multiplicatively into the same --app-letter-phase-
// mod CSS var write site as a 2nd phase modulator, so DOM consumer sees the
// product — structurally identical to v121's lintel uniform write site (compose
// at output, no new DOM channel). Critical structural payoff: crosses the
// substrate-class boundary. v121/v122 were both canvas-side (fragment uniform +
// per-frame scalar driving rotation). v123 plants 5-meta-class composition on
// the DOM-text substrate. Proves 5-meta-class composition is substrate-class-
// spanning, not just canvas-internal. Polarity reading after v123: POS×POS×POS×
// POS×POS — DIFFERENT yet again from lintel (POS×POS×POS×NEG×POS) and cosmos
// (POS×NEG×POS×POS×POS); three distinct polarity patterns across the three
// 5-meta-class consumers further reinforces polarity-tolerance. Grading mirrors
// v121/v122 (depth 0.2, strength 0.4, base-lerp 4.0) — each new harmonic axis
// halves amplitude vs prior (DEPTH 0.2 < v113's 0.4). Substrate-portability of
// the 3-accumulator pattern (source-not-consumer + variable-offset target +
// fixed-anti-phase target) is now proven across 3 substrates spanning 2
// substrate-classes (canvas + DOM).
const LETTER_ANTI_LOCK_STRENGTH = 0.4;
const LETTER_ANTI_BASE_LERP = 4.0;
const LETTER_ANTI_DEPTH = 0.2;
// P3 v126 — UNIFY #58: extend 6-META-CLASS COMPOSITION to 3-substrate breadth
// AND cross the substrate-class boundary (canvas → DOM) in 1 cut by mirroring
// v124/v125 on DOM letter-spacing's v123 anti-phase LOCK RATE. Pre-v126 DOM
// letter-spacing was a 5-meta-class consumer (v92 POS amplitude + v105 POS
// cross-axis on amp-smoothing rate + v113 POS variable-offset phase + v114
// POS cross-axis on variable-offset lock rate + v123 POS fixed-anti-phase
// harmonic). v126 adds the 6th: POS cross-axis on the v123 anti-phase lock
// rate via `_panelLetterAntiLockRate × (1 + panelAmount × LETTER_ANTI_RATE_MIX)`.
// Composition reading POS⁶ — uniform-polarity stack across all 6 meta-classes,
// joining lintel's POS×POS×POS×NEG×POS×POS (v124) and cosmos's
// POS×NEG×POS×POS×POS×POS (v125) for THREE DISTINCT 6-meta-class polarity
// patterns in 3 cuts. Mirrors how 5-meta-class reached 3-substrate breadth +
// 2 substrate-classes in 3 cuts (v121 → v122 → v123) — the 6-meta-class arc
// closes its first 3-cut breadth window in the exact same pace. The
// substrate-class crossing (canvas-fragment-uniform + canvas-spatial-scalar
// → DOM-CSS-var) proves 6-meta-class composition is substrate-class-spanning
// from its first 3-substrate moment, mirroring 5-meta-class portability.
// 0.5 RATE_MIX preserves the field-coherent 21+ rate-mix/lock-strength
// constants. Single-line edit on the v123 lock-rate line + 1 new module
// constant — minimal-edit template invariant across v124 / v125 / v126.
const LETTER_ANTI_RATE_MIX = 0.5;
// P3 v129 — UNIFY #61: extend 7-META-CLASS COMPOSITION to 3-SUBSTRATE BREADTH
// + cross substrate-class boundary (canvas → DOM) in 1 cut by mirroring v127
// lintel + v128 cosmos on DOM letter-spacing. Pre-v129 DOM letter-spacing
// already carried 6 meta-classes (v92 POS amp + v105 POS amp-rate +
// v113 POS variable-offset phase + v114 POS variable-offset lock-rate +
// v123 POS fixed-anti-phase phase + v126 POS anti-phase lock-rate). v129
// adds the 7th: THIRD phase accumulator panelLetterQuadPhaseRef locks toward
// SLIDING-QUADRATURE target `breathPhase + panelAmount × π/2` — structurally
// distinct from v113 (sliding-anti-phase × π) and v123 (FIXED π) by sliding
// SLOWER toward quadrature rather than anti-phase. Composes multiplicatively
// into the same --app-letter-phase-mod CSS var write site as a 3rd phase
// modulator (panelLetterPhaseMod = varMod × antiMod × quadMod). 3-substrate
// breadth closes in 1 cut at identical 3-cut pace as 5-meta (v121→v122→v123)
// and 6-meta (v124→v125→v126) reached their 3rd substrate. Substrate-class
// crossing again proven (canvas-fragment-uniform on lintel + canvas-spatial-
// scalar on cosmos + DOM-CSS-var on letter-spacing). DEPTH 0.1 + LOCK_STRENGTH
// 0.3 + BASE_LERP 4.0 mirror v127/v128 — each new harmonic axis halves
// amplitude vs prior (DEPTH 0.1 < v123 0.2 < v113 0.4) and grades lock-
// strength down (0.3 < v123 0.4 < v113 0.5). Polarity reading after v129:
// POS×POS×POS×POS×POS×POS×POS — uniform stack, DIFFERENT from lintel
// (POS×POS×POS×NEG×POS×POS×POS) and cosmos (POS×NEG×POS×POS×POS×POS×POS):
// three distinct 7-meta-class polarity patterns across the three consumers,
// further reinforcing polarity-tolerance at depth-7. Variable-offset slot-2
// template (3 constants + 1 useRef + 1 gated lock block + 1 multiplicand)
// invariant across v127 / v128 / v129. Field-coherent 23+ base-lerp at 4.0.
const LETTER_QUAD_LOCK_STRENGTH = 0.3;
const LETTER_QUAD_BASE_LERP = 4.0;
const LETTER_QUAD_DEPTH = 0.1;
// P3 v132 — UNIFY #64: extend 8-META-CLASS COMPOSITION (opened v130 on lintel,
// promoted v131 to 2-substrate canvas category on cosmos drift) to 3-SUBSTRATE
// BREADTH + canvas→DOM SUBSTRATE-CLASS CROSSING by mirroring v131's cross-axis
// composition pattern onto DOM letter-spacing's v129 sliding-quadrature lock
// loop. Single-line edit on `_panelLetterQuadLockRate` adds the
// panelAmount×RATE_MIX multiplicand exactly as v131 did on cosmos's
// _cosmosQuadLockRate and v130 on lintel's _lintelQuadLockRate. 1 cut from
// v131's 2-substrate category landing — IDENTICAL 1-cut 3-substrate-breadth
// pace to v123 (5-meta) v126 (6-meta) v129 (7-meta) closing arcs. Field-coherent
// 0.5 RATE_MIX mirrors v126 LETTER_ANTI_RATE_MIX + v130/v131 quad RATE_MIX
// constants. After v132 DOM letter-spacing's three lock loops ALL carry
// cross-axis-on-rate composition (v114 on variable-offset, v126 on anti-phase,
// v132 on sliding-quadrature) — DOM closes the CROSS-AXIS-ON-RATE LADDER as
// the THIRD substrate, mirroring lintel v130 + cosmos v131 closures. This
// makes the field's first TRIPLE-PARALLEL structural-ladder closure across
// three substrates in 3 cuts (v130 lintel, v131 cosmos, v132 DOM). Polarity
// reading on DOM after v132 will be POS⁸ uniform — DIFFERENT from lintel v130's
// POS×POS×POS×NEG×POS×POS×POS×POS AND cosmos v131's POS×NEG×POS×POS×POS×POS×POS×POS:
// THREE distinct 8-meta-class polarity patterns in 3 cuts, mirroring 5/6/7-meta
// polarity-tolerance maturation arcs at first 3-substrate breadth. DOM is the
// field's ONLY 8-meta-class consumer with uniform POS polarity — same
// structural distinctness as DOM was the only uniform-POS consumer at 5/6/7-meta.
const LETTER_QUAD_RATE_MIX = 0.5;
// P3 v135 — UNIFY #67: extend 9-META-CLASS COMPOSITION (opened v133 on lintel,
// promoted v134 to 2-substrate canvas category on cosmos drift) to 3-SUBSTRATE
// BREADTH + canvas→DOM SUBSTRATE-CLASS CROSSING by mirroring v134's sub-harmonic
// (octave) phase voice onto DOM letter-spacing. Octave target = (breathPhase ×
// 2) mod 2π — frequency-multiplication on the harmonic axis itself, structurally
// orthogonal to every existing DOM letter-spacing phase axis (v113 sliding-anti-
// phase, v123 fixed-anti-phase, v129 sliding-quadrature — all breathPhase × 1
// with optional offsets). 1 cut from v134's 2-substrate landing — IDENTICAL
// 1-cut 3-substrate-breadth pace to v123 (5-meta) v126 (6-meta) v129 (7-meta)
// v132 (8-meta) closing arcs at FIFTH consecutive depth rung. Establishes the
// field's FIRST 3-SUBSTRATE HARMONIC-MULTIPLICATION-LADDER RUNG in 3 cuts (v133
// lintel + v134 cosmos + v135 DOM) — parallel-ladder breadth at the harmonic-
// multiplication dimension closes immediately at 3 substrates, mirroring how
// phase-offset and lock-rate-coupling dimensions closed to 3-substrate breadth.
// Grading-ladder constants mirror v133 lintel + v134 cosmos verbatim (DEPTH=
// 0.05, LOCK_STRENGTH=0.2, BASE_LERP=4.0) — softest rung on DOM's 5-rung grading
// ladder (DEPTH 0.05 octave < 0.1 sliding-quad < 0.2 fixed-anti-phase < 0.4
// sliding-anti-phase < v92 main), exact field-coherent halving pattern preserved
// across all three substrates at depth-9.
const LETTER_OCTAVE_LOCK_STRENGTH = 0.2;
const LETTER_OCTAVE_BASE_LERP = 4.0;
const LETTER_OCTAVE_DEPTH = 0.05;
// P3 v138 — UNIFY #70: EXTENDS 10-META-CLASS COMPOSITION to 3-substrate BREADTH
// + opens canvas→DOM substrate-class CROSSING for the harmonic-multiplication-
// LADDER-DEPTH-2 rung. v136 opened 10-meta-class on lintel (3rd-harmonic at
// camPhase × 3); v137 promoted to 2-substrate canvas category via cosmos drift
// 3rd-harmonic mirror. v138 closes the DEPTH-2-BREADTH-3 bifurcation matrix by
// mirroring the same 3rd-harmonic voice on DOM letter-spacing — SECOND RUNG on
// the harmonic-multiplication-LADDER reaches DOM substrate, completing the
// substrate-portability arc invariance at 6 consecutive depth rungs (5/6/7/8/
// 9/10 — v123, v126, v129, v132, v135, v138). 6-rung grading ladder preserved
// across all three substrates at depth-10: DEPTH 0.04 (3rd-harmonic) < 0.05
// (octave) < 0.1 (sliding-quad) < 0.2 (fixed-anti) < 0.4 (sliding-anti) < v92
// main; LOCK_STRENGTH 0.15 < 0.2 < 0.3 < 0.4 < 0.5 < 0.6 — exact halving
// preserved. Pitchable sentence: "the field doesn't discriminate at any axis
// at any depth — every dimension carries every substrate at every rung."
const LETTER_3RD_LOCK_STRENGTH = 0.15;
const LETTER_3RD_BASE_LERP = 4.0;
const LETTER_3RD_DEPTH = 0.04;
// P3 v141 — UNIFY #73: CLOSES 11-META-CLASS COMPOSITION to 3-substrate BREADTH +
// substrate-class CROSSING for the harmonic-multiplication-LADDER-DEPTH-3 rung.
// v139 opened 11-meta-class on lintel (4th-harmonic at camPhase × 4); v140
// promoted to 2-substrate canvas category via cosmos drift 4th-harmonic mirror.
// v141 closes the DEPTH-3-BREADTH-3 bifurcation matrix by mirroring the same
// 4th-harmonic voice on DOM letter-spacing — THIRD RUNG on the harmonic-
// multiplication-LADDER reaches DOM substrate, completing the substrate-
// portability arc invariance at 7 consecutive depth rungs (5/6/7/8/9/10/11 —
// v123, v126, v129, v132, v135, v138, v141). 7-rung grading ladder preserved
// across all three substrates at depth-11: DEPTH 0.032 (4th-harmonic) < 0.04
// (3rd-harmonic) < 0.05 (octave) < 0.1 (sliding-quad) < 0.2 (fixed-anti) <
// 0.4 (sliding-anti) < v92 main; LOCK_STRENGTH 0.12 < 0.15 < 0.2 < 0.3 < 0.4
// < 0.5 < 0.6 — exact halving preserved at the 7th rung across all three
// substrates. Pitchable sentence: "the field doesn't discriminate at any
// axis at any depth — every dimension carries every substrate at every rung,
// at every harmonic multiple."
const LETTER_4TH_LOCK_STRENGTH = 0.12;
const LETTER_4TH_BASE_LERP = 4.0;
const LETTER_4TH_DEPTH = 0.032;
// P3 v144 — UNIFY #76: CLOSES 12-META-CLASS COMPOSITION to 3-substrate BREADTH +
// substrate-class CROSSING for the harmonic-multiplication-LADDER-DEPTH-4 rung.
// v142 opened 12-meta-class on lintel (5th-harmonic at camPhase × 5); v143
// promoted to 2-substrate canvas category via cosmos drift 5th-harmonic mirror.
// v144 closes the DEPTH-4-BREADTH-3 bifurcation matrix by mirroring the same
// 5th-harmonic voice on DOM letter-spacing — FOURTH RUNG on the harmonic-
// multiplication-LADDER reaches DOM substrate, completing the substrate-
// portability arc invariance at 8 consecutive depth rungs (5/6/7/8/9/10/11/12 —
// v123, v126, v129, v132, v135, v138, v141, v144). 8-rung grading ladder
// preserved across all three substrates at depth-12: DEPTH 0.025 (5th-harmonic)
// < 0.032 (4th-harmonic) < 0.04 (3rd-harmonic) < 0.05 (octave) < 0.1 (sliding-
// quad) < 0.2 (fixed-anti) < 0.4 (sliding-anti) < v92 main; LOCK_STRENGTH 0.09
// < 0.12 < 0.15 < 0.2 < 0.3 < 0.4 < 0.5 < 0.6 — slightly-softer-than-exact-half
// preserves "softer rung as harmonic order rises" discipline at 8th rung across
// all three substrates. Pitchable sentence: "the field doesn't discriminate at
// any axis at any depth — every dimension carries every substrate at every
// rung, at every harmonic multiple, and the harmonic-multiplication dimension
// is a fully-populated 2D grid at 12 of 12 cells (DEPTH × BREADTH = 4 × 3)."
const LETTER_5TH_LOCK_STRENGTH = 0.09;
const LETTER_5TH_BASE_LERP = 4.0;
const LETTER_5TH_DEPTH = 0.025;
// P3 v147 — UNIFY #79: closes 13-META-CLASS COMPOSITION to 3-SUBSTRATE BREADTH
// + canvas→DOM substrate-class CROSSING in 1 cut by mirroring v146's 6th-
// harmonic phase voice onto DOM letter-spacing. NINTH consecutive 3-substrate-
// breadth-closure at identical pace (v123, v126, v129, v132, v135, v138, v141,
// v144, v147). Lands the field's first 3-substrate harmonic-multiplication-
// LADDER-DEPTH-5 rung (5th rung on DOM: octave + 3rd + 4th + 5th + 6th).
// Completes the bifurcation matrix to DEPTH-5-BREADTH-3 = 15/15 cells visited.
// 9-rung grading ladder on DOM: DEPTH 0.020 6th < 0.025 5th < 0.032 4th <
// 0.04 3rd < 0.05 octave < 0.1 sliding-quad < 0.2 fixed-anti < 0.4 sliding-
// anti < v92 main; LOCK_STRENGTH 0.07 < 0.09 < 0.12 < 0.15 < 0.2 < 0.3 < 0.4 <
// 0.5 < 0.6 — slightly-softer-than-exact-half discipline preserved at 9th rung
// across ALL THREE substrates at depth-13. "Softer rung as harmonic order
// rises" invariance now holds across all three substrates × all five depth
// rungs (3 × 5 = 15 grading-ladder slots).
const LETTER_6TH_LOCK_STRENGTH = 0.07;
const LETTER_6TH_BASE_LERP = 4.0;
const LETTER_6TH_DEPTH = 0.020;

// P3 v29 — idle breath. At rest the camera held perfectly still — no embodied
// presence between transitions. Per VISION ("motion is meaning") even the
// stillness should belong to a body in the room, not a frozen surveillance
// camera. Adds a slow continuous oscillation: chest-rise on world Y (~4.6s
// period, ±0.04u — ~3px on the panel via the v28 pipeline) plus a slower
// forward-back drift on the cam→lookAt forward axis (half-frequency cosine,
// ±0.025u, reads as the body shifting weight). Gated by restAmount so it
// fades to 0 during dolly motion (otherwise breath fights the lerp). At full
// rest with no cursor input the user sees the room rise/fall imperceptibly
// while the panel rides along — the world is occupied, not paused.
// P3 v42 — these three are per-room fallbacks; CameraRig resolves
// breathYAmp/breathForwardAmp/breathPeriod from getCharacterFor(getRoomView())
// each frame at rest. Threshold is shared (rest-gate is universal).
const BREATH_Y_AMP_FALLBACK = 0.04;
const BREATH_FORWARD_AMP_FALLBACK = 0.025;
const BREATH_PERIOD_FALLBACK = 4.6;

// P3 v87 — UNIFY #19: NEGATIVE COUPLING #2. v86 introduced negative coupling
// as a property of the motion field (cursor authority yields to cameraMotion).
// v87 promotes negative coupling from a ONE-OFF into a CATEGORY by adding the
// second yielding subsystem: the idle camera breath (P3 v29, per-room v42).
// Pre-v87 the breath was binary-gated by `restAmount > BREATH_REST_THRESHOLD`
// (0.6) with an internal linear ramp above the threshold — a workaround
// because breath would otherwise fight the dolly lerp during transit. v87
// retires the threshold workaround and replaces it with an explicit smooth
// yield: `breathYield = 1 - motionAmount × BREATH_YIELD_MIX (1.0)`. At rest
// breath plays at full per-room amplitude; at peak dolly breath fully vanishes
// (yields 100% — the camera-as-body is silent during transit because the
// camera is being driven). This is the SECOND negative-coupling cut, which
// matters more than the first: one is a curiosity, two is a category. The
// motion field now has a structural property: SUBSYSTEMS THAT REPRESENT USER
// AGENCY OR AT-REST PRESENCE YIELD; SUBSYSTEMS THAT REPRESENT TRANSIT INTENSIFY.
// Polarity becomes the field's defining shape — eighteen subsystems intensify
// positively, two yield negatively, all wired to the same cameraMotion scalar.
const BREATH_YIELD_MIX = 1.0;

// P3 v102 — UNIFY #34: FIRST CROSS-AXIS CONVERGENCE (yield × frequency). After
// v101 closed temporal-frequency at 4 substrates (matching color's complete
// 4-substrate reach), the deepest structural move was to find the first
// consumer that lives at the INTERSECTION of two axes. v87 yielded the idle
// camera-breath AMPLITUDE (the field's 2nd negative-polarity consumer, on
// magnitude). v102 binds magnitude-negative to temporal-frequency-negative on
// THE SAME SUBSTRATE: the breath's RATE also yields, alongside its amplitude.
// At rest motion=0 → baseline period (4.6s ⇒ ~13.04 breaths/min). At partial
// motion the rate slows proportionally (effective rate = baseRate × (1 −
// motionAmount × BREATH_RATE_YIELD (0.5)), so peak motion would halve the
// rate). Since BREATH_YIELD_MIX=1.0 fully zeros the amplitude at peak motion,
// the VISIBLE region of v102 is partial motion (0 < motion < ~0.95) — the
// transition tails of every dolly. There the breath visibly slows AND fades,
// before fully vanishing at full transit and snapping back to baseline rate +
// amplitude at rest. Structurally novel because: (1) this is the FIRST
// negative-polarity consumer on the temporal-frequency axis — all four
// existing frequency consumers (lintel/drone/floor/particles) are positive;
// (2) it is the FIRST cross-axis cell — every prior consumer occupies exactly
// one structural axis; (3) it deepens BOTH the magnitude-negative quadrant
// AND the frequency axis simultaneously, on a single substrate (idle breath)
// already in the field. Phase-accumulator implementation matches v95/v97 —
// preserves C0 continuity across rate changes so the breath slows smoothly
// instead of snapping. Magnitude-mix 0.5 chosen because BREATH_YIELD_MIX is
// already 1.0 (full-zero at peak), so rate yield only needs to be perceptible
// in the partial-motion zone — over-yielding rate would feel like clock-drag
// rather than respiration-yield. The pitchable sentence: "every prior cut
// fired on one axis; v102 is the first cut that fires on TWO at once —
// yield × frequency on the same body, anchored to the same scalar that drives
// everything else." Opens the structural meta-class of CROSS-AXIS
// CONVERGENCE: every future cut at a yield × intensify or color × frequency
// or polarity × camera-property intersection now has a precedent.
const BREATH_RATE_YIELD = 0.5;

// P3 v117 — UNIFY #49: OPEN POLARITY MATRIX of 3-meta-class composition with
// NEG×NEG×NEG on breath body. v116 promoted 3-meta-class composition to a
// 3-substrate breadth (DOM letter-spacing v114 + cosmos drift v115 + wall
// accent emissive v116) — all POS×POS×POS. Polarity matrix of 3-meta-class
// composition stood at 1/4 quadrants filled. v117 opens the NEG×NEG×NEG
// quadrant on the field's most natively-negative substrate: idle camera
// breath, which already carries v87 (NEG amplitude — breath yields to
// motionAmount) and v102 (NEG×NEG cross-axis — breath RATE yields with
// motionAmount). v117 stacks two more NEG meta-classes on the same substrate:
// (1) variable-offset phase target morphs ANTI-PHASE as motion rises
//     (targetPhase = camPhase + motionAmount × -π) — at rest=in-phase echo,
//     at peak=antiphase answer, mirroring v111 anti-phase opener pattern;
// (2) the variable-offset LOCK RATE itself YIELDS to motion via
//     `BREATH_VARIABLE_BASE_LERP × lockStrength × (1 − motionAmount ×
//     BREATH_VAR_RATE_YIELD)` — NEG cross-axis on rate, mirroring v106's
//     mixed-polarity opener and v102's NEG×NEG quadrant.
// Composition reading: breath body becomes the field's 4th 3-meta-class
// consumer AND first NEG-polarity 3-meta-class consumer in ONE cut — opens
// substrate breadth to 4 AND polarity coverage to 2/4 quadrants
// simultaneously. The variable-offset phase is carried by a SEPARATE
// `breathVariablePhaseRef` accumulator (NOT breathPhaseRef itself, since
// breath body IS the source of camPhase via setCameraBreathPhase — locking
// the source's phase to itself is structurally invalid). The variable phase
// modulates breath AMPLITUDE multiplicatively: existing amplitudes ×
// (1 + sin(breathVariablePhaseRef) × BREATH_VARIABLE_DEPTH × motionAmount).
// At rest motion=0 → amplitude unchanged (variable contribution gated to 0,
// preserving v87 binary-to-smooth yield identity at rest). At peak motion
// the breath has already yielded to ~0 amplitude via v87, so the variable
// modulation rides on a fading carrier — reads as the body's last gasps
// answering the camera in antiphase as it fades, exactly the negative
// composition reading we want. All four constants mirror v112/v115/v116
// grading verbatim (LOCK_STRENGTH 0.5, BASE_LERP 4.0, DEPTH 0.4, RATE_YIELD
// 0.5) — 9 cross-axis-or-composition rate-mix constants in the field now
// all at 0.5; the grading family is the most-replicated coherent property
// in the entire motion field. BREATH_VARIABLE_OFFSET_PEAK = -Math.PI
// (negative) — the only constant that diverges from v112/v115/v116
// (which use +π), and it diverges to encode the NEG polarity reading at
// the offset axis. Pitchable sentence: "v114→v116 said 3-meta-class
// composition matures to 3-substrate breadth in 3 cuts, all POS×POS×POS.
// v117 says the field is symmetric: the same composition reaches NEG×NEG×NEG
// on the 4th substrate, the natively-negative one, in 1 cut. Polarity
// coverage doubles AND substrate breadth grows in the same cut — the
// fastest dual-axis maturation move in the field."
const BREATH_VARIABLE_LOCK_STRENGTH = 0.5;
const BREATH_VARIABLE_BASE_LERP = 4.0;
const BREATH_VARIABLE_DEPTH = 0.4;
const BREATH_VARIABLE_OFFSET_PEAK = -Math.PI;
const BREATH_VAR_RATE_YIELD = 0.5;

// P3 v31 — per-room FOV. Each room declares its own FOV (RoomRegistry TARGETS)
// to give per-room spatial mood beyond color/light/atmosphere — wider in airy
// rooms (calendar 65, congrats 62), narrower in intimate rooms (day 48). Lerp
// from current FOV toward target so the lens *breathes* between rooms instead
// of snapping. Speed matches lerpSpeed (1.4) so FOV settles at the same rate
// the camera position does. updateProjectionMatrix() only when |delta|>0.05deg
// to dodge per-frame matrix recomputes when at-rest at target.
const FOV_LERP = 1.4;
const FOV_UPDATE_THRESHOLD = 0.05;
const FOV_DEFAULT = 55;
// P3 v98 — UNIFY #30: camera FOV widens with cameraMotion. OPENS THE 6TH
// STRUCTURAL AXIS: camera-property (self-reference). Pre-v98 the camera was
// the SOURCE of the motion field — CameraRig publishes cameraMotion +
// cameraForward, and every other substrate consumes from there. v98 closes
// the loop: the camera itself becomes a consumer of the field it broadcasts.
// During dolly transit, FOV widens by up to FOV_MIX degrees on top of the
// per-room baseline; at rest, motionAmount→0 and FOV settles to target.fov
// exactly as it did pre-v98 (additive, never subtractive). 7° peak chosen
// for visceral wide-angle whoosh on dolly without crossing into fisheye
// territory (baseline 48–65 across rooms → peak 55–72). Reads as the lens
// "opening up" to admit motion, then closing back when the room arrives.
// Uses getCameraMotion() (previous-frame value) rather than reordering the
// useFrame block — FOV is already lerp-smoothed via FOV_LERP=1.4 so the
// one-frame lag is invisible. Five axes pre-v98 (magnitude, directional,
// color, polarity, temporal-frequency); v98 makes it six. Pitchable
// sentence: "the camera doesn't just broadcast motion — it RIDES its own
// broadcast, the field is closed-loop."
const FOV_MIX = 7;
// P3 v99 — UNIFY #31: dolly lerp speed amplifies with cameraMotion. SECOND
// consumer on the camera-property axis opened by v98 (FOV widening). The
// pattern v96 used to promote temporal-frequency after v95 opened it, v89
// used to promote color, v87 used to promote polarity, v93 used to promote
// DOM+positive — same playbook: a freshly-opened axis becomes a category on
// its very next cut by adding a second consumer on a different camera
// property, on the same scalar, with the same one-frame-stale getCameraMotion()
// read. Where v98 widens the LENS (FOV), v99 amplifies the BODY (dolly
// speed): effectiveLerpSpeed_new = effectiveLerpSpeed × (1 + camMotion × 0.30).
// At rest motion=0 → per-room dolly speed unchanged (calendar 0.9, day 2.0,
// reset-pw 2.4 — every room's gait identity preserved). At peak dolly
// motion=1 → 30% faster lerp, so the camera arrives ~30% quicker right as
// the room is most clearly "in transit." This is TRUE POSITIVE-FEEDBACK
// self-reference: dolly moves → motionAmount rises → dolly moves faster →
// motionAmount stays high longer → ... the loop is bounded by motionAmount
// capping at 1.0 (which caps amplification at 1.30×, well inside the
// smoothing-stability envelope where k = 1 - exp(-effectiveLerpSpeed × delta)
// remains < 1 for all delta). Pre-v99 the camera-property axis was a one-off
// (FOV alone); v99 makes it a 2-consumer category — lens + body — exactly
// symmetric with how temporal-frequency went from 1 (lintel breath) → 2
// (lintel + drone pitch) on its very next cut.
const DOLLY_SPEED_MIX = 0.3;
// P3 v100 — UNIFY #32: lookAt lerp speed amplifies with cameraMotion. THIRD
// consumer on the camera-property axis (after v98 FOV widening and v99 dolly
// position-lerp amplification). Promotes camera-property from 2-consumer
// category to 3-consumer category — matches temporal-frequency's substrate
// breadth (3) and pushes toward color's 5-consumer maturity. Where v98
// modulates the LENS and v99 modulates the BODY (translation), v100
// modulates the HEAD (rotation/look-at lerp). At rest motion=0 → per-room
// lookAtLerpSpeed unchanged (calendar 1.8, day 2.4 — every room's head-turn
// identity preserved). At peak dolly motion=1 → 25% faster head-turn arrival.
// Mix 0.25 sits slightly below DOLLY_SPEED_MIX (0.30) because head-turn snap
// is more perceptually sensitive than position arrival — over-amplifying
// lookAt produces motion sickness; lookAt is what the player's eyes track.
// Together v98 + v99 + v100 form the canonical camera triad: lens-property
// (FOV) + body-translation (position lerp) + body-rotation (lookAt lerp).
// All three positively-couple with the same scalar, all three preserve
// per-room baselines at rest, all three bounded within smoothing-stability
// limits (lookAt: 1 + 1×0.25 = 1.25× max, well inside k = 1 - exp(-rate×delta) < 1).
const LOOKAT_SPEED_MIX = 0.25;
// v168 — META-PIVOT cut #18. CAMERA-PROPERTY axis becomes the 8th WAYFINDING
// substrate. v98/v99/v100 opened the camera-property axis with three motion
// consumers (FOV/dolly/lookAt — all driven by cameraMotion). v168 adds the
// first WAYFINDING consumer on that axis: FOV widens additively when
// camera-forward aligns with COSMOS_DOORWAY_DIR. At full alignment (dot=1)
// FOV gains FOV_DOORWAY_MIX degrees on top of v98's motion widening; at
// orthogonal/opposite (dot≤0) the alignment term is 0 and FOV returns to
// pre-v168 behaviour. Reads as the lens "leaning into" each open doorway
// you're aimed at — a wide-angle drink-in of the lane you're about to walk.
// 2.5° peak chosen smaller than FOV_MIX (7°) so motion still dominates the
// FOV envelope; the doorway-alignment term is a flavor on top, not a
// competitor. Promotes wayfinding to an 8-substrate breadth: cosmos +
// floor + wall + particles + lintels + audio + DOM + camera-property.
// Promotes camera-property axis from 3-motion-consumer category to
// 3-motion + 1-wayfinding cross-axis composition (first non-motion
// consumer on the camera-property axis ever).
const FOV_DOORWAY_MIX = 2.5;
// v170 — META-PIVOT cut #20. Camera-property axis INTERNAL CHANNEL-PROMOTION
// on the wayfinding field. v168 opened the camera-property axis to wayfinding
// with ONE property (FOV). v170 adds the SECOND camera-property wayfinding
// consumer: the lerp TARGET position itself leans a small amount along the
// normalized COSMOS_DOORWAY_DIR. Because we shift targetPos BEFORE the lerp,
// the eased-position equilibrium sits slightly toward the doorway you're
// about to walk through — your body weight tips forward into the lane the
// FOV is already widening to drink in. Mirrors v167's internal-channel-
// promotion pattern (wall-geometry meta-class went 1→2 channels with
// depth+thickness inside the wall substrate); v170 promotes within-axis
// wayfinding on the camera substrate from 1-property one-off (FOV) to
// 2-property category (FOV + position-offset). 0.45 units chosen smaller
// than FOV's 2.5° peak (in relative-amplitude terms) — translation is a
// stronger perceptual cue than FOV widening, so the gain must stay small to
// avoid hijacking the per-room baseline. Composes additively with the
// existing room-target position, so room baselines remain anchored at rest
// (when COSMOS_DOORWAY_DIR is all zero, e.g. landing room, the offset
// vanishes).
const POS_DOORWAY_OFFSET = 0.45;
// v171 — META-PIVOT cut #21. CLOSES the camera-property wayfinding TRIAD
// symmetric with the v98/v99/v100 motion triad. Camera-property axis now
// has 3 motion consumers (FOV/dolly/lookAt — all driven by cameraMotion)
// AND 3 wayfinding consumers (FOV v168 / position v170 / lookAt v171 —
// all driven by COSMOS_DOORWAY_DIR). Full structural symmetry: the SAME
// three properties on the SAME substrate respond to BOTH cross-fields.
// v171 shifts the lookAt TARGET a small amount along the unit-sum doorway
// direction so the camera's gaze tips toward the doorway lane, on top of
// v170's body-lean and v168's lens-widen. Body + head + lens all bias
// together — every degree of freedom on the camera substrate now carries
// the wayfinding field. 0.35 chosen smaller than POS_DOORWAY_OFFSET
// (0.45) — head-turn is perceptually more sensitive than body-translation
// (mirroring the LOOKAT_SPEED_MIX vs DOLLY_SPEED_MIX ratio 0.25 vs 0.30
// established for the motion triad), so the gaze lean stays conservative.
// Promotes within-axis wayfinding on the camera substrate from 2-property
// category (v170) to 3-property FULL TRIAD — first substrate to carry
// every degree of freedom on the wayfinding field.
const LOOKAT_DOORWAY_OFFSET = 0.35;
// v172 — META-PIVOT cut #22. FIRST NEGATIVE-POLARITY WAYFINDING CUT.
// 13 consecutive wayfinding consumers (v158→v171) have been positive-
// coupling: every substrate INTENSIFIES (brightens, widens, drifts toward,
// leans toward) along the doorway-direction. v172 opens the polarity
// matrix on the wayfinding field by inverting the coupling: camera shake
// amplitude YIELDS when camera-forward aligns with COSMOS_DOORWAY_DIR.
// At full alignment (dot=1) shake scales DOWN by SHAKE_DOORWAY_YIELD;
// at orthogonal/opposite (dot≤0) shake is unaffected. Reads as the room
// CALMING when you stare directly down an open doorway — the path forward
// is visually clear (everything brightens, leans, drifts toward it) AND
// kinesthetically calm (shake quiets). Wayfinding becomes a field with
// SHAPE — energetic across the room, quiet in the lane. 0.55 chosen
// substantial because shake is jolt-y (pulse + bumps) and a subtle yield
// wouldn't be felt; at 55% reduction the calming is unmistakable but the
// pulse still registers. Mirrors the v86/v87/v88 pattern that opened
// negative-polarity on the motion field.
const SHAKE_DOORWAY_YIELD = 0.55;
// v173 — META-PIVOT cut #23. 2ND NEG-POLARITY WAYFINDING CUT. v172 opened
// NEG-polarity on the wayfinding field with ONE consumer (camera shake,
// canvas-only). v173 promotes wayfinding-NEG from a one-off to a CATEGORY
// by adding a 2nd consumer that ALSO crosses substrate AND domain in one
// move: DOM panel opacity yields when camera-forward aligns with
// COSMOS_DOORWAY_DIR. Mirrors v88 exactly (which crossed motion-NEG from
// canvas to DOM with opacity yield) — wayfinding-NEG follows the same
// maturation trajectory motion-NEG did. 0.30 chosen smaller than
// SHAKE_DOORWAY_YIELD (0.55) because the panel carries readable text;
// fading too aggressively would punish reading mid-look. 30% fade reads
// as the panel "stepping aside" so the spatial cue can take focus when
// you're aimed at a doorway. Published to ActivePanel via the existing
// CSS-var bridge (`--app-doorway-yield`); ActivePanel multiplies its
// existing `var(--app-motion-yield, 1)` opacity by the new var.
const DOM_DOORWAY_YIELD_MIX = 0.30;
// v174 — META-PIVOT cut #24. 3RD NEG-POLARITY WAYFINDING CUT. v172 opened
// the polarity (camera shake), v173 bridged it canvas→DOM (panel opacity).
// v174 promotes NEG-polarity wayfinding from a 2-consumer category to a
// CANONICAL 3-SUBSTRATE CATEGORY matching motion-NEG's cardinality
// (cursor + breath + DOM-opacity). Cursor parallax amplitude shrinks
// when camera-forward aligns with COSMOS_DOORWAY_DIR — the cursor's
// pull on the wall thins along the doorway lane, deferring to the
// spatial cue. Same channel cursor parallax already yields on for
// motion (v86: cursorYield = 1 - motionAmount × 0.85); v174 stacks a
// second multiplicative yield on the same scalar, so the cursor
// authority compounds across BOTH cross-fields (yield to motion AND
// yield to doorway-alignment). 0.40 chosen between camera shake's 0.55
// (very visceral substrate) and DOM opacity's 0.30 (readable-surface
// constraint) — cursor parallax is mid-visceral. Closes the
// architectural parallel: motion-NEG and wayfinding-NEG now both span
// 3 substrates / 2 domains / overlap on cursor substrate (cursor
// substrate ITSELF carries BOTH cross-fields' NEG polarity, the first
// substrate where one degree of freedom answers to two NEG-coupled
// fields simultaneously).
const CURSOR_DOORWAY_YIELD_MIX = 0.40;
// v203 — VISION-PIVOT cut. Camera waypoint PULL through the doorway lane
// during transit. v170 established the REST lean (POS_DOORWAY_OFFSET = 0.45u
// along COSMOS_DOORWAY_DIR); the camera body equilibrium sits slightly
// toward the doorway it's about to walk. v203 adds a motion-GATED
// amplification on the SAME axis: during transit the camera reaches FURTHER
// along the doorway lane (past the destination room's anchor, into the gap
// zone), then retracts back to the v170 rest lean as it arrives.
//
// Why this closes the second half of VISION phase 3. v202 made the wall
// RIPPLE OPEN from the doorway center outward. But the camera was still
// lerping on a straight chord from source to destination anchor — even
// when the ripple opened the gap visibly, the camera glided to the next
// room's center, not THROUGH the gap. v203 binds the camera path to the
// doorway lane: at peak motion the lerp target sits POS_DOORWAY_OFFSET +
// MOTION_DOORWAY_PULL units along the doorway direction from the room
// anchor, so the camera physically threads the gap mid-transit instead
// of gliding past it. As motion decays the pull retracts to 0.45 and the
// camera settles back to the room's normal anchor. Matches VISION literal
// "camera dollies forward through the opening."
//
// Magnitude. 1.0 = ~2.2× v170 rest at full motion. Composite peak 1.45u
// stays below the typical room half-depth (~3–4u) so the camera doesn't
// overshoot past the doorway plane into the next-next room. Motion gating
// via getCameraMotion() (prev-frame, already smoothed by the position
// lerp) ensures the pull vanishes at rest — preserves the same no-side-
// effects-at-rest invariant every motion-coupled cut from v98 onward
// follows. Single-property change on camera-position substrate; lookAt
// stays on v171's static lean (separate substrate, future cut may add a
// matching motion-gated head-turn). Composes additively with v170 since
// both ride COSMOS_DOORWAY_DIR — implementation collapses the two into
// one composite `doorwayLean` magnitude per frame, replacing the v170
// const-times-direction triple-axis add with a (rest + motion-bonus)
// version that's identical at rest.
const MOTION_DOORWAY_PULL = 1.0;
// v205 — VISION-PIVOT mirror cut. Same motion-gated waypoint-pull pattern
// as v203, but on the lookAt (head-turn) substrate. v171 established the
// REST gaze lean (LOOKAT_DOORWAY_OFFSET = 0.35u along COSMOS_DOORWAY_DIR);
// v205 layers motion-gated amplification so the gaze reaches FURTHER along
// the doorway lane during transit and retracts at rest. Pairs with v203 to
// keep gaze and body tracking together: at peak motion both target ahead
// into the gap, at rest both settle to their per-room baselines.
//
// Why mirror v203 on lookAt now. The transition trilogy (v202+v203+v204)
// gave the body lean a 2.2× transit amplification but left the gaze
// statically at 0.35u — meaning during the very transit when the camera
// THREADS the doorway (v203 reaching 1.45u into the gap), the gaze stayed
// pinned at the rest equilibrium. Perceptually that decouples body and
// head: camera "leans through the opening" while gaze still lazily points
// toward room center. v205 binds gaze to the same motion-gated waypoint
// behavior so gaze and body sweep TOGETHER through the doorway lane.
//
// Magnitude. 0.80 = 2.28× v171 rest at full motion (composite peak 1.15u).
// Conservative vs body pull (1.0 → composite 1.45u) — gaze stays slightly
// behind body, mirroring the v100/v99 ratio (LOOKAT_SPEED_MIX 0.25 vs
// DOLLY_SPEED_MIX 0.30 ≈ 0.83). 0.80 chosen so peak gaze offset (1.15u)
// remains ~80% of peak body offset (1.45u). Same motion gating via
// getCameraMotion() (prev-frame, already smoothed by the lookAt lerp).
// Closes the camera-property wayfinding TRIAD to a 3-substrate motion-
// AMPLIFIED category: v203 (body) + v205 (gaze) + (FOV widening on v168
// is already motion-aware via getCameraMotion in the FOV_MIX term). All
// three camera DoFs now ride the motion-gated waypoint field.
const MOTION_LOOKAT_DOORWAY_PULL = 0.80;
// v206 — VISION-PIVOT cross-DOMAIN mirror. v203 motion-amplified the body
// doorway lean (canvas-position substrate); v205 motion-amplified the gaze
// doorway lean (canvas-lookAt substrate). v206 mirrors the same pattern on
// the DOM substrate: ActivePanel's v165 `--app-doorway-x/z` vars were
// STATIC (= COSMOS_DOORWAY_DIR.x/z directly); v206 multiplies them by
// (1 + motion × DOM_DOORWAY_PULL) at publish time so the panel translates
// FURTHER toward the doorway during transit and retracts to v165 baseline
// at rest. Closes the doorway-direction channel to a 3-substrate MOTION-
// AMPLIFIED category that spans both rendering domains: canvas (body via
// v203 + gaze via v205) + DOM (panel translate via v206).
//
// Magnitude. 1.0 = 2× v165 baseline at full motion (rest panel translate
// peak: 6px per unit dir; peak motion: 12px per unit dir). Subtle enough
// to preserve panel readability (no jarring shift) but visible — same
// magnitude family as v203 body pull (also 1.0, also ~2.2× rest).
// Composes with v173 doorway-yield opacity multiplicatively in DOM (panel
// translates toward doorway AND fades slightly when aimed at it during
// transit — gaze authority gracefully cedes to spatial cue, exactly the
// behavior v172/v173 introduced).
const DOM_DOORWAY_PULL = 1.0;

export function CameraRig({
  lerpSpeed = 1.4,
  lookAtLerpSpeed = 1.8,
}: CameraRigProps) {
  const target = useRoomTarget();

  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);
  const lookWithPitch = useMemo(() => new THREE.Vector3(), []);
  const currentLook = useRef(new THREE.Vector3(0, 0, 0));

  // Cursor position normalized to [-1, 1], lerped each frame to soften flicks.
  const cursorRaw = useRef({ x: 0, y: 0 });
  const cursorSmoothed = useRef({ x: 0, y: 0 });

  // Track the parallax + shake offsets applied last frame so we can subtract
  // them before re-lerping toward the room target — otherwise the lerp would
  // treat the offset as part of the base position and never converge cleanly.
  const appliedParallax = useRef(new THREE.Vector3());
  const appliedShake = useRef(new THREE.Vector3());
  const appliedRecoil = useRef(new THREE.Vector3());
  const appliedBreath = useRef(new THREE.Vector3());
  // P3 v102 — UNIFY #34: phase accumulator for cross-axis breath rate yield.
  // Advances at `baseAngular × (1 − motionAmount × BREATH_RATE_YIELD)` per
  // frame inside the breath block; preserves C0 continuity across motion
  // ramps so the breath slows smoothly instead of skipping.
  const breathPhaseRef = useRef(0);
  // P3 v117 — UNIFY #49: separate variable-offset phase accumulator for the
  // NEG×NEG×NEG composition. Lives ALONGSIDE breathPhaseRef (which IS the
  // camera breath phase published via setCameraBreathPhase) — locking the
  // source's phase to itself is structurally invalid, so v117 carries its
  // own oscillator that locks toward camPhase + motionAmount × -π.
  const breathVariablePhaseRef = useRef(0);
  // P3 v118 — UNIFY #50: separate variable-offset phase accumulator for the
  // NEG×NEG×POS composition on cursor parallax. Locks toward camPhase +
  // motionAmount × +π — same single-line composition idiom as v117 but with
  // POSITIVE offset peak + POSITIVE cross-axis rate (intensifies, not yields).
  const cursorVariablePhaseRef = useRef(0);
  // P3 v28 — last-written CSS var values; only update DOM when delta is meaningful.
  const lastPanelVars = useRef({ dx: 0, dy: 0, scale: 1, yield: 1, amount: 0, letterSpread: 0, blurSmoothed: 0, letterPhaseMod: 1, doorwayX: 0, doorwayZ: 0, doorwayYield: 1, doorwayAlign: 0, dayWarmth: 0.5 });
  // P3 v105 — UNIFY #37: smoothed letter-spread scalar, rate-yielded toward
  // raw motionAmount. Mutated in place each frame via exp-lerp at a motion-
  // coupled rate; exposed to DOM as `--app-letter-spread` (0..1), then ActivePanel
  // multiplies by 0.03em peak. Same direct-write idiom as v95/v96/v97/v101/v104.
  const panelLetterSpreadRef = useRef(0);
  // P3 v107 — UNIFY #39: smoothed DOM-blur scalar in PIXELS (target =
  // (1 − panelYield) × BLUR_PEAK_PX, max 3px). Mutated in place each frame via
  // exp-lerp at a rate that INTENSIFIES with cameraMotion (positive rate, NEG
  // amplitude). Exposed to DOM as `--app-blur-smoothed`; ActivePanel consumes
  // as `filter: blur(calc(var(--app-blur-smoothed, 0) * 1px))`. Closes the
  // 4/4 polarity matrix on the cross-axis convergence meta-class.
  const panelBlurSmoothedRef = useRef(0);
  // P3 v113 — UNIFY #45: free-running DOM letter-spacing breath phase. Locks
  // toward (breathPhaseRef.current + θ) where θ = panelAmount × π. At rest
  // θ=0 (in-phase echo target — letter spread breathes WITH camera breath at
  // motion-onset); at peak θ=π (anti-phase answer — letter spread breathes
  // AGAINST it during full dolly). Published as `--app-letter-phase-mod`.
  const panelLetterPhaseRef = useRef(0);
  // P3 v123 — UNIFY #55: second DOM letter-spacing phase accumulator for FIXED
  // anti-phase harmonic lock. Source-is-not-consumer constraint applies: the
  // existing panelLetterPhaseRef is v113's variable-offset target (slides with
  // motion); it cannot also lock toward a FIXED target. Solution mirrors v121
  // lintel + v122 cosmos verbatim — separate accumulator locks toward
  // (breathPhase + π) regardless of motion; only lock STRENGTH gates with
  // motion. panelLetterPhaseMod fold-composes both modulators multiplicatively
  // at the publish site so DOM consumer sees a single phase-mod scalar.
  const panelLetterAntiPhaseRef = useRef(0);
  // P3 v129 — UNIFY #61: third DOM letter-spacing phase accumulator for
  // SLIDING-QUADRATURE harmonic lock (7-META-CLASS slot 7 on this substrate).
  // Source-is-not-consumer constraint: v113 panelLetterPhaseRef owns
  // variable-offset slot 1 (sliding anti-phase × π), v123 panelLetterAntiPhaseRef
  // owns fixed anti-phase; neither can also lock toward quadrature. Fresh
  // accumulator mirrors v127 lintelQuadPhaseRef + v128 cosmosQuadPhaseRef.
  const panelLetterQuadPhaseRef = useRef(0);
  // P3 v135 — UNIFY #67: 5th sibling DOM letter-spacing phase accumulator
  // carrying the FIRST FREQUENCY-MULTIPLIED voice on this substrate. Source-is-
  // not-consumer: octave is a frequency multiple (breathPhase × 2), structurally
  // orthogonal to all four prior letter-spacing phase-offset siblings
  // (panelLetterPhaseRef v113 sliding-anti-phase, panelLetterAntiPhaseRef v123
  // fixed-anti-phase, panelLetterQuadPhaseRef v129 sliding-quadrature, and
  // panelLetterSpreadRef v92/v105 which is an amplitude scalar not a phase).
  // Cannot reuse any prior accumulator because frequency-multiplication composes
  // multiplicatively on the harmonic axis itself, not additively as a phase
  // offset. Mirrors v133 lintel's lintelOctavePhaseRef + v134 cosmos's
  // cosmosOctavePhaseRef patterns verbatim on DOM substrate.
  const panelLetterOctavePhaseRef = useRef(0);
  // P3 v138 — 6th sibling accumulator on DOM letter-spacing. Source-is-not-
  // consumer at depth-10 for the third time: 3rd-harmonic (camPhase × 3) is a
  // different frequency multiple from octave (× 2), so a fresh ref is required;
  // the octave accumulator carries a different settled phase point. Mirrors
  // v136 lintel3rdPhaseRef + v137 cosmos3rdPhaseRef verbatim on DOM substrate.
  const panelLetter3rdPhaseRef = useRef(0);
  // P3 v141 — 7th sibling accumulator on DOM letter-spacing. Source-is-not-
  // consumer at depth-11 for the third time: 4th-harmonic (camPhase × 4) is a
  // new frequency multiple distinct from octave (× 2) and 3rd-harmonic (× 3),
  // so a fresh ref is required; each accumulator carries a different settled
  // phase point. Mirrors v139 lintel4thPhaseRef + v140 cosmos4thPhaseRef
  // verbatim on DOM substrate, closing DEPTH-3-BREADTH-3.
  const panelLetter4thPhaseRef = useRef(0);
  // P3 v144 — 8th sibling accumulator on DOM letter-spacing. Source-is-not-
  // consumer at depth-12 for the third time: 5th-harmonic (breathPhase × 5) is
  // a NEW frequency multiple distinct from octave (× 2), 3rd-harmonic (× 3),
  // and 4th-harmonic (× 4); a fresh ref is required; each accumulator carries
  // a different settled phase point. Mirrors v142 lintel5thPhaseRef + v143
  // cosmos5thPhaseRef verbatim on DOM substrate, closing DEPTH-4-BREADTH-3.
  const panelLetter5thPhaseRef = useRef(0);
  // P3 v147 — 9th sibling accumulator on DOM letter-spacing. Source-is-not-
  // consumer at depth-13 for the FOURTH time on DOM: 6th-harmonic
  // (breathPhase × 6) is a NEW frequency multiple distinct from octave × 2,
  // 3rd-harmonic × 3, 4th-harmonic × 4, and 5th-harmonic × 5 — cannot reuse
  // any of DOM's eight prior phase/scalar siblings. Mirrors v145 lintel6thPhaseRef
  // + v146 cosmos6thPhaseRef verbatim on DOM substrate, closing DEPTH-5-BREADTH-3
  // bifurcation matrix at 15/15 cells visited.
  const panelLetter6thPhaseRef = useRef(0);
  // P3 v190 — META-PIVOT cut #26 (continued): per-instance accumulator for
  // cross-field × temporal-DERIVATIVE on the breath NEG×POS canvas cell.
  // v189 opened the derivative axis on audio (drone pitch POS×NEG with a
  // module-scoped `let` in the RAF closure). v190 PROMOTES the derivative
  // axis from one-off → 2-substrate category by adding a canvas consumer
  // here. Each subsystem keeps its own prev-align state — cleaner than
  // sharing a single global; isolation also means each cell can choose
  // its own gating polarity (audio gated by camMotion, canvas-breath
  // gated by REST since the v178 cell is the motion-NEG quadrant).
  const prevBreathAlignRef = useRef(0);

  // Reusable scratch vectors for parallax / shake math.
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const parallaxOffset = useMemo(() => new THREE.Vector3(), []);
  const shakeOffset = useMemo(() => new THREE.Vector3(), []);
  const recoilOffset = useMemo(() => new THREE.Vector3(), []);
  const breathOffset = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const onMove = (e: PointerEvent | MouseEvent) => {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      cursorRaw.current.x = (e.clientX / w) * 2 - 1;
      cursorRaw.current.y = -((e.clientY / h) * 2 - 1);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  // P3 v31 — last-applied FOV; only call updateProjectionMatrix when delta meaningful.
  const lastFov = useRef<number | null>(null);

  useFrame((state, delta) => {
    const camera = state.camera as THREE.PerspectiveCamera;
    targetPos.set(target.position[0], target.position[1], target.position[2]);
    targetLook.set(target.lookAt[0], target.lookAt[1], target.lookAt[2]);

    // v170 — position-offset wayfinding. Shift the lerp TARGET a small amount
    // along the unit-sum doorway-direction so the camera body equilibrium
    // sits slightly toward the doorway lane (the FOV widening v168 added is
    // already drinking that lane in; v170 leans the body forward to match).
    // COSMOS_DOORWAY_DIR is already a unit-or-zero vector (Room.tsx normalizes
    // the sum-of-openings). Composes additively with the per-room baseline
    // position so each room's intended camera anchor is preserved at rest.
    // v203 — VISION-PIVOT. Layer motion-gated waypoint pull on top of v170's
    // rest lean. Composite lean = POS_DOORWAY_OFFSET + motion × MOTION_DOORWAY_PULL.
    // At rest (motion=0) → 0.45u, identical to v170. Mid-transit (motion≈1) →
    // 1.45u, camera reaches past the destination room anchor into the doorway
    // lane so the lerp physically threads the gap instead of gliding to room
    // center on a straight chord.
    const doorwayLean = POS_DOORWAY_OFFSET + getCameraMotion() * MOTION_DOORWAY_PULL;
    targetPos.x += COSMOS_DOORWAY_DIR[0] * doorwayLean;
    targetPos.y += COSMOS_DOORWAY_DIR[1] * doorwayLean;
    targetPos.z += COSMOS_DOORWAY_DIR[2] * doorwayLean;

    // v171 — lookAt-offset wayfinding. Closes the camera-property axis to a
    // FULL TRIAD on the wayfinding field: FOV (v168) + position (v170) +
    // lookAt (v171). Camera body leans (v170), camera lens widens (v168),
    // and camera gaze tips (v171) — all toward the same doorway-direction.
    // Symmetric with the v98/v99/v100 motion triad. Shift happens BEFORE the
    // lookAt lerp so the eased gaze converges toward the offset equilibrium
    // without per-frame snap. Magnitude smaller than position offset because
    // head-turn is perceptually more sensitive than body-translation.
    // v205 — VISION-PIVOT mirror. Layer motion-gated waypoint pull on top
    // of v171's rest lean (composite = LOOKAT_DOORWAY_OFFSET + motion ×
    // MOTION_LOOKAT_DOORWAY_PULL). At rest → 0.35u (v171 baseline). Peak
    // motion → 1.15u, gaze reaches into the doorway lane alongside the
    // body so head and body track together through the gap. Same motion
    // signal as v203 (getCameraMotion(), prev-frame, smoothed).
    const lookAtDoorwayLean =
      LOOKAT_DOORWAY_OFFSET + getCameraMotion() * MOTION_LOOKAT_DOORWAY_PULL;
    targetLook.x += COSMOS_DOORWAY_DIR[0] * lookAtDoorwayLean;
    targetLook.y += COSMOS_DOORWAY_DIR[1] * lookAtDoorwayLean;
    targetLook.z += COSMOS_DOORWAY_DIR[2] * lookAtDoorwayLean;

    // P3 v31 — lerp camera FOV toward room target's FOV. PerspectiveCamera
    // only — orthographic skips. Calls updateProjectionMatrix() on threshold
    // change to dodge per-frame matrix recomputes during steady-state.
    if (camera.isPerspectiveCamera) {
      // P3 v98 — UNIFY #30: camera-property axis. FOV widens additively
      // during transit via getCameraMotion() (prev-frame value; FOV_LERP=1.4
      // smooths the one-frame lag invisibly).
      const baseFov = target.fov ?? FOV_DEFAULT;
      // v168 — doorway-alignment FOV widening. Forward dir derived from the
      // current camera position toward this room's lookAt target (post-lerp
      // forward); dotted against the unit-sum doorway direction. Clamped to
      // [0,1] so anti-aligned views don't subtract FOV.
      const fwdX = target.lookAt[0] - camera.position.x;
      const fwdY = target.lookAt[1] - camera.position.y;
      const fwdZ = target.lookAt[2] - camera.position.z;
      const fwdLen = Math.sqrt(fwdX * fwdX + fwdY * fwdY + fwdZ * fwdZ);
      let doorwayAlign = 0;
      if (fwdLen > 1e-4) {
        const fx = fwdX / fwdLen;
        const fy = fwdY / fwdLen;
        const fz = fwdZ / fwdLen;
        const dot =
          fx * COSMOS_DOORWAY_DIR[0] +
          fy * COSMOS_DOORWAY_DIR[1] +
          fz * COSMOS_DOORWAY_DIR[2];
        doorwayAlign = dot > 0 ? dot : 0;
      }
      const targetFov =
        baseFov + getCameraMotion() * FOV_MIX + doorwayAlign * FOV_DOORWAY_MIX;
      const fovK = 1 - Math.exp(-FOV_LERP * delta);
      const newFov = camera.fov + (targetFov - camera.fov) * fovK;
      if (lastFov.current === null || Math.abs(newFov - lastFov.current) > FOV_UPDATE_THRESHOLD) {
        camera.fov = newFov;
        camera.updateProjectionMatrix();
        lastFov.current = newFov;
      } else {
        camera.fov = newFov;
      }
    }

    // Strip last frame's parallax + shake + recoil + breath before any motion math, so the
    // lerp & motion calculations all operate on the clean room-target trajectory.
    camera.position.sub(appliedParallax.current);
    camera.position.sub(appliedShake.current);
    camera.position.sub(appliedRecoil.current);
    camera.position.sub(appliedBreath.current);

    // P3 v43/v44 — resolve IN-room character once per frame; shared by dolly
    // speed (this block, v44), dolly tilt/pitch/roll (just below, v43), and
    // celebration recoil (later, ~line 290, v40). Destination-room lookup:
    // setRoomView updates state.view before pulse, so getRoomView() returns
    // the room being entered the moment a transition fires.
    const activeView = getRoomView();
    const activeCharacter = getCharacterFor(activeView);
    // P3 v44 — per-room dolly speed (position + lookAt lerp coefficients).
    // Compose: per-room character first, prop default second. Slow rooms
    // (congrats 0.9) take ~2.7× longer to arrive than fast rooms (reset-pw 2.4).
    const baseLerpSpeed = activeCharacter.dollyLerpSpeed ?? lerpSpeed;
    // P3 v99 — UNIFY #31: camera-property axis 2nd consumer. Dolly speed
    // amplifies with prev-frame cameraMotion via getCameraMotion(). True
    // positive-feedback self-reference, bounded by motionAmount cap (max 1.30×).
    const effectiveLerpSpeed = baseLerpSpeed * (1 + getCameraMotion() * DOLLY_SPEED_MIX);
    // P3 v100 — UNIFY #32: camera-property axis 3rd consumer. Head-turn
    // (lookAt lerp) amplifies with prev-frame cameraMotion, slightly more
    // conservative mix than dolly (0.25 vs 0.30) because lookAt snap is
    // perceptually more sensitive than translation arrival.
    const baseLookAtLerpSpeed =
      activeCharacter.dollyLookAtLerpSpeed ?? lookAtLerpSpeed;
    const effectiveLookAtLerpSpeed =
      baseLookAtLerpSpeed * (1 + getCameraMotion() * LOOKAT_SPEED_MIX);

    const k = 1 - Math.exp(-effectiveLerpSpeed * delta);
    camera.position.lerp(targetPos, k);

    const dollyTiltFalloff =
      activeCharacter.dollyTiltFalloff ?? TILT_FALLOFF_DIST_FALLBACK;
    const dollyPitchAmp =
      activeCharacter.dollyPitchAmp ?? PITCH_AMP_FALLBACK;
    const dollyPitchFreq =
      activeCharacter.dollyPitchFreq ?? PITCH_FREQ_FALLBACK;

    const motionDist = camera.position.distanceTo(targetPos);
    const motionAmount = Math.min(1, motionDist / dollyTiltFalloff);
    const restAmount = 1 - motionAmount;
    // P2 v71 — UNIFY #3: publish camera motion so TileVoid (and future
    // subsystems) can read it and visibly accelerate with the dolly.
    // motionAmount is already normalized [0,1] by dollyTiltFalloff, so the
    // cosmos coupling is automatically per-room (calendar's longer falloff
    // means the cosmos accelerates more gradually; reset-password's tight
    // falloff means it snaps up fast).
    setCameraMotion(motionAmount);
    const t = state.clock.elapsedTime;
    const pitchOffset = Math.sin(t * dollyPitchFreq) * dollyPitchAmp * motionAmount;

    const lookK = 1 - Math.exp(-effectiveLookAtLerpSpeed * delta);
    currentLook.current.lerp(targetLook, lookK);

    // P3 v45 — per-room parallax smoothing lerp + amplitude.
    // Calendar 1.6 = laggy loose drift, reset-password 3.6 = snap-locked.
    // Shares the activeCharacter resolve from v40/v43/v44 (hoisted line ~192).
    // P3 v103 — UNIFY #35: cross-axis convergence #2 (yield × frequency on
    // cursor substrate). Cursor parallax LERP RATE yields alongside the v86
    // amplitude yield. Same playbook as v102 on a new substrate.
    const baseParallaxLerp = activeCharacter.parallaxLerp ?? PARALLAX_LERP_FALLBACK;
    const parallaxLerp = baseParallaxLerp * (1 - motionAmount * CURSOR_RATE_YIELD);
    const parallaxXAmp = activeCharacter.parallaxXAmp ?? PARALLAX_X_AMP_FALLBACK;
    const parallaxYAmp = activeCharacter.parallaxYAmp ?? PARALLAX_Y_AMP_FALLBACK;
    const cK = 1 - Math.exp(-parallaxLerp * delta);
    cursorSmoothed.current.x += (cursorRaw.current.x - cursorSmoothed.current.x) * cK;
    cursorSmoothed.current.y += (cursorRaw.current.y - cursorSmoothed.current.y) * cK;

    // Build forward/right basis from camera→lookAt so parallax respects current orientation.
    forward.copy(currentLook.current).sub(camera.position);
    if (forward.lengthSq() > 1e-6) forward.normalize();
    right.copy(forward).cross(up);
    if (right.lengthSq() > 1e-6) right.normalize();

    // P2 v75 — UNIFY #7: publish camera world forward as a spatial directional
    // channel. Pre-v75 the unified motion field was ALL scalar — cosmos drift,
    // wall pulse, lintel brightness, fog reach, scene lights all read a single
    // [0,1] speed. v75 introduces a vec3 channel: TileVoid lerps its rotation
    // axis between world-Y (rest) and camera-forward (full dolly), so during a
    // transition the cosmos visibly TILTS toward where the camera is heading
    // — the void doesn't just spin faster, it rolls in the direction of travel.
    // First UNIFY cut to carry directional information, not just magnitude.
    setCameraForward(forward.x, forward.y, forward.z);

    // Compute fresh parallax — lateral along right vector, vertical in world Y.
    // P3 v86 — NEGATIVE COUPLING. Pre-v86 used the implicit linear restAmount
    // (= 1 - motionAmount) so parallax went to zero at peak dolly. v86 promotes
    // that to an explicit named yield: cursorYield = 1 - motionAmount × CURSOR_YIELD_MIX.
    // With CURSOR_YIELD_MIX=0.85 parallax thins to a 15% floor at peak dolly
    // instead of vanishing — the cursor still has presence during transit, just
    // dominated by the camera. Same channel feeds Room.tsx hover-magnet AMP yield.
    // P3 v174 — META-PIVOT cut #21: 3rd NEG-polarity wayfinding consumer.
    // v172 opened NEG-polarity on the wayfinding field (camera shake yields to
    // doorway-alignment); v173 bridged it canvas→DOM (panel opacity); v174
    // closes the canonical 3-substrate NEG category by composing the
    // doorway-yield multiplicatively into cursor parallax authority. forward
    // was normalized at line 1099. When camera-forward aligns with the active
    // room's open-doorway direction (you're "looking through" the gap),
    // cursor parallax shrinks an additional 40% on top of the motion-yield
    // already in place — UI gives way so the spatial cue can read. Wayfinding-NEG
    // now matches motion-NEG's substrate cardinality (shake + DOM + cursor =
    // canvas + DOM + canvas, just like cursor + idle-breath + opacity).
    const _cursorDoorwayDot =
      forward.x * COSMOS_DOORWAY_DIR[0] +
      forward.y * COSMOS_DOORWAY_DIR[1] +
      forward.z * COSMOS_DOORWAY_DIR[2];
    const _cursorDoorwayAlign = _cursorDoorwayDot > 0 ? _cursorDoorwayDot : 0;
    const cursorYield =
      (1 - motionAmount * CURSOR_YIELD_MIX) *
      (1 - _cursorDoorwayAlign * CURSOR_DOORWAY_YIELD_MIX);
    // P3 v118 — UNIFY #50: NEG×NEG×POS 3-meta-class composition on cursor
    // parallax. Lock the separate variable-offset phase toward
    // (camBreathPhase + motionAmount × +π) at a lock rate that ITSELF
    // intensifies with motion (POS cross-axis on rate). At rest motion=0 →
    // both lockStrength gate AND offset go to zero (no variable contribution,
    // preserves v86+v103 at-rest identity). Wrap-around-safe shortest-path
    // lerp. Reads getCameraBreathPhase() once per frame (published by the
    // breath block later in this useFrame — 1-frame stale phase, same as
    // v109/v110/v116 cross-substrate phase consumers).
    const _cursorVarLockStrength = motionAmount * CURSOR_VARIABLE_LOCK_STRENGTH;
    if (_cursorVarLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cursorCamPhase = getCameraBreathPhase();
      const _cursorVarTarget = _cursorCamPhase + motionAmount * CURSOR_VARIABLE_OFFSET_PEAK;
      const _cursorVarRawDiff = _cursorVarTarget - cursorVariablePhaseRef.current;
      const _cursorVarPhaseDiff = ((_cursorVarRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _cursorVarLockRate = CURSOR_VARIABLE_BASE_LERP * _cursorVarLockStrength * (1 + motionAmount * CURSOR_VARIABLE_RATE_MIX);
      const _cursorVarLockK = 1 - Math.exp(-_cursorVarLockRate * delta);
      cursorVariablePhaseRef.current += _cursorVarPhaseDiff * _cursorVarLockK;
    }
    const _cursorVarMod = 1 + Math.sin(cursorVariablePhaseRef.current) * CURSOR_VARIABLE_DEPTH * motionAmount;
    parallaxOffset.set(0, 0, 0);
    const parallaxRightScalar = cursorSmoothed.current.x * parallaxXAmp * cursorYield * _cursorVarMod;
    const parallaxYScalar = cursorSmoothed.current.y * parallaxYAmp * cursorYield * _cursorVarMod;
    parallaxOffset.addScaledVector(right, parallaxRightScalar);
    parallaxOffset.y += parallaxYScalar;
    camera.position.add(parallaxOffset);
    appliedParallax.current.copy(parallaxOffset);

    // P3 v15 — project cursor onto the active room's lookAt plane and publish
    // it to the registry so Room.tsx can drift nearby tiles toward the cursor.
    // Scale picks how wide a wall-area the cursor [-1,1] sweep maps to;
    // tuned so the magnetic effect spans most of the visible back wall.
    const CURSOR_WALL_X = 4.2;
    const CURSOR_WALL_Y = 2.6;
    const cursorWX = targetLook.x + right.x * cursorSmoothed.current.x * CURSOR_WALL_X;
    const cursorWY = targetLook.y + cursorSmoothed.current.y * CURSOR_WALL_Y;
    const cursorWZ = targetLook.z + right.z * cursorSmoothed.current.x * CURSOR_WALL_X;
    // P3 v86 — UNIFY #18: replace the pre-v86 BINARY restAmount > 0.5 gate with
    // a wide-open active flag so the hover-magnet stays alive throughout the
    // dolly. Authority is now yielded smoothly via amplitude (Room.tsx scales
    // HOVER_AMP by 1 - camMotion × CURSOR_YIELD_MIX), not via a hard on/off
    // cutoff. cursorYield > 0.05 keeps the magnet off only when motion is at
    // absolute peak — at peak the magnet's 15% authority is so weak that
    // gating it OFF entirely avoids spending the shader cycles on a no-op.
    setCursorWorld(cursorWX, cursorWY, cursorWZ, cursorYield > 0.05);

    // P3 v10 — accumulate shake amplitude from active pulse + live bumps.
    // pulseAt is in performance.now() ms; bumps use seconds. Convert both to
    // a common second-axis reference so envelopes line up with Room.tsx.
    // P3 v40 — pulse + bump amplitudes are per-room: ambition rooms (goals)
    // jolt sharp, legal rooms (privacy/terms) barely twitch, reward room
    // (congrats) rattles, planning rooms (calendar) sway gently.
    const wallNow = performance.now() / 1000;
    let shakeAmt = 0;
    const pulseInfo = getPulse();
    const sincePulse = wallNow - pulseInfo.pulseAt / 1000;
    const shakeCharacter = getCharacterFor(getRoomView());
    // P3 v34 — IN-room's pulseDuration drives the shake envelope. state.view is
    // the destination (setRoomView swaps view BEFORE incrementing pulse) so
    // getRoomView() returns the room the camera is arriving into.
    const shakePulseDuration =
      shakeCharacter.pulseDuration ?? SHAKE_PULSE_DURATION_FALLBACK;
    const shakePulseAmp =
      shakeCharacter.shakePulseAmp ?? SHAKE_PULSE_AMP_FALLBACK;
    const shakeBumpAmp =
      shakeCharacter.shakeBumpAmp ?? SHAKE_BUMP_AMP_FALLBACK;
    if (sincePulse >= 0 && sincePulse < shakePulseDuration) {
      // Bell envelope peaking at midpoint matches the wall's fragment moment.
      shakeAmt += Math.sin((sincePulse / shakePulseDuration) * Math.PI) * shakePulseAmp;
    }
    const liveBumps = getActiveBumps();
    for (let i = 0; i < liveBumps.length; i++) {
      const t0 = wallNow - liveBumps[i].fireTime;
      if (t0 < 0 || t0 > BUMP_LIFETIME) continue;
      const tNorm = t0 / BUMP_LIFETIME;
      const env = tNorm < SHAKE_BUMP_PEAK_NORM
        ? tNorm / SHAKE_BUMP_PEAK_NORM
        : 1 - (tNorm - SHAKE_BUMP_PEAK_NORM) / (1 - SHAKE_BUMP_PEAK_NORM);
      shakeAmt += env * shakeBumpAmp;
    }

    // v172 — wayfinding YIELD. Shake amplitude scales down when camera
    // forward aligns with COSMOS_DOORWAY_DIR. `forward` already normalized
    // at line ~1047 from currentLook - camera.position post-lerp.
    {
      const _shakeDot =
        forward.x * COSMOS_DOORWAY_DIR[0] +
        forward.y * COSMOS_DOORWAY_DIR[1] +
        forward.z * COSMOS_DOORWAY_DIR[2];
      const _shakeDoorwayAlign = _shakeDot > 0 ? _shakeDot : 0;
      shakeAmt *= 1 - _shakeDoorwayAlign * SHAKE_DOORWAY_YIELD;
    }

    shakeOffset.set(0, 0, 0);
    let shakeRightScalar = 0;
    let shakeYScalar = 0;
    if (shakeAmt > 1e-5) {
      // Mutually-prime frequencies + summed sin pairs give a non-repeating
      // jitter without needing perlin/simplex noise. Right + up axes only —
      // forward shake reads as zoom, less satisfying for fragment kinesthesia.
      shakeRightScalar = (Math.sin(t * SHAKE_FX) + Math.sin(t * SHAKE_FZ * 1.31) * 0.6) * shakeAmt;
      shakeYScalar = (Math.cos(t * SHAKE_FY) + Math.sin(t * SHAKE_FX * 0.83) * 0.6) * shakeAmt;
      shakeOffset.addScaledVector(right, shakeRightScalar);
      shakeOffset.y += shakeYScalar;
      camera.position.add(shakeOffset);
    }
    appliedShake.current.copy(shakeOffset);

    // P3 v20 — celebration recoil. Sum bell envelopes from active celebrations
    // for the *current* room only (room-scoped, matches the visual burst), then
    // pull camera back along forward + up along world Y, and tilt lookAt up.
    // P3 v39 — envelope width now tracks the active room's celebDuration so the
    // recoil-pullback duration matches the visual tile burst in every room
    // (congrats 2.6s slow swell, goals 1.4s sharp snap, privacy 1.0s blip).
    // CELEBRATION_LIFETIME stays as a max-cleanup fallback only.
    // P3 v40 — recoil back/up/tilt amps now per-room: congrats throws the body
    // backward (0.82/0.40/0.15), legal rooms barely move (0.15/0.07/0.03),
    // onboarding adds extra upward tilt to read as "head thrown back" welcome.
    // activeView + activeCharacter hoisted to top of useFrame in v43 (shared
    // with dolly tilt/pitch/roll).
    const celebRecoilDuration =
      activeCharacter.celebDuration ?? CELEBRATION_LIFETIME;
    const recoilBackAmp =
      activeCharacter.recoilBackAmp ?? RECOIL_BACK_AMP_FALLBACK;
    const recoilUpAmp =
      activeCharacter.recoilUpAmp ?? RECOIL_UP_AMP_FALLBACK;
    const recoilTiltAmp =
      activeCharacter.recoilTiltAmp ?? RECOIL_TILT_AMP_FALLBACK;
    const liveCelebs = getActiveCelebrations();
    let recoilAmt = 0;
    for (let i = 0; i < liveCelebs.length; i++) {
      const c = liveCelebs[i];
      if (c.view !== activeView) continue;
      const t0 = wallNow - c.fireTime;
      if (t0 < 0 || t0 > celebRecoilDuration) continue;
      const tNorm = t0 / celebRecoilDuration;
      // Bell: 4 * x * (1 - x) — peaks at 0.5, zeros at 0 and 1. Matches the
      // visual burst's amplitude curve so position + tile-scatter share a beat.
      const env = 4 * tNorm * (1 - tNorm);
      recoilAmt += env * c.intensity;
    }

    recoilOffset.set(0, 0, 0);
    let recoilTilt = 0;
    let recoilForwardScalar = 0;
    let recoilYScalar = 0;
    if (recoilAmt > 1e-5) {
      recoilForwardScalar = -recoilBackAmp * recoilAmt;
      recoilYScalar = recoilUpAmp * recoilAmt;
      recoilOffset.addScaledVector(forward, recoilForwardScalar);
      recoilOffset.y += recoilYScalar;
      camera.position.add(recoilOffset);
      recoilTilt = recoilTiltAmp * recoilAmt;
    }
    appliedRecoil.current.copy(recoilOffset);

    // P3 v29 — idle breath. Slow oscillation that yields to dolly motion so the
    // body's respiration goes silent during transit and returns at rest.
    // P3 v87 — UNIFY #19: NEGATIVE COUPLING #2. The pre-v87 binary threshold gate
    // (restAmount > BREATH_REST_THRESHOLD) plus internal linear ramp is replaced
    // by an EXPLICIT smooth yield via `breathYield = 1 - motionAmount × BREATH_YIELD_MIX`.
    // BREATH_YIELD_MIX=1.0 means breath fully vanishes at peak dolly; at rest it
    // plays at the room's authored per-room amplitude. Second yielding subsystem
    // on the motion field — establishes negative coupling as a category.
    breathOffset.set(0, 0, 0);
    let breathYScalar = 0;
    let breathForwardScalar = 0;
    // P3 v178 — META-PIVOT cut #25: 4th cross-field polarity quadrant NEG×POS
    // opens — CLOSES the cross-field polarity matrix to 4/4. v174 filled
    // NEG×NEG (cursor parallax amount). v175 opened POS×POS (cosmos lane).
    // v176 extended POS×POS canvas→DOM (DOM letter-spacing). v177 opened
    // POS×NEG (floor ripple amp). v178 fills NEG×POS: motion-NEG (breath
    // amplitude yield) × wayfinding-POS (forward·doorway align AMPLIFIES).
    // At rest, gazing down a doorway, the body's idle breath visibly
    // INTENSIFIES toward where you're looking — the room inhales in the
    // direction of intended travel. In motion the v87 amplitude yield still
    // silences it. forward is normalized at line 1099. The cross-field
    // meta-class now spans all four polarity cells from one shared scalar
    // (motion) × one shared vector (forward·COSMOS_DOORWAY_DIR).
    const _breathDoorwayDot =
      forward.x * COSMOS_DOORWAY_DIR[0] +
      forward.y * COSMOS_DOORWAY_DIR[1] +
      forward.z * COSMOS_DOORWAY_DIR[2];
    const _breathDoorwayAlign = _breathDoorwayDot > 0 ? _breathDoorwayDot : 0;
    const BREATH_DOORWAY_AMP_BOOST = 0.55;
    // P3 v190 — META-PIVOT cut #26 (continued): 2ND cross-field × temporal-
    // DERIVATIVE consumer — PROMOTES the derivative meta×meta axis from
    // one-off (v189 audio POS×NEG) to a 2-substrate category (audio +
    // canvas). Lands on v178's NEG×POS breath cell — a different polarity
    // quadrant from v189, so the derivative axis spans 2 quadrants by its
    // 2nd consumer (mirrors v89/v90 promotion pattern). Gating polarity
    // is INVERTED vs v189: the v178 cell is motion-NEG (active at rest),
    // so the derivative carrier is gated by (1 - motionAmount) — only
    // a PARKED listener rotating into the lane gets the punch. _alignDelta
    // is positive-only (swing-IN), so swing-out doesn't fire. Reads as:
    // when standing still and turning toward the doorway, the body's
    // breath momentarily INHALES DEEPER beyond v178's steady boost, then
    // relaxes back as the rotation completes. Cross-field × derivative
    // axis: 1 → 2 consumers, 2 substrates, 2 polarity quadrants.
    const BREATH_CROSS_FIELD_DERIV_DEPTH = 6;
    const _breathAlignDelta = Math.max(0, _breathDoorwayAlign - prevBreathAlignRef.current);
    prevBreathAlignRef.current = _breathDoorwayAlign;
    const _breathCrossFieldDeriv =
      1 + _breathAlignDelta * BREATH_CROSS_FIELD_DERIV_DEPTH * (1 - motionAmount);
    const breathYield =
      (1 - motionAmount * BREATH_YIELD_MIX) *
      (1 + _breathDoorwayAlign * BREATH_DOORWAY_AMP_BOOST * _breathCrossFieldDeriv);
    if (breathYield > 1e-3) {
      // P3 v42 — per-room breath character. Resolve every-frame at rest so
      // crossing into a new room transitions the body's respiration in step
      // with FOV/light/fog/atmosphere settling. Same destination-room lookup
      // pattern as v40 (camera shake) — getRoomView() returns the IN-room.
      const breathCharacter = getCharacterFor(getRoomView());
      const breathYAmp = breathCharacter.breathYAmp ?? BREATH_Y_AMP_FALLBACK;
      const breathForwardAmp = breathCharacter.breathForwardAmp ?? BREATH_FORWARD_AMP_FALLBACK;
      const breathPeriod = breathCharacter.breathPeriod ?? BREATH_PERIOD_FALLBACK;
      // P3 v102 — UNIFY #34: cross-axis convergence (yield × frequency).
      // Breath RATE yields alongside the v87 amplitude yield. Phase
      // accumulator advances at baseAngular × (1 − motionAmount ×
      // BREATH_RATE_YIELD), so during partial motion the breath visibly
      // slows AS it fades — first negative-polarity frequency consumer,
      // first cross-axis cell. Matches the v95/v97 phase-accumulator idiom.
      const baseBreathAngular = (Math.PI * 2) / breathPeriod;
      const breathRateYield = 1 - motionAmount * BREATH_RATE_YIELD;
      breathPhaseRef.current += delta * baseBreathAngular * breathRateYield;
      // P3 v108 — UNIFY #40: publish camera breath phase globally so periodic
      // consumers on other substrates (lintel threshold breath, future floor
      // ripple breath, audio drone tremolo) can PHASE-LOCK to the camera's
      // rhythm. Opens HARMONIC CONVERGENCE meta-class above cross-axis: the
      // field shares not just SCALARS (motion, forward) but TEMPORAL
      // STRUCTURE. Written here, after advancement, so consumers reading on
      // the same frame see the freshest phase.
      setCameraBreathPhase(breathPhaseRef.current);
      // P3 v117 — UNIFY #49: NEG×NEG×NEG 3-meta-class composition on breath
      // body. Lock the separate variable-offset phase toward
      // (breathPhase + motionAmount × -π) at a lock rate that ITSELF yields
      // to motion (NEG cross-axis on rate). At rest motion=0 → both
      // lockStrength gate AND offset go to zero (no variable contribution,
      // preserves v87 at-rest identity). At peak motion the variable phase
      // targets antiphase to the source — but the v87 amplitude yield has
      // already faded the breath toward zero, so the antiphase modulation
      // rides on the dying carrier. Wrap-around-safe shortest-path lerp.
      const _breathVarLockStrength = motionAmount * BREATH_VARIABLE_LOCK_STRENGTH;
      if (_breathVarLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _breathVarTarget = breathPhaseRef.current + motionAmount * BREATH_VARIABLE_OFFSET_PEAK;
        const _breathVarRawDiff = _breathVarTarget - breathVariablePhaseRef.current;
        const _breathVarPhaseDiff = ((_breathVarRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        const _breathVarLockRate = BREATH_VARIABLE_BASE_LERP * _breathVarLockStrength * (1 - motionAmount * BREATH_VAR_RATE_YIELD);
        const _breathVarLockK = 1 - Math.exp(-_breathVarLockRate * delta);
        breathVariablePhaseRef.current += _breathVarPhaseDiff * _breathVarLockK;
      }
      const _breathVarMod = 1 + Math.sin(breathVariablePhaseRef.current) * BREATH_VARIABLE_DEPTH * motionAmount;
      const phase = breathPhaseRef.current;
      breathYScalar = Math.sin(phase) * breathYAmp * breathYield * _breathVarMod;
      breathForwardScalar = Math.cos(phase * 0.5) * breathForwardAmp * breathYield * _breathVarMod;
      breathOffset.y += breathYScalar;
      breathOffset.addScaledVector(forward, breathForwardScalar);
      camera.position.add(breathOffset);
    }
    appliedBreath.current.copy(breathOffset);

    lookWithPitch.copy(currentLook.current);
    lookWithPitch.y += pitchOffset + recoilTilt;
    camera.lookAt(lookWithPitch);

    if (motionAmount > 0.01) {
      const dollyRollAmp = activeCharacter.dollyRollAmp ?? ROLL_AMP_FALLBACK;
      const dollyRollFreq = activeCharacter.dollyRollFreq ?? ROLL_FREQ_FALLBACK;
      const roll = Math.sin(t * dollyRollFreq + 0.7) * dollyRollAmp * motionAmount;
      camera.rotateZ(roll);
    }

    setCameraWorld(camera.position.x, camera.position.y, camera.position.z);

    // P3 v28 — publish panel-rides-camera CSS vars. Sum scalar offsets along
    // the right basis (parallax + shake) and world Y (parallax + shake + recoil).
    // Sign-flip horizontal so the panel translates AGAINST camera motion (camera
    // shifts right → wall appears left → panel translates -dx in viewport).
    // Vertical: world +Y camera shift = wall drops in viewport = panel +dy
    // (CSS y is down-positive). Recoil along forward (negative when receding)
    // → 1 + forward × K stays under 1 = panel shrinks. Updates DOM only when
    // a value changed by ≥0.3px / 0.001 scale to dodge style-recalc thrash.
    if (typeof document !== "undefined") {
      const shiftXWorld = parallaxRightScalar + shakeRightScalar;
      const shiftYWorld = parallaxYScalar + shakeYScalar + recoilYScalar + breathYScalar;
      const panelDxPx = -shiftXWorld * PANEL_PX_PER_WORLD_X;
      const panelDyPx = shiftYWorld * PANEL_PX_PER_WORLD_Y;
      const panelScale = 1 + (recoilForwardScalar + breathForwardScalar) * PANEL_SCALE_K;
      // P3 v88 — UNIFY #20: NEGATIVE COUPLING #3. DOM panel opacity yields to
      // cameraMotion via `panelYield = 1 - motionAmount × PANEL_YIELD_MIX (0.75)`.
      // Published as --app-motion-yield alongside the existing --cam-shift-x/y +
      // --cam-scale, consumed by ActivePanel's Html wrapper opacity. At rest
      // panel reads at full opacity; peak dolly fades to ~25%, so the panel
      // RECEDES from focus exactly as the world ACCELERATES toward the next
      // room. First cut bridging negative-coupling from canvas-space (cursor
      // authority v86, idle breath v87) into DOM-space — proves the polarity
      // axis is universal to the motion field, not canvas-only.
      const panelYield = 1 - motionAmount * PANEL_YIELD_MIX;
      // P3 v92 — UNIFY #24: FIRST POSITIVE-COUPLING DOM consumer. Through v91
      // DOM substrate ONLY yielded (opacity v88, blur v91); canvas substrate
      // both intensified (11 consumers) AND yielded (2). v92 makes DOM carry
      // BOTH polarities by publishing the raw motionAmount as
      // `--app-motion-amount` alongside the existing `--app-motion-yield`.
      // ActivePanel consumes it as letter-spacing widening (text spreads
      // gently during dolly), mirroring how walls fly outward and cosmos
      // accelerates. Same throttled write block, same dedupe pattern,
      // 0.01 threshold matches yield. Polarity now SYMMETRIC across substrates
      // AND across polarities — both substrates carry both polarities,
      // anchored on the SAME scalar. 2×2×2 = 8 consumer slots on the polarity
      // axis (4 filled today: cursor + breath + opacity + blur = yielding;
      // 11 positive-coupling canvas + 1 positive-coupling DOM = 12 intensifying).
      const panelAmount = motionAmount;
      // P3 v105 — UNIFY #37: cross-axis convergence #4 (DOM-side, positive×positive).
      // Drive `panelLetterSpread` as a temporally-smoothed track toward raw
      // motionAmount at an effective lerp rate that itself rises with motion.
      // Frame-rate-independent exp-lerp: k = 1 − exp(−rate × dt). At rest
      // (motion=0): rate = 4.0/s → ~250ms half-life. At peak dolly (motion=1):
      // rate = 4.0 × 1.5 = 6.0/s → ~167ms half-life. ActivePanel multiplies the
      // exposed CSS var by 0.03em peak for letter-spacing widening.
      const _letterSpreadTarget = panelAmount;
      const _letterSpreadRate = LETTER_SPREAD_BASE_LERP * (1 + panelAmount * LETTER_RATE_MIX);
      const _letterSpreadK = 1 - Math.exp(-_letterSpreadRate * delta);
      panelLetterSpreadRef.current += (_letterSpreadTarget - panelLetterSpreadRef.current) * _letterSpreadK;
      const panelLetterSpread = panelLetterSpreadRef.current;
      // P3 v107 — UNIFY #39: cross-axis #6 — DOM blur target YIELDS with
      // motion (NEG amplitude, v91 preserved as the destination), lerp RATE
      // INTENSIFIES with motion (POS rate, new). Target in PIXELS so the
      // smoothed CSS var is directly consumable. At rest motion=0 → target=0,
      // rate=4.0/s → blur eases back to 0 with ~250ms half-life. At peak
      // motion=1 → target=3px, rate=6.0/s → blur snaps in with ~167ms
      // half-life. First NEG×POS cross-axis cell — closes the meta-class
      // polarity matrix to 4/4 quadrants. Replaces v91's direct yield-driven
      // read path; same channel-substitution pattern as v105 vs v92.
      const _blurTarget = (1 - panelYield) * BLUR_PEAK_PX;
      const _blurRate = BLUR_BASE_LERP * (1 + panelAmount * BLUR_RATE_MIX);
      const _blurK = 1 - Math.exp(-_blurRate * delta);
      panelBlurSmoothedRef.current += (_blurTarget - panelBlurSmoothedRef.current) * _blurK;
      const panelBlurSmoothed = panelBlurSmoothedRef.current;
      // P3 v113 — UNIFY #45: PHASE-WITH-VARIABLE-OFFSET on DOM letter-spacing
      // (2nd substrate after v112 cosmos drift — promotes the meta-class to
      // category). Lock target = breathPhaseRef.current + θ(panelAmount),
      // where θ = panelAmount × π so the phase relationship morphs continuously
      // from echo (rest-onset) through quadrature (mid-motion) to answer
      // (peak). breathPhaseRef is the producer-side breath phase that the
      // public getCameraBreathPhase() reads — equivalent value, accessed
      // locally for the same-component case. Modulation factor = (1 + sin ×
      // depth × panelAmount) gates depth on motion so letter-spacing reads
      // pure v105-smoothed at rest, picks up the breath envelope only during
      // transit. Published as `--app-letter-phase-mod`, ActivePanel
      // multiplies into existing letter-spacing calc.
      const _letterCamPhase = breathPhaseRef.current;
      const _letterTheta = panelAmount * LETTER_VARIABLE_OFFSET_PEAK;
      const _letterVarLockStrength = panelAmount * LETTER_VARIABLE_LOCK_STRENGTH;
      if (_letterVarLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _letterVarTarget = _letterCamPhase + _letterTheta;
        const _letterRawDiff = _letterVarTarget - panelLetterPhaseRef.current;
        const _letterPhaseDiff = ((_letterRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        // P3 v114 — v113's lock-lerp rate (strength-gated) is now itself
        // cross-axis yielded: effective rate intensifies multiplicatively with
        // panelAmount via (1 + panelAmount × LETTER_VARIABLE_RATE_MIX). At
        // peak motion the phase-lock snaps in tight (222ms half-life) — same
        // polarity as v107 blur rate. Makes letter-spacing the first
        // 3-meta-class consumer in the field.
        const _letterVarLockRate = LETTER_VARIABLE_BASE_LERP * _letterVarLockStrength * (1 + panelAmount * LETTER_VARIABLE_RATE_MIX);
        const _letterVarLockK = 1 - Math.exp(-_letterVarLockRate * delta);
        panelLetterPhaseRef.current += _letterPhaseDiff * _letterVarLockK;
      }
      const _panelLetterVarMod = 1 + Math.sin(panelLetterPhaseRef.current) * LETTER_VARIABLE_DEPTH * panelAmount;
      // P3 v123 — UNIFY #55: FIXED anti-phase harmonic lock on DOM letter-spacing.
      // Target = breathPhase + π (motion-independent). Mirrors v121 lintel +
      // v122 cosmos verbatim — only lock strength gates with motion. antiMod
      // composes multiplicatively with _panelLetterVarMod at the publish site
      // so DOM consumer sees one phase-mod scalar product. Extends 5-meta-class
      // composition to 3-substrate breadth + crosses substrate-class boundary
      // (canvas → DOM). Polarity reading POS×POS×POS×POS×POS.
      const _panelLetterAntiLockStrength = panelAmount * LETTER_ANTI_LOCK_STRENGTH;
      if (_panelLetterAntiLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _panelLetterAntiTarget = breathPhaseRef.current + Math.PI;
        const _panelLetterAntiRawDiff = _panelLetterAntiTarget - panelLetterAntiPhaseRef.current;
        const _panelLetterAntiPhaseDiff = ((_panelLetterAntiRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        // P3 v126 — UNIFY #58: cross-axis composition on v123 anti-phase
        // LOCK RATE. Mirrors v124/v125 minimal-edit template; extends
        // 6-meta-class composition to 3-substrate breadth + crosses
        // substrate-class boundary (canvas → DOM) in 1 cut. Single-line edit.
        const _panelLetterAntiLockRate = LETTER_ANTI_BASE_LERP * _panelLetterAntiLockStrength * (1 + panelAmount * LETTER_ANTI_RATE_MIX);
        const _panelLetterAntiLockK = 1 - Math.exp(-_panelLetterAntiLockRate * delta);
        panelLetterAntiPhaseRef.current += _panelLetterAntiPhaseDiff * _panelLetterAntiLockK;
      }
      const _panelLetterAntiMod = 1 + Math.sin(panelLetterAntiPhaseRef.current) * LETTER_ANTI_DEPTH * panelAmount;
      // P3 v129 — UNIFY #61: 7th structurally distinct meta-class on DOM
      // letter-spacing. Sliding-quadrature target (camPhase + panelAmount × π/2)
      // slides slower than v113's anti-phase target (× π); only lock STRENGTH
      // gates with motion. Folds into panelLetterPhaseMod product as 3rd
      // multiplicand. Promotes 7-META-CLASS COMPOSITION to 3-substrate breadth
      // + crosses substrate-class boundary (canvas → DOM) in 1 cut. Mirrors
      // v127/v128 minimal-edit template verbatim.
      const _panelLetterQuadLockStrength = panelAmount * LETTER_QUAD_LOCK_STRENGTH;
      if (_panelLetterQuadLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _panelLetterQuadTarget = breathPhaseRef.current + panelAmount * (Math.PI / 2);
        const _panelLetterQuadRawDiff = _panelLetterQuadTarget - panelLetterQuadPhaseRef.current;
        const _panelLetterQuadPhaseDiff = ((_panelLetterQuadRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        // P3 v132 — UNIFY #64: cross-axis composition on v129 sliding-quadrature LOCK RATE.
        // Mirrors v131 cosmos pattern + v130 lintel pattern verbatim. Closes the
        // cross-axis-on-rate ladder across DOM letter-spacing's three lock loops
        // (v114 variable-offset, v126 anti-phase, v132 sliding-quadrature) —
        // TRIPLE-PARALLEL ladder closure across three substrates in 3 cuts.
        const _panelLetterQuadLockRate = LETTER_QUAD_BASE_LERP * _panelLetterQuadLockStrength * (1 + panelAmount * LETTER_QUAD_RATE_MIX);
        const _panelLetterQuadLockK = 1 - Math.exp(-_panelLetterQuadLockRate * delta);
        panelLetterQuadPhaseRef.current += _panelLetterQuadPhaseDiff * _panelLetterQuadLockK;
      }
      const _panelLetterQuadMod = 1 + Math.sin(panelLetterQuadPhaseRef.current) * LETTER_QUAD_DEPTH * panelAmount;
      // P3 v135 — UNIFY #67: SUB-HARMONIC (OCTAVE) voice on DOM letter-spacing,
      // mirroring v133 lintel + v134 cosmos verbatim. Octave target =
      // (breathPhase × 2) mod 2π — first frequency-multiplied voice on DOM
      // substrate, structurally novel at the harmonic level itself (not just
      // phase-offset level). Wrap-around-safe shortest-path diff + exp-lerp
      // settled into panelLetterOctavePhaseRef. Closes the field's first
      // 3-substrate harmonic-multiplication-ladder rung in 3 cuts (v133/v134/v135).
      const _panelLetterOctaveLockStrength = panelAmount * LETTER_OCTAVE_LOCK_STRENGTH;
      if (_panelLetterOctaveLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _panelLetterOctaveTarget = ((breathPhaseRef.current * 2) % TWO_PI + TWO_PI) % TWO_PI;
        const _panelLetterOctaveRawDiff = _panelLetterOctaveTarget - panelLetterOctavePhaseRef.current;
        const _panelLetterOctavePhaseDiff = ((_panelLetterOctaveRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        const _panelLetterOctaveLockRate = LETTER_OCTAVE_BASE_LERP * _panelLetterOctaveLockStrength;
        const _panelLetterOctaveLockK = 1 - Math.exp(-_panelLetterOctaveLockRate * delta);
        panelLetterOctavePhaseRef.current += _panelLetterOctavePhaseDiff * _panelLetterOctaveLockK;
      }
      const _panelLetterOctaveMod = 1 + Math.sin(panelLetterOctavePhaseRef.current) * LETTER_OCTAVE_DEPTH * panelAmount;
      // P3 v138 — UNIFY #70: 3rd-harmonic voice on DOM letter-spacing. Target =
      // (breathPhase × 3) mod 2π — second rung on the harmonic-multiplication
      // ladder reaches DOM, completing DEPTH-2-BREADTH-3 bifurcation matrix.
      // Wrap-around-safe shortest-path diff + exp-lerp settled into
      // panelLetter3rdPhaseRef. Folded as 6th multiplicand on the compose —
      // panelLetterPhaseMod becomes a 10-meta-class field consumer on DOM.
      const _panelLetter3rdLockStrength = panelAmount * LETTER_3RD_LOCK_STRENGTH;
      if (_panelLetter3rdLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _panelLetter3rdTarget = ((breathPhaseRef.current * 3) % TWO_PI + TWO_PI) % TWO_PI;
        const _panelLetter3rdRawDiff = _panelLetter3rdTarget - panelLetter3rdPhaseRef.current;
        const _panelLetter3rdPhaseDiff = ((_panelLetter3rdRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        const _panelLetter3rdLockRate = LETTER_3RD_BASE_LERP * _panelLetter3rdLockStrength;
        const _panelLetter3rdLockK = 1 - Math.exp(-_panelLetter3rdLockRate * delta);
        panelLetter3rdPhaseRef.current += _panelLetter3rdPhaseDiff * _panelLetter3rdLockK;
      }
      const _panelLetter3rdMod = 1 + Math.sin(panelLetter3rdPhaseRef.current) * LETTER_3RD_DEPTH * panelAmount;
      // P3 v141 — UNIFY #73: 4th-harmonic voice on DOM letter-spacing. Target =
      // (breathPhase × 4) mod 2π — third rung on the harmonic-multiplication
      // ladder reaches DOM, completing DEPTH-3-BREADTH-3 bifurcation matrix.
      // Wrap-around-safe shortest-path diff + exp-lerp settled into
      // panelLetter4thPhaseRef. Folded as 7th multiplicand on the compose —
      // panelLetterPhaseMod becomes a 11-meta-class field consumer on DOM.
      const _panelLetter4thLockStrength = panelAmount * LETTER_4TH_LOCK_STRENGTH;
      if (_panelLetter4thLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _panelLetter4thTarget = ((breathPhaseRef.current * 4) % TWO_PI + TWO_PI) % TWO_PI;
        const _panelLetter4thRawDiff = _panelLetter4thTarget - panelLetter4thPhaseRef.current;
        const _panelLetter4thPhaseDiff = ((_panelLetter4thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        const _panelLetter4thLockRate = LETTER_4TH_BASE_LERP * _panelLetter4thLockStrength;
        const _panelLetter4thLockK = 1 - Math.exp(-_panelLetter4thLockRate * delta);
        panelLetter4thPhaseRef.current += _panelLetter4thPhaseDiff * _panelLetter4thLockK;
      }
      const _panelLetter4thMod = 1 + Math.sin(panelLetter4thPhaseRef.current) * LETTER_4TH_DEPTH * panelAmount;
      // P3 v144 — UNIFY #76: 5th-harmonic voice on DOM letter-spacing. Target =
      // (breathPhase × 5) mod 2π — fourth rung on the harmonic-multiplication
      // ladder reaches DOM, completing DEPTH-4-BREADTH-3 bifurcation matrix at
      // 12 of 12 cells. Wrap-around-safe shortest-path diff + exp-lerp settled
      // into panelLetter5thPhaseRef. Folded as 8th multiplicand on the compose —
      // panelLetterPhaseMod becomes a 12-meta-class field consumer on DOM.
      const _panelLetter5thLockStrength = panelAmount * LETTER_5TH_LOCK_STRENGTH;
      if (_panelLetter5thLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _panelLetter5thTarget = ((breathPhaseRef.current * 5) % TWO_PI + TWO_PI) % TWO_PI;
        const _panelLetter5thRawDiff = _panelLetter5thTarget - panelLetter5thPhaseRef.current;
        const _panelLetter5thPhaseDiff = ((_panelLetter5thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        const _panelLetter5thLockRate = LETTER_5TH_BASE_LERP * _panelLetter5thLockStrength;
        const _panelLetter5thLockK = 1 - Math.exp(-_panelLetter5thLockRate * delta);
        panelLetter5thPhaseRef.current += _panelLetter5thPhaseDiff * _panelLetter5thLockK;
      }
      const _panelLetter5thMod = 1 + Math.sin(panelLetter5thPhaseRef.current) * LETTER_5TH_DEPTH * panelAmount;
      // P3 v147 — UNIFY #79: 6th-harmonic voice on DOM letter-spacing. Target =
      // (breathPhase × 6) mod 2π — fifth rung on the harmonic-multiplication
      // ladder reaches DOM, completing DEPTH-5-BREADTH-3 bifurcation matrix at
      // 15 of 15 cells. Wrap-around-safe shortest-path diff + exp-lerp settled
      // into panelLetter6thPhaseRef. Folded as 9th multiplicand on the compose —
      // panelLetterPhaseMod becomes a 13-meta-class field consumer on DOM.
      const _panelLetter6thLockStrength = panelAmount * LETTER_6TH_LOCK_STRENGTH;
      if (_panelLetter6thLockStrength > 1e-4) {
        const TWO_PI = Math.PI * 2;
        const _panelLetter6thTarget = ((breathPhaseRef.current * 6) % TWO_PI + TWO_PI) % TWO_PI;
        const _panelLetter6thRawDiff = _panelLetter6thTarget - panelLetter6thPhaseRef.current;
        const _panelLetter6thPhaseDiff = ((_panelLetter6thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
        const _panelLetter6thLockRate = LETTER_6TH_BASE_LERP * _panelLetter6thLockStrength;
        const _panelLetter6thLockK = 1 - Math.exp(-_panelLetter6thLockRate * delta);
        panelLetter6thPhaseRef.current += _panelLetter6thPhaseDiff * _panelLetter6thLockK;
      }
      const _panelLetter6thMod = 1 + Math.sin(panelLetter6thPhaseRef.current) * LETTER_6TH_DEPTH * panelAmount;
      const panelLetterPhaseMod = _panelLetterVarMod * _panelLetterAntiMod * _panelLetterQuadMod * _panelLetterOctaveMod * _panelLetter3rdMod * _panelLetter4thMod * _panelLetter5thMod * _panelLetter6thMod;
      // P3 v165 — META-PIVOT cut #15: wayfinding crosses CANVAS→DOM. v158–v164
      // grew the doorway-direction channel across SIX substrates (cosmos slabs,
      // floor ripple, wall accents, atmospheric particles, lintel emissive,
      // audio drone pan) and TWO rendering domains (canvas + audio). v165
      // plants the channel in the THIRD domain — DOM — by publishing
      // COSMOS_DOORWAY_DIR's X and Z components as `--app-doorway-x` and
      // `--app-doorway-z` on documentElement. ActivePanel's transform appends a
      // subtle `translate3d(var(--app-doorway-x) * 6px, 0, var(--app-doorway-z)
      // * 6px)` so the DOM panel drifts toward each room's open doorways. Same
      // throttled write block as the v88+v92+v105+v107+v113 family; epsilon
      // 0.01 matches motion-yield/amount.
      // v206 — motion-amplified panel doorway translate. v165 baseline at
      // rest (motion=0 → multiplier=1, panel translate matches v165 exactly).
      // Peak motion (motion=1 → multiplier=2.0) → panel reaches further
      // toward doorway during transit, retracts as motion decays. Mirrors
      // v203 body / v205 gaze on the SAME COSMOS_DOORWAY_DIR axis, closing
      // the doorway-direction motion-amplified channel to a 3-substrate
      // / 2-domain category (canvas body + canvas gaze + DOM panel).
      const _panelDoorwayMotion = 1 + getCameraMotion() * DOM_DOORWAY_PULL;
      const panelDoorwayX = COSMOS_DOORWAY_DIR[0] * _panelDoorwayMotion;
      const panelDoorwayZ = COSMOS_DOORWAY_DIR[2] * _panelDoorwayMotion;
      // v173 — DOM panel opacity yields to doorway-alignment. Re-dot
      // camera-forward against COSMOS_DOORWAY_DIR (forward already normalized
      // post-lerp at line ~1047). Yield value sits in [1-DOM_DOORWAY_YIELD_MIX, 1].
      const _panelDoorwayDot =
        forward.x * COSMOS_DOORWAY_DIR[0] +
        forward.y * COSMOS_DOORWAY_DIR[1] +
        forward.z * COSMOS_DOORWAY_DIR[2];
      const _panelDoorwayAlign = _panelDoorwayDot > 0 ? _panelDoorwayDot : 0;
      const panelDoorwayYield = 1 - _panelDoorwayAlign * DOM_DOORWAY_YIELD_MIX;
      // P3 v222 — ENVIRONMENTAL source crosses out of canvas+audio into the
      // DOM substrate for the FIRST time across all 11 prior env-source cuts
      // (v211–v221). Mirrors v77→v88: cameraMotion opened canvas (v77), audio
      // (v77 again), then bridged into DOM at v88 — env-source walks the same
      // canvas→audio→DOM arc (canvas v211–v220, audio v221, DOM v222). After
      // v222 env-source matches cameraMotion's full 3-domain breadth and
      // becomes the SECOND signal source to span every rendering domain. The
      // wall-clock scalar publishes as `--app-day-warmth` and is consumed by
      // ActivePanel's filter as a tiny hue-rotate term (warm tilt at day,
      // cool tilt at night). Throttle threshold 0.005 is tighter than other
      // vars because dayWarmth drifts slowly (sinusoidal over 24h) — coarser
      // thresholds would stick visibly between writes.
      const panelDayWarmth = getDayWarmth();
      if (
        Math.abs(panelDxPx - lastPanelVars.current.dx) > 0.3 ||
        Math.abs(panelDyPx - lastPanelVars.current.dy) > 0.3 ||
        Math.abs(panelScale - lastPanelVars.current.scale) > 0.001 ||
        Math.abs(panelYield - lastPanelVars.current.yield) > 0.01 ||
        Math.abs(panelAmount - lastPanelVars.current.amount) > 0.01 ||
        Math.abs(panelLetterSpread - lastPanelVars.current.letterSpread) > 0.01 ||
        Math.abs(panelBlurSmoothed - lastPanelVars.current.blurSmoothed) > 0.03 ||
        Math.abs(panelLetterPhaseMod - lastPanelVars.current.letterPhaseMod) > 0.01 ||
        Math.abs(panelDoorwayX - lastPanelVars.current.doorwayX) > 0.01 ||
        Math.abs(panelDoorwayZ - lastPanelVars.current.doorwayZ) > 0.01 ||
        Math.abs(panelDoorwayYield - lastPanelVars.current.doorwayYield) > 0.01 ||
        Math.abs(_panelDoorwayAlign - lastPanelVars.current.doorwayAlign) > 0.01 ||
        Math.abs(panelDayWarmth - lastPanelVars.current.dayWarmth) > 0.005
      ) {
        const root = document.documentElement.style;
        root.setProperty("--cam-shift-x", `${panelDxPx.toFixed(2)}px`);
        root.setProperty("--cam-shift-y", `${panelDyPx.toFixed(2)}px`);
        root.setProperty("--cam-scale", panelScale.toFixed(4));
        root.setProperty("--app-motion-yield", panelYield.toFixed(3));
        root.setProperty("--app-motion-amount", panelAmount.toFixed(3));
        root.setProperty("--app-letter-spread", panelLetterSpread.toFixed(3));
        root.setProperty("--app-blur-smoothed", panelBlurSmoothed.toFixed(3));
        root.setProperty("--app-letter-phase-mod", panelLetterPhaseMod.toFixed(3));
        root.setProperty("--app-doorway-x", panelDoorwayX.toFixed(3));
        root.setProperty("--app-doorway-z", panelDoorwayZ.toFixed(3));
        root.setProperty("--app-doorway-yield", panelDoorwayYield.toFixed(3));
        // P3 v176 — META-PIVOT cut #23: bridge cross-field POS×POS quadrant
        // canvas→DOM. v175 opened POS×POS on cosmos shader (motion-POS amp ×
        // wayfinding-POS lane). v176 mirrors v173's NEG canvas→DOM bridge in
        // the opposite polarity by publishing the positive-clamped
        // doorway-alignment scalar. ActivePanel multiplies its existing
        // motion-POS letter-spacing by (1 + var(--app-doorway-align) × K),
        // creating the first 2-domain consumer in the POS×POS cross-field
        // quadrant (cosmos shader canvas + DOM letter-spacing). Same scalar
        // _panelDoorwayAlign feeds the v173 yield var multiplicatively below;
        // a single dot product now drives BOTH polarity bridges into DOM.
        root.setProperty("--app-doorway-align", _panelDoorwayAlign.toFixed(3));
        // v188 — META-PIVOT cut #25: publish camera-breath PHASE-CARRIER
        // (sin of breathPhaseRef) as a CSS var so DOM consumers can join
        // the cross-field × harmonic-convergence axis. v186 opened that
        // axis on audio (drone POS×POS pulses on tremoloPhase, breath-
        // locked via v110); v187 promoted it to category by adding a
        // canvas consumer (floor POS×NEG pulses on getCameraBreathPhase).
        // v188 crosses the SAME carrier into the DOM substrate via a
        // single new var, enabling the 3rd cross-field × harmonic consumer
        // in ActivePanel and bringing the harmonic axis to 3/3 substrate
        // saturation (canvas + audio + DOM). Publishing sin(phase) rather
        // than raw phase keeps DOM-side math to a single multiply.
        const _panelBreathCarrier = Math.sin(breathPhaseRef.current);
        root.setProperty("--app-breath-phase", _panelBreathCarrier.toFixed(3));
        // v191 — META-PIVOT cut #28: publish doorway-align RATE-OF-CHANGE so
        // DOM consumers can join cross-field × temporal-DERIVATIVE axis (the
        // 2nd meta×meta axis above the lit cross-field grid, opened by v189
        // audio POS×NEG and promoted to category by v190 canvas NEG×POS).
        // Positive-only delta (swing-INTO-lane) preserves the asymmetric
        // "arrival punch" texture; swing-out clamps to 0. Throttle cadence
        // is fine — derivative is sampled at the same rate the var is read.
        // v191 saturates axis-2 to 3/3 substrates matching axis-1 (audio +
        // canvas + DOM). Single new var, single DOM consumer in ActivePanel
        // on the open POS×POS quadrant (motion-active × doorway-positive).
        const _panelAlignDelta = Math.max(0, _panelDoorwayAlign - lastPanelVars.current.doorwayAlign);
        root.setProperty("--app-doorway-align-deriv", _panelAlignDelta.toFixed(3));
        // v197 — META-PIVOT cut #34: publish PHASE-OFFSET carrier (sin of
        // breathPhase shifted by π·(1-doorwayAlign)) so DOM consumers can
        // join the meta×meta axis-3 (cross-field × phase-offset) opened by
        // audio v195 (drone NEG×NEG pitch detune) and promoted to category
        // by canvas v196 (floor POS×NEG yield). Same scalar formula as
        // audio/canvas — wave anti-phase at fully off-axis, in-phase at
        // fully aligned. ActivePanel saturate cell (pure NEG×NEG yield)
        // consumes this var to flutter desaturation timing with alignment.
        // SATURATES axis-3 to 3/3 substrates (audio + canvas + DOM),
        // completing the 5TH PROMOTION ARC INSTANCE. Single new var,
        // single new DOM consumer on the open NEG×NEG quadrant mirroring
        // audio v195's polarity quadrant exactly.
        const _panelBreathPhaseOffset = Math.sin(
          breathPhaseRef.current + Math.PI * (1 - _panelDoorwayAlign),
        );
        root.setProperty("--app-breath-phase-offset", _panelBreathPhaseOffset.toFixed(3));
        // P3 v222 — first DOM consumer of env-source wall-clock scalar.
        // Published as a unit-interval [0,1] var so ActivePanel can derive
        // ±3° hue-rotate via calc((var() - 0.5) * 6deg) — neutral mid-day, warm
        // at peak afternoon, cool at deep night. Same wall-clock substrate as
        // v211–v221 canvas/audio consumers; symmetrical anchor pair pattern.
        root.setProperty("--app-day-warmth", panelDayWarmth.toFixed(3));
        lastPanelVars.current.dx = panelDxPx;
        lastPanelVars.current.dy = panelDyPx;
        lastPanelVars.current.scale = panelScale;
        lastPanelVars.current.yield = panelYield;
        lastPanelVars.current.amount = panelAmount;
        lastPanelVars.current.letterSpread = panelLetterSpread;
        lastPanelVars.current.blurSmoothed = panelBlurSmoothed;
        lastPanelVars.current.letterPhaseMod = panelLetterPhaseMod;
        lastPanelVars.current.doorwayX = panelDoorwayX;
        lastPanelVars.current.doorwayZ = panelDoorwayZ;
        lastPanelVars.current.doorwayYield = panelDoorwayYield;
        lastPanelVars.current.doorwayAlign = _panelDoorwayAlign;
        lastPanelVars.current.dayWarmth = panelDayWarmth;
      }
    }

    if (process.env.NODE_ENV !== "production") {
      const w = window as unknown as {
        __camera?: THREE.Camera;
        __scene?: THREE.Scene;
        __shake?: { shakeAmt: number; recoilAmt: number };
      };
      w.__camera = camera;
      w.__scene = state.scene;
      w.__shake = { shakeAmt, recoilAmt };
    }
  });

  return null;
}
