"use client";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { COPY } from "@/content/copy";
import { LandingPage } from "@/components/LandingPage";
// Statically imported on purpose: /privacy and /terms are the two URLs Google's
// OAuth consent screen links to, so their text has to be in the served HTML.
// A dynamic() import would hide them in a streamed <div hidden> (see below).
import { LegalPage } from "@/components/LegalPage";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthenticatedApp } from "@/components/AuthenticatedApp";
import { useAuth } from "@/hooks/useAuth";
import type { AppView } from "@/types";
import { viewForPath, isPublicSubpage } from "@/content/flow";

/**
 * `ssr: false` is load-bearing, not an optimisation.
 *
 * A bare `dynamic()` is a lazy boundary: React suspends it during SSR, streams
 * the shell with a <template> placeholder, and delivers the real markup at the
 * end of <body> inside `<div hidden>` for a client script to move into place.
 * That is invisible to anything that doesn't run JS — and because these two sit
 * as SIBLINGS of the landing page, they dragged the ENTIRE page into that hidden
 * div. Google's crawler saw an empty document.
 *
 * Neither of these needs to exist server-side: a login modal only opens on click
 * and the reset view only renders behind a recovery link. Rendering them
 * client-only removes the suspension, so the landing page streams into <main>.
 */
const LoginModal = dynamic(() => import("@/components/LoginModal").then(m => ({ default: m.LoginModal })), { ssr: false });
const ResetPasswordView = dynamic(() => import("@/components/ResetPasswordView").then(m => ({ default: m.ResetPasswordView })), { ssr: false });

export default function Home() {
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<"login" | "signup">("login");
  const [demoMode, setDemoMode] = useState(false);

  const { isAuthenticated, accessToken, userId, userEmail, isLoading, login, logout } = useAuth({
    onSignIn: () => {
      setCurrentView("goals");
      toast.success(COPY.toasts.welcome);
    },
    onSessionChecked: (hasSession) => {
      // Only set view if not already on a public sub-page (privacy/terms/reset)
      if (!isPublicSubpage(currentView)) {
        setCurrentView(hasSession ? "goals" : "landing");
      }
    },
    onPasswordRecovery: () => setCurrentView("reset-password"),
  });

  // Handle URL-based routing on mount — resolve the path via the flow registry
  useEffect(() => {
    const view = viewForPath(window.location.pathname);
    if (view) setCurrentView(view);
  }, []);

  /**
   * True only after hydration. Gates the lazily-imported LoginModal so the
   * server pass has no React.lazy children at all.
   *
   * Belt to the braces of deleting `app/loading.tsx` (see the isLoading branch
   * below): a route-level <Suspense> plus any lazy child makes React serve the
   * FALLBACK as the page and ship the real markup at the end of <body> inside
   * `<div hidden>` for a client script to swap in — invisible to anything that
   * doesn't run JS. The modal is closed on first paint, so nothing is lost.
   */
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

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
        onSuccess={() => {
          setCurrentView("landing");
          setShowLoginModal(true);
        }}
      />
    );
  }

  // Loading state — an OVERLAY over the landing page, never a replacement for it.
  //
  // `isLoading` starts true, so returning only <LoadingScreen/> here meant the
  // server-rendered HTML for firstday.life contained 46 characters: "Skip to
  // content First Day". Anything that doesn't run JS — Google's crawler included
  // — saw an empty shell, which is why OAuth branding verification kept failing
  // with "your home page is behind a login page" and why the site had nothing to
  // index. The session lives in localStorage, so the server cannot know who is
  // asking; the landing page is the correct answer for everyone except a
  // returning signed-in user, and the overlay covers those few hundred ms for
  // them. Do not turn this back into an early return.
  //
  // This overlay is ALSO why there is no `app/loading.tsx` any more. That file
  // created a route-level <Suspense> whose fallback React served in place of the
  // whole page, streaming the real markup into a trailing `<div hidden>`. Even
  // with the page fully SSR-able, its content never reached <main>. Re-adding a
  // loading.tsx re-breaks the served HTML — this in-component overlay covers the
  // same wait without costing the page its body.
  if (isLoading) {
    return (
      <>
        <LandingPage
          onGetStarted={handleGetStarted}
          onLogin={handleOpenLogin}
          onPrivacyPolicy={handleShowPrivacyPolicy}
          onTermsOfService={handleShowTermsOfService}
        />
        <div className="boot-veil fixed inset-0 z-[300]" aria-hidden="true">
          <LoadingScreen />
        </div>
      </>
    );
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
        {hydrated && (
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            onAuthSuccess={handleAuthSuccess}
            onShowTerms={handleShowTermsOfService}
            onTryDemo={handleTryDemo}
            defaultMode={loginModalMode}
          />
        )}
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
