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
import { ShardButton } from "./ShardButton";
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
          <div className="h-full bg-white/60 animate-shimmer" style={{ width: '60%', animation: 'loadingBar 1.5s ease-in-out infinite', clipPath: 'polygon(0 0, 100% 0, 96% 100%, 0 100%)' }} />
        </div>
        <div className="relative z-10">
          <p className="text-lg text-white/80 font-medium">Loading your goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-black">
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Menu"
            className="fixed top-4 right-4 z-50 bg-black text-white p-3 hover:scale-105 transition-transform"
            style={{ clipPath: "polygon(3% 0%, 100% 5%, 97% 100%, 0% 92%)" }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[200px] backdrop-blur-xl border-l-2 border-white/10 pt-4">
          <div
            className="bg-black px-4 py-3 mb-6"
            style={{ clipPath: "polygon(0% 0%, 100% 4%, 98% 96%, 2% 100%)" }}
          >
            <SheetTitle className="text-4xl font-black text-white text-center uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Menu</SheetTitle>
          </div>
          <SheetDescription className="sr-only">Navigation options for your goals</SheetDescription>
          <nav className="flex flex-col gap-3 px-3">
            <button onClick={() => setMobileMenuOpen(false)} className="bg-black text-white py-3 px-4 font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform flex items-center gap-2" style={{ clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}><Target className="w-4 h-4" />My Goals</button>
            <button onClick={() => { setMobileMenuOpen(false); if (goals[0]) onSelectGoal(goals[0].id); }} className="bg-black text-white py-3 px-4 font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform flex items-center gap-2" style={{ clipPath: "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)" }}><Calendar className="w-4 h-4" />30 Day Plan</button>
            <button onClick={onLogout} className="bg-black text-red-400 py-3 px-4 font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform flex items-center gap-2 mt-4" style={{ clipPath: "polygon(3% 0%, 100% 4%, 97% 100%, 0% 96%)" }}><LogOut className="w-4 h-4" />Logout</button>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="fixed inset-0 z-0 w-full h-full"><Aurora colorStops={[...AURORA_COLORS]} /></div>
      <div className="relative z-10 w-full">
        {goals.length > 0 ? (
          <div className="animate-fadeIn">
            {goals.map(goal => (
              <MosaicCard key={goal.id} seed={goals.indexOf(goal)} className="backdrop-blur-sm min-h-screen pt-0 px-6 pb-6 md:px-10 md:pb-10 flex flex-col">
                <div className="text-center mb-6 md:mb-8 pt-4">
                  <div
                    className="inline-block bg-black px-6 py-2"
                    style={{ clipPath: "polygon(2% 0%, 98% 4%, 100% 96%, 0% 100%)" }}
                  >
                    <p className="text-xl text-white font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="max-w-2xl mx-auto flex-1 flex flex-col w-full">
                  <div className="mb-6 flex items-start justify-between">
                    <div className="flex-1">
                      <div
                        className="inline-flex items-center gap-2 mb-1 bg-black px-5 py-2"
                        style={{ clipPath: "polygon(1% 0%, 100% 3%, 98% 100%, 0% 96%)" }}
                      >
                        <CardTitle className="text-2xl text-white">{goal.title}</CardTitle>
                        {engagement && (engagement.currentStreak > 0 || engagement.isAtRisk) && (
                          <StreakBadge streak={engagement.currentStreak} isAtRisk={engagement.isAtRisk} size="sm" />
                        )}
                      </div>
                      <div
                        className="inline-block bg-black px-4 py-1.5 mt-1"
                        style={{ clipPath: "polygon(0% 0%, 97% 5%, 100% 95%, 3% 100%)" }}
                      >
                        <CardDescription className="text-white font-bold">Day {goalCurrentDays[goal.id] || 0} of 30</CardDescription>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteGoal(goal.id, goal.title); }}
                      aria-label="Delete goal"
                      className="bg-black text-white p-3 hover:scale-105 transition-transform flex-shrink-0"
                      style={{ clipPath: "polygon(0% 5%, 97% 0%, 100% 95%, 3% 100%)" }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Stats & Achievements */}
                  {engagement && (
                    <div className="space-y-4 mb-6">
                      <StatsCard engagement={engagement} />
                      <div className="flex justify-center">
                        <AchievementsSheet achievements={engagement.achievements} />
                      </div>
                    </div>
                  )}
                  <div className="mt-auto">
                    <button
                      onClick={onCreateGoal}
                      className="w-full bg-black py-10 md:py-12 text-6xl md:text-8xl font-black uppercase tracking-wide hover:scale-105 transition-transform flex items-center justify-center gap-3"
                      style={{ clipPath: "polygon(2% 0%, 100% 4%, 98% 100%, 0% 96%)", fontFamily: "var(--font-bebas), system-ui, sans-serif", letterSpacing: 6, fontWeight: 900 }}
                    >
                      <Plus className="w-8 h-8 text-white" />
                      {"ADD NEW GOAL".split("").map((char, i) => (
                        <span key={i} style={{ color: char === " " ? "transparent" : ["#FFE633","#FF6B2B","#FF2D55","#00EAFF","#FF10F0","#FF1493","#4FC3F7","#FF4500"][i % 8], width: char === " " ? "0.35em" : undefined, display: "inline-block" }}>{char}</span>
                      ))}
                    </button>
                  </div>
                </div>
              </MosaicCard>
            ))}
          </div>
        ) : (
          <MosaicCard seed={0} className="min-h-screen p-6 md:p-10 flex flex-col items-center justify-center">
            <div className="text-center mb-4 md:mb-8 space-y-3">
              <div
                className="inline-block bg-black px-8 py-3"
                style={{ clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}
              >
                <h1 className="text-3xl md:text-5xl font-bold text-white">Set Your First Goal</h1>
              </div>
              <div
                className="inline-block bg-black px-6 py-2"
                style={{ clipPath: "polygon(2% 0%, 98% 4%, 100% 96%, 0% 100%)" }}
              >
                <p className="text-xl text-white font-bold">Pick any goal and get a personalized 30-day plan</p>
              </div>
            </div>
            <BouncingButton onClick={onCreateGoal} />
          </MosaicCard>
        )}
      </div>
    </div>
  );
}
