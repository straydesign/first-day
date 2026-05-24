"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getCameraBreathPhase, getCameraForward, getCameraMotion, getCharacterFor, getPulse, useRoomView } from "./RoomRegistry";
import { COSMOS_POSITIONS } from "./cosmosPositions";
import { COSMOS_ACTIVATION } from "./cosmosActivation";
import { COSMOS_DOORWAY_DIR } from "./cosmosDoorwayDir";
import { getProgressFraction } from "./progressIntent";
import { getPresence } from "./presenceIntent";
import { getOwnVisitorCount, getOwnRoomReactionPulse } from "./presencePulseIntent";
import { getDayWarmth } from "./timeOfDayIntent";

/**
 * P2 v68 — TILE COSMOS / VOID FIELD.
 *
 * VISION explicitly forbids flat backdrops ("not bg-black"). Pre-v68 the
 * persistent Canvas had a literal `<color attach="background" args={["#000000"]} />`
 * — the deepest layer of the entire shell WAS the flat backdrop VISION names.
 *
 * v68 replaces that with a per-room cloud of distant emissive tile-points
 * scattered on a thick spherical shell around the room volume (radius 12–30u,
 * past the wall surfaces but within typical fogFar so atmosphere tints them).
 * Tiles are instanced — one InstancedMesh, count up to the largest per-room
 * voidTileCount. Per-frame: hidden instances scaled to 0; visible instances
 * scaled to a small jitter; the entire shell rotates around Y at voidTileDrift
 * rad/s.
 *
 * Tiles emit strongly (emissiveIntensity ≈ 1.8) so they read through fog as
 * distant glowing fragments, NOT as flat colored screen pixels. The whole
 * field is occluded by the active room's walls — you only glimpse it through
 * doorway openings and during the wall-pulse, which is precisely the moment
 * VISION says we MUST not have a flat backdrop.
 *
 * Floor/ceiling occlusion is intentional: the void is the lateral cosmos
 * outside the room, not the sky and not the foundation.
 */

const MAX_VOID_TILES = 720; // ceiling above the largest per-room voidTileCount (600)
const SHELL_INNER = 12;
const SHELL_OUTER = 30;
const TILE_SIZE = 0.55;

// P2 v75 — UNIFY #7: cosmos rotation axis tilts toward camera forward.
// At rest the axis is world-Y (classic horizontal drift); at full dolly the
// axis lerps 60% toward the camera's world-forward vector, then normalized.
// rotateOnWorldAxis spins the whole shell around that tilted axis — visually
// the cosmos "rolls" in the direction the camera is heading during transit.
// FIRST spatial directional coupling in the unified motion field; all six
// prior UNIFY cuts (#1–#6) carried only scalar speed/intensity.
const TILT_AMP = 0.6;
const TILT_AXIS_Y = new THREE.Vector3(0, 1, 0);
const TILT_AXIS = new THREE.Vector3();
const FWD_VEC = new THREE.Vector3();

// P2 v79 — UNIFY #11: cosmos shell per-instance emissive ramps with
// dot(instanceWorldPos − cameraPosition, cameraForward) × cameraMotion.
// FIRST shader-level cut on the unified motion field — every prior UNIFY cut
// (#1–#10) lived in JS uniform-set / CPU per-frame transform code. v79 pushes
// the directional channel down into GLSL so each of the 720 instances reads
// its own brightness from its own world-space position.
//
// At rest (cameraMotion=0): multiplier = 1.0 universally — material looks
// identical to v78 baseline.
// At full dolly: front cosmos (d=+1) → 1.7× brighter, back cosmos (d=-1)
// → 0.3× dimmer. Visually PROVES v75's axis tilt by making the leading
// hemisphere of the cosmos glow harder than the trailing hemisphere — the
// camera flies into a brightening wall of tiles.
const VOID_EMISSIVE_RAMP_AMP = 0.7;

// P3 v90 — UNIFY #22: cosmos shell emissive COLOR warms toward shared
// `#ff9966` warm anchor with cameraMotion. FOURTH consumer on the COLOR axis
// after v84 (fog/bg), v85 (lights), and v89 (wall accents). Closes the
// color chord across all major rendered substrates — atmosphere + wall
// geometry + void/sky now all warm toward the SAME hex at the SAME time
// driven by the SAME scalar. v90 is a CPU-side cut (mirrors v84/v85's
// THREE.Color.lerp pattern, not v89's shader-injection pattern) because
// the cosmos uses a single `material.emissive` Color shared across all 720
// instances — one CPU lerp updates everyone for free, no per-instance attr
// needed. COSMOS_WARMTH_MIX (0.30) is slightly less than FOG_WARMTH_MIX /
// ACCENT_WARMTH_MIX (0.45) because the cosmos is the deepest-layer field
// against which the entire room reads — overwarming would saturate the
// scene's farthest geometry and clobber per-room voidTileColor identity
// (privacy slate-blue, congrats rose-gold, calendar cool-cyan all need to
// survive at peak dolly). The warm-anchor lerp fires on `targetEmissive`
// BEFORE the per-frame `material.emissive.lerp(targetEmissive, k)` so both
// the room hue settling AND the motion-warming compose through the same
// time-constant smoother (mirrors AtmosphereDriver v84 exactly).
const COSMOS_WARMTH_MIX = 0.30;
const COSMOS_WARM_ANCHOR = new THREE.Color("#ff9966");
// P3 v211 — ENVIRONMENTAL signal source. Day/night anchors for the wall-clock
// hue pull. Warm peak (#c89072) at 15:00 reads as late-afternoon copper;
// cool trough (#4a4868) at 03:00 reads as pre-dawn slate. Pull strength
// (0.12) deliberately less than v90's 0.30 cameraMotion pull — at-rest hue
// reads as time-of-day-tinted; full dolly still drives the warm shift to
// #ff9966. Both lerps stack on `targetEmissive` BEFORE the per-frame
// smoothing, so the cosmos at any moment encodes time-of-day × motion as
// orthogonal color channels on the SAME tile substrate.
const COSMOS_DAY_WARM = new THREE.Color("#c89072");
const COSMOS_NIGHT_COOL = new THREE.Color("#4a4868");
const COSMOS_TIME_OF_DAY_MIX = 0.12;
// P3 v217 — ENVIRONMENTAL source's NON-COLOR axis (intensity/reach magnitude)
// saturates to 3-substrate breadth, matching the v211/v212/v213 color-axis
// breadth of 3 substrates. v215 opened the axis on atmosphere (fog.far reach);
// v216 promoted to category (lights baseline intensity); v217 extends to
// COSMOS emissiveIntensity baseline — same magnitude metaphor, deepest visible
// layer. After v217 the env-source's two axes are structurally symmetric:
// cosmos / atmosphere / lights all carry env-source on color (v211/v212/v213)
// AND now atmosphere / lights / cosmos all carry env-source on magnitude
// (v215/v216/v217). ±10% chosen tighter than v216's ±12% and v215's ±15%
// because cosmos sits behind everything — a small emissive baseline shift
// reads boldly through the fog at the deepest layer. At 03:00 cosmos baseline
// dims to 90% (deep void); at 15:00 lifts to 110% (luminous depth). Compounds
// multiplicatively under v70's pulse boost and v210's presence dampening, so
// the full chain at peak afternoon + pulse + present is BASE × 1.10 × 1.8 × 1.0.
const COSMOS_INTENSITY_NIGHT_SCALE = 0.90;
const COSMOS_INTENSITY_DAY_SCALE = 1.10;
// P3 v218 — ENVIRONMENTAL source OPENS ITS THIRD AXIS. v211-v213 saturated
// env-source on COLOR (3 substrates); v215-v217 saturated it on MAGNITUDE (3
// substrates: reach, intensity, intensity). Both axes describe the rendering
// dimension of WHAT-the-substrate-looks-like. v218 opens a structurally
// distinct axis: TEMPORAL/VELOCITY — the rate at which autonomous motion
// progresses. Cosmos drift base rate (the void's continuous rotation) is the
// natural opener: it's already the canvas's clearest autonomous motion source,
// and tying drift rate to wall-clock makes time-of-day audible-in-motion. At
// 03:00 the cosmos drifts at 85% baseline — dreamier, slower, the night
// universe is HEAVIER. At 15:00 it drifts at 115% — more energetic, daytime
// universe runs faster. cameraMotion has long lived on the temporal axis
// (v71 cosmos accelerates during dolly, v109+ rate-yield smoothing), but no
// non-motion source had reached this axis. v218 is the env-source equivalent
// of v71 — the opener move on the third dimension. After v218 the source ×
// axis cube fills its third column (env-source: color × 3 + magnitude × 3 +
// temporal × 1), making env-source the second source with multi-axis breadth
// across all three rendering dimensions.
const COSMOS_DRIFT_NIGHT_SCALE = 0.85;
const COSMOS_DRIFT_DAY_SCALE = 1.15;
// P3 v227 — env-source SPATIAL axis opens its 3rd substrate on cosmos shell Y
// offset. Before v227 SPATIAL was the laggard column (lights Y v224 + particle
// field Y v225 = 2 substrates) while color hit 5, magnitude hit 4, temporal hit
// 5. Cosmos shell joins as 3rd SPATIAL substrate — at 03:00 the cosmos sits
// below the horizon line (-1.5) and at 15:00 it lifts to +1.5, so the sky
// itself traces the sun-arc silhouette that lights (v224) and particles (v225)
// already trace. Same silhouette across three substrates UNIFIES the day cycle
// into a single overhead reach: low+cool+dim at night, high+warm+bright at day.
// This makes cosmos the FIRST 4-axis env-source substrate (color v211 +
// magnitude v217 + temporal v218 + SPATIAL v227) — no other substrate has yet
// reached all four rendering dimensions on env-source. ±1.5 unit swing chosen
// narrow because cosmos shell is large/distant — wider swings would visibly
// drift the sky away from the room frame and break the always-encompassing
// dome illusion.
const COSMOS_Y_NIGHT = -1.5;
const COSMOS_Y_DAY = 1.5;
// P3 v232 — env-source MATERIAL axis PROMOTES to 2-substrate category. v231
// opened the 5TH env-source axis (MATERIAL/BRDF) on wall tiles via roughness
// × dayWarmth (Room.tsx). v232 extends MATERIAL to a SECOND substrate by
// modulating cosmos shell tile roughness against its 0.55 baseline. This
// single cut produces THREE structural firsts simultaneously: (1) MATERIAL
// axis breadth 1 → 2 substrates — the standard one-off → category promotion
// arc that every prior env-source axis followed. (2) Cosmos already held
// 4-axis env-source status (color v211 + magnitude v217 + temporal v218 +
// SPATIAL v227); adding MATERIAL makes cosmos the FIRST 5-AXIS env-source
// substrate in the system — saturating the cosmos to every env-source axis
// the matrix offers. (3) Walls + cosmos sharing the same MATERIAL polarity
// (NIGHT rougher / DAY smoother) locks the indoor mass and the outer void
// to the same BRDF rhythm: at midnight everything reads matte and soft,
// at peak afternoon everything reads crisp and glossy. Per CRITICAL
// `feedback_loop-vision-first-deep-cuts.md` + `feedback_first-day-unify-
// not-differentiate.md` — opening a SECOND consumer on a new axis and
// pushing a substrate to maximum axis-count in the same edit is deeper
// than two separate cuts that don't compound. ±0.05 delta matches v231
// exactly so the two substrates breathe at identical BRDF amplitude —
// cosmos baseline 0.55 swings to [0.50, 0.60]. Material.roughness updates
// as a uniform without shader recompile, leaving the onBeforeCompile-
// authored emissive ramp / activation amp / doorway-lane shader code
// untouched.
const COSMOS_ROUGHNESS_NIGHT_DELTA = 0.05;
const COSMOS_ROUGHNESS_DAY_DELTA = -0.05;
const COSMOS_ROUGHNESS_BASE = 0.55;
// P3 v106 — UNIFY #38: cross-axis convergence #5 (cosmos, MIXED POLARITY:
// positive amplitude × negative rate). The 5th cross-axis cell opens the FIRST
// MIXED-POLARITY quadrant of the meta-class matrix. v71 already couples cosmos
// drift POSITIVELY to cameraMotion (cameraBoost = 1 + 1.6 × camMotion → drift
// speed targets accelerate ~2.6× at peak dolly). Through v105 cross-axis only
// occupied SAME-polarity cells: 2× neg×neg (breath body, cursor input) and
// 2× pos×pos (wall accent, DOM text). v106 inverts the second-axis polarity
// against the first: positive amplitude on drift target, NEGATIVE rate on the
// lerp toward that target. Cosmos drift is no longer instantaneously read each
// frame — a smoothed drift scalar lerps toward the per-frame target at
// `effectiveRate = COSMOS_DRIFT_BASE_LERP × (1 − camMotion × COSMOS_RATE_YIELD)`.
// At rest motion=0 → 4.0/s rate (~250ms half-life — cosmos snaps to per-room
// drift identity quickly). At peak dolly motion=1 → 2.0/s rate (~500ms half-
// life — cosmos LAGS reaching its accelerated target). Reads as the void having
// inertia that motion STRENGTHENS: when you start a dolly the cosmos lags
// catching up, when you stop the cosmos lags settling back. Cross-axis matrix
// state after v106: 3/4 polarity quadrants filled (2× neg×neg + 2× pos×pos +
// 1× pos×neg), reserves v107 for the 4th quadrant (neg×pos: a yielding-
// amplitude consumer gets a positive-rate cross-axis partner). COSMOS_RATE_YIELD
// matches BREATH/CURSOR/WARM rate mixes (0.5) for cross-substrate consistency.
const COSMOS_RATE_YIELD = 0.5;
const COSMOS_DRIFT_BASE_LERP = 4.0;

