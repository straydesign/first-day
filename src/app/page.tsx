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
const PrivacyPolicy = dynamic(() => import("@/components/PrivacyPolicy").then(m => ({ default: m.PrivacyPolicy })));
const TermsOfService = dynamic(() => import("@/components/TermsOfService").then(m => ({ default: m.TermsOfService })));
const ResetPasswordView = dynamic(() => import("@/components/ResetPasswordView").then(m => ({ default: m.ResetPasswordView })));

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "signup">("login");
  const [resetToken, setResetToken] = useState<string | null>(null);

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
