"use client";
import type { Difficulty } from "@/types";
import { enableDailyReminder, disableDailyReminder } from "@/lib/native/reminders";
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { computeEngagementState, getMilestone, getLatestDayXP, calculateStreaks, getPlanTotalDays } from "@/lib/engagement";
import { useGoalManager } from "@/hooks/useGoalManager";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { SettingsPill } from "@/components/SettingsPill";
import { api } from "@/lib/api";
import { COPY } from "@/content/copy";
import { toast } from "sonner";
import type { AppView, EngagementState, Milestone, XPBreakdown, Achievement, SelectedDay } from "@/types";
import { backTarget } from "@/content/flow";

const NOTIF_KEY = "fd_notifications";

const Settings = dynamic(() => import("@/components/Settings").then(m => ({ default: m.Settings })), { loading: () => <LoadingScreen /> });
const SprintRecap = dynamic(() => import("@/components/SprintRecap").then(m => ({ default: m.SprintRecap })), { loading: () => <LoadingScreen /> });

const CalendarView = dynamic(() => import("@/components/CalendarView").then(m => ({ default: m.CalendarView })), { loading: () => <LoadingScreen /> });
const DayView = dynamic(() => import("@/components/DayView").then(m => ({ default: m.DayView })), { loading: () => <LoadingScreen /> });
const GoalsManagement = dynamic(() => import("@/components/GoalsManagement").then(m => ({ default: m.GoalsManagement })), { loading: () => <LoadingScreen /> });
const SimpleGoalCreation = dynamic(() => import("@/components/SimpleGoalCreation").then(m => ({ default: m.SimpleGoalCreation })), { loading: () => <LoadingScreen /> });
const CongratsView = dynamic(() => import("@/components/CongratsView").then(m => ({ default: m.CongratsView })), { loading: () => <LoadingScreen /> });
const BeastMode = dynamic(() => import("@/components/BeastMode").then(m => ({ default: m.BeastMode })));
const AchievementUnlockToast = dynamic(() => import("@/components/AchievementUnlockToast").then(m => ({ default: m.AchievementUnlockToast })));

interface AuthenticatedAppProps {
  accessToken: string;
  userId: string;
  userEmail: string | null;
  initialView: AppView;
  onLogout: () => Promise<void>;
  demoMode?: boolean;
}

