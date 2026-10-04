"use client";
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { isNativeApp, signInWithProvider, type OAuthProvider } from '@/lib/native/auth';
import { FirstDayLogo } from './FirstDayLogo';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { FONT } from '@/lib/design';
import { COPY } from '@/content/copy';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (accessToken: string, userId: string) => void;
  onShowTerms?: () => void;
  onTryDemo?: () => void;
  defaultMode?: "login" | "signup";
}

export function LoginModal({ isOpen, onClose, onShowTerms, onTryDemo }: LoginModalProps) {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  // Sign in with Apple is required on iOS because Google is offered there.
  // Read after mount so the static export's HTML matches the first render.
  const [showApple, setShowApple] = useState(false);
  useEffect(() => { setShowApple(isNativeApp()); }, []);

  const handleSignIn = async (provider: OAuthProvider) => {
    const failed = provider === 'apple' ? COPY.toasts.appleFailed : COPY.toasts.googleFailed;
    setPending(provider);
    try {
      const { error } = await signInWithProvider(provider);
      if (error) toast.error(error.message || failed);
      // Web: Supabase redirects the page — detectSessionInUrl + onAuthStateChange
      // handle the return trip. iOS: useAuth finishes it on the app-URL callback.
    } catch {
      toast.error(failed);
    } finally {
      setPending(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="m-0 h-screen w-screen max-w-none overflow-y-auto border-0 bg-[#08080a]/92 p-6 shadow-none backdrop-blur-2xl [clip-path:none]"
        style={{ fontFamily: FONT }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-sm flex-col items-center justify-center py-10">
          <DialogTitle className="sr-only">Sign in to First Day</DialogTitle>
          <DialogDescription className="sr-only">Continue with Google to save your goals</DialogDescription>

          <div className="mb-3">
            <FirstDayLogo showLetters showTagline={false} />
          </div>
          <p className="mb-8 text-center text-[15px] leading-relaxed text-white/55">
            {COPY.login.subtitle}
          </p>

          {showApple && (
            <button
              type="button"
              onClick={() => handleSignIn('apple')}
              disabled={pending !== null}
              className="mb-3 flex w-full items-center justify-center gap-3 rounded-full bg-white py-3.5 text-[15px] font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
            >
              <svg width="16" height="19" viewBox="0 0 814 1000" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M788 341c-6 4-108 62-108 190 0 148 130 200 134 202-1 3-21 72-69 142-43 62-88 124-156 124s-86-40-165-40c-77 0-104 41-166 41s-106-57-156-127C44 791 0 671 0 557c0-183 119-280 236-280 62 0 114 41 153 41 37 0 95-43 166-43 27 0 124 2 188 95zM554 170c29-35 50-83 50-131 0-7-1-13-2-19-47 2-104 32-138 72-27 30-52 79-52 128 0 7 1 15 2 17 3 1 8 1 12 1 43 0 97-29 128-68z" />
              </svg>
              {pending === 'apple' ? COPY.login.apple.loading : COPY.login.apple.label}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSignIn('google')}
            disabled={pending !== null}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white py-3.5 text-[15px] font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            {pending === 'google' ? COPY.login.google.loading : COPY.login.google.label}
          </button>

          {onTryDemo && (
            <>
              <div className="my-5 flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/35">{COPY.login.dividerOr}</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
              <button
                type="button"
                onClick={() => { onTryDemo?.(); onClose(); }}
                className="w-full rounded-full border border-white/12 bg-white/[0.04] py-3.5 text-[15px] font-medium text-white transition hover:bg-white/[0.08]"
              >
                {COPY.login.demo.label} <span className="text-white/45">{COPY.login.demo.note}</span>
              </button>
            </>
          )}

          <p className="mt-8 max-w-xs text-center text-[12px] leading-relaxed text-white/35">
            {COPY.login.terms.prefix}{' '}
            <button type="button" onClick={(e) => { e.preventDefault(); onShowTerms?.(); }} className="text-white/55 underline-offset-2 transition hover:text-white/80 hover:underline">
              {COPY.login.terms.link}
            </button>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
