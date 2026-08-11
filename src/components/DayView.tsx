"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Calendar, Youtube, ExternalLink, Zap, Check } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { TopBar } from "@/components/ui/TopBar";
import { fireCelebration, getRoomView } from "./3d-shell/RoomRegistry";
import { previewDayXP, getDailyMultiplier, getDailyChallenge } from "@/lib/engagement";
import { GuitarTab } from "./GuitarTab";
import { FONT } from "@/lib/design";
import { COPY } from "@/content/copy";
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
    setCompletedActivities(prev => ({ ...prev, [index]: !prev[index] }));
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
      <TopBar
        title={isToday ? COPY.day.todayTitle(day.number) : COPY.day.dayTitle(day.number)}
        onBack={onBack}
        right={
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-white/50" />
            {day.dateDisplay && (
              <span className="text-[13px] text-white/50 font-medium">{day.dateDisplay}</span>
            )}
          </div>
        }
      />

      <div className="relative z-10 p-4 md:p-8 pt-6 md:pt-8">
        {isCompleted && (
          <motion.div
            variants={contentReveal}
            initial="hidden"
            animate="visible"
            className="mb-4 md:mb-6"
          >
            <Panel contentClassName="p-4">
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-emerald-300/80" />
                <span className="text-[15px] font-semibold text-white">
                  {COPY.day.completedBadge}{savedProgress?.completedAt ? ` · ${new Date(savedProgress.completedAt).toLocaleDateString()}` : ''}
                </span>
              </div>
              <p className="text-[13px] text-white/55 text-center mt-1">{COPY.day.completedNote}</p>
            </Panel>
          </motion.div>
        )}

        {/* Daily multiplier + challenge chips */}
        {!isCompleted && (
          <motion.div
            variants={contentReveal}
            initial="hidden"
            animate="visible"
            className="mb-4 flex flex-wrap items-center gap-3"
          >
            {dailyMultiplier > 1 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[12px] font-medium uppercase tracking-[0.08em] text-white/40">
                {COPY.day.multiplierChip(dailyMultiplier)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[12px] font-medium text-white/55">
              {COPY.day.challengePrefix} {dailyChallenge.description} <span className="text-white/40">{COPY.day.challengeBonus(dailyChallenge.bonusXP)}</span>
            </span>
          </motion.div>
        )}

        {hasActivities ? (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <div className="mb-4 md:mb-6">
              <motion.div variants={contentReveal}>
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40 mb-3">{COPY.day.activitiesLabel}</p>
              </motion.div>

              {/* All activities as checklist items inside one Panel */}
              <Panel contentClassName="p-5">
                <div className="space-y-4">
                  {activities.map((activity: string | Activity, index: number) => {
                    const activityText = typeof activity === 'string' ? activity : activity.text;
                    const resources = typeof activity === 'object' ? activity.resources : null;
                    const riff = typeof activity === 'object' ? activity.riff : null;
                    return (
                      <motion.div
                        key={index}
                        variants={tileEnter}
                        className={`space-y-2 ${isCompleted ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Circle-outline checkbox, Apple-style */}
                          <div className="relative mt-0.5 flex-shrink-0">
                            {!completedActivities[index] && !isCompleted && (
                              <motion.div
                                aria-hidden
                                className="absolute inset-0 rounded-full bg-white/10"
                                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                              />
                            )}
                            <Checkbox
                              checked={completedActivities[index] || false}
                              onCheckedChange={() => !isCompleted && toggleActivity(index)}
                              id={`activity-${index}`}
                              className="relative h-[18px] w-[18px] rounded-full border border-white/25 bg-transparent data-[state=checked]:bg-white data-[state=checked]:border-white"
                              disabled={isCompleted}
                            />
                            {completedActivities[index] && (
                              <motion.div variants={popIn} initial="hidden" animate="visible" exit="hidden" className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <svg viewBox="0 0 24 24" className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <motion.path d="M5 12l5 5L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 }} />
                                </svg>
                              </motion.div>
                            )}
                          </div>
                          <label htmlFor={`activity-${index}`} className="flex-1 min-w-0 cursor-pointer">
                            <span className="text-[15px] leading-snug text-white/75 select-text">{activityText}</span>
                            {resources && resources.length > 0 && (
                              <div className="mt-2 space-y-1.5">
                                {resources.map((resource: ActivityResource, rIndex: number) => (
                                  <div key={rIndex} onClick={(e) => e.preventDefault()}>
                                    {resource.type === 'youtube' && (
                                      <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.query ?? '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[12px] text-white/70 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <Youtube className="w-3 h-3" />{COPY.day.youtubePrefix} {resource.query}
                                      </a>
                                    )}
                                    {resource.type === 'link' && (
                                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 text-[12px] text-white/70 hover:text-white transition-colors" onClick={(e) => e.stopPropagation()}>
                                        <ExternalLink className="w-3 h-3" />{resource.title || resource.url}
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            {riff && (
                              <div onClick={(e) => e.preventDefault()}>
                                <GuitarTab riff={riff} />
                              </div>
                            )}
                          </label>
                          {completedActivities[index] && <CheckCircle2 className="w-4 h-4 text-emerald-300/80 flex-shrink-0 animate-scaleIn mt-0.5" />}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </Panel>

              {/* How did today go? */}
              <div className="mt-4">
                <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-white/40 mb-3">{COPY.day.feedbackLabel}</p>
                <Panel contentClassName="p-4">
                  <Textarea
                    id="day-feedback"
                    aria-label="How did today go?"
                    value={feedback}
                    onChange={(e) => !isCompleted && setFeedback(e.target.value)}
                    placeholder={COPY.day.feedbackPlaceholder}
                    className="min-h-32 text-[15px] border-0 focus-visible:ring-0 bg-transparent text-white/75 placeholder:text-white/30 resize-none leading-relaxed"
                    disabled={isCompleted}
                  />
                </Panel>
                {!isCompleted && (
                  <p className="text-[12px] text-white/40 mt-2 px-1">{COPY.day.feedbackHelper}</p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            variants={tileEnter}
            initial="hidden"
            animate="visible"
          >
            <Panel contentClassName="p-8 text-center">
              <p className="text-white/60 text-[15px]">{COPY.day.emptyTitle}</p>
              <p className="text-white/40 text-[13px] mt-2">{COPY.day.emptyHelper}</p>
            </Panel>
          </motion.div>
        )}

        {!isCompleted && (
          <motion.div
            variants={tileEnter}
            initial="hidden"
            animate="visible"
          >
            <div className="flex justify-center mt-6">
              <button
                onClick={handleSubmit}
                className="rounded-full bg-white text-black text-[15px] font-semibold py-3 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                style={{ fontFamily: FONT }}
              >
                {COPY.day.completeButton}
              </button>
            </div>
            {canSubmit && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING.gentle}
                className="flex items-center justify-center gap-2 mt-3 text-[13px] text-white/55 font-medium"
              >
                <Zap className="w-3.5 h-3.5 text-white/40" />
                <span>{COPY.day.xpPreviewPrefix}<strong className="text-white/70">{xpPreview.total} {COPY.day.xpPreviewSuffix}</strong>{dailyMultiplier > 1 && <span className="text-white/40 ml-1">{COPY.day.xpMultiplierNote(dailyMultiplier)}</span>}</span>
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
                className="mx-4 max-w-sm w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Panel contentClassName="p-8 text-center">
                  <p id="day-validation-title" className="text-[17px] font-semibold text-white mb-6 leading-snug">
                    {COPY.day.validationTitle}
                  </p>
                  <button
                    onClick={() => setShowValidation(false)}
                    className="rounded-full bg-white text-black text-[15px] font-semibold py-3 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99] btn-shake"
                    autoFocus
                  >
                    {COPY.day.validationButton}
                  </button>
                </Panel>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
