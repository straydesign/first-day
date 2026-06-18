"use client";
/**
 * DESIGN PROTOTYPE — /design
 * Direction: tasteful GREYSCALE Voronoi backdrop that stays interactive (cursor-reactive),
 * with sleek Apple-style type and FACETED-but-ROUNDED ("Voronoi corners + Apple radii") cards.
 * Self-contained (paints its own opaque bg) so it doesn't touch the live views.
 */
import { useEffect, useRef, useState } from "react";
import { VoronoiMosaic } from "@/components/VoronoiMosaic";

const GREY_VORONOI = ["#0d0d0f", "#111114", "#0a0a0c", "#15151a", "#0e0e11", "#191920", "#0c0c0e"] as const;
const FONT = 'var(--font-inter), -apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif';
const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(" ");

/* ---------- faceted-but-rounded shape: rounded-corner polygon path ---------- */
type P = [number, number];
const sub = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
const mul = (a: P, s: number): P => [a[0] * s, a[1] * s];
const len = (a: P) => Math.hypot(a[0], a[1]) || 1;
const unit = (a: P): P => mul(a, 1 / len(a));

/** Rounds every vertex of a polygon with a quadratic curve → Apple-soft corners on a faceted shape. */
function roundedPath(pts: P[], r: number): string {
  const n = pts.length;
  let d = "";
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const prev = pts[(i - 1 + n) % n];
    const next = pts[(i + 1) % n];
    const rr = Math.min(r, len(sub(prev, cur)) / 2, len(sub(next, cur)) / 2);
    const p1 = add(cur, mul(unit(sub(prev, cur)), rr));
    const p2 = add(cur, mul(unit(sub(next, cur)), rr));
    d += `${i === 0 ? "M" : "L"} ${p1[0].toFixed(2)} ${p1[1].toFixed(2)} Q ${cur[0].toFixed(2)} ${cur[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
  }
  return d + "Z";
}

/** A near-rectangle with two opposite corners cut into gem facets (Voronoi character). */
function facetPoints(w: number, h: number): P[] {
  const f = Math.max(10, Math.min(26, Math.min(w, h) * 0.16));
  return [
    [0, 0],
    [w - f, 0], [w, f],   // top-right facet
    [w, h],
    [f, h], [0, h - f],   // bottom-left facet
  ];
}

function FacetCard({ children, className, pad = "p-6" }: { children: React.ReactNode; className?: string; pad?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [s, setS] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setS({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const d = s.w && s.h ? roundedPath(facetPoints(s.w, s.h), 16) : "";
  return (
    <div ref={ref} className={cx("relative", className)}>
      {/* frosted faceted fill (clip-path: path keeps the soft-cornered facet shape) */}
      {d && (
        <div
          className="absolute inset-0"
          style={{ clipPath: `path('${d}')`, WebkitClipPath: `path('${d}')`, backdropFilter: "blur(14px)", background: "rgba(255,255,255,0.045)" } as React.CSSProperties}
        />
      )}
      {/* hairline faceted outline */}
      {d && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`} preserveAspectRatio="none">
          <path d={d} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
        </svg>
      )}
      <div className={cx("relative z-10", pad)}>{children}</div>
    </div>
  );
}

/* ---------- interactive greyscale Voronoi background ---------- */
function InteractiveBackdrop() {
  const wrap = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const dx = e.clientX / window.innerWidth - 0.5;
        const dy = e.clientY / window.innerHeight - 0.5;
        if (layer.current) layer.current.style.transform = `translate3d(${dx * -16}px, ${dy * -16}px, 0) scale(1.05)`;
        if (wrap.current) {
          wrap.current.style.setProperty("--mx", `${e.clientX}px`);
          wrap.current.style.setProperty("--my", `${e.clientY}px`);
        }
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={wrap} className="fixed inset-0 overflow-hidden" style={{ backgroundColor: "#08080a" }}>
      <div ref={layer} className="absolute inset-0 transition-transform duration-300 ease-out will-change-transform" style={{ transform: "scale(1.05)" }}>
        <VoronoiMosaic seed={808} tileCount={46} margin={0} gap={2} palette={GREY_VORONOI} className="absolute inset-0 w-full h-full" />
      </div>
      {/* cursor spotlight — the "alive" cue */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(360px circle at var(--mx,50%) var(--my,28%), rgba(255,255,255,0.07), transparent 72%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(0,0,0,0.55), transparent 55%)" }} />
    </div>
  );
}

