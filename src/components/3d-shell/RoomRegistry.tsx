"use client";

import { useSyncExternalStore } from "react";

export type ViewKey =
  | "landing"
  | "goals"
  | "calendar"
  | "day"
  | "onboarding"
  | "congrats"
  | "settings"
  | "privacy"
  | "terms"
  | "reset-password"
  | "gallery";

export const VIEW_KEYS: ViewKey[] = [
  "landing",
  "goals",
  "calendar",
  "day",
  "onboarding",
  "congrats",
  "settings",
  "privacy",
  "terms",
  "reset-password",
  "gallery",
];

export interface CameraTarget {
  position: [number, number, number];
  lookAt: [number, number, number];
  fov?: number;
}

export interface RoomCharacter {
  palette: string[];
  accents: string[];
  accentChance: number;
  /** Intensity multiplier for the warm key point light */
  warmIntensity: number;
  /** Intensity multiplier for the cool fill point light */
  coolIntensity: number;
  /** Warm key light color — picks emotional register per room */
  warmColor: string;
  /** Cool fill light color — picks emotional register per room */
  coolColor: string;
  /** Warm key offset relative to room center (e.g. overhead, side, rim) */
  warmOffset: [number, number, number];
  /** Cool fill offset relative to room center */
  coolOffset: [number, number, number];
  /** Per-view fog color — atmosphere that lerps as you move between rooms */
  fogColor: string;
  /** Distance at which fog begins (camera-relative) */
  fogNear: number;
  /** Distance at which fog reaches full opacity */
  fogFar: number;
  /** P3 v30 — particle count for room atmosphere (drei Sparkles). */
  atmosphereCount: number;
  /** Drift speed of atmosphere particles (0=still, 1=brisk). */
  atmosphereSpeed: number;
  /** Particle size in world-relative units. */
  atmosphereSize: number;
  /** Tint color for atmosphere particles — falls back to warmColor if unset. */
  atmosphereColor?: string;
  /**
   * P3 v32 — per-room tile size (world units). Every other dimension is
   * characterized per room (color/light/atmosphere/fog/particles/FOV) but the
   * UNIT OF CONSTRUCTION itself was uniform 0.6 across all rooms — so rooms
   * read as the same masonry recolored. Smaller = denser/finer mosaic (chaos,
   * urgency, celebration sparks); larger = sparser/calmer panels (planning,
   * onboarding welcome). LINTEL_THRESH and pulse amplitude already scale
   * proportionally with tileSize, so no choreography breaks.
   */
  tileSize: number;
  /**
   * P3 v33 — per-room WALL tile aspect ratio (W/H). v32 closed scalar tile
   * size, but tile *shape* was still uniform across rooms. Per VISION ("a tile
   * is a discrete physical object — it has thickness, mass, a clip"), wall
   * grain direction is itself a mood signal: <1 reads as tall vertical
   * columns (ambition, formality, urgency); >1 reads as wide horizontal bands
   * (planning rows, schedule order); 1 reads as neutral/intimate masonry.
   * Area is preserved (tileW = tileSize·√aspect, tileH = tileSize/√aspect) so
   * tile *count* per wall stays roughly constant — the wall reorients without
   * thickening/thinning the mosaic. Floors/ceilings stay square regardless.
   */
  tileAspect: number;
  /**
   * P3 v34 — per-room transition pulse duration (seconds). v33 closed wall
   * *shape*, but wall *behavior* — how the pulse propagates when the camera
   * enters/leaves — was still uniform (1.4s every room). Per VISION ("motion is
   * meaning"), the *kinetic* mood of arrival should match the *static* mood of
   * the room. Smaller = sharper/faster reaction (urgency, ambition, sparks);
   * larger = slower swelling (planning, calm). LINTEL_THRESH stagger, accent
   * emissive sin envelope, and doorway-portal flare all scale to this duration.
   */
  pulseDuration: number;
  /**
   * P3 v34 — per-room pulse amplitude multiplier. NORMAL/TANGENT/GRAVITY and
   * doorway-part amps all scale linearly with this. Higher = more violent wall
   * shatter on entry (celebration, urgency); lower = gentler displacement
   * (planning, formality). Range 0.4–1.0 keeps the choreography legible.
   */
  pulseStrength: number;
  /**
   * P3 v35 — per-room pulse TANGENT scatter (sideways spread perpendicular to
   * the wall normal). 1.0 = baseline. <1 = pieces fly mostly straight along
   * the wall normal (tight focused burst — ambition strikes); >1 = pieces
   * scatter wide across the wall plane (broad radial spray — celebration,
   * urgency). Multiplies TANGENT_AMP and DOORWAY_PART_AMP on top of strength.
   */
  pulseScatter: number;
  /**
   * P3 v35 — per-room pulse GRAVITY multiplier on OUT-role tiles. 1.0 =
   * baseline downward bias. <1 = pieces float/hang (celebration suspended in
   * air, onboarding gentle drift); >1 = heavy fall (legal slabs drop straight
   * down). Multiplies GRAVITY_AMP. IN role is unaffected (tiles settle from
   * displacement, no gravity bias on assembly).
   */
  pulseGravity: number;
  /**
   * P3 v35 — per-room pulse SPIN multiplier on per-tile tumble. 1.0 = baseline
   * cartwheel. <1 = stiff/minimal rotation (formal slabs hold orientation);
   * >1 = chaotic tumble (urgent shatter, celebration confetti). Multiplies
   * tile.spinAmount × tProg in totalSpin (does not affect entry/celeb spins).
   */
  pulseSpin: number;
  /**
   * P3 v36 — per-room at-rest drift amplitude (world units). 0.012 = baseline.
   * The room's *resting metabolism* — every tile micro-drifts in a sin/cos cycle
   * even when nothing is happening. Higher = more visible breath at rest
   * (urgency, ambition); lower = nearly still (legal stillness, formal hush).
   * Replaces the previously-uniform 0.012 constant in Room.tsx.
   */
  driftAmp: number;
  /**
   * P3 v36 — per-room at-rest drift frequency (rad/s, applied to `now`). 0.4 =
   * baseline. Higher = faster jitter (alarm, tense ambition); lower = slow
   * swell (calm planning, legal hush). Combines with driftAmp to define each
   * room's resting kinetic signature.
   */
  driftFreq: number;
  /**
   * P3 v37 — per-room hover-magnet radius (world units). 2.6 = baseline. The
   * radius within which tiles get pulled toward the cursor's projected world
   * position. Smaller = tight focused magnet (ambition reaches close and
   * hard); larger = wide soft reach (planning, celebration sprawls outward).
   * Replaces the previously-uniform HOVER_RADIUS constant in Room.tsx.
   */
  hoverRadius: number;
  /**
   * P3 v37 — per-room hover-magnet amplitude (world units). 0.13 = baseline.
   * Max displacement of a tile sitting directly under the cursor. Smaller =
   * restrained response (legal stillness, formal hush); larger = chaotic
   * urgent grab (reset-password alarm, celebration sparkle). Composes with
   * radius to define each room's cursor-reactivity signature.
   */
  hoverAmp: number;
  /**
   * P3 v38 — per-room click/keystroke BUMP radius (world units). 4.6 = baseline.
   * The radius around the active room's lookAt within which tiles get pushed
   * outward when a panel click or form keystroke fires a bump. Smaller = tight
   * focused strike (goals, reset — input lands hard on a small patch); larger
   * = wide ripple (calendar, celebration — the action radiates broadly).
   * Replaces the previously-uniform BUMP_RADIUS constant in Room.tsx.
   */
  bumpRadius: number;
  /**
   * P3 v38 — per-room click/keystroke BUMP amplitude (world units). 0.95 =
   * baseline. Max outward displacement at the bump epicenter. Smaller = legal
   * hush (privacy/terms barely flinch); larger = urgent grab (reset-password
   * alarm, celebration burst). BUMP_LIFETIME (0.55s envelope) and
   * BUMP_PEAK_NORM (envelope shape) stay uniform — only spatial signature
   * varies per room. Composes with hoverAmp (v37), driftAmp (v36), pulse
   * (v34) for a layered per-room kinetic signature.
   */
  bumpAmp: number;
  /**
   * P3 v39 — per-room celebration burst *envelope duration* (seconds). 1.8 =
   * baseline. How long the bell-shaped celebration impulse lives — every tile
   * in the room pushes radially outward + up over this window when
   * fireCelebration() is called for this room. Shorter = sharp triumphant
   * snap (goals goal-create, reset-password confirm); longer = drawn-out
   * expansive achievement (congrats reward, onboarding welcome). The
   * registry-level cleanup ceiling is bumped to 3.0s so longer per-room
   * values aren't prematurely filtered. CameraRig recoil reads the same value
   * so the camera-pullback envelope tracks the visual burst.
   */
  celebDuration: number;
  /**
   * P3 v39 — per-room celebration radial amplitude (world units). 0.55 =
   * baseline. Each tile pushes outward from the room center by celebAmp ×
   * celebRadialAmp at envelope peak. Smaller = legal hush (privacy/terms
   * barely move); larger = expansive sparkle (congrats reward burst).
   */
  celebRadialAmp: number;
  /**
   * P3 v39 — per-room celebration upward lift (world units). 0.40 = baseline.
   * Additional +y push on every tile during the burst, on top of the radial
   * direction. Smaller = grounded (settings, legal pages); larger = soaring
   * lift (onboarding welcome, congrats reward).
   */
  celebUpAmp: number;
  /**
   * P3 v39 — per-room celebration spin multiplier. 1.6 = baseline (matches
   * the prior hardcoded `env * intensity * 1.6` in Room.tsx). Smaller = stiff
   * formal acknowledgment (legal hush, settings); larger = chaotic confetti
   * tumble (congrats reward, goal-create snap). Composes with pulseSpin
   * (v35) — pulse-spin governs *transition* tumble while celebSpin governs
   * *state-change-burst* tumble.
   */
  celebSpinAmp: number;
  /**
   * P3 v40 — per-room CAMERA shake amplitude during a wall pulse (world units
   * at envelope peak). 0.16 = baseline. The body's response to the wall
   * fragmenting on transition entry. Smaller = serene glide (legal hush,
   * settings); larger = bone-rattling jolt (goals strike, congrats erupt,
   * reset urgency). Composes with the visual pulse (v34) — pulseStrength
   * governs the tiles, shakePulseAmp governs the body holding the camera.
   */
  shakePulseAmp: number;
  /**
   * P3 v40 — per-room CAMERA shake amplitude per click/keystroke bump (world
   * units at envelope peak). 0.05 = baseline. The body's response to a single
   * user input. Smaller = barely registered (privacy/terms read-only feel);
   * larger = each click lands like a punch (goals, congrats, reset). Composes
   * with the visual bump (v38) — bumpAmp governs the tiles, shakeBumpAmp
   * governs the camera response.
   */
  shakeBumpAmp: number;
  /**
   * P3 v40 — per-room CAMERA pullback during celebration burst (world units).
   * 0.42 = baseline. The body recoils backward along the camera→lookAt forward
   * axis when the room erupts. Smaller = held composure (legal hush, settings);
   * larger = thrown backward by the wave (congrats reward). Composes with
   * celebRadialAmp (v39) — celebRadialAmp governs the tile scatter, recoilBackAmp
   * governs the body's instinctive pull back from the eruption.
   */
  recoilBackAmp: number;
  /**
   * P3 v40 — per-room CAMERA upward shift during celebration (world units).
   * 0.20 = baseline. Additional +y push on the camera during the burst.
   * Smaller = grounded (legal/settings); larger = soaring (onboarding welcome,
   * congrats reward). Composes with celebUpAmp (v39) — tile lift + camera lift
   * read together as a unified room-uplift moment.
   */
  recoilUpAmp: number;
  /**
   * P3 v40 — per-room CAMERA upward tilt during celebration (radians at peak).
   * 0.08 = baseline. Additional upward pitch on the lookAt during the burst.
   * Smaller = level gaze held (legal/settings); larger = head thrown back in
   * awe (congrats reward, onboarding welcome). Composes with the recoil offset
   * for a complete reverent-recoil signature.
   */
  recoilTiltAmp: number;
  /**
   * P3 v41 — per-room AUDIO CUE character (timbre + weight + harmony).
   * AudioDriver fires shatter→rumble→chime on every transition pulse; pre-v41
   * every room sounded identical. Audio is the second-loudest sensory channel
   * after motion — and the channel users hear *every single transition*. These
   * 7 fields let each room sound like itself: glass-crack vs stone-thud shatter,
   * vast-cavern vs tight-room rumble, triumphant-major vs unresolved-diminished
   * chime.
   *
   * audioShatterFreq — bandpass center (Hz) for the 0.3s noise burst.
   *   Lower (400) = dull stony/papery (privacy/terms); higher (1700) = bright
   *   glassy crack (reset-password alarm). 900 = baseline.
   * audioShatterGain — peak gain for the shatter burst. 0.18 = baseline.
   *   Quieter rooms (privacy 0.06) barely click; congrats 0.26 hits hardest.
   */
  audioShatterFreq: number;
  audioShatterGain: number;
  /**
   * audioRumbleFreq — sine pitch (Hz) for the 1.5s dolly-through swell.
   *   Lower (42) = vast cavernous weight (congrats reward); higher (70) =
   *   tight focused room (goals). 58 = baseline. Internal 0.04 sustain scales
   *   proportionally with gain (sustain = peak × 0.667).
   * audioRumbleGain — peak gain for the rumble swell. 0.06 = baseline.
   */
  audioRumbleFreq: number;
  audioRumbleGain: number;
  /**
   * audioChimeRoot — root frequency (Hz) of the warm assemble triad.
   *   246 (B3) for legal hush, 440 (A4) for congrats fanfare. 330 (E4)
   *   baseline. Triad lands the moment the IN-room walls finish assembling
   *   (delay tracks per-room pulseDuration via v34).
   * audioChimeIntervals — ratios over root for the triad notes. Defines
   *   the harmonic *quality* of arrival:
   *     major triad [1, 1.25, 1.5]     = triumphant (goals, day, onboarding)
   *     fanfare     [1, 1.25, 1.5, 2]  = REWARD ROOM (congrats — major + octave)
   *     perfect 5+8 [1, 1.5, 2]        = neutral hub (landing)
   *     minor triad [1, 1.2, 1.5]      = contemplative composure (calendar, settings)
   *     diminished  [1, 1.2, 1.414]    = unresolved/urgent (privacy, terms, reset-password)
   * audioChimeGain — peak per-note gain. 0.04 = baseline.
   */
  audioChimeRoot: number;
  audioChimeIntervals: number[];
  audioChimeGain: number;
  /**
   * P3 v42 — per-room CAMERA breath character (resting respiration).
   * Camera body breathes at rest (restAmount > 0.6 gate in CameraRig). Pre-v42
   * every room breathed identically at 0.04u vertical, 0.025u forward, 4.6s
   * period. Breath fires *every idle frame* — the highest-baseline-frequency
   * uniform-channel left in the camera rig. Parallel to v36 (tile rest
   * metabolism) but at the camera-body layer: how the *inhabitant's chest*
   * rises and falls while occupying the room.
   *   breathYAmp — vertical breath amplitude (world units).
   *     0.04 = baseline. 0.015 = legal hush (privacy/terms barely breathe);
   *     0.060 = expansive REWARD (congrats — biggest chest swell).
   *   breathForwardAmp — forward weight-shift amplitude (world units).
   *     0.025 = baseline. Composes with breathY at half-frequency for a
   *     natural drift — the body shifts weight as the chest rises.
   *   breathPeriod — full breath cycle (seconds).
   *     4.6 = baseline. 3.0 = urgent shallow (reset-password alarm-state
   *     respiration); 6.4 = slow composed (calendar planning composure).
   */
  breathYAmp: number;
  breathForwardAmp: number;
  breathPeriod: number;
  /**
   * P3 v43 — per-room CAMERA dolly tilt/roll/pitch character (traversal gait).
   * The *camera's body language during the dolly through the wall* — the most
   * identity-defining motion in the entire shell. v40 closed the per-room
   * impact shake/recoil; v42 closed the idle breath. The traversal itself —
   * how the camera carries itself for the ~1.2–1.8s it's moving — was still
   * room-agnostic. Gated by motionAmount (max when far from target, decaying
   * to 0 at rest); destination-room lookup means the camera adopts the IN-room's
   * gait the moment a transition fires.
   *   dollyPitchAmp — vertical look oscillation amplitude (radians).
   *     0.18 = baseline. 0.05 = rigid legal upright (privacy/terms);
   *     0.28 = exuberant ascent (congrats — chest-out victory stride).
   *   dollyPitchFreq — pitch oscillation frequency (Hz).
   *     3.1 = baseline. 2.0 = slow steady (calendar/privacy);
   *     5.0 = quick urgent (reset-password alarm-stride).
   *   dollyRollAmp — Z-axis head-tilt amplitude (radians).
   *     0.06 = baseline. 0.01 = military-rigid (privacy/terms);
   *     0.10 = swaying confident (congrats/reset-password).
   *   dollyRollFreq — roll oscillation frequency (Hz).
   *     4.2 = baseline. 2.0 = ponderous; 6.0 = jittery.
   *   dollyTiltFalloff — distance at which tilt amplitude maxes (world units).
   *     3.5 = baseline. Lower (2.6) = sharper arrival snap (privacy enters
   *     crisp/closed); higher (4.2) = wobble persists into arrival
   *     (calendar gradual settle, congrats victory-lap).
   */
  dollyPitchAmp: number;
  dollyPitchFreq: number;
  dollyRollAmp: number;
  dollyRollFreq: number;
  dollyTiltFalloff: number;
  /**
   * P3 v44 — per-room CAMERA dolly speed character (traversal duration).
   * v43 closed the gait *shape* during traversal; v44 closes the traversal
   * *duration*. Pre-v44 every room arrived at the same rate (lerpSpeed 1.4,
   * lookAtLerpSpeed 1.8). Multiplied with v43, the entire arrival sequence
   * becomes mood-shaped: HOW-IT-MOVES × HOW-FAST. The user feels the
   * destination's character through both gait and pacing.
   *   dollyLerpSpeed — camera position lerp rate (exp decay coefficient).
   *     1.4 = baseline. 0.9 = slow grand sweep (congrats victory-lap arrival);
   *     2.4 = alarm-snap (reset-password urgent quick-stop).
   *   dollyLookAtLerpSpeed — look-target lerp rate.
   *     1.8 = baseline. Lower for languid sweeping arrivals, higher for crisp
   *     decisive halts. Always slightly higher than dollyLerpSpeed so the
   *     gaze settles a beat after position — natural head-then-eyes resolve.
   */
  dollyLerpSpeed: number;
  dollyLookAtLerpSpeed: number;
  /**
   * P3 v45 — per-room CURSOR PARALLAX character (at-rest cursor sway).
   * Continuous-fire channel: while restAmount > 0 (the moment the camera
   * settles in a room) the cursor x/y maps to lateral + vertical camera
   * offsets via these amps. Pre-v45 every room swayed identically. Per-room
   * lets tense rooms (privacy/terms) hold composure while spacious rooms
   * (calendar/congrats) breathe wide with the cursor; reset-password locks
   * down to near-zero parallax with snap-precise tracking (urgency).
   *   parallaxXAmp — lateral parallax amplitude along camera-right vector.
   *     0.22 = baseline. 0.06 = locked-in alarm (reset-password); 0.35 =
   *     spacious planning sway (calendar, biggest in shell).
   *   parallaxYAmp — vertical parallax amplitude in world Y.
   *     0.14 = baseline. 0.04 = alarm tight; 0.22 = planning headroom.
   *   parallaxLerp — cursor smoothing exp-decay coefficient. Lower = laggier
   *     loose drift; higher = snappier instant response.
   *     2.4 = baseline. 1.6 = languid loose calendar drift; 3.6 = snap
   *     reset-password (small amp + fast response = nervous lock-on).
   */
  parallaxXAmp: number;
  parallaxYAmp: number;
  parallaxLerp: number;
  /**
   * P3 v46 — per-room GENERATION-WAVE character (architectural-thinking signature).
   * Fires while async plan-generation is in progress (`getGenerating().active`)
   * for the active room. The most magical UX beat — "the AI is making your
   * plan" — gets visible architectural participation as a slow concentric ripple
   * across the tile field. Pre-v46 every room rippled identically; per-room
   * lets the *primary generation room* (goals) ripple deeply/densely while
   * calmer rooms (calendar) hum slow-wide, and tense rooms (reset-password,
   * privacy/terms) barely breathe.
   *   genWaveAmp — tile-displacement amplitude along outward normal.
   *     0.04 = baseline. 0.060 goals (architecture thinking visibly);
   *     0.020 privacy/terms (legal hush — barely participates).
   *   genWaveSpeed — phase rate in rad/s. 1.6 baseline. Lower = slow swell;
   *     higher = rapid ripple. 2.4 reset-password (urgent), 1.2 calendar (calm).
   *   genWaveLength — phase per world unit (rad/u). 0.65 baseline. Smaller =
   *     wider-spaced concentric shells; larger = denser shells.
   *   genFadeIn — seconds for the wave to ease in from silence after start.
   *     0.4 baseline. 0.2 alarm-snap (reset-password), 0.6 gentle calendar.
   */
  genWaveAmp: number;
  genWaveSpeed: number;
  genWaveLength: number;
  genFadeIn: number;
  /**
   * P2 v48 — per-room tile MATERIAL (roughness + metalness on meshStandardMaterial).
   * Pre-v48 every room shared roughness=0.65, metalness=0.15 → tiles look like the
   * same material under different lights. Per VISION Phase 2 (rooms are different
   * physical spaces), material is the highest-frequency baseline visual signal
   * beneath lighting: it tells the eye what the room is *made of* even before mood
   * lighting + atmosphere kick in.
   *   tileRoughness — 0=mirror, 1=fully diffuse. 0.32 congrats glossy marble (REWARD),
   *     0.45 reset-password clinical glass, 0.55 settings brushed metal, 0.60 calendar
   *     cool slate, 0.62 day standard plaster, 0.65 landing baseline, 0.72 onboarding
   *     soft fabric-warm, 0.78 goals warm dolomite, 0.92 privacy/terms matte legal stone.
   *   tileMetalness — 0=dielectric, 1=metal. 0.40 settings brushed steel, 0.30 congrats
   *     polished marble, 0.18 calendar slate-with-mineral, 0.15 landing baseline, 0.10
   *     day, 0.05 goals warm stone, 0.0 privacy/terms/reset-password/onboarding pure
   *     non-metal.
   */
  tileRoughness: number;
  tileMetalness: number;
  /**
   * P2 v49 — per-room lintel signature (the doorway-threshold portal character).
   * Lintels are the ~1-tile-wide ring of tiles framing each room opening. They
   * have an always-on warm emissive glow that breathes slowly at rest, then
   * explosively flares during transitions. Pre-v49 four universals governed
   * this: LINTEL_INTENSITY=0.42 (at-rest mult on warmColor), 2.51 rad/s breath,
   * ±0.45 breath amp around 1.0, FLARE_PEAK=3.6 (transition flare additive).
   * Every room's threshold looked and breathed identically — privacy's legal-
   * hush doorway glowed as warmly as congrats's reward threshold. Now per-room:
   *   lintelIntensity — at-rest emissive multiplier on warmColor (0.0=dark threshold,
   *     1.0=blazing). 0.10 privacy/terms legal hush (refuses to glow), 0.42 landing
   *     baseline, 0.85 congrats REWARD blazing portal.
   *   lintelBreathRate — breath oscillator angular freq (rad/s). 1.5 calendar slow
   *     planning-composure, 2.51 landing baseline, 4.0 reset-password urgent pulse.
   *   lintelBreathAmp — breath amplitude (±this around 1.0). 0.20 privacy somber,
   *     0.45 landing baseline, 0.55 congrats expansive swell.
   *   lintelFlarePeak — additive flare multiplier at transition midpoint. 2.0
   *     privacy restrained-arrival, 3.6 landing baseline, 6.0 congrats explosive
   *     reward-arrival portal-blaze.
   */
  lintelIntensity: number;
  lintelBreathRate: number;
  lintelBreathAmp: number;
  lintelFlarePeak: number;
  /**
   * P2 v51 — Lintel RING THICKNESS — how many tile-widths from the doorway
   * opening count as lintel. Multiplier applied to LINTEL_THRESH baseline (1.2).
   * 0.9 congrats thin cathedral lip (threshold dissolves into room), 1.2 landing
   * baseline, 1.8 privacy chunky vault frame (more concrete around the slit),
   * 2.0 reset-password densest alarm frame (THICKEST in shell). Compounds with
   * v49 (more lintel tiles = bigger glow surface) and v50 (narrow doorway +
   * thick frame = vault feel; wide doorway + thin lip = cathedral feel).
   */
  lintelRingThickness: number;
  /**
   * P2 v52 — Entry-assembly ARRIVAL CHARACTER. The first time a Room mounts
   * its walls stagger-assemble from scatter into place. Pre-v52 every room
   * arrived with the same duration/scatter/spin baseline; this makes the
   * page-load arrival itself room-specific.
   * - entryDuration: 0.8 reset-password fastest snap, 2.4 congrats slowest grand
   * - entryNormalAmp: how far tiles start from final position along wall normal
   * - entryTangentAmp: tangential scatter (sideways spread before settling)
   * - entrySpinAmp: tumble rotation amplitude during fall-in
   * Privacy assembles in restrained silence (small scatter + spin); congrats
   * slams in with chaotic grand assembly (biggest); reset-password snaps in
   * fastest with most spin (alarm-arrival).
   */
  entryDuration: number;
  entryNormalAmp: number;
  entryTangentAmp: number;
  entrySpinAmp: number;
  /**
   * P2 v53 — MOSAIC RELIEF signature. Pre-v53 every room's walls had the same
   * per-tile depth + thickness spread (depthOffset spread 0.17, thicknessMul
   * 0.7..2.2). Identical structural read of every wall at rest, no matter the
   * room's mood. v53 makes the relief amplitude per-room.
   * - reliefDepthRange: multiplier on depthOffset spread (1.0 = baseline,
   *   0.4 privacy pristine flat vault, 1.6 congrats dramatic mosaic relief)
   * - reliefThicknessRange: multiplier on thicknessMul deviation around mean
   *   1.45 (1.0 = baseline 0.7..2.2, 0.4 privacy near-uniform tiles, 1.6 congrats
   *   wide thin-to-fat spread)
   * Together they govern how "tiled" vs "flat-slab" each wall reads BEFORE any
   * motion fires. Most-felt at-rest structural property after geometry.
   */
  reliefDepthRange: number;
  reliefThicknessRange: number;
  /**
   * P2 v54 — FLOOR-RIPPLE character. Pre-v54 every room shared a universal
   * 3.2-unit radius × 0.18-unit amplitude camera-presence floor ripple — the
   * tiles within range of the user's standing position push UP as a footstep
   * indent traveling with the camera. Identical across all 10 rooms regardless
   * of mood. v54 makes presence itself per-room: privacy/terms barely react
   * (1.6×0.05 nearly imperceptible vault hush — your presence is suppressed
   * like a courtroom whisper), congrats radiates grand celebration waves
   * (5.6×0.28 biggest in shell — the room celebrates your arrival), settings
   * minimal (2.4×0.10 utilitarian flat-response).
   * - floorRippleRadius: how far around the camera xz the ripple reaches
   * - floorRippleAmp: vertical push magnitude on tiles within radius
   */
  floorRippleRadius: number;
  floorRippleAmp: number;
  /**
   * P2 v55 — WALL-DISASSEMBLY DIRECTIONAL BIAS. Pre-v55 every room had a universal
   * 0.88 split between primary-direction and counter-flow wall pieces during the
   * transition pulse (88% primary, 12% counter). Every room's walls came apart
   * with identical directional coherence. v55 makes the physics of disassembly
   * itself per-room — the foundational "in AND out through gaps" ratio.
   *  - 0.96 vault precision (privacy/terms): pieces all fly one direction like
   *    a precision-engineered vault opening — orderly, coherent disassembly.
   *  - 0.60 chaotic celebration (congrats): pieces fly both ways near-equally —
   *    walls explode like confetti, no dominant flow, pure jubilation disorder.
   *  - 0.94 alarm bunker (reset-password): tight unidirectional snap — urgent
   *    one-way escape.
   *  - 0.75 composed mix (calendar): planning sees both sides — sizable
   *    counter-flow without becoming chaotic.
   * Range 0.5 (perfect 50/50 chaos) ... 1.0 (every piece flies primary).
   */
  rolePrimaryRatio: number;
  /**
   * P2 v56 — ACCENT-TILE TRANSITION FLASH. Pre-v56 every accent tile sparked
   * to a universal 1.6 emissive peak at pulse midpoint, regardless of room.
   * Every transition's *light signature* was identical even though pulse
   * physics (v34 timing, v35 trajectory, v55 directional coherence) all
   * differed per room. v56 makes the accent-tile spark intensity per-room —
   * the actual brightness of the disassembly flash.
   *  - 0.6 vault-hush (privacy/terms): accent tiles barely glow — somber
   *    courtroom disassembly with no celebratory flare.
   *  - 3.6 blazing celebration (congrats): accent tiles burst with intense
   *    emissive flare — the disassembly itself is a fireworks moment.
   *  - 2.8 alarm-bright (reset-password): urgent flash, but tight & sharp.
   *  - 1.0 utilitarian-dim (settings): restrained spark, no drama.
   * Compounds with v55 directional coherence (privacy vault-precision +
   * vault-hush = wholly somber engineered opening; congrats confetti
   * direction + fireworks-bright = pure jubilation).
   */
  pulseEmissivePeak: number;
  /**
   * P2 v63 — per-room DOORWAY CASING DEPTH (world units). The third architectural
   * axis of the threshold itself: v57 elevation = WHERE the hole sits, v62 shape =
   * WHAT silhouette it cuts, v63 = how DEEP it recesses along the camera-through axis.
   * Pre-v63 the lintel was paper-thin: a single ring of tiles flush with the wall
   * plane. Camera dollied through a 1-tile-thick slit, not architecture. VISION
   * calls tiles "discrete physical objects — thickness, mass, a clip" and demands
   * the camera "dollies through the gaps". v63 satisfies this by cloning the entire
   * lintel ring inward along the wall normal by casingDepth units, building a
   * recessed tile-built threshold tunnel the camera physically traverses.
   *   0.10 congrats — flush cathedral lip (lintel dissolves into reward chamber)
   *   0.15 settings  — utilitarian thin frame
   *   0.20 calendar  — planning room minimal casing
   *   0.25 landing   — subtle threshold (baseline)
   *   0.30 day       — focused mid-depth
   *   0.40 goals     — cathedral approach
   *   0.50 onboarding— welcoming inset
   *   0.65 reset-password — alarm hatch sucked back into wall
   *   0.80 privacy/terms — vault casing deeply recessed (CHUNKIEST in shell)
   * Range 0.10 → 0.80 (8× spread). Walls are typically 5–8 units tall and rooms
   * 9–14 deep, so 0.8u recess is plainly readable as architecture — a vault frame
   * juts into the room; 0.1u reads as a flush dissolve.
   */
  doorwayCasingDepth: number;
  /**
   * P2 v64 — per-room WALL TILE DEPTH (world units, the Z dimension of a wall
   * tile box). The architectural axis of MASS itself. VISION states tiles are
   * "discrete physical objects — thickness, mass, a clip, a parallax depth"
   * — but pre-v64 every wall tile in every room used the same hardcoded 0.06u
   * depth. Walls were all the same membrane regardless of register. v64
   * differentiates: legal vaults wear thick stone slabs (0.16), planning rooms
   * wear thin parchment (0.05), reward chambers wear light cathedral gypsum
   * (0.07). Applied to wall + lintel + casing-clone tiles uniformly; floor
   * and ceiling tile depths are computed separately and unaffected.
   *   0.05 calendar  — planning parchment (THINNEST in shell)
   *   0.06 settings  — utility plate
   *   0.07 congrats  — light cathedral gypsum (floats with celebration pulse)
   *   0.08 landing   — neutral hub baseline
   *   0.09 day       — focused balanced
   *   0.10 onboarding— welcoming weight
   *   0.12 goals     — cathedral mass (ambition demands heft)
   *   0.14 reset-password — alarm bulkhead
   *   0.16 privacy/terms — vault stone (CHUNKIEST in shell)
   * Range 0.05 → 0.16 (≈3.2× spread). Differentiates the wall *substance*
   * across the shell: paper rooms vs. stone rooms vs. bulkhead rooms.
   */
  wallTileDepth: number;
  /**
   * P2 v65 — per-room TILE DEPTH JITTER (world units, signed offset along the
   * wall's outward normal). The architectural axis of CRAFTSMANSHIP itself.
   * VISION states tiles are "discrete physical objects" — real masonry tiles,
   * hand-laid, sit slightly proud or recessed in their planes. Pre-v65 every
   * tile in every room sat perfectly flush — machined precision regardless of
   * room mood. v65 differentiates: vault rooms (privacy/terms) stay machined-
   * flush at 0 (legal tolerance); celebration sits party-tilt askew (congrats
   * 0.050); planning rooms barely shift (calendar 0.010 architect's drafting
   * board). Each tile gets a stable signed jitter from its driftSeed in
   * [-tileDepthJitter, +tileDepthJitter], so the same tile sits the same
   * amount proud or recessed across renders. Applied to wall + lintel +
   * casing-clone tiles uniformly — real masonry craftsmanship is uniform.
   *   0.000 privacy/terms — vault stone, machined flush (legal tolerance)
   *   0.005 settings   — utility plate, near-flush
   *   0.010 calendar   — drafting parchment slight shuffle
   *   0.014 day        — focused subtle hand
   *   0.018 landing    — hub baseline
   *   0.022 onboarding — welcoming hand-laid
   *   0.030 goals      — cathedral eager construction
   *   0.040 reset-password — alarm scramble haste
   *   0.050 congrats   — party-tilt celebration askew (CHUNKIEST in shell)
   * Range 0.000 → 0.050. tileDepthJitter < wallTileDepth in every room so a
   * tile is never knocked entirely out of its plane — the offset reads as
   * craftsmanship texture, not chaos.
   */
  tileDepthJitter: number;
  /**
   * P2 v66 — per-room TILE MORTAR GAP (world units, in-plane inset on every
   * edge of every tile). The architectural axis of JOINTERY itself. VISION
   * calls tiles "discrete physical objects" — but pre-v66 every wall, floor,
   * and ceiling was laid tile-edge-to-tile-edge, so the surface read as a
   * continuous membrane (the global 8% inset was uniform across all rooms,
   * effectively the SAME negative-space everywhere — not a per-room voice).
   * v66 makes the joint per-room: vault rooms (privacy/terms) read as
   * monolithic poured slab (0 gap, edges kiss); celebration shows every tile
   * as a discrete brick (wide gap, joints catch shadow); planning rooms sit
   * between (tight architect's seam). Applied uniformly to floor/ceiling pad
   * and wall horizontal/vertical pad — the same gap that lays a floor lays a
   * wall, real masonry doesn't switch jointery between surfaces.
   *   0.000 privacy/terms — monolithic vault, no joints (poured stone)
   *   0.003 calendar      — drafting parchment, near-monolithic
   *   0.005 day           — focused fine seam
   *   0.008 landing       — hub baseline (≈ pre-v66 global default for tileSize=0.60)
   *   0.010 settings      — utility plate, visible seam
   *   0.012 onboarding    — welcoming hand-laid, gentle joint
   *   0.015 goals         — cathedral mass with breathing room
   *   0.020 reset-password — alarm bulkhead, wide assembly gap
   *   0.025 congrats      — party bricks, joints catch light (WIDEST in shell)
   * Range 0.000 → 0.025. Applied as: tilePad = tileSize - mortarGap,
   * tileWPad = tileW - mortarGap, tileHPad = tileH - mortarGap.
   */
  mortarGap: number;
  /**
   * P2 v67 — per-room WALL BOND / STAGGER (0 = stacked bond, 0.5 = perfect
   * running bond). The architectural axis of MASONRY BOND itself. Pre-v67
   * every wall in every room was stacked-bond — vertical joints aligned in
   * unbroken columns floor-to-ceiling. Stacked bond is structurally weak in
   * real masonry and visually monotonous; running bond (each row offset by
   * a fraction of a tile width) is the dominant pattern in built architecture
   * because it both distributes load and reads as actual construction rather
   * than a printed grid. v67 makes the bond per-room: vault/utility/alarm
   * rooms wear perfect running bond (0.5 — structural masonry); calendar and
   * congrats stay stacked (0.0 — drafting grid and decorative fanfare columns
   * are features, not bugs); the rest sit between.
   *
   * Applied to all 4 wall loops (N/S/W/E) and the casing-clone tiles. Odd
   * rows along the wall-tangent axis shift by `wallStagger * tileW`. Tiles
   * whose right edge would overshoot the wall corner are clipped (matches
   * "queen closer" half-brick reality — the offset row simply has one fewer
   * tile on the overshoot side). Floor/ceiling bond is intentionally NOT
   * affected — wall bond is the dominant architectural read.
   *   0.00 calendar    — drafting grid, joints aligned (grid is the feature)
   *   0.00 congrats    — decorative stacked-bond columns (party fanfare)
   *   0.25 landing     — quarter offset, neutral hub
   *   0.33 day         — third-bond, focused but informal
   *   0.33 onboarding  — third-bond, welcoming hand-laid
   *   0.50 goals       — perfect running bond (cathedral construction)
   *   0.50 settings    — perfect running bond (utility tile)
   *   0.50 reset-password — perfect running bond (alarm bulkhead)
   *   0.50 privacy     — perfect running bond (vault masonry)
   *   0.50 terms       — perfect running bond (matches privacy)
   * Range 0.00 → 0.50.
   */
  wallStagger: number;
  /**
   * P2 v68 — per-room TILE-VOID DENSITY. VISION explicitly forbids flat
   * backdrops ("not bg-black"). Pre-v68 the persistent Canvas had a literal
   * `<color attach="background" args={["#000000"]} />` — the deepest layer of
   * the entire shell WAS the flat backdrop VISION names. v68 replaces that
   * with a per-room cloud of distant emissive tile-points (instanced shell
   * around the room volume, beyond walls but within fogFar so atmosphere
   * tints them). Count drives DENSITY of the cosmos beyond every wall:
   *   80   privacy/terms — legal void, sparse cosmos
   *   120  settings      — utility minimum
   *   140  calendar      — clear cool architectural cosmos
   *   200  day           — contemplative midday haze
   *   240  landing       — hub baseline
   *   260  onboarding    — welcoming surround
   *   320  reset-password — alarm-busy
   *   380  goals         — eager cosmos
   *   600  congrats      — celebration cosmos (DENSEST)
   * Range 80 → 600.
   */
  voidTileCount: number;
  /**
   * P2 v68 — per-room TILE-VOID emissive color. Each distant tile glows in
   * the room's atmospheric register so the cosmos beyond the walls feels
   * continuous with the wall mood (legal cosmos = pale stone; celebration
   * cosmos = warm rose-gold). Falls back to fogColor when unset, so the void
   * always reads as belonging to the room.
   */
  voidTileColor?: string;
  /**
   * P2 v68 — per-room TILE-VOID drift rate (rad/s rotation of the cosmos
   * shell around the room center). The "cosmic version" of driftFreq —
   * how fast the world beyond the walls moves. Legal rooms = nearly still
   * (0.005); celebration = brisk swirl (0.04); calendar = languid sweep
   * (0.008). Pure rotation around Y, no per-tile drift — the shell as a
   * whole turns, suggesting depth + planetary scale.
   */
  voidTileDrift: number;
}

