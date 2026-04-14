"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Bell, Trash2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { API_BASE } from "@/lib/supabase/client";
import { MosaicCard } from "./MosaicCard";

interface SettingsProps {
  accessToken: string;
  userId: string;
  userEmail?: string;
  onBack: () => void;
  onDeleteSuccess: () => void;
}

export function Settings({ accessToken, userId, userEmail, onBack, onDeleteSuccess }: SettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    try {
      const response = await fetch(`${API_BASE}/api/notifications/test`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (response.ok) toast.success(data.message || "Test email sent!");
      else toast.error(data.error || "Failed to send test email");
    } catch { toast.error("Failed to send test email"); }
    finally { setIsSendingTestEmail(false); }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") { toast.error("Please type DELETE to confirm"); return; }
    setIsDeleting(true);
    try {
      const response = await fetch(`${API_BASE}/api/user/delete`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.ok) { toast.success("Your account and all data have been deleted"); onDeleteSuccess(); }
      else { const errorData = await response.json(); toast.error(errorData.error || "Failed to delete account"); }
    } catch { toast.error("Failed to delete account"); }
    finally { setIsDeleting(false); }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-4 pt-[84px] pb-6 md:pb-12">
        <BackButton onClick={onBack} />
        <div className="mb-4 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-white/80 font-bold">Manage your account and data preferences</p>
        </div>
        <MosaicCard seed={1} className="p-4 md:p-6 mb-4 md:mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 clip-diamond bg-black border border-white/20 flex items-center justify-center"><User className="w-5 h-5 text-white" /></div>
            <h2 className="text-xl font-semibold text-white">Account Information</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-white/80"><Mail className="w-4 h-4 text-white/50" /><span className="text-sm">Email:</span><span className="text-sm">{userEmail || "Not available"}</span></div>
            <div className="flex items-center gap-3 text-white/80"><Shield className="w-4 h-4 text-white/50" /><span className="text-sm">User ID:</span><span className="text-sm font-mono text-xs">{userId}</span></div>
          </div>
        </MosaicCard>
        <MosaicCard seed={2} className="p-4 md:p-6 mb-4 md:mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 clip-diamond bg-black border border-white/20 flex items-center justify-center"><Shield className="w-5 h-5 text-white" /></div>
            <h2 className="text-xl font-semibold text-white">Privacy</h2>
          </div>
          <div className="text-white/80 text-sm space-y-2 mb-4">
            <p>Your data is encrypted and stored securely</p>
            <p>We never sell or share your personal information</p>
            <p>You have full control over your data</p>
          </div>
        </MosaicCard>
        <MosaicCard seed={3} className="p-4 md:p-6 mb-4 md:mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 clip-diamond bg-black border border-white/20 flex items-center justify-center"><Bell className="w-5 h-5 text-white" /></div>
            <h2 className="text-xl font-semibold text-white">Email Notifications</h2>
          </div>
          <div className="text-white/80 text-sm space-y-2 mb-4">
            <p>Daily reminder emails are automatically sent based on your goal&apos;s preferred time slot.</p>
          </div>
          <button onClick={handleSendTestEmail} disabled={isSendingTestEmail} className="flex items-center gap-2 px-5 py-3 font-black text-black uppercase tracking-wide text-sm hover:scale-105 disabled:hover:scale-100 disabled:opacity-50 transition-transform" style={{ backgroundColor: "#fcd02a", clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}>
            <Bell className="w-4 h-4" />{isSendingTestEmail ? "Sending..." : "Send Test Email"}
          </button>
        </MosaicCard>
        <MosaicCard seed={4} className="p-4 md:p-6 bg-red-950/30 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 clip-diamond bg-red-100 border border-red-300 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
            <h2 className="text-xl font-semibold text-white">Danger Zone</h2>
          </div>
          <p className="text-white/80 text-sm mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-400 text-red-600 hover:bg-red-950/50 hover:text-red-400 bg-black transition-smooth hover:scale-105"><Trash2 className="w-4 h-4 mr-2" />Delete My Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-black border border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-white/80">This action cannot be undone. This will permanently delete your account and remove all your data.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4">
                <label htmlFor="delete-confirm-input" className="text-sm text-white/80 mb-2 block">Type <span className="font-bold text-red-600">DELETE</span> to confirm:</label>
                <Input id="delete-confirm-input" type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="bg-black border-white/10 text-white focus:ring-2 focus:ring-red-500" placeholder="Type DELETE" />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")} className="bg-black border-2 border-white/10 text-white/80 hover:bg-white/10">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting || confirmText !== "DELETE"} className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete Account"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </MosaicCard>
      </div>
    </div>
  );
}