/* ---------- pieces ---------- */
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
      <div className="h-full rounded-full bg-white/85" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DesignPrototype() {
  return (
    <div className="min-h-screen w-full relative" style={{ fontFamily: FONT }}>
      <InteractiveBackdrop />
      <div className="relative z-10">
        {/* one menu: thin, blurred, minimal */}
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#08080a]/65 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-6 h-14 flex items-center justify-between">
            <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">First Day</span>
            <div className="flex items-center gap-5 text-[14px] font-medium text-white/55">
              <span className="text-white">Goals</span>
              <span>Calendar</span>
              <div className="h-7 w-7 rounded-full bg-white/10 border border-white/15" />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-2xl px-6 pt-12 pb-24">
          <p className="text-[14px] font-medium text-white/40">Thursday, June 18</p>
          <div className="mt-1 text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-white" style={{ fontFamily: FONT, textTransform: "none" }}>Your goals</div>
          <p className="mt-3 text-[16px] leading-relaxed text-white/50 max-w-md">
            Three active sprints. Pick up where you left off, or start today&apos;s session.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[["4", "Day streak"], ["5", "Current day"], ["1,240", "Total XP"]].map(([v, l]) => (
              <FacetCard key={l} pad="px-5 py-4">
                <div className="text-center">
                  <div className="text-[26px] font-semibold tracking-[-0.02em] text-white tabular-nums leading-none">{v}</div>
                  <div className="mt-1.5 text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">{l}</div>
                </div>
              </FacetCard>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {[
              { t: "Learn to play guitar", m: "30 min/day", day: 5, total: 28, pct: 18 },
              { t: "Build a morning routine", m: "60 min/day", day: 2, total: 28, pct: 7 },
              { t: "Learn Spanish basics", m: "20 min/day", day: 9, total: 28, pct: 32 },
            ].map((g) => (
              <FacetCard key={g.t}>
                <div className="flex items-start justify-between gap-4">
                  <div className="text-[19px] font-semibold tracking-[-0.01em] text-white leading-tight" style={{ fontFamily: FONT, textTransform: "none" }}>{g.t}</div>
                  <span className="shrink-0 text-[13px] font-medium text-white/40 tabular-nums mt-0.5">{g.m}</span>
                </div>
                <div className="mt-5 flex items-center justify-between text-[13px] text-white/45 font-medium">
                  <span>Day {g.day} of {g.total}</span>
                  <span className="tabular-nums">{g.pct}%</span>
                </div>
                <div className="mt-2"><ProgressBar pct={g.pct} /></div>
              </FacetCard>
            ))}
          </div>

          <FacetCard className="mt-8">
            <div className="flex items-center justify-between">
              <div className="text-[15px] font-semibold tracking-[-0.01em] text-white" style={{ fontFamily: FONT, textTransform: "none" }}>Today · Day 5</div>
              <span className="text-[12px] font-medium text-white/40">Barre chords</span>
            </div>
            <div className="mt-4 space-y-3">
              {["Warm up with the E-minor pentatonic for 5 minutes", "Practice the F barre chord — clean transitions", "Play through yesterday's riff at full tempo"].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <div className="mt-0.5 h-[18px] w-[18px] shrink-0 rounded-full border-[1.5px] border-white/25" />
                  <span className="text-[15px] leading-snug text-white/75">{t}</span>
                </div>
              ))}
            </div>
            <button className="mt-6 w-full rounded-full bg-white text-black text-[15px] font-semibold py-3 transition-transform hover:scale-[1.01] active:scale-[0.99]">
              Start today&apos;s session
            </button>
          </FacetCard>
        </main>
      </div>
    </div>
  );
}
