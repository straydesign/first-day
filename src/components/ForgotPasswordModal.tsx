"use client";
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MosaicButton } from './MosaicButton';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSent(false);
      setLoading(false);
    }
  }, [isOpen]);

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setSent(true);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#060B18] border border-white/10 max-w-md">
        <DialogTitle className="text-lg font-bold text-white">Reset Password</DialogTitle>
        <DialogDescription className="text-white/80">
          {sent ? 'Check your email for a password reset link.' : 'Enter your email address and we\'ll send you a reset link.'}
        </DialogDescription>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reset-email" className="text-white/80">Email</Label>
              <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="bg-[#060B18] border-white/10" />
            </div>
            <MosaicButton type="submit" className="w-full transition-smooth hover:scale-105 disabled:hover:scale-100" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </MosaicButton>
          </form>
        ) : (
          <MosaicButton onClick={onClose} className="w-full mt-4 transition-smooth hover:scale-105">Done</MosaicButton>
        )}
      </DialogContent>
    </Dialog>
  );
}