/**
 * Opening dimensions are in *world units*, not tile counts.
 * w = horizontal extent along the wall, h = vertical extent.
 * For floor/ceiling openings, w = x-extent, h = z-extent.
 */
export interface RoomOpening {
  w: number;
  h: number;
  // P2 v57 — per-room doorway elevation. Offsets the opening center in the
  // wall's 2D local frame: cy > 0 raises the threshold (cathedral arch),
  // cy < 0 lowers it (vault crawlspace, ducking demand). cx shifts laterally.
  // Defaults to 0 (opening centered) when omitted.
  cx?: number;
  cy?: number;
  // P2 v62 — per-room doorway SHAPE. The literal silhouette of the hole in the
  // wall, applied uniformly by inOpening() / lintelDist() for tile culling and
  // lintel-ring detection. Each shape encodes a different architectural register:
  //   rect  — rectangular doorway (default, neutral utilitarian)
  //   arch  — round Roman arch (rectangular bottom + ellipse top — cathedral / welcome)
  //   point — gothic pointed arch (rectangular bottom + triangle top — alarm sigil / vault gate)
  //   slot  — narrow vertical slit (half-width rectangle — legal vault / observation slit)
  // Applies only to WALL openings (north/south/east/west); floor/ceiling openings
  // always render as rect regardless of shape value. Defaults to rect when omitted.
  shape?: 'rect' | 'arch' | 'point' | 'slot';
}

