"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient, API_BASE } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { FirstDayLogo } from './FirstDayLogo';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { validatePassword } from '@/lib/validation';
import { VoronoiMosaic } from "./VoronoiMosaic";
import { ShardButton } from "./ShardButton";

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
        <VoronoiMosaic seed={99} tileCount={40} margin={10} gap={3} className="absolute inset-0 w-full h-full" />
        {/* No scrim — full brightness */}
        <div className="relative z-10">
          <DialogTitle className="sr-only">{isLogin ? 'Log in to First Day' : 'Sign up for First Day'}</DialogTitle>
          <DialogDescription className="sr-only">{isLogin ? 'Enter your email and password' : 'Create an account'}</DialogDescription>

          <div className="mb-6 sm:mb-8 animate-fadeIn">
            <FirstDayLogo size="hero" showTagline={true} showLetters={false} className="w-full" />
            <p className="text-white/80 mt-3 text-sm sm:text-base text-center animate-slideInUp" style={{ animationDelay: '0.1s' }}>
              {isLogin ? 'Welcome back!' : 'Start your journey today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-white/80">Name</Label>
                <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="bg-black border-white/10 text-white placeholder:text-white/50" />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="bg-black border-white/10 text-white placeholder:text-white/50" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password" className="text-white/80">Password</Label>
                {isLogin && (
                  <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-white/80 hover:text-white hover:underline font-medium" disabled={loading}>Forgot password?</button>
                )}
              </div>
              <Input id="password" type="password" placeholder={isLogin ? 'Enter password' : 'Create password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="bg-black border-white/10 text-white placeholder:text-white/50" />
            </div>
            {!isLogin && (
              <div>
                <Label htmlFor="confirmPassword" className="text-white/80">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="bg-black border-white/10 text-white placeholder:text-white/50" />
              </div>
            )}
            {!isLogin && (
              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(checked === true)} className="mt-1 flex-shrink-0" />
                <div className="flex flex-col text-white/80 text-sm">
                  <span>I agree to the</span>
                  <button type="button" className="text-white hover:underline text-left font-medium" onClick={onShowTerms}>terms and conditions</button>
                </div>
              </div>
            )}
            <ShardButton seed={3} size="lg" type="submit" className="w-full transition-smooth hover:scale-105 disabled:hover:scale-100 text-xl font-black uppercase tracking-wide" disabled={loading}>
              {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
            </ShardButton>
          </form>

          <div className="mt-6 text-center space-y-4 max-w-md mx-auto">
            <div>
              <button onClick={() => { setIsLogin(!isLogin); setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); }} className="text-white hover:underline text-lg font-black uppercase tracking-wide" disabled={loading}>
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
              </button>
            </div>
            <div>
              <a
                href="/preview"
                className="inline-flex items-center gap-2 text-white hover:underline font-black text-lg uppercase tracking-wide transition-colors"
              >
                Try the demo — no account needed
              </a>
            </div>
          </div>
        </div>
      </DialogContent>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </Dialog>
  );
}