// P3 v112 — UNIFY #44: OPENS PHASE-WITH-VARIABLE-OFFSET meta-class above the
// HARMONIC CONVERGENCE meta-class. Through v111 the harmonic meta-class
// crystallized with 4 substrates at FIXED phase offsets — lintel breath (v108,
// θ=0 in-phase echo), floor wave (v109, θ=0), audio drone tremolo (v110, θ=0),
// atmospheric particles (v111, θ=π anti-phase answer). Every cut so far chose
// a discrete-fixed phase relationship (0 OR π). v112 parametrizes the phase
// OFFSET ITSELF by cameraMotion — θ(camMotion) = camMotion × π — so at rest
// the cosmos drift phase-locks in-phase echo (θ=0) and at peak dolly it
// continuously morphs to anti-phase answer (θ=π). The phase RELATIONSHIP
// becomes a continuous-spectrum primitive of the field, not a fixed binary
// choice per cut. This is a META-META-CLASS lift: above harmonic
// (consumer-phase-tracks-camera-phase) sits variable-offset (consumer-phase-
// tracks-camera-phase + θ where θ is itself a field consumer of cameraMotion).
// Cosmos shell drift is the ideal first substrate because (a) it ALREADY
// carries a v106 smoothed rate-yielded read of cameraMotion (so a multiplicative
// variableMod composes cleanly with the existing smoothing without recomputing
// the target), (b) it's the deepest-layer field — a continuously-morphing
// phase relationship on the cosmos is what every other harmonic substrate
// reads against, and (c) cosmos already has its own free-running motion via
// rotateOnWorldAxis × drift — adding a phase oscillator that modulates the
// drift magnitude rides the EXISTING per-frame integrator (no new accumulator
// needed for the visual output, only for the phase tracking). Math identical
// to v108/v109/v110/v111 lerp idiom except `targetPhase = camBreathPhase +
// camMotion × VARIABLE_OFFSET_PEAK` continuously varies. Depth 0.4 matches
// peer harmonic substrates; lock 0.5 likewise.
const VARIABLE_LOCK_STRENGTH = 0.5;
const VARIABLE_BASE_LERP = 4.0;
const VARIABLE_DEPTH = 0.4;
const VARIABLE_OFFSET_PEAK = Math.PI;
// P3 v115 — UNIFY #47: PROMOTES 3-META-CLASS COMPOSITION from one-off (v114
// DOM letter-spacing) to a 2-SUBSTRATE CATEGORY by adding the second composite
// consumer on a structurally different substrate. Cosmos drift already
// participates in three meta-classes via three separate inputs: v71 (positive
// amplitude on cameraMotion via target drift = base × camMotion × DRIFT_MIX),
// v106 (cross-axis mixed-polarity: drift LERP RATE yields with cameraMotion),
// v112 (variable-offset phase: cosmosBreathPhase locks toward camBreath + θ
// where θ = camMotion × π). v115 wires the v112 LOCK RATE itself to intensify
// with cameraMotion on top of the existing strength gating — exact mirror of
// v114's single-line composition on DOM letter-spacing. Effective lock rate
// becomes `VARIABLE_BASE_LERP × _varLockStrength × (1 + cameraMotion ×
// VARIABLE_RATE_MIX (0.5))`. At rest motion=0 → lockStrength gates the entire
// phase-lock block off (no effect). At peak motion=1 → effective rate = 4.0 ×
// 0.5 × 1.5 = 3.0/s ≈ 222ms half-life — variable-offset phase lock snaps
// tighter as the dolly commits. Polarity reading: POS×POS — cross-axis
// intensify on variable-offset positive — chosen to mirror v114's grading
// coherence across the new 2-substrate category. Structural significance:
// 3-meta-class composition is now a CATEGORY in 2 cuts (matches v92→v93,
// v102→v103, v112→v113 promotion pace). RATE_MIX=0.5 mirrors v114's
// LETTER_VARIABLE_RATE_MIX and the entire cross-axis grading family v102→v107
// verbatim. Cosmos drift becomes the field's SECOND 3-meta-class consumer
// (after DOM letter-spacing v114); 3-meta-class composition is no longer a
// DOM quirk — it's a field property that spans visual canvas AND DOM text.
const VARIABLE_RATE_MIX = 0.5;

