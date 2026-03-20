"use client";

import { Suspense, useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import { SHARD_3D_COLORS } from "@/constants/trophies";
import { isDayCompleted } from "@/lib/engagement";
import type { ProgressMap } from "@/types";

// ─── Constants ───────────────────────────────────────────────

const JAR_RADIUS_TOP = 0.85;
const JAR_RADIUS_BOTTOM = 0.95;
const JAR_HEIGHT = 2.2;
const FLOOR_Y = -JAR_HEIGHT / 2 + 0.05;
const SHARD_RADIUS = 0.18;
const SETTLE_THRESHOLD = 0.01;
const SETTLE_FRAMES = 10;
const BOUNCE_DAMPING = 0.3;

const GEOMETRIES = [
  "dodecahedron",
  "octahedron",
  "icosahedron",
  "tetrahedron",
  "box",
  "cone",
  "torusKnot",
] as const;

// ─── Geometry factory (ported from TrophyReward) ─────────────

function createGeometry(type: string): THREE.BufferGeometry {
  switch (type) {
    case "tetrahedron":
      return new THREE.TetrahedronGeometry(1, 0);
    case "octahedron":
      return new THREE.OctahedronGeometry(1, 0);
    case "box":
      return new THREE.BoxGeometry(0.9, 0.9, 0.9);
    case "dodecahedron":
      return new THREE.DodecahedronGeometry(1, 0);
    case "icosahedron":
      return new THREE.IcosahedronGeometry(1, 0);
    case "cone":
      return new THREE.ConeGeometry(0.7, 1.4, 6);
    case "torusKnot":
      return new THREE.TorusKnotGeometry(0.5, 0.2, 64, 8);
    default:
      return new THREE.OctahedronGeometry(1, 0);
  }
}

// ─── Seeded PRNG (mulberry32) ────────────────────────────────

function createRng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Elastic easing ──────────────────────────────────────────

function easeOutElastic(x: number): number {
  if (x === 0 || x === 1) return x;
  return (
    Math.pow(2, -10 * x) *
      Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) +
    1
  );
}

// ─── Glass Jar ───────────────────────────────────────────────

function GlassJar() {
  return (
    <group>
      {/* Cylinder wall — open top */}
      <mesh>
        <cylinderGeometry args={[JAR_RADIUS_TOP, JAR_RADIUS_BOTTOM, JAR_HEIGHT, 32, 1, true]} />
        <meshPhysicalMaterial
          transmission={0.92}
          opacity={0.08}
          ior={1.5}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transparent
          side={THREE.DoubleSide}
          color="#88ccff"
          roughness={0.05}
          metalness={0}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Floor disc */}
      <mesh position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[JAR_RADIUS_BOTTOM, 32]} />
        <meshPhysicalMaterial
          transmission={0.85}
          opacity={0.12}
          ior={1.5}
          clearcoat={1}
          transparent
          side={THREE.DoubleSide}
          color="#88ccff"
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// ─── Settled Shard (previously completed day) ────────────────

function SettledShard({
  position,
  rotation,
  geometryType,
  color,
  index,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  geometryType: string;
  color: string;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => createGeometry(geometryType), [geometryType]);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = Date.now() * 0.001;
    meshRef.current.position.y =
      position[1] + Math.sin(t * 0.7 + index * 1.5) * 0.01;
    meshRef.current.rotation.y =
      rotation[1] + Math.sin(t * 0.3 + index * 2) * 0.02;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      position={position}
      rotation={rotation}
      scale={SHARD_RADIUS}
    >
      <meshPhysicalMaterial
        color={color}
        metalness={0.35}
        roughness={0.12}
        emissive={color}
        emissiveIntensity={0.15}
        clearcoat={1}
        clearcoatRoughness={0.05}
        envMapIntensity={2}
      />
    </mesh>
  );
}

// ─── Dropping Shard (today's shard — float → drop → bounce → settle) ──

interface PhysicsState {
  phase: "materializing" | "hovering" | "dropping" | "settled";
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  rotation: THREE.Euler;
  elapsed: number;
  settleCount: number;
}

