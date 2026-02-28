"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { API_BASE } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
      <DialogContent className="bg-white border border-gray-200 max-w-md">
        <DialogTitle className="text-lg font-bold text-gray-900">Reset Password</DialogTitle>
        <DialogDescription className="text-gray-600">
          {sent ? 'Check your email for a password reset link.' : 'Enter your email address and we\'ll send you a reset link.'}
        </DialogDescription>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <Label htmlFor="reset-email" className="text-gray-700">Email</Label>
              <Input id="reset-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} className="bg-white border-gray-300" />
            </div>
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        ) : (
          <Button onClick={onClose} className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white">Done</Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