export interface RoomOpenings {
  north?: RoomOpening; // -z wall
  south?: RoomOpening; // +z wall
  east?: RoomOpening;  // +x wall
  west?: RoomOpening;  // -x wall
  top?: RoomOpening;    // +y ceiling
  bottom?: RoomOpening; // -y floor
}

export interface RoomLayout {
  center: [number, number, number];
  size: [number, number, number]; // width(x), height(y), depth(z)
  openings: RoomOpenings;
  // P2 v58 — per-room wall verticality. Degrees of inward tilt for the 4 vertical
  // walls. Positive: walls converge inward at the top (oppressive vault). Negative:
  // walls flare outward (cathedral expansion). Floor/ceiling remain flat. Defaults
  // to 0 (perfectly vertical walls) when omitted.
  wallLean?: number;
  // P2 v59 — per-room floor slope. [tiltX, tiltZ] = vertical displacement (units)
  // of the +X edge above the -X edge, and the +Z edge above the -Z edge. Linear
  // slope; floor tiles are both y-deflected and quaternion-rotated so they sit
  // flush on the slope plane. Ceiling stays flat — only the floor tilts. Defaults
  // to [0, 0] (perfectly level) when omitted.
  floorTilt?: [number, number];
  // P2 v60 — per-room ceiling dome. Quadratic radial bulge at the room center.
  // Positive = ceiling apex bulges UP (cathedral vault apex). Negative = ceiling
  // sags DOWN at center (concave pressed-vault). Per-tile deflection follows
  // dome * (1 - (r/maxR)^2). Pure y-deflection only — tiles are not rotated
  // (stair-step is invisible at fluent room scale, and the curve reads cleanly
  // from the deflected centers alone). Defaults to 0 (flat ceiling) when omitted.
  ceilingDome?: number;
  // P2 v61 — per-room wall bulge. Sinusoidal outward/inward displacement at the
  // walls' vertical mid-height (peaks at half-height, zero at floor and ceiling).
  // Positive = walls bow OUTWARD at the waist (barrel — voluptuous chamber).
  // Negative = walls bow INWARD at the waist (hourglass — squeeze at the waist).
  // Composes additively with wallLean: lean is linear-with-height tilt, bulge is
  // a sinusoidal curve between floor and ceiling. Pure perpendicular shift, no
  // per-tile rotation (same rationale as ceilingDome — at fluent room scale the
  // curve reads from translated tile centers alone). Defaults to 0 when omitted.
  wallBulge?: number;
}

