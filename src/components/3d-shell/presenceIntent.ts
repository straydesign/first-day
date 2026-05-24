/**
 * Presence-intent scalar — browser-substrate state bridged into cosmos identity.
 *
 * v210: every prior canvas-coupled signal lived at one of three substrate
 * levels — APP DATA (v209 progress, engagement), DOM EVENTS (v208 hover on a
 * specific element), or CAMERA/ROOM STATE (everything in v69–v207). The
 * BROWSER-LEVEL substrate — whether the tab is focused, whether another
 * window has stolen attention — never touched the canvas. Result: a user
 * who has tabbed away and come back sees a cosmos that drifted identically
 * the whole time. No "welcome back," no "I noticed you left." That violates
 * VISION's "every tile movement maps to a user transition or a state change"
 * on the presence axis: presence is the most basic user-state of all.
 *
 *   - PersistentCanvas (writer): wires window focus/blur and document
 *     visibilitychange to setPresence(1|0).
 *   - TileVoid (reader): each frame exp-smooths uPresence toward the raw
 *     scalar at gentle 1/s rate (presence changes are coarser than hover);
 *     multiplies emissiveIntensity by (0.4 + 0.6 × presence). Cosmos dims to
 *     40% when the user looks away and re-blooms to full when they return.
 *     The void becomes presence-aware.
 *
 * Module-level static (single mutable scalar, single-writer/multi-reader
 * assumed); same shape as actionIntent.ts (v208) / progressIntent.ts (v209) /
 * COSMOS_DOORWAY_DIR. Opens a NEW SIGNAL FAMILY (browser-substrate state)
 * structurally orthogonal to the three already established. First consumer
 * is cosmos identity; future substrates (audio drone, lintel, atmosphere)
 * can read the same scalar without re-architecting.
 */

let _presence = 1;

export function setPresence(v: number): void {
  _presence = v < 0 ? 0 : v > 1 ? 1 : v;
}

export function getPresence(): number {
  return _presence;
}
