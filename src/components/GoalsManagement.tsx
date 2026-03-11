"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { MosaicCard } from "./MosaicCard";
import { Textarea } from "@/components/ui/textarea";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";
import { Target, Plus, Trash2, Calendar, CheckCircle, Menu, LogOut } from "lucide-react";
import { createClient, API_BASE } from "@/lib/supabase/client";
import { BouncingButton } from "./BouncingButton";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { StreakBadge } from "./StreakBadge";
import { StatsCard } from "./StatsCard";
import { AchievementsSheet } from "./AchievementsSheet";
import type { EngagementState } from "@/types";

interface Goal {
  id: string;
  title: string;
  timeCommitment: string;
  startDate: string;
  completedDays: number;
  totalDays: number;
}

interface DayActivity {
  title: string;
  date: string;
  completed: boolean;
  reflection?: string;
  activities: Array<{ text: string; resources?: Array<{ type: string; url?: string; title?: string; query?: string }> }>;
  tip: string;
}

interface GoalsManagementProps {
  accessToken: string;
  onCreateGoal: () => void;
  onSelectGoal: (goalId: string) => void;
  onEditGoal: (goalId: string) => void;
  onViewTodayActivities?: (goalId: string) => void;
  onLogout: () => void;
  engagement?: EngagementState | null;
}

