"use client";
import { useMemo } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Calendar, ArrowRight, Zap } from "lucide-react";
import { wordReveal, scaleReveal, SPRING } from "@/lib/animations";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";
import type { ProgressMap, Milestone, XPBreakdown } from "@/types";


const ShardContainer = dynamic(
  () =>
    import("@/components/3d/ShardContainer").then((m) => ({
      default: m.ShardContainer,
    })),
  { ssr: false, loading: () => <div style={{ height: 320 }} /> },
);

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
}

interface CongratsViewProps {
  onViewCalendar: () => void;
  onDoMore: () => void;
  goalTitle?: string;
  dayNumber?: number;
  totalDays?: number;
  progress?: ProgressMap;
  milestone?: Milestone | null;
  xp?: XPBreakdown | null;
}

export function CongratsView({
  onViewCalendar,
  onDoMore,
  goalTitle,
  dayNumber,
  totalDays = 28,
  progress,
  milestone,
  xp,
}: CongratsViewProps) {
  const daysRemaining = dayNumber ? totalDays - dayNumber : null;

  // Sprint progress — 7-day weeks (a 28-day goal has 4, a 30-day goal has 5 with
  // a 2-day final week). dayNumber 1-7 = sprint 1, 8-14 = sprint 2, etc.
  const sprintCount = Math.max(1, Math.ceil(totalDays / 7));
  const currentSprint = dayNumber ? Math.min(sprintCount, Math.ceil(dayNumber / 7)) : 0;
  const isSprintEnd = dayNumber !== undefined && dayNumber % 7 === 0;
  const sprintDots: Array<{ sprint: number; daysIn: number; weekLen: number; status: "done" | "current" | "upcoming" }> = useMemo(() => {
    if (!dayNumber) return [];
    return Array.from({ length: sprintCount }, (_, i) => {
      const sprint = i + 1;
      const sprintStartDay = sprint * 7 - 6;
      const weekLen = Math.min(7, totalDays - sprintStartDay + 1); // final week may be short
      const lastDay = sprintStartDay + weekLen - 1;
      if (dayNumber >= lastDay) return { sprint, daysIn: weekLen, weekLen, status: "done" as const };
      if (dayNumber >= sprintStartDay) return { sprint, daysIn: dayNumber - sprintStartDay + 1, weekLen, status: "current" as const };
      return { sprint, daysIn: 0, weekLen, status: "upcoming" as const };
    });
  }, [dayNumber, sprintCount, totalDays]);

  const xpLines = useMemo(() => {
    if (!xp) return [];
    const lines: { label: string; value: number; highlight?: boolean }[] = [];
    if (xp.base > 0) lines.push({ label: "Day complete", value: xp.base });
    if (xp.activities > 0) lines.push({ label: "Activities", value: xp.activities });
    if (xp.reflection > 0) lines.push({ label: "Reflection", value: xp.reflection });
    if (xp.streakBonus > 0) lines.push({ label: "Streak bonus", value: xp.streakBonus });
    if (xp.challengeBonus > 0) lines.push({ label: "Challenge bonus", value: xp.challengeBonus, highlight: true });
    if (xp.comebackBonus > 0) lines.push({ label: "Comeback bonus", value: xp.comebackBonus, highlight: true });
    return lines;
  }, [xp]);
  const hasMultiplier = xp && xp.multiplier > 1;

  const confettiPieces: readonly ConfettiPiece[] = useMemo(
    () =>
      Array.from({ length: 25 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: -(Math.random() * 300 + 100),
        rotation: Math.random() * 360,
        scale: Math.random() * 0.5 + 0.5,
        delay: Math.random() * 0.3,
      })),
    [],
  );

  return (
    <div className="min-h-screen relative overflow-hidden">

      {/* Confetti layer — white/grey diamonds */}
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-2 h-2 clip-diamond"
            style={{
              backgroundColor: piece.id % 3 === 0 ? "rgba(255,255,255,0.9)" : piece.id % 3 === 1 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.65)",
              left: "50%",
              top: "40%",
            }}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: piece.x,
              y: [piece.y, piece.y + 600],
              rotate: piece.rotation * 3,
              scale: [0, piece.scale * 1.3, piece.scale],
            }}
            transition={{ duration: 2.5, delay: piece.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center p-6 pt-[120px] min-h-[80vh] md:min-h-screen">
        <div className="max-w-2xl w-full text-center">

          {/* Milestone banner */}
          {milestone && (
            <motion.div
              className="mb-6 flex justify-center"
              initial={{ opacity: 0, y: -16, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...SPRING.bouncy, delay: 0.1 }}
            >
              <Panel contentClassName="px-5 py-3 md:px-7 md:py-4 max-w-md">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-3xl md:text-4xl" aria-hidden>{milestone.icon}</span>
                  <span
                    className="text-xl md:text-2xl font-semibold tracking-[-0.01em] text-white leading-none"
                    style={{ fontFamily: FONT }}
                  >
                    {milestone.title}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-white/70 leading-snug pl-[3.25rem] md:pl-[3.75rem]">
                  {milestone.message}
                </p>
              </Panel>
            </motion.div>
          )}

          {/* Headline panel */}
          <motion.div
            className="mb-6 flex justify-center px-2"
            initial={{ opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING.bouncy, delay: 0.2 }}
          >
            <Panel contentClassName="px-6 py-5 md:px-10 md:py-7 w-full max-w-xl">
              <h1 className="text-3xl md:text-5xl font-semibold tracking-[-0.02em] text-white leading-[1.05] mb-2 text-center" style={{ fontFamily: FONT }}>
                {(dayNumber ? `Day ${dayNumber} Complete!` : "Congratulations!").split(" ").map((word, i) => (
                  <motion.span
                    key={i}
                    custom={i}
                    variants={wordReveal}
                    initial="hidden"
                    animate="visible"
                    className="inline-block mr-[0.3em]"
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>
              {goalTitle && (
                <motion.p
                  className="text-lg md:text-2xl text-white/55 font-medium text-center"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING.gentle, delay: 0.5 }}
                >
                  {goalTitle}
                </motion.p>
              )}
            </Panel>
          </motion.div>

          {/* Sprint progress */}
          {dayNumber && sprintDots.length > 0 && (
            <motion.div
              className="mb-6 flex justify-center px-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.gentle, delay: 0.45 }}
            >
              <Panel contentClassName="px-5 py-4 md:px-7 md:py-5 w-full max-w-md">
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.08em] text-white/40">
                    Sprint {currentSprint} of {sprintCount}
                  </span>
                  <span className="text-[10px] md:text-xs font-medium text-white/40">
                    {isSprintEnd ? "Sprint complete" : `Day ${dayNumber} of ${totalDays}`}
                  </span>
                </div>
                <div className="flex gap-2 md:gap-3">
                  {sprintDots.map(({ sprint, daysIn, weekLen, status }) => (
                    <div key={sprint} className="flex-1 flex flex-col gap-1">
                      <div className="relative h-1 w-full rounded-full overflow-hidden bg-white/10">
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-full"
                          style={{
                            backgroundColor: status === "upcoming" ? "transparent" : "rgba(255,255,255,0.85)",
                          }}
                          initial={{ width: "0%" }}
                          animate={{ width: `${(daysIn / weekLen) * 100}%` }}
                          transition={{ ...SPRING.gentle, delay: 0.55 + sprint * 0.08 }}
                        />
                      </div>
                      <span className={`text-[9px] md:text-[10px] font-medium uppercase tracking-[0.08em] text-center ${status === "current" ? "text-white" : status === "done" ? "text-white/55" : "text-white/30"}`}>
                        S{sprint}
                      </span>
                    </div>
                  ))}
                </div>
              </Panel>
            </motion.div>
          )}

          {/* 3D Shard Container — shards drop into glass jar */}
          {dayNumber && progress && (
            <motion.div
              className="flex flex-col items-center mb-4"
              variants={scaleReveal}
              initial="hidden"
              animate="visible"
            >
              <ShardContainer dayNumber={dayNumber} progress={progress} />
            </motion.div>
          )}

          {/* XP breakdown */}
          {xp && xp.total > 0 && (
            <motion.div
              className="flex justify-center mb-6 md:mb-8 px-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.gentle, delay: 0.6 }}
            >
              <Panel contentClassName="px-6 py-5 md:px-8 md:py-6 w-full max-w-sm">
                <div className="space-y-1.5 mb-4">
                  {xpLines.map((line, i) => (
                    <motion.div
                      key={line.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...SPRING.soft, delay: 0.75 + i * 0.08 }}
                      className="flex justify-between items-baseline text-sm md:text-base"
                    >
                      <span className="text-white/70 font-medium">{line.label}</span>
                      <span className="font-semibold text-white">
                        +{line.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className="pt-3 border-t border-white/10 flex flex-col items-center gap-1"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ ...SPRING.bouncy, delay: 0.95 + xpLines.length * 0.08 }}
                >
                  {hasMultiplier && (
                    <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.08em] text-white/40">
                      {xp.multiplier}× Multiplier Day
                    </span>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    <Zap
                      className="w-6 h-6 md:w-7 md:h-7 text-white/70"
                      fill="currentColor"
                    />
                    <span
                      className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white leading-none"
                      style={{ fontFamily: FONT }}
                    >
                      +{xp.total} XP
                    </span>
                  </div>
                </motion.div>
              </Panel>
            </motion.div>
          )}

          {/* Come back message */}
          {daysRemaining !== null && daysRemaining > 0 && (
            <motion.p
              className="text-base md:text-xl text-white/70 font-medium mb-8 md:mb-12 px-4 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.soft, delay: 1.0 }}
            >
              {isSprintEnd && totalDays === 28
                ? `Sprint ${currentSprint + 1} generates tomorrow — your next 7 days are already being built.`
                : isSprintEnd
                  ? `Week ${currentSprint} done — ${totalDays - (dayNumber ?? 0)} ${totalDays - (dayNumber ?? 0) === 1 ? "day" : "days"} to go. Come back tomorrow.`
                  : "Come back tomorrow for another shard."}
            </motion.p>
          )}
          {daysRemaining === 0 && (
            <motion.p
              className="text-base md:text-xl text-white/55 font-medium mb-8 md:mb-12 px-4 leading-relaxed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.soft, delay: 1.0 }}
            >
              {totalDays === 28 ? "You did it — all 4 sprints complete." : `You did it — all ${totalDays} days complete.`}
            </motion.p>
          )}
          {daysRemaining === null && <div className="mb-8 md:mb-12" />}

          {/* Buttons */}
          <motion.div
            className="flex flex-col items-center gap-3 md:gap-4 px-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 1.2 }}
          >
            <button
              onClick={onViewCalendar}
              className="flex items-center justify-center gap-2 rounded-full bg-white text-black text-[15px] font-semibold py-3 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Calendar className="w-5 h-5 flex-shrink-0" />
              View Calendar
            </button>
            <button
              onClick={onDoMore}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 text-white/80 hover:bg-white/5 transition px-6 py-2.5 text-sm font-medium"
            >
              Back to Goals
              <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
