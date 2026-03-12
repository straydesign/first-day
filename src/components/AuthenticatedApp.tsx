"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/LoadingScreen";
import { computeEngagementState, getMilestone, getLatestDayXP, calculateStreaks } from "@/lib/engagement";
import { useGoalManager } from "@/hooks/useGoalManager";
import type { AppView, EngagementState, Milestone, XPBreakdown, Achievement, SelectedDay } from "@/types";

const CalendarView = dynamic(() => import("@/components/CalendarView").then(m => ({ default: m.CalendarView })), { loading: () => <LoadingScreen /> });
const DayView = dynamic(() => import("@/components/DayView").then(m => ({ default: m.DayView })), { loading: () => <LoadingScreen /> });
const GoalsManagement = dynamic(() => import("@/components/GoalsManagement").then(m => ({ default: m.GoalsManagement })), { loading: () => <LoadingScreen /> });
const Settings = dynamic(() => import("@/components/Settings").then(m => ({ default: m.Settings })), { loading: () => <LoadingScreen /> });
const NavigationMenu = dynamic(() => import("@/components/NavigationMenu").then(m => ({ default: m.NavigationMenu })));
const SimpleGoalCreation = dynamic(() => import("@/components/SimpleGoalCreation").then(m => ({ default: m.SimpleGoalCreation })), { loading: () => <LoadingScreen /> });
const CongratsView = dynamic(() => import("@/components/CongratsView").then(m => ({ default: m.CongratsView })), { loading: () => <LoadingScreen /> });
const NotificationSettings = dynamic(() => import("@/components/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const XPAnimation = dynamic(() => import("@/components/XPAnimation").then(m => ({ default: m.XPAnimation })));
const BeastMode = dynamic(() => import("@/components/BeastMode").then(m => ({ default: m.BeastMode })));

interface AuthenticatedAppProps {
  accessToken: string;
  userId: string;
  userEmail: string | null;
  initialView: AppView;
  onLogout: () => Promise<void>;
}

export function AuthenticatedApp({ accessToken, userId, userEmail, initialView, onLogout }: AuthenticatedAppProps) {
  const [currentView, setCurrentView] = useState<AppView>(initialView);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [latestDayXP, setLatestDayXP] = useState<XPBreakdown | null>(null);
  const [latestMilestone, setLatestMilestone] = useState<Milestone | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const prevAchievementsRef = useRef<Set<string>>(new Set());
  const [showBeastMode, setShowBeastMode] = useState(false);

  const goalManager = useGoalManager(onLogout);
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

  // Compute engagement state from progress + plan start date
  const engagement: EngagementState | null = useMemo(() => {
    if (!planData?.startDate || !progress) return null;
    return computeEngagementState(progress, planData.startDate);
  }, [progress, planData?.startDate]);

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
    await handleOnboardingComplete(data);
    // generatePlan in the hook sets the view state via goalId check
    // We navigate to calendar if a goal was successfully created
    if (goalManager.currentGoalId || goalManager.planData) {
      setCurrentView("calendar");
    }
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

    // Compute XP and milestone for the completed day
    const xp = getLatestDayXP(updatedProgress, dayKey);
    setLatestDayXP(xp);
    setShowXPAnimation(true);

    const streaks = calculateStreaks(updatedProgress, planData.startDate);
    const milestone = getMilestone(dayKey, streaks.current);
    setLatestMilestone(milestone);

    // Auto-dismiss XP animation after 2.5 seconds
    setTimeout(() => setShowXPAnimation(false), 2500);

    // Show BEAST MODE interstitial, then congrats
    setShowBeastMode(true);
  };

  const handleLogoutAndReset = async () => {
    resetGoalState();
    await onLogout();
  };

  return (
    <div className="min-h-screen relative bg-black">
      <div className="relative z-10">
        {currentView !== "onboarding" && currentView !== "goals" && (
          <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
            <NavigationMenu
              currentView={currentView}
              onNavigateToGoals={handleBackToGoals}
              onNavigateToSettings={() => setCurrentView("settings")}
              onNavigateToCalendar={
                currentGoalId
                  ? () => { loadGoalData(currentGoalId).then(() => setCurrentView("calendar")); }
                  : undefined
              }
              onShowNotifications={() => setShowNotificationSettings(true)}
              onLogout={handleLogoutAndReset}
            />
          </div>
        )}

        {loadingGoal && <LoadingScreen />}

        {currentView === "goals" && !loadingGoal && (
          <GoalsManagement
            accessToken={accessToken}
            onCreateGoal={handleCreateGoal}
            onSelectGoal={handleSelectGoalAndNavigate}
            onEditGoal={handleEditGoal}
            onViewTodayActivities={handleViewTodayActivities}
            onLogout={handleLogoutAndReset}
            engagement={engagement}
          />
        )}

        {currentView === "settings" && (
          <Settings
            accessToken={accessToken}
            userId={userId}
            userEmail={userEmail || undefined}
            onBack={handleBackToGoals}
            onDeleteSuccess={handleLogoutAndReset}
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
            progress={progress}
          />
        )}

        {showNotificationSettings && (
          <NotificationSettings
            notificationsEnabled={notificationsEnabled}
            onToggle={(enabled: boolean) => setNotificationsEnabled(enabled)}
            onClose={() => setShowNotificationSettings(false)}
          />
        )}

        {showBeastMode && (
          <BeastMode onComplete={() => {
            setShowBeastMode(false);
            setCurrentView("congrats");
          }} />
        )}

        {showFullScreenLoading && (
          <LoadingScreen showProgress={true} />
        )}

        {latestDayXP && (
          <XPAnimation xp={latestDayXP} show={showXPAnimation} />
        )}
      </div>
    </div>
  );
}
