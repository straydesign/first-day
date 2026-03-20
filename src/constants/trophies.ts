/** Trophy formation data for the 3D reward system.
 *  3 unique designs — cycles for 4th+ goals. */

export type TrophyVariant = 0 | 1 | 2;

export type ShardGeometry =
  | "tetrahedron"
  | "octahedron"
  | "box"
  | "dodecahedron"
  | "icosahedron"
  | "cone"
  | "torusKnot";

export interface ShardSlot {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  geometry: ShardGeometry;
}

/** 7 shard colors — one per day of the week. */
export const SHARD_3D_COLORS = [
  "#FFE633", // Gold
  "#FF6B2B", // Orange
  "#FF2D55", // Hot Pink
  "#00EAFF", // Cyan
  "#FF10F0", // Magenta
  "#4FC3F7", // Sky Blue
  "#39FF14", // Neon Green
] as const;

const GEOMETRIES: readonly ShardGeometry[] = [
  "dodecahedron",
  "octahedron",
  "icosahedron",
  "tetrahedron",
  "box",
  "cone",
  "torusKnot",
];

// --- Formation 0: Crystal Tower ---
// Shards stack vertically with organic offsets, building a crystalline spire.
const CRYSTAL_TOWER: ShardSlot[] = [
  { position: [0, -1.4, 0], rotation: [0, 0, 0.2], scale: 0.5, geometry: "dodecahedron" },
  { position: [-0.3, -0.7, 0.2], rotation: [0.3, 0.5, 0.1], scale: 0.45, geometry: "octahedron" },
  { position: [0.25, 0, -0.15], rotation: [-0.2, 0.8, 0.3], scale: 0.43, geometry: "icosahedron" },
  { position: [-0.15, 0.65, 0.1], rotation: [0.4, -0.3, 0.2], scale: 0.42, geometry: "tetrahedron" },
  { position: [0.2, 1.25, -0.1], rotation: [-0.1, 0.6, -0.2], scale: 0.4, geometry: "box" },
  { position: [-0.1, 1.85, 0.12], rotation: [0.2, -0.4, 0.1], scale: 0.38, geometry: "cone" },
  { position: [0, 2.5, 0], rotation: [0, 0, 0.3], scale: 0.52, geometry: "dodecahedron" },
];

// --- Formation 1: Ring Crown ---
// Shards orbit in a ring with slight vertical wave — a floating crown.
const RING_CROWN: ShardSlot[] = Array.from({ length: 7 }, (_, i) => {
  const angle = (i / 7) * Math.PI * 2 - Math.PI / 2;
  const radius = 1.3;
  return {
    position: [
      Math.cos(angle) * radius,
      0.5 + Math.sin(i * 1.2) * 0.25,
      Math.sin(angle) * radius,
    ] as [number, number, number],
    rotation: [
      0.2 * Math.cos(angle),
      angle + Math.PI * 0.5,
      0.2 * Math.sin(angle),
    ] as [number, number, number],
    scale: 0.42,
    geometry: GEOMETRIES[i],
  };
});

// --- Formation 2: Nova Burst ---
// Central gem with 6 radial spokes — an exploding star.
const NOVA_BURST: ShardSlot[] = [
  {
    position: [0, 0.5, 0],
    rotation: [0.2, 0.3, 0.1],
    scale: 0.6,
    geometry: "icosahedron",
  },
  ...Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const radius = 1.5;
    return {
      position: [
        Math.cos(angle) * radius,
        0.5 + Math.sin(angle * 2) * 0.3,
        Math.sin(angle) * radius,
      ] as [number, number, number],
      rotation: [
        Math.cos(angle) * 0.3,
        angle,
        Math.sin(angle) * 0.3,
      ] as [number, number, number],
      scale: 0.4,
      geometry: GEOMETRIES[i + 1], // skip dodecahedron (used for center)
    };
  }),
];

export const TROPHY_FORMATIONS: readonly ShardSlot[][] = [
  CRYSTAL_TOWER,
  RING_CROWN,
  NOVA_BURST,
];

export const TROPHY_NAMES = ["Crystal Tower", "Ring Crown", "Nova"] as const;
