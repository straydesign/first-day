/**
 * Time-of-day → cosmos warmth scalar.
 *
 * v211: opens an ENVIRONMENTAL signal source. Every prior canvas-coupled signal
 * lived at one of four substrate levels — APP DATA (v209 progress fraction),
 * DOM EVENTS (v208 hover binary), CAMERA/ROOM STATE (v69–v207 motion field),
 * BROWSER STATE (v210 tab focus). v210 promoted the browser-substrate one-off,
 * but its source is still *user-controlled* — focus is an explicit attention
 * act. The wall-clock has no user in it. It's the deepest possible source:
 * the system itself, running whether or not the page is open. A user opening
 * First Day at 03:00 should feel a different room than one opening it at
 * 15:00 — VISION's "every tile movement maps to a user transition or a state
 * change" lands on the temporal axis only if the environment itself is one of
 * those state sources. v211 makes it one.
 *
 *   - getDayWarmth() reader: returns a sinusoidal [0,1] scalar from the
 *     current wall-clock hour. Peak warmth at 15:00 (mid-afternoon), trough
 *     at 03:00 (deep night). Smooth cosine — no per-hour buckets, no jumps.
 *   - TileVoid (consumer): each frame computes dayWarmth, lerps a scratch
 *     color between COSMOS_NIGHT_COOL (#4a4868) and COSMOS_DAY_WARM (#c89072),
 *     then pulls `targetEmissive` ~12% toward that anchor BEFORE the existing
 *     v90 cameraMotion warm-anchor pull. The cosmos hue carries a day/night
 *     character at rest; cameraMotion overlays the dolly warm-shift on top.
 *
 * No setter — the source is `new Date()` itself, queried fresh each frame.
 * No singleton state to maintain. Promotes the "environmental" source family
 * to a real category (currently 1 consumer; future drone hum, fog hue, or
 * lintel chord can read the same scalar to extend breadth).
 *
 * Color-axis consumer count after v211: 5 (v84 fog, v85 lights, v89 walls,
 * v90 cosmos rest-hue, v211 cosmos day-anchor). The cosmos is now the FIRST
 * substrate that hosts 2 distinct color cuts driven by 2 distinct sources.
 */

export function getDayWarmth(): number {
  const now = new Date();
  const hours = now.getHours() + now.getMinutes() / 60;
  const phase = ((hours - 3) / 24) * Math.PI * 2;
  return 0.5 - 0.5 * Math.cos(phase);
}
