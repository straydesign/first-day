"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { computeEngagementState, getMilestone, getLatestDayXP, calculateStreaks, getPlanTotalDays } from "@/lib/engagement";
import { setProgressFraction } from "@/components/3d-shell/progressIntent";
import { useGoalManager } from "@/hooks/useGoalManager";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import { LogoutPill } from "@/components/LogoutPill";
import type { AppView, EngagementState, Milestone, XPBreakdown, Achievement, SelectedDay } from "@/types";

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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
    resetGoalState,
  } = goalManager;

  // Keyboard nav: Escape goes back contextually
  useKeyboardNav(() => {
    if (currentView === "day") setCurrentView("calendar");
    else if (currentView === "calendar") handleBackToGoals();
    else if (currentView === "congrats") setCurrentView("calendar");
  });

  const totalDays = getPlanTotalDays(planData);

  // Compute engagement state from progress + plan start date
  const engagement: EngagementState | null = useMemo(() => {
    if (!planData?.startDate || !progress) return null;
    return computeEngagementState(progress, planData.startDate, totalDays);
  }, [progress, planData?.startDate, totalDays]);

  // v209 — bridge user completion-state into cosmos identity. Each time
  // engagement recomputes (a day completes, the user reopens the app, demo
  // mode loads fixtures), push the fraction of the full journey into the
  // module-level singleton; TileVoid reads it each frame and lights the
  // corresponding fraction of cosmos slabs. The void becomes a progress
  // ledger rather than a generic backdrop. Closes the VISION line "every
  // tile movement maps to a user transition or a state change" on the
  // long-term state axis — every prior cosmos channel was instantaneous.
  useEffect(() => {
    setProgressFraction((engagement?.totalDaysCompleted ?? 0) / totalDays);
  }, [engagement, totalDays]);

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

  // Sync 3D camera rig to current view
  useEffect(() => {
    void import("./3d-shell/RoomRegistry").then((m) => m.setRoomView(currentView));
  }, [currentView]);

  const handleBackToGoals = () => {
    setCurrentView("goals");
    resetGoalState();
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

  const handleDayComplete = (dayData: { dayNumber: number; completed: Record<number, boolean>; feedback: string }) => {
    if (!selectedDay || !planData?.startDate) return;

    const updatedProgress = dayCompleteLogic(dayData);
    if (!updatedProgress) return;

    const dayKey = selectedDay.number;

    const xp = getLatestDayXP(updatedProgress, dayKey);
    setLatestDayXP(xp);

    const streaks = calculateStreaks(updatedProgress);
    const milestone = getMilestone(dayKey, streaks.current, totalDays);
    setLatestMilestone(milestone);

    setCurrentView("congrats");
    setShowBeastMode(true);
  };

  const handleLogoutAndReset = async () => {
    resetGoalState();
    await onLogout();
  };

  return (
    <div className="min-h-screen relative">
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
                onLogout={handleLogoutAndReset}
              />
            )}

            {currentView === "day" && selectedDay && (
              <DayView
                day={selectedDay}
                onComplete={handleDayComplete}
                isCompleted={progress[selectedDay.number]?.completed ? true : false}
                savedProgress={progress[selectedDay.number] || null}
                onBack={() => setCurrentView("calendar")}
                currentStreak={engagement?.currentStreak ?? 0}
              />
            )}

            {currentView === "congrats" && (
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

        {(currentView === "goals" || currentView === "calendar" || currentView === "day") && !demoMode && (
          <LogoutPill onLogout={handleLogoutAndReset} />
        )}
      </div>
    </div>
  );
}
