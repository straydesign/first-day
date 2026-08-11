"use client";
import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
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
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message || COPY.toasts.googleFailed);
        setGoogleLoading(false);
      }
      // On success Supabase redirects the browser — detectSessionInUrl +
      // onAuthStateChange handle the return trip.
    } catch {
      toast.error(COPY.toasts.googleFailed);
      setGoogleLoading(false);
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

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white py-3.5 text-[15px] font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:hover:scale-100"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            {googleLoading ? COPY.login.google.loading : COPY.login.google.label}
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
