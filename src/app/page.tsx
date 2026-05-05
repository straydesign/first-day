"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { LandingPage } from "@/components/LandingPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthenticatedApp } from "@/components/AuthenticatedApp";
import { useAuth } from "@/hooks/useAuth";
import type { AppView } from "@/types";

const LoginModal = dynamic(() => import("@/components/LoginModal").then(m => ({ default: m.LoginModal })));
const LegalPage = dynamic(() => import("@/components/LegalPage").then(m => ({ default: m.LegalPage })));
const ResetPasswordView = dynamic(() => import("@/components/ResetPasswordView").then(m => ({ default: m.ResetPasswordView })));

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "signup">("login");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  const { isAuthenticated, accessToken, userId, userEmail, isLoading, login, logout } = useAuth({
    onSignIn: () => {
      setCurrentView("goals");
      toast.success("Welcome!");
    },
    onSessionChecked: (hasSession) => {
      // Only set view if not already on a public page
      if (currentView !== "privacy" && currentView !== "terms" && currentView !== "reset-password") {
        setCurrentView(hasSession ? "goals" : "landing");
      }
    },
  });

  // Handle URL-based routing on mount
  useEffect(() => {
    const path = window.location.pathname;

    if (path === "/privacy") {
      setCurrentView("privacy");
      return;
    }
    if (path === "/terms") {
      setCurrentView("terms");
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("reset");
    if (token) {
      setResetToken(token);
      setCurrentView("reset-password");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    setCurrentView("landing");
    setShowLoginModal(false);
    window.history.pushState({}, "", "/");
    await logout();
  }, [logout]);

  const handleAuthSuccess = useCallback((token: string, uid: string) => {
    login(token, uid);
    setShowLoginModal(false);
    setCurrentView("goals");
  }, [login]);

  const handleGetStarted = useCallback(() => {
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
      setCurrentView("goals");
    }
  }, [isAuthenticated, currentView]);

  const handleTryDemo = useCallback(() => {
    setDemoMode(true);
    setShowLoginModal(false);
  }, []);

  const handleExitDemo = useCallback(async () => {
    setDemoMode(false);
    setCurrentView("landing");
  }, []);

  const handleOpenLogin = useCallback(() => {
    setLoginModalMode("login");
    setShowLoginModal(true);
  }, []);

  const handleBackToLanding = useCallback(() => {
    window.history.pushState({}, "", "/");
    setCurrentView("landing");
  }, []);

  const handleShowPrivacyPolicy = useCallback(() => {
    window.history.pushState({}, "", "/privacy");
    setCurrentView("privacy");
  }, []);

  const handleShowTermsOfService = useCallback(() => {
    window.history.pushState({}, "", "/terms");
    setCurrentView("terms");
  }, []);

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
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Public pages — Privacy + Terms share a single tabbed component
  if (currentView === "privacy" || currentView === "terms") {
    return (
      <LegalPage
        onBack={handleBackToLanding}
        initialTab={currentView}
        onTabChange={(tab) => {
          if (tab === "privacy") handleShowPrivacyPolicy();
          else handleShowTermsOfService();
        }}
      />
    );
  }

  // Demo mode — render the real app shell with mock data
  if (demoMode) {
    return (
      <AuthenticatedApp
        accessToken="demo"
        userId="demo"
        userEmail={null}
        initialView="goals"
        onLogout={handleExitDemo}
        demoMode
      />
    );
  }

  // Landing page
  if (currentView === "landing" || !isAuthenticated) {
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
          onTryDemo={handleTryDemo}
          defaultMode={loginModalMode}
        />
      </>
    );
  }

  // Authenticated views
  return (
    <AuthenticatedApp
      accessToken={accessToken!}
      userId={userId!}
      userEmail={userEmail}
      initialView="goals"
      onLogout={handleLogout}
    />
  );
}
