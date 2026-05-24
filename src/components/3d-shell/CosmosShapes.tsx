"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { getCameraMotion } from "./RoomRegistry";
import { getDayWarmth } from "./timeOfDayIntent";

// v233 — multicolor polyhedral debris field BEYOND the cosmos tile shell.
// TileVoid lives at radius 12–30 (monochrome warm/cool tile-points). This
// layer sits at 35–70 so it always reads as "the universe further out" —
// glimpsed through doorway openings, surging past the camera on dolly. Six
// instanced shape types × 50 instances each = 300 polyhedra, each with its
// own color from a 10-hue palette, slow self-rotation, and slow bob.
//
// VISCERAL: every view's void is now populated with octahedra, icosahedra,
// dodecahedra, tetrahedra, twisted tori, and cubes drifting in multicolored
// ribbons across the deep cosmos. The camera flies past colored debris on
// transit, not monochrome dust.

const SHELL_INNER = 35;
const SHELL_OUTER = 70;
const PER_SHAPE_COUNT = 50;

const PALETTE = [
  "#ff5e7e", "#ff9a3c", "#ffd84c", "#7dd3a8", "#3ec5ff",
  "#7a5cff", "#ff66cc", "#5cffd4", "#c4ff5c", "#ff4477",
];

type InstanceSpec = {
  pos: THREE.Vector3;
  rotAxis: THREE.Vector3;
  rotSpeed: number;
  bobPhase: number;
  bobAmp: number;
  scale: number;
  color: THREE.Color;
};

function makeRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function distribute(count: number, seed: number, scaleMin: number, scaleMax: number): InstanceSpec[] {
  const rand = makeRand(seed);
  const out: InstanceSpec[] = [];
  for (let i = 0; i < count; i++) {
    const u = rand() * 2 - 1;
    const theta = rand() * Math.PI * 2;
    const r = SHELL_INNER + (SHELL_OUTER - SHELL_INNER) * Math.cbrt(rand());
    const sq = Math.sqrt(1 - u * u);
    out.push({
      pos: new THREE.Vector3(r * sq * Math.cos(theta), r * sq * Math.sin(theta) * 0.7, r * u),
      rotAxis: new THREE.Vector3(rand() * 2 - 1, rand() * 2 - 1, rand() * 2 - 1).normalize(),
      rotSpeed: 0.04 + rand() * 0.14,
      bobPhase: rand() * Math.PI * 2,
      bobAmp: 0.4 + rand() * 1.2,
      scale: scaleMin + (scaleMax - scaleMin) * rand(),
      color: new THREE.Color(PALETTE[Math.floor(rand() * PALETTE.length)]),
    });
  }
  return out;
}

interface ShapeInstancesProps {
  geometry: THREE.BufferGeometry;
  count: number;
  seed: number;
  scaleMin: number;
  scaleMax: number;
}

function ShapeInstances({ geometry, count, seed, scaleMin, scaleMax }: ShapeInstancesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const instances = useMemo(() => distribute(count, seed, scaleMin, scaleMax), [count, seed, scaleMin, scaleMax]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    instances.forEach((inst, i) => {
      dummy.position.copy(inst.pos);
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, inst.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [instances, dummy]);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;
    const camMotion = getCameraMotion();
    const dayWarmth = getDayWarmth();
    const driftBoost = 1 + 0.3 * camMotion;
    const dayBoost = 0.7 + 0.6 * dayWarmth;
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      const angle = t * inst.rotSpeed * driftBoost * dayBoost;
      dummy.position.copy(inst.pos);
      dummy.position.y += Math.sin(t * 0.18 + inst.bobPhase) * inst.bobAmp;
      dummy.quaternion.setFromAxisAngle(inst.rotAxis, angle);
      dummy.scale.setScalar(inst.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]} frustumCulled={false}>
      <meshBasicMaterial vertexColors toneMapped={false} fog />
    </instancedMesh>
  );
}

export function CosmosShapes() {
  const geometries = useMemo(() => ({
    octa: new THREE.OctahedronGeometry(1.2, 0),
    icosa: new THREE.IcosahedronGeometry(1.0, 0),
    dodeca: new THREE.DodecahedronGeometry(1.1, 0),
    tetra: new THREE.TetrahedronGeometry(1.4, 0),
    torus: new THREE.TorusGeometry(1.0, 0.32, 8, 16),
    box: new THREE.BoxGeometry(1.3, 1.3, 1.3),
  }), []);

  useEffect(() => () => {
    Object.values(geometries).forEach((g) => g.dispose());
  }, [geometries]);

  return (
    <group>
      <ShapeInstances geometry={geometries.octa} count={PER_SHAPE_COUNT} seed={1337} scaleMin={0.7} scaleMax={1.7} />
      <ShapeInstances geometry={geometries.icosa} count={PER_SHAPE_COUNT} seed={2671} scaleMin={0.6} scaleMax={1.5} />
      <ShapeInstances geometry={geometries.dodeca} count={PER_SHAPE_COUNT} seed={4003} scaleMin={0.7} scaleMax={1.6} />
      <ShapeInstances geometry={geometries.tetra} count={PER_SHAPE_COUNT} seed={5331} scaleMin={0.6} scaleMax={1.4} />
      <ShapeInstances geometry={geometries.torus} count={PER_SHAPE_COUNT} seed={6661} scaleMin={0.6} scaleMax={1.3} />
      <ShapeInstances geometry={geometries.box} count={PER_SHAPE_COUNT} seed={7993} scaleMin={0.5} scaleMax={1.2} />
    </group>
  );
}
