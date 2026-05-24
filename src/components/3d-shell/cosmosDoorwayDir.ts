/**
 * Cosmos doorway-direction buffer — module-level static.
 *
 * v158 (META-PIVOT cut #8): turns the cosmos shell into a wayfinding
 * affordance. v155+v156 closed the wall↔cosmos POSITION contract; v157 made
 * the destination slab visibly REACT during pulse-contact. v158 takes the
 * leap from per-piece reaction to PER-ROOM PATH PREDICTION: the cosmos slabs
 * sitting along the active room's open doorway directions get a soft
 * emissive boost, creating a brighter "lane" of cosmos in the direction the
 * camera will travel through each open doorway. The shell pre-loads the
 * visual hint of where you're going without any text or icon.
 *
 *   - Room.tsx (writer): on view change, sums unit vectors of every active
 *     opening on the active room — north=-z, south=+z, east=+x, west=-x,
 *     top=+y, bottom=-y — and writes the normalized result into this
 *     Float32Array. Landing → top vector (all four cardinals cancel),
 *     calendar → south, day → west+north blend, etc.
 *   - TileVoid.tsx (reader): each frame copies this Float32Array into a
 *     Vec3 uniform `uDoorwayDir`. The fragment shader emissive ramp adds
 *     `pow(max(0, dot(normalize(vInstanceWorldPos), uDoorwayDir)), k) *
 *     DOORWAY_LANE_AMP` on top of the v79 camera-motion ramp and v157
 *     activation ramp — three additive cosmos channels stacked.
 *
 * Reads visually as a soft directional lane of brighter cosmos slabs cast
 * from the room's center outward through each open doorway. As you transition
 * between rooms the lane direction lerps to match the new room's openings.
 */
import * as THREE from "three";

export const COSMOS_DOORWAY_DIR = new Float32Array(3);

// v158 — per-frame smoothing target for cross-room transitions. TileVoid lerps
// its uniform Vec3 toward this array so the lane direction doesn't snap when
// the active room changes. Shared mutable scratch — single-reader assumed.
export const COSMOS_DOORWAY_DIR_LERP = new THREE.Vector3();