export function AuthenticatedApp({ accessToken, userId, userEmail, initialView, onLogout, demoMode = false }: AuthenticatedAppProps) {
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  // Daily-reminder preference persists across sessions (the one user setting).
  // This component only mounts client-side (after the auth check), so the
  // stored value can seed the state directly.
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(NOTIF_KEY) === "1";
  });
  const [latestDayXP, setLatestDayXP] = useState<XPBreakdown | null>(null);
  const [latestMilestone, setLatestMilestone] = useState<Milestone | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const prevAchievementsRef = useRef<Set<string>>(new Set());
  const [showBeastMode, setShowBeastMode] = useState(false);
  const goalManager = useGoalManager(onLogout, demoMode);
  const {
    currentGoalId,
    goalData,
    planData,
    selectedDay,
    progress,
    showFullScreenLoading,
    loadingGoal,
    editingGoalData,
    setSelectedDay,
    setEditingGoalData,
    loadGoalData,
    handleOnboardingComplete,
    handleSelectGoal,
    handleEditGoal: editGoalApi,
    handleViewTodayActivities: viewTodayApi,
    handleRegeneratePlan,
    handleDayComplete: dayCompleteLogic,
    generateNextSprint,
    resetGoalState,
  } = goalManager;
  // When the user finishes the last day of a sprint (and more remain), we show
  // the between-sprints recap instead of the generic congrats screen.
  const [sprintRecap, setSprintRecap] = useState<{ priorSprint: number } | null>(null);

  const handleBackToGoals = () => {
    setCurrentView("goals");
    resetGoalState();
  };

  // Keyboard nav: Escape backs out along the flow registry's `back` targets.
  // The creation wizard is intentionally left alone so a stray keypress can't
  // discard an in-progress goal (use its Cancel button instead).
  useKeyboardNav(() => {
    if (currentView === "onboarding") return;
    const back = backTarget(currentView);
    if (back === "goals") handleBackToGoals(); // also resets in-flight goal state
    else if (back) setCurrentView(back);
  });

  const totalDays = getPlanTotalDays(planData);

  // Compute engagement state from progress + plan start date
  const planStartDate = planData?.startDate;
  const engagement: EngagementState | null = useMemo(() => {
    if (!planStartDate || !progress) return null;
    return computeEngagementState(progress, planStartDate, totalDays);
  }, [progress, planStartDate, totalDays]);

  // Track achievement unlocks for reveal animations
  useEffect(() => {
    if (!engagement) return;
    const currentUnlocked = new Set(
      engagement.achievements.filter((a) => a.unlocked).map((a) => a.id)
    );
    const prev = prevAchievementsRef.current;
    if (prev.size > 0) {
      const fresh = engagement.achievements.filter(
        (a) => a.unlocked && !prev.has(a.id)
      );
      if (fresh.length > 0) setNewAchievements(fresh);
    }
    prevAchievementsRef.current = currentUnlocked;
  }, [engagement]);

  // Scroll to top whenever the view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentView]);

  // Off until the user turns it on; turning it on asks iOS for permission and
  // schedules the evening reminder on the device.
  const handleToggleNotifications = async () => {
    const next = !notificationsEnabled;
    try {
      if (next) {
        const granted = await enableDailyReminder();
        if (!granted) {
          toast.error(COPY.settings.notifications.denied);
          return;
        }
      } else {
        await disableDailyReminder();
      }
    } catch {
      toast.error(COPY.toasts.notificationsFailed);
      return;
    }
    window.localStorage.setItem(NOTIF_KEY, next ? "1" : "0");
    setNotificationsEnabled(next);
    toast.success(next ? COPY.toasts.notificationsOn : COPY.toasts.notificationsOff);
  };

  // Right-to-delete: remove the account and everything in it, then sign out.
  const handleDeleteData = async () => {
    if (demoMode) return;
    if (!window.confirm(COPY.confirms.deleteAccount)) return;
    try {
      await api.account.deleteAccount();
      toast.success(COPY.toasts.accountDeleted);
    } catch {
      toast.error(COPY.toasts.deleteAccountFailed);
      return;
    }
    await handleLogoutAndReset();
  };

  const handleCreateGoal = () => {
    setEditingGoalData(null);
    setCurrentView("onboarding");
  };

  const handleEditGoal = async (goalId: string) => {
    try {
      await editGoalApi(goalId);
      setCurrentView("onboarding");
    } catch {
      // Error already handled
    }
  };

  const handleSelectGoalAndNavigate = async (goalId: string) => {
    await handleSelectGoal(goalId);
    setCurrentView("calendar");
  };

  const handleViewTodayActivities = async (goalId: string) => {
    try {
      await viewTodayApi(goalId);
      setCurrentView("day");
    } catch {
      // Error already handled
    }
  };

  const handleOnboardingCompleteAndNavigate = async (data: Parameters<typeof handleOnboardingComplete>[0]) => {
    const ok = await handleOnboardingComplete(data);
    if (ok) setCurrentView("calendar");
  };

  const handleDayClick = (day: SelectedDay) => {
    setSelectedDay(day);
    setCurrentView("day");
  };

  const handleDayComplete = (dayData: { dayNumber: number; completed: Record<number, boolean>; feedback: string; difficulty?: Difficulty }) => {
    if (!selectedDay || !planData?.startDate) return;

    const updatedProgress = dayCompleteLogic(dayData);
    if (!updatedProgress) return;

    const dayKey = selectedDay.number;

    const xp = getLatestDayXP(updatedProgress, dayKey);
    setLatestDayXP(xp);

    const streaks = calculateStreaks(updatedProgress);
    const milestone = getMilestone(dayKey, streaks.current, totalDays);
    setLatestMilestone(milestone);

    // Finishing the last day of a sprint closes the loop: show the recap, which
    // reads reflections back and builds the NEXT sprint forward. Only when that
    // next sprint still needs generating — a standard 4-sprint arc grows one at a
    // time. The final day of the goal, and custom all-upfront plans (every sprint
    // already generated), fall through to the normal congrats screen.
    const priorSprint = dayKey / 7;
    const totalSprints = planData.sprints?.length ?? 4;
    const nextAlreadyGenerated = (planData.sprintsGenerated ?? 1) >= priorSprint + 1;
    const isSprintBoundary =
      dayKey % 7 === 0 && dayKey < totalDays && priorSprint + 1 <= totalSprints && !nextAlreadyGenerated;
    setSprintRecap(isSprintBoundary ? { priorSprint } : null);

    setCurrentView("congrats");
    setShowBeastMode(true);
  };

  const handleLogoutAndReset = async () => {
    resetGoalState();
    await onLogout();
  };

  return (
    <div className="min-h-dvh relative">
      <div className="relative z-10">
        {loadingGoal && <LoadingScreen />}

        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
            {currentView === "goals" && !loadingGoal && (
              <GoalsManagement
                accessToken={accessToken}
                onCreateGoal={handleCreateGoal}
                onSelectGoal={handleSelectGoalAndNavigate}
                onEditGoal={handleEditGoal}
                onViewTodayActivities={handleViewTodayActivities}
                onLogout={handleLogoutAndReset}
                engagement={engagement}
                demoMode={demoMode}
              />
            )}

            {currentView === "onboarding" && (
              <SimpleGoalCreation
                onComplete={handleOnboardingCompleteAndNavigate}
                onCancel={handleBackToGoals}
                initialData={editingGoalData}
              />
            )}

            {currentView === "calendar" && planData && goalData && (
              <CalendarView
                planData={planData}
                goalTitle={planData.cleanedGoal || goalData.goal}
                onDayClick={handleDayClick}
                onEditGoal={() => {
                  if (currentGoalId) handleEditGoal(currentGoalId);
                }}
                onRegeneratePlan={handleRegeneratePlan}
                progress={progress}
                onBack={handleBackToGoals}
                engagement={engagement}
              />
            )}

            {currentView === "day" && selectedDay && (
              <DayView
                day={selectedDay}
                onComplete={handleDayComplete}
                isCompleted={progress[selectedDay.number]?.completed ? true : false}
                savedProgress={progress[selectedDay.number] || null}
                onBack={() => setCurrentView(backTarget("day")!)}
                currentStreak={engagement?.currentStreak ?? 0}
              />
            )}

            {currentView === "congrats" && sprintRecap && (
              <SprintRecap
                priorSprintNumber={sprintRecap.priorSprint}
                progress={progress}
                currentStreak={engagement?.currentStreak ?? 0}
                sprints={planData?.sprints}
                generateNextSprint={generateNextSprint}
                onContinue={() => {
                  setSprintRecap(null);
                  setCurrentView("calendar");
                }}
              />
            )}

            {currentView === "congrats" && !sprintRecap && (
              <CongratsView
                onViewCalendar={() => setCurrentView("calendar")}
                onDoMore={handleBackToGoals}
                goalTitle={planData?.cleanedGoal || goalData?.goal}
                dayNumber={selectedDay?.number}
                totalDays={totalDays}
                progress={progress}
                milestone={latestMilestone}
                xp={latestDayXP}
              />
            )}

            {currentView === "settings" && (
              <Settings
                userEmail={userEmail}
                demoMode={demoMode}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={handleToggleNotifications}
                onSignOut={handleLogoutAndReset}
                onDeleteData={handleDeleteData}
                onBack={() => setCurrentView("goals")}
              />
            )}

        </motion.div>

        {showBeastMode && (
          <BeastMode onComplete={() => {
            setShowBeastMode(false);
          }} />
        )}

        {showFullScreenLoading && (
          <LoadingScreen showProgress={true} />
        )}

        <AchievementUnlockToast
          achievements={newAchievements}
          onDismiss={() => setNewAchievements([])}
        />

        {/* Home screen only. On the plan and day screens the floating pill sat
            on top of day rows and the Too easy / Too hard buttons; those
            screens have a back button to Home, where Settings lives. */}
        {currentView === "goals" && (
          <SettingsPill onOpen={() => setCurrentView("settings")} />
        )}
      </div>
    </div>
  );
}