// BRIGHT shell palette — vivid brand hues on the 3D walls. Foreground UI panels
// stay dark (PANEL_DARK_PALETTE = pure black) and fully contain text so the
// colorful walls never compete with text contrast.
const NEUTRAL_DARK = ["#fcd02a", "#fb7025", "#f31b5e", "#3075e1", "#9a2393"];
const COOL_DARK    = ["#161b2c", "#1d2540", "#243156", "#1a2240", "#2c3d68"];
const WARM_DARK    = ["#2a1a0e", "#34210f", "#3d2812", "#241809", "#4a2a14"];
const ROSE_DARK    = ["#221220", "#2c1828", "#361e34", "#1c0e1c", "#3e1e34"];
const BRIGHT_TINT  = ["#2e2010", "#37260f", "#3f2c14", "#4a3318", "#5a3e1f"];

const BRAND       = ["#0a1121", "#0c144c", "#29187d", "#000000"];
const WARM_ACCENT = ["#fcd02a", "#fb7025", "#ff8a3d", "#ffa84d"];
const COOL_ACCENT = ["#3075e1", "#5c9bff", "#7cb8ff", "#fcd02a"];
const ROSE_ACCENT = ["#f31b5e", "#ff4d8a", "#ff8aab", "#fcd02a"];

// Per-room light hues + positions — warm key + cool fill encodes emotional register.
// Mood-as-function (VISION.md Phase 5): goals = fire of ambition (key from below for upward thrust),
// calendar = cool planning (horizontal fill across the table), congrats = celebratory rim+overhead,
// day = midday overhead, onboarding = soft side fill, settings = flat desaturated, etc.
// Offsets are RELATIVE to the room center (rooms are 10w × 6h × 12d).
const CHARACTERS: Record<ViewKey, RoomCharacter> = {
  landing:    { palette: NEUTRAL_DARK, accents: BRAND,       accentChance: 0.08, warmIntensity: 1.2, coolIntensity: 0.6, warmColor: "#fcd02a", coolColor: "#3075e1", warmOffset: [0, 1.5, 2],   coolOffset: [-3, -1, 1],   fogColor: "#05060a", fogNear: 10, fogFar: 36, atmosphereCount: 50,  atmosphereSpeed: 0.30, atmosphereSize: 2.2, atmosphereColor: "#fcd02a", tileSize: 0.60, tileAspect: 1.0, pulseDuration: 1.4,  pulseStrength: 0.65, pulseScatter: 1.00, pulseGravity: 1.00, pulseSpin: 1.00, driftAmp: 0.012, driftFreq: 0.40, hoverRadius: 2.6, hoverAmp: 0.13, bumpRadius: 4.6, bumpAmp: 0.95, celebDuration: 1.8,  celebRadialAmp: 0.55, celebUpAmp: 0.40, celebSpinAmp: 1.6, shakePulseAmp: 0.16,  shakeBumpAmp: 0.050, recoilBackAmp: 0.42, recoilUpAmp: 0.20, recoilTiltAmp: 0.08, audioShatterFreq: 900,  audioShatterGain: 0.18, audioRumbleFreq: 58, audioRumbleGain: 0.06, audioChimeRoot: 330, audioChimeIntervals: [1, 1.5, 2],       audioChimeGain: 0.04, breathYAmp: 0.040, breathForwardAmp: 0.025, breathPeriod: 4.6, dollyPitchAmp: 0.18, dollyPitchFreq: 3.1, dollyRollAmp: 0.06, dollyRollFreq: 4.2, dollyTiltFalloff: 3.5, dollyLerpSpeed: 1.4, dollyLookAtLerpSpeed: 1.8, parallaxXAmp: 0.22, parallaxYAmp: 0.14, parallaxLerp: 2.4, genWaveAmp: 0.040, genWaveSpeed: 1.6, genWaveLength: 0.65, genFadeIn: 0.4, tileRoughness: 0.65, tileMetalness: 0.15, lintelIntensity: 0.42, lintelBreathRate: 2.51, lintelBreathAmp: 0.45, lintelFlarePeak: 3.6, lintelRingThickness: 1.2, entryDuration: 1.6, entryNormalAmp: 1.4, entryTangentAmp: 0.5, entrySpinAmp: 0.7, reliefDepthRange: 1.0, reliefThicknessRange: 1.0, floorRippleRadius: 3.2, floorRippleAmp: 0.18, rolePrimaryRatio: 0.88, pulseEmissivePeak: 1.6, doorwayCasingDepth: 0.25, wallTileDepth: 0.08, tileDepthJitter: 0.018, mortarGap: 0.008, wallStagger: 0.25, voidTileCount: 240, voidTileColor: "#0c144c", voidTileDrift: 0.012 },  // neutral hub — baseline gait + baseline pace
  goals:      { palette: WARM_DARK,    accents: WARM_ACCENT, accentChance: 0.07, warmIntensity: 1.6, coolIntensity: 0.3, warmColor: "#fb7025", coolColor: "#f31b5e", warmOffset: [0, -2, 1],    coolOffset: [-3, 1, -2],   fogColor: "#1a0a04", fogNear: 7,  fogFar: 26, atmosphereCount: 90,  atmosphereSpeed: 0.42, atmosphereSize: 2.6, atmosphereColor: "#fb7025", tileSize: 0.50, tileAspect: 0.5, pulseDuration: 1.05, pulseStrength: 0.85, pulseScatter: 0.65, pulseGravity: 0.55, pulseSpin: 0.75, driftAmp: 0.018, driftFreq: 0.62, hoverRadius: 2.0, hoverAmp: 0.18, bumpRadius: 3.4, bumpAmp: 1.20, celebDuration: 1.4,  celebRadialAmp: 0.65, celebUpAmp: 0.55, celebSpinAmp: 1.8, shakePulseAmp: 0.22,  shakeBumpAmp: 0.080, recoilBackAmp: 0.52, recoilUpAmp: 0.24, recoilTiltAmp: 0.10, audioShatterFreq: 1400, audioShatterGain: 0.22, audioRumbleFreq: 70, audioRumbleGain: 0.07, audioChimeRoot: 392, audioChimeIntervals: [1, 1.25, 1.5],    audioChimeGain: 0.05, breathYAmp: 0.025, breathForwardAmp: 0.018, breathPeriod: 3.2, dollyPitchAmp: 0.22, dollyPitchFreq: 4.0, dollyRollAmp: 0.08, dollyRollFreq: 5.2, dollyTiltFalloff: 3.0, dollyLerpSpeed: 1.7, dollyLookAtLerpSpeed: 2.0, parallaxXAmp: 0.26, parallaxYAmp: 0.16, parallaxLerp: 3.0, genWaveAmp: 0.060, genWaveSpeed: 1.8, genWaveLength: 0.50, genFadeIn: 0.5, tileRoughness: 0.78, tileMetalness: 0.05, lintelIntensity: 0.55, lintelBreathRate: 3.0, lintelBreathAmp: 0.50, lintelFlarePeak: 4.2, lintelRingThickness: 1.4, entryDuration: 1.1, entryNormalAmp: 1.0, entryTangentAmp: 0.4, entrySpinAmp: 1.0, reliefDepthRange: 1.3, reliefThicknessRange: 1.3, floorRippleRadius: 2.6, floorRippleAmp: 0.22, rolePrimaryRatio: 0.92, pulseEmissivePeak: 2.4, doorwayCasingDepth: 0.40, wallTileDepth: 0.12, tileDepthJitter: 0.030, mortarGap: 0.015, wallStagger: 0.50, voidTileCount: 380, voidTileColor: "#5e2a10", voidTileDrift: 0.022 },  // ambition strikes — quick eager forward-lean gait + brisk pace
  calendar:   { palette: COOL_DARK,    accents: COOL_ACCENT, accentChance: 0.06, warmIntensity: 0.4, coolIntensity: 1.4, warmColor: "#5cc8ff", coolColor: "#1a4ba8", warmOffset: [3.5, 0, 0],   coolOffset: [-3.5, 0, 0],  fogColor: "#070b1c", fogNear: 14, fogFar: 46, atmosphereCount: 25,  atmosphereSpeed: 0.15, atmosphereSize: 1.8, atmosphereColor: "#7cb8ff", tileSize: 0.75, tileAspect: 1.6, pulseDuration: 1.9,  pulseStrength: 0.50, pulseScatter: 1.45, pulseGravity: 1.00, pulseSpin: 1.25, driftAmp: 0.010, driftFreq: 0.24, hoverRadius: 3.6, hoverAmp: 0.10, bumpRadius: 5.6, bumpAmp: 0.70, celebDuration: 2.4,  celebRadialAmp: 0.50, celebUpAmp: 0.30, celebSpinAmp: 1.2, shakePulseAmp: 0.10,  shakeBumpAmp: 0.028, recoilBackAmp: 0.30, recoilUpAmp: 0.14, recoilTiltAmp: 0.05, audioShatterFreq: 600,  audioShatterGain: 0.14, audioRumbleFreq: 45, audioRumbleGain: 0.05, audioChimeRoot: 294, audioChimeIntervals: [1, 1.2, 1.5],     audioChimeGain: 0.04, breathYAmp: 0.055, breathForwardAmp: 0.035, breathPeriod: 6.4, dollyPitchAmp: 0.10, dollyPitchFreq: 2.0, dollyRollAmp: 0.03, dollyRollFreq: 2.8, dollyTiltFalloff: 4.2, dollyLerpSpeed: 1.0, dollyLookAtLerpSpeed: 1.3, parallaxXAmp: 0.35, parallaxYAmp: 0.22, parallaxLerp: 1.6, genWaveAmp: 0.045, genWaveSpeed: 1.2, genWaveLength: 0.85, genFadeIn: 0.6, tileRoughness: 0.60, tileMetalness: 0.18, lintelIntensity: 0.45, lintelBreathRate: 1.6, lintelBreathAmp: 0.40, lintelFlarePeak: 4.0, lintelRingThickness: 1.0, entryDuration: 2.2, entryNormalAmp: 1.8, entryTangentAmp: 0.7, entrySpinAmp: 0.4, reliefDepthRange: 0.9, reliefThicknessRange: 0.9, floorRippleRadius: 4.4, floorRippleAmp: 0.16, rolePrimaryRatio: 0.75, pulseEmissivePeak: 1.4, doorwayCasingDepth: 0.20, wallTileDepth: 0.05, tileDepthJitter: 0.010, mortarGap: 0.003, wallStagger: 0.00, voidTileCount: 140, voidTileColor: "#1e3a72", voidTileDrift: 0.008 },  // graceful sway — steady composed gait, languid sweeping arrival
  day:        { palette: NEUTRAL_DARK, accents: BRAND,       accentChance: 0.06, warmIntensity: 1.0, coolIntensity: 0.8, warmColor: "#fcd02a", coolColor: "#e6f0ff", warmOffset: [0, 2.5, 0],   coolOffset: [0, 2.5, -3],  fogColor: "#3a3120", fogNear: 5,  fogFar: 20, atmosphereCount: 130, atmosphereSpeed: 0.22, atmosphereSize: 2.4, atmosphereColor: "#f5e0b0", tileSize: 0.55, tileAspect: 1.0, pulseDuration: 1.3,  pulseStrength: 0.55, pulseScatter: 0.95, pulseGravity: 1.00, pulseSpin: 1.00, driftAmp: 0.014, driftFreq: 0.45, hoverRadius: 2.4, hoverAmp: 0.14, bumpRadius: 4.2, bumpAmp: 0.95, celebDuration: 1.5,  celebRadialAmp: 0.45, celebUpAmp: 0.35, celebSpinAmp: 1.4, shakePulseAmp: 0.13,  shakeBumpAmp: 0.042, recoilBackAmp: 0.36, recoilUpAmp: 0.17, recoilTiltAmp: 0.07, audioShatterFreq: 800,  audioShatterGain: 0.16, audioRumbleFreq: 55, audioRumbleGain: 0.06, audioChimeRoot: 349, audioChimeIntervals: [1, 1.25, 1.5],    audioChimeGain: 0.04, breathYAmp: 0.038, breathForwardAmp: 0.024, breathPeriod: 4.2, dollyPitchAmp: 0.16, dollyPitchFreq: 3.0, dollyRollAmp: 0.05, dollyRollFreq: 3.8, dollyTiltFalloff: 3.5, dollyLerpSpeed: 1.4, dollyLookAtLerpSpeed: 1.8, parallaxXAmp: 0.20, parallaxYAmp: 0.13, parallaxLerp: 2.4, genWaveAmp: 0.040, genWaveSpeed: 1.6, genWaveLength: 0.65, genFadeIn: 0.4, tileRoughness: 0.62, tileMetalness: 0.10, lintelIntensity: 0.42, lintelBreathRate: 2.51, lintelBreathAmp: 0.45, lintelFlarePeak: 3.6, lintelRingThickness: 1.2, entryDuration: 1.5, entryNormalAmp: 1.3, entryTangentAmp: 0.5, entrySpinAmp: 0.7, reliefDepthRange: 1.0, reliefThicknessRange: 1.0, floorRippleRadius: 3.2, floorRippleAmp: 0.18, rolePrimaryRatio: 0.88, pulseEmissivePeak: 1.6, doorwayCasingDepth: 0.30, wallTileDepth: 0.09, tileDepthJitter: 0.014, mortarGap: 0.005, wallStagger: 0.33, voidTileCount: 200, voidTileColor: "#0c144c", voidTileDrift: 0.014 },  // contemplative focus — intimate balanced gait + balanced pace
  onboarding: { palette: COOL_DARK,    accents: COOL_ACCENT, accentChance: 0.05, warmIntensity: 0.6, coolIntensity: 1.1, warmColor: "#7cb8ff", coolColor: "#2a4570", warmOffset: [-2, 0.5, 2],  coolOffset: [2, -0.5, -1], fogColor: "#0a1226", fogNear: 9,  fogFar: 30, atmosphereCount: 60,  atmosphereSpeed: 0.30, atmosphereSize: 2.0, atmosphereColor: "#7cb8ff", tileSize: 0.70, tileAspect: 1.0, pulseDuration: 1.7,  pulseStrength: 0.55, pulseScatter: 1.10, pulseGravity: 0.65, pulseSpin: 1.10, driftAmp: 0.011, driftFreq: 0.32, hoverRadius: 2.8, hoverAmp: 0.11, bumpRadius: 5.0, bumpAmp: 0.80, celebDuration: 2.0,  celebRadialAmp: 0.40, celebUpAmp: 0.50, celebSpinAmp: 1.0, shakePulseAmp: 0.11,  shakeBumpAmp: 0.034, recoilBackAmp: 0.45, recoilUpAmp: 0.28, recoilTiltAmp: 0.10, audioShatterFreq: 700,  audioShatterGain: 0.13, audioRumbleFreq: 50, audioRumbleGain: 0.05, audioChimeRoot: 261, audioChimeIntervals: [1, 1.25, 1.5],    audioChimeGain: 0.04, breathYAmp: 0.045, breathForwardAmp: 0.028, breathPeriod: 5.2, dollyPitchAmp: 0.20, dollyPitchFreq: 2.6, dollyRollAmp: 0.07, dollyRollFreq: 3.2, dollyTiltFalloff: 4.0, dollyLerpSpeed: 1.1, dollyLookAtLerpSpeed: 1.4, parallaxXAmp: 0.24, parallaxYAmp: 0.16, parallaxLerp: 2.0, genWaveAmp: 0.045, genWaveSpeed: 1.4, genWaveLength: 0.70, genFadeIn: 0.6, tileRoughness: 0.72, tileMetalness: 0.00, lintelIntensity: 0.50, lintelBreathRate: 2.3, lintelBreathAmp: 0.45, lintelFlarePeak: 3.8, lintelRingThickness: 1.3, entryDuration: 1.9, entryNormalAmp: 1.6, entryTangentAmp: 0.6, entrySpinAmp: 0.5, reliefDepthRange: 1.1, reliefThicknessRange: 1.1, floorRippleRadius: 3.8, floorRippleAmp: 0.20, rolePrimaryRatio: 0.85, pulseEmissivePeak: 1.8, doorwayCasingDepth: 0.50, wallTileDepth: 0.10, tileDepthJitter: 0.022, mortarGap: 0.012, wallStagger: 0.33, voidTileCount: 260, voidTileColor: "#1c2a48", voidTileDrift: 0.010 },  // welcoming soft — gentle broad sway-gait, unhurried welcoming pace
  congrats:   { palette: BRIGHT_TINT,  accents: BRAND,       accentChance: 0.18, warmIntensity: 2.0, coolIntensity: 0.4, warmColor: "#f31b5e", coolColor: "#fcd02a", warmOffset: [0, 2.5, 0],   coolOffset: [0, 1.5, -4],  fogColor: "#1f0814", fogNear: 8,  fogFar: 26, atmosphereCount: 220, atmosphereSpeed: 0.55, atmosphereSize: 3.2, atmosphereColor: "#fcd02a", tileSize: 0.50, tileAspect: 1.0, pulseDuration: 1.6,  pulseStrength: 1.00, pulseScatter: 1.60, pulseGravity: 0.40, pulseSpin: 1.50, driftAmp: 0.020, driftFreq: 0.55, hoverRadius: 3.4, hoverAmp: 0.20, bumpRadius: 5.4, bumpAmp: 1.25, celebDuration: 2.6,  celebRadialAmp: 0.85, celebUpAmp: 0.70, celebSpinAmp: 2.4, shakePulseAmp: 0.28,  shakeBumpAmp: 0.095, recoilBackAmp: 0.82, recoilUpAmp: 0.40, recoilTiltAmp: 0.15, audioShatterFreq: 1100, audioShatterGain: 0.26, audioRumbleFreq: 42, audioRumbleGain: 0.10, audioChimeRoot: 440, audioChimeIntervals: [1, 1.25, 1.5, 2], audioChimeGain: 0.08, breathYAmp: 0.060, breathForwardAmp: 0.040, breathPeriod: 5.6, dollyPitchAmp: 0.28, dollyPitchFreq: 4.2, dollyRollAmp: 0.10, dollyRollFreq: 5.6, dollyTiltFalloff: 3.8, dollyLerpSpeed: 0.9, dollyLookAtLerpSpeed: 1.2, parallaxXAmp: 0.30, parallaxYAmp: 0.20, parallaxLerp: 2.0, genWaveAmp: 0.055, genWaveSpeed: 2.0, genWaveLength: 0.55, genFadeIn: 0.3, tileRoughness: 0.32, tileMetalness: 0.30, lintelIntensity: 0.85, lintelBreathRate: 3.2, lintelBreathAmp: 0.55, lintelFlarePeak: 6.0, lintelRingThickness: 0.9, entryDuration: 2.4, entryNormalAmp: 2.2, entryTangentAmp: 0.9, entrySpinAmp: 1.2, reliefDepthRange: 1.6, reliefThicknessRange: 1.6, floorRippleRadius: 5.6, floorRippleAmp: 0.28, rolePrimaryRatio: 0.60, pulseEmissivePeak: 3.6, doorwayCasingDepth: 0.10, wallTileDepth: 0.07, tileDepthJitter: 0.050, mortarGap: 0.025, wallStagger: 0.00, voidTileCount: 600, voidTileColor: "#5e1828", voidTileDrift: 0.040 },  // REWARD ROOM — exuberant chest-out gait + slow grand victory-sweep arrival (slowest in shell)
  settings:   { palette: NEUTRAL_DARK, accents: COOL_ACCENT, accentChance: 0.03, warmIntensity: 0.5, coolIntensity: 0.9, warmColor: "#cad4e8", coolColor: "#404a5c", warmOffset: [0, 1, 0],     coolOffset: [0, 1, 0],     fogColor: "#0c0e14", fogNear: 12, fogFar: 38, atmosphereCount: 30,  atmosphereSpeed: 0.18, atmosphereSize: 1.6, atmosphereColor: "#cad4e8", tileSize: 0.60, tileAspect: 1.0, pulseDuration: 1.4,  pulseStrength: 0.50, pulseScatter: 0.80, pulseGravity: 1.10, pulseSpin: 0.85, driftAmp: 0.008, driftFreq: 0.30, hoverRadius: 2.0, hoverAmp: 0.08, bumpRadius: 4.0, bumpAmp: 0.65, celebDuration: 1.2,  celebRadialAmp: 0.30, celebUpAmp: 0.20, celebSpinAmp: 0.8, shakePulseAmp: 0.08,  shakeBumpAmp: 0.025, recoilBackAmp: 0.22, recoilUpAmp: 0.10, recoilTiltAmp: 0.04, audioShatterFreq: 750,  audioShatterGain: 0.10, audioRumbleFreq: 60, audioRumbleGain: 0.04, audioChimeRoot: 330, audioChimeIntervals: [1, 1.2, 1.5],     audioChimeGain: 0.03, breathYAmp: 0.030, breathForwardAmp: 0.020, breathPeriod: 4.8, dollyPitchAmp: 0.08, dollyPitchFreq: 2.4, dollyRollAmp: 0.02, dollyRollFreq: 2.4, dollyTiltFalloff: 3.2, dollyLerpSpeed: 1.8, dollyLookAtLerpSpeed: 2.1, parallaxXAmp: 0.14, parallaxYAmp: 0.09, parallaxLerp: 2.8, genWaveAmp: 0.030, genWaveSpeed: 1.6, genWaveLength: 0.65, genFadeIn: 0.3, tileRoughness: 0.55, tileMetalness: 0.40, lintelIntensity: 0.30, lintelBreathRate: 2.6, lintelBreathAmp: 0.30, lintelFlarePeak: 2.8, lintelRingThickness: 1.1, entryDuration: 1.2, entryNormalAmp: 1.0, entryTangentAmp: 0.3, entrySpinAmp: 0.5, reliefDepthRange: 0.6, reliefThicknessRange: 0.6, floorRippleRadius: 2.4, floorRippleAmp: 0.10, rolePrimaryRatio: 0.82, pulseEmissivePeak: 1.0, doorwayCasingDepth: 0.15, wallTileDepth: 0.06, tileDepthJitter: 0.005, mortarGap: 0.010, wallStagger: 0.50, voidTileCount: 120, voidTileColor: "#252a36", voidTileDrift: 0.009 },  // utilitarian — restrained minimal gait + quick efficient pace
  privacy:    { palette: NEUTRAL_DARK, accents: BRAND,       accentChance: 0.04, warmIntensity: 1.0, coolIntensity: 0.6, warmColor: "#f5e9d3", coolColor: "#3a4658", warmOffset: [0, 1.5, 2],   coolOffset: [-3, -1, 1],   fogColor: "#080a10", fogNear: 11, fogFar: 36, atmosphereCount: 40,  atmosphereSpeed: 0.25, atmosphereSize: 1.9, atmosphereColor: "#f5e9d3", tileSize: 0.65, tileAspect: 0.7, pulseDuration: 1.8,  pulseStrength: 0.45, pulseScatter: 0.65, pulseGravity: 1.75, pulseSpin: 0.50, driftAmp: 0.005, driftFreq: 0.18, hoverRadius: 1.6, hoverAmp: 0.05, bumpRadius: 3.0, bumpAmp: 0.45, celebDuration: 1.0,  celebRadialAmp: 0.20, celebUpAmp: 0.15, celebSpinAmp: 0.6, shakePulseAmp: 0.05,  shakeBumpAmp: 0.014, recoilBackAmp: 0.15, recoilUpAmp: 0.07, recoilTiltAmp: 0.03, audioShatterFreq: 400,  audioShatterGain: 0.06, audioRumbleFreq: 50, audioRumbleGain: 0.03, audioChimeRoot: 246, audioChimeIntervals: [1, 1.2, 1.414],   audioChimeGain: 0.02, breathYAmp: 0.015, breathForwardAmp: 0.010, breathPeriod: 5.4, dollyPitchAmp: 0.05, dollyPitchFreq: 2.0, dollyRollAmp: 0.01, dollyRollFreq: 2.0, dollyTiltFalloff: 2.6, dollyLerpSpeed: 2.2, dollyLookAtLerpSpeed: 2.6, parallaxXAmp: 0.08, parallaxYAmp: 0.05, parallaxLerp: 2.0, genWaveAmp: 0.020, genWaveSpeed: 1.4, genWaveLength: 0.65, genFadeIn: 0.4, tileRoughness: 0.92, tileMetalness: 0.00, lintelIntensity: 0.10, lintelBreathRate: 1.5, lintelBreathAmp: 0.20, lintelFlarePeak: 2.0, lintelRingThickness: 1.8, entryDuration: 1.8, entryNormalAmp: 0.8, entryTangentAmp: 0.2, entrySpinAmp: 0.3, reliefDepthRange: 0.4, reliefThicknessRange: 0.4, floorRippleRadius: 1.6, floorRippleAmp: 0.05, rolePrimaryRatio: 0.96, pulseEmissivePeak: 0.6, doorwayCasingDepth: 0.80, wallTileDepth: 0.16, tileDepthJitter: 0.000, mortarGap: 0.000, wallStagger: 0.50, voidTileCount: 80, voidTileColor: "#1a1c24", voidTileDrift: 0.005 },  // legal hush — military-rigid gait + crisp brisk halt
  terms:      { palette: NEUTRAL_DARK, accents: BRAND,       accentChance: 0.04, warmIntensity: 1.0, coolIntensity: 0.6, warmColor: "#f5e9d3", coolColor: "#3a4658", warmOffset: [0, 1.5, 2],   coolOffset: [-3, -1, 1],   fogColor: "#080a10", fogNear: 11, fogFar: 36, atmosphereCount: 40,  atmosphereSpeed: 0.25, atmosphereSize: 1.9, atmosphereColor: "#f5e9d3", tileSize: 0.65, tileAspect: 0.7, pulseDuration: 1.8,  pulseStrength: 0.45, pulseScatter: 0.65, pulseGravity: 1.75, pulseSpin: 0.50, driftAmp: 0.005, driftFreq: 0.18, hoverRadius: 1.6, hoverAmp: 0.05, bumpRadius: 3.0, bumpAmp: 0.45, celebDuration: 1.0,  celebRadialAmp: 0.20, celebUpAmp: 0.15, celebSpinAmp: 0.6, shakePulseAmp: 0.05,  shakeBumpAmp: 0.014, recoilBackAmp: 0.15, recoilUpAmp: 0.07, recoilTiltAmp: 0.03, audioShatterFreq: 400,  audioShatterGain: 0.06, audioRumbleFreq: 50, audioRumbleGain: 0.03, audioChimeRoot: 246, audioChimeIntervals: [1, 1.2, 1.414],   audioChimeGain: 0.02, breathYAmp: 0.015, breathForwardAmp: 0.010, breathPeriod: 5.4, dollyPitchAmp: 0.05, dollyPitchFreq: 2.0, dollyRollAmp: 0.01, dollyRollFreq: 2.0, dollyTiltFalloff: 2.6, dollyLerpSpeed: 2.2, dollyLookAtLerpSpeed: 2.6, parallaxXAmp: 0.08, parallaxYAmp: 0.05, parallaxLerp: 2.0, genWaveAmp: 0.020, genWaveSpeed: 1.4, genWaveLength: 0.65, genFadeIn: 0.4, tileRoughness: 0.92, tileMetalness: 0.00, lintelIntensity: 0.10, lintelBreathRate: 1.5, lintelBreathAmp: 0.20, lintelFlarePeak: 2.0, lintelRingThickness: 1.8, entryDuration: 1.8, entryNormalAmp: 0.8, entryTangentAmp: 0.2, entrySpinAmp: 0.3, reliefDepthRange: 0.4, reliefThicknessRange: 0.4, floorRippleRadius: 1.6, floorRippleAmp: 0.05, rolePrimaryRatio: 0.96, pulseEmissivePeak: 0.6, doorwayCasingDepth: 0.80, wallTileDepth: 0.16, tileDepthJitter: 0.000, mortarGap: 0.000, wallStagger: 0.50, voidTileCount: 80, voidTileColor: "#1a1c24", voidTileDrift: 0.005 },  // matches privacy (audio + breath + gait + pace + everything)
  "reset-password": { palette: ROSE_DARK, accents: ROSE_ACCENT, accentChance: 0.05, warmIntensity: 1.2, coolIntensity: 0.5, warmColor: "#ff4d8a", coolColor: "#5c1830", warmOffset: [0, 0.5, 2.5], coolOffset: [-2, -1.5, 0], fogColor: "#16070d", fogNear: 8,  fogFar: 26, atmosphereCount: 60, atmosphereSpeed: 0.32, atmosphereSize: 2.2, atmosphereColor: "#ff4d8a", tileSize: 0.50, tileAspect: 0.8, pulseDuration: 0.95, pulseStrength: 0.80, pulseScatter: 1.30, pulseGravity: 1.30, pulseSpin: 1.40, driftAmp: 0.022, driftFreq: 0.82, hoverRadius: 3.0, hoverAmp: 0.22, bumpRadius: 5.0, bumpAmp: 1.40, celebDuration: 1.1,  celebRadialAmp: 0.55, celebUpAmp: 0.45, celebSpinAmp: 1.5, shakePulseAmp: 0.18,  shakeBumpAmp: 0.060, recoilBackAmp: 0.36, recoilUpAmp: 0.16, recoilTiltAmp: 0.07, audioShatterFreq: 1700, audioShatterGain: 0.20, audioRumbleFreq: 65, audioRumbleGain: 0.06, audioChimeRoot: 415, audioChimeIntervals: [1, 1.2, 1.414],   audioChimeGain: 0.05, breathYAmp: 0.022, breathForwardAmp: 0.014, breathPeriod: 3.0, dollyPitchAmp: 0.24, dollyPitchFreq: 5.0, dollyRollAmp: 0.10, dollyRollFreq: 6.0, dollyTiltFalloff: 2.8, dollyLerpSpeed: 2.4, dollyLookAtLerpSpeed: 2.8, parallaxXAmp: 0.06, parallaxYAmp: 0.04, parallaxLerp: 3.6, genWaveAmp: 0.045, genWaveSpeed: 2.4, genWaveLength: 0.40, genFadeIn: 0.2, tileRoughness: 0.45, tileMetalness: 0.00, lintelIntensity: 0.55, lintelBreathRate: 4.0, lintelBreathAmp: 0.50, lintelFlarePeak: 4.5, lintelRingThickness: 2.0, entryDuration: 0.8, entryNormalAmp: 1.2, entryTangentAmp: 0.6, entrySpinAmp: 1.4, reliefDepthRange: 1.4, reliefThicknessRange: 1.4, floorRippleRadius: 2.2, floorRippleAmp: 0.16, rolePrimaryRatio: 0.94, pulseEmissivePeak: 2.8, doorwayCasingDepth: 0.65, wallTileDepth: 0.14, tileDepthJitter: 0.040, mortarGap: 0.020, wallStagger: 0.50, voidTileCount: 320, voidTileColor: "#4a1428", voidTileDrift: 0.034 },  // rapid urgent confirm — jittery alarm-stride gait + alarm-snap arrival (fastest)
  // Gallery — observatory. 80×40×80 expansive cathedral floored in cosmos, walls receded into fog. Sparse warm key, dense cool fill: a vault for distant marker-rooms to float in.
  gallery:    { palette: COOL_DARK,    accents: BRAND,       accentChance: 0.02, warmIntensity: 0.5, coolIntensity: 1.6, warmColor: "#fcd02a", coolColor: "#1a2240", warmOffset: [0, 8, 0],     coolOffset: [0, -8, 0],    fogColor: "#02030a", fogNear: 24, fogFar: 80, atmosphereCount: 420, atmosphereSpeed: 0.10, atmosphereSize: 1.4, atmosphereColor: "#7cb8ff", tileSize: 0.80, tileAspect: 1.0, pulseDuration: 2.4,  pulseStrength: 0.45, pulseScatter: 1.40, pulseGravity: 0.40, pulseSpin: 0.90, driftAmp: 0.014, driftFreq: 0.20, hoverRadius: 4.0, hoverAmp: 0.10, bumpRadius: 6.0, bumpAmp: 0.65, celebDuration: 2.6,  celebRadialAmp: 0.60, celebUpAmp: 0.50, celebSpinAmp: 1.2, shakePulseAmp: 0.10,  shakeBumpAmp: 0.030, recoilBackAmp: 0.45, recoilUpAmp: 0.22, recoilTiltAmp: 0.06, audioShatterFreq: 520,  audioShatterGain: 0.14, audioRumbleFreq: 38, audioRumbleGain: 0.09, audioChimeRoot: 220, audioChimeIntervals: [1, 1.5, 2, 3],    audioChimeGain: 0.05, breathYAmp: 0.060, breathForwardAmp: 0.040, breathPeriod: 7.0, dollyPitchAmp: 0.12, dollyPitchFreq: 2.0, dollyRollAmp: 0.04, dollyRollFreq: 2.4, dollyTiltFalloff: 5.0, dollyLerpSpeed: 0.8, dollyLookAtLerpSpeed: 1.1, parallaxXAmp: 0.40, parallaxYAmp: 0.26, parallaxLerp: 1.4, genWaveAmp: 0.030, genWaveSpeed: 1.0, genWaveLength: 0.45, genFadeIn: 0.6, tileRoughness: 0.70, tileMetalness: 0.20, lintelIntensity: 0.60, lintelBreathRate: 1.4, lintelBreathAmp: 0.50, lintelFlarePeak: 4.0, lintelRingThickness: 1.0, entryDuration: 2.6, entryNormalAmp: 2.2, entryTangentAmp: 1.0, entrySpinAmp: 0.6, reliefDepthRange: 1.2, reliefThicknessRange: 1.1, floorRippleRadius: 6.0, floorRippleAmp: 0.16, rolePrimaryRatio: 0.70, pulseEmissivePeak: 1.4, doorwayCasingDepth: 0.35, wallTileDepth: 0.10, tileDepthJitter: 0.020, mortarGap: 0.010, wallStagger: 0.33, voidTileCount: 800, voidTileColor: "#1a2240", voidTileDrift: 0.020 },  // OBSERVATORY — slowest, widest, deepest; markers are the stars
};

