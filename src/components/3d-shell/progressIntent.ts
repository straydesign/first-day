/**
 * Progress-intent scalar — user completion-state bridged into cosmos identity.
 *
 * v209: every prior cosmos channel was INSTANTANEOUS — camera dolly speed,
 * doorway alignment, transition pulse, breath phase. The cosmos looked the
 * same for a user on day 1 as for a user on day 29. That violates VISION's
 * "every tile movement maps to a user transition or a state change" — the
 * single most-important state in the entire app (how far through the 30-day
 * journey the user is) never touched the void. v209 closes that.
 *
 *   - AuthenticatedApp (writer): on engagement state change, pushes
 *     `(totalDaysCompleted / 30)` into the singleton — a [0, 1] scalar.
 *   - TileVoid (reader): each frame exp-smooths uProgress uniform toward the
 *     raw scalar. Cosmos shader uses a deterministic per-instance hash on
 *     vInstanceWorldPos; slabs whose hash &lt; uProgress get a persistent
 *     emissive boost. As the user completes days, more cosmos slabs light up
 *     — the void becomes their progress ledger, not a generic backdrop.
 *
 * Module-level static (single mutable scalar, single-writer/single-reader
 * assumed); same shape as actionIntent.ts / COSMOS_DOORWAY_DIR. Promotes the
 * DOM/event-state → canvas-response category opened by v208 to a 2nd consumer
 * with a structurally distinct signal type (persistent state vs transient
 * event) and a structurally distinct consumer (cosmos identity vs lintel
 * anticipation).
 */

let _fraction = 0;

export function setProgressFraction(v: number): void {
  _fraction = v < 0 ? 0 : v > 1 ? 1 : v;
}

export function getProgressFraction(): number {
  return _fraction;
}
