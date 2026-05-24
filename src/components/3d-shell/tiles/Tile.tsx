"use client";

import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface TileProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  size?: [number, number, number];
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  drift?: number;
  driftSeed?: number;
}

export function Tile({
  position,
  rotation = [0, 0, 0],
  size = [1, 1, 0.08],
  color = "#0a0a0a",
  emissive = "#000000",
  emissiveIntensity = 0,
  drift = 0,
  driftSeed = 0,
}: TileProps) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (!ref.current || drift === 0) return;
    const t = state.clock.elapsedTime + driftSeed;
    ref.current.position.x = position[0] + Math.sin(t * 0.4) * drift * 0.6;
    ref.current.position.y = position[1] + Math.cos(t * 0.35) * drift * 0.6;
    ref.current.position.z = position[2] + Math.sin(t * 0.25) * drift * 0.4;
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation} castShadow={false} receiveShadow={false}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        roughness={0.65}
        metalness={0.15}
      />
    </mesh>
  );
}
