"use client";
/**
 * SprintRecap — the between-sprints screen where the feedback loop closes.
 *
 * Shown when the user finishes the last day of a sprint (and more remain). It
 * reads their reflections back (previously write-only), shows how the week went,
 * and triggers forward-generation of the next sprint — adapting it to this
 * sprint's reflections + completion when AI is available. Honesty: the "shaped by
 * your week" line only appears when generation actually used the feedback.
 */
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Loader2, Quote, RefreshCw, Sparkles } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { COPY } from "@/content/copy";
import { FONT } from "@/lib/design";
import { staggerContainer, tileEnter } from "@/lib/animations";
import type { ProgressMap, SprintMeta } from "@/types";

interface SprintRecapProps {
  priorSprintNumber: number;
  progress: ProgressMap;
  currentStreak: number;
  sprints?: SprintMeta[];
  generateNextSprint: (priorSprintNumber: number) => Promise<{ ok: boolean; adapted: boolean; nextTitle: string }>;
  onContinue: () => void;
}

/** A day in lo..hi counts as completed when fully done. */
function isDayComplete(c: ProgressMap[number]["completed"]): boolean {
  if (c === true) return true;
  if (c && typeof c === "object") {
    const vals = Object.values(c);
    return vals.length > 0 && vals.every(Boolean);
  }
  return false;
}

export function SprintRecap({
  priorSprintNumber,
  progress,
  currentStreak,
  sprints,
  generateNextSprint,
  onContinue,
}: SprintRecapProps) {
  const C = COPY.sprintRecap;
  const nextSprintNumber = priorSprintNumber + 1;
  const lo = (priorSprintNumber - 1) * 7 + 1;
  const hi = priorSprintNumber * 7;

  // Read this sprint's reflections back + count completion (always real).
  const reflections: string[] = [];
  let completed = 0;
  for (let n = lo; n <= hi; n++) {
    const dp = progress[n];
    if (!dp) continue;
    const fb = (dp.feedback ?? dp.reflection ?? "").toString().trim();
    if (fb) reflections.push(fb);
    if (isDayComplete(dp.completed)) completed++;
  }
  const total = hi - lo + 1;

  const [status, setStatus] = useState<"building" | "ready" | "failed">("building");
  const [adapted, setAdapted] = useState(false);
  const ran = useRef(false);

  const build = () => {
    setStatus("building");
    generateNextSprint(priorSprintNumber).then((r) => {
      if (r.ok) {
        setAdapted(r.adapted);
        setStatus("ready");
      } else {
        setStatus("failed");
      }
    });
  };

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    build();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nextTheme = sprints?.[nextSprintNumber - 1]?.theme;

  return (
    <div className="min-h-screen relative flex items-center justify-center px-6 py-12" role="main" aria-label="Sprint complete">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-xl space-y-6"
      >
        {/* Header */}
        <motion.div variants={tileEnter} className="text-center space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-white/45">
            {C.eyebrow(priorSprintNumber)}
          </p>
          <h1 className="text-[34px] font-semibold tracking-[-0.02em] text-white leading-[1.05]" style={{ fontFamily: FONT }}>
            {C.heading}
          </h1>
        </motion.div>

        {/* Stats */}
        <motion.div variants={tileEnter} className="grid grid-cols-2 gap-4">
          <Panel contentClassName="px-5 py-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-white/40">{C.stats.daysLabel}</p>
            <p className="mt-1 text-[26px] font-semibold text-white" style={{ fontFamily: FONT }}>
              {C.stats.daysValue(completed, total)}
            </p>
          </Panel>
          <Panel contentClassName="px-5 py-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-white/40">{C.stats.streakLabel}</p>
            <p className="mt-1 flex items-center gap-2 text-[26px] font-semibold text-white" style={{ fontFamily: FONT }}>
              <Flame className="h-6 w-6 text-white/70" aria-hidden />
              {C.stats.streakValue(currentStreak)}
            </p>
          </Panel>
        </motion.div>

        {/* Reflections read back — the loop's signal */}
        <motion.div variants={tileEnter}>
          <Panel contentClassName="px-6 py-6">
            <div className="flex items-center gap-2 mb-4">
              <Quote className="h-4 w-4 text-white/45" aria-hidden />
              <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/45">
                {C.reflections.heading}
              </p>
            </div>
            {reflections.length > 0 ? (
              <ul className="space-y-3">
                {reflections.map((r, i) => (
                  <li key={i} className="border-l-2 border-white/15 pl-4 text-[15px] leading-relaxed text-white/80">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[14px] leading-relaxed text-white/50">{C.reflections.empty}</p>
            )}
          </Panel>
        </motion.div>

        {/* Next sprint — built (and adapted) forward */}
        <motion.div variants={tileEnter}>
          <Panel solid contentClassName="px-6 py-6">
            {status === "building" && (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-black/70" aria-hidden />
                <div>
                  <p className="text-[16px] font-semibold text-black" style={{ fontFamily: FONT }}>
                    {C.next.building}
                  </p>
                  <p className="text-[13px] text-black/55">{C.next.buildingSub}</p>
                </div>
              </div>
            )}

            {status === "ready" && (
              <div className="space-y-4">
                <div>
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-black/50">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {C.next.readyEyebrow}
                  </p>
                  <p className="mt-1 text-[19px] font-semibold text-black leading-tight" style={{ fontFamily: FONT }}>
                    {sprints?.[nextSprintNumber - 1]?.title ?? `Sprint ${nextSprintNumber}`}
                  </p>
                  {nextTheme && <p className="mt-1 text-[14px] leading-relaxed text-black/60">{nextTheme}</p>}
                  <p className="mt-2 text-[13px] font-medium text-black/55">
                    {adapted ? C.next.adapted : C.next.notAdapted}
                  </p>
                </div>
                <button
                  onClick={onContinue}
                  className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-[15px] font-semibold text-white transition-transform hover:scale-[1.02] active:scale-[0.99]"
                  style={{ fontFamily: FONT }}
                >
                  {C.next.cta(nextSprintNumber)}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {status === "failed" && (
              <div className="space-y-4">
                <p className="text-[15px] font-medium text-black/70">{C.next.failed}</p>
                <button
                  onClick={build}
                  className="inline-flex items-center gap-2 rounded-full border border-black/20 px-6 py-3 text-[15px] font-semibold text-black transition-colors hover:border-black/50"
                  style={{ fontFamily: FONT }}
                >
                  <RefreshCw className="h-4 w-4" />
                  {C.next.retry}
                </button>
              </div>
            )}
          </Panel>
        </motion.div>
      </motion.div>
    </div>
  );
}
