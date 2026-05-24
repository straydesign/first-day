import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DEMO_GOAL_DETAILS } from "@/lib/demo-data";
import { getRoomView, setGenerating, fireCelebration } from "@/components/3d-shell/RoomRegistry";
import type { Plan, ProgressMap, SelectedDay, GoalFormData } from "@/types";

interface GoalDisplayData {
  goal: string;
  timeCommitment?: string;
  availableDays?: string[];
}

interface EditingGoalData {
  goalId: string;
  goal?: string;
  contextAnswers?: Record<string, string>;
  timeCommitment?: string;
  timeSlot?: string;
  wantsWeeklyBooks?: boolean;
  availableDays?: string[];
}

interface UseGoalManagerReturn {
  currentGoalId: string | null;
  goalData: GoalDisplayData | null;
  planData: Plan | null;
  selectedDay: SelectedDay | null;
  progress: ProgressMap;
  isGenerating: boolean;
  showFullScreenLoading: boolean;
  loadingGoal: boolean;
  editingGoalData: EditingGoalData | null;
  setSelectedDay: (day: SelectedDay | null) => void;
  setEditingGoalData: (data: EditingGoalData | null) => void;
  loadGoalData: (goalId: string) => Promise<void>;
  handleOnboardingComplete: (data: GoalFormData) => Promise<void>;
  handleSelectGoal: (goalId: string) => Promise<void>;
  handleEditGoal: (goalId: string) => Promise<void>;
  handleViewTodayActivities: (goalId: string) => Promise<void>;
  handleRegeneratePlan: () => Promise<void>;
  handleDayComplete: (dayData: { completed: Record<number, boolean>; feedback: string }) => ProgressMap | null;
  resetGoalState: () => void;
}

