"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface AnchorDriverProps {
  anchor?: [number, number, number];
  cssPrefix?: string;
}

export function AnchorDriver({
  anchor = [0, 0, -2],
  cssPrefix = "--app-anchor",
}: AnchorDriverProps) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const last = useRef({ x: Number.NaN, y: Number.NaN });

  useFrame(() => {
    if (typeof document === "undefined") return;
    v.set(anchor[0], anchor[1], anchor[2]).project(camera);
    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (-v.y * 0.5 + 0.5) * size.height;
    if (Math.abs(x - last.current.x) < 0.5 && Math.abs(y - last.current.y) < 0.5) return;
    last.current = { x, y };
    const root = document.documentElement.style;
    root.setProperty(`${cssPrefix}-x`, `${x}px`);
    root.setProperty(`${cssPrefix}-y`, `${y}px`);
    root.setProperty(`${cssPrefix}-dx`, `${x - size.width / 2}px`);
    root.setProperty(`${cssPrefix}-dy`, `${y - size.height / 2}px`);
  });

  return null;
}
