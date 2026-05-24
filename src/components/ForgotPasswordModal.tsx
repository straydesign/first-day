"use client";
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VoronoiMosaic } from './VoronoiMosaic';

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;

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
      <DialogContent className="border border-white/10 max-w-md">
        <DialogTitle className="text-lg font-bold text-white">Reset Password</DialogTitle>
        <DialogDescription className="text-white/80">
          {sent ? 'Check your email for a password reset link.' : 'Enter your email address and we\'ll send you a reset link.'}
        </DialogDescription>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reset-email" className="text-white/80">Email</Label>
              <div className="relative overflow-hidden rounded-md mt-1">
                <VoronoiMosaic seed={3501} tileCount={28} margin={3} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="relative z-10 bg-transparent border-white/10" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 font-black text-black uppercase tracking-wide hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 transition-transform" style={{ backgroundColor: "#fb7025", clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <button onClick={onClose} className="w-full mt-4 py-3 font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake" style={{ backgroundColor: "#fcd02a", clipPath: "polygon(1% 0%, 100% 4%, 99% 96%, 0% 100%)" }}>Done</button>
        )}
      </DialogContent>
    </Dialog>
  );
}
