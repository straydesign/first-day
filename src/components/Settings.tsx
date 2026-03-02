"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Bell, Trash2 } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { API_BASE } from "@/lib/supabase/client";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";

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
    <div className="min-h-screen bg-white relative overflow-hidden">
      <div className="fixed inset-0 z-0 w-full h-full"><Aurora colorStops={[...AURORA_COLORS]} /></div>
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-6 md:py-12">
        <BackButton onClick={onBack} />
        <div className="mb-4 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">Account Settings</h1>
          <p className="text-teal-700">Manage your account and data preferences</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 border border-teal-300 flex items-center justify-center"><User className="w-5 h-5 text-teal-600" /></div>
            <h2 className="text-xl font-semibold text-slate-800">Account Information</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-700"><Mail className="w-4 h-4 text-gray-500" /><span className="text-sm">Email:</span><span className="text-sm">{userEmail || "Not available"}</span></div>
            <div className="flex items-center gap-3 text-gray-700"><Shield className="w-4 h-4 text-gray-500" /><span className="text-sm">User ID:</span><span className="text-sm font-mono text-xs">{userId}</span></div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-teal-100 border border-teal-300 flex items-center justify-center"><Shield className="w-5 h-5 text-teal-600" /></div>
            <h2 className="text-xl font-semibold text-slate-800">Privacy & Data</h2>
          </div>
          <div className="text-gray-700 text-sm space-y-2 mb-4">
            <p>Your data is encrypted and stored securely</p>
            <p>We never sell or share your personal information</p>
            <p>You have full control over your data</p>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-4 md:p-6 mb-4 md:mb-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center"><Bell className="w-5 h-5 text-blue-600" /></div>
            <h2 className="text-xl font-semibold text-slate-800">Email Notifications</h2>
          </div>
          <div className="text-gray-700 text-sm space-y-2 mb-4">
            <p>Daily reminder emails are automatically sent based on your goal&apos;s preferred time slot.</p>
          </div>
          <Button onClick={handleSendTestEmail} disabled={isSendingTestEmail} variant="outline" className="border-2 border-teal-600 text-teal-600 hover:bg-teal-50 transition-smooth hover:scale-105 disabled:hover:scale-100 bg-white">
            <Bell className="w-4 h-4 mr-2" />{isSendingTestEmail ? "Sending..." : "Send Test Email"}
          </Button>
        </div>
        <div className="bg-red-50 backdrop-blur-sm border border-red-200 rounded-xl p-4 md:p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-red-100 border border-red-300 flex items-center justify-center"><Trash2 className="w-5 h-5 text-red-600" /></div>
            <h2 className="text-xl font-semibold text-slate-800">Danger Zone</h2>
          </div>
          <p className="text-gray-700 text-sm mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-400 text-red-600 hover:bg-red-100 hover:text-red-700 bg-white transition-smooth hover:scale-105"><Trash2 className="w-4 h-4 mr-2" />Delete My Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border border-gray-200">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-slate-800">Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-600">This action cannot be undone. This will permanently delete your account and remove all your data.</AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4">
                <label className="text-sm text-gray-600 mb-2 block">Type <span className="font-bold text-red-600">DELETE</span> to confirm:</label>
                <Input type="text" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-red-500" placeholder="Type DELETE" />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")} className="bg-white border-2 border-slate-300 text-slate-600 hover:bg-slate-50">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting || confirmText !== "DELETE"} className="bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete Account"}</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