// P2 v50 — per-room doorway DIMENSIONS (the literal hole in the wall).
// Pre-v50: DOOR/FLOOR_HOLE = 2.4×2.4 universal across every room. Every threshold
// the same size regardless of room mood. v49 made thresholds *glow* per-room;
// v50 makes them *physically distinct* per-room — privacy a vault-slit, congrats
// a cathedral arch, reset-password a tall alarm slot.
//
// Constraint: doorway w ≤ wall horizontal extent, h ≤ room height. Smallest
// host walls are reset-password (depth 9, height 5) and privacy/terms (height 5),
// so DOORWAY_PRIVACY h=1.8 + DOORWAY_RESET h=2.4 fit comfortably.
//
// Spreads: w 2.57× (1.4 → 3.6), h 2.0× (1.8 → 3.6), opening AREA 5.14× (2.52 → 12.96).
// P2 v57 — cy elevates the doorway. Range across rooms: -0.4 (privacy/terms
// vault crouch) → +0.4 (goals eager-raised). 0.8-unit spread. Visible because
// doorway heights are 1.8–3.6 and rooms are 5–8 tall: a 0.4-unit shift moves
// the lintel by ~14% of room height, plainly readable as a threshold demand.
// P2 v62 — per-room SHAPE assignments encode architectural register:
//   landing/calendar/day/settings: rect    (utilitarian default)
//   goals/onboarding:              arch    (cathedral reach / welcoming gate)
//   privacy/terms:                 slot    (legal-vault slit — half-width crush)
//   reset-password:                point   (gothic alarm sigil)
//   congrats:                      rect    (bottom-only floor doorway — shape doesn't apply)
const DOORWAY_LANDING:    RoomOpening = { w: 2.4, h: 2.4, cy:  0.0, shape: 'rect'  }; // baseline neutral hub
const DOORWAY_GOALS:      RoomOpening = { w: 2.0, h: 2.8, cy:  0.4, shape: 'arch'  }; // raised + rounded — eager cathedral reach
const DOORWAY_CALENDAR:   RoomOpening = { w: 3.4, h: 2.6, cy:  0.0, shape: 'rect'  }; // planning level — broad and mid
const DOORWAY_DAY:        RoomOpening = { w: 2.4, h: 2.4, cy:  0.0, shape: 'rect'  }; // focus — mid baseline
const DOORWAY_ONBOARDING: RoomOpening = { w: 2.6, h: 2.6, cy:  0.2, shape: 'arch'  }; // welcoming Roman arch
const DOORWAY_CONGRATS:   RoomOpening = { w: 3.6, h: 3.6, shape: 'rect'           }; // bottom doorway — shape n/a
const DOORWAY_SETTINGS:   RoomOpening = { w: 1.8, h: 2.0, cy: -0.2, shape: 'rect'  }; // utilitarian — lintel sits lower
const DOORWAY_PRIVACY:    RoomOpening = { w: 1.4, h: 1.8, cy: -0.4, shape: 'slot'  }; // legal-vault slit — half-width crush
const DOORWAY_TERMS:      RoomOpening = { w: 1.4, h: 1.8, cy: -0.4, shape: 'slot'  }; // matches privacy
const DOORWAY_RESET:      RoomOpening = { w: 1.6, h: 2.4, cy: -0.3, shape: 'point' }; // gothic alarm sigil
const DOORWAY_GALLERY:    RoomOpening = { w: 3.6, h: 3.6, shape: 'rect'           }; // observatory floor-portal — wide vertical shaft to the marker vault

