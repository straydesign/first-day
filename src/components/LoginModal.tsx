"use client";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { FirstDayLogo } from './FirstDayLogo';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { validatePassword } from '@/lib/validation';
import { FONT } from '@/lib/design';

type Mode = "login" | "signup" | "reset";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (accessToken: string, userId: string) => void;
  onShowTerms?: () => void;
  onTryDemo?: () => void;
  defaultMode?: "login" | "signup";
}

const FIELD = "h-12 rounded-xl border-white/10 bg-white/5 px-4 text-[15px] text-white placeholder:text-white/35 focus-visible:border-white/30 focus-visible:ring-0";

export function LoginModal({ isOpen, onClose, onAuthSuccess, onShowTerms, onTryDemo, defaultMode = "login" }: LoginModalProps) {
  const [mode, setMode] = useState<Mode>(defaultMode);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const isLogin = mode === "login";
  const isSignup = mode === "signup";
  const isReset = mode === "reset";

  const switchMode = (next: Mode) => {
    setMode(next);
    setName('');
    setPassword('');
    setConfirmPassword('');
    setResetSent(false);
    if (next !== "reset") {
      // keep email when entering reset; clear otherwise
      setEmail('');
    }
  };

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword || !name) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }
    if (!agreeToTerms) {
      toast.error('You must agree to the terms and conditions');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: window.location.origin },
      });

      if (error) {
        toast.error(error.message || 'Signup failed');
        setLoading(false);
        return;
      }

      if (data.session?.access_token && data.user?.id) {
        // Email confirmation is off → user is signed in immediately.
        toast.success('Account created!');
        onAuthSuccess(data.session.access_token, data.user.id);
        onClose();
      } else {
        // Email confirmation is on → user must confirm before logging in.
        toast.success('Account created! Check your email to confirm, then log in.');
        switchMode('login');
        setLoading(false);
      }
    } catch {
      toast.error('Failed to create account');
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        if (error.message === 'Invalid login credentials') {
          toast.error("Invalid email or password. Please check your credentials or sign up if you don't have an account yet.");
        } else {
          toast.error(error.message || 'Login failed');
        }
        setLoading(false);
        return;
      }

      if (data?.session?.access_token && data?.user?.id) {
        toast.success('Welcome back!');
        onAuthSuccess(data.session.access_token, data.user.id);
        onClose();
      } else {
        toast.error('Login failed - no session created');
        setLoading(false);
      }
    } catch {
      toast.error('Failed to login');
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) {
        toast.error(error.message || 'Failed to send reset email');
      } else {
        setResetSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) {
        toast.error(error.message || 'Google sign-in failed');
        setGoogleLoading(false);
      }
      // On success Supabase redirects the browser — no further action needed here.
      // detectSessionInUrl + onAuthStateChange handle the return trip.
    } catch {
      toast.error('Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) handleLogin();
    else if (isSignup) handleSignup();
    else handleReset();
  };

  const submitLabel = isLogin ? 'Log in' : isSignup ? 'Create account' : (resetSent ? 'Done' : 'Send reset link');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="m-0 h-screen w-screen max-w-none overflow-y-auto border-0 bg-[#08080a]/92 p-6 shadow-none backdrop-blur-2xl [clip-path:none]"
        style={{ fontFamily: FONT }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center py-10">
          <DialogTitle className="sr-only">
            {isLogin ? 'Log in to First Day' : isSignup ? 'Sign up for First Day' : 'Reset your password'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isLogin ? 'Enter your email and password' : isSignup ? 'Create an account' : "Enter your email and we'll send you a reset link"}
          </DialogDescription>

          {/* Wordmark */}
          <div className="mb-8">
            <FirstDayLogo showLetters showTagline={false} />
          </div>

          {isReset && (
            <div className="mb-6 w-full text-center">
              <h2 className="text-[28px] font-semibold tracking-[-0.02em] text-white">Reset password</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-white/55">
                {resetSent
                  ? 'Check your email for a password reset link.'
                  : "Enter your email and we'll send you a reset link."}
              </p>
            </div>
          )}

          {/* Demo — the no-friction path */}
          {!isReset && (
            <button
              type="button"
              onClick={() => { onTryDemo?.(); onClose(); }}
              className="mb-6 w-full rounded-full border border-white/12 bg-white/[0.04] py-3.5 text-[15px] font-medium text-white transition hover:bg-white/[0.08]"
            >
              Try the demo <span className="text-white/45">· no account needed</span>
            </button>
          )}

          {/* Google */}
          {!isReset && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || loading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-white/12 bg-white/[0.04] py-3.5 text-[15px] font-medium text-white transition hover:bg-white/[0.08] disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                {googleLoading ? 'Please wait…' : 'Continue with Google'}
              </button>

              <div className="my-5 flex w-full items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/35">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {isSignup && (
              <div>
                <Label htmlFor="name" className="mb-1.5 block text-[12px] font-medium text-white/50">Name</Label>
                <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className={FIELD} />
              </div>
            )}
            {!resetSent && (
              <div>
                <Label htmlFor="email" className="mb-1.5 block text-[12px] font-medium text-white/50">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className={FIELD} />
              </div>
            )}
            {!isReset && (
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <Label htmlFor="password" className="text-[12px] font-medium text-white/50">Password</Label>
                  {isLogin && (
                    <button type="button" onClick={() => switchMode("reset")} className="text-[13px] font-medium text-white/55 transition hover:text-white" disabled={loading} aria-label="Forgot password?">Forgot?</button>
                  )}
                </div>
                <Input id="password" type="password" placeholder={isLogin ? 'Enter password' : 'Create password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className={FIELD} />
              </div>
            )}
            {isSignup && (
              <div>
                <Label htmlFor="confirmPassword" className="mb-1.5 block text-[12px] font-medium text-white/50">Confirm password</Label>
                <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className={FIELD} />
              </div>
            )}
            {isSignup && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAgreeToTerms(!agreeToTerms)}
                  role="checkbox"
                  aria-checked={agreeToTerms}
                  aria-label="I agree to the terms and conditions"
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.07]"
                >
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition ${agreeToTerms ? 'border-white bg-white' : 'border-white/25'}`}>
                    {agreeToTerms && <Check className="h-4 w-4 text-black" strokeWidth={3} />}
                  </span>
                  <span className={`text-[14px] font-medium ${agreeToTerms ? 'text-white' : 'text-white/70'}`}>
                    I agree to the Terms &amp; conditions
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onShowTerms?.(); }}
                  className="ml-1 text-[13px] font-medium text-white/50 underline-offset-2 transition hover:text-white/80 hover:underline"
                >
                  View terms and conditions
                </button>
              </div>
            )}
            <button
              type={isReset && resetSent ? "button" : "submit"}
              onClick={isReset && resetSent ? () => switchMode("login") : undefined}
              disabled={loading}
              className="w-full rounded-full bg-white py-3.5 text-[15px] font-semibold text-black transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Please wait…' : submitLabel}
            </button>
          </form>

          <div className="pt-8">
            {isReset ? (
              <button onClick={() => switchMode("login")} disabled={loading} className="text-[14px] font-medium text-white/55 transition hover:text-white">
                Back to log in
              </button>
            ) : (
              <button onClick={() => switchMode(isLogin ? "signup" : "login")} disabled={loading} className="text-[14px] font-medium text-white/55 transition hover:text-white">
                {isLogin ? (<>Don&apos;t have an account? <span className="text-white">Sign up</span></>) : (<>Already have an account? <span className="text-white">Log in</span></>)}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
