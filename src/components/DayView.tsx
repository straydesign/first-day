"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { MosaicCard } from "./MosaicCard";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Calendar, Youtube, ExternalLink, Zap } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { ShardButton } from "./ShardButton";
import { previewDayXP } from "@/lib/engagement";
import Aurora from "./Aurora";
import { AURORA_COLORS } from "@/constants";
import type { SelectedDay, DayProgress, Activity, ActivityResource } from "@/types";

interface DayViewProps {
  day: SelectedDay;
  onComplete: (data: { dayNumber: number; completed: Record<number, boolean>; feedback: string }) => void;
  isCompleted?: boolean;
  savedProgress?: DayProgress | null;
  onBack?: () => void;
  currentStreak?: number;
}

export function DayView({ day, onComplete, isCompleted = false, savedProgress = null, onBack, currentStreak = 0 }: DayViewProps) {
  const [completedActivities, setCompletedActivities] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (savedProgress) {
      if (savedProgress.completed) setCompletedActivities(savedProgress.completed as Record<number, boolean>);
      if (savedProgress.feedback) setFeedback(savedProgress.feedback);
    }
  }, [savedProgress]);

  const activities = day.activities;
  const hasActivities = activities && activities.length > 0;

  const toggleActivity = (index: number) => {
    setCompletedActivities({ ...completedActivities, [index]: !completedActivities[index] });
  };

  const handleSubmit = () => {
    onComplete({ dayNumber: day.number, completed: completedActivities, feedback });
  };

  const hasAnyActivity = Object.values(completedActivities).some(val => val === true);
  const hasFeedback = feedback.trim().length > 0;
  const canSubmit = hasAnyActivity || hasFeedback;
  const isToday = day.isToday || false;

  const checkedCount = Object.values(completedActivities).filter(Boolean).length;
  const xpPreview = useMemo(
    () => previewDayXP(checkedCount, hasFeedback, currentStreak),
    [checkedCount, hasFeedback, currentStreak]
  );

  return (
    <div className="min-h-screen relative bg-black">
      <div className="fixed inset-0 z-0 w-full h-full">
        <Aurora colorStops={[...AURORA_COLORS]} />
      </div>
      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 pt-4 md:pt-8">
        {onBack && <BackButton onClick={onBack} />}

        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-4 md:mb-6 p-4 bg-lime-600 text-white clip-tile-a text-center border border-white/10"
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg">Day Completed{savedProgress?.completedAt ? ` on ${new Date(savedProgress.completedAt).toLocaleDateString()}` : ''}</span>
            </div>
            <p className="text-sm text-lime-100 mt-1">Your activities and notes are saved below.</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
          className="text-center mb-4 md:mb-8"
        >
          <div className="inline-flex items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">{isToday ? `Today (Day ${day.number})` : `Day ${day.number}`}</h1>
            {day.dateDisplay && <span className="text-xl text-white/80 font-bold ml-2">&bull; {day.dateDisplay}</span>}
          </div>
        </motion.div>

        {hasActivities ? (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          >
            <div className="mb-4 md:mb-6">
              <MosaicCard seed={1} className="backdrop-blur-md">
                <CardHeader><CardTitle className="text-2xl text-white">Your Activities</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {activities.map((activity: string | Activity, index: number) => {
                    const activityText = typeof activity === 'string' ? activity : activity.text;
                    const resources = typeof activity === 'object' ? activity.resources : null;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ duration: 0.4, delay: 0.25 + index * 0.1, ease: "easeOut" }}
                        className="space-y-2"
                      >
                        <div className={`flex items-start gap-2 md:gap-4 p-2 md:p-4 clip-tile-c border-2 transition-smooth ${completedActivities[index] ? 'border-[#FFE633] bg-[#FFE633]/10' : 'border-white/20 hover:border-white/40'} ${isCompleted ? 'opacity-75' : ''}`}>
                          <Checkbox checked={completedActivities[index] || false} onCheckedChange={() => !isCompleted && toggleActivity(index)} id={`activity-${index}`} className="mt-1 flex-shrink-0 size-6 border-2 border-white/40 data-[state=checked]:border-lime-500 data-[state=checked]:bg-lime-500" disabled={isCompleted} />
                          <label htmlFor={`activity-${index}`} className="flex-1 min-w-0 cursor-pointer">
                            <div className="text-base md:text-lg leading-relaxed select-text text-white/90">{activityText}</div>
                            {resources && resources.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {resources.map((resource: ActivityResource, rIndex: number) => (
                                  <div key={rIndex} onClick={(e) => e.preventDefault()}>
                                    {resource.type === 'youtube' && (
                                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.query ?? '')}`} target="_blank" rel="noopener noreferrer" className={`clip-badge-b inline-flex items-center gap-2 text-sm hover:underline ${completedActivities[index] ? 'text-lime-400 hover:text-lime-300' : 'text-white/80 hover:text-white font-medium'}`} onClick={(e) => e.stopPropagation()}>
                                        <Youtube className="w-4 h-4" />Search YouTube: {resource.query}
                                      </a>
                                    )}
                                    {resource.type === 'link' && (
                                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`clip-badge-b inline-flex items-center gap-2 text-sm hover:underline ${completedActivities[index] ? 'text-lime-400 hover:text-lime-300' : 'text-white/80 hover:text-white font-medium'}`} onClick={(e) => e.stopPropagation()}>
                                        <ExternalLink className="w-4 h-4" />{resource.title || resource.url}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </label>
                          {completedActivities[index] && <CheckCircle2 className="w-6 h-6 text-lime-500 flex-shrink-0 animate-scaleIn" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </MosaicCard>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          >
            <div className="mb-4 md:mb-6">
              <MosaicCard seed={2} className="backdrop-blur-md">
                <CardContent className="py-8 text-center">
                  <p className="text-white/60 text-lg">Activities for this day are not available yet.</p>
                  <p className="text-white/40 text-sm mt-2">Check back later or contact support if this persists.</p>
                </CardContent>
              </MosaicCard>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.4, delay: 0.35 + (hasActivities ? activities.length * 0.1 : 0), ease: "easeOut" }}
        >
          <div className="mb-4 md:mb-6">
            <MosaicCard seed={3} className="backdrop-blur-md">
              <CardHeader><CardTitle className="text-2xl text-white">How did today go?</CardTitle></CardHeader>
              <CardContent>
                <Textarea value={feedback} onChange={(e) => !isCompleted && setFeedback(e.target.value)} placeholder="Share your thoughts, challenges, or wins from today..." className="min-h-32 text-lg border-white/20 focus:border-white/40 bg-white/5 text-white placeholder:text-white/40" disabled={isCompleted} />
                {!isCompleted && <p className="text-sm text-white/50 mt-2">Reflect on your progress -- what went well and what you can improve.</p>}
              </CardContent>
            </MosaicCard>
          </div>
        </motion.div>

        {!isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: 0.45 + (hasActivities ? activities.length * 0.1 : 0), ease: "easeOut" }}
          >
            <div className="flex justify-center">
              <ShardButton seed={4} onClick={handleSubmit} disabled={!canSubmit} size="lg" className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg disabled:opacity-50 transition-smooth hover:scale-105 disabled:hover:scale-100">Complete Day</ShardButton>
            </div>
            {canSubmit && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center gap-2 mt-3 text-sm text-white/80 font-medium"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>You&apos;ll earn ~<strong>{xpPreview.total} XP</strong></span>
              </motion.div>
            )}
            {!canSubmit && <p className="text-center text-sm text-white/60 font-medium mt-4">Check at least one activity or add a reflection to continue</p>}
          </motion.div>
        )}
      </div>
    </div>
  );
}