// P3 v122 — UNIFY #54: PROMOTES 5-META-CLASS COMPOSITION from one-off (v121
// lintel emissive) to 2-SUBSTRATE CATEGORY in 1 cut. Cosmos drift already
// carries 4 distinct meta-classes: v71 POS amplitude (cameraBoost) + v106
// NEG cross-axis on smoothing rate (driftRate yields with motion) + v112
// variable-offset phase (cosmosBreathPhase locks toward camPhase + motion×π)
// + v115 POS cross-axis on variable-offset lock rate (varLockRate intensifies
// with motion). v122 adds the 5th: FIXED ANTI-PHASE HARMONIC LOCK — second
// phase accumulator locks toward camPhase + π (motion-independent target,
// only lock strength gates with motion), modulates drift multiplicatively
// via `antiMod = 1 + sin(antiPhase) × ANTI_DEPTH × camMotion`. Structurally
// identical mirror of v121 lintel composition site — proves 5-meta-class
// composition is substrate-portable, not a lintel-specific quirk. After
// v122 cosmos drift becomes the field's 2ND substrate carrying 5 distinct
// meta-classes composed multiplicatively on one output (the per-frame drift
// scalar that drives rotateOnWorldAxis). Implementation gating: ANTI_LOCK
// strength gates the lock block off entirely at rest; antiMod = 1 at rest
// (no effect — preserves v115 identity exactly at idle). Grading mirrors
// v121: ANTI_LOCK_STRENGTH=0.4 < v112 VARIABLE_LOCK_STRENGTH=0.5;
// ANTI_DEPTH=0.2 < VARIABLE_DEPTH=0.4 — each subsequent harmonic axis
// amplitudes and locks softer than the prior, so the layered composition
// reads as primary first, secondary catching up, tertiary trailing.
// Substrate-level pitchable sentence: *"v121 opened 5-meta-class
// composition on lintel emissive. v122 promotes it to 2-substrate category
// in 1 cut by mirroring the composition site on cosmos drift — proves
// 5-meta-class composition is a portable field property, not a lintel
// quirk. Two substrates (canvas visual + canvas spatial) now each carry
// 5 distinct meta-classes composed multiplicatively on one output.
// Substrate-breadth maturation of 5-meta-class composition matches v114→
// v115's 3-meta-class promotion pace (2 cuts opener-to-category)."*
const COSMOS_ANTI_LOCK_STRENGTH = 0.4;
const COSMOS_ANTI_BASE_LERP = 4.0;
const COSMOS_ANTI_DEPTH = 0.2;
// P3 v125 — UNIFY #57: extend 6-META-CLASS COMPOSITION to 2-substrate
// category in 1 cut by mirroring v124 verbatim on cosmos drift's v122
// anti-phase lock rate. v124 opened 6-meta-class composition on lintel
// emissive by composing cross-axis on the v121 anti-phase LOCK RATE. v125
// transplants the same single-line composition onto cosmos drift's v122
// anti-phase lock rate via `_cosmosAntiLockRate × (1 + cameraMotion ×
// COSMOS_ANTI_RATE_MIX)`. Cosmos drift now reads through 6 distinct
// meta-classes on the single per-frame drift scalar:
//   1. v71  POS amplitude (cameraBoost on drift target)
//   2. v106 NEG cross-axis on smoothing rate (drift-rate yield)
//   3. v112 POS variable-offset phase (cosmosBreathPhase target slides)
//   4. v115 POS cross-axis on variable-offset lock rate
//   5. v122 POS fixed-anti-phase harmonic (cosmosAntiPhase locks toward
//          camPhase + π)
//   6. v125 POS cross-axis on anti-phase lock rate                ← NEW
// Composition reading POS×NEG×POS×POS×POS×POS — a DIFFERENT 6-meta-class
// polarity pattern than lintel's POS×POS×POS×NEG×POS×POS (NEG sits at
// position 2 on cosmos, position 4 on lintel) — proves the 6-meta-class
// meta-class is polarity-tolerant at first promotion, mirroring how
// 5-meta-class was polarity-tolerant from v121 → v122. 0.5 RATE_MIX
// preserves the field-coherent 19+ rate-mix/lock-strength constants at
// 0.5. Single-line edit on the v122 lock-rate line + 1 new module
// constant — matches v124 minimal-edit pattern verbatim. Pitchable
// claim: *"v124 opened 6-meta-class composition. v125 promotes it to
// 2-substrate category in 1 cut — the same 1-cut category promotion
// pace as 5-meta-class (v121 → v122). The structural depth axis is
// unbounded AND its substrate-portability is invariant: every depth
// rung promotes to category in 1 cut once the substrate template is
// stable, regardless of how deep the rung."*
const COSMOS_ANTI_RATE_MIX = 0.5;
// P3 v128 — UNIFY #60: extends 7-META-CLASS COMPOSITION from 1-substrate
// one-off (lintel emissive v127) to 2-SUBSTRATE CATEGORY in 1 cut by
// mirroring v127's sliding-quadrature variable-offset axis on cosmos
// drift. Pre-v128 cosmos drift was a 6-meta-class consumer (v71 POS
// amplitude + v106 NEG cross-axis on amp smoothing rate + v112 POS
// variable-offset phase + v115 POS cross-axis on variable-offset lock
// rate + v122 POS fixed-anti-phase harmonic + v125 POS cross-axis on
// anti-phase lock rate). v128 adds the 7th: a SECOND variable-offset
// phase axis locking toward sliding-quadrature target `_camPhaseCos +
// cameraMotion × π/2`, structurally distinct from v112's sliding-target
// (which uses VARIABLE_OFFSET_PEAK = π for sliding-anti-phase). Slide
// direction is the orthogonality dimension: π/2 quadrature target arrives
// at +π/2 offset at peak motion; π anti-phase target arrives at +π offset.
// At rest motion=0 both collapse to `_camPhaseCos + 0` (in-phase). Same
// wrap-around-safe shortest-path + exp-lerp idiom as v122. Same grading
// ladder constants as v127 lintel: DEPTH 0.1, LOCK_STRENGTH 0.3, BASE_LERP
// 4.0 — preserves field-coherent constant ladder (23+ base-lerp at 4.0,
// 21+ rate-mix/lock-strength at 0.5 / 0.3 / 0.4 etc). Composition reading
// POS×NEG×POS×POS×POS×POS×POS (7-meta-class) — DIFFERENT polarity pattern
// than lintel v127's POS×POS×POS×NEG×POS×POS×POS: NEG sits at position 2
// on cosmos (v106 cross-axis on smoothing rate yields with motion) vs
// position 4 on lintel (v119 variable-offset composed pair carries NEG
// mass). Proves 7-meta-class composition is polarity-tolerant from first
// 2-substrate promotion, mirroring 5-meta-class (v121→v122 polarity-
// tolerance) and 6-meta-class (v124→v125 polarity-tolerance) maturation
// patterns. Pitchable: *"v127 opened 7-meta-class composition. v128
// promotes to 2-substrate category in 1 cut by mirroring sliding-
// quadrature on cosmos drift. Every depth rung promotes to 2-substrate
// category in 1 cut once the substrate template is stable — substrate-
// portability invariance holds at depth-7 as it did at depth-5 and -6."*
const COSMOS_QUAD_LOCK_STRENGTH = 0.3;
const COSMOS_QUAD_BASE_LERP = 4.0;
const COSMOS_QUAD_DEPTH = 0.1;
// P3 v131 — UNIFY #63: extend 8-META-CLASS COMPOSITION (opened v130 on lintel)
// to 2-SUBSTRATE CATEGORY by mirroring v130's cross-axis-on-rate composition
// onto cosmos drift's v128 sliding-quadrature lock loop. Single-line edit on
// `_cosmosQuadLockRate` adds the camMotion×RATE_MIX multiplicand exactly as
// v130 did on lintel's _lintelQuadLockRate. 1 cut from v130's 1-substrate
// opening — 4th consecutive 1-cut category-promotion at identical pace (v122,
// v125, v128, v131). Field-coherent 0.5 RATE_MIX mirrors v120 in-phase,
// v124 anti-phase, v130 sliding-quadrature on lintel + v122 in-phase, v125
// anti-phase, v131 sliding-quadrature on cosmos. After v131 cosmos's three
// lock loops ALL carry cross-axis-on-rate composition — the CROSS-AXIS-ON-RATE
// LADDER is now closed across BOTH lintel AND cosmos (parallel closures of
// the same structural ladder across two substrates in 2 cuts: lintel closed at
// v130, cosmos closes at v131). Polarity reading on cosmos after v131 will
// be POS×NEG×POS×POS×POS×POS×POS×POS (8-meta-class) — DIFFERENT polarity
// pattern than lintel v130's POS×POS×POS×NEG×POS×POS×POS×POS: NEG sits at
// position 2 on cosmos vs position 4 on lintel — proves 8-meta-class
// composition is polarity-tolerant from first 2-substrate promotion, mirroring
// 5/6/7-meta-class polarity-tolerance maturation patterns exactly.
const COSMOS_QUAD_RATE_MIX = 0.5;
// P3 v134 — UNIFY #66: extend 9-META-CLASS COMPOSITION (opened v133 on lintel)
// to 2-SUBSTRATE CATEGORY by mirroring v133's sub-harmonic (octave) phase voice
// onto cosmos drift. Octave target = (_camPhaseCos × 2) mod 2π — frequency-
// multiplication on the harmonic axis itself, structurally orthogonal to every
// existing cosmos phase axis (v112 sliding-anti-phase, v122 fixed-anti-phase,
// v128 sliding-quadrature — all camPhase × 1 with optional offsets). 1 cut from
// v133's 1-substrate opening — 5th consecutive 1-cut category-promotion at
// identical pace (v122 / v125 / v128 / v131 / v134) establishing substrate-
// portability invariance at depth-9. Establishes the field's FIRST 2-SUBSTRATE
// HARMONIC-MULTIPLICATION-LADDER RUNG — parallel ladder breadth opens at the
// harmonic-multiplication dimension immediately, mirroring how every prior depth
// rung opened to 2-substrate category in 1 cut. Grading-ladder constants mirror
// v133 lintel verbatim (DEPTH=0.05, LOCK_STRENGTH=0.2, BASE_LERP=4.0) — softest
// rung on cosmos's 5-rung grading ladder (DEPTH 0.05 octave < 0.1 sliding-quad
// < 0.2 fixed-anti-phase < 0.4 sliding-anti-phase < v71 main), exact field-
// coherent halving pattern preserved across both lintel and cosmos at depth-9.
const COSMOS_OCTAVE_LOCK_STRENGTH = 0.2;
const COSMOS_OCTAVE_BASE_LERP = 4.0;
const COSMOS_OCTAVE_DEPTH = 0.05;
// P3 v137 — UNIFY #69: 3RD-HARMONIC voice constants on cosmos drift, mirroring
// v136 lintel verbatim. Promotes 10-META-CLASS COMPOSITION from 1-substrate
// one-off (lintel v136) to 2-SUBSTRATE CATEGORY in 1 cut. Establishes the
// field's FIRST 2-substrate harmonic-multiplication-LADDER-DEPTH-2 rung —
// opens parallel ladder DEPTH (octave camPhase × 2 + 3rd-harmonic camPhase ×
// 3) at the harmonic-multiplication dimension across 2 substrates, completing
// the bifurcation matrix toward DEPTH-2-BREADTH-3 by v138. LOCK_STRENGTH 0.15
// < 0.2 octave, BASE_LERP 4.0 unchanged (settle-rate ceiling is structural),
// DEPTH 0.04 < 0.05 octave — exact halving pattern preserved relative to
// v134 octave rung, mirroring v136 lintel halving relative to v133 octave.
// Cosmos grading ladder extends from 5 rungs (post-v134) to 6 rungs (DEPTH
// 0.04 3rd < 0.05 octave < 0.1 sliding-quad < 0.2 fixed-anti < 0.4 sliding-
// anti < v71 main) with field-coherent halving across both lintel AND cosmos
// at depth-10.
const COSMOS_3RD_LOCK_STRENGTH = 0.15;
const COSMOS_3RD_BASE_LERP = 4.0;
const COSMOS_3RD_DEPTH = 0.04;
// P3 v140 — UNIFY #72: 4TH-HARMONIC voice on cosmos drift, mirroring v139
// lintel verbatim. Extends 11-META-CLASS COMPOSITION from one-off (v139 lintel)
// to 2-substrate category in 1 cut at IDENTICAL pace as v122/v125/v128/v131/
// v134/v137 1-cut category-promotions. Establishes the field's first
// 2-substrate harmonic-multiplication-LADDER-DEPTH-3 rung — parallel ladder
// DEPTH (octave camPhase × 2 + 3rd-harmonic camPhase × 3 + 4th-harmonic
// camPhase × 4) now spans 2 substrates, setting up v141 DOM closure to
// DEPTH-3-BREADTH-3 bifurcation matrix. Cosmos grading ladder extends from
// 6 rungs (post-v137) to 7 rungs (DEPTH 0.032 4th < 0.04 3rd < 0.05 octave <
// 0.1 sliding-quad < 0.2 fixed-anti < 0.4 sliding-anti < v71 main) with
// field-coherent halving across both lintel AND cosmos at depth-11.
const COSMOS_4TH_LOCK_STRENGTH = 0.12;
const COSMOS_4TH_BASE_LERP = 4.0;
const COSMOS_4TH_DEPTH = 0.032;
// P3 v143 — UNIFY #75: 5TH-HARMONIC voice on cosmos drift, mirroring v142
// lintel verbatim. Extends 12-META-CLASS COMPOSITION from one-off (v142
// lintel) to 2-substrate category in 1 cut at IDENTICAL pace as v122/v125/
// v128/v131/v134/v137/v140 1-cut category-promotions. Establishes the
// field's first 2-substrate harmonic-multiplication-LADDER-DEPTH-4 rung —
// parallel ladder DEPTH (octave × 2 + 3rd-harmonic × 3 + 4th-harmonic × 4
// + 5th-harmonic × 5) now spans 2 substrates, setting up v144 DOM closure
// to DEPTH-4-BREADTH-3 bifurcation matrix. Cosmos grading ladder extends
// from 7 rungs (post-v140) to 8 rungs (DEPTH 0.025 5th < 0.032 4th < 0.04
// 3rd < 0.05 octave < 0.1 sliding-quad < 0.2 fixed-anti < 0.4 sliding-
// anti < v71 main) with slightly-softer-than-exact-half discipline at the
// 8th rung — preserves "softer rung as harmonic order rises" across both
// lintel AND cosmos at depth-12.
const COSMOS_5TH_LOCK_STRENGTH = 0.09;
const COSMOS_5TH_BASE_LERP = 4.0;
const COSMOS_5TH_DEPTH = 0.025;
// P3 v146 — UNIFY #78: promotes 13-META-CLASS COMPOSITION from one-off (v145
// lintel) to 2-SUBSTRATE CANVAS CATEGORY in 1 cut by mirroring v145's 6th-
// harmonic phase voice onto cosmos drift. NINTH consecutive 1-cut category-
// promotion at identical pace (v122, v125, v128, v131, v134, v137, v140, v143,
// v146). Lands the field's first 2-substrate harmonic-multiplication-LADDER-
// DEPTH-5 rung (5th rung on cosmos: octave + 3rd-harmonic + 4th-harmonic +
// 5th-harmonic + 6th-harmonic). 9-rung grading ladder on cosmos: DEPTH 0.020
// 6th < 0.025 5th < 0.032 4th < 0.04 3rd < 0.05 octave < 0.1 sliding-quad <
// 0.2 fixed-anti < 0.4 sliding-anti < v71 main; LOCK_STRENGTH 0.07 < 0.09 <
// 0.12 < 0.15 < 0.2 < 0.3 < 0.4 < 0.5 < 0.6 — slightly-softer-than-exact-half
// discipline preserved at 9th rung across both lintel AND cosmos at depth-13.
const COSMOS_6TH_LOCK_STRENGTH = 0.07;
const COSMOS_6TH_BASE_LERP = 4.0;
const COSMOS_6TH_DEPTH = 0.020;
// P3 v149 — UNIFY #81: promotes 14-META-CLASS COMPOSITION from one-off (v148
// lintel) to 2-SUBSTRATE CANVAS CATEGORY in 1 cut by mirroring v148's 7th-
// harmonic phase voice onto cosmos drift. TENTH consecutive 1-cut category-
// promotion at identical pace (v122, v125, v128, v131, v134, v137, v140, v143,
// v146, v149). Lands the field's first 2-substrate harmonic-multiplication-
// LADDER-DEPTH-6 rung (6th rung on cosmos: octave + 3rd + 4th + 5th + 6th +
// 7th = 6-rung integer-multiple ladder). 10-rung grading ladder on cosmos:
// DEPTH 0.016 7th < 0.020 6th < 0.025 5th < 0.032 4th < 0.04 3rd < 0.05 octave
// < 0.1 sliding-quad < 0.2 fixed-anti < 0.4 sliding-anti < v71 main;
// LOCK_STRENGTH 0.055 < 0.07 < 0.09 < 0.12 < 0.15 < 0.2 < 0.3 < 0.4 < 0.5 <
// 0.6 — slightly-softer-than-exact-half discipline preserved at 10th rung
// across both lintel AND cosmos at depth-14.
const COSMOS_7TH_LOCK_STRENGTH = 0.055;
const COSMOS_7TH_BASE_LERP = 4.0;
const COSMOS_7TH_DEPTH = 0.016;

