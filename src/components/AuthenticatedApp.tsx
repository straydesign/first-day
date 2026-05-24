"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingScreen } from "@/components/LoadingScreen";
import { computeEngagementState, getMilestone, getLatestDayXP, calculateStreaks } from "@/lib/engagement";
import { setProgressFraction } from "@/components/3d-shell/progressIntent";
import {
  startPresence,
  stopPresence,
  setOwnRoomId,
} from "@/components/3d-shell/presencePulseIntent";
import {
  startReactionsRealtime,
  stopReactionsRealtime,
  setVisibleRoomIds,
} from "@/components/3d-shell/reactionsIntent";
import { subscribeArrivedMarker, getArrivedMarker } from "@/components/3d-shell/galleryIntent";
import { useGoalManager } from "@/hooks/useGoalManager";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import type { AppView, EngagementState, Milestone, XPBreakdown, Achievement, SelectedDay } from "@/types";

const CalendarView = dynamic(() => import("@/components/CalendarView").then(m => ({ default: m.CalendarView })), { loading: () => <LoadingScreen /> });
const DayView = dynamic(() => import("@/components/DayView").then(m => ({ default: m.DayView })), { loading: () => <LoadingScreen /> });
const GoalsManagement = dynamic(() => import("@/components/GoalsManagement").then(m => ({ default: m.GoalsManagement })), { loading: () => <LoadingScreen /> });
const Settings = dynamic(() => import("@/components/Settings").then(m => ({ default: m.Settings })), { loading: () => <LoadingScreen /> });
const NavigationMenu = dynamic(() => import("@/components/NavigationMenu").then(m => ({ default: m.NavigationMenu })));
const BottomNav = dynamic(() => import("@/components/BottomNav").then(m => ({ default: m.BottomNav })));
const SimpleGoalCreation = dynamic(() => import("@/components/SimpleGoalCreation").then(m => ({ default: m.SimpleGoalCreation })), { loading: () => <LoadingScreen /> });
const CongratsView = dynamic(() => import("@/components/CongratsView").then(m => ({ default: m.CongratsView })), { loading: () => <LoadingScreen /> });
const BeastMode = dynamic(() => import("@/components/BeastMode").then(m => ({ default: m.BeastMode })));
const AchievementUnlockToast = dynamic(() => import("@/components/AchievementUnlockToast").then(m => ({ default: m.AchievementUnlockToast })));
const GalleryView = dynamic(() => import("@/components/GalleryView").then(m => ({ default: m.GalleryView })));

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
    else if (currentView === "settings") handleBackToGoals();
    else if (currentView === "congrats") setCurrentView("calendar");
  });

  // Compute engagement state from progress + plan start date
  const engagement: EngagementState | null = useMemo(() => {
    if (!planData?.startDate || !progress) return null;
    return computeEngagementState(progress, planData.startDate);
  }, [progress, planData?.startDate]);

  // v209 — bridge user completion-state into cosmos identity. Each time
  // engagement recomputes (a day completes, the user reopens the app, demo
  // mode loads fixtures), push the fraction of the 30-day journey into the
  // module-level singleton; TileVoid reads it each frame and lights the
  // corresponding fraction of cosmos slabs. The void becomes a progress
  // ledger rather than a generic backdrop. Closes the VISION line "every
  // tile movement maps to a user transition or a state change" on the
  // long-term state axis — every prior cosmos channel was instantaneous.
  useEffect(() => {
    setProgressFraction((engagement?.totalDaysCompleted ?? 0) / 30);
  }, [engagement]);

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

  // P6 — own published room id (server-trust). Set by handlePublished from
  // GalleryView; lets the presence-pulse driver track who's inside it.
  const [ownRoomId, setOwnRoomIdState] = useState<string | null>(null);

  // P6 — presence + reactions realtime drivers. Presence runs whenever a
  // userId is known so the owner sees pulses anywhere in the app, not just
  // in the gallery. Reactions realtime is gated on gallery+visiting so the
  // channel doesn't stay open while the user is deep in their own plan.
  useEffect(() => {
    if (!userId) return;
    const visitingRoomId = currentView === "gallery" ? getArrivedMarker()?.id ?? null : null;
    startPresence(userId, visitingRoomId);
    // Re-track when the arrived marker changes (camera dolly lands on a new room).
    const unsub = subscribeArrivedMarker(() => {
      const next = currentView === "gallery" ? getArrivedMarker()?.id ?? null : null;
      startPresence(userId, next);
    });
    return () => {
      unsub();
    };
  }, [userId, currentView]);

  useEffect(() => () => stopPresence(), []);

  useEffect(() => {
    setOwnRoomId(ownRoomId);
  }, [ownRoomId]);

  useEffect(() => {
    if (currentView !== "gallery") {
      stopReactionsRealtime();
      return;
    }
    setVisibleRoomIds(() => {
      const arrived = getArrivedMarker();
      return new Set(arrived ? [arrived.id] : []);
    });
    startReactionsRealtime();
    return () => stopReactionsRealtime();
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

    const streaks = calculateStreaks(updatedProgress);
    const milestone = getMilestone(dayKey, streaks.current);
    setLatestMilestone(milestone);

    // Set view to congrats first (preloads the component), then show beast mode on top
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
        {currentView !== "onboarding" && currentView !== "congrats" && (
          <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
            <NavigationMenu
              currentView={currentView}
              onNavigateToGoals={handleBackToGoals}
              onNavigateToSettings={demoMode ? () => {} : () => setCurrentView("settings")}
              onNavigateToCalendar={
                currentGoalId
                  ? () => { loadGoalData(currentGoalId).then(() => setCurrentView("calendar")); }
                  : undefined
              }
              onLogout={handleLogoutAndReset}
            />
          </div>
        )}

        {loadingGoal && <LoadingScreen />}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
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

            {currentView === "settings" && !demoMode && (
              <Settings
                accessToken={accessToken}
                userId={userId}
                userEmail={userEmail || undefined}
                onBack={handleBackToGoals}
                onDeleteSuccess={handleLogoutAndReset}
                notificationsEnabled={notificationsEnabled}
                onToggleNotifications={setNotificationsEnabled}
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
                milestone={latestMilestone}
                xp={latestDayXP}
              />
            )}

            {currentView === "gallery" && (
              <GalleryView
                onBack={handleBackToGoals}
                userId={userId}
                plan={planData}
                goalId={goalManager.currentGoalId}
                goalTitle={planData?.cleanedGoal || goalData?.goal || null}
                onPublished={(roomId) => setOwnRoomIdState(roomId)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {showBeastMode && (
          <BeastMode onComplete={() => {
            setShowBeastMode(false);
          }} />
        )}

        {showFullScreenLoading && (
          <LoadingScreen showProgress={true} />
        )}

        {/* Mobile bottom navigation — persistent across main views */}
        {currentView !== "onboarding" && currentView !== "congrats" && !showFullScreenLoading && !showBeastMode && (
          <BottomNav
            currentView={currentView}
            onNavigateToGoals={handleBackToGoals}
            onNavigateToCalendar={
              currentGoalId
                ? () => { loadGoalData(currentGoalId).then(() => setCurrentView("calendar")); }
                : undefined
            }
            onNavigateToGallery={() => setCurrentView("gallery")}
            onNavigateToSettings={demoMode ? () => {} : () => setCurrentView("settings")}
          />
        )}

        <AchievementUnlockToast
          achievements={newAchievements}
          onDismiss={() => setNewAchievements([])}
        />
      </div>
    </div>
  );
}
