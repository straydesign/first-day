"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CardDescription } from "@/components/ui/card";
import { MosaicCard } from "./MosaicCard";
import { VORONOI_LIGHT, SHARD_CLIPS, LABEL_CLIPS, BUTTON_CLIPS, getClip } from "@/constants";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { BouncingButton } from "./BouncingButton";
import { toast } from "sonner";
import { StreakBadge } from "./StreakBadge";
import { StatsCard } from "./StatsCard";
import { AchievementsSheet } from "./AchievementsSheet";
import { useMonotone } from "./MonotoneContext";
import { ShardRewardGrid } from "./ShardRewardGrid";
import { DEMO_GOALS_LIST, DEMO_GOAL_DETAILS } from "@/lib/demo-data";
import { staggerContainer, tileEnter, contentReveal } from "@/lib/animations";
import type { EngagementState, ProgressMap } from "@/types";

interface Goal {
  id: string;
  title: string;
  timeCommitment: string;
  startDate: string;
  completedDays: number;
  totalDays: number;
}

interface GoalsManagementProps {
  accessToken?: string;
  onCreateGoal: () => void;
  onSelectGoal: (goalId: string) => void;
  onEditGoal: (goalId: string) => void;
  onViewTodayActivities?: (goalId: string) => void;
  onLogout: () => void;
  engagement?: EngagementState | null;
  demoMode?: boolean;
}