// P3 v47 — per-room GEOMETRY (footprint × ceiling × depth = literal physical space).
// Pre-v47 every room shared STD = [10, 6, 12]; rooms differed only in palette,
// light, atmosphere, kinetic character — never in *physical proportions*. Every
// room felt like the same cube re-skinned.
//
// v47 makes every room a different *body of space*: calendar reads as a wide
// planning expanse (widest+tallest+deepest in shell, 1.625× landing volume);
// congrats is a vertical reward cathedral (8u ceiling, biggest height); privacy/
// terms are oppressive low-ceiling legal cells (5u ceiling, smallest height);
// reset-password is the smallest cube in the shell (8w × 5h × 9d, 0.5× landing
// volume — claustrophobic alarm-state).
//
// Spreads: width 1.5× (8.0–12.0), height 1.8× (5.0–9.0 — biggest spread, vertical
// mood is most-felt), depth 1.56× (9.0–14.0), VOLUME 3.25× (360u³ reset-password
// to 1170u³ calendar).
//
// Constraints honored (verified against existing centers):
//   - All corridor gaps remain positive (1u–4u depending on neighbor pair);
//     calendar↔landing corridor narrows from 2u to 1.5u, all others ≥ 1u.
//   - All doors (2.4 × 2.4) fit through their host walls (min wall extent ≥ 5u).
//   - Floor-hole tunnel landing↔congrats: 1u clearance with congrats h=8.
//   - All TARGETS camera offsets remain inside their host rooms.
const SIZE_LANDING:    [number, number, number] = [10, 6,   12]; // baseline neutral hub
const SIZE_GOALS:      [number, number, number] = [9,  5.5, 11]; // ambition-intimate — slightly tighter
const SIZE_CALENDAR:   [number, number, number] = [12, 7.5, 13]; // planning expanse — biggest in shell
const SIZE_DAY:        [number, number, number] = [10, 6,   13]; // present focus — slight forward stretch
const SIZE_ONBOARDING: [number, number, number] = [9,  6,   11]; // welcoming-balanced
const SIZE_CONGRATS:   [number, number, number] = [11, 8,   12]; // reward cathedral — TALLEST
const SIZE_SETTINGS:   [number, number, number] = [8,  5.5, 10]; // utilitarian smaller-cube
const SIZE_PRIVACY:    [number, number, number] = [8,  5,   11]; // legal hush — low oppressive ceiling
const SIZE_TERMS:      [number, number, number] = [8,  5,   11]; // matches privacy
const SIZE_RESET:      [number, number, number] = [8,  5,   9];  // alarm-claustrophobic — SMALLEST
const SIZE_GALLERY:    [number, number, number] = [80, 40,  80]; // observatory vault — marker field, 12× larger than any other room

