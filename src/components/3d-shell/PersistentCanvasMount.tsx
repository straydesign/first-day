"use client";

import dynamic from "next/dynamic";

const PersistentCanvas = dynamic(
  () => import("./PersistentCanvas").then((m) => ({ default: m.PersistentCanvas })),
  { ssr: false, loading: () => null },
);

export function PersistentCanvasMount() {
  return <PersistentCanvas />;
}