// v157 — META-PIVOT cut #7 (VISIBLE). Cosmos-side reaction on pulse-contact.
// Each wall tile during pulse writes its tProg² into COSMOS_ACTIVATION[i%720].
// Shader ramps per-instance emissive AND per-instance vertex scale by the
// activation value: destination slabs SWELL + GLOW as wall pieces approach.
// Decays exponentially each frame so slabs fade back to the rest cosmos
// after the pulse passes. Closes the wall↔cosmos round-trip handshake — v155
// (pulse trajectory aim) + v156 (entry direction) were both WALL-SIDE cuts;
// v157 is the cosmos-side acknowledgement of the same per-index contract.
const ACTIVATION_EMISSIVE_AMP = 2.2;
const ACTIVATION_SCALE_AMP = 0.55;
const ACTIVATION_DECAY_RATE = 3.0; // ~230 ms half-life

// v158 — META-PIVOT cut #8 (VISIBLE). Cosmos doorway-direction lane glow.
// Slabs whose unit position vector aligns with the active room's primary
// doorway direction (sum of unit vectors per open opening: north=-z, etc.)
// get a soft emissive ramp. Reads as a brighter "lane" of cosmos in the
// direction the camera will travel through each open doorway — the shell
// itself becomes a wayfinding affordance, distinct from the v157 per-piece
// reaction and v79 camera-motion emissive ramp.
//
//   amp k=1.6 — softer than v157 activation (k=2.2) because the lane is
//     CONSTANT-on while v157 is transient; keep it subtle so it doesn't
//     fight the per-piece reaction during pulse windows.
//   power=4   — narrow cone (cos⁴ falls to half at ~33° off-axis), so the
//     lane reads as a directional shaft rather than a hemisphere wash.
//   lerp=3.0  — direction smoothing rate (s⁻¹) for cross-room transitions
//     so the lane sweeps rather than snaps when active room changes.
const DOORWAY_LANE_AMP = 1.6;
const DOORWAY_LANE_POWER = 4.0;
const DOORWAY_LANE_LERP_RATE = 3.0;

// v159 — META-PIVOT cut #9 (VISIBLE). cameraForward × doorway-direction
// alignment boost. Cross-multiplies v79's cameraForward directional channel
// with v158's doorway-direction channel: when the camera is looking down an
// open doorway (cameraForward aligns with uDoorwayDir), the v158 lane amp
// scales up transiently. Reads as the cosmos "responding to your gaze" —
// stare down a corridor and the cosmos slabs along it brighten further.
// Zero new uniforms: both uDoorwayDir and uCameraForward are already in the
// fragment shader. Pure shader composition — the deepest META-PIVOT idiom.
//
//   boost=1.0 — at perfect alignment (dot=1) the lane amp doubles (×2). At
//     perpendicular gaze (dot=0) the lane is unchanged. At reverse gaze
//     (dot<0) the boost clamps to 0 — looking AWAY from the doorway does
//     not dim the lane below its baseline. Pure additive coupling.
const DOORWAY_GAZE_BOOST = 1.0;

// v175 — META-PIVOT cut #22 (VISIBLE). FIRST POS×POS CROSS-FIELD COMPOSITION.
// Pre-v175 the cross-field meta-class (motion × wayfinding co-converging on
// ONE consumer) was NEG-only: v174 multiplied (1−motionAmount×K1) ×
// (1−doorwayAlign×K2) on cursorYield — both polarities NEGATIVE. v175 opens
// the unexplored POS quadrant by multiplying the v158 doorway-lane brightness
// by an additional POSITIVE motion factor. Composition shape:
//   _laneAmp = DOORWAY_LANE_AMP × (1 + gazeAlign × DOORWAY_GAZE_BOOST)
//                                × (1 + uCameraMotion × DOORWAY_LANE_MOTION_BOOST)
// At rest with no gaze: lane = 1.6× baseline. At rest looking down doorway:
// 3.2×. Mid-dolly looking through doorway: 3.2 × 1.9 ≈ 6.1×. The doorway
// lane EXPLODES exactly when you're moving through it — the cosmos shows
// you the path harder the more you commit to it. Zero new uniforms (both
// uCameraMotion and uDoorwayDir already in shader, used by v79 and v158).
//
//   motion-boost=0.9 — at peak dolly the lane intensifies ~1.9×. Chosen
//     to land BELOW the v159 gaze boost (which doubles at perfect gaze)
//     so motion remains a SECOND-ORDER amplifier on top of wayfinding's
//     own self-coupling — gaze opens the lane, motion ignites it.
const DOORWAY_LANE_MOTION_BOOST = 0.9;