function DroppingShard({
  geometryType,
  color,
  targetY,
}: {
  geometryType: string;
  color: string;
  targetY: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const geo = useMemo(() => createGeometry(geometryType), [geometryType]);

  const startY = JAR_HEIGHT / 2 + 0.8;

  const state = useRef<PhysicsState>({
    phase: "materializing",
    position: new THREE.Vector3(0, startY, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    angularVelocity: new THREE.Vector3(
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 3,
      (Math.random() - 0.5) * 2,
    ),
    rotation: new THREE.Euler(0, 0, 0),
    elapsed: 0,
    settleCount: 0,
  });

  useFrame((_, rawDelta) => {
    if (!meshRef.current) return;
    const delta = Math.min(rawDelta, 1 / 30);
    const s = state.current;
    s.elapsed += delta;

    const mesh = meshRef.current;

    // Phase: materializing (0–0.5s) — scale up with elastic
    if (s.phase === "materializing") {
      const t = Math.min(s.elapsed / 0.5, 1);
      mesh.scale.setScalar(SHARD_RADIUS * easeOutElastic(t));
      mesh.position.copy(s.position);
      if (t >= 1) {
        s.phase = "hovering";
        s.elapsed = 0;
      }
      return;
    }

    // Phase: hovering (0.5–1.2s) — sin-wave bob + emissive pulse
    if (s.phase === "hovering") {
      const bob = Math.sin(s.elapsed * 4) * 0.05;
      mesh.position.set(0, startY + bob, 0);
      mesh.rotation.y += delta * 1.5;

      if (matRef.current) {
        matRef.current.emissiveIntensity = 0.3 + Math.sin(s.elapsed * 6) * 0.2;
      }

      if (s.elapsed >= 0.7) {
        s.phase = "dropping";
        s.elapsed = 0;
        s.position.set(0, startY, 0);
        s.velocity.set(0, 0, 0);
      }
      return;
    }

    // Phase: dropping — gravity + collision
    if (s.phase === "dropping") {
      // Gravity
      s.velocity.y -= 9.8 * delta;
      s.position.x += s.velocity.x * delta;
      s.position.y += s.velocity.y * delta;
      s.position.z += s.velocity.z * delta;

      // Floor collision
      const floorLimit = targetY + SHARD_RADIUS;
      if (s.position.y < floorLimit) {
        s.position.y = floorLimit;
        s.velocity.y = -s.velocity.y * BOUNCE_DAMPING;
        // Random scatter on bounce
        s.velocity.x += (Math.random() - 0.5) * 0.3;
        s.velocity.z += (Math.random() - 0.5) * 0.3;
      }

      // Wall collision (cylindrical boundary)
      const r = Math.sqrt(s.position.x * s.position.x + s.position.z * s.position.z);
      const wallLimit = JAR_RADIUS_BOTTOM * 0.7;
      if (r > wallLimit) {
        const nx = s.position.x / r;
        const nz = s.position.z / r;
        s.position.x = nx * wallLimit;
        s.position.z = nz * wallLimit;
        // Reflect radial velocity
        const dot = s.velocity.x * nx + s.velocity.z * nz;
        s.velocity.x -= 2 * dot * nx * BOUNCE_DAMPING;
        s.velocity.z -= 2 * dot * nz * BOUNCE_DAMPING;
      }

      // Angular velocity decay
      s.angularVelocity.multiplyScalar(0.95);
      s.rotation.x += s.angularVelocity.x * delta;
      s.rotation.y += s.angularVelocity.y * delta;
      s.rotation.z += s.angularVelocity.z * delta;

      mesh.position.copy(s.position);
      mesh.rotation.copy(s.rotation);

      // Impact glow
      if (glowRef.current) {
        const speed = s.velocity.length();
        glowRef.current.intensity = speed > 1 ? speed * 0.5 : 0;
        glowRef.current.position.copy(s.position);
      }

      // Settle detection
      if (s.velocity.length() < SETTLE_THRESHOLD) {
        s.settleCount++;
        if (s.settleCount >= SETTLE_FRAMES) {
          s.phase = "settled";
        }
      } else {
        s.settleCount = 0;
      }

      // Emissive flash on near-impact
      if (matRef.current) {
        const impactProximity = Math.max(0, 1 - Math.abs(s.position.y - floorLimit) / 0.5);
        const speed = s.velocity.length();
        matRef.current.emissiveIntensity = 0.15 + impactProximity * speed * 0.3;
      }
      return;
    }

    // Phase: settled — gentle idle
    if (s.phase === "settled") {
      const t = Date.now() * 0.001;
      mesh.position.y = s.position.y + Math.sin(t * 0.7) * 0.005;
      mesh.rotation.y = s.rotation.y + Math.sin(t * 0.3) * 0.01;
      if (matRef.current) {
        matRef.current.emissiveIntensity = 0.2 + Math.sin(t * 2) * 0.05;
      }
      if (glowRef.current) {
        glowRef.current.intensity = 0;
      }
    }
  });

  return (
    <>
      <mesh ref={meshRef} geometry={geo} scale={0}>
        <meshPhysicalMaterial
          ref={matRef}
          color={color}
          metalness={0.35}
          roughness={0.12}
          emissive={color}
          emissiveIntensity={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
          envMapIntensity={2}
        />
      </mesh>
      <pointLight
        ref={glowRef}
        color={color}
        intensity={0}
        distance={3}
      />
    </>
  );
}

// ─── Shard Container Scene ───────────────────────────────────

function ShardContainerScene({
  dayNumber,
  progress,
}: {
  dayNumber: number;
  progress: ProgressMap;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const weekNumber = Math.ceil(dayNumber / 7);
  const startDay = (weekNumber - 1) * 7 + 1;
  const dayInWeek = (dayNumber - 1) % 7; // 0-indexed within week

  // Deterministic pile positions for settled shards
  const pilePositions = useMemo(() => {
    const rng = createRng(weekNumber * 1337);
    const positions: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
    }> = [];

    for (let i = 0; i < 7; i++) {
      const layer = Math.floor(i / 3);
      const angle = rng() * Math.PI * 2;
      const r = rng() * JAR_RADIUS_BOTTOM * 0.45;
      const y = FLOOR_Y + SHARD_RADIUS + layer * 0.22 + rng() * 0.08;
      positions.push({
        position: [
          Math.cos(angle) * r,
          y,
          Math.sin(angle) * r,
        ],
        rotation: [
          rng() * Math.PI * 0.3,
          rng() * Math.PI * 2,
          rng() * Math.PI * 0.3,
        ],
      });
    }
    return positions;
  }, [weekNumber]);

  // Auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  // Determine which shards are settled vs dropping
  const settledShards: number[] = [];
  let droppingIndex: number | null = null;

  for (let i = 0; i < 7; i++) {
    const actualDay = startDay + i;
    const completed = isDayCompleted(progress[actualDay]);
    if (!completed) continue;

    if (i === dayInWeek) {
      droppingIndex = i;
    } else if (i < dayInWeek) {
      settledShards.push(i);
    }
  }

  // If all 7 completed (full week), show all as settled
  const allCompleted = Array.from({ length: 7 }, (_, i) =>
    isDayCompleted(progress[startDay + i]),
  ).every(Boolean);

  if (allCompleted) {
    return (
      <>
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 8, 5]} intensity={0.9} />
        <directionalLight position={[-4, 3, -3]} intensity={0.4} color="#4FC3F7" />
        <pointLight position={[0, 4, 0]} intensity={1.2} color="#FFE633" distance={10} />
        <pointLight position={[0, -1, 3]} intensity={0.6} color="#FF6B2B" distance={8} />

        <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.2}>
          <group ref={groupRef}>
            <GlassJar />
            {Array.from({ length: 7 }, (_, i) => {
              const pile = pilePositions[i];
              const color = SHARD_3D_COLORS[i % SHARD_3D_COLORS.length];
              return (
                <SettledShard
                  key={i}
                  position={pile.position}
                  rotation={pile.rotation}
                  geometryType={GEOMETRIES[i % GEOMETRIES.length]}
                  color={color}
                  index={i}
                />
              );
            })}
          </group>
        </Float>

        <Environment preset="night" />
      </>
    );
  }

  // Target Y for the dropping shard
  const targetLayer = Math.floor(settledShards.length / 3);
  const targetY = FLOOR_Y + SHARD_RADIUS + targetLayer * 0.22;

  return (
    <>
      {/* Lighting rig */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      <directionalLight position={[-4, 3, -3]} intensity={0.4} color="#4FC3F7" />
      <pointLight position={[0, 4, 0]} intensity={1.2} color="#FFE633" distance={10} />
      <pointLight position={[0, -1, 3]} intensity={0.6} color="#FF6B2B" distance={8} />

      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.2}>
        <group ref={groupRef}>
          <GlassJar />

          {/* Settled shards (previously completed days) */}
          {settledShards.map((i) => {
            const pile = pilePositions[i];
            const color = SHARD_3D_COLORS[i % SHARD_3D_COLORS.length];
            return (
              <SettledShard
                key={i}
                position={pile.position}
                rotation={pile.rotation}
                geometryType={GEOMETRIES[i % GEOMETRIES.length]}
                color={color}
                index={i}
              />
            );
          })}

          {/* Today's dropping shard */}
          {droppingIndex !== null && (
            <DroppingShard
              geometryType={GEOMETRIES[droppingIndex % GEOMETRIES.length]}
              color={SHARD_3D_COLORS[droppingIndex % SHARD_3D_COLORS.length]}
              targetY={targetY}
            />
          )}
        </group>
      </Float>

      <Environment preset="night" />
    </>
  );
}

// ─── Exported wrapper ────────────────────────────────────────

interface ShardContainerProps {
  dayNumber: number;
  progress: ProgressMap;
}

export function ShardContainer({ dayNumber, progress }: ShardContainerProps) {
  return (
    <div className="w-full" style={{ height: 320 }}>
      <Canvas
        camera={{ position: [0, 0.5, 5], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <ShardContainerScene dayNumber={dayNumber} progress={progress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
