"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Calendar, Youtube, ExternalLink, Zap } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { previewDayXP } from "@/lib/engagement";
import { HERO_PALETTE } from "@/constants";
import { useMonotone } from "./MonotoneContext";
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
  const { monotone } = useMonotone();
  const [completedActivities, setCompletedActivities] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState("");
  const [showValidation, setShowValidation] = useState(false);
  const [btnColorIdx, setBtnColorIdx] = useState(0);
  const btnColors = useMemo(() => HERO_PALETTE.filter((_, i) => i > 2 && i !== 28), []);

  useEffect(() => {
    const interval = setInterval(() => setBtnColorIdx(prev => (prev + 1) % btnColors.length), 800);
    return () => clearInterval(interval);
  }, [btnColors.length]);

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
    if (!canSubmit) { setShowValidation(true); return; }
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
      {/* Background mosaic provided by AuthenticatedApp */}
      <div className="relative z-10 p-4 md:p-8 pt-[120px] md:pt-[120px]">
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
          <div
            className="inline-block bg-black px-6 py-3"
            style={{ clipPath: "polygon(2% 0%, 98% 3%, 100% 97%, 0% 100%)" }}
          >
            <div className="flex items-center justify-center gap-2">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <h1 className="text-2xl md:text-5xl font-black text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>{isToday ? `Today · Day ${day.number}` : `Day ${day.number}`}</h1>
            </div>
            {day.dateDisplay && <p className="text-lg md:text-2xl text-white/70 font-bold mt-1">{day.dateDisplay}</p>}
          </div>
        </motion.div>

        {hasActivities ? (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          >
            <div className="mb-4 md:mb-6">
              <div className="bg-black px-6 py-4 inline-block mb-4" style={{ clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>
                  {"Your Activities".split("").map((char, i) => (
                    <span key={i} style={{ color: char === " " ? "transparent" : monotone ? "#ffffff" : ["#FFE633","#FF6B2B","#FF2D55","#00EAFF","#FF10F0","#FF1493","#4FC3F7","#FF4500"][i % 8], width: char === " " ? "0.3em" : undefined, display: "inline-block" }}>{char}</span>
                  ))}
                </h2>
              </div>
              <div className="space-y-4">
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
                        <div className={`flex items-start gap-2 md:gap-4 p-3 md:p-5 bg-black transition-smooth ${completedActivities[index] ? 'ring-2 ring-[#FFE633]/40' : ''} ${isCompleted ? 'opacity-75' : ''}`} style={{ clipPath: ["polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)", "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)", "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)"][index % 3] }}>
                          <div className="mt-1 flex-shrink-0 relative">
                            <Checkbox checked={completedActivities[index] || false} onCheckedChange={() => !isCompleted && toggleActivity(index)} id={`activity-${index}`} className="size-14 md:size-16 border-[3px] border-white rounded-none data-[state=checked]:border-white data-[state=checked]:bg-white" disabled={isCompleted} />
                            {completedActivities[index] && (
                              <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: "spring", stiffness: 500, damping: 20 }} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 text-black" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <motion.path d="M5 12l5 5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 }} />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                          <label htmlFor={`activity-${index}`} className="flex-1 min-w-0 cursor-pointer">
                            <div className="text-base md:text-lg leading-relaxed select-text text-white font-bold">{activityText}</div>
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
                  {/* How did today go? — merged into activities card */}
                  <div className="mt-6">
                    <div className="bg-black px-5 py-3 inline-block mb-3" style={{ clipPath: "polygon(0% 0%, 98% 4%, 100% 96%, 2% 100%)" }}>
                      <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-wide">How did today go?</h3>
                    </div>
                    <div className="bg-black p-3 md:p-5" style={{ clipPath: "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)" }}>
                      <Textarea id="day-feedback" aria-label="How did today go?" value={feedback} onChange={(e) => !isCompleted && setFeedback(e.target.value)} placeholder="Share your thoughts, challenges, or wins from today..." className="min-h-32 text-lg border-0 focus-visible:ring-0 bg-transparent text-white placeholder:text-white/40 resize-none" disabled={isCompleted} />
                    </div>
                    {!isCompleted && <p className="text-sm text-white/50 mt-2">Reflect on your progress — what went well and what you can improve.</p>}
                  </div>
                </div>
              </div>
          </motion.div>
        ) : (

          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          >
            <div className="mb-4 md:mb-6 bg-black p-8 text-center" style={{ clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}>
              <p className="text-white/60 text-lg">Activities for this day are not available yet.</p>
              <p className="text-white/40 text-sm mt-2">Check back later or contact support if this persists.</p>
            </div>
          </motion.div>
        )}

        {!isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.4, delay: 0.45 + (hasActivities ? activities.length * 0.1 : 0), ease: "easeOut" }}
          >
            <div className="flex justify-center">
              <button onClick={handleSubmit} className="px-10 py-5 md:px-14 md:py-6 text-lg md:text-xl font-black text-white uppercase tracking-wide hover:scale-105 transition-all duration-500" style={{ backgroundColor: btnColors[btnColorIdx], clipPath: "polygon(2% 0%, 100% 4%, 98% 100%, 0% 96%)" }}>Complete Day</button>
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
          </motion.div>
        )}

        {/* Validation modal */}
        <AnimatePresence>
          {showValidation && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
              onClick={() => setShowValidation(false)}
            >
              <motion.div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="day-validation-title"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-black p-8 mx-4 max-w-sm text-center"
                style={{ clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <p id="day-validation-title" className="text-xl text-white font-black uppercase tracking-wide mb-6">Check at least one activity or add a reflection to continue</p>
                <button
                  onClick={() => setShowValidation(false)}
                  className="px-8 py-3 font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
                  style={{ backgroundColor: "#fcd02a", clipPath: "polygon(1% 0%, 100% 4%, 99% 96%, 0% 100%)" }}
                  autoFocus
                >
                  Got It
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
