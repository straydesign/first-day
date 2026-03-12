"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { LandingPage } from "@/components/LandingPage";
import Aurora from "@/components/Aurora";
import { LoadingScreen } from "@/components/LoadingScreen";
import { createClient, API_BASE } from "@/lib/supabase/client";
import { AURORA_COLORS } from "@/constants";
import { computeEngagementState, getMilestone, getLatestDayXP, calculateStreaks } from "@/lib/engagement";
import type { EngagementState, Milestone, XPBreakdown, Achievement } from "@/types";

const CalendarView = dynamic(() => import("@/components/CalendarView").then(m => ({ default: m.CalendarView })), { loading: () => <LoadingScreen /> });
const DayView = dynamic(() => import("@/components/DayView").then(m => ({ default: m.DayView })), { loading: () => <LoadingScreen /> });
const GoalsManagement = dynamic(() => import("@/components/GoalsManagement").then(m => ({ default: m.GoalsManagement })), { loading: () => <LoadingScreen /> });
const Settings = dynamic(() => import("@/components/Settings").then(m => ({ default: m.Settings })), { loading: () => <LoadingScreen /> });
const LoginModal = dynamic(() => import("@/components/LoginModal").then(m => ({ default: m.LoginModal })));
const NavigationMenu = dynamic(() => import("@/components/NavigationMenu").then(m => ({ default: m.NavigationMenu })));
const PrivacyPolicy = dynamic(() => import("@/components/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = dynamic(() => import("@/components/TermsOfService").then(m => ({ default: m.TermsOfService })));
const ResetPasswordView = dynamic(() => import("@/components/ResetPasswordView").then(m => ({ default: m.ResetPasswordView })));
const SimpleGoalCreation = dynamic(() => import("@/components/SimpleGoalCreation").then(m => ({ default: m.SimpleGoalCreation })), { loading: () => <LoadingScreen /> });
const CongratsView = dynamic(() => import("@/components/CongratsView").then(m => ({ default: m.CongratsView })), { loading: () => <LoadingScreen /> });
const NotificationSettings = dynamic(() => import("@/components/NotificationSettings").then(m => ({ default: m.NotificationSettings })));
const XPAnimation = dynamic(() => import("@/components/XPAnimation").then(m => ({ default: m.XPAnimation })));
const BeastMode = dynamic(() => import("@/components/BeastMode").then(m => ({ default: m.BeastMode })));


function getSupabase() {
  return createClient();
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState("landing");
  const [currentGoalId, setCurrentGoalId] = useState<string | null>(null);
  const [goalData, setGoalData] = useState<any>(null);
  const [planData, setPlanData] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<any>({});
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "signup">("login");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [editingGoalData, setEditingGoalData] = useState<any>(null);
  const [showFullScreenLoading, setShowFullScreenLoading] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(false);
  const [showXPAnimation, setShowXPAnimation] = useState(false);
  const [latestDayXP, setLatestDayXP] = useState<XPBreakdown | null>(null);
  const [latestMilestone, setLatestMilestone] = useState<Milestone | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const prevAchievementsRef = useRef<Set<string>>(new Set());
  const [showBeastMode, setShowBeastMode] = useState(false);

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

  // Check for existing session on mount
  useEffect(() => {
    const path = window.location.pathname;

    if (path === "/privacy") {
      setCurrentView("privacy");
      setIsLoadingUser(false);
      return;
    }
    if (path === "/terms") {
      setCurrentView("terms");
      setIsLoadingUser(false);
      return;
    }

    // Check for password reset token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("reset");
    if (token) {
      setResetToken(token);
      setCurrentView("reset-password");
      setIsLoadingUser(false);
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    checkSession();

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        setIsAuthenticated(true);
        setCurrentView("goals");
        toast.success("Welcome!");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await getSupabase().auth.getSession();

      if (!error && session?.access_token && session?.user?.id) {
        setAccessToken(session.access_token);
        setUserId(session.user.id);
        setUserEmail(session.user.email ?? null);
        setIsAuthenticated(true);
        setCurrentView("goals");
      } else {
        setCurrentView("landing");
        setIsAuthenticated(false);
      }
    } catch {
      setCurrentView("landing");
      setIsAuthenticated(false);
    } finally {
      setIsLoadingUser(false);
    }
  };

  const loadGoalData = async (token: string, goalId: string) => {
    try {
      const { data: sessionData, error: sessionError } =
        await getSupabase().auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        if (sessionData?.session?.refresh_token) {
          const {
            data: { session: refreshedSession },
            error: refreshError,
          } = await getSupabase().auth.refreshSession();
          if (refreshError || !refreshedSession?.access_token) {
            toast.error("Session expired. Please log in again.");
            handleLogout();
            return;
          }
          const freshToken = refreshedSession.access_token;
          setAccessToken(freshToken);
          await fetchGoalData(freshToken, goalId);
          return;
        } else {
          toast.error("Session expired. Please log in again.");
          handleLogout();
          return;
        }
      }

      const freshToken = sessionData.session.access_token;
      await fetchGoalData(freshToken, goalId);
    } catch (error: any) {
      if (error?.message?.includes("session")) {
        toast.error("Session expired. Please log in again.");
        handleLogout();
      } else {
        toast.error("Failed to load goal data. Please try again.");
      }
    }
  };

  const fetchGoalData = async (freshToken: string, goalId: string) => {
    const response = await fetch(`${API_BASE}/api/goals/${goalId}`, {
      headers: { Authorization: `Bearer ${freshToken}` },
    });

    if (response.ok) {
      const data = await response.json();
      setGoalData({
        goal: data.goal,
        timeCommitment: data.timeCommitment,
        availableDays: data.availableDays,
      });
      setPlanData(data.plan);
      setProgress(data.progress || {});
      setCurrentGoalId(goalId);
      setCurrentView("calendar");
    } else {
      toast.error("Failed to load goal");
    }
  };

  const handleAuthSuccess = (token: string, uid: string) => {
    setAccessToken(token);
    setUserId(uid);
    setIsAuthenticated(true);
    setShowLoginModal(false);
    setCurrentView("goals");
  };

  const handleLogout = async () => {
    try {
      setIsAuthenticated(false);
      setAccessToken(null);
      setUserId(null);
      setUserEmail(null);
      setCurrentView("landing");
      setCurrentGoalId(null);
      setGoalData(null);
      setPlanData(null);
      setSelectedDay(null);
      setProgress({});
      setIsLoadingUser(false);
      window.history.pushState({}, "", "/");
      await getSupabase().auth.signOut();
      toast.success("Logged out successfully");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      setLoginModalMode("signup");
      if (currentView === "privacy" || currentView === "terms") {
        window.history.pushState({}, "", "/");
        setCurrentView("landing");
        setTimeout(() => setShowLoginModal(true), 100);
      } else {
        setShowLoginModal(true);
      }
    } else {
      setCurrentView("onboarding");
    }
  };

  const handleOpenLogin = () => {
    setLoginModalMode("login");
    setShowLoginModal(true);
  };

  const handleBackToLanding = () => {
    window.history.pushState({}, "", "/");
    setCurrentView("landing");
  };

  const handleShowPrivacyPolicy = () => {
    window.history.pushState({}, "", "/privacy");
    setCurrentView("privacy");
  };

  const handleShowTermsOfService = () => {
    window.history.pushState({}, "", "/terms");
    setCurrentView("terms");
  };

  const handleOnboardingComplete = async (data: any) => {
    setGoalData(data);
    await generatePlan(data, editingGoalData?.goalId || null);
  };

  const generatePlan = async (
    data: any,
    existingGoalId: string | null = null
  ) => {
    setIsGenerating(true);

    try {
      const { data: sessionData, error: sessionError } =
        await getSupabase().auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        toast.error(
          "Authentication error. Please try logging out and back in."
        );
        setCurrentView("landing");
        return;
      }

      const freshToken = sessionData.session.access_token;
      setShowFullScreenLoading(true);

      const localToday = new Date();
      localToday.setHours(0, 0, 0, 0);
      const localStartDate = localToday.toISOString().split("T")[0];

      const response = await fetch(`${API_BASE}/api/generate-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ ...data, startDate: localStartDate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          toast.error("Session expired. Please log in again.");
          handleLogout();
          return;
        }
        throw new Error(errorData.error || "Failed to generate plan");
      }

      const plan = await response.json();
      setPlanData(plan);

      const goalId = await saveGoalData(data, plan, existingGoalId);

      if (goalId) {
        setCurrentGoalId(goalId);
        setCurrentView("calendar");
        setEditingGoalData(null);
        toast.success(
          existingGoalId ? "Your plan has been updated!" : "Your plan is ready!"
        );
      } else {
        throw new Error(
          existingGoalId ? "Failed to update goal" : "Failed to save goal"
        );
      }
    } catch (error: any) {
      toast.error(`Failed to generate plan: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setShowFullScreenLoading(false);
    }
  };

  const saveGoalData = async (
    goalInfo: any,
    plan: any,
    existingGoalId: string | null = null
  ) => {
    try {
      const { data: sessionData, error: sessionError } =
        await getSupabase().auth.getSession();

      if (sessionError || !sessionData?.session?.access_token) {
        toast.error(
          "Authentication error. Please try logging out and back in."
        );
        return null;
      }

      const freshToken = sessionData.session.access_token;
      const isUpdating = !!existingGoalId;
      const url = isUpdating
        ? `${API_BASE}/api/goals/${existingGoalId}`
        : `${API_BASE}/api/goals`;

      const response = await fetch(url, {
        method: isUpdating ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({
          goal: goalInfo.goal,
          contextAnswers: goalInfo.contextAnswers,
          timeCommitment: goalInfo.timeCommitment,
          timeSlot: goalInfo.timeSlot,
          wantsWeeklyBooks: goalInfo.wantsWeeklyBooks,
          availableDays: goalInfo.availableDays,
          plan: plan,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return isUpdating ? existingGoalId : data.goalId;
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.error ||
            (isUpdating ? "Failed to update goal" : "Failed to save goal")
        );
        return null;
      }
    } catch {
      toast.error("Failed to save goal");
      return null;
    }
  };

  const saveProgress = async (updatedProgress: any) => {
    if (!currentGoalId) return;

    try {
      const { data: sessionData, error: sessionError } =
        await getSupabase().auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) return;

      const freshToken = sessionData.session.access_token;
      await fetch(`${API_BASE}/api/goals/${currentGoalId}/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        },
        body: JSON.stringify({ progress: updatedProgress }),
      });
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleDayClick = (day: any) => {
    setSelectedDay(day);
    setCurrentView("day");
  };

  const handleDayComplete = (dayData: any) => {
    if (!selectedDay || !planData?.startDate) return;

    const dayKey = selectedDay.number;
    const updatedProgress = {
      ...progress,
      [dayKey]: {
        completed: dayData.completed,
        feedback: dayData.feedback,
        completedAt: new Date().toISOString(),
      },
    };
    setProgress(updatedProgress);
    saveProgress(updatedProgress);

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

  const handleViewCalendar = () => {
    setCurrentView("calendar");
  };

  const handleCreateGoal = () => {
    setEditingGoalData(null);
    setCurrentView("onboarding");
  };

  const handleEditGoal = async (goalId: string) => {
    if (!accessToken) return;

    try {
      const { data: sessionData, error: sessionError } =
        await getSupabase().auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        toast.error("Authentication error. Please refresh the page.");
        return;
      }

      const freshToken = sessionData.session.access_token;
      const response = await fetch(`${API_BASE}/api/goals/${goalId}`, {
        headers: { Authorization: `Bearer ${freshToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setEditingGoalData({
          goalId: goalId,
          goal: data.goal.goal,
          contextAnswers: data.goal.contextAnswers,
          timeCommitment: data.goal.timeCommitment,
          timeSlot: data.goal.timeSlot,
          wantsWeeklyBooks: data.goal.wantsWeeklyBooks,
          availableDays: data.goal.availableDays,
        });
        setCurrentView("onboarding");
      } else {
        toast.error("Failed to load goal data");
      }
    } catch {
      toast.error("Failed to load goal");
    }
  };

  const handleSelectGoal = async (goalId: string) => {
    if (!accessToken) return;
    setLoadingGoal(true);
    await loadGoalData(accessToken, goalId);
    setLoadingGoal(false);
  };

  const handleViewTodayActivities = async (goalId: string) => {
    if (!accessToken) return;

    await loadGoalData(accessToken, goalId);

    try {
      const { data: sessionData } = await getSupabase().auth.getSession();
      if (!sessionData?.session?.access_token) return;

      const response = await fetch(`${API_BASE}/api/goals/${goalId}`, {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const startDate = new Date(data.plan.startDate);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const dayNumber = Math.max(1, Math.min(diffDays + 1, 30));

        const todayDay = data.plan.days[dayNumber];

        if (todayDay) {
          setSelectedDay({
            ...todayDay,
            number: dayNumber,
            date: today.toISOString(),
            dateDisplay: today.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            }),
            isToday: true,
          });
          setCurrentView("day");
        } else {
          toast.error("Today's activities are not available yet");
        }
      }
    } catch {
      toast.error("Failed to load today's activities");
    }
  };

  const handleRegeneratePlan = async () => {
    if (!goalData || !currentGoalId) {
      toast.error("No goal data to regenerate");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to regenerate this plan? This will create a completely new 30-day plan."
    );
    if (!confirmed) return;

    try {
      const { data: sessionData, error: sessionError } =
        await getSupabase().auth.getSession();
      if (sessionError || !sessionData?.session?.access_token) {
        toast.error("Session expired. Please log in again.");
        handleLogout();
        return;
      }

      const freshToken = sessionData.session.access_token;
      const response = await fetch(
        `${API_BASE}/api/goals/${currentGoalId}`,
        { headers: { Authorization: `Bearer ${freshToken}` } }
      );

      if (!response.ok) throw new Error("Failed to load goal data");

      const fullGoalData = await response.json();
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
  };

  const handleBackToGoals = () => {
    setCurrentView("goals");
    setCurrentGoalId(null);
    setEditingGoalData(null);
    setGoalData(null);
    setPlanData(null);
    setSelectedDay(null);
    setProgress({});
  };

  const handleShowSettings = () => {
    setCurrentView("settings");
  };

  const handleDeleteAccountSuccess = async () => {
    await handleLogout();
    toast.success("Your account has been deleted");
  };

  // Password reset page
  if (currentView === "reset-password") {
    return (
      <ResetPasswordView
        token={resetToken}
        onSuccess={() => {
          setResetToken(null);
          setCurrentView("landing");
          setShowLoginModal(true);
        }}
      />
    );
  }

  // Loading state
  if (isLoadingUser) {
    return <LoadingScreen />;
  }

  // Public pages
  if (currentView === "privacy") {
    return (
      <PrivacyPolicy
        onBack={handleBackToLanding}
        onNavigate={(page) => {
          if (page === "terms") handleShowTermsOfService();
        }}
      />
    );
  }

  if (currentView === "terms") {
    return (
      <TermsOfService
        onBack={handleBackToLanding}
        onNavigate={(page) => {
          if (page === "privacy") handleShowPrivacyPolicy();
        }}
      />
    );
  }

  // Landing page
  if (currentView === "landing") {
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onLogin={handleOpenLogin}
          onPrivacyPolicy={handleShowPrivacyPolicy}
          onTermsOfService={handleShowTermsOfService}
        />
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onAuthSuccess={handleAuthSuccess}
          onShowTerms={handleShowTermsOfService}
          defaultMode={loginModalMode}
        />
      </>
    );
  }

  // All authenticated views
  return (
    <div className="min-h-screen relative bg-black">
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={[...AURORA_COLORS]} />
      </div>

      <div className="relative z-10">
        {isAuthenticated &&
          currentView !== "onboarding" &&
          currentView !== "goals" && (
            <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center">
              <NavigationMenu
                currentView={currentView}
                onNavigateToGoals={handleBackToGoals}
                onNavigateToSettings={handleShowSettings}
                onNavigateToCalendar={
                  currentGoalId
                    ? () => loadGoalData(accessToken!, currentGoalId)
                    : undefined
                }
                onShowNotifications={() => setShowNotificationSettings(true)}
                onLogout={handleLogout}
              />
            </div>
          )}

        {loadingGoal && <LoadingScreen />}

        {currentView === "goals" && accessToken && !loadingGoal && (
          <GoalsManagement
            accessToken={accessToken}
            onCreateGoal={handleCreateGoal}
            onSelectGoal={handleSelectGoal}
            onEditGoal={handleEditGoal}
            onViewTodayActivities={handleViewTodayActivities}
            onLogout={handleLogout}
            engagement={engagement}
          />
        )}

        {currentView === "settings" && accessToken && userId && (
          <Settings
            accessToken={accessToken}
            userId={userId}
            userEmail={userEmail || undefined}
            onBack={handleBackToGoals}
            onDeleteSuccess={handleDeleteAccountSuccess}
          />
        )}

        {currentView === "onboarding" && (
          <SimpleGoalCreation
            onComplete={handleOnboardingComplete}
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
            onLogout={handleLogout}
          />
        )}

        {currentView === "day" && selectedDay && (
          <DayView
            day={selectedDay}
            onComplete={handleDayComplete}
            isCompleted={progress[selectedDay.number]?.completed || false}
            savedProgress={progress[selectedDay.number] || null}
            onBack={() => setCurrentView("calendar")}
            currentStreak={engagement?.currentStreak ?? 0}
          />
        )}

        {currentView === "congrats" && (
          <CongratsView
            onViewCalendar={handleViewCalendar}
            onDoMore={handleBackToGoals}
            goalTitle={planData?.cleanedGoal || goalData?.goal}
            dayNumber={selectedDay?.number}
            milestone={latestMilestone}
            xp={latestDayXP}
            newAchievements={newAchievements}
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
          <LoadingScreen
            showProgress={true}
          />
        )}

        {latestDayXP && (
          <XPAnimation xp={latestDayXP} show={showXPAnimation} />
        )}
      </div>
    </div>
  );
}
