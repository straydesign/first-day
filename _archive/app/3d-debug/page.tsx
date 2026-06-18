"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { setRoomView, getRoomView, getPendingPath, fireCelebration, fireBump, getRoomTarget, getCharacterFor, getLayoutFor, type ViewKey } from "@/components/3d-shell/RoomRegistry";

const PersistentCanvas = dynamic(
  () => import("@/components/3d-shell/PersistentCanvas").then((m) => ({ default: m.PersistentCanvas })),
  { ssr: false },
);

const VIEW_CYCLE: ViewKey[] = ["landing", "goals", "calendar", "day", "congrats", "settings"];

export default function DebugPage() {
  const [view, setLocalView] = useState<ViewKey>(getRoomView());
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    // expose registry hooks for in-browser verification of path stepping
    (window as unknown as { __room?: object }).__room = {
      setRoomView,
      getRoomView,
      getPendingPath,
      fireCelebration,
      fireBump,
      getRoomTarget,
      getCharacterFor,
      getLayoutFor,
    };
  }, []);

  useEffect(() => {
    if (!auto) return;
    let i = VIEW_CYCLE.indexOf(view);
    const id = window.setInterval(() => {
      i = (i + 1) % VIEW_CYCLE.length;
      const next = VIEW_CYCLE[i];
      setRoomView(next);
      setLocalView(next);
    }, 2400);
    return () => window.clearInterval(id);
  }, [auto, view]);

  return (
    <div style={{ position: "fixed", inset: 0, background: "transparent" }}>
      <PersistentCanvas />
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          color: "#fcd02a",
          fontFamily: "monospace",
          fontSize: 12,
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          alignItems: "flex-start",
        }}
      >
        <div>3d-shell debug · room geometry + camera + pulse</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 520 }}>
          {VIEW_CYCLE.map((v) => (
            <button
              key={v}
              onClick={() => {
                setRoomView(v);
                setLocalView(v);
              }}
              style={{
                padding: "4px 10px",
                background: v === view ? "#fcd02a" : "transparent",
                color: v === view ? "#000" : "#fcd02a",
                border: "1px solid #fcd02a",
                fontFamily: "monospace",
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {v}
            </button>
          ))}
          <button
            onClick={() => setAuto((a) => !a)}
            style={{
              padding: "4px 10px",
              background: auto ? "#3075e1" : "transparent",
              color: auto ? "#fff" : "#3075e1",
              border: "1px solid #3075e1",
              fontFamily: "monospace",
              fontSize: 11,
              cursor: "pointer",
              marginLeft: 8,
            }}
          >
            {auto ? "■ stop auto" : "▶ auto-cycle"}
          </button>
        </div>
        <div style={{ opacity: 0.6 }}>view: {view}</div>
      </div>
    </div>
  );
}