export function GoalsManagement({ onCreateGoal, onSelectGoal, onEditGoal, onViewTodayActivities, onLogout, engagement, demoMode = false }: GoalsManagementProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalCurrentDays, setGoalCurrentDays] = useState<Record<string, number>>({});
  const [goalProgress, setGoalProgress] = useState<Record<string, ProgressMap>>({});
  const [loading, setLoading] = useState(true);
  const { monotone } = useMonotone();

  useEffect(() => { loadGoals(); }, []);

  useEffect(() => {
    if (goals.length > 0) {
      goals.forEach(goal => {
        // Parse date as local (not UTC) to avoid timezone shift
        const parts = goal.startDate.split('-').map(Number);
        const startDate = new Date(parts[0], parts[1] - 1, parts[2]);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const dayNumber = Math.max(1, Math.min(diffDays + 1, 30));
        setGoalCurrentDays(prev => ({ ...prev, [goal.id]: dayNumber }));
      });

      if (demoMode) {
        // Use demo progress directly
        const progressMap: Record<string, ProgressMap> = {};
        for (const goal of goals) {
          const detail = DEMO_GOAL_DETAILS[goal.id];
          if (detail) progressMap[goal.id] = detail.progress;
        }
        setGoalProgress(progressMap);
        setLoading(false);
        return;
      }

      // Fetch progress for each goal in parallel
      Promise.allSettled(
        goals.map(goal =>
          api.goals.get(goal.id).then((data: { progress?: ProgressMap }) => ({
            id: goal.id,
            progress: data.progress || {},
          }))
        )
      ).then(results => {
        const progressMap: Record<string, ProgressMap> = {};
        for (const result of results) {
          if (result.status === "fulfilled") {
            progressMap[result.value.id] = result.value.progress;
          }
        }
        setGoalProgress(progressMap);
      });

      setLoading(false);
    }
  }, [goals, demoMode]);

  const loadGoals = async () => {
    if (demoMode) {
      setGoals(DEMO_GOALS_LIST);
      return;
    }
    try {
      const data = await api.goals.list();
      if (data.goals && data.goals.length > 0) setGoals(data.goals);
      else setLoading(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Session expired")) {
        toast.error("Session expired. Please log in again.");
        setLoading(false);
        onLogout();
        return;
      }
      toast.error(`Failed to load your goals: ${message}`);
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    if (demoMode) {
      toast("Sign up to manage goals!", { description: "Create an account to add and delete your own goals." });
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to delete "${goalTitle}"? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      await api.goals.delete(goalId);
      toast.success("Goal deleted successfully");
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch { toast.error("Failed to delete goal"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-md">
          {/* Shard progress bar */}
          <div className="flex gap-[2px] h-3 w-full">
            {Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  backgroundColor: VORONOI_LIGHT[i % VORONOI_LIGHT.length],
                  clipPath: getClip(SHARD_CLIPS, i),
                  animation: `shardPulse 1.5s ease-in-out ${i * 0.08}s infinite`,
                }}
              />
            ))}
          </div>
          <div
            className="inline-block bg-black px-6 py-3"
            style={{ clipPath: getClip(LABEL_CLIPS, 1) }}
          >
            <p className="text-lg text-white font-black uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Loading your goals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20 md:pb-0">
      {/* Navigation handled by BottomNav (mobile) and NavigationMenu (desktop) in AuthenticatedApp */}
      <div className="relative z-10 w-full">
        {goals.length > 0 ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="min-h-screen px-6 pb-6 md:px-10 md:pb-10 pt-[120px]">
            {/* Date — sticky header */}
            <motion.div variants={contentReveal} className="sticky top-0 z-20 text-center pb-4 pt-2">
              <div
                className="inline-block bg-black px-6 py-2"
                style={{ clipPath: getClip(LABEL_CLIPS, 1) }}
              >
                <p className="text-xl md:text-3xl text-white font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
              {engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) && (
                <div className="flex items-center justify-center gap-2 mt-3">
                  <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} size="sm" />
                </div>
              )}
            </motion.div>
            {/* All goals stacked */}
            <div className="space-y-6 md:space-y-8 mb-8">
              {goals.map((goal, goalIndex) => (
                <motion.div key={goal.id} variants={tileEnter} className="w-full relative">
                  {/* Day X label — attached to top of goal card */}
                  <div
                    className="inline-block bg-black px-5 py-2 ml-2 mb-0 relative z-10"
                    style={{ clipPath: getClip(LABEL_CLIPS, goalIndex) }}
                  >
                    <CardDescription className="text-white font-black text-xl md:text-2xl uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Day {goalCurrentDays[goal.id] || 0} of 30</CardDescription>
                  </div>
                  <button
                    onClick={() => onSelectGoal(goal.id)}
                    className="bg-black px-6 py-8 md:px-10 md:py-12 w-full hover:scale-[1.02] transition-transform cursor-pointer -mt-1"
                    style={{ clipPath: getClip(SHARD_CLIPS, goalIndex) }}
                  >
                    <h1
                      className="text-center font-black uppercase leading-[0.95] break-words"
                      style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", fontSize: "clamp(3rem, 12vw, 8rem)" }}
                    >
                      {goal.title.split(" ").map((word, i) => (
                        <span key={i} style={{ color: monotone ? "#ffffff" : ["#FFE633","#FF6B2B","#FF2D55","#00EAFF","#FF10F0","#FF1493","#4FC3F7","#FF4500"][(i + goalIndex * 3) % 8] }}>
                          {word}{" "}
                        </span>
                      ))}
                    </h1>
                  </button>
                  {/* Trash icon on each goal */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id, goal.title); }}
                    aria-label="Delete goal"
                    className="absolute bottom-2 right-2 bg-black text-white/60 p-3 hover:scale-110 hover:text-white transition-all z-10"
                    style={{ clipPath: getClip(BUTTON_CLIPS, goalIndex) }}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  {/* Shard reward grid */}
                  {goalProgress[goal.id] && (
                    <div className="mt-2 flex justify-center">
                      <ShardRewardGrid progress={goalProgress[goal.id]} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
            {/* Stats & Achievements — once */}
            {engagement && (
              <motion.div variants={tileEnter} className="space-y-4 mb-8 px-2 md:px-6">
                <StatsCard engagement={engagement} />
                <div className="flex justify-center">
                  <AchievementsSheet achievements={engagement.achievements} />
                </div>
              </motion.div>
            )}
            {/* Add Goal — once at the bottom */}
            <motion.button variants={tileEnter}
              onClick={onCreateGoal}
              className="w-full bg-black py-4 md:py-5 text-xl md:text-2xl font-black uppercase tracking-wide hover:scale-105 transition-transform flex items-center justify-center gap-2"
              style={{ clipPath: getClip(BUTTON_CLIPS, 0), fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 3 }}
            >
              <Plus className="w-5 h-5 text-white" />
              <span className="text-white">ADD NEW GOAL</span>
            </motion.button>
          </motion.div>
        ) : (
          <MosaicCard seed={0} className="min-h-screen p-6 md:p-10 flex flex-col items-center justify-center">
            <div className="text-center mb-4 md:mb-8 space-y-3">
              <div
                className="inline-block bg-black px-8 py-3"
                style={{ clipPath: getClip(LABEL_CLIPS, 3) }}
              >
                <h1 className="text-3xl md:text-5xl font-bold text-white">Set Your First Goal</h1>
              </div>
              <div
                className="inline-block bg-black px-6 py-2"
                style={{ clipPath: getClip(LABEL_CLIPS, 1) }}
              >
                <p className="text-xl text-white font-bold">Pick any goal and get a personalized 30-day plan</p>
              </div>
            </div>
            <BouncingButton onClick={onCreateGoal} />
          </MosaicCard>
        )}
      </div>
    </div>
  );
}
