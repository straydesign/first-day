"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient, API_BASE } from '@/lib/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { DayOneLogo } from './DayOneLogo';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { validatePassword } from '@/lib/validation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (accessToken: string, userId: string) => void;
  onShowTerms?: () => void;
}

export function LoginModal({ isOpen, onClose, onAuthSuccess, onShowTerms }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
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
      <DialogContent className="w-screen h-screen max-w-none m-0 p-8 bg-white border-0 rounded-none animate-scaleIn shadow-none overflow-y-auto">
        <DialogTitle className="sr-only">{isLogin ? 'Log in to Day One' : 'Sign up for Day One'}</DialogTitle>
        <DialogDescription className="sr-only">{isLogin ? 'Enter your email and password' : 'Create an account'}</DialogDescription>

        <div className="mb-4 sm:mb-6 text-center">
          <div className="mb-2 flex justify-center animate-fadeIn">
            <DayOneLogo width={200} height={100} className="text-gray-900 max-w-full" />
          </div>
          <p className="text-gray-600 mt-2 text-sm sm:text-base animate-slideInUp" style={{ animationDelay: '0.1s' }}>
            {isLogin ? 'Welcome back!' : 'Start your journey today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
          {!isLogin && (
            <div>
              <Label htmlFor="name" className="text-gray-700">Name</Label>
              <Input id="name" type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
            </div>
          )}
          <div>
            <Label htmlFor="email" className="text-gray-700">Email</Label>
            <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              {isLogin && (
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-teal-600 hover:underline" disabled={loading}>Forgot password?</button>
              )}
            </div>
            <Input id="password" type="password" placeholder={isLogin ? 'Enter password' : 'Create password'} value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
          </div>
          {!isLogin && (
            <div>
              <Label htmlFor="confirmPassword" className="text-gray-700">Confirm Password</Label>
              <Input id="confirmPassword" type="password" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-500" />
            </div>
          )}
          {!isLogin && (
            <div className="flex items-start gap-2">
              <Checkbox id="terms" checked={agreeToTerms} onCheckedChange={(checked) => setAgreeToTerms(checked === true)} className="mt-1 flex-shrink-0" />
              <div className="flex flex-col text-gray-700 text-sm">
                <span>I agree to the</span>
                <button type="button" className="text-teal-600 hover:underline text-left" onClick={onShowTerms}>terms and conditions</button>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full transition-smooth hover:scale-105 disabled:hover:scale-100" disabled={loading}>
            {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2 max-w-md mx-auto">
          <button onClick={() => { setIsLogin(!isLogin); setName(''); setEmail(''); setPassword(''); setConfirmPassword(''); }} className="text-teal-600 hover:underline text-sm sm:text-base" disabled={loading}>
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
          {isLogin && <p className="text-xs text-gray-600 px-2">First time here? Create an account to get started</p>}
        </div>
      </DialogContent>

      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </Dialog>
  );
}
