"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/supabase/client';
import { validatePassword } from '@/lib/validation';
import { FirstDayLogo } from './FirstDayLogo';
import { VoronoiMosaic } from './VoronoiMosaic';

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
    <div className="min-h-screen flex items-center justify-center bg-[#060B18] p-4 md:p-8 relative overflow-hidden">
      <VoronoiMosaic seed={55} tileCount={40} margin={10} gap={3} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 bg-[#060B18]/50" />
      <div className="relative z-10 max-w-md w-full space-y-6">
        <div className="text-center">
          <FirstDayLogo width={200} height={100} layout="horizontal" showTagline={false} />
          <h2 className="text-2xl font-bold text-white mt-4">Reset Your Password</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="new-password" className="text-white/80">New Password</Label>
            <Input id="new-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} className="bg-[#060B18] border-white/10" />
          </div>
          <div>
            <Label htmlFor="confirm-new-password" className="text-white/80">Confirm Password</Label>
            <Input id="confirm-new-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading} className="bg-[#060B18] border-white/10" />
          </div>
          <Button type="submit" className="w-full transition-smooth hover:scale-105 disabled:hover:scale-100" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}
