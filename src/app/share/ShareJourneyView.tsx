"use client";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Flame, Sparkles, Award, ArrowRight } from "lucide-react";
import { FirstDayLogo } from "@/components/FirstDayLogo";
import { BUTTON_CLIPS, SHARD_CLIPS, LABEL_CLIPS, VORONOI_LIGHT, getClip } from "@/constants";
import { scaleReveal, wordReveal, contentReveal, SPRING } from "@/lib/animations";

interface ShareJourneyViewProps {
  goalTitle?: string;
  days: number;
  longestStreak: number;
  totalXP: number;
  levelName?: string;
  achievementCount: number;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  delay: number;
}

const CONFETTI_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0", "#fcd02a", "#fb7025"];

export function ShareJourneyView({
  goalTitle,
  days,
  longestStreak,
  totalXP,
  levelName,
  achievementCount,
}: ShareJourneyViewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const confettiPieces: readonly ConfettiPiece[] = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 1100,
      y: -(Math.random() * 400 + 100),
      rotation: Math.random() * 360,
      scale: Math.random() * 0.6 + 0.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 0.6,
    }));
  }, [mounted]);

  const stats = [
    { label: "Days Done", value: days, suffix: `/${days}`, color: "#fcd02a", icon: Trophy },
    { label: "Longest Streak", value: longestStreak, suffix: " days", color: "#fb7025", icon: Flame },
    { label: "XP Earned", value: totalXP, suffix: "", color: "#f31b5e", icon: Sparkles },
    { label: "Level", value: levelName || "Master", suffix: "", color: "#3075e1", icon: Award },
  ] as const;

  return (
    <div className="min-h-screen relative overflow-hidden tile-substrate" role="main">
      <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden">
        {confettiPieces.map((piece) => (
          <motion.div
            key={piece.id}
            className="absolute w-2.5 h-2.5"
            style={{
              backgroundColor: piece.color,
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

      <div className="relative z-10 px-4 md:px-8 pt-16 pb-32 max-w-4xl mx-auto">
        <div className="flex justify-center mb-8 md:mb-12">
          <FirstDayLogo size="default" showLetters={true} showTagline={false} />
        </div>

        <motion.div
          className="flex justify-center mb-8"
          variants={scaleReveal}
          initial="hidden"
          animate="visible"
        >
          <div
            className="relative flex items-center justify-center w-32 h-32 md:w-44 md:h-44 bg-black ring-2 ring-white/25"
            style={{ clipPath: getClip(SHARD_CLIPS, 0) }}
          >
            <Trophy className="w-20 h-20 md:w-28 md:h-28 text-[#fcd02a]" strokeWidth={1.5} />
          </div>
        </motion.div>

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

        <motion.p
          className="text-center text-base md:text-xl text-white/75 font-medium mb-10 md:mb-14 max-w-xl mx-auto"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.soft, delay: 0.7 }}
        >
          {days === 28
            ? "28 lessons. 4 sprints. They proved they can do anything they set their mind to."
            : `${days} days straight. They proved they can do anything they set their mind to.`}
        </motion.p>

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
                className="relative bg-black p-4 md:p-5 overflow-hidden ring-2 ring-white/25"
                style={{ clipPath: getClip(SHARD_CLIPS, i) }}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ ...SPRING.bouncy, delay: 1.0 + i * 0.08 }}
              >
                <Icon className="w-5 h-5 md:w-6 md:h-6 mb-2" style={{ color: stat.color }} />
                <div
                  className="text-3xl md:text-5xl font-black text-white leading-none mb-1"
                  style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}
                >
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                  <span className="text-base md:text-2xl text-white/55 font-bold">{stat.suffix}</span>
                </div>
                <div
                  className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-black"
                  style={{ color: stat.color }}
                >
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {achievementCount > 0 && (
          <motion.div
            className="text-center mb-10 md:mb-14"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.gentle, delay: 1.5 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-black ring-2 ring-white/25" style={{ clipPath: getClip(LABEL_CLIPS, 0) }}>
              <Award className="w-5 h-5 text-[#fcd02a]" />
              <span className="text-xs md:text-sm uppercase tracking-[0.3em] font-black text-white/80">
                {achievementCount} {achievementCount === 1 ? "Achievement" : "Achievements"} Unlocked
              </span>
            </div>
          </motion.div>
        )}

        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.gentle, delay: 2.0 }}
        >
          <p className="text-center text-lg md:text-2xl text-white font-black uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 2 }}>
            Your turn.
          </p>
          <a
            href="/"
            className="flex items-center justify-center gap-2 px-10 py-6 md:px-14 md:py-7 text-lg md:text-xl font-black text-black uppercase tracking-wide hover:scale-105 transition-transform"
            style={{
              backgroundColor: VORONOI_LIGHT[1],
              clipPath: getClip(BUTTON_CLIPS, 0),
              fontFamily: "var(--font-bebas), system-ui, sans-serif",
              letterSpacing: 3,
            }}
          >
            Start Your 30-Day Sprint <ArrowRight className="w-6 h-6 flex-shrink-0" />
          </a>
          <p className="text-xs md:text-sm text-white/50 font-medium">
            firstday.life · The first day of the rest of your life.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
