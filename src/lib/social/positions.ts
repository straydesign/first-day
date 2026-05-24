/**
 * Poisson-disk-sampled marker placement for the gallery. Deterministic from a
 * room id so a published room never moves once placed.
 *
 * Volume: an 80×40×80 box centered on the gallery's interior. Min distance
 * between markers is large enough that a 5-tile cluster has visual breathing
 * room. Sampling is bounded by attempts so a busy gallery degrades gracefully
 * rather than hanging.
 */

const VOLUME = { x: 80, y: 40, z: 80 } as const;
const MIN_DISTANCE = 9;
const MAX_ATTEMPTS = 64;

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function hashStringToSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function distance2(a: [number, number, number], b: [number, number, number]): number {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Deterministically pick a non-overlapping position for `roomId` given the set
 * of already-occupied positions in the gallery.
 */
export function pickRoomPosition(
  roomId: string,
  occupied: Array<[number, number, number]>
): [number, number, number] {
  const rand = seededRandom(hashStringToSeed(roomId));
  const minSq = MIN_DISTANCE * MIN_DISTANCE;
  let fallback: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate: [number, number, number] = [
      (rand() - 0.5) * VOLUME.x,
      (rand() - 0.5) * VOLUME.y,
      (rand() - 0.5) * VOLUME.z,
    ];
    const collides = occupied.some((p) => distance2(p, candidate) < minSq);
    if (!collides) return candidate;
    fallback = candidate;
  }
  return fallback;
}
