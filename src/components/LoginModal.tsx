"use client";
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { createClient, API_BASE } from '@/lib/supabase/client';
import { FirstDayLogo } from './FirstDayLogo';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { validatePassword } from '@/lib/validation';

const LETTER_PALETTE = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0", "#4FC3F7", "#FF4500", "#2979FF"];

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (accessToken: string, userId: string) => void;
  onShowTerms?: () => void;
  defaultMode?: "login" | "signup";
}

export function LoginModal({ isOpen, onClose, onAuthSuccess, onShowTerms, defaultMode = "login" }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(defaultMode === "login");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) handleLogin();
    else handleSignup();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none m-0 p-4 md:p-8 bg-black border-0 animate-scaleIn shadow-none overflow-y-auto">
        <div className="relative z-10 flex flex-col min-h-full">
          <DialogTitle className="sr-only">{isLogin ? 'Log in to First Day' : 'Sign up for First Day'}</DialogTitle>
          <DialogDescription className="sr-only">{isLogin ? 'Enter your email and password' : 'Create an account'}</DialogDescription>

          <div className="flex-1 flex flex-col items-center justify-center">
          <div className="mb-6 sm:mb-8 animate-fadeIn w-full">
            <div
              className="w-full bg-black py-3 flex items-center justify-center"
              style={{ clipPath: "polygon(1% 0%, 99% 4%, 100% 96%, 0% 100%)" }}
            >
              <FirstDayLogo size="hero" showTagline={true} showLetters={false} className="w-full" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full mx-auto">
            {!isLogin && (
              <div className="bg-black overflow-hidden" style={{ clipPath: "polygon(1% 0%, 100% 2%, 99% 100%, 0% 97%)" }}>
                <Label htmlFor="name" className="block px-4 pt-3 pb-1 text-white/60 text-xs font-bold uppercase tracking-wider">Name</Label>
                <div className="mx-3 border-t border-white/10" />
                <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
              </div>
            )}
            <div className="bg-black overflow-hidden" style={{ clipPath: "polygon(0% 2%, 99% 0%, 100% 98%, 1% 100%)" }}>
              <Label htmlFor="email" className="block px-4 pt-3 pb-1 text-white/60 text-xs font-bold uppercase tracking-wider">Email</Label>
              <div className="mx-3 border-t border-white/10" />
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
            </div>
            <div className="bg-black overflow-hidden" style={{ clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}>
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <Label htmlFor="password" className="text-white/60 text-xs font-bold uppercase tracking-wider">Password</Label>
                {isLogin && (
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-white/50 hover:text-white hover:underline font-medium" disabled={loading}>Forgot?</button>
                )}
              </div>
              <div className="mx-3 border-t border-white/10" />
              <Input id="password" type="password" placeholder={isLogin ? 'Enter password' : 'Create password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
            </div>
            {!isLogin && (
              <div className="bg-black overflow-hidden" style={{ clipPath: "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)" }}>
                <Label htmlFor="confirmPassword" className="block px-4 pt-3 pb-1 text-white/60 text-xs font-bold uppercase tracking-wider">Confirm Password</Label>
                <div className="mx-3 border-t border-white/10" />
                <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="bg-transparent border-0 text-white placeholder:text-white/40 rounded-none focus-visible:ring-0 px-4" />
              </div>
            )}
            {!isLogin && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setAgreeToTerms(!agreeToTerms)}
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
              type="submit"
              disabled={loading}
              className="w-full bg-black py-4 text-xl font-black uppercase tracking-wide hover:scale-105 transition-transform disabled:hover:scale-100 disabled:opacity-50"
              style={{ clipPath: "polygon(1% 0%, 100% 4%, 99% 96%, 0% 100%)" }}
            >
              {loading ? (
                <span className="text-white">Please wait...</span>
              ) : (
                <span className="flex items-center justify-center">
                  {(isLogin ? 'LOG IN' : 'SIGN UP').split('').map((char, i) => (
                    <span key={i} style={{ color: char === ' ' ? 'transparent' : LETTER_PALETTE[i % LETTER_PALETTE.length], width: char === ' ' ? '0.3em' : undefined, display: 'inline-block' }}>{char}</span>
                  ))}
                </span>
              )}
            </button>
          </form>
          </div>

          <div className="pt-8 pb-4 flex flex-col items-center gap-3 max-w-md mx-auto">
            <button
              onClick={() => { setIsLogin(!isLogin); setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}
              disabled={loading}
              className="bg-black text-white px-6 py-3 font-black text-sm uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
              style={{ clipPath: "polygon(2% 0%, 98% 5%, 100% 95%, 0% 100%)" }}
            >
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
            </button>
            <a
              href="/preview"
              className="bg-black text-white px-6 py-3 font-black text-sm uppercase tracking-wide hover:scale-105 transition-transform inline-block"
              style={{ clipPath: "polygon(0% 5%, 97% 0%, 100% 100%, 3% 95%)" }}
            >
              Try the demo — no account needed
            </a>
          </div>
        </div>
      </DialogContent>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </Dialog>
  );
}
