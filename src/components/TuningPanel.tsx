"use client";

import { useState } from "react";
import type { EffectConfig } from "./FirstDayLogo";

interface TuningPanelProps {
  config: EffectConfig;
  onChange: (config: EffectConfig) => void;
  onReset: () => void;
}

const SLIDERS = [
  { key: "strength", label: "Strength", min: 0, max: 150, step: 1, unit: "px" },
  { key: "radius", label: "Radius", min: 50, max: 600, step: 10, unit: "px" },
  { key: "stiffness", label: "Stiffness", min: 30, max: 500, step: 5, unit: "" },
  { key: "damping", label: "Damping", min: 3, max: 60, step: 1, unit: "" },
  { key: "rotateStrength", label: "Rotation", min: 0, max: 30, step: 1, unit: "deg" },
] as const;

export function TuningPanel({ config, onChange, onReset }: TuningPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const handleCopy = () => {
    const json = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(json);
  };

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-[9999] bg-black/80 backdrop-blur-sm border border-[#FFE633]/30 px-4 py-2 text-[#FFE633] text-xs font-bold uppercase tracking-wider hover:bg-black/90 transition-colors"
        style={{ clipPath: "polygon(3% 0%, 100% 5%, 97% 100%, 0% 92%)" }}
      >
        Tune Effect
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] bg-black/95 backdrop-blur-sm border border-white/15 p-5 w-80"
      style={{ clipPath: "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)" }}
    >
      <div className="flex justify-between items-center mb-4">
        <span
          className="text-[#FFE633] font-bold text-xs uppercase tracking-widest"
          style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", fontSize: "1rem", letterSpacing: 3 }}
        >
          Effect Tuner
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="text-white/40 hover:text-white text-lg leading-none transition-colors"
        >
          &times;
        </button>
      </div>

      <div className="space-y-3">
        {SLIDERS.map(({ key, label, min, max, step, unit }) => {
          const value = config[key as keyof EffectConfig];
          return (
            <div key={key}>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-white/50 text-xs uppercase tracking-wider">{label}</span>
                <span className="text-white font-mono text-xs">
                  {value}{unit}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange({ ...config, [key]: Number(e.target.value) })}
                className="w-full h-1 appearance-none bg-white/10 rounded-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#FFE633] [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onReset}
          className="flex-1 bg-white/5 hover:bg-white/10 text-white/60 text-xs py-2 uppercase tracking-wider font-bold transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleCopy}
          className="flex-1 bg-[#FFE633]/10 hover:bg-[#FFE633]/20 text-[#FFE633] text-xs py-2 uppercase tracking-wider font-bold transition-colors"
        >
          Copy Settings
        </button>
      </div>
    </div>
  );
}
