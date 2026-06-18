"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Sparkles, Award, Share2, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { scaleReveal, wordReveal, contentReveal, popIn, SPRING } from "@/lib/animations";
import { Panel } from "@/components/ui/Panel";
import { FONT } from "@/lib/design";
import type { EngagementState, Achievement } from "@/types";


interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  delay: number;
}

interface PlanCompleteCelebrationProps {
  goalTitle?: string;
  engagement?: EngagementState | null;
  totalDays?: number;
  onStartNextGoal: () => void;
}

export function PlanCompleteCelebration({ goalTitle, engagement, totalDays = 28, onStartNextGoal }: PlanCompleteCelebrationProps) {
  const [shared, setShared] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const confettiPieces: readonly ConfettiPiece[] = useMemo(
    () => {
      if (!mounted) return [];
      return Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 1100,
        y: -(Math.random() * 400 + 100),
        rotation: Math.random() * 360,
        scale: Math.random() * 0.6 + 0.5,
        delay: Math.random() * 0.6,
      }));
    },
    [mounted],
  );

  const unlockedAchievements: Achievement[] = useMemo(
    () => engagement?.achievements.filter((a) => a.unlocked) ?? [],
    [engagement],
  );

  const stats = [
    { label: "Days Done", value: totalDays, suffix: `/${totalDays}`, icon: Trophy },
    { label: "Longest Streak", value: engagement?.longestStreak ?? 0, suffix: " days", icon: Flame },
    { label: "XP Earned", value: engagement?.totalXP ?? 0, suffix: "", icon: Sparkles },
    { label: "Level Reached", value: engagement?.level.name ?? "Master", suffix: "", icon: Award },
  ] as const;

  const buildShareUrl = () => {
    const params = new URLSearchParams();
    if (goalTitle) params.set("g", goalTitle);
    params.set("d", String(totalDays));
    params.set("s", String(engagement?.longestStreak ?? 0));
    params.set("x", String(engagement?.totalXP ?? 0));
    if (engagement?.level.name) params.set("l", engagement.level.name);
    params.set("a", String(unlockedAchievements.length));
    const origin = typeof window !== "undefined" ? window.location.origin : "https://firstday.life";
    return `${origin}/share?${params.toString()}`;
  };

  const handleShare = async () => {
    const url = buildShareUrl();
    const text = `I just finished ${totalDays} days on First Day${goalTitle ? `: ${goalTitle}` : ""}.\n\n${totalDays} days · ${engagement?.longestStreak ?? 0}-day streak · ${(engagement?.totalXP ?? 0).toLocaleString()} XP · ${unlockedAchievements.length} achievements`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: `I finished ${totalDays} days`, text, url });
        return;
      }
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n\n${url}`);
        setShared(true);
        toast.success("Copied — paste it anywhere.");
        setTimeout(() => setShared(false), 2400);
      }
    } catch {
      // user cancelled share sheet — silent
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" role="main" aria-label={`${totalDays} days complete`}>
      {/* Confetti layer — white/grey diamonds */}
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-2.5 h-2.5 rounded-sm"
            style={{
              backgroundColor: piece.id % 4 === 0 ? "rgba(255,255,255,0.9)" : piece.id % 4 === 1 ? "rgba(255,255,255,0.5)" : piece.id % 4 === 2 ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
              left: "50%",
              top: "30%",
            }}
            initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 0 }}
            animate={{
              opacity: [1, 1, 0],
              x: piece.x,
              y: [piece.y, piece.y + 1100],
              rotate: piece.rotation * 4,
              scale: [0, piece.scale * 1.4, piece.scale],
            }}
            transition={{ duration: 3.4, delay: piece.delay, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 md:px-8 pt-[120px] pb-32 max-w-4xl mx-auto">
        {/* Trophy */}
        <motion.div
          className="flex justify-center mb-8"
          variants={scaleReveal}
          initial="hidden"
          animate="visible"
        >
          <Panel contentClassName="p-0" className="w-32 h-32 md:w-44 md:h-44 flex items-center justify-center">
            <div className="flex items-center justify-center w-full h-full p-6">
              <Trophy className="w-16 h-16 md:w-24 md:h-24 text-white/80" strokeWidth={1.5} />
            </div>
          </Panel>
        </motion.div>

        {/* Headline */}
        <div className="flex justify-center mb-3">
          <Panel contentClassName="px-6 py-4 md:px-10 md:py-6">
            <h1
              className="text-center text-5xl md:text-7xl font-semibold tracking-[-0.03em] text-white leading-[0.95]"
              style={{ fontFamily: FONT }}
            >
              {"Goal Crushed".split(" ").map((word, i) => (
                <motion.span
                  key={i}
                  custom={i}
                  variants={wordReveal}
                  initial="hidden"
                  animate="visible"
                  className="inline-block mr-[0.25em]"
                >
                  {word}
                </motion.span>
              ))}
            </h1>
          </Panel>
        </div>

        {/* Goal title chip */}
        {goalTitle && (
          <motion.div
            className="flex justify-center mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 0.5 }}
          >
            <Panel contentClassName="px-6 py-2.5 max-w-full">
              <p className="text-base md:text-xl font-semibold text-white/80 truncate" style={{ fontFamily: FONT }}>
                {goalTitle}
              </p>
            </Panel>
          </motion.div>
        )}

        {/* Sub-line */}
        <motion.div
          className="flex justify-center mb-10 md:mb-14"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.soft, delay: 0.7 }}
        >
          <Panel contentClassName="px-6 py-3 md:px-10 md:py-4 max-w-xl">
            <p className="text-center text-base md:text-xl text-white/70 font-medium leading-relaxed">
              {totalDays === 28
                ? "28 lessons. 4 sprints. You proved you can do anything you set your mind to."
                : `${totalDays} days straight. You proved you can do anything you set your mind to.`}
            </p>
          </Panel>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-14"
          variants={contentReveal}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.9 }}
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...SPRING.bouncy, delay: 1.0 + i * 0.08 }}
              >
                <Panel contentClassName="p-4 md:p-5">
                  <Icon className="w-5 h-5 md:w-6 md:h-6 mb-2 text-white/55" />
                  <div className="text-3xl md:text-4xl font-semibold tracking-[-0.02em] text-white leading-none mb-1" style={{ fontFamily: FONT }}>
                    {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                    <span className="text-base md:text-xl text-white/40 font-medium">{stat.suffix}</span>
                  </div>
                  <div className="text-[10px] md:text-xs uppercase tracking-[0.08em] font-medium text-white/40">
                    {stat.label}
                  </div>
                </Panel>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Achievement reel */}
        {unlockedAchievements.length > 0 && (
          <motion.div
            className="mb-10 md:mb-14"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 1.5 }}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Award className="w-5 h-5 text-white/55" />
              <h2 className="text-xs md:text-sm uppercase tracking-[0.08em] font-medium text-white/55">
                {unlockedAchievements.length} {unlockedAchievements.length === 1 ? "Achievement" : "Achievements"} Unlocked
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {unlockedAchievements.map((a, i) => (
                <motion.div
                  key={a.id}
                  variants={popIn}
                  initial="hidden"
                  animate="visible"
                  transition={{ ...SPRING.snappy, delay: 1.7 + i * 0.05 }}
                  title={a.description}
                >
                  <Panel contentClassName="px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-2">
                    <span className="text-base md:text-lg" aria-hidden>{a.icon}</span>
                    <span className="text-xs md:text-sm font-medium text-white whitespace-nowrap">{a.name}</span>
                  </Panel>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.gentle, delay: 2.0 }}
        >
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-full bg-white text-black text-[15px] font-semibold py-3 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99]"
            aria-label={shared ? "Copied to clipboard" : "Share my journey"}
          >
            {shared ? <Check className="w-5 h-5 flex-shrink-0" /> : <Share2 className="w-5 h-5 flex-shrink-0" />}
            {shared ? "Copied" : "Share My Journey"}
          </button>
          <button
            onClick={onStartNextGoal}
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 text-white/80 hover:bg-white/5 transition text-[15px] font-medium py-3 px-8"
          >
            Start Next Goal <ArrowRight className="w-5 h-5 flex-shrink-0" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
