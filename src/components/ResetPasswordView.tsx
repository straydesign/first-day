"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/validation';
import { DayOneLogo } from './DayOneLogo';

interface ResetPasswordViewProps {
  token: string | null;
  onSuccess: () => void;
}

export function ResetPasswordView({ token, onSuccess }: ResetPasswordViewProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
      const response = await fetch(`${API_BASE}/api/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ token, password }),
      });

      if (response.ok) {
        toast.success('Password reset successful! Please log in.');
        onSuccess();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reset password');
      }
    } catch {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <DayOneLogo width={200} height={100} />
          <h2 className="text-2xl font-bold text-slate-800 mt-4">Reset Your Password</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-password" className="text-gray-700">New Password</Label>
            <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="bg-white border-gray-300" />
          </div>
          <div>
            <Label htmlFor="confirm-new-password" className="text-gray-700">Confirm Password</Label>
            <Input id="confirm-new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="bg-white border-gray-300" />
          </div>
          <Button type="submit" className="w-full transition-smooth hover:scale-105 disabled:hover:scale-100" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
