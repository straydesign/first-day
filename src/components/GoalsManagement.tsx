"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MosaicCard } from "./MosaicCard";
import { Panel } from "@/components/ui/Panel";
import { TopBar } from "@/components/ui/TopBar";
import { screenTitle } from "@/content/flow";
import { FONT } from "@/lib/design";

import { Plus, Trash2, Flame } from "lucide-react";
import { api } from "@/lib/api";
import { BouncingButton } from "./BouncingButton";
import { toast } from "sonner";
import { StreakBadge } from "./StreakBadge";
import { StatsCard } from "./StatsCard";
import { AchievementsSheet } from "./AchievementsSheet";
import { ShardRewardGrid } from "./ShardRewardGrid";
import { DEMO_GOALS_LIST, DEMO_GOAL_DETAILS } from "@/lib/demo-data";
import { staggerContainer, tileEnter, contentReveal } from "@/lib/animations";
import { getCompletedDayCount } from "@/lib/engagement";
import { COPY } from "@/content/copy";
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
  const [goalProgress, setGoalProgress] = useState<Record<string, ProgressMap>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadGoals(); }, []);

  useEffect(() => {
    if (goals.length > 0) {
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
        toast.error(COPY.toasts.sessionExpired);
        setLoading(false);
        onLogout();
        return;
      }
      toast.error(COPY.toasts.loadGoalsFailed(message));
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    if (demoMode) {
      toast(COPY.toasts.signUpManage.title, { description: COPY.toasts.signUpManage.description });
      return;
    }
    const confirmed = window.confirm(COPY.confirms.deleteGoal(goalTitle));
    if (!confirmed) return;
    try {
      await api.goals.delete(goalId);
      toast.success(COPY.toasts.goalDeleted);
      setGoals(prev => prev.filter(g => g.id !== goalId));
    } catch { toast.error(COPY.toasts.deleteGoalFailed); }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        <div className="relative z-10 flex flex-col items-center gap-6 px-6 w-full max-w-md">
          <Panel contentClassName="px-8 py-5">
            <p className="text-[17px] font-semibold tracking-[-0.01em] text-white/70" style={{ fontFamily: FONT }}>
              {COPY.goals.loading}
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  // Date + streak right slot for TopBar
  const topBarRight = engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) ? (
    <div className="flex items-center gap-2">
      <span className="text-[13px] font-medium text-white/40">
        {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
      </span>
      <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} size="sm" />
    </div>
  ) : (
    <span className="text-[13px] font-medium text-white/40">
      {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
    </span>
  );

  return (
    <div className="min-h-screen relative pb-20 md:pb-0" role="main" aria-label="Your goals">
      {/* Navigation handled by BottomNav (mobile) and NavigationMenu (desktop) in AuthenticatedApp */}
      <div className="relative z-10 w-full">
        {goals.length > 0 ? (
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="min-h-screen pb-6 md:pb-10">
            {/* Sticky date / streak header via TopBar */}
            <TopBar
              title={screenTitle("goals")}
              right={topBarRight}
            />

            <div className="px-6 md:px-10 pt-8 space-y-6 md:space-y-8 mb-8">
              {goals.map((goal, goalIndex) => (
                <motion.div key={goal.id} variants={tileEnter} className="w-full relative">
                  {/* Lesson label */}
                  <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40 mb-2 ml-1">
                    {COPY.goals.lessonLabel(getCompletedDayCount(goalProgress[goal.id] ?? {}, goal.totalDays ?? 28), goal.totalDays ?? 28)}
                  </p>

                  {/* Goal card */}
                  <button
                    onClick={() => onSelectGoal(goal.id)}
                    className="w-full text-left hover:scale-[1.01] transition-transform"
                  >
                    <Panel contentClassName="px-6 py-8 md:px-10 md:py-10">
                      <h1
                        className="text-[19px] font-semibold tracking-[-0.01em] text-white leading-tight"
                        style={{ fontFamily: FONT }}
                      >
                        {goal.title}
                      </h1>
                    </Panel>
                  </button>

                  {/* Trash icon */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id, goal.title); }}
                    aria-label="Delete goal"
                    className="absolute bottom-3 right-3 text-white/40 p-2 hover:text-white/80 transition-colors z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Shard reward grid */}
                  {goalProgress[goal.id] && (
                    <div className="mt-2 flex justify-center">
                      <ShardRewardGrid progress={goalProgress[goal.id]} totalDays={goal.totalDays ?? 28} />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Hook mechanics — daily teaser */}
            {engagement && (
              <motion.div variants={tileEnter} className="px-6 md:px-10 flex flex-wrap items-center gap-3 mb-6">
                {engagement.dailyMultiplier > 1 && (
                  <Panel contentClassName="px-5 py-3">
                    <span className="text-[13px] font-semibold text-white">
                      {COPY.goals.hooks.dailyMultiplier(engagement.dailyMultiplier)}
                    </span>
                  </Panel>
                )}
                {engagement.streakFreezes > 0 && (
                  <Panel contentClassName="px-5 py-3">
                    <span className="text-[13px] font-semibold text-white/80">
                      {COPY.goals.hooks.streakFreeze(engagement.streakFreezes)}
                    </span>
                  </Panel>
                )}
                {engagement.isComeback && (
                  <Panel contentClassName="px-5 py-3">
                    <span className="text-[13px] font-semibold text-white/80">{COPY.goals.hooks.comeback}</span>
                  </Panel>
                )}
              </motion.div>
            )}

            {/* Stats & Achievements */}
            {engagement && (
              <motion.div variants={tileEnter} className="space-y-4 mb-8 px-6 md:px-10">
                <StatsCard engagement={engagement} />
                <div className="flex justify-center">
                  <AchievementsSheet achievements={engagement.achievements} />
                </div>
              </motion.div>
            )}

            {/* Add Goal */}
            <div className="px-6 md:px-10">
              <motion.button
                variants={tileEnter}
                onClick={onCreateGoal}
                className="rounded-full bg-white text-black text-[15px] font-semibold py-3 px-6 w-full transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                style={{ fontFamily: FONT }}
              >
                <Plus className="w-4 h-4" />
                {COPY.goals.addGoal}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <MosaicCard seed={0} density="xl" className="min-h-screen p-6 md:p-10 flex flex-col items-center justify-center">
            <div className="text-center mb-4 md:mb-8 space-y-3">
              <Panel contentClassName="px-8 py-5">
                <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-white leading-[1.05]" style={{ fontFamily: FONT }}>
                  {COPY.goals.emptyState.heading}
                </h1>
              </Panel>
              <Panel contentClassName="px-6 py-4">
                <p className="text-[16px] leading-relaxed text-white/70">
                  {COPY.goals.emptyState.body}
                </p>
              </Panel>
            </div>
            <BouncingButton onClick={onCreateGoal} />
          </MosaicCard>
        )}
      </div>
    </div>
  );
}
