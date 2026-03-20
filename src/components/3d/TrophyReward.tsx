"use client";

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment } from "@react-three/drei";
import * as THREE from "three";
import {
  TROPHY_FORMATIONS,
  SHARD_3D_COLORS,
  type TrophyVariant,
  type ShardSlot,
} from "@/constants/trophies";
import { isDayCompleted } from "@/lib/engagement";
import type { ProgressMap } from "@/types";

// ─── Math helpers ────────────────────────────────────────────

function cubicBezier3(
  t: number,
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number],
): [number, number, number] {
  const u = 1 - t;
  const uu = u * u;
  const uuu = uu * u;
  const tt = t * t;
  const ttt = tt * t;
  return [
    uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
    uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2],
  ];
}

function easeOutElastic(x: number): number {
  if (x === 0 || x === 1) return x;
  return (
    Math.pow(2, -10 * x) *
      Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) +
    1
  );
}

function easeInOutCubic(x: number): number {
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// ─── Geometry factory ────────────────────────────────────────

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

// ─── Placed shard (already-completed day, static with idle hover) ─

function PlacedShard({
  slot,
  color,
  index,
}: {
  slot: ShardSlot;
  color: string;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => createGeometry(slot.geometry), [slot.geometry]);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = Date.now() * 0.001;
    meshRef.current.position.y =
      slot.position[1] + Math.sin(t * 0.7 + index * 1.5) * 0.02;
    meshRef.current.rotation.y =
      slot.rotation[1] + Math.sin(t * 0.3 + index * 2) * 0.04;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geo}
      position={slot.position}
      rotation={slot.rotation}
      scale={slot.scale}
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

// ─── Animating shard (drops in via bezier curve) ─────────────

function AnimatingShard({
  slot,
  color,
  delay = 0.8,
}: {
  slot: ShardSlot;
  color: string;
  delay?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const timeRef = useRef(0);
  const geo = useMemo(() => createGeometry(slot.geometry), [slot.geometry]);

  // Unique random trajectory per mount
  const traj = useMemo(() => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 3 + Math.random() * 2;
    const sx = Math.cos(angle) * dist;
    const sy = 7 + Math.random() * 3;
    const sz = Math.sin(angle) * dist;
    return {
      start: [sx, sy, sz] as [number, number, number],
      cp1: [
        sx * 0.6 + (Math.random() - 0.5),
        sy * 0.85,
        sz * 0.6 + (Math.random() - 0.5),
      ] as [number, number, number],
      cp2: [
        slot.position[0] + (Math.random() - 0.5) * 0.8,
        slot.position[1] + 2.5 + Math.random(),
        slot.position[2] + (Math.random() - 0.5) * 0.8,
      ] as [number, number, number],
      spin: [
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8,
      ] as [number, number, number],
    };
  }, [slot.position]);

  const duration = 1.5;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    timeRef.current += delta;

    const elapsed = timeRef.current - delay;
    if (elapsed < 0) {
      meshRef.current.scale.setScalar(0);
      return;
    }

    const t = Math.min(elapsed / duration, 1);

    // Position along bezier path
    const posT = easeInOutCubic(Math.min(t * 1.05, 1));
    const pos = cubicBezier3(
      posT,
      traj.start,
      traj.cp1,
      traj.cp2,
      slot.position,
    );
    meshRef.current.position.set(pos[0], pos[1], pos[2]);

    // Rotation: fast spin decaying into target orientation
    const spinDecay = Math.pow(1 - t, 2);
    meshRef.current.rotation.set(
      slot.rotation[0] * t + traj.spin[0] * elapsed * spinDecay,
      slot.rotation[1] * t + traj.spin[1] * elapsed * spinDecay,
      slot.rotation[2] * t + traj.spin[2] * elapsed * spinDecay,
    );

    // Scale: elastic pop-in over the first 50% of flight
    const scaleT = Math.min(elapsed / (duration * 0.5), 1);
    meshRef.current.scale.setScalar(slot.scale * easeOutElastic(scaleT));

    // Emissive glow pulse on landing
    if (matRef.current) {
      if (t > 0.85 && t < 1) {
        const landT = (t - 0.85) / 0.15;
        matRef.current.emissiveIntensity =
          0.15 + Math.sin(landT * Math.PI) * 2.5;
      } else if (t >= 1) {
        const now = Date.now() * 0.001;
        matRef.current.emissiveIntensity = 0.2 + Math.sin(now * 2) * 0.08;
        meshRef.current.position.y =
          slot.position[1] + Math.sin(now * 0.7) * 0.02;
      } else {
        matRef.current.emissiveIntensity = 0.15;
      }
    }
  });

  return (
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
  );
}

