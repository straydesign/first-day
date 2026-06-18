"use client";
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/validation';
import { TopBar } from '@/components/ui/TopBar';
import { Panel } from '@/components/ui/Panel';
import { FONT } from '@/lib/design';


interface ResetPasswordViewProps {
  onSuccess: () => void;
}

export function ResetPasswordView({ onSuccess }: ResetPasswordViewProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setLoading(true);
    try {
      // Arriving via the recovery email link leaves an active recovery session,
      // so updating the password just works.
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message || 'Failed to reset password');
      } else {
        toast.success('Password updated! Please log in.');
        onSuccess();
      }
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <TopBar title="First Day" />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1
              className="text-[32px] font-semibold tracking-[-0.02em] text-white leading-[1.05]"
              style={{ fontFamily: FONT }}
            >
              Reset Your Password
            </h1>
            <p className="mt-2 text-white/55 text-[15px]">Enter your new password below.</p>
          </div>
          <Panel contentClassName="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="new-password" className="text-white/70 text-sm font-medium mb-1.5 block">
                  New Password
                </Label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/35 focus:border-white/30 focus:outline-none px-4 py-3 text-[15px] transition"
                />
              </div>
              <div>
                <Label htmlFor="confirm-new-password" className="text-white/70 text-sm font-medium mb-1.5 block">
                  Confirm Password
                </Label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/35 focus:border-white/30 focus:outline-none px-4 py-3 text-[15px] transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white text-black text-[15px] font-semibold py-3 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 mt-2"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
