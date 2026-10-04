"use client";
/**
 * WelcomeScreen — the first screen for anyone signed out, in the iOS app and
 * on firstday.life alike. The app comes first; the old marketing landing page
 * is gone. Sign-in is inline (no modal): Apple, Google, or the demo.
 *
 * Stays server-renderable and says what the app is, with Privacy and Terms
 * links, so Google's OAuth homepage check still has something to read.
 */
import { useState } from "react";
import { toast } from "sonner";
import { FirstDayLogo } from "./FirstDayLogo";
import { signInWithProvider, type OAuthProvider } from "@/lib/native/auth";
import { FONT } from "@/lib/design";
import { COPY } from "@/content/copy";

interface WelcomeScreenProps {
  onTryDemo: () => void;
  onShowPrivacy: () => void;
  onShowTerms: () => void;
}

const PILL = "flex w-full items-center justify-center gap-3 rounded-full py-3.5 text-[16px] font-semibold transition-transform active:scale-[0.98] disabled:opacity-60";

export function WelcomeScreen({ onTryDemo, onShowPrivacy, onShowTerms }: WelcomeScreenProps) {
  const C = COPY.login;
  const [pending, setPending] = useState<OAuthProvider | null>(null);

  const handleSignIn = async (provider: OAuthProvider) => {
    const failed = provider === "apple" ? COPY.toasts.appleFailed : COPY.toasts.googleFailed;
    setPending(provider);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) toast.error(error.message || failed);
      // Web: Supabase redirects the page and onAuthStateChange picks it up.
      // iOS: useAuth finishes it on the app-URL callback.
    } catch {
      toast.error(failed);
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      className="relative flex min-h-dvh flex-col px-6"
      style={{
        fontFamily: FONT,
        paddingTop: "calc(env(safe-area-inset-top) + 2rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
      }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center text-center">
        <FirstDayLogo showLetters showTagline={false} />
        <h1 className="sr-only">First Day</h1>
        <p className="mt-6 text-[17px] leading-relaxed text-white/70">{C.welcome}</p>
      </div>

      <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => handleSignIn("apple")}
          disabled={pending !== null}
          className={`${PILL} bg-white text-black`}
        >
          <svg width="16" height="19" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-57-156-127C44 791 0 671 0 557c0-183 119-280 236-280 62 0 114 41 153 41 37 0 95-43 166-43 27 0 124 2 188 95zM554 170c29-35 50-83 50-131 0-7-1-13-2-19-47 2-104 32-138 72-27 30-52 79-52 128 0 7 1 15 2 17 3 1 8 1 12 1 43 0 97-29 128-68z" />
          </svg>
          {pending === "apple" ? C.apple.loading : C.apple.label}
        </button>

        <button
          type="button"
          onClick={() => handleSignIn("google")}
          disabled={pending !== null}
          className={`${PILL} border border-white/15 bg-[#131314] text-white`}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          {pending === "google" ? C.google.loading : C.google.label}
        </button>

        <button
          type="button"
          onClick={onTryDemo}
          disabled={pending !== null}
          className="py-3 text-[15px] font-medium text-white/70 transition active:text-white"
        >
          {C.demo.label} <span className="text-white/45">{C.demo.note}</span>
        </button>

        <p className="mt-2 text-center text-[12px] leading-relaxed text-white/40">
          {C.terms.prefix}{" "}
          <button type="button" onClick={onShowTerms} className="text-white/60 underline underline-offset-2">
            {C.terms.link}
          </button>
          {" · "}
          <button type="button" onClick={onShowPrivacy} className="text-white/60 underline underline-offset-2">
            {C.terms.privacy}
          </button>
        </p>
      </div>
    </div>
  );
}
