import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { DEMO_GOAL_DETAILS, DEMO_GOALS_LIST, buildDemoGoalDetail, generateNextSprint as generateNextSprintDemo } from "@/lib/demo-data";
import { getPlanTotalDays } from "@/lib/engagement";
import { getRoomView, setGenerating, fireCelebration } from "@/components/3d-shell/RoomRegistry";
import type { Plan, ProgressMap, SelectedDay, GoalFormData } from "@/types";
import { COPY } from "@/content/copy";

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
  handleOnboardingComplete: (data: GoalFormData) => Promise<boolean>;
  handleSelectGoal: (goalId: string) => Promise<void>;
  handleEditGoal: (goalId: string) => Promise<void>;
  handleViewTodayActivities: (goalId: string) => Promise<void>;
  handleRegeneratePlan: () => Promise<void>;
  handleDayComplete: (dayData: { completed: Record<number, boolean>; feedback: string }) => ProgressMap | null;
  generateNextSprint: (priorSprintNumber: number) => Promise<{ ok: boolean; adapted: boolean; nextTitle: string }>;
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
        toast.error(COPY.toasts.sessionExpired);
        await onLogout();
      } else {
        toast.error(COPY.toasts.loadGoalDataRetry);
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
      const message = error instanceof Error ? error.message : COPY.toasts.saveFailed;
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

      // Generate ONLY sprint 1 + the 4-sprint arc. Later sprints are generated
      // forward (with feedback) when the user finishes each one.
      const result = await api.plan.generateSprint({ ...data, startDate: localStartDate, sprint: 1 });
      const plan: Plan = {
        cleanedGoal: result.cleanedGoal ?? data.goal,
        startDate: localStartDate,
        totalDays: 28,
        days: result.days,
        sprints: result.sprints ?? [],
        sprintsGenerated: 1,
      };
      setPlanData(plan);

      const goalId = await saveGoalData(data, plan, existingGoalId);

      if (goalId) {
        setCurrentGoalId(goalId);
        setEditingGoalData(null);
        toast.success(
          existingGoalId ? COPY.toasts.planUpdated : COPY.toasts.planReady
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
        toast.error(COPY.toasts.sessionExpired);
        await onLogout();
      } else {
        toast.error(COPY.toasts.generatePlanFailed(message));
      }
      return { goalId: null, view: null };
    } finally {
      setIsGenerating(false);
      setShowFullScreenLoading(false);
      setGenerating(false);
    }
  }, [onLogout, saveGoalData]);

  const handleOnboardingComplete = useCallback(async (data: GoalFormData): Promise<boolean> => {
    if (demoMode) {
      const existingId = editingGoalData?.goalId;
      // Edit path: keep the same goalId, update fields + refresh sprint 1 content
      // around the new goal text. Progress on already-completed days is preserved.
      if (existingId && DEMO_GOAL_DETAILS[existingId]) {
        const fresh = buildDemoGoalDetail(data);
        const cleaned = fresh.detail.plan.cleanedGoal ?? fresh.detail.goal;
        const existing = DEMO_GOAL_DETAILS[existingId];
        DEMO_GOAL_DETAILS[existingId] = {
          ...existing,
          goal: fresh.detail.goal,
          timeCommitment: fresh.detail.timeCommitment,
          availableDays: fresh.detail.availableDays,
          plan: {
            ...existing.plan,
            cleanedGoal: cleaned,
            // Regenerating produces a standard 28-day, 4-sprint arc. Reset the
            // length + generated-sprint count to match it — otherwise a goal with
            // a custom totalDays (e.g. the 30-day riff goal) keeps its old length
            // but loses its hand-authored days, stranding days 29–30 as empty.
            totalDays: fresh.detail.plan.totalDays,
            days: fresh.detail.plan.days, // sprint 1 only — later sprints regen on completion
            sprints: fresh.detail.plan.sprints,
            sprintsGenerated: fresh.detail.plan.sprintsGenerated ?? 1,
          },
        };
        const listIdx = DEMO_GOALS_LIST.findIndex(g => g.id === existingId);
        if (listIdx >= 0) {
          DEMO_GOALS_LIST[listIdx] = { ...DEMO_GOALS_LIST[listIdx], title: cleaned, timeCommitment: fresh.detail.timeCommitment, totalDays: fresh.listItem.totalDays };
        }
        setGoalData({ goal: cleaned, timeCommitment: fresh.detail.timeCommitment, availableDays: fresh.detail.availableDays });
        setPlanData(DEMO_GOAL_DETAILS[existingId].plan);
        setCurrentGoalId(existingId);
        setEditingGoalData(null);
        toast.success(COPY.toasts.goalUpdated);
        return true;
      }
      // Create path
      const { goalId, detail, listItem } = buildDemoGoalDetail(data);
      DEMO_GOAL_DETAILS[goalId] = detail;
      DEMO_GOALS_LIST.push(listItem);
      setGoalData({ goal: detail.goal, timeCommitment: detail.timeCommitment, availableDays: detail.availableDays });
      setPlanData(detail.plan);
      setProgress({});
      setCurrentGoalId(goalId);
      setEditingGoalData(null);
      toast.success(COPY.toasts.planReady);
      fireCelebration(getRoomView(), 1.5);
      return true;
    }
    setGoalData({ goal: data.goal, timeCommitment: data.timeCommitment, availableDays: data.availableDays });
    const { goalId } = await generatePlan(data, editingGoalData?.goalId || null);
    return goalId !== null;
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
      const detail = DEMO_GOAL_DETAILS[goalId];
      if (!detail) {
        toast.error(COPY.toasts.goalNotFound);
        return;
      }
      setEditingGoalData({
        goalId,
        goal: detail.goal,
        timeCommitment: detail.timeCommitment,
        availableDays: detail.availableDays,
        contextAnswers: {},
        wantsWeeklyBooks: false,
      });
      return;
    }
    try {
      const data = await api.goals.get(goalId);
      setEditingGoalData({
        goalId,
        goal: data.goal,
        contextAnswers: data.contextAnswers,
        timeCommitment: data.timeCommitment,
        timeSlot: data.timeSlot,
        wantsWeeklyBooks: data.wantsWeeklyBooks,
        availableDays: data.availableDays,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      if (message.includes("Session expired")) {
        toast.error(COPY.toasts.sessionExpired);
        await onLogout();
      } else {
        toast.error(COPY.toasts.loadGoalData);
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
      const dayNumber = Math.max(1, Math.min(diffDays + 1, getPlanTotalDays(planSource)));

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
        toast.error(COPY.toasts.todayUnavailable);
        throw new Error("Today's activities not available");
      }
    } catch {
      toast.error(COPY.toasts.loadTodayFailed);
      throw new Error("Failed to load today's activities");
    }
  }, [loadGoalData, demoMode]);

  const handleRegeneratePlan = useCallback(async () => {
    if (demoMode) {
      toast(COPY.toasts.signUpRegenerate.title, { description: COPY.toasts.signUpRegenerate.description });
      return;
    }
    if (!goalData || !currentGoalId) {
      toast.error(COPY.toasts.noGoalToRegenerate);
      return;
    }

    const confirmed = window.confirm(COPY.confirms.regeneratePlan);
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
      toast.error(COPY.toasts.regenerateFailed);
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

    // Fire-and-forget save (skip in demo mode). Sprint-boundary forward-generation
    // is handled by the between-sprints recap via generateNextSprint(), not here —
    // so the recap can show a real loading state while the next sprint is built.
    if (currentGoalId && !demoMode) {
      api.goals.saveProgress(currentGoalId, updatedProgress).catch(() => {
        // Progress save failure is non-critical
      });
    }

    return updatedProgress;
  }, [selectedDay, planData?.startDate, progress, currentGoalId, demoMode]);

  /**
   * Generate the sprint AFTER `priorSprintNumber`, forward, using that sprint's
   * reflections + completion as input (production) so the AI adapts the next
   * week. Demo mode uses the synchronous template helper. Returns whether it
   * succeeded, whether feedback actually shaped it (`adapted`), and the new
   * sprint's title for the recap.
   */
  const generateNextSprint = useCallback(async (
    priorSprintNumber: number,
  ): Promise<{ ok: boolean; adapted: boolean; nextTitle: string }> => {
    const nextSprintNumber = priorSprintNumber + 1;
    const totalSprints = planData?.sprints?.length ?? 4;
    if (!planData || !currentGoalId || nextSprintNumber > totalSprints) {
      return { ok: false, adapted: false, nextTitle: "" };
    }
    const titleFor = (plan: Plan) => plan.sprints?.[nextSprintNumber - 1]?.title ?? `Sprint ${nextSprintNumber}`;

    if (demoMode) {
      const updated = generateNextSprintDemo(currentGoalId, nextSprintNumber);
      if (!updated) return { ok: false, adapted: false, nextTitle: "" };
      setPlanData(updated);
      return { ok: true, adapted: false, nextTitle: titleFor(updated) };
    }

    try {
      // Goal context comes from the DB; the just-finished sprint's reflections +
      // completion come from LOCAL progress (the day we just completed is saved
      // fire-and-forget, so a re-fetch could miss it).
      const full = await api.goals.get(currentGoalId);
      const lo = (priorSprintNumber - 1) * 7 + 1;
      const hi = priorSprintNumber * 7;
      const reflections: string[] = [];
      let completed = 0;
      for (let n = lo; n <= hi; n++) {
        const dp = progress[n];
        if (!dp) continue;
        const fb = (dp.feedback ?? dp.reflection ?? "").toString().trim();
        if (fb) reflections.push(fb);
        const c = dp.completed;
        if (c === true || (c && typeof c === "object" && Object.values(c).length > 0 && Object.values(c).every(Boolean))) {
          completed++;
        }
      }

      const result = await api.plan.generateSprint({
        goal: full.goal,
        contextAnswers: full.contextAnswers,
        timeCommitment: full.timeCommitment,
        timeSlot: full.timeSlot,
        availableDays: full.availableDays,
        wantsWeeklyBooks: full.wantsWeeklyBooks,
        sprint: nextSprintNumber,
        sprints: planData.sprints,
        priorReflections: reflections,
        priorCompletion: { completed, total: hi - lo + 1 },
      });

      const mergedPlan: Plan = {
        ...planData,
        days: { ...planData.days, ...result.days },
        sprints: result.sprints ?? planData.sprints,
        sprintsGenerated: Math.max(planData.sprintsGenerated ?? 1, nextSprintNumber),
      };
      setPlanData(mergedPlan);
      await api.goals.savePlan(currentGoalId, mergedPlan);
      return { ok: true, adapted: result.adapted, nextTitle: titleFor(mergedPlan) };
    } catch {
      toast.error(COPY.toasts.nextSprintFailed);
      return { ok: false, adapted: false, nextTitle: "" };
    }
  }, [planData, currentGoalId, demoMode, progress]);

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
    generateNextSprint,
    resetGoalState,
  };
}