// ─── Impact particles (burst when shard lands) ──────────────

function ImpactParticles({
  position,
  color,
  delay,
}: {
  position: [number, number, number];
  color: string;
  delay: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const count = 12;

  const particles = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        dir: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          Math.random() * 1.5 + 0.5,
          (Math.random() - 0.5) * 2,
        ).normalize(),
        speed: 1.5 + Math.random() * 2,
        size: 0.03 + Math.random() * 0.05,
      })),
    [],
  );

  // Burst fires when shard reaches ~88% of its 1.5s flight
  const triggerTime = delay + 1.5 * 0.88;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    const elapsed = timeRef.current - triggerTime;
    if (elapsed < 0 || elapsed > 1.5) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    const children = groupRef.current.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as THREE.Mesh;
      const p = particles[i];
      child.position.set(
        p.dir.x * p.speed * elapsed,
        p.dir.y * p.speed * elapsed - 2 * elapsed * elapsed,
        p.dir.z * p.speed * elapsed,
      );
      const fade = Math.max(0, 1 - elapsed / 1.2);
      child.scale.setScalar(p.size * (1 + elapsed * 2) * fade);
      if (child.material instanceof THREE.MeshBasicMaterial) {
        child.material.opacity = fade;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} visible={false}>
      {particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Pedestal (base platform) ────────────────────────────────

function Pedestal() {
  return (
    <group position={[0, -2.3, 0]}>
      <mesh>
        <cylinderGeometry args={[1.1, 1.3, 0.25, 8]} />
        <meshStandardMaterial
          color="#1a1a2e"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[1.4, 1.4, 0.12, 8]} />
        <meshStandardMaterial
          color="#0d0d1a"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// ─── Trophy scene (lights + formation + shards) ─────────────

interface TrophySceneProps {
  dayNumber: number;
  progress: ProgressMap;
  trophyVariant: TrophyVariant;
}

function TrophyScene({ dayNumber, progress, trophyVariant }: TrophySceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const formation = TROPHY_FORMATIONS[trophyVariant];

  const weekNumber = Math.ceil(dayNumber / 7);
  const startDay = (weekNumber - 1) * 7 + 1;
  const dayInWeek = (dayNumber - 1) % 7; // 0-indexed within week

  // Slow auto-rotate
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <>
      {/* Lighting rig */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} />
      <directionalLight position={[-4, 3, -3]} intensity={0.4} color="#4FC3F7" />
      <pointLight
        position={[0, 4, 0]}
        intensity={1.2}
        color="#FFE633"
        distance={10}
      />
      <pointLight
        position={[0, -1, 3]}
        intensity={0.6}
        color="#FF6B2B"
        distance={8}
      />

      <Float speed={1.2} rotationIntensity={0.08} floatIntensity={0.2}>
        <group ref={groupRef}>
          {formation.map((slot, i) => {
            const actualDay = startDay + i;
            const completed = isDayCompleted(progress[actualDay]);
            const isToday = i === dayInWeek;
            const color = SHARD_3D_COLORS[i % SHARD_3D_COLORS.length];

            // Today's shard — animate it dropping in
            if (isToday && completed) {
              return (
                <group key={i}>
                  <AnimatingShard slot={slot} color={color} delay={0.8} />
                  <ImpactParticles
                    position={slot.position}
                    color={color}
                    delay={0.8}
                  />
                </group>
              );
            }

            // Prior completed days — placed statically
            if (i < dayInWeek && completed) {
              return (
                <PlacedShard key={i} slot={slot} color={color} index={i} />
              );
            }

            // Future or uncompleted — don't render
            return null;
          })}
        </group>
      </Float>

      <Pedestal />
      <Environment preset="night" />
    </>
  );
}

// ─── Exported wrapper ────────────────────────────────────────

interface TrophyRewardProps {
  dayNumber: number;
  progress: ProgressMap;
  trophyVariant: TrophyVariant;
}

export function TrophyReward({
  dayNumber,
  progress,
  trophyVariant,
}: TrophyRewardProps) {
  return (
    <div className="w-full" style={{ height: 320 }}>
      <Canvas
        camera={{ position: [0, 1, 6], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <TrophyScene
            dayNumber={dayNumber}
            progress={progress}
            trophyVariant={trophyVariant}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