// Cleaner connection graph: corner rooms hang off a single cardinal neighbor
// so every transition has an unambiguous through-the-wall path.
const LAYOUTS: Record<ViewKey, RoomLayout> = {
  // landing is the hub — corridors radiate to the four cardinal rooms + congrats above
  landing:    { center: [0,  0,  0],    size: SIZE_LANDING,    openings: { west: DOORWAY_LANDING, east: DOORWAY_LANDING, north: DOORWAY_LANDING, south: DOORWAY_LANDING, top: DOORWAY_LANDING, bottom: DOORWAY_GALLERY }, wallLean: 0,    floorTilt: [0, 0],    ceilingDome: 0,    wallBulge: 0 },
  goals:      { center: [-12, 0,  0],   size: SIZE_GOALS,      openings: { east: DOORWAY_GOALS, north: DOORWAY_GOALS },                                                                  wallLean: 0,    floorTilt: [0, 0.4],  ceilingDome: 0,    wallBulge: 0 },     // upright commitment — taut vertical walls
  day:        { center: [ 12, 0,  0],   size: SIZE_DAY,        openings: { west: DOORWAY_DAY, north: DOORWAY_DAY },                                                                      wallLean: 0,    floorTilt: [0, 0],    ceilingDome: 0,    wallBulge: 0 },     // focused-flat baseline
  calendar:   { center: [ 0,  0, -14],  size: SIZE_CALENDAR,   openings: { south: DOORWAY_CALENDAR },                                                                                    wallLean: -1.5, floorTilt: [0.3, 0],  ceilingDome: 0.4,  wallBulge: 0.2 },   // gentle barrel — planning expanse breathes at the waist
  settings:   { center: [ 0,  0,  14],  size: SIZE_SETTINGS,   openings: { north: DOORWAY_SETTINGS, west: DOORWAY_SETTINGS, east: DOORWAY_SETTINGS },                                    wallLean: 1.5,  floorTilt: [0, 0],    ceilingDome: 0,    wallBulge: 0 },     // utilitarian — straight walls
  congrats:   { center: [ 0,  8,  0],   size: SIZE_CONGRATS,   openings: { bottom: DOORWAY_CONGRATS },                                                                                   wallLean: -3,   floorTilt: [0, 0],    ceilingDome: 1.5,  wallBulge: 0.5 },   // VOLUPTUOUS BARREL — celebration chamber swells at the waist (compounds with -3° flare + 1.5 apex)
  onboarding: { center: [-12, 0, -14],  size: SIZE_ONBOARDING, openings: { south: DOORWAY_ONBOARDING },                                                                                  wallLean: -1,   floorTilt: [0, 0.2],  ceilingDome: 0.3,  wallBulge: 0.15 },  // welcoming swell — gentle round
  privacy:    { center: [ 12, 0, -14],  size: SIZE_PRIVACY,    openings: { south: DOORWAY_PRIVACY },                                                                                     wallLean: 4,    floorTilt: [0, 0],    ceilingDome: -0.4, wallBulge: -0.3 },  // HOURGLASS CRUSH — walls squeeze inward at waist on top of +4° lean (peak claustrophobia)
  terms:      { center: [-12, 0,  14],  size: SIZE_TERMS,      openings: { east: DOORWAY_TERMS },                                                                                        wallLean: 4,    floorTilt: [0, 0],    ceilingDome: -0.4, wallBulge: -0.3 },  // matches privacy
  "reset-password": { center: [ 12, 0,  14], size: SIZE_RESET, openings: { west: DOORWAY_RESET },                                                                                        wallLean: 3,    floorTilt: [0, -0.5], ceilingDome: 0,    wallBulge: -0.25 }, // alarm cell tightens at the waist
  gallery:    { center: [0, -23,  0],   size: SIZE_GALLERY,    openings: { top: DOORWAY_GALLERY },                                                                                       wallLean: 0,    floorTilt: [0, 0],    ceilingDome: 0,    wallBulge: 0 },     // observatory marker vault — flat-walled, only the marker field has voice
};

export type WallFace = "north" | "south" | "east" | "west" | "top" | "bottom";

/**
 * Given two adjacent rooms, return which face of A you'd pass through to reach B.
 * Derived from the dominant axis of the (B - A) center vector.
 */
export function findConnectionFace(from: ViewKey, to: ViewKey): WallFace | null {
  if (from === to) return null;
  const a = LAYOUTS[from].center;
  const b = LAYOUTS[to].center;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  const ax = Math.abs(dx);
  const ay = Math.abs(dy);
  const az = Math.abs(dz);
  if (ay >= ax && ay >= az) return dy > 0 ? "top" : "bottom";
  if (ax >= az) return dx > 0 ? "east" : "west";
  return dz > 0 ? "south" : "north";
}

// Camera offsets are in *room-local* space.
// Cam is parked near the room's "approach" wall (the opening you arrive through),
// pointed at the opposite wall — so the dolly between two rooms threads through the gap
// instead of cutting the corner diagonally through a solid wall.
const roomTarget = (
  key: ViewKey,
  posOffset: [number, number, number],
  lookOffset: [number, number, number],
  fov?: number,
): CameraTarget => {
  const c = LAYOUTS[key].center;
  return {
    position: [c[0] + posOffset[0], c[1] + posOffset[1], c[2] + posOffset[2]],
    lookAt:   [c[0] + lookOffset[0], c[1] + lookOffset[1], c[2] + lookOffset[2]],
    fov,
  };
};

// STD room is 10w × 6h × 12d; "near a wall" = ~3.5u from center on that axis (room half - ~1.5).
// "Looking at far wall" = ~5u past center on the opposite axis.
const TARGETS: Record<ViewKey, CameraTarget> = {
  // P3 v31 — per-room FOV. Spatial mood lever beyond color/light/atmosphere:
  // wider FOV reads as expansive/airy (calendar = open scheduling, congrats =
  // wide celebration), narrower reads as intimate/focused (day = focus on
  // today, settings/onboarding/reset = utilitarian one-job rooms). Default
  // landing FOV is 55 (matches PersistentCanvas initial). Lerped per frame.
  // landing: hub — sit slightly back+up, look forward into the north corridor
  landing:    roomTarget("landing",    [0, 0.5, 2.5],   [0, 0.2, -5],   55),
  // goals is west of landing → arrive through goals' east opening → cam near east wall, look west
  goals:      roomTarget("goals",      [3.5, 0.4, 0],   [-5, 0.2, 0],   52),
  // day is east of landing → arrive through day's west opening → cam near west wall, look east
  day:        roomTarget("day",        [-3.5, 0.4, 0],  [5, 0.2, 0],    48),
  // calendar is north of landing → arrive through calendar's south opening → cam near south wall, look north
  calendar:   roomTarget("calendar",   [0, 0.4, 4.5],   [0, 0.2, -5],   65),
  // settings is south of landing → arrive through settings' north opening → cam near north wall, look south
  settings:   roomTarget("settings",   [0, 0.4, -4.5],  [0, 0.2, 5],    50),
  // congrats is above landing → arrive through congrats' bottom opening → cam low in the room, look up
  congrats:   roomTarget("congrats",   [0, -2.0, 0],    [0, 5, 0],      62),
  // onboarding is north of goals → arrive through onboarding's south opening → cam near south wall
  onboarding: roomTarget("onboarding", [0, 0.4, 4.5],   [0, 0.2, -5],   50),
  // privacy is north of day → arrive through privacy's south opening
  privacy:    roomTarget("privacy",    [0, 0.4, 4.5],   [0, 0.2, -5],   52),
  // terms is west of settings → arrive through terms' east opening → cam near east wall, look west
  terms:      roomTarget("terms",      [3.5, 0.4, 0],   [-5, 0.2, 0],   52),
  // reset-password is east of settings → arrive through its west opening → cam near west wall, look east
  "reset-password": roomTarget("reset-password", [-3.5, 0.4, 0], [5, 0.2, 0], 50),
  // gallery is below landing → arrive through gallery's top opening → cam near top of vault, look forward+down into marker field
  gallery:    roomTarget("gallery",    [0, 17, 0],     [0, 5, -5],     75),
};

