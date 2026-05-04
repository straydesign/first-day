"use client";

import { useState } from "react";
import { ShardEngine, type ShardState, type ShardTarget } from "@/components/lab/ShardEngine";
import { TOKENS } from "@/tokens";

type TargetKind = "grid" | "voronoi" | "freeform" | "none";

const FREEFORM_DEMO = [
  { x: 20, y: 25, rotation: 0, scale: 1.2 },
  { x: 50, y: 18, rotation: 15, scale: 1.4 },
  { x: 80, y: 28, rotation: -10, scale: 1.1 },
  { x: 30, y: 55, rotation: 5, scale: 1.3 },
  { x: 70, y: 60, rotation: -20, scale: 1.5 },
  { x: 25, y: 82, rotation: 12, scale: 1.0 },
  { x: 55, y: 78, rotation: -5, scale: 1.2 },
  { x: 80, y: 85, rotation: 8, scale: 1.1 },
];

export default function ShardEngineLabPage() {
  const [state, setState] = useState<ShardState>("scattered");
  const [targetKind, setTargetKind] = useState<TargetKind>("grid");
  const [count, setCount] = useState(40);
  const [seed, setSeed] = useState(42);
  const [blurPx, setBlurPx] = useState(0);
  const [maxOpacity, setMaxOpacity] = useState(1);
  const [drift, setDrift] = useState(true);
  const [gridRows, setGridRows] = useState(5);
  const [gridCols, setGridCols] = useState(8);

  const target: ShardTarget | undefined =
    targetKind === "grid"
      ? { type: "grid", rows: gridRows, cols: gridCols, gap: 2 }
      : targetKind === "voronoi"
      ? { type: "voronoi" }
      : targetKind === "freeform"
      ? { type: "freeform", positions: FREEFORM_DEMO }
      : undefined;

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black text-white">
      <ShardEngine
        count={count}
        state={state}
        target={target}
        seed={seed}
        blurPx={blurPx}
        maxOpacity={maxOpacity}
        drift={drift}
      />

      <div className="relative z-10 p-6 max-w-md space-y-5 pointer-events-auto">
        <header>
          <h1
            className="text-3xl"
            style={{
              fontFamily: TOKENS.typography.fontFamily.display,
              letterSpacing: TOKENS.typography.letterSpacing.display,
            }}
          >
            ShardEngine Lab
          </h1>
          <p className="text-xs text-white/60 mt-1">
            Unified shard primitive — preview states + targets in isolation.
          </p>
        </header>

        <Section label="State">
          <Row>
            {(["scattered", "exploding", "assembling"] as ShardState[]).map((s) => (
              <Pill key={s} active={state === s} onClick={() => setState(s)}>
                {s}
              </Pill>
            ))}
          </Row>
        </Section>

        <Section label="Target">
          <Row>
            {(["none", "grid", "voronoi", "freeform"] as TargetKind[]).map((t) => (
              <Pill key={t} active={targetKind === t} onClick={() => setTargetKind(t)}>
                {t}
              </Pill>
            ))}
          </Row>
          {targetKind === "grid" && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <Slider label={`rows: ${gridRows}`} value={gridRows} min={1} max={10} onChange={setGridRows} />
              <Slider label={`cols: ${gridCols}`} value={gridCols} min={1} max={12} onChange={setGridCols} />
            </div>
          )}
        </Section>

        <Section label="Shards">
          <Slider label={`count: ${count}`} value={count} min={4} max={120} onChange={setCount} />
          <Slider label={`seed: ${seed}`} value={seed} min={1} max={200} onChange={setSeed} />
        </Section>

        <Section label="Visual">
          <Slider label={`blurPx: ${blurPx}`} value={blurPx} min={0} max={20} onChange={setBlurPx} />
          <Slider
            label={`maxOpacity: ${maxOpacity.toFixed(2)}`}
            value={Math.round(maxOpacity * 100)}
            min={0}
            max={100}
            onChange={(v) => setMaxOpacity(v / 100)}
          />
          <label className="flex items-center gap-2 text-xs text-white/70 mt-2">
            <input
              type="checkbox"
              checked={drift}
              onChange={(e) => setDrift(e.target.checked)}
              className="accent-white"
            />
            drift (scattered)
          </label>
        </Section>

        <p className="text-[10px] text-white/40 leading-relaxed pt-2 border-t border-white/10">
          Cycle through states to verify transitions. Use grid/voronoi/freeform to validate
          assembly geometry before migrating HeroMosaic, ShardRewardGrid, and confetti onto
          this primitive.
        </p>
      </div>
    </main>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-widest text-white/50">{label}</div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
        active
          ? "bg-white text-black"
          : "bg-white/5 text-white/70 hover:bg-white/10"
      }`}
      style={{ clipPath: TOKENS.clipPaths.button[0] }}
    >
      {children}
    </button>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs text-white/70 mb-1">{label}</div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-white"
      />
    </label>
  );
}
