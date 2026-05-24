"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getCharacterFor, getLayoutFor, type ViewKey } from "../RoomRegistry";

// v234 — OCTAGONAL CHAMFER. Each room previously read as a 4-walled cube. This
// layer adds 4 angled tile-mosaic strips at every vertical corner, each rotated
// 45° between the two adjacent walls. The 90° corner reading is replaced with
// 135° chamfered facets — every room now reads as an 8-faceted polyhedral
// chamber, "outer space feel" instead of "rooms in a house" (Tom 2026-05-13).
//
// VISCERAL: walls used to meet in 4 hard right-angle corners; now each corner
// is replaced by a slanted tile-strip face, so each room presents 8 visible
// facets to the camera (N, NE, E, SE, S, SW, W, NW). The cube is gone.
//
// No pulse, no doorway awareness — pure structural decoration. The chamfers
// sit FLUSH with the existing walls' inside surface at corner edges, occluding
// the rectangular corner vertices behind them.

interface CornerBevelsProps {
  viewKey: ViewKey;
}

const CHAMFER_WIDTH_RATIO = 0.38; // fraction of min(width, depth) — how wide each diagonal facet is. Bumped from 0.22 → 0.38 so the chamfer panels visibly read as octagonal facets in the 60s recording (Tom 2026-05-13, post-audit).
const TILE_DEPTH = 0.06;
const INWARD_BIAS = 0.18; // additional inward push so chamfer sits in FRONT of wall tiles, not coincident with them (kills z-fight, ensures facets are visible)

export function CornerBevels({ viewKey }: CornerBevelsProps) {
  const layout = useMemo(() => getLayoutFor(viewKey), [viewKey]);
  const character = useMemo(() => getCharacterFor(viewKey), [viewKey]);
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const tiles = useMemo(() => {
    const [width, height, depth] = layout.size;
    const [cx, cy, cz] = layout.center;
    const halfW = width / 2;
    const halfH = height / 2;
    const halfD = depth / 2;

    const tileSize = character.tileSize;
    const aspect = Math.max(0.25, Math.min(4, character.tileAspect));
    const sqrtA = Math.sqrt(aspect);
    const tileW = tileSize * sqrtA;
    const tileH = tileSize / sqrtA;
    const mortarGap = character.mortarGap ?? (tileSize * 0.08);
    const tileWPad = tileW - mortarGap;
    const tileHPad = tileH - mortarGap;

    const chamferW = Math.min(width, depth) * CHAMFER_WIDTH_RATIO;
    const tilesU = Math.max(1, Math.floor(chamferW / tileW));
    const tilesV = Math.max(1, Math.floor(height / tileH));

    const out: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];

    const seed = (x: number, y: number) => {
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      return h - Math.floor(h);
    };
    const pickColor = (x: number, y: number) => {
      const r = seed(x + 1, y + 1);
      if (r < character.accentChance) {
        return character.accents[Math.floor(seed(x, y) * character.accents.length)];
      }
      return character.palette[Math.floor(seed(x * 2, y * 2) * character.palette.length)];
    };

    // Four vertical corners. signX/signZ give the corner location relative to room center.
    // The chamfer's INWARD normal points from the corner toward the room center along the
    // XZ diagonal: n = normalize(-signX, 0, -signZ).
    const corners: { signX: 1 | -1; signZ: 1 | -1; key: string }[] = [
      { signX:  1, signZ:  1, key: "NE" },
      { signX: -1, signZ:  1, key: "NW" },
      { signX:  1, signZ: -1, key: "SE" },
      { signX: -1, signZ: -1, key: "SW" },
    ];

    const dummy = new THREE.Object3D();

    for (const corner of corners) {
      const nx = -corner.signX / Math.SQRT2;
      const nz = -corner.signZ / Math.SQRT2;
      // tangent in XZ plane (perpendicular to normal): rotate normal 90° around Y
      const tx = -nz;
      const tz =  nx;
      // Place chamfer plane center offset from the corner inward along normal by
      // chamferW * sin(45°)/2 = chamferW / (2√2). This sets the plane flush with
      // the inside-corner vertex line.
      const inwardOffset = chamferW / (2 * Math.SQRT2) + INWARD_BIAS;
      const planeCx = cx + corner.signX * halfW + nx * inwardOffset;
      const planeCz = cz + corner.signZ * halfD + nz * inwardOffset;

      // Build rotation: tile face-normal should point along (nx, 0, nz). For a
      // unit box default-aligned +Z, this is a rotation about Y by the angle
      // between (0,0,1) and (nx,0,nz).
      const yaw = Math.atan2(nx, nz);
      const quat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);

      for (let u = 0; u < tilesU; u++) {
        for (let v = 0; v < tilesV; v++) {
          const uCoord = (u - (tilesU - 1) / 2) * tileW;
          const vCoord = (v - (tilesV - 1) / 2) * tileH;
          // local tile position: tx/tz tangent along uCoord, +Y along vCoord
          const x = planeCx + tx * uCoord;
          const y = cy + vCoord;
          const z = planeCz + tz * uCoord;
          dummy.position.set(x, y, z);
          dummy.quaternion.copy(quat);
          dummy.scale.set(tileWPad, tileHPad, TILE_DEPTH);
          dummy.updateMatrix();
          out.push({
            matrix: dummy.matrix.clone(),
            color: new THREE.Color(pickColor(corner.signX * (u + 1), corner.signZ * (v + 1))),
          });
        }
      }
    }

    return out;
  }, [layout, character]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    tiles.forEach((tile, i) => {
      mesh.setMatrixAt(i, tile.matrix);
      mesh.setColorAt(i, tile.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [tiles]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, tiles.length]}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        roughness={character.tileRoughness}
        metalness={character.tileMetalness}
        vertexColors
      />
    </instancedMesh>
  );
}
