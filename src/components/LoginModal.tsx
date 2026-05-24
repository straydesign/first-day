"use client";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient, API_BASE } from '@/lib/supabase/client';
import { FirstDayLogo } from './FirstDayLogo';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { validatePassword } from '@/lib/validation';
import { SHARD_CLIPS } from '@/constants';
import { VoronoiMosaic } from './VoronoiMosaic';

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

const LETTER_PALETTE = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0", "#4FC3F7", "#FF4500", "#2979FF"];

const DEMO_SHARDS = ["TRY", "THE", "DEMO"];

type Mode = "login" | "signup" | "reset";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (accessToken: string, userId: string) => void;
  onShowTerms?: () => void;
  onTryDemo?: () => void;
  defaultMode?: "login" | "signup";
}

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
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
      const response = await fetch(`${API_BASE}/api/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || 'Signup failed');
        setLoading(false);
        return;
      }

      toast.success('Account created! Logging you in...');
      await new Promise(resolve => setTimeout(resolve, 500));
      await handleLogin();
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
      const response = await fetch(`${API_BASE}/api/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResetSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to send reset email');
      }
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) handleLogin();
    else if (isSignup) handleSignup();
    else handleReset();
  };

  const submitLabel = isLogin ? 'LOG IN' : isSignup ? 'SIGN UP' : (resetSent ? 'DONE' : 'SEND LINK');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-screen h-screen max-w-none m-0 p-4 md:p-8 border-0 shadow-none overflow-y-auto [clip-path:none]"
      >
        <div className="relative z-10 flex flex-col min-h-full">
          <DialogTitle className="sr-only">
            {isLogin ? 'Log in to First Day' : isSignup ? 'Sign up for First Day' : 'Reset your password'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isLogin ? 'Enter your email and password' : isSignup ? 'Create an account' : "Enter your email and we'll send you a reset link"}
          </DialogDescription>

          <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-6 sm:mb-8 animate-fadeIn w-full max-w-3xl lg:max-w-5xl mx-auto px-4 md:px-8">
            <div className="block md:hidden">
              <FirstDayLogo showTagline={true} showLetters={false} interactive={true} />
            </div>
            <div className="hidden md:block">
              <FirstDayLogo size="hero" showTagline={true} showLetters={false} interactive={true} />
            </div>
          </div>

          {!isReset && (
            <div className="max-w-md w-full mx-auto mb-6">
              <button
                type="button"
                onClick={() => { onTryDemo?.(); onClose(); }}
                className="group w-full flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-2 group-hover:gap-3 transition-all">
                  {DEMO_SHARDS.map((word, i) => (
                    <span
                      key={word}
                      style={{
                        fontFamily: "var(--font-bebas), system-ui, sans-serif",
                        fontSize: "clamp(1.3rem, 4vw, 2.2rem)",
                        fontWeight: 900,
                        letterSpacing: 3,
                        color: LETTER_PALETTE[i * 2],
                        backgroundColor: "#0a0a14",
                        border: `1px solid ${LETTER_PALETTE[i * 2]}30`,
                        clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                      }}
                      className="inline-block px-5 py-2"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <span className="text-xs text-white/40 font-bold uppercase tracking-wider">
                  No account needed
                </span>
              </button>
            </div>
          )}

          {isReset && (
            <div className="max-w-md w-full mx-auto mb-4 text-center">
              <h2
                className="text-3xl md:text-4xl font-black uppercase text-white mb-2 leading-[0.95]"
                style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 1 }}
              >
                Reset Password
              </h2>
              <p className="text-sm md:text-base text-white/70 font-medium">
                {resetSent
                  ? 'Check your email for a password reset link.'
                  : "Enter your email and we'll send you a reset link."}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full mx-auto">
            {isSignup && (
              <div className="relative overflow-hidden" style={{ clipPath: "polygon(1% 0%, 100% 2%, 99% 100%, 0% 97%)" }}>
                <VoronoiMosaic seed={3101} tileCount={28} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <Label htmlFor="name" className="relative z-10 block px-4 pt-3 pb-1 text-white/60 text-xs font-bold uppercase tracking-wider">Name</Label>
                <div className="relative z-10 mx-3 border-t border-white/10" />
                <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="relative z-10 bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
              </div>
            )}
            {!resetSent && (
              <div className="relative overflow-hidden" style={{ clipPath: "polygon(0% 2%, 99% 0%, 100% 98%, 1% 100%)" }}>
                <VoronoiMosaic seed={3113} tileCount={28} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <Label htmlFor="email" className="relative z-10 block px-4 pt-3 pb-1 text-white/60 text-xs font-bold uppercase tracking-wider">Email</Label>
                <div className="relative z-10 mx-3 border-t border-white/10" />
                <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="relative z-10 bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
              </div>
            )}
            {!isReset && (
              <div className="relative overflow-hidden" style={{ clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}>
                <VoronoiMosaic seed={3127} tileCount={28} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-1">
                  <Label htmlFor="password" className="text-white/60 text-xs font-bold uppercase tracking-wider">Password</Label>
                  {isLogin && (
                    <button type="button" onClick={() => switchMode("reset")} className="text-xs text-white/50 hover:text-white hover:underline font-medium" disabled={loading} aria-label="Forgot password?">Forgot?</button>
                  )}
                </div>
                <div className="relative z-10 mx-3 border-t border-white/10" />
                <Input id="password" type="password" placeholder={isLogin ? 'Enter password' : 'Create password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="relative z-10 bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
              </div>
            )}
            {isSignup && (
              <div className="relative overflow-hidden" style={{ clipPath: "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)" }}>
                <VoronoiMosaic seed={3139} tileCount={28} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <Label htmlFor="confirmPassword" className="relative z-10 block px-4 pt-3 pb-1 text-white/60 text-xs font-bold uppercase tracking-wider">Confirm Password</Label>
                <div className="relative z-10 mx-3 border-t border-white/10" />
                <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="relative z-10 bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
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
                  className={`w-full flex items-center gap-5 p-5 transition-all text-left ${agreeToTerms ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}
                  style={{ backgroundColor: agreeToTerms ? "#FFE633" : "#333333", clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}
                >
                  <div className={`w-12 h-12 flex-shrink-0 flex items-center justify-center border-3 transition-all ${agreeToTerms ? 'border-black/40 bg-black' : 'border-white/30 bg-transparent'}`} style={{ clipPath: "polygon(3% 0%, 100% 4%, 97% 100%, 0% 96%)" }}>
                    {agreeToTerms && <Check className="w-8 h-8 text-white" strokeWidth={3} />}
                  </div>
                  <span className={`text-lg font-black uppercase tracking-wide ${agreeToTerms ? 'text-black' : 'text-white'}`}>
                    {agreeToTerms ? 'Terms Accepted' : 'I Agree to the Terms'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); onShowTerms?.(); }}
                  className="text-xs text-white/40 hover:text-white/70 underline font-medium ml-1"
                >
                  View terms and conditions
                </button>
              </div>
            )}
            <button
              type={isReset && resetSent ? "button" : "submit"}
              onClick={isReset && resetSent ? () => switchMode("login") : undefined}
              disabled={loading}
              className="relative overflow-hidden w-full py-4 text-xl font-black uppercase tracking-wide hover:scale-105 transition-transform disabled:hover:scale-100 disabled:opacity-50"
              style={{ clipPath: "polygon(1% 0%, 100% 4%, 99% 96%, 0% 100%)" }}
            >
              <VoronoiMosaic seed={3151} tileCount={36} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
              {loading ? (
                <span className="relative z-10 text-white">Please wait...</span>
              ) : (
                <span className="relative z-10 flex items-center justify-center">
                  {submitLabel.split('').map((char, i) => (
                    <span key={i} style={{ color: char === ' ' ? 'transparent' : LETTER_PALETTE[i % LETTER_PALETTE.length], width: char === ' ' ? '0.3em' : undefined, display: 'inline-block' }}>{char}</span>
                  ))}
                </span>
              )}
            </button>
          </form>
          </div>

          <div className="pt-8 pb-4 flex flex-col items-center gap-3 max-w-md mx-auto">
            {isReset ? (
              <button
                onClick={() => switchMode("login")}
                disabled={loading}
                className="relative overflow-hidden text-white px-6 py-3 font-black text-sm uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
                style={{ clipPath: "polygon(2% 0%, 98% 5%, 100% 95%, 0% 100%)" }}
              >
                <VoronoiMosaic seed={3163} tileCount={20} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <span className="relative z-10">Back to Log In</span>
              </button>
            ) : (
              <button
                onClick={() => switchMode(isLogin ? "signup" : "login")}
                disabled={loading}
                className="relative overflow-hidden text-white px-6 py-3 font-black text-sm uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
                style={{ clipPath: "polygon(2% 0%, 98% 5%, 100% 95%, 0% 100%)" }}
              >
                <VoronoiMosaic seed={3171} tileCount={22} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <span className="relative z-10">{isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}</span>
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
