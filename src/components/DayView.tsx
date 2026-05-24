"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Calendar, Youtube, ExternalLink, Zap } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { VoronoiMosaic } from "./VoronoiMosaic";
import { fireCelebration, getRoomView } from "./3d-shell/RoomRegistry";
import { previewDayXP, getDailyMultiplier, getDailyChallenge } from "@/lib/engagement";
import { SHARD_CLIPS, LABEL_CLIPS, BUTTON_CLIPS, getClip } from "@/constants";
import { useMonotone } from "./MonotoneContext";

const PANEL_DARK_PALETTE = ["#0a0a14", "#10122a", "#0f0e1f", "#181a3a", "#0c0d1e"] as const;
import { staggerContainer, tileEnter, contentReveal, popIn, SPRING } from "@/lib/animations";
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
    fireCelebration(getRoomView(), 1.0);
    onComplete({ dayNumber: day.number, completed: completedActivities, feedback });
  };

  const hasAnyActivity = Object.values(completedActivities).some(val => val === true);
  const hasFeedback = feedback.trim().length > 0;
  const canSubmit = hasAnyActivity || hasFeedback;
  const isToday = day.isToday || false;

  const checkedCount = Object.values(completedActivities).filter(Boolean).length;
  const xpPreview = useMemo(
    () => previewDayXP(checkedCount, hasFeedback, currentStreak, day.number),
    [checkedCount, hasFeedback, currentStreak, day.number]
  );
  const dailyMultiplier = useMemo(() => getDailyMultiplier(day.number), [day.number]);
  const dailyChallenge = useMemo(() => getDailyChallenge(day.number), [day.number]);

  return (
    <div className="min-h-screen relative pb-20 md:pb-0" role="main" aria-label="Day activities">
      {/* Background mosaic provided by AuthenticatedApp */}
      <div className="relative z-10 p-4 md:p-8 pt-[120px] md:pt-[120px]">
        {onBack && <BackButton onClick={onBack} />}

        {isCompleted && (
          <motion.div
            variants={contentReveal}
            initial="hidden"
            animate="visible"
            className="mb-4 md:mb-6 p-4 bg-lime-600 text-white clip-tile-a text-center border border-white/10"
          >
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg">Day Completed{savedProgress?.completedAt ? ` on ${new Date(savedProgress.completedAt).toLocaleDateString()}` : ''}</span>
            </div>
            <p className="text-sm text-lime-100 mt-1">Your activities and notes are saved below.</p>
          </motion.div>
        )}

        {/* Daily multiplier + challenge banner */}
        {!isCompleted && (
          <motion.div
            variants={contentReveal}
            initial="hidden"
            animate="visible"
            className="mb-4 flex flex-wrap items-center justify-center gap-3"
          >
            {dailyMultiplier > 1 && (
              <div className="relative overflow-hidden border-2 border-yellow-500/60 px-4 py-2 text-sm font-bold text-yellow-300 uppercase tracking-wider" style={{ clipPath: getClip(SHARD_CLIPS, 0) }}>
                <VoronoiMosaic seed={601} tileCount={10} margin={3} gap={1.5} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <span className="relative z-10">{dailyMultiplier}x XP Day</span>
              </div>
            )}
            <div className="relative overflow-hidden border border-white/20 px-4 py-2 text-sm font-medium text-white/70" style={{ clipPath: getClip(SHARD_CLIPS, 1) }}>
              <VoronoiMosaic seed={613} tileCount={14} margin={3} gap={1.5} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
              <span className="relative z-10">Challenge: {dailyChallenge.description} (+{dailyChallenge.bonusXP} XP)</span>
            </div>
          </motion.div>
        )}

        <motion.div
          variants={contentReveal}
          initial="hidden"
          animate="visible"
          className="text-center mb-4 md:mb-8"
        >
          <div
            className="relative overflow-hidden inline-block px-6 py-3"
            style={{ clipPath: getClip(LABEL_CLIPS, 1) }}
          >
            <VoronoiMosaic seed={701} tileCount={20} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center gap-2">
              <Calendar className="w-6 h-6 md:w-8 md:h-8 text-white" />
              <h1 className="text-2xl md:text-5xl font-black text-white uppercase tracking-wide" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>{isToday ? `Today · Day ${day.number}` : `Day ${day.number}`}</h1>
            </div>
            {day.dateDisplay && <p className="relative z-10 text-lg md:text-2xl text-white/70 font-bold mt-1">{day.dateDisplay}</p>}
          </div>
        </motion.div>

        {hasActivities ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className="mb-4 md:mb-6">
              <motion.div variants={contentReveal} className="relative overflow-hidden px-6 py-4 inline-block mb-4" style={{ clipPath: getClip(LABEL_CLIPS, 3) }}>
                <VoronoiMosaic seed={811} tileCount={18} margin={4} gap={2} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                <h2 className="relative z-10 text-4xl md:text-6xl font-black italic uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>
                  {"Your Activities".split("").map((char, i) => (
                    <span key={i} style={{ color: char === " " ? "transparent" : monotone ? "#ffffff" : ["#FFE633","#FF6B2B","#FF2D55","#00EAFF","#FF10F0","#FF1493","#4FC3F7","#FF4500"][i % 8], width: char === " " ? "0.3em" : undefined, display: "inline-block" }}>{char}</span>
                  ))}
                </h2>
              </motion.div>
              <div className="space-y-4">
                {activities.map((activity: string | Activity, index: number) => {
                    const activityText = typeof activity === 'string' ? activity : activity.text;
                    const resources = typeof activity === 'object' ? activity.resources : null;
                    return (
                      <motion.div
                        key={index}
                        variants={tileEnter}
                        className="space-y-2"
                      >
                        <div className={`relative overflow-hidden flex items-start gap-2 md:gap-4 p-3 md:p-5 transition-smooth ${completedActivities[index] ? 'ring-2 ring-[#FFE633]/40' : ''} ${isCompleted ? 'opacity-75' : ''}`} style={{ clipPath: getClip(SHARD_CLIPS, index) }}>
                          <VoronoiMosaic
                            seed={211 + index * 23}
                            tileCount={32}
                            margin={4}
                            gap={2}
                            palette={PANEL_DARK_PALETTE}
                            className="absolute inset-0 w-full h-full pointer-events-none"
                          />
                          <div className="relative z-10 mt-1 flex-shrink-0">
                            <Checkbox checked={completedActivities[index] || false} onCheckedChange={() => !isCompleted && toggleActivity(index)} id={`activity-${index}`} className="size-14 md:size-16 border-[3px] border-white rounded-none data-[state=checked]:border-white data-[state=checked]:bg-white" disabled={isCompleted} />
                            {completedActivities[index] && (
                              <motion.div variants={popIn} initial="hidden" animate="visible" exit="hidden" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg viewBox="0 0 24 24" className="w-10 h-10 md:w-12 md:h-12 text-black" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                  <motion.path d="M5 12l5 5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 }} />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                          <label htmlFor={`activity-${index}`} className="relative z-10 flex-1 min-w-0 cursor-pointer">
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
                          {completedActivities[index] && <CheckCircle2 className="relative z-10 w-6 h-6 text-lime-500 flex-shrink-0 animate-scaleIn" />}
                        </div>
                      </motion.div>
                    );
                  })}
                  {/* How did today go? — merged into activities card */}
                  <div className="mt-6">
                    <div className="relative overflow-hidden px-5 py-3 inline-block mb-3" style={{ clipPath: getClip(LABEL_CLIPS, 0) }}>
                      <VoronoiMosaic seed={907} tileCount={14} margin={3} gap={1.5} palette={PANEL_DARK_PALETTE} className="absolute inset-0 w-full h-full pointer-events-none" />
                      <h3 className="relative z-10 text-xl md:text-3xl font-black text-white uppercase tracking-wide">How did today go?</h3>
                    </div>
                    <div className="relative overflow-hidden p-3 md:p-5" style={{ clipPath: getClip(SHARD_CLIPS, 2) }}>
                      <VoronoiMosaic
                        seed={313}
                        tileCount={26}
                        margin={4}
                        gap={2}
                        palette={PANEL_DARK_PALETTE}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />
                      <Textarea id="day-feedback" aria-label="How did today go?" value={feedback} onChange={(e) => !isCompleted && setFeedback(e.target.value)} placeholder="Share your thoughts, challenges, or wins from today..." className="relative z-10 min-h-32 text-lg border-0 focus-visible:ring-0 bg-transparent text-white placeholder:text-white/40 resize-none" disabled={isCompleted} />
                    </div>
                    {!isCompleted && <p className="text-sm text-white/50 mt-2">Reflect on your progress — what went well and what you can improve.</p>}
                  </div>
                </div>
              </div>
          </motion.div>
        ) : (

          <motion.div
            variants={tileEnter}
            initial="hidden"
            animate="visible"
          >
            <div className="relative overflow-hidden mb-4 md:mb-6 p-8 text-center" style={{ clipPath: getClip(SHARD_CLIPS, 0) }}>
              <VoronoiMosaic
                seed={401}
                tileCount={24}
                margin={4}
                gap={2}
                palette={PANEL_DARK_PALETTE}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />
              <p className="relative z-10 text-white/60 text-lg">Activities for this day are not available yet.</p>
              <p className="relative z-10 text-white/40 text-sm mt-2">Check back later or contact support if this persists.</p>
            </div>
          </motion.div>
        )}

        {!isCompleted && (
          <motion.div
            variants={tileEnter}
            initial="hidden"
            animate="visible"
          >
            <div className="flex justify-center">
              <button onClick={handleSubmit} className="px-10 py-5 md:px-14 md:py-6 text-lg md:text-xl font-black text-black uppercase tracking-wide hover:scale-105 transition-transform" style={{ backgroundColor: monotone ? "#666" : "#fcd02a", clipPath: getClip(BUTTON_CLIPS, 0) }}>Complete Day</button>
            </div>
            {canSubmit && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING.gentle}
                className="flex items-center justify-center gap-2 mt-3 text-sm text-white/80 font-medium"
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>You&apos;ll earn ~<strong>{xpPreview.total} XP</strong>{dailyMultiplier > 1 && <span className="text-yellow-400 ml-1">({dailyMultiplier}x)</span>}</span>
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-transparent"
              onClick={() => setShowValidation(false)}
            >
              <motion.div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="day-validation-title"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={SPRING.snappy}
                className="relative overflow-hidden p-8 mx-4 max-w-sm text-center"
                style={{ clipPath: getClip(SHARD_CLIPS, 0) }}
                onClick={(e) => e.stopPropagation()}
              >
                <VoronoiMosaic
                  seed={509}
                  tileCount={22}
                  margin={4}
                  gap={2}
                  palette={PANEL_DARK_PALETTE}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />
                <p id="day-validation-title" className="relative z-10 text-xl text-white font-black uppercase tracking-wide mb-6">Check at least one activity or add a reflection to continue</p>
                <button
                  onClick={() => setShowValidation(false)}
                  className="relative z-10 px-8 py-3 font-black text-black uppercase tracking-wide hover:scale-105 transition-transform btn-shake"
                  style={{ backgroundColor: "#fcd02a", clipPath: getClip(BUTTON_CLIPS, 2) }}
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
