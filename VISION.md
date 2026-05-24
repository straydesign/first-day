# First Day — North Star

> **First Day is a navigable 3D tile-space.** Every view is a room built from tiles. Transitions are tile-walls disassembling and the camera dollying through the gaps. No flat backgrounds anywhere — not even beneath tiles.

## Why this exists

This is a portfolio-make-or-break product. Sameness keeps the project (and Tom) stuck. Uniqueness — at the level of *how the app moves*, not just how it looks — is the wedge. The brief is to design an app that does not feel like an app, but a sequence of inhabited rooms.

## What this IS

- **One persistent r3f Canvas** behind the entire product. The Canvas is the root layout. Every "page" is a room rendered into it.
- **Tiles as the unit of construction.** Walls, floors, panels, banners, even buttons live inside or anchored to tile geometry. A tile is a discrete physical object — it has thickness, mass, a clip, a parallax depth.
- **Transitions = physics + camera.** Going from goals → calendar means the goals room's far wall disassembles (pieces fall, fly, drift away through gaps), the camera dollies forward through the opening, and the calendar room assembles around the camera.
- **DOM panels float on tiles, not on flat backgrounds.** Forms, lists, day-content — the readable UI — render as DOM, but every panel is anchored to a 3D tile and moves with the scene. (Architecture B.)
- **No flat backdrops.** Not `bg-black`, not gradient washes, not solid color fills behind content. The "background" is always 3D space — depth, parallax, lit tiles, atmosphere.

## What this is NOT

- ❌ A flat Next.js app with a 3D hero stuck in. (That's where we are now.)
- ❌ A page-fade-page pattern with `<AnimatePresence>` between flat views.
- ❌ "3D when the screen is large enough" — it's the shell, not a feature.
- ❌ Random scene-kit decoration. Every tile movement maps to a user transition or a state change. Motion is meaning.
- ❌ Maximalist. The room is sparse. The tiles do the work.

## Success criterion

A 60-second screen recording: landing → Get Started → goal form → plan generated → day view → celebration. **At no point in the recording is a flat background visible.** Every frame shows depth — tiles, atmosphere, parallax. Transitions read as physical movement through space, not as page swaps.

## Phases (rough — refined per UltraPlan)

1. **Scene shell.** r3f Canvas as root layout. One starter room. DOM panels port over view-by-view.
2. **Room library.** A room per major view (landing, goals, calendar, day, congrats). Each room a composable `<Room>` component built from tile primitives.
3. **Transition system.** Camera rig + tile-disassembly system. Defines `transition(roomA, roomB)` — exit-disassemble, dolly-through, enter-assemble.
4. **DOM-on-tile anchoring.** drei `<Html>` panels positioned in 3D space, sized by their host tile, scrollable where needed.
5. **Atmosphere & polish.** Lighting per room (mood = function), postprocessing (bloom on the reward room, fog in the day room), audio cues at transitions.
6. **Mobile floor.** Performance pass for low-end iOS. Reduced-motion fallback that still uses the room metaphor (cuts vs. dollies) — never reverts to flat.

## Anti-drift rules

- Every UltraPlan declares the **VISION phase it advances** in its scope statement, OR is tagged `maintenance:` and capped at one day.
- Maintenance work is allowed (bug fixes, copy, auth) but does not count as progress.
- Local-maxima patches are a trap. If a fix would cement flat-bg patterns deeper, reject the fix and re-plan.
- "Looks fine" is not the gate. The gate is the success criterion above.

## Status

- Current state: flat Next.js app, brand mosaic hero, AnimatedSection-gated sections. **Vision phase: 0.**
- Architecture chosen: **B — r3f scene + DOM panels anchored to tiles** (3–4 week build, ~90% vision-pure, keyboard/a11y intact).
- Active UltraPlan: shell rebuild (Phase 1).