export function GoalsManagement({ accessToken, onCreateGoal, onSelectGoal, onEditGoal, onViewTodayActivities, onLogout, engagement }: GoalsManagementProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [goalActivities, setGoalActivities] = useState<Record<string, DayActivity>>({});
  const [goalCurrentDays, setGoalCurrentDays] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => { loadGoals(); }, []);

  useEffect(() => {
    if (goals.length > 0) {
      goals.forEach(goal => {
        const startDate = new Date(goal.startDate);
        startDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const dayNumber = Math.max(1, Math.min(diffDays + 1, 30));
        setGoalCurrentDays(prev => ({ ...prev, [goal.id]: dayNumber }));
      });
      setLoading(false);
    }
  }, [goals]);

  const loadGoals = async () => {
    try {
      const supabase = createClient();
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (!sessionData?.session) { toast.error("Please log in to continue."); setLoading(false); onLogout(); return; }
      if (sessionError || !sessionData?.session?.access_token) {
        if (sessionData?.session?.refresh_token) {
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !refreshData?.session?.access_token) { toast.error("Session expired. Please log in again."); setLoading(false); onLogout(); return; }
        } else { toast.error("Session expired. Please log in again."); setLoading(false); onLogout(); return; }
      }
      const freshToken = sessionData.session.access_token;
      const response = await fetch(`${API_BASE}/api/goals`, { headers: { 'Authorization': `Bearer ${freshToken}` } });
      if (response.ok) {
        const data = await response.json();
        if (data.goals && data.goals.length > 0) setGoals(data.goals);
        else setLoading(false);
      } else {
        if (response.status === 401) { toast.error("Session expired. Please log in again."); setLoading(false); onLogout(); return; }
        toast.error("Failed to load your goals"); setLoading(false);
      }
    } catch (error: any) { toast.error(`Failed to load your goals: ${error.message}`); setLoading(false); }
  };

  const handleDeleteGoal = async (goalId: string, goalTitle: string) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${goalTitle}"? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      const response = await fetch(`${API_BASE}/api/goals/${goalId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken}` } });
      if (response.ok) {
        toast.success("Goal deleted successfully");
        setGoals(prev => prev.filter(g => g.id !== goalId));
        if (expandedGoalId === goalId) { setExpandedGoalId(null); }
      } else { toast.error("Failed to delete goal"); }
    } catch { toast.error("Failed to delete goal"); }
  };

  const handleSubmitProgress = async (goalId: string) => {
    if (!reflections[goalId]?.trim()) { toast.error("Please share how your day went"); return; }
    setSubmitting(prev => ({ ...prev, [goalId]: true }));
    try {
      const response = await fetch(`${API_BASE}/api/goals/${goalId}/progress`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: { [goalCurrentDays[goalId]]: { completed: true, reflection: reflections[goalId], completedAt: new Date().toISOString() } } }),
      });
      if (response.ok) { toast.success("Great work! Progress saved"); setReflections(prev => ({ ...prev, [goalId]: "" })); }
      else toast.error("Failed to save progress");
    } catch { toast.error("Failed to save progress"); }
    finally { setSubmitting(prev => ({ ...prev, [goalId]: false })); }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative bg-black flex items-center justify-center">
        <div className="fixed inset-0 z-0 w-full h-full"><Aurora colorStops={[...AURORA_COLORS]} /></div>
        <div className="fixed top-0 left-0 right-0 z-20 h-1">
          <div className="h-full bg-teal-400 animate-shimmer" style={{ width: '60%', animation: 'loadingBar 1.5s ease-in-out infinite', clipPath: 'polygon(0 0, 100% 0, 96% 100%, 0 100%)' }} />
        </div>
        <div className="relative z-10">
          <p className="text-lg text-white/80 font-medium">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black">
      <div className="sticky top-0 z-50 flex justify-end px-4 py-2">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="clip-btn-c hover-geo bg-transparent border-2 border-teal-600 text-teal-600 hover:bg-white/10 px-5 py-2" aria-label="Menu">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[168px] bg-[#1a1a3e]/95 backdrop-blur-xl border-l-2 border-white/10 pt-12">
            <SheetTitle className="text-lg font-bold text-white mb-4 pt-8 text-center">Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigation options for your goals</SheetDescription>
            <nav className="flex flex-col gap-2 px-3">
              <Button onClick={() => setMobileMenuOpen(false)} variant="outline" size="sm" className="justify-start bg-[#242450] hover:bg-white/10 text-white border-white/10 text-sm py-2"><Target className="w-4 h-4 mr-2" />My Goals</Button>
              <Button onClick={() => { setMobileMenuOpen(false); if (goals[0]) onSelectGoal(goals[0].id); }} variant="outline" size="sm" className="justify-start hover:bg-white/10 text-sm py-2"><Calendar className="w-4 h-4 mr-2" />30 Day Plan</Button>
              <div className="my-2" />
              <Button onClick={onLogout} variant="outline" size="sm" className="justify-start hover:bg-red-500/10 text-red-400 border-red-400/20 text-sm py-2"><LogOut className="w-4 h-4 mr-2" />Logout</Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
      <div className="fixed inset-0 z-0 w-full h-full"><Aurora colorStops={[...AURORA_COLORS]} /></div>
      <div className="relative z-10 w-full pt-4 md:pt-8 pb-4 md:pb-8 px-4">
        {goals.length > 0 ? (
          <>
            <div className="text-center mb-4 md:mb-8 px-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 text-white">Today&apos;s Activities</h1>
              <p className="text-xl text-teal-700">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div className="animate-fadeIn space-y-4">
              {goals.map(goal => (
                <MosaicCard key={goal.id} seed={goals.indexOf(goal)} className="bg-[#1a1a3e]/90 backdrop-blur-sm">
                  <CardHeader>
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-2xl text-teal-900">{goal.title}</CardTitle>
                          {engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) && (
                            <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} size="sm" />
                          )}
                        </div>
                        <CardDescription className="text-teal-600">Day {goalCurrentDays[goal.id] || 0} of 30</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id, goal.title); }} className="text-red-400 hover:text-red-300 hover:bg-red-500/10" aria-label="Delete goal">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                    <Button size="lg" onClick={() => onSelectGoal(goal.id)} variant="outline" className="w-full bg-transparent border-2 border-teal-600 text-teal-600 hover:bg-white/10 transition-smooth hover:scale-105 mb-3">
                      <Calendar className="w-5 h-5 mr-2" />View 30 Day Plan
                    </Button>
                    <Button size="lg" className="w-full transition-smooth hover:scale-105" onClick={(e) => { e.stopPropagation(); if (onViewTodayActivities) onViewTodayActivities(goal.id); else onSelectGoal(goal.id); }}>
                      <CheckCircle className="w-5 h-5 mr-2" />View Today&apos;s Activities
                    </Button>
                  </CardHeader>
                </MosaicCard>
              ))}
              {/* Stats & Achievements */}
              {engagement && (
                <div className="space-y-4 px-4">
                  <StatsCard engagement={engagement} />
                  <div className="flex justify-center">
                    <AchievementsSheet achievements={engagement.achievements} />
                  </div>
                </div>
              )}
              <div className="pt-2 md:pt-4 pb-4 md:pb-8 px-4">
                <Button onClick={onCreateGoal} size="lg" variant="outline" className="w-full bg-transparent border-2 border-teal-600 text-teal-600 hover:bg-white/10 transition-smooth hover:scale-105 text-lg py-4 md:py-6 clip-btn-a">
                  <Plus className="w-6 h-6 mr-2" />Add New Goal
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-4 md:mb-8 px-4">
              <h1 className="text-3xl md:text-5xl font-bold mb-2 md:mb-4 text-white">Set Your First Goal</h1>
              <p className="text-xl text-teal-700">Pick any goal and get a personalized 30-day plan</p>
            </div>
            <BouncingButton onClick={onCreateGoal} />
          </>
        )}
      </div>
    </div>
  );
}