export function useGoalManager(onLogout: () => Promise<void>, demoMode = false): UseGoalManagerReturn {
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);
  const [goalData, setGoalData] = useState<GoalDisplayData | null>(null);
  const [planData, setPlanData] = useState<Plan | null>(null);
  const [selectedDay, setSelectedDay] = useState<SelectedDay | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullScreenLoading, setShowFullScreenLoading] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [editingGoalData, setEditingGoalData] = useState<EditingGoalData | null>(null);

  const resetGoalState = useCallback(() => {
    setCurrentGoalId(null);
    setGoalData(null);
    setPlanData(null);
    setSelectedDay(null);
    setProgress({});
    setEditingGoalData(null);
  }, []);

  const loadGoalData = useCallback(async (goalId: string) => {
    if (demoMode) {
      const demo = DEMO_GOAL_DETAILS[goalId];
      if (demo) {
        setGoalData({ goal: demo.goal, timeCommitment: demo.timeCommitment, availableDays: demo.availableDays });
        setPlanData(demo.plan);
        setProgress(demo.progress);
        setCurrentGoalId(goalId);
      }
      return;
    }
    try {
      const data = await api.goals.get(goalId);
      setGoalData({
        goal: data.goal,
        timeCommitment: data.timeCommitment,
        availableDays: data.availableDays,
      });
      setPlanData(data.plan);
      setProgress(data.progress || {});
      setCurrentGoalId(goalId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Session expired") || message.includes("session")) {
        toast.error("Session expired. Please log in again.");
        await onLogout();
      } else {
        toast.error("Failed to load goal data. Please try again.");
      }
      throw error;
    }
  }, [onLogout, demoMode]);

  const saveGoalData = useCallback(async (
    goalInfo: GoalFormData,
    plan: Plan,
    existingGoalId: string | null = null
  ): Promise<string | null> => {
    try {
      const payload = {
        goal: goalInfo.goal,
        contextAnswers: goalInfo.contextAnswers,
        timeCommitment: goalInfo.timeCommitment,
        timeSlot: goalInfo.timeSlot,
        wantsWeeklyBooks: goalInfo.wantsWeeklyBooks,
        availableDays: goalInfo.availableDays,
        plan,
      };

      if (existingGoalId) {
        await api.goals.update(existingGoalId, payload);
        return existingGoalId;
      } else {
        const data = await api.goals.create(payload);
        return data.goalId;
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save goal";
      toast.error(message);
      return null;
    }
  }, []);

  const generatePlan = useCallback(async (
    data: GoalFormData,
    existingGoalId: string | null = null
  ): Promise<{ goalId: string | null; view: "calendar" | null }> => {
    setIsGenerating(true);
    setShowFullScreenLoading(true);
    setGenerating(true, getRoomView());

    try {
      const localToday = new Date();
      localToday.setHours(0, 0, 0, 0);
      const localStartDate = localToday.toISOString().split("T")[0];

      const plan = await api.plan.generate({ ...data, startDate: localStartDate });
      setPlanData(plan);

      const goalId = await saveGoalData(data, plan, existingGoalId);

      if (goalId) {
        setCurrentGoalId(goalId);
        setEditingGoalData(null);
        toast.success(
          existingGoalId ? "Your plan has been updated!" : "Your plan is ready!"
        );
        // VISCERAL plan-arrival room event — wave stops, room ERUPTS, then view switches.
        // Burst intensity scales with plan size (7-day → 1.5, 14+-day → 2.0).
        fireCelebration(
          getRoomView(),
          1.0 + Math.min(1.0, Object.keys(plan.days ?? {}).length / 14)
        );
        return { goalId, view: "calendar" };
      } else {
        throw new Error(
          existingGoalId ? "Failed to update goal" : "Failed to save goal"
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Session expired")) {
        toast.error("Session expired. Please log in again.");
        await onLogout();
      } else {
        toast.error(`Failed to generate plan: ${message}`);
      }
      return { goalId: null, view: null };
    } finally {
      setIsGenerating(false);
      setShowFullScreenLoading(false);
      setGenerating(false);
    }
  }, [onLogout, saveGoalData]);

  const handleOnboardingComplete = useCallback(async (data: GoalFormData) => {
    if (demoMode) {
      toast("Sign up to create your own goals!", { description: "The demo shows pre-made goals to explore." });
      return;
    }
    setGoalData({ goal: data.goal, timeCommitment: data.timeCommitment, availableDays: data.availableDays });
    await generatePlan(data, editingGoalData?.goalId || null);
  }, [editingGoalData, generatePlan, demoMode]);

  const handleSelectGoal = useCallback(async (goalId: string) => {
    setLoadingGoal(true);
    try {
      await loadGoalData(goalId);
    } catch {
      // Error already handled in loadGoalData
    } finally {
      setLoadingGoal(false);
    }
  }, [loadGoalData]);

  const handleEditGoal = useCallback(async (goalId: string) => {
    if (demoMode) {
      toast("Sign up to edit goals!", { description: "Create an account to customize your plan." });
      return;
    }
    try {
      const data = await api.goals.get(goalId);
      setEditingGoalData({
        goalId,
        goal: data.goal.goal,
        contextAnswers: data.goal.contextAnswers,
        timeCommitment: data.goal.timeCommitment,
        timeSlot: data.goal.timeSlot,
        wantsWeeklyBooks: data.goal.wantsWeeklyBooks,
        availableDays: data.goal.availableDays,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Session expired")) {
        toast.error("Session expired. Please log in again.");
        await onLogout();
      } else {
        toast.error("Failed to load goal data");
      }
      throw error;
    }
  }, [onLogout, demoMode]);

  const handleViewTodayActivities = useCallback(async (goalId: string) => {
    await loadGoalData(goalId);

    try {
      const planSource = demoMode ? DEMO_GOAL_DETAILS[goalId]?.plan : (await api.goals.get(goalId)).plan;
      if (!planSource) throw new Error("Plan not found");

      const startDate = new Date(planSource.startDate);
      startDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const dayNumber = Math.max(1, Math.min(diffDays + 1, 30));

      const todayDay = planSource.days[dayNumber];
      if (todayDay) {
        const day: SelectedDay = {
          ...todayDay,
          number: dayNumber,
          date: today.toISOString(),
          dateDisplay: today.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }),
          isToday: true,
        };
        setSelectedDay(day);
      } else {
        toast.error("Today's activities are not available yet");
        throw new Error("Today's activities not available");
      }
    } catch {
      toast.error("Failed to load today's activities");
      throw new Error("Failed to load today's activities");
    }
  }, [loadGoalData, demoMode]);

  const handleRegeneratePlan = useCallback(async () => {
    if (demoMode) {
      toast("Sign up to regenerate plans!", { description: "Create an account to get AI-powered custom plans." });
      return;
    }
    if (!goalData || !currentGoalId) {
      toast.error("No goal data to regenerate");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to regenerate this plan? This will create a completely new 30-day plan."
    );
    if (!confirmed) return;

    try {
      const fullGoalData = await api.goals.get(currentGoalId);
      await generatePlan(
        {
          goal: fullGoalData.goal,
          contextAnswers: fullGoalData.contextAnswers,
          timeCommitment: fullGoalData.timeCommitment,
          timeSlot: fullGoalData.timeSlot,
          availableDays: fullGoalData.availableDays,
          wantsWeeklyBooks: fullGoalData.wantsWeeklyBooks,
        },
        currentGoalId
      );
    } catch {
      toast.error("Failed to regenerate plan. Please try again.");
    }
  }, [goalData, currentGoalId, generatePlan, demoMode]);

  const handleDayComplete = useCallback((dayData: { completed: Record<number, boolean>; feedback: string }): ProgressMap | null => {
    if (!selectedDay || !planData?.startDate) return null;

    const dayKey = selectedDay.number;
    const updatedProgress: ProgressMap = {
      ...progress,
      [dayKey]: {
        completed: dayData.completed,
        feedback: dayData.feedback,
        completedAt: new Date().toISOString(),
      },
    };
    setProgress(updatedProgress);

    // Fire-and-forget save (skip in demo mode)
    if (currentGoalId && !demoMode) {
      api.goals.saveProgress(currentGoalId, updatedProgress).catch(() => {
        // Progress save failure is non-critical
      });
    }

    return updatedProgress;
  }, [selectedDay, planData?.startDate, progress, currentGoalId, demoMode]);

  return {
    currentGoalId,
    goalData,
    planData,
    selectedDay,
    progress,
    isGenerating,
    showFullScreenLoading,
    loadingGoal,
    editingGoalData,
    setSelectedDay,
    setEditingGoalData,
    loadGoalData,
    handleOnboardingComplete,
    handleSelectGoal,
    handleEditGoal,
    handleViewTodayActivities,
    handleRegeneratePlan,
    handleDayComplete,
    resetGoalState,
  };
}
