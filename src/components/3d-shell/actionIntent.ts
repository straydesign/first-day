/**
 * Action-intent scalar — DOM action-button hover bridged into canvas response.
 *
 * v208: DOM event-intent (hover on primary CTAs) → canvas anticipation. Closes
 * VISION line "every tile movement maps to a user transition or a state
 * change" on the *pre-click* phase — the room reads user INTENT toward a
 * transition before the click commits.
 *
 *   - LandingPage Get Started button (writer): onMouseEnter → setActionIntent(1),
 *     onMouseLeave → setActionIntent(0). PointerDown/Up parity for touch.
 *   - Room.tsx (reader): each frame exp-smooths uActionIntent uniform toward
 *     the raw scalar (slower decay than rise so anticipation lingers briefly
 *     after the cursor leaves — matches the way a real doorway holds light
 *     after you turn away). Shader adds `actionIntent × 0.55` into the lintel
 *     emissive sum so threshold tiles brighten before the click commits.
 *
 * Module-level static (single mutable scalar, single-writer/single-reader
 * assumed); same shape as COSMOS_DOORWAY_DIR. No CSS-var read in useFrame.
 */

let _intent = 0;

export function setActionIntent(v: number): void {
  _intent = v < 0 ? 0 : v > 1 ? 1 : v;
}

export function getActionIntent(): number {
  return _intent;
}
