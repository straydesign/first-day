"use client";
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/validation';
import { TopBar } from '@/components/ui/TopBar';
import { Panel } from '@/components/ui/Panel';
import { FONT } from '@/lib/design';
import { COPY } from '@/content/copy';
import { screenTitle } from '@/content/flow';


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
      toast.error(COPY.toasts.passwordsNoMatch);
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
        toast.error(error.message || COPY.toasts.resetFailed);
      } else {
        toast.success(COPY.toasts.passwordUpdated);
        onSuccess();
      }
    } catch {
      toast.error(COPY.toasts.resetFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <TopBar title={screenTitle("reset-password")} />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-8">
            <h1
              className="text-[32px] font-semibold tracking-[-0.02em] text-white leading-[1.05]"
              style={{ fontFamily: FONT }}
            >
              {COPY.resetPassword.title}
            </h1>
            <p className="mt-2 text-white/55 text-[15px]">{COPY.resetPassword.subtitle}</p>
          </div>
          <Panel contentClassName="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="new-password" className="text-white/70 text-sm font-medium mb-1.5 block">
                  {COPY.resetPassword.newPasswordLabel}
                </Label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder={COPY.resetPassword.passwordPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/35 focus:border-white/30 focus:outline-none px-4 py-3 text-[15px] transition"
                />
              </div>
              <div>
                <Label htmlFor="confirm-new-password" className="text-white/70 text-sm font-medium mb-1.5 block">
                  {COPY.resetPassword.confirmPasswordLabel}
                </Label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  placeholder={COPY.resetPassword.passwordPlaceholder}
                  className="w-full bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/35 focus:border-white/30 focus:outline-none px-4 py-3 text-[15px] transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-white text-black text-[15px] font-semibold py-3 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 mt-2"
              >
                {loading ? COPY.resetPassword.submitLoading : COPY.resetPassword.submitIdle}
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}
