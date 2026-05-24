"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html } from "@react-three/drei";
import { fireBump, useRoomTarget, useRoomView } from "./RoomRegistry";
import { DomBridgeHost } from "./DomBridge";

const DISASSEMBLE_MS = 500;
// P3 v24 — keystroke ripple throttle. ~110ms = ~9 ripples/sec sustained, which
// reads as a textured patter under fast typing without bumps stacking faster
// than the BUMP_LIFETIME (0.55s) envelope can drain — keeps the room "felt"
// rather than overwhelmed.
const KEY_BUMP_THROTTLE_MS = 110;
const KEY_BUMP_INTENSITY = 0.32;

export function ActivePanel() {
  const target = useRoomTarget();
  const actualView = useRoomView();
  const [displayedView, setDisplayedView] = useState(actualView);
  const [leaving, setLeaving] = useState(false);
  const [lx, ly, lz] = target.lookAt;

  useEffect(() => {
    if (actualView === displayedView) return;
    setLeaving(true);
    const t = setTimeout(() => {
      setDisplayedView(actualView);
      setLeaving(false);
    }, DISASSEMBLE_MS);
    return () => clearTimeout(t);
  }, [actualView, displayedView]);

  // Click → tile bump. The DOM panel projects onto the active room's lookAt,
  // so firing at lookAt lands the impulse on the back wall and rippling tiles
  // there read as "the room reacted to you." We add a small randomized x/y
  // offset within the wall plane so multi-clicks don't pile on the exact same
  // spot — different clicks visibly hit different parts of the wall.
  const onClickBump = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Ignore the synthetic up event after a press, and skip non-primary buttons.
      if (e.button !== 0 && e.pointerType === "mouse") return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Normalized [-1, 1] within the panel — gives a believable spatial offset.
      const nx = (e.clientX / w) * 2 - 1;
      const ny = -((e.clientY / h) * 2 - 1);
      // ±1.6 units lateral, ±1.0 vertical jitter centered on lookAt.
      fireBump([lx + nx * 1.6, ly + ny * 1.0, lz]);
    },
    [lx, ly, lz],
  );

  // P3 v24 — keystroke ripples. Typing into the goal form / day feedback area
  // is the most personal moment in the app; the room sat dead silent through
  // it. Per VISION ("every tile movement maps to a state change"), keystroke
  // IS a state change. Each keypress fires a small bump at the focused field's
  // on-screen center, throttled to KEY_BUMP_THROTTLE_MS so sustained typing
  // reads as a textured ripple, not noise. Intensity 0.32 keeps the patter
  // gentle relative to a click (1.0).
  const lastKeyBumpAt = useRef(0);
  const onKeyBump = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // Skip non-printing modifiers + navigation keys — only fire on actual
      // text-producing keystrokes.
      if (e.key.length !== 1 && e.key !== "Backspace" && e.key !== "Enter") return;
      const now = performance.now();
      if (now - lastKeyBumpAt.current < KEY_BUMP_THROTTLE_MS) return;
      lastKeyBumpAt.current = now;
      // Use the focused element's on-screen rect center as the impulse origin —
      // typing happens at the input field, not at the cursor (which can be
      // anywhere). Falls back to lookAt center if no rect is available.
      const active = document.activeElement as HTMLElement | null;
      let nx = 0;
      let ny = 0;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
        const r = active.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const w = window.innerWidth || 1;
        const h = window.innerHeight || 1;
        nx = (cx / w) * 2 - 1;
        ny = -((cy / h) * 2 - 1);
      }
      fireBump([lx + nx * 1.6, ly + ny * 1.0, lz], KEY_BUMP_INTENSITY);
    },
    [lx, ly, lz],
  );

  return (
    <Html
      key={displayedView}
      transform={false}
      position={[lx, ly, lz]}
      zIndexRange={[100, 0]}
      style={{
        // P3 v28 — cam-rides composes after the centering translate so the
        // panel offsets in viewport AGAINST camera motion (camera shifts right
        // → wall stays put → panel translates -dx). CameraRig writes these
        // CSS vars per-frame from parallax + shake + recoil scalars.
        // P3 v165 — META-PIVOT cut #15: wayfinding crosses CANVAS→DOM. The
        // doorway-direction channel (live across cosmos + floor + walls +
        // particles + lintels + audio) now lands a third translate3d term
        // BEFORE the camera-shift translate: 6px max lateral / 6px max depth,
        // multiplied by `--app-doorway-x` / `--app-doorway-z` (normalized unit
        // vector summed from the active room's open doorways). At rest the
        // panel sits slightly off-center toward the doorway you're about to
        // walk through; transitions lerp the offset smoothly via the shared
        // CSS-var write throttle in CameraRig. Subtle on purpose — same range
        // as cam-shift parallax, composes additively so spatial cue and
        // parallax don't fight. FIRST DOM consumer of the doorway-direction
        // channel — wayfinding is now a SEVEN-substrate breadth spanning all
        // three rendering domains (canvas + audio + DOM).
        // P3 v228 — env-source SPATIAL axis opens on DOM substrate (4-axis
        // promotion). Before v228, SPATIAL had 3 substrates (lights v224 +
        // particles v225 + cosmos v227) all on the canvas side. DOM held
        // color (v222) + magnitude (v223) + temporal (v226) — 3 axes, no
        // SPATIAL. Appending a wall-clock translate3d Y term to this
        // existing transform stack simultaneously: (1) promotes SPATIAL
        // axis breadth 3 → 4 substrates — the FIRST non-canvas SPATIAL
        // env-source consumer; and (2) makes DOM the SECOND ever 4-axis
        // env-source substrate after cosmos v227 — the env-source cube now
        // has TWO substrates at the depth limit, proving the 4-axis
        // pattern is a structural property and not a one-off. The new
        // translate3d term inserts BEFORE the existing cam-shift and
        // scale terms so wayfinding (v165) and motion (cam-shift) remain
        // dominant; wall-clock SPATIAL is the SLOW background drift on the
        // panel's vertical anchor. At dayWarmth=0 (03:00) the panel sits
        // Y = -6px (subtle settle, midnight weight); at dayWarmth=1 (15:00)
        // panel lifts to Y = +6px (subtle rise, peak afternoon); at 0.5
        // (09:00/21:00) translate is 0 — backwards-compatible at the
        // midpoint. ±6px swing chosen tight enough that the panel never
        // feels physically displaced from its anchor — barely-conscious
        // breath of vertical drift that matches cosmos shell (v227), key
        // light (v224), and particle cloud (v225) all arcing the same
        // overhead silhouette. Cube after v228: color × 5 + magnitude × 4
        // + temporal × 5 + SPATIAL × 4 = 18 cells across 9 substrates. All
        // four env-source axes now ≥4 substrates — first time every axis
        // is mature. Multi-axis substrate roster: cosmos (4), DOM (4 —
        // NEW), lights (3), atmosphere (2). The 4-axis tier crosses the
        // canvas/DOM boundary on the same tick that completes axis-
        // category-saturation — a deep double-promotion.
        transform:
          "translate(-50%, -50%) translate3d(calc(var(--app-doorway-x, 0) * 6px), 0, calc(var(--app-doorway-z, 0) * 6px)) translate3d(0, calc((var(--app-day-warmth, 0.5) - 0.5) * 12px), 0) translate3d(var(--cam-shift-x, 0px), var(--cam-shift-y, 0px), 0) scale(var(--cam-scale, 1))",
        // P3 v173 — UNIFY: 2nd NEG-polarity wayfinding consumer (canvas→DOM
        // crossing). Compose v88's motion-yield with the new doorway-yield
        // multiplicatively: panel fades both during transit AND when the
        // camera gazes directly down an open doorway, so the spatial cue can
        // take focus when text isn't the primary subject. Mirrors v172's
        // shake yield on the canvas side — same field, same polarity, now
        // bridging into DOM.
        opacity: "calc(var(--app-motion-yield, 1) * var(--app-doorway-yield, 1))",
        // P3 v91 — UNIFY #23: DOM-side TEXTURAL yield. v88 added the first
        // DOM-side negative-coupling consumer (panel opacity rides
        // --app-motion-yield). v91 promotes DOM-side yield from a one-off
        // (opacity) into a 2-consumer category by adding a SECOND consumer on
        // the SAME channel: filter:blur. Computed as `(1 − yield) × 3px` via
        // calc(), so at rest yield=1 → blur=0px (text crisp), at peak dolly
        // yield≈0.25 → blur≈2.25px (text softens out of focus exactly as the
        // panel fades). The two effects compose multiplicatively on the same
        // substrate: text fades AND defocuses during transit, comes back
        // sharp + opaque at rest. Together with v86 (cursor authority) + v87
        // (idle breath) on the canvas side, polarity is now a 2×2 grid:
        // 2 substrates × 2 consumers each = 4 yielding subsystems anchored on
        // ONE scalar. 3px peak chosen low because blur filters compositing
        // entire DOM portal can hit GPU; 3px is perceptible without thrashing.
        // P3 v107 — UNIFY #39: cross-axis #6, FIRST NEG×POS quadrant. v91's
        // raw-yield blur read (`(1 − motion-yield) × 3px`) replaced by a
        // separately-lerped scalar published by CameraRig as
        // `--app-blur-smoothed` (already in pixels, 0..3 range). Same
        // channel-substitution pattern as v105 vs v92. Target still YIELDS
        // with motion (v91 amplitude preserved as the destination); lerp
        // RATE now INTENSIFIES with motion (positive rate × negative
        // amplitude). At rest: target=0, rate=4.0/s → blur eases back softly
        // after motion stops. At peak: target=3px, rate=6.0/s → blur snaps
        // in tight on commit. Closes the cross-axis meta-class polarity
        // matrix to 4/4 quadrants (NN, NP, PN, PP all filled).
        // P3 v180 — META-PIVOT cut #27: NEG×POS cross-field canvas→DOM bridge —
        // CLOSES the cross-field domain-breadth matrix to 4×2 (every polarity
        // quadrant now spans canvas + DOM). v178 opened NEG×POS on canvas
        // (breath amp = motion-NEG × wayfinding-POS). v180 mirrors that into
        // DOM by appending a contrast() term to the existing filter chain:
        //   contrast(1 + motion-yield × doorway-align × 0.35)
        // motion-yield = 1 at rest, ~0 in motion (the v88 NEG factor already
        // published by CameraRig). doorway-align = 0 off-axis, 1 looking down
        // a doorway (v176 POS factor). Multiplied: only BOTH at-rest AND
        // gaze-aligned crosses 0 → contrast lifts up to +35%. In motion the
        // factor collapses to 0 regardless of gaze; off-axis at rest the
        // factor is also 0. Reads as "body text SNAPS into sharper focus
        // only when you stop and gaze straight down the path" — mirrors v178
        // body breath inhaling toward where you're looking. Cross-field
        // polarity matrix domain breadth advances 3/4 → **4/4 — every
        // quadrant 2-domain. Cross-field matrix is now fully 4×2 mature.**
        // P3 v185 — META-PIVOT cut #32: 4th cross-field DOM consumer —
        // CLOSES DOM polarity matrix 3/4 → 4/4. NEG×NEG cell: panel
        // body DESATURATES when parked AND off-axis from every
        // doorway — the "drift" treatment for unanchored panels.
        // v176/v179/v180 covered POS×POS (letter spread), POS×NEG
        // (text-shadow), NEG×POS (contrast). v185 lights NEG×NEG via
        // saturate(): when --app-motion-yield × --app-doorway-yield
        // = 1 (parked + off-axis) saturation falls to 0.75; either
        // motion rising or alignment rising restores full color.
        // Pairs semantically with v184 audio pitch sink — same
        // NEG×NEG cell across audio (v184) and DOM (v185). DOM
        // matrix now 4/4. Cross-field meta-class advances toward
        // 4×3 fully-lit (all 12 cells across canvas + DOM + audio).
        // v188 — META-PIVOT cut #25: 3rd cross-field × harmonic-convergence
        // consumer (DOM substrate). v186 opened the axis on audio (drone
        // POS×POS pulses on tremoloPhase). v187 promoted to category on
        // canvas (floor POS×NEG pulses on getCameraBreathPhase). v188
        // crosses the SAME breath carrier into DOM via the new
        // --app-breath-phase var published by CameraRig (sin of
        // breathPhaseRef per-frame). The v180 NEG×POS cross-field
        // contrast cell now multiplies its cross-field product by
        // (1 + var(--app-breath-phase) × 0.25 × var(--app-motion-amount)),
        // so during aligned transit the panel's contrast lift swells and
        // ebbs on the same breath as the drone gain and the floor hush —
        // three surfaces, three substrates, three polarity quadrants,
        // ONE phase. Cross-field × harmonic-convergence axis is now
        // 3/3 substrate-saturated (canvas + audio + DOM). At rest
        // motion-amount = 0 → carrier collapses to 1 → identical to v180.
        // v192 — META-PIVOT cut #29: FIRST META³ COMPOSITION CELL — both
        // meta×meta axes (cross-field × harmonic AND cross-field × temporal-
        // derivative) MULTIPLIED ON THE SAME DOM PROPERTY. v188 lit this
        // contrast cell with axis-1 (breath-phase harmonic carrier); v192
        // ADDS axis-2 (doorway-align derivative carrier) as a second nested
        // multiplier on the SAME base cross-field product. The cell now
        // carries 4 nested factors in one CSS calc:
        //   base       = motion-yield × doorway-align (NEG×POS cross-field)
        //   × axis-1   = (1 + breath-phase × 0.25 × motion-amount)   (HARMONIC)
        //   × axis-2   = (1 + doorway-align-deriv × 6 × motion-amount) (DERIVATIVE)
        // This is the FIRST cell where both meta×meta axes coexist as
        // multiplicative carriers — the meta³ composition product (axis-1
        // × axis-2 × cross-field) opens here. The 2×3 axis×substrate matrix
        // (v186-v191) gave us the layered cake; v192 stacks two layers
        // multiplicatively onto a single slice. Phenomenology: panel
        // contrast lift now BREATHES (axis-1 ebb/flow) AND PUNCHES (axis-2
        // swing-in spike) simultaneously during aligned transit. At rest:
        // motion-amount = 0 → BOTH carriers collapse to 1 → identical to
        // v180. Single new factor, single new structural fact.
        // v197 — META-PIVOT cut #34: 3rd phase-offset consumer (DOM
        // substrate) SATURATES meta×meta axis-3 to 3/3 substrates (audio
        // v195 + canvas v196 + DOM v197), completing the 5TH PROMOTION
        // ARC INSTANCE. Lands on the NEG×NEG saturate cell — pure yield
        // form (motion-yield × doorway-yield × 0.25), polarity quadrant
        // mirror of audio v195's NEG×NEG pitch-detune cell. The new
        // `--app-breath-phase-offset` var (published by CameraRig as
        // sin(breathPhase + π·(1-align))) modulates the saturate yield's
        // depth by ±20% in tempo with breath, with phase TIMING shifting
        // as alignment changes. Mathematically: at rest+off-axis the
        // saturation desaturation (0.75) now flutters between 0.7-0.8;
        // as the user rotates toward alignment, the FLUTTER TIMING
        // ITSELF inverts (anti-phase). Phenomenology mirrors audio v195
        // exactly — both substrates carry "lost-in-the-room shimmer" in
        // their NEG×NEG yield cell. Default value 0 means at component
        // mount before first CameraRig publish the carrier collapses to
        // (1 + 0 * 0.2) = 1 = identical to pre-v197.
        // v201 — META-PIVOT cut #38: OPENS 8TH PROMOTION ARC — axis-1
        // harmonic carrier promotes from 1-substrate (audio v200 NEG×NEG
        // pitch-detune) to 2-substrate category on the NEG×NEG polarity
        // quadrant. Lands on the same v185 saturate cell that already
        // carries axis-3 (v197 phase-offset). Cell now nests 3 factors:
        //   base       = motion-yield × doorway-yield × 0.25 (NEG×NEG)
        //   × axis-3   = (1 + breath-phase-offset × 0.2)
        //   × axis-1   = (1 + breath-phase × 0.15 × (1-motion-amount))
        // The new axis-1 carrier is NEG-motion-gated `(1-motion-amount)`
        // to preserve cell polarity (mirrors audio v200's NEG×NEG harmonic
        // gating with `(1-camMotion)` — same rest-active polarity rule
        // applied across substrates). Depth 0.15 matches audio v200
        // exactly: the same swell magnitude reads across audio detune and
        // DOM desaturation in lockstep when parked off-axis. At rest +
        // off-axis the saturate desaturation (0.75 base) flutters with
        // breath, and the SAME flutter rides the audio detune — both
        // surfaces drift together at NEG×NEG. In motion (1-motion-amount)
        // → 0, carrier collapses to 1, identical to v197. **Cross-field ×
        // axis-1 polarity advances from 1/4 polarity quadrants single-
        // domain (POS×POS: audio+canvas+DOM via v186/v187/v188) toward
        // matrix expansion — axis-1 now spans 2 polarity quadrants (POS×POS
        // substrate-saturated + NEG×NEG 2-substrate emerging).**
        // v199 — META-PIVOT cut #36: 3RD META⁴ COMPOSITION CELL —
        // SATURATES meta⁴ composition to 3/3 substrates (canvas v196
        // floor + audio v198 drone gain + DOM v199 contrast), completing
        // the 6TH PROMOTION ARC INSTANCE. The v192 contrast cell already
        // carried axis-1 (--app-breath-phase) + axis-2 (--app-doorway-
        // align-deriv) as a meta³ composition. v199 adds axis-3
        // (--app-breath-phase-offset, already published by CameraRig
        // since v197) as a third nested carrier on the SAME cell. Cell
        // now nests 5 factors:
        //   base       = motion-yield × doorway-align (NEG×POS cross-field)
        //   × axis-1   = (1 + breath-phase × 0.25 × motion-amount)
        //   × axis-2   = (1 + doorway-align-deriv × 6 × motion-amount)
        //   × axis-3   = (1 + breath-phase-offset × 0.15 × motion-amount)
        // Same 5-factor structure as canvas v196 and audio v198 — three
        // substrates now carry identical 4-axis nested composition.
        // Depth 0.15 conservative (below canvas/audio's 0.2) because
        // DOM contrast lift is already perceptually dense after axes
        // 1+2; phase-drift on top should be subtle to avoid contrast
        // strobing. motion-amount gating matches axis-1+axis-2 polarity
        // exactly (active only during transit). Phenomenologically:
        // panel contrast lift now BREATHES (axis-1) AND PUNCHES (axis-2)
        // AND DRIFTS-IN-TIMING (axis-3) during aligned transit — three
        // textures multiplied on one filter property. At rest motion-
        // amount=0 → all three carriers collapse to 1 → identical to
        // pre-v192. Closes 6th promotion arc (meta⁴ → 3/3 substrates).
        //
        // P3 v222 — env-source crosses into DOM substrate. Trailing
        // hue-rotate term consumes the new --app-day-warmth scalar
        // (CameraRig publishes [0,1] from wall-clock via getDayWarmth).
        // Centered at 0.5 → 0deg neutral mid-day; peak 1.0 → +3° warm
        // (afternoon); trough 0.0 → -3° cool (deep night). ±3° swing
        // chosen tight to avoid fighting the canvas/lighting hue chord
        // already encoded by v211–v214; DOM joins as the SECOND signal
        // source (after cameraMotion v77+v88) to span all three
        // rendering domains — env-source now covers canvas (v211–v220),
        // audio (v221), AND DOM (v222). hue-rotate is structurally
        // novel: no prior consumer touches DOM hue, so this opens a
        // virgin axis on the panel filter chain without colliding with
        // contrast/saturate/brightness carriers. Default 0.5 collapses
        // hue-rotate to 0deg before CameraRig publishes — zero visual
        // impact pre-mount.
        //
        // P3 v223 — env-source MAGNITUDE axis opens on DOM (2nd
        // env-source axis on DOM substrate; promotes DOM from 1-axis
        // to 2-axis env-source consumer, matching cosmos/atmosphere/
        // lights canvas substrates that all walked the same color→
        // magnitude arc, and audio that opened temporal-only via
        // v221). A SECOND trailing brightness() term multiplies into
        // the existing motion brightness — at dayWarmth=0 → 0.92×
        // (deep night DOM panel dims slightly), at dayWarmth=1 → 1.08×
        // (peak afternoon brightens slightly), at 0.5 → 1.00× (neutral
        // mid-day). ±8% swing chosen tighter than v213/v216 canvas
        // magnitude cuts (±12%) because DOM panel text must remain
        // legible at the night trough — canvas backgrounds can dim more
        // freely than foreground UI text. Multiplies cleanly with the
        // existing motion brightness() — CSS filter chains compose by
        // multiplication, so the two brightness terms collapse to one
        // effective brightness at composite. Env-source × substrate ×
        // axis cube after v223: color × 5 (cosmos/atmosphere/lights/
        // walls/DOM) + magnitude × 4 (atmosphere reach + lights
        // intensity + cosmos intensity + DOM brightness) + temporal × 4
        // (cosmos drift + lintel breath + floor wave + drone pitch).
        // Magnitude axis hits 4-substrate parity with color and
        // temporal — all three env-source axes ≥4 substrates wide.
        // P3 v226 — env-source TEMPORAL axis opens on DOM. animation-duration
        // bound to --app-day-warmth via calc(): 9s at deep night → 5s at peak
        // afternoon (4s linear swing across the wall-clock). The keyframes
        // `app-day-breath` (defined in globals.css) animates the registered
        // custom property --app-day-breath-pulse 0→1→0 over each cycle. The
        // pulse is then read in the trailing brightness term below, adding a
        // ±2% breath modulation on top of the v223 magnitude swing. This is
        // the FIRST DOM-engine-temporal env-source consumer — all prior
        // TEMPORAL env-source cuts (cosmos drift v218, lintel breath v219,
        // floor wave v220, audio pitch v221) live in useFrame/RAF; v226's
        // carrier runs entirely on the CSS compositor thread. DOM substrate
        // promotes from 2-axis (color v222 + magnitude v223) to 3-axis
        // env-source consumer, joining cosmos (color/mag/temporal) and lights
        // (color/mag/spatial) as the 3rd substrate hosting env-source on ≥3
        // axes. TEMPORAL axis breadth ticks 4 → 5 substrates — the FIRST
        // env-source axis to tie color's 5-substrate lead. Env-source ×
        // substrate × axis cube after v226: color × 5 + magnitude × 4 +
        // TEMPORAL × 5 + spatial × 2 = 16 cells across 9 substrates (DOM
        // now occupies 3 cells: color, magnitude, temporal).
        animation: "app-day-breath calc(9s - var(--app-day-warmth, 0.5) * 4s) ease-in-out infinite",
        filter:
          "blur(calc(var(--app-blur-smoothed, 0) * 1px)) contrast(calc(1 + var(--app-motion-yield, 1) * var(--app-doorway-align, 0) * 0.35 * (1 + var(--app-breath-phase, 0) * 0.25 * var(--app-motion-amount, 0)) * (1 + var(--app-doorway-align-deriv, 0) * 6 * var(--app-motion-amount, 0)) * (1 + var(--app-breath-phase-offset, 0) * 0.15 * var(--app-motion-amount, 0)))) saturate(calc(1 - var(--app-motion-yield, 1) * var(--app-doorway-yield, 1) * 0.25 * (1 + var(--app-breath-phase-offset, 0) * 0.2) * (1 + var(--app-breath-phase, 0) * 0.15 * (1 - var(--app-motion-amount, 0))))) brightness(calc(1 + var(--app-motion-amount, 0) * var(--app-doorway-align, 0) * 0.15 * (1 + var(--app-doorway-align-deriv, 0) * 10))) hue-rotate(calc((var(--app-day-warmth, 0.5) - 0.5) * 6deg)) brightness(calc(1 + (var(--app-day-warmth, 0.5) - 0.5) * 0.16 + var(--app-day-breath-pulse, 0) * 0.02))",
        // P3 v92 — UNIFY #24: FIRST positive-coupling DOM consumer. Pre-v92
        // DOM substrate ONLY yielded (v88 opacity, v91 blur). v92 adds the
        // first INTENSIFYING DOM consumer: letter-spacing widens with motion.
        // CameraRig publishes the raw motionAmount as `--app-motion-amount`
        // (0..1) alongside `--app-motion-yield`. Inherited letter-spacing
        // value 0.03em peak chosen low: visceral tracking widen on text
        // during dolly without flex/grid layout thrash. Reads as "DOM
        // responds to motion by spreading" — exact mirror of how walls fly
        // outward and cosmos accelerates. Polarity now symmetric across BOTH
        // substrates AND BOTH polarities — canvas + DOM each carry intensify
        // + yield. One scalar (cameraMotion), one var (--app-motion-amount),
        // four polarity slots filled across two substrates.
        // P3 v105 — UNIFY #37: switched from raw --app-motion-amount to the
        // rate-yielded --app-letter-spread var. Same 0.03em peak, but now
        // smoothed through CameraRig's motion-coupled exp-lerp so letter-spacing
        // widens softly rather than tracking raw motion. v93 textShadow below
        // stays on --app-motion-amount intentionally — single substrate, two
        // consumers, one raw + one rate-yielded (proves cross-axis convergence
        // composes with non-converged consumers on the same channel).
        // P3 v113 — UNIFY #45: PROMOTES PHASE-WITH-VARIABLE-OFFSET meta-class
        // (opened v112 on cosmos drift) to a category by adding the SECOND
        // variable-offset consumer on a different substrate. v105's smoothed
        // letter-spread amplitude is now phase-modulated by CameraRig's new
        // `--app-letter-phase-mod` var (1.0 at rest, swings ±0.4 around 1.0
        // at peak motion AT a continuously morphing phase point — in-phase
        // echo at rest-onset → quadrature at mid-motion → anti-phase answer
        // at peak dolly). Multiplicative composition: v105 owns the amplitude
        // envelope, v113 owns the phase envelope. Reads as DOM text
        // breathing WITH the camera at motion-onset, then drifting OUT of
        // phase as the dolly commits — visceral phase-shift in text density
        // that matches the cosmos shell's variable-offset breath one layer
        // beneath.
        // P3 v176 — META-PIVOT cut #23: cross-field POS×POS canvas→DOM bridge.
        // v175 opened the POS×POS quadrant of the cross-field meta-class on
        // cosmos shader (motion-POS amp × wayfinding-POS lane brightness).
        // v176 mirrors v173's NEG canvas→DOM bridge in the opposite polarity:
        // CameraRig publishes `--app-doorway-align` (positive-clamped
        // forward·COSMOS_DOORWAY_DIR dot, 0..1). Letter-spacing now reads as
        //   letter-spread × phase-mod × (1 + doorway-align × 0.65) × 0.03em
        // composing v92's motion-POS amplitude with the wayfinding-POS gaze
        // signal. At rest off-axis: tracking baseline. At rest looking down a
        // doorway: tracking widens up to +65% even without motion. Mid-dolly
        // looking down a doorway: full motion amplitude × +65% gaze amplifier
        // → DOM TEXT BREATHES OPEN exactly when you commit to a doorway. The
        // cross-field POS×POS quadrant is now a 2-domain category (canvas
        // cosmos lane v175 + DOM letter-spacing v176) — mirrors how the
        // NEG×NEG quadrant lives across canvas (v174 cursor) + DOM (v173
        // opacity); cross-field meta-class polarity matrix advances from
        // 2 single-domain quadrants to 2 multi-domain quadrants.
        letterSpacing:
          "calc(var(--app-letter-spread, 0) * var(--app-letter-phase-mod, 1) * (1 + var(--app-doorway-align, 0) * 0.65) * 0.03em)",
        // P3 v93 — UNIFY #25: SECOND positive-coupling DOM consumer. v92 opened
        // the DOM+positive quadrant with letter-spacing (one-off). v93 promotes
        // that quadrant from a one-off into a CATEGORY by adding a second
        // consumer on the SAME --app-motion-amount channel: text-shadow glow.
        // currentColor inherits per-element ink so the glow reads as the text
        // self-illuminating during motion, NOT a foreign overlay. 6px peak
        // chosen visceral-but-cheap: text-shadow doesn't trigger layout (unlike
        // letter-spacing) so the safety margin is wide. With v93 the polarity
        // matrix (2 substrates × 2 polarities) is now STABLE — every quadrant
        // carries 2+ consumers, not just 1:
        //   canvas + intensify: walls accent emissive + cosmos drift speed + ...
        //   canvas + yield:     cursor parallax + idle breath
        //   DOM    + intensify: letter-spacing (v92) + text-shadow (v93) ← now category
        //   DOM    + yield:     opacity (v88) + blur (v91)
        // Pitchable sentence: "the field doesn't discriminate by substrate, and
        // it doesn't discriminate by polarity — every substrate carries every
        // polarity, and every quadrant is a category not a one-off."
        // P3 v179 — META-PIVOT cut #26: POS×NEG cross-field canvas→DOM bridge.
        // v177 opened the POS×NEG quadrant on canvas (floor ripple amp =
        // motion-POS × wayfinding-NEG). v179 mirrors v176's POS×POS bridge in
        // the opposite polarity: text-shadow glow now reads
        //   motion-amount × (1 − doorway-align × 0.6) × 6px
        // composing v93's motion-POS amplitude with the wayfinding-NEG gaze
        // yield. Mid-dolly off-axis: full glow. Mid-dolly looking down a
        // doorway: glow yields up to −60% so the spatial cue dominates over
        // text self-illumination — text recedes exactly as the floor hushes
        // (v177) and the cosmos lane blooms (v175). v179 promotes the POS×NEG
        // quadrant from 1-domain (canvas floor) to 2-domain category (canvas
        // floor + DOM text-shadow), matching how POS×POS matured v175→v176
        // and NEG×NEG matured v174→v173. Cross-field polarity matrix domain
        // breadth advances to 3/4 quadrants spanning both domains.
        textShadow: "0 0 calc(var(--app-motion-amount, 0) * (1 - var(--app-doorway-align, 0) * 0.6) * 6px) currentColor",
        width: "100vw",
        height: "100vh",
        pointerEvents: "auto",
      }}
    >
      <DomBridgeHost
        className="panel-assemble"
        data-state={leaving ? "leaving" : "entering"}
        onPointerDown={onClickBump}
        onKeyDown={onKeyBump}
        style={{
          width: "100%",
          height: "100%",
          overflow: "auto",
        }}
      />
    </Html>
  );
}