interface RoomState {
  view: ViewKey;
  pulse: number;
  pulseAt: number;
  /** The view we just left — used by exit-disassemble animations */
  prevView: ViewKey | null;
  /** Remaining waypoints when chaining a non-adjacent transition through the hub graph. */
  pendingPath: ViewKey[];
}

/**
 * Bump impulses — short-lived per-click ripples in world space. When the user
 * clicks within a DOM panel, a bump is fired at the active room's lookAt;
 * Room.tsx reads getActiveBumps() each frame and pushes nearby tiles outward
 * from the bump origin with a quick rise/slow-decay envelope. Closes the
 * "every tile movement maps to a user state change" vision gap.
 */
export interface BumpImpulse {
  id: number;
  origin: [number, number, number];
  fireTime: number; // performance.now() / 1000
  intensity: number; // 0..1+, multiplies BUMP_AMP in Room.tsx
}
export const BUMP_LIFETIME = 0.55; // seconds — full envelope window

let state: RoomState = { view: "landing", pulse: 0, pulseAt: 0, prevView: null, pendingPath: [] };
let bumps: BumpImpulse[] = [];
let bumpId = 0;
const subs = new Set<() => void>();

const getSnapshot = () => state;
const subscribe = (cb: () => void) => {
  subs.add(cb);
  return () => {
    subs.delete(cb);
  };
};

const notify = () => subs.forEach((cb) => cb());

// Direct neighbors (rooms whose openings face each other through the LAYOUTS graph).
// Non-adjacent transitions are walked one neighbor at a time so the camera always
// passes through real openings, never through the void.
const ADJACENCY: Record<ViewKey, ViewKey[]> = {
  landing: ["goals", "day", "calendar", "settings", "congrats", "gallery"],
  goals: ["landing", "onboarding"],
  day: ["landing", "privacy"],
  calendar: ["landing"],
  settings: ["landing", "terms", "reset-password"],
  congrats: ["landing"],
  onboarding: ["goals"],
  privacy: ["day"],
  terms: ["settings"],
  "reset-password": ["settings"],
  gallery: ["landing"],
};

/** BFS shortest path between two views. Returns [from, ..., to] inclusive. */
export function findRoomPath(from: ViewKey, to: ViewKey): ViewKey[] {
  if (from === to) return [from];
  const queue: ViewKey[][] = [[from]];
  const visited = new Set<ViewKey>([from]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const last = path[path.length - 1];
    for (const next of ADJACENCY[last]) {
      if (visited.has(next)) continue;
      const newPath = [...path, next];
      if (next === to) return newPath;
      visited.add(next);
      queue.push(newPath);
    }
  }
  // Disconnected — fall back to a single hop (camera will cut across void).
  return [from, to];
}

export function setRoomView(v: ViewKey) {
  if (v === state.view) return;
  const path = findRoomPath(state.view, v);
  // path[0] is the current view; path[1] is the next leg; remainder is queued.
  const next = path[1] ?? v;
  const pendingPath = path.slice(2);
  state = {
    view: next,
    pulse: state.pulse + 1,
    pulseAt: performance.now(),
    prevView: state.view,
    pendingPath,
  };
  notify();
}

/** Advance one leg along a queued non-adjacent transition. No-op if the queue is empty. */
export function advanceRoomPath() {
  if (state.pendingPath.length === 0) return;
  const [next, ...rest] = state.pendingPath;
  state = {
    view: next,
    pulse: state.pulse + 1,
    pulseAt: performance.now(),
    prevView: state.view,
    pendingPath: rest,
  };
  notify();
}

export function getPendingPath(): ViewKey[] {
  return state.pendingPath;
}

export function getRoomView(): ViewKey {
  return state.view;
}

export function getPrevRoomView(): ViewKey | null {
  return state.prevView;
}

export function getRoomTarget(): CameraTarget {
  return TARGETS[state.view];
}

export function getPulse(): { pulse: number; pulseAt: number } {
  return { pulse: state.pulse, pulseAt: state.pulseAt };
}

/**
 * P2 v71 — UNIFY #3: cosmos drift inherits from camera dolly speed.
 *
 * The CameraRig already computes a normalized motionAmount per frame
 * (motionDist / dollyTiltFalloff, clamped to [0,1]). v71 publishes that
 * value module-locally so TileVoid (and any future subsystem that wants
 * to couple to camera motion — particles, fog density, lintel intensity)
 * can read it without prop-drilling through r3f tree.
 *
 * Updated every frame by CameraRig; read every frame by TileVoid.
 * Module-level scalar (not React state) — no notify, no subscribers, no
 * re-renders. Purely a frame-to-frame motion channel.
 */
let cameraMotion = 0;
export function setCameraMotion(v: number): void {
  cameraMotion = v;
}
export function getCameraMotion(): number {
  return cameraMotion;
}

/**
 * P2 v75 — UNIFY #7: camera FORWARD direction as a published channel. Mirrors
 * the cameraMotion pattern but carries SPATIAL info (a unit vector) instead of
 * scalar speed. CameraRig writes the camera's world-space forward each frame;
 * TileVoid reads it to tilt the cosmos rotation axis toward direction of
 * travel. First channel that carries directional information rather than just
 * intensity — opens UNIFY axis to cuts that respond to WHERE the camera is
 * going, not just how fast. Stored as a frozen-shape mutable record (no
 * THREE.Vector3 import needed; one allocation total, components overwritten).
 */
const cameraForward = { x: 0, y: 0, z: -1 };
export function setCameraForward(x: number, y: number, z: number): void {
  cameraForward.x = x;
  cameraForward.y = y;
  cameraForward.z = z;
}
export function getCameraForward(): { x: number; y: number; z: number } {
  return cameraForward;
}

/**
 * P3 v108 — UNIFY #40: OPENS HARMONIC CONVERGENCE meta-class. Every prior
 * UNIFY cut couples consumers to a shared SCALAR (cameraMotion, cameraForward,
 * pulse). v108 introduces a structurally new dimension: SHARED TEMPORAL
 * STRUCTURE. The camera body breathes at its own per-room frequency; the
 * lintel threshold breathes at its own per-room frequency. v108 publishes the
 * camera's breath PHASE as a global channel so other periodic consumers can
 * PHASE-LOCK to it — converging their rhythms, not just their amplitudes.
 *
 * Camera writes its current phaseAccumulator (radians, unbounded — consumers
 * wrap-around themselves via modulo) every frame after advancing. Lintel
 * breath (Room.tsx) pulls its own phase toward this value with strength
 * proportional to cameraMotion: at rest motion=0 → lintel runs free at its
 * per-room rate, at peak motion → lintel phase locks tight to camera breath
 * (the room INHERITS the camera's heartbeat under motion).
 *
 * First inter-consumer phase coupling in the field. Proves unification
 * extends beyond shared scalar → to shared RHYTHM.
 */
let cameraBreathPhase = 0;
export function setCameraBreathPhase(phase: number): void {
  cameraBreathPhase = phase;
}
export function getCameraBreathPhase(): number {
  return cameraBreathPhase;
}

/**
 * Fire a bump impulse at a world-space origin. Cheap — module-level list,
 * GC'd opportunistically in getActiveBumps. Doesn't notify subscribers
 * because Room.tsx polls each frame in useFrame; React doesn't need to
 * re-render on every bump (would be ~100 renders/sec for fast typing).
 */
export function fireBump(origin: [number, number, number], intensity = 1.0) {
  bumpId += 1;
  const now = performance.now() / 1000;
  bumps.push({ id: bumpId, origin, fireTime: now, intensity });
  // Trim expired entries when the list grows past a small ceiling.
  if (bumps.length > 32) {
    bumps = bumps.filter((b) => now - b.fireTime < BUMP_LIFETIME);
  }
}

/** Active bumps still within their decay envelope. Mutated each frame. */
export function getActiveBumps(): BumpImpulse[] {
  const now = performance.now() / 1000;
  // Lazy GC: prune expired before returning.
  if (bumps.length > 0) {
    bumps = bumps.filter((b) => now - b.fireTime < BUMP_LIFETIME);
  }
  return bumps;
}

/**
 * P3 v18 — celebration burst. State-change-driven, room-scoped, all-tile.
 * Differs from bumps (point-radial, transient) and pulses (back-wall only,
 * navigation-driven): fires on meaningful in-app state changes (goal submit,
 * day complete, streak milestone) and bursts EVERY tile in the active room
 * outward from room-center with vertical lift + tumble. The room itself
 * celebrates the user's action — closes the "every state change maps to
 * tile motion" half of the VISION quote that wall-pulse alone never reached.
 */
export interface CelebrationImpulse {
  id: number;
  view: ViewKey;       // room-scoped: only this room celebrates
  fireTime: number;    // performance.now() / 1000
  intensity: number;   // 0..2; tunes amp without rewriting the envelope
}
/**
 * P3 v39 — registry-level cleanup ceiling. Per-room celebration *duration* is
 * now read from RoomCharacter.celebDuration (0.95s privacy → 2.6s congrats);
 * this constant only governs how long an inactive celebration impulse is
 * retained before the registry filters it out. Set to 3.0s (above the longest
 * per-room duration) so no consumer ever sees a celebration get filtered
 * mid-envelope. Consumers (Room.tsx, CameraRig.tsx) gate per-room via
 * character.celebDuration, not this value.
 */
export const CELEBRATION_LIFETIME = 3.0;

let celebrations: CelebrationImpulse[] = [];
let celebrationId = 0;

export function fireCelebration(view: ViewKey, intensity = 1.0) {
  celebrationId += 1;
  const now = performance.now() / 1000;
  celebrations.push({ id: celebrationId, view, fireTime: now, intensity });
  if (celebrations.length > 8) {
    celebrations = celebrations.filter((c) => now - c.fireTime < CELEBRATION_LIFETIME);
  }
}

export function getActiveCelebrations(): CelebrationImpulse[] {
  const now = performance.now() / 1000;
  if (celebrations.length > 0) {
    celebrations = celebrations.filter((c) => now - c.fireTime < CELEBRATION_LIFETIME);
  }
  return celebrations;
}

// P3 v15 — cursor projected to world-space on the active room's lookAt plane.
// Written by CameraRig each frame (it has the smoothed cursor + camera basis).
// Read by Room.tsx to drift active-room tiles toward the cursor for ambient
// hover reactivity. Single-element store, no notify (per-frame poll).
const cursorWorld: [number, number, number] = [0, 0, 0];
let cursorWorldActive = false;

export function setCursorWorld(x: number, y: number, z: number, active: boolean) {
  cursorWorld[0] = x;
  cursorWorld[1] = y;
  cursorWorld[2] = z;
  cursorWorldActive = active;
}

export function getCursorWorld(): { pos: [number, number, number]; active: boolean } {
  return { pos: cursorWorld, active: cursorWorldActive };
}

// P3 v19 — camera world position. Published by CameraRig each frame after the
// position lerp + parallax/shake offsets settle. Read by Room.tsx so floor
// tiles can ripple beneath wherever the camera is parked (footstep-in-fabric).
// Single-element store, no notify — same pattern as cursorWorld.
const cameraWorld: [number, number, number] = [0, 0, 0];

export function setCameraWorld(x: number, y: number, z: number) {
  cameraWorld[0] = x;
  cameraWorld[1] = y;
  cameraWorld[2] = z;
}

export function getCameraWorld(): [number, number, number] {
  return cameraWorld;
}

// P3 v25 — generation wave. While async work is in progress (e.g. AI plan
// generation, 5-15s) the tile field gets a continuous traveling wave so the
// most magical UX beat (AI is making your plan) doesn't sit photometrically
// silent. Set when starting the async, clear when done. Single-flag state +
// startTime so the wave can fade in cleanly without an audible "click on".
let generatingActive = false;
let generatingStartedAt = 0;
let generatingView: ViewKey | null = null;

export function setGenerating(active: boolean, view: ViewKey | null = null) {
  if (active && !generatingActive) {
    generatingStartedAt = performance.now() / 1000;
  }
  generatingActive = active;
  generatingView = active ? view ?? state.view : null;
}

export function getGenerating(): { active: boolean; startedAt: number; view: ViewKey | null } {
  return { active: generatingActive, startedAt: generatingStartedAt, view: generatingView };
}

export function useRoomView(): ViewKey {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot).view;
}

export function useRoomTarget(): CameraTarget {
  const v = useRoomView();
  return TARGETS[v];
}

export function useRoomCharacter(): RoomCharacter {
  const v = useRoomView();
  return CHARACTERS[v];
}

export function getRoomCharacter(): RoomCharacter {
  return CHARACTERS[state.view];
}

export function getCharacterFor(v: ViewKey): RoomCharacter {
  return CHARACTERS[v];
}

export function getLayoutFor(v: ViewKey): RoomLayout {
  return LAYOUTS[v];
}

export function usePulse() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