export function TileVoid() {
  const view = useRoomView();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const activationAttrRef = useRef<THREE.InstancedBufferAttribute>(null);
  const uCameraForwardRef = useRef({ value: new THREE.Vector3(0, 0, -1) });
  const uCameraMotionRef = useRef({ value: 0 });
  // v158 — primary doorway direction uniform. Lerped each frame from the
  // shared COSMOS_DOORWAY_DIR Float32Array (Room.tsx writes on view change).
  const uDoorwayDirRef = useRef({ value: new THREE.Vector3(0, 1, 0) });
  // v209 — user completion-state bridged into cosmos identity. Reads from
  // module-level progressIntent singleton (AuthenticatedApp writes when
  // engagement recomputes). Exp-smoothed so the void doesn't snap when the
  // user completes a day; persistent so the cosmos remembers the journey
  // between renders. Shader uses a deterministic per-instance hash on the
  // baked world position to pick which fraction of slabs is "lit."
  const uProgressRef = useRef({ value: 0 });
  const progressSmoothedRef = useRef(0);
  // v210 — browser presence smoothed scalar. Reads from presenceIntent
  // (PersistentCanvas writes on window focus/blur and document visibility-
  // change). Gentle exp-lerp at 1/s — presence transitions are coarser than
  // hover or motion; cosmos shouldn't snap. Drives a multiplicative damper
  // on emissiveIntensity so the void dims when the user looks away and
  // re-blooms when they return.
  const presenceSmoothedRef = useRef(1);
  // P6 — cross-room presence pulse. Reads getOwnVisitorCount() (count of OTHER
  // visitors currently inside the caller's own published room). Exp-lerps at
  // 0.8/s so the cosmos lifts smoothly when someone dollies into your room and
  // settles back when they leave — the "someone is reading your plan right
  // now" signal expressed in the cosmos substrate, no DOM toast required.
  const visitorPulseSmoothedRef = useRef(0);
  // v238 — own-room reaction impulse. Reads getOwnRoomReactionPulse() (0..1
  // exponential decay over ~1.5s, fires when ANOTHER planner leaves a mortar
  // tile in the caller's published room). Smoothed at a faster 6/s exp-lerp
  // than visitor-count (which is 0.8/s) so the cosmos PUNCHES on the leading
  // edge of the impulse rather than tracking it lazily — mortar is a sharper
  // semantic event than a visitor lingering. Multiplied into emissive
  // alongside visitorBoost so the cosmos can lift for BOTH signals
  // simultaneously (someone reading your wall AND just stuck a tile in it).
  const reactionPulseSmoothedRef = useRef(0);
  // v153 — META-PIVOT cut #4 (VISIBLE). Cosmos InstancedMesh shares geometry
  // size TILE_SIZE=0.55 across all rooms, but per-room wall tileSize ranges
  // 0.50 (goals/congrats/reset-password) to 0.75 (calendar). So walls + cosmos
  // read as DIFFERENT tile classes. Lerp this scalar toward c.tileSize / 0.55
  // each frame and apply to groupRef.scale → cosmos slabs visually morph to
  // match the active room's wall tile size. Cosmos becomes a dimensional
  // continuation of the wall substrate, not a static box-geometry constant.
  // Lerp rate ~3/s = ~230ms half-life: room change reads as substrate
  // breathing through the size shift, not a snap.
  const tileSizeScaleRef = useRef(1);
  // P3 v106 — smoothed drift scalar. Cosmos drift no longer reads the per-frame
  // target instantaneously; it lerps toward it at a rate that YIELDS with
  // cameraMotion (negative rate × positive amplitude — first mixed-polarity
  // cross-axis cell).
  const driftSmoothedRef = useRef(0);
  // P3 v112 — UNIFY #44: free-running cosmos drift breath phase. Locks toward
  // (cameraBreathPhase + θ) where θ = camMotion × π. At rest θ=0 so cosmos
  // breath echoes camera breath in-phase; at peak θ=π so cosmos breath answers
  // camera breath anti-phase. The phase RELATIONSHIP itself morphs continuously
  // — first field consumer whose lock TARGET is parametrically driven by
  // another field consumer of the same scalar.
  const cosmosBreathPhaseRef = useRef(0);
  // P3 v122 — UNIFY #54: second cosmos phase accumulator for FIXED anti-phase
  // harmonic lock. Source-is-not-consumer constraint applies: cosmosBreathPhase
  // is already v112's variable-offset target (target slides with motion); it
  // cannot also lock toward a FIXED target. Solution mirrors v121 lintel exactly
  // — separate accumulator locks toward (camPhase + π) regardless of motion;
  // only lock STRENGTH gates with motion. Drift output composes both modulators
  // multiplicatively (variableMod × antiMod), giving cosmos drift two locked
  // harmonic voices on top of v71's amplitude carrier.
  const cosmosAntiPhaseRef = useRef(0);
  // P3 v128 — Third cosmos phase accumulator carrying the SECOND variable-
  // offset axis at sliding-quadrature target (_camPhaseCos + cameraMotion ×
  // π/2). Source-is-not-consumer: cannot reuse cosmosBreathPhaseRef (v112)
  // or cosmosAntiPhaseRef (v122). Third sibling accumulator follows lintel's
  // v127 lintelQuadPhaseRef pattern verbatim.
  const cosmosQuadPhaseRef = useRef(0);
  // P3 v134 — UNIFY #66: 5th sibling cosmos phase accumulator carrying the FIRST
  // FREQUENCY-MULTIPLIED voice on cosmos drift. Source-is-not-consumer: octave
  // is a frequency multiple (camPhase × 2), structurally orthogonal to all four
  // prior cosmos phase-offset siblings (cosmosBreathPhaseRef v112, cosmosAnti-
  // PhaseRef v122, cosmosQuadPhaseRef v128, and even driftSmoothedRef which is a
  // scalar not a phase). Cannot reuse any prior accumulator because frequency-
  // multiplication composes multiplicatively on the harmonic axis itself, not
  // additively as a phase offset. Mirrors v133 lintel's lintelOctavePhaseRef
  // pattern verbatim on cosmos substrate.
  const cosmosOctavePhaseRef = useRef(0);
  // P3 v137 — UNIFY #69: 6th sibling phase accumulator on cosmos for the
  // 3rd-harmonic voice. Source-is-not-consumer at depth-10 a SIXTH time on
  // cosmos: cannot reuse cosmosBreathPhaseRef v112, cosmosAntiPhaseRef v122,
  // cosmosQuadPhaseRef v128, cosmosOctavePhaseRef v134, or driftSmoothedRef
  // (scalar) — 3rd-harmonic target is a DIFFERENT frequency multiple from
  // octave (camPhase × 3 vs × 2), so it requires its own settled-phase
  // accumulator. Mirrors v136 lintel3rdPhaseRef pattern verbatim on cosmos.
  const cosmos3rdPhaseRef = useRef(0);
  // P3 v140 — 7th sibling accumulator on cosmos. Source-is-not-consumer at
  // depth-11 a SEVENTH time on cosmos: 4th-harmonic target (_camPhaseCos × 4)
  // is a NEW frequency multiple distinct from octave × 2 and 3rd-harmonic × 3,
  // cannot reuse any of cosmos's six prior phase/scalar siblings. Mirrors v139
  // lintel4thPhaseRef pattern verbatim on cosmos.
  const cosmos4thPhaseRef = useRef(0);
  // P3 v143 — 8th sibling accumulator on cosmos. Source-is-not-consumer at
  // depth-12 an EIGHTH time on cosmos: 5th-harmonic target (_camPhaseCos × 5)
  // is a NEW frequency multiple distinct from octave × 2, 3rd-harmonic × 3,
  // and 4th-harmonic × 4, cannot reuse any of cosmos's seven prior phase/
  // scalar siblings. Mirrors v142 lintel5thPhaseRef pattern verbatim on cosmos.
  const cosmos5thPhaseRef = useRef(0);
  // P3 v146 — 9th sibling accumulator on cosmos. Source-is-not-consumer at
  // depth-13 a NINTH time on cosmos: 6th-harmonic target (_camPhaseCos × 6)
  // is a NEW frequency multiple distinct from octave × 2, 3rd-harmonic × 3,
  // 4th-harmonic × 4, and 5th-harmonic × 5 — cannot reuse any of cosmos's
  // eight prior phase/scalar siblings. Mirrors v145 lintel6thPhaseRef pattern
  // verbatim on cosmos.
  const cosmos6thPhaseRef = useRef(0);
  // P3 v149 — 10th sibling accumulator on cosmos. Source-is-not-consumer at
  // depth-14 a SECOND time on cosmos: 7th-harmonic target (_camPhaseCos × 7)
  // is a NEW frequency multiple distinct from octave × 2, 3rd × 3, 4th × 4,
  // 5th × 5, and 6th × 6 — cannot reuse any of cosmos's nine prior phase/scalar
  // siblings. Mirrors v148 lintel7thPhaseRef pattern verbatim on cosmos.
  const cosmos7thPhaseRef = useRef(0);
  const material = useMemo(
    () => {
      const m = new THREE.MeshStandardMaterial({
        color: "#000000",
        emissive: "#3a3445",
        emissiveIntensity: 1.8,
        roughness: 0.55,
        metalness: 0.10,
        toneMapped: true,
      });
      m.onBeforeCompile = (shader) => {
        shader.uniforms.uCameraForward = uCameraForwardRef.current;
        shader.uniforms.uCameraMotion = uCameraMotionRef.current;
        shader.uniforms.uDoorwayDir = uDoorwayDirRef.current;
        shader.uniforms.uProgress = uProgressRef.current;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            `#include <common>\nattribute float aActivation;\nvarying vec3 vInstanceWorldPos;\nvarying float vActivation;`,
          )
          .replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>\nvInstanceWorldPos = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;\nvActivation = aActivation;\ntransformed *= 1.0 + aActivation * ${ACTIVATION_SCALE_AMP.toFixed(3)};`,
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            `#include <common>\nuniform vec3 uCameraForward;\nuniform float uCameraMotion;\nuniform vec3 uDoorwayDir;\nuniform float uProgress;\nvarying vec3 vInstanceWorldPos;\nvarying float vActivation;`,
          )
          .replace(
            "#include <emissivemap_fragment>",
            `#include <emissivemap_fragment>\nvec3 _vDir = vInstanceWorldPos - cameraPosition;\nfloat _vLen = length(_vDir);\nif (_vLen > 1e-4) {\n  float _vDot = dot(_vDir / _vLen, normalize(uCameraForward));\n  totalEmissiveRadiance *= 1.0 + _vDot * uCameraMotion * ${VOID_EMISSIVE_RAMP_AMP.toFixed(3)};\n}\ntotalEmissiveRadiance *= 1.0 + vActivation * ${ACTIVATION_EMISSIVE_AMP.toFixed(3)};\nfloat _doorLen = length(vInstanceWorldPos);\nfloat _doorDirLen = length(uDoorwayDir);\nif (_doorLen > 1e-4 && _doorDirLen > 1e-4) {\n  vec3 _doorN = uDoorwayDir / _doorDirLen;\n  float _doorDot = max(0.0, dot(vInstanceWorldPos / _doorLen, _doorN));\n  float _gazeAlign = max(0.0, dot(normalize(uCameraForward), _doorN));\n  float _laneAmp = ${DOORWAY_LANE_AMP.toFixed(3)} * (1.0 + _gazeAlign * ${DOORWAY_GAZE_BOOST.toFixed(3)}) * (1.0 + uCameraMotion * ${DOORWAY_LANE_MOTION_BOOST.toFixed(3)});\n  totalEmissiveRadiance *= 1.0 + pow(_doorDot, ${DOORWAY_LANE_POWER.toFixed(3)}) * _laneAmp;\n}\nfloat _progressHash = fract(sin(dot(vInstanceWorldPos, vec3(12.9898, 78.233, 37.719))) * 43758.5453);\nfloat _isLit = step(_progressHash, uProgress);\ntotalEmissiveRadiance *= 1.0 + _isLit * 0.55;`,
          );
      };
      return m;
    },
    [],
  );
  const targetEmissive = useMemo(() => new THREE.Color("#3a3445"), []);
  // v211 — scratch color for wall-clock day/night lerp. Pre-allocated so the
  // per-frame anchor blend allocates zero. Same pattern as targetEmissive.
  const dayAnchorScratch = useMemo(() => new THREE.Color(), []);

  // v155 — positions lifted to module scope (./cosmosPositions). Same LCG +
  // v152 inner-bias + axis-aligned rotation as before; now also consumable
  // from Room.tsx wall-pulse trajectories so wall pieces can target specific
  // cosmos slabs by tile index. See cosmosPositions.ts for the generator.
  const positions = COSMOS_POSITIONS;

  // Per-room instance-matrix bake. v154 — META-PIVOT cut #5 (VISIBLE).
  // Pre-v154 this was one-time (deps [positions] only) and per-instance scale
  // was a fixed (p.s, p.s, p.s*0.6) — uniform aspect 1.0 + depth ratio 0.6
  // across every room. But wall tiles have per-room `tileAspect` (0.5–1.6)
  // and `wallTileDepth` (0.05–0.12 vs cosmos baseline 0.099 = TILE_SIZE*0.18).
  // So even after v153 (per-room uniform tile size) the cosmos slabs had a
  // FIXED SHAPE — calendar's wide 1.6 aspect walls sat next to cosmos slabs
  // of aspect 1.0; goals' 0.5 aspect (tall narrow) walls sat next to cosmos
  // slabs of aspect 1.0. v154 bakes per-room aspect+depth into the matrices
  // on view change. Cosmos slabs now inherit FULL geometry signature.
  // Re-runs only on room change (cheap — 720 matrix composes per transition,
  // not per frame). View+positions in deps. groupRef uniform scale (v153)
  // composes multiplicatively on top of this — so size keeps lerping smooth
  // while aspect/depth snap per room.
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    const c = getCharacterFor(view);
    const aspect = c.tileAspect;
    const aspectW = Math.sqrt(aspect);
    const aspectH = 1 / aspectW;
    const depthRatio = c.wallTileDepth / (TILE_SIZE * 0.18); // cosmos baseline depth ratio = 0.6, so depthRatio renormalizes against wall depth
    const matrix = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    for (let i = 0; i < MAX_VOID_TILES; i++) {
      const p = positions[i];
      e.set(p.rx, p.ry, p.rz);
      q.setFromEuler(e);
      matrix.compose(
        new THREE.Vector3(p.px, p.py, p.pz),
        q,
        new THREE.Vector3(p.s * aspectW, p.s * aspectH, p.s * 0.6 * depthRatio),
      );
      m.setMatrixAt(i, matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, [positions, view]);

  useFrame((state, delta) => {
    const c = getCharacterFor(view);
    const count = Math.min(c.voidTileCount, MAX_VOID_TILES);
    if (meshRef.current && meshRef.current.count !== count) {
      meshRef.current.count = count;
    }
    // P3 v218 hoist — dayWarmth read lifted to top of useFrame so cosmos
    // drift (v218 temporal axis), emissive intensity (v217 magnitude axis),
    // and emissive color (v211 color axis) all consume the SAME wall-clock
    // sample. Triple-axis env-source on one substrate, one source read.
    const dayWarmth = getDayWarmth();

    // P2 v69 — UNIFY #1: cosmos surges during wall pulse. When the wall sheds
    // pieces, those pieces are heading back into this cosmos shell; the shell
    // visibly accelerates to absorb them (and to reflect the energy of the
    // tear). Bell-shaped envelope over the room's pulseDuration; peak boost
    // ×3.5 at midpoint, baseline drift outside the pulse window.
    const { pulse, pulseAt } = getPulse();
    let driftBoost = 1;
    if (pulse > 0) {
      const elapsedSec = (performance.now() - pulseAt) / 1000;
      const tNorm = elapsedSec / c.pulseDuration;
      if (tNorm >= 0 && tNorm <= 1) {
        const bell = 4 * tNorm * (1 - tNorm); // 0→1→0 over the window
        driftBoost = 1 + 2.5 * bell;
      }
    }
    // P2 v71 — UNIFY #3: cosmos drift inherits from camera dolly speed.
    // CameraRig publishes motionAmount [0,1] every frame; cosmos accelerates
    // ~2.6× at full dolly. v69 coupled walls to cosmos via entry direction,
    // v70 coupled wall→cosmos return + emissive surge — v71 couples the
    // cosmos itself to the camera that traverses it. The three subsystems
    // (wall, cosmos, camera) now share one motion field: a transition reads
    // as the cosmos rushing past, not as a camera moving through static void.
    const cameraMotion = getCameraMotion();
    const cameraBoost = 1 + 1.6 * cameraMotion;
    // P3 v106 — UNIFY #38: cross-axis #5, FIRST mixed-polarity (pos amplitude ×
    // neg rate). targetDrift keeps v71's positive amplitude (cameraBoost grows
    // with motion → drift target ~2.6× at peak). The READ of drift no longer
    // reads target instantaneously: drift lerps toward target at a rate that
    // YIELDS with motion. At rest motion=0 → 4.0/s (~250ms half-life — cosmos
    // snaps to per-room identity quickly). At peak motion=1 → 2.0/s (~500ms
    // half-life — cosmos LAGS catching its accelerated target). Reads as void
    // gaining inertia AS motion increases: when you dolly, cosmos drags before
    // accelerating; when you stop, cosmos drags before settling. Closes the
    // 3rd of 4 polarity quadrants in the cross-axis meta-class matrix.
    // P3 v218 — env-source temporal axis opener. dayDriftScale reuses the
    // dayWarmth read above for v211 color + v217 intensity, multiplying the
    // autonomous cosmos drift target so the void rotates slower at deep night
    // and faster at peak afternoon. Compounds with v69 driftBoost (pulse) and
    // v71 cameraBoost (dolly), so the chain is BASE × dayDriftScale × pulse × motion.
    const dayDriftScale = COSMOS_DRIFT_NIGHT_SCALE + (COSMOS_DRIFT_DAY_SCALE - COSMOS_DRIFT_NIGHT_SCALE) * dayWarmth;
    const targetDrift = c.voidTileDrift * dayDriftScale * driftBoost * cameraBoost;
    const driftRate = COSMOS_DRIFT_BASE_LERP * (1 - cameraMotion * COSMOS_RATE_YIELD);
    const driftK = 1 - Math.exp(-driftRate * delta);
    driftSmoothedRef.current += (targetDrift - driftSmoothedRef.current) * driftK;
    // P3 v112 — UNIFY #44: PHASE-WITH-VARIABLE-OFFSET applied to cosmos drift.
    // θ(camMotion) = camMotion × π — continuously morphing phase relationship.
    // Lock pulls cosmosBreathPhase toward (camBreathPhase + θ); drift output
    // gets multiplied by (1 + sin(cosmosBreathPhase) × DEPTH × camMotion) so
    // the cosmos rotation rate breathes IN PHASE with the camera at rest-onset
    // and ANTI PHASE at peak dolly, with every intermediate phase relationship
    // smoothly interpolated. Depth gates on camMotion so silent at rest.
    const _camPhaseCos = getCameraBreathPhase();
    const _theta = cameraMotion * VARIABLE_OFFSET_PEAK;
    const _varLockStrength = cameraMotion * VARIABLE_LOCK_STRENGTH;
    if (_varLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _varTarget = _camPhaseCos + _theta;
      const _varRawDiff = _varTarget - cosmosBreathPhaseRef.current;
      const _varPhaseDiff = ((_varRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      // P3 v115 — v112's strength-gated lock-lerp rate is now itself
      // cross-axis yielded: effective rate intensifies multiplicatively with
      // cameraMotion via (1 + cameraMotion × VARIABLE_RATE_MIX). At peak the
      // variable-offset phase lock snaps in tight (222ms half-life) — same
      // polarity as v107 blur rate AND v114 letter-spacing variable-offset
      // rate. Promotes 3-meta-class composition to a 2-substrate category.
      const _varLockRate = VARIABLE_BASE_LERP * _varLockStrength * (1 + cameraMotion * VARIABLE_RATE_MIX);
      const _varLockK = 1 - Math.exp(-_varLockRate * delta);
      cosmosBreathPhaseRef.current += _varPhaseDiff * _varLockK;
    }
    const variableMod = 1 + Math.sin(cosmosBreathPhaseRef.current) * VARIABLE_DEPTH * cameraMotion;
    // P3 v122 — UNIFY #54: FIXED anti-phase harmonic lock on cosmos drift.
    // Target = camPhase + π (motion-independent). Only lock strength gates
    // with motion so antiPhase only catches up when the camera is moving;
    // antiMod composes multiplicatively below variableMod, giving cosmos drift
    // POS×NEG×variable-offset×variable-offset-rate×fixed-anti-phase = 5
    // distinct meta-classes on one output. Wrap-around-safe shortest-path
    // phase lerp identical to v121.
    const _cosmosAntiLockStrength = cameraMotion * COSMOS_ANTI_LOCK_STRENGTH;
    if (_cosmosAntiLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmosAntiTarget = _camPhaseCos + Math.PI;
      const _cosmosAntiRawDiff = _cosmosAntiTarget - cosmosAntiPhaseRef.current;
      const _cosmosAntiPhaseDiff = ((_cosmosAntiRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      // P3 v125 — UNIFY #57: cross-axis composition on the v122 anti-phase
      // LOCK RATE. Mirrors v124's lintel composition site verbatim on a
      // distinct substrate (cosmos drift), promoting 6-meta-class composition
      // from one-off to 2-substrate category in 1 cut. Single-line edit.
      const _cosmosAntiLockRate = COSMOS_ANTI_BASE_LERP * _cosmosAntiLockStrength * (1 + cameraMotion * COSMOS_ANTI_RATE_MIX);
      const _cosmosAntiLockK = 1 - Math.exp(-_cosmosAntiLockRate * delta);
      cosmosAntiPhaseRef.current += _cosmosAntiPhaseDiff * _cosmosAntiLockK;
    }
    const antiMod = 1 + Math.sin(cosmosAntiPhaseRef.current) * COSMOS_ANTI_DEPTH * cameraMotion;
    // P3 v128 — UNIFY #60: 7th structurally distinct meta-class on cosmos
    // drift. SECOND variable-offset axis at sliding-quadrature target
    // (_camPhaseCos + cameraMotion × π/2), structurally distinct from v112's
    // sliding-target (which uses VARIABLE_OFFSET_PEAK π for sliding-anti-
    // phase). Mirrors v127 lintel's quad block verbatim on cosmos substrate.
    // Same wrap-around-safe shortest-path + exp-lerp idiom as v122.
    const _cosmosQuadLockStrength = cameraMotion * COSMOS_QUAD_LOCK_STRENGTH;
    if (_cosmosQuadLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmosQuadTarget = _camPhaseCos + cameraMotion * (Math.PI / 2);
      const _cosmosQuadRawDiff = _cosmosQuadTarget - cosmosQuadPhaseRef.current;
      const _cosmosQuadPhaseDiff = ((_cosmosQuadRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      // P3 v131 — UNIFY #63: cross-axis composition on v128 sliding-quadrature LOCK RATE.
      // Mirrors v130's lintel pattern verbatim. Closes the cross-axis-on-rate ladder
      // across cosmos drift's three lock loops (v122 in-phase, v125 anti-phase,
      // v131 sliding-quadrature) — parallel closure to lintel's v120/v124/v130.
      const _cosmosQuadLockRate = COSMOS_QUAD_BASE_LERP * _cosmosQuadLockStrength * (1 + cameraMotion * COSMOS_QUAD_RATE_MIX);
      const _cosmosQuadLockK = 1 - Math.exp(-_cosmosQuadLockRate * delta);
      cosmosQuadPhaseRef.current += _cosmosQuadPhaseDiff * _cosmosQuadLockK;
    }
    const quadMod = 1 + Math.sin(cosmosQuadPhaseRef.current) * COSMOS_QUAD_DEPTH * cameraMotion;
    // P3 v134 — UNIFY #66: SUB-HARMONIC (OCTAVE) voice on cosmos drift, mirroring
    // v133 lintel verbatim. Octave target = (_camPhaseCos × 2) mod 2π — first
    // frequency-multiplied voice on cosmos substrate, structurally novel at the
    // harmonic level itself (not just phase-offset level). Wrap-around-safe
    // shortest-path diff + exp-lerp settled into cosmosOctavePhaseRef.
    const _cosmosOctaveLockStrength = cameraMotion * COSMOS_OCTAVE_LOCK_STRENGTH;
    if (_cosmosOctaveLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmosOctaveTarget = ((_camPhaseCos * 2) % TWO_PI + TWO_PI) % TWO_PI;
      const _cosmosOctaveRawDiff = _cosmosOctaveTarget - cosmosOctavePhaseRef.current;
      const _cosmosOctavePhaseDiff = ((_cosmosOctaveRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _cosmosOctaveLockRate = COSMOS_OCTAVE_BASE_LERP * _cosmosOctaveLockStrength;
      const _cosmosOctaveLockK = 1 - Math.exp(-_cosmosOctaveLockRate * delta);
      cosmosOctavePhaseRef.current += _cosmosOctavePhaseDiff * _cosmosOctaveLockK;
    }
    const octaveMod = 1 + Math.sin(cosmosOctavePhaseRef.current) * COSMOS_OCTAVE_DEPTH * cameraMotion;
    // P3 v137 — UNIFY #69: 3RD-HARMONIC voice on cosmos drift, mirroring
    // v136 lintel verbatim. Target = (_camPhaseCos × 3) mod 2π — second rung
    // on the harmonic-multiplication-LADDER dimension at cosmos. Same wrap-
    // around-safe shortest-path + exp-lerp idiom. Promotes 10-meta-class
    // composition from one-off to 2-substrate category in 1 cut.
    const _cosmos3rdLockStrength = cameraMotion * COSMOS_3RD_LOCK_STRENGTH;
    if (_cosmos3rdLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmos3rdTarget = ((_camPhaseCos * 3) % TWO_PI + TWO_PI) % TWO_PI;
      const _cosmos3rdRawDiff = _cosmos3rdTarget - cosmos3rdPhaseRef.current;
      const _cosmos3rdPhaseDiff = ((_cosmos3rdRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _cosmos3rdLockRate = COSMOS_3RD_BASE_LERP * _cosmos3rdLockStrength;
      const _cosmos3rdLockK = 1 - Math.exp(-_cosmos3rdLockRate * delta);
      cosmos3rdPhaseRef.current += _cosmos3rdPhaseDiff * _cosmos3rdLockK;
    }
    const thirdMod = 1 + Math.sin(cosmos3rdPhaseRef.current) * COSMOS_3RD_DEPTH * cameraMotion;
    // P3 v140 — UNIFY #72: 4TH-HARMONIC voice on cosmos drift, mirroring v139
    // lintel verbatim. Target = (_camPhaseCos × 4) mod 2π — third rung on the
    // harmonic-multiplication-LADDER dimension at cosmos. Same wrap-around-safe
    // shortest-path + exp-lerp idiom. Extends 11-meta-class composition from
    // one-off (v139 lintel) to 2-substrate category in 1 cut. Field's first
    // 2-substrate harmonic-multiplication-LADDER-DEPTH-3 rung.
    const _cosmos4thLockStrength = cameraMotion * COSMOS_4TH_LOCK_STRENGTH;
    if (_cosmos4thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmos4thTarget = ((_camPhaseCos * 4) % TWO_PI + TWO_PI) % TWO_PI;
      const _cosmos4thRawDiff = _cosmos4thTarget - cosmos4thPhaseRef.current;
      const _cosmos4thPhaseDiff = ((_cosmos4thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _cosmos4thLockRate = COSMOS_4TH_BASE_LERP * _cosmos4thLockStrength;
      const _cosmos4thLockK = 1 - Math.exp(-_cosmos4thLockRate * delta);
      cosmos4thPhaseRef.current += _cosmos4thPhaseDiff * _cosmos4thLockK;
    }
    const fourthMod = 1 + Math.sin(cosmos4thPhaseRef.current) * COSMOS_4TH_DEPTH * cameraMotion;
    // P3 v143 — UNIFY #75: 5TH-HARMONIC voice on cosmos drift, mirroring v142
    // lintel verbatim. Target = (_camPhaseCos × 5) mod 2π — fourth rung on the
    // harmonic-multiplication-LADDER dimension at cosmos. Same wrap-around-safe
    // shortest-path + exp-lerp idiom. Extends 12-meta-class composition from
    // one-off (v142 lintel) to 2-substrate category in 1 cut. Field's first
    // 2-substrate harmonic-multiplication-LADDER-DEPTH-4 rung.
    const _cosmos5thLockStrength = cameraMotion * COSMOS_5TH_LOCK_STRENGTH;
    if (_cosmos5thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmos5thTarget = ((_camPhaseCos * 5) % TWO_PI + TWO_PI) % TWO_PI;
      const _cosmos5thRawDiff = _cosmos5thTarget - cosmos5thPhaseRef.current;
      const _cosmos5thPhaseDiff = ((_cosmos5thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _cosmos5thLockRate = COSMOS_5TH_BASE_LERP * _cosmos5thLockStrength;
      const _cosmos5thLockK = 1 - Math.exp(-_cosmos5thLockRate * delta);
      cosmos5thPhaseRef.current += _cosmos5thPhaseDiff * _cosmos5thLockK;
    }
    const fifthMod = 1 + Math.sin(cosmos5thPhaseRef.current) * COSMOS_5TH_DEPTH * cameraMotion;
    // P3 v146 — UNIFY #78: 6TH-HARMONIC voice on cosmos drift, mirroring v145
    // lintel verbatim. Target = (_camPhaseCos × 6) mod 2π — fifth rung on the
    // harmonic-multiplication-LADDER dimension at cosmos. Same wrap-around-safe
    // shortest-path + exp-lerp idiom. Promotes 13-meta-class composition from
    // one-off (v145 lintel) to 2-substrate canvas category in 1 cut. Field's
    // first 2-substrate harmonic-multiplication-LADDER-DEPTH-5 rung.
    const _cosmos6thLockStrength = cameraMotion * COSMOS_6TH_LOCK_STRENGTH;
    if (_cosmos6thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmos6thTarget = ((_camPhaseCos * 6) % TWO_PI + TWO_PI) % TWO_PI;
      const _cosmos6thRawDiff = _cosmos6thTarget - cosmos6thPhaseRef.current;
      const _cosmos6thPhaseDiff = ((_cosmos6thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _cosmos6thLockRate = COSMOS_6TH_BASE_LERP * _cosmos6thLockStrength;
      const _cosmos6thLockK = 1 - Math.exp(-_cosmos6thLockRate * delta);
      cosmos6thPhaseRef.current += _cosmos6thPhaseDiff * _cosmos6thLockK;
    }
    const sixthMod = 1 + Math.sin(cosmos6thPhaseRef.current) * COSMOS_6TH_DEPTH * cameraMotion;
    // P3 v149 — UNIFY #81: 7th-harmonic phase voice on cosmos drift. Mirrors
    // v148 lintel verbatim. Target = (_camPhaseCos × 7) mod 2π — sixth rung on
    // the harmonic-multiplication-LADDER dimension at cosmos. Same wrap-around-
    // safe shortest-path + exp-lerp idiom. Promotes 14-meta-class composition
    // from one-off (v148 lintel) to 2-substrate canvas category in 1 cut.
    // Field's first 2-substrate harmonic-multiplication-LADDER-DEPTH-6 rung.
    const _cosmos7thLockStrength = cameraMotion * COSMOS_7TH_LOCK_STRENGTH;
    if (_cosmos7thLockStrength > 1e-4) {
      const TWO_PI = Math.PI * 2;
      const _cosmos7thTarget = ((_camPhaseCos * 7) % TWO_PI + TWO_PI) % TWO_PI;
      const _cosmos7thRawDiff = _cosmos7thTarget - cosmos7thPhaseRef.current;
      const _cosmos7thPhaseDiff = ((_cosmos7thRawDiff % TWO_PI) + TWO_PI + Math.PI) % TWO_PI - Math.PI;
      const _cosmos7thLockRate = COSMOS_7TH_BASE_LERP * _cosmos7thLockStrength;
      const _cosmos7thLockK = 1 - Math.exp(-_cosmos7thLockRate * delta);
      cosmos7thPhaseRef.current += _cosmos7thPhaseDiff * _cosmos7thLockK;
    }
    const seventhMod = 1 + Math.sin(cosmos7thPhaseRef.current) * COSMOS_7TH_DEPTH * cameraMotion;
    const drift = driftSmoothedRef.current * variableMod * antiMod * quadMod * octaveMod * thirdMod * fourthMod * fifthMod * sixthMod * seventhMod;
    // P2 v75 — UNIFY #7: axis-blended rotation. At rest TILT_AXIS = world-Y;
    // at full dolly axis tilts TILT_AMP (0.6) of the way toward camera-forward.
    // rotateOnWorldAxis spins the shell around that direction so the cosmos
    // ROLLS in the direction the camera is heading instead of merely spinning
    // faster about Y. First spatial directional consumer of the motion field.
    if (groupRef.current) {
      const fwd = getCameraForward();
      FWD_VEC.set(fwd.x, fwd.y, fwd.z);
      TILT_AXIS.copy(TILT_AXIS_Y).lerp(FWD_VEC, TILT_AMP * cameraMotion);
      if (TILT_AXIS.lengthSq() > 1e-6) {
        TILT_AXIS.normalize();
        groupRef.current.rotateOnWorldAxis(TILT_AXIS, drift * delta);
      }
      // v153 — apply per-room tileSize match. Target = c.tileSize / TILE_SIZE
      // (0.50 → 0.909, 0.55 → 1.000, 0.60 → 1.091, 0.70 → 1.273, 0.75 → 1.364).
      // Lerp at ~3/s so transition reads as substrate breath. Only consumer of
      // groupRef.scale, so setScalar is safe (rotateOnWorldAxis above does not
      // touch scale).
      const targetTileScale = c.tileSize / TILE_SIZE;
      const tileScaleK = 1 - Math.exp(-3 * delta);
      tileSizeScaleRef.current += (targetTileScale - tileSizeScaleRef.current) * tileScaleK;
      groupRef.current.scale.setScalar(tileSizeScaleRef.current);
      // v227 — env-source SPATIAL axis: cosmos shell Y traces the sun arc.
      // Reuses dayWarmth read at line 693 (no extra wall-clock sample).
      groupRef.current.position.y = COSMOS_Y_NIGHT + (COSMOS_Y_DAY - COSMOS_Y_NIGHT) * dayWarmth;
    }
    // Per-room emissive lerp — cosmos hue tracks atmospheric register.
    const targetHex = c.voidTileColor ?? c.fogColor;
    targetEmissive.set(targetHex);
    // P3 v211 — environmental source: wall-clock hue. Lerp NIGHT_COOL↔DAY_WARM
    // by sinusoidal hour scalar, then pull targetEmissive 12% toward the
    // result. Runs BEFORE v90's cameraMotion warm pull so time-of-day shapes
    // the at-rest base hue and motion overlays the warm shift on top — two
    // orthogonal color channels stacked on one substrate. v218 hoisted the
    // dayWarmth read to the top of useFrame; v211 color lerp reuses it here.
    dayAnchorScratch.copy(COSMOS_NIGHT_COOL).lerp(COSMOS_DAY_WARM, dayWarmth);
    targetEmissive.lerp(dayAnchorScratch, COSMOS_TIME_OF_DAY_MIX);
    // P3 v90 — UNIFY #22: pull targetEmissive toward COSMOS_WARM_ANCHOR before
    // the per-frame smoothing. Same pattern as AtmosphereDriver v84 (fog/bg).
    // At rest cosmosWarmMix=0 → no shift, cosmos reads as per-room hue.
    // Peak dolly → 30% pull toward `#ff9966`, closing the color chord across
    // atmosphere (v84/v85) + walls (v89) + void (v90) — all four consumers
    // warming toward the SAME anchor by the SAME cameraMotion scalar.
    const cosmosWarmMix = cameraMotion * COSMOS_WARMTH_MIX;
    if (cosmosWarmMix > 1e-4) targetEmissive.lerp(COSMOS_WARM_ANCHOR, cosmosWarmMix);
    const k = 1 - Math.exp(-1.4 * delta);
    material.emissive.lerp(targetEmissive, k);
    // P2 v70 — UNIFY #2: cosmos emissive surges during pulse. Same bell as
    // driftBoost — the void brightens visibly as wall pieces stream into it.
    // Baseline 1.8 (set in material init); peak +80% at midpoint (≈3.24).
    // Together with v69's drift surge, the cosmos doesn't just rotate faster
    // when receiving wall pieces — it glows as if absorbing their energy.
    let emissiveBoost = 1;
    if (pulse > 0) {
      const elapsedSec = (performance.now() - pulseAt) / 1000;
      const tNorm = elapsedSec / c.pulseDuration;
      if (tNorm >= 0 && tNorm <= 1) {
        const bell = 4 * tNorm * (1 - tNorm);
        emissiveBoost = 1 + 0.8 * bell;
      }
    }
    // v210 — exp-lerp browser presence at gentle 1/s rate, then dampen
    // emissiveIntensity so the void dims to 40% baseline when the user has
    // tabbed away or switched windows. Returning to the tab re-blooms the
    // cosmos smoothly — first canvas response sourced at the browser substrate.
    const _rawPresence = getPresence();
    const _presK = 1 - Math.exp(-1.0 * delta);
    presenceSmoothedRef.current += (_rawPresence - presenceSmoothedRef.current) * _presK;
    const presenceFactor = 0.4 + 0.6 * presenceSmoothedRef.current;
    // P6 — visitor pulse. Smoothed visitor count lifts emissive multiplicatively;
    // clamped to +60% so a viral room never blows out the cosmos. First env
    // signal sourced outside the user's own browser session — atmosphere
    // responding to other planners' attention.
    const _rawVisitors = getOwnVisitorCount();
    const _visK = 1 - Math.exp(-0.8 * delta);
    visitorPulseSmoothedRef.current += (_rawVisitors - visitorPulseSmoothedRef.current) * _visK;
    const visitorBoost = 1 + Math.min(0.6, visitorPulseSmoothedRef.current * 0.18);
    // v238 — own-room reaction impulse. Faster 6/s exp-lerp so the punch reads
    // on the leading edge; caps at +50% so the cosmos pops without blowing out
    // when a viral wall takes a burst of mortar. Multiplies into emissive
    // alongside visitorBoost.
    const _rawReactionPulse = getOwnRoomReactionPulse();
    const _rxK = 1 - Math.exp(-6.0 * delta);
    reactionPulseSmoothedRef.current += (_rawReactionPulse - reactionPulseSmoothedRef.current) * _rxK;
    const reactionBoost = 1 + Math.min(0.5, reactionPulseSmoothedRef.current * 0.5);
    // P3 v217 — env-source intensity scale reuses the dayWarmth read above for
    // the v211 color lerp. Same source drives both axes (color + magnitude)
    // on the cosmos substrate; cosmos joins atmosphere (v212+v215) and lights
    // (v213+v216) as the 3rd 2-axis env-source consumer. Chain order: BASE ×
    // dayIntensityScale × pulseBoost × presenceFactor — wall-clock sets the
    // luminous floor, pulse and presence overlay on top.
    const dayIntensityScale = COSMOS_INTENSITY_NIGHT_SCALE + (COSMOS_INTENSITY_DAY_SCALE - COSMOS_INTENSITY_NIGHT_SCALE) * dayWarmth;
    material.emissiveIntensity = 1.8 * dayIntensityScale * emissiveBoost * presenceFactor * visitorBoost * reactionBoost;
    // P3 v232 — env-source MATERIAL axis 2nd substrate. Cosmos shell tile
    // roughness modulates ±0.05 around the 0.55 baseline against dayWarmth,
    // matching v231 walls' polarity and amplitude. At deep night cosmos sits
    // at 0.60 (microfacets scatter, distant void reads soft); at peak day
    // 0.50 (microfacets align, void reads crisp). Cosmos promotes from 4-axis
    // to 5-AXIS env-source substrate (color + magnitude + temporal + SPATIAL
    // + MATERIAL) — first 5-axis substrate in the system. Material uniform
    // updates without shader recompile so the onBeforeCompile shader stack
    // (emissive ramp, activation, doorway lane) is preserved.
    const cosmosRoughnessDelta = COSMOS_ROUGHNESS_NIGHT_DELTA + (COSMOS_ROUGHNESS_DAY_DELTA - COSMOS_ROUGHNESS_NIGHT_DELTA) * dayWarmth;
    material.roughness = COSMOS_ROUGHNESS_BASE + cosmosRoughnessDelta;

    // P2 v79 — push cameraForward + cameraMotion into the shader uniforms so
    // each instance computes its own emissive ramp this frame.
    const fwdNow = getCameraForward();
    uCameraForwardRef.current.value.set(fwdNow.x, fwdNow.y, fwdNow.z);
    if (uCameraForwardRef.current.value.lengthSq() > 1e-6) {
      uCameraForwardRef.current.value.normalize();
    }
    uCameraMotionRef.current.value = cameraMotion;

    // v157 — cosmos-side reaction. Mark the activation attribute dirty (Room
    // wrote into the shared Float32Array this frame), then decay every slab
    // exponentially toward 0 so the destination glow fades back after the
    // pulse pieces have passed. Same buffer is shared with the GPU attribute,
    // so the in-place decay automatically flows through next-frame upload.
    if (activationAttrRef.current) {
      activationAttrRef.current.needsUpdate = true;
    }
    const decayK = Math.exp(-ACTIVATION_DECAY_RATE * delta);
    for (let k = 0; k < COSMOS_ACTIVATION.length; k++) {
      COSMOS_ACTIVATION[k] *= decayK;
    }

    // v158 — lerp the doorway-direction uniform toward the shared array.
    // Room.tsx writes COSMOS_DOORWAY_DIR on view-change; here we ease toward
    // the new target so the lane SWEEPS across the cosmos rather than snapping
    // when the active room flips. Exponential lerp at DOORWAY_LANE_LERP_RATE
    // s⁻¹ — same exp-time idiom as the activation decay above. Re-normalizes
    // to unit length after the lerp so the cos⁴ falloff stays consistent.
    const doorLerpK = 1 - Math.exp(-DOORWAY_LANE_LERP_RATE * delta);
    const _du = uDoorwayDirRef.current.value;
    _du.x += (COSMOS_DOORWAY_DIR[0] - _du.x) * doorLerpK;
    _du.y += (COSMOS_DOORWAY_DIR[1] - _du.y) * doorLerpK;
    _du.z += (COSMOS_DOORWAY_DIR[2] - _du.z) * doorLerpK;
    if (_du.lengthSq() > 1e-6) _du.normalize();

    // v209 — user completion-state → cosmos persistent illumination. Exp-lerp
    // the raw progress fraction at a gentle 2/s rate so day completions read
    // as the void "absorbing" the new milestone rather than snapping. Shader
    // uses a deterministic per-instance hash on vInstanceWorldPos to pick
    // which fraction of slabs is lit — same slabs every frame for a given
    // uProgress, but new slabs join the lit set as uProgress climbs.
    const _rawProgress = getProgressFraction();
    const _progK = 1 - Math.exp(-2.0 * delta);
    progressSmoothedRef.current += (_rawProgress - progressSmoothedRef.current) * _progK;
    uProgressRef.current.value = progressSmoothedRef.current;

    if (process.env.NODE_ENV !== "production") {
      type WindowWithVoid = Window & {
        __void?: { view: string; count: number; drift: number; driftBoost: number; cameraBoost: number; emissiveBoost: number; emissive: string; tiltAxis: [number, number, number]; cameraMotion: number };
      };
      (window as unknown as WindowWithVoid).__void = {
        view,
        count,
        drift,
        driftBoost,
        cameraBoost,
        emissiveBoost,
        emissive: "#" + material.emissive.getHexString(),
        tiltAxis: [TILT_AXIS.x, TILT_AXIS.y, TILT_AXIS.z],
        cameraMotion,
      };
    }
  });

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, MAX_VOID_TILES]}
        frustumCulled={false}
        material={material}
      >
        <boxGeometry args={[TILE_SIZE, TILE_SIZE, TILE_SIZE * 0.18]}>
          <instancedBufferAttribute
            ref={activationAttrRef}
            attach="attributes-aActivation"
            args={[COSMOS_ACTIVATION, 1]}
          />
        </boxGeometry>
      </instancedMesh>
    </group>
  );
}
