/**
 * Cosmos slab activation buffer — module-level static.
 *
 * v157 (META-PIVOT cut #7): closes the wall↔cosmos handshake with a
 * cosmos-side acknowledgement. v155 routed wall pulse trajectories at named
 * cosmos slabs by index; v156 mirrored that on entry-assembly. Both v155/v156
 * are WALL-SIDE cuts — the cosmos shell sat passive, receiving pieces without
 * any visible reaction at the destination.
 *
 * v157 wires a shared per-slab activation channel:
 *   - Room.tsx WRITES `max(current, tProg²)` per wall tile during pulse-out
 *     (only tiles where `onFace && tProg > 1e-4`). The tile's destination
 *     slab is `i % 720`, matching the v155 pulse trajectory contract.
 *   - TileVoid.tsx READS the buffer as an InstancedBufferAttribute
 *     `aActivation`, ramps emissive ×(1 + a × EMISSIVE_AMP) and per-instance
 *     vertex scale ×(1 + a × SCALE_AMP) per frame. Decays the buffer
 *     exponentially (~230 ms half-life) so slabs fade back after the pulse.
 *
 * Reads visually as the cosmos shell "catching" each individual wall piece:
 * the specific destination slab swells and lights up as its piece approaches,
 * then dims back as the next piece is en route to a different slab. The
 * round-trip wall→cosmos→wall handshake is now visible on BOTH ends.
 */
import { COSMOS_TILE_COUNT } from "./cosmosPositions";

export const COSMOS_ACTIVATION = new Float32Array(COSMOS_TILE_COUNT);
