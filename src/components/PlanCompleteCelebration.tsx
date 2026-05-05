"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Sparkles, Award, Share2, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useMonotone } from "./MonotoneContext";
import { BUTTON_CLIPS, SHARD_CLIPS, LABEL_CLIPS, VORONOI_LIGHT, getClip } from "@/constants";
import { scaleReveal, wordReveal, contentReveal, popIn, SPRING } from "@/lib/animations";
import type { EngagementState, Achievement } from "@/types";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

interface PlanCompleteCelebrationProps {
  goalTitle?: string;
  engagement?: EngagementState | null;
  onStartNextGoal: () => void;
}

const CONFETTI_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0", "#fcd02a", "#fb7025"];

export function PlanCompleteCelebration({ goalTitle, engagement, onStartNextGoal }: PlanCompleteCelebrationProps) {
  const { monotone } = useMonotone();
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
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
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
    { label: "Days Done", value: 30, suffix: "/30", color: "#fcd02a", icon: Trophy },
    { label: "Longest Streak", value: engagement?.longestStreak ?? 0, suffix: " days", color: "#fb7025", icon: Flame },
    { label: "XP Earned", value: engagement?.totalXP ?? 0, suffix: "", color: "#f31b5e", icon: Sparkles },
    { label: "Level Reached", value: engagement?.level.name ?? "Master", suffix: "", color: "#3075e1", icon: Award },
  ] as const;

  const buildShareUrl = () => {
    const params = new URLSearchParams();
    if (goalTitle) params.set("g", goalTitle);
    params.set("d", "30");
    params.set("s", String(engagement?.longestStreak ?? 0));
    params.set("x", String(engagement?.totalXP ?? 0));
    if (engagement?.level.name) params.set("l", engagement.level.name);
    params.set("a", String(unlockedAchievements.length));
    const origin = typeof window !== "undefined" ? window.location.origin : "https://firstday.life";
    return `${origin}/share?${params.toString()}`;
  };

  const handleShare = async () => {
    const url = buildShareUrl();
    const text = `I just crushed a 30-day sprint on First Day${goalTitle ? `: ${goalTitle}` : ""}.\n\n${30} days · ${engagement?.longestStreak ?? 0}-day streak · ${(engagement?.totalXP ?? 0).toLocaleString()} XP · ${unlockedAchievements.length} achievements`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "I crushed a 30-day sprint", text, url });
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
    <div className="min-h-screen relative overflow-hidden" role="main" aria-label="30-day plan complete">
      {/* Confetti layer */}
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-2.5 h-2.5"
            style={{
              backgroundColor: monotone ? "#ffffff" : piece.color,
              left: "50%",
              top: "30%",
              clipPath: getClip(SHARD_CLIPS, piece.id),
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
          <div
            className="relative flex items-center justify-center w-32 h-32 md:w-44 md:h-44 bg-black"
            style={{ clipPath: getClip(SHARD_CLIPS, 0) }}
          >
            <Trophy className="w-20 h-20 md:w-28 md:h-28 text-[#fcd02a]" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Headline */}
        <h1
          className="text-center text-5xl md:text-8xl font-black uppercase text-white mb-3 leading-[0.95]"
          style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 1 }}
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

        {/* Goal title chip */}
        {goalTitle && (
          <motion.div
            className="flex justify-center mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 0.5 }}
          >
            <div
              className="inline-block bg-white px-6 py-2.5 max-w-full"
              style={{ clipPath: getClip(LABEL_CLIPS, 1) }}
            >
              <p className="text-base md:text-xl font-black text-black uppercase tracking-wide truncate">
                {goalTitle}
              </p>
            </div>
          </motion.div>
        )}

        {/* Sub-line */}
        <motion.p
          className="text-center text-base md:text-xl text-white/75 font-medium mb-10 md:mb-14 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.soft, delay: 0.7 }}
        >
          30 lessons. 30 days. You proved you can do anything you set your mind to.
        </motion.p>

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
            const accent = monotone ? "#FFFFFF" : stat.color;
            return (
              <motion.div
                key={stat.label}
                className="relative bg-black p-4 md:p-5 overflow-hidden"
                style={{ clipPath: getClip(SHARD_CLIPS, i) }}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...SPRING.bouncy, delay: 1.0 + i * 0.08 }}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6 mb-2" style={{ color: accent }} />
                <div className="text-3xl md:text-5xl font-black text-white leading-none mb-1" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  <span className="text-base md:text-2xl text-white/55 font-bold">{stat.suffix}</span>
                </div>
                <div className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-black" style={{ color: accent }}>
                  {stat.label}
                </div>
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
              <Award className="w-5 h-5 text-[#fcd02a]" />
              <h2 className="text-xs md:text-sm uppercase tracking-[0.3em] font-black text-white/80">
                {unlockedAchievements.length} {unlockedAchievements.length === 1 ? "Achievement" : "Achievements"} Unlocked
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
              {unlockedAchievements.map((a, i) => (
                <motion.div
                  key={a.id}
                  className="bg-black px-3 py-2 md:px-4 md:py-2.5 flex items-center gap-2"
                  style={{ clipPath: getClip(LABEL_CLIPS, i) }}
                  variants={popIn}
                  initial="hidden"
                  animate="visible"
                  transition={{ ...SPRING.snappy, delay: 1.7 + i * 0.05 }}
                  title={a.description}
                >
                  <span className="text-base md:text-lg" aria-hidden>{a.icon}</span>
                  <span className="text-xs md:text-sm font-bold text-white whitespace-nowrap">{a.name}</span>
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
            className="flex items-center justify-center gap-2 px-8 py-5 md:px-10 md:py-6 text-base md:text-lg font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
            style={{
              backgroundColor: monotone ? "#666666" : VORONOI_LIGHT[0],
              clipPath: getClip(BUTTON_CLIPS, 0),
              fontFamily: "var(--font-bebas), system-ui, sans-serif",
              letterSpacing: 3,
            }}
            aria-label={shared ? "Copied to clipboard" : "Share my journey"}
          >
            {shared ? <Check className="w-5 h-5 flex-shrink-0" /> : <Share2 className="w-5 h-5 flex-shrink-0" />}
            {shared ? "Copied" : "Share My Journey"}
          </button>
          <button
            onClick={onStartNextGoal}
            className="flex items-center justify-center gap-2 px-8 py-5 md:px-10 md:py-6 text-base md:text-lg font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
            style={{
              backgroundColor: monotone ? "#444444" : VORONOI_LIGHT[1],
              clipPath: getClip(BUTTON_CLIPS, 1),
              fontFamily: "var(--font-bebas), system-ui, sans-serif",
              letterSpacing: 3,
            }}
          >
            Start Next Goal <ArrowRight className="w-5 h-5 flex-shrink-0" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
