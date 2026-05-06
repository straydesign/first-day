"use client";
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader2, AlertCircle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, GOAL_TEMPLATES, type GoalTemplate } from '@/constants';
import { BRIGHT_COLORS, SHARD_CLIPS, SCROLL_SPEEDS, FIELD_COLORS, EXP_COLORS } from '@/tokens';
import { motion, AnimatePresence } from 'framer-motion';
import { useMonotone } from './MonotoneContext';
import type { GoalFormData } from '@/types';

interface SimpleGoalCreationProps {
  onComplete: (goalData: GoalFormData) => void;
  onCancel: () => void;
  initialData?: {
    goalId?: string;
    goal?: string;
    contextAnswers?: Record<string, string>;
    timeCommitment?: string;
    timeSlot?: string;
    wantsWeeklyBooks?: boolean;
    availableDays?: string[];
  } | null;
}

export function SimpleGoalCreation({ onComplete, onCancel, initialData }: SimpleGoalCreationProps) {
  const { monotone } = useMonotone();
  const [goal, setGoal] = useState(initialData?.goal || '');
  const [why, setWhy] = useState(initialData?.contextAnswers?.why || '');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>(
    (initialData?.contextAnswers?.experienceLevel as 'beginner' | 'intermediate' | 'advanced') || 'beginner'
  );
  const [priorExperience, setPriorExperience] = useState(initialData?.contextAnswers?.priorExperience || '');
  const [preferredTactics, setPreferredTactics] = useState(initialData?.contextAnswers?.preferredTactics || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptional, setShowOptional] = useState(
    !!(initialData?.contextAnswers?.priorExperience || initialData?.contextAnswers?.preferredTactics)
  );
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const handleSuggestionClick = (suggestion: string) => { setGoal(suggestion); setError(null); };

  const handleTemplateClick = (template: GoalTemplate) => {
    setGoal(template.goal);
    setWhy(template.why);
    setExperienceLevel(template.experienceLevel);
    setPriorExperience(template.priorExperience);
    setPreferredTactics(template.preferredTactics);
    setShowOptional(true);
    setError(null);
  };

  const handleGenerate = () => {
    if (!goal.trim()) { setShowValidation(true); return; }
    setIsGenerating(true);
    setError(null);
    onComplete({ goal: goal.trim(), why: why.trim(), experienceLevel, priorExperience: priorExperience.trim(), preferredTactics: preferredTactics.trim(), contextAnswers: { why: why.trim(), experienceLevel, priorExperience: priorExperience.trim(), preferredTactics: preferredTactics.trim() }, timestamp: Date.now() });
  };

  const renderScrollRow = (goals: string[], direction: 'left' | 'right', rowIndex: number) => (
    <div className="overflow-hidden select-none">
      <div
        className="flex whitespace-nowrap"
        style={{
          animation: `scroll-${direction} ${SCROLL_SPEEDS[rowIndex % SCROLL_SPEEDS.length]} linear infinite`,
        }}
      >
        {[...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals].map((suggestion, index) => (
          <button
            key={index}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isGenerating}
            className={`inline-block px-5 py-2 text-black text-sm font-bold mx-1.5 select-none hover:scale-105 transition-transform disabled:opacity-50 ${goal === suggestion ? 'ring-2 ring-white/60 scale-105' : ''}`}
            style={{
              backgroundColor: monotone ? "#333333" : BRIGHT_COLORS[(index * 7 + 3) % BRIGHT_COLORS.length],
              clipPath: index % 2 === 0 ? "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" : "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
            }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10">
      <div className="pt-[120px] pl-6">
        <BackButton onClick={onCancel} disabled={isGenerating} />
      </div>
      <div className="flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <div className="p-4 md:p-12">
            <div className="text-center mb-6 md:mb-10">
              <div className="inline-block bg-black px-8 py-3 mb-3" style={{ clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}>
                <h1 className="text-3xl md:text-6xl font-bold text-white">Let&apos;s Create Your Goal</h1>
              </div>
              <div className="inline-block bg-black px-6 py-2" style={{ clipPath: "polygon(2% 0%, 98% 4%, 100% 96%, 0% 100%)" }}>
                <p className="text-lg md:text-2xl text-white font-bold">Tell us what you want to achieve</p>
              </div>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-50 border border-red-200 p-4 flex items-start gap-3" style={{ clipPath: SHARD_CLIPS[0] }}>
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mb-0">
              <div
                className="overflow-hidden"
                style={{ backgroundColor: monotone ? "#333333" : FIELD_COLORS[0], clipPath: SHARD_CLIPS[0] }}
              >
                <label htmlFor="goal-input" className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">What&apos;s your goal?</label>
                <div className="mx-4 border-t border-black/10" />
                <Textarea id="goal-input" value={goal} onChange={(e) => { setGoal(e.target.value); setError(null); }} placeholder="Type your goal here..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none resize-none min-h-[80px] md:min-h-[120px]" disabled={isGenerating} autoFocus rows={3} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-12 pb-2 md:pb-6">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <div className="h-px flex-1 bg-white/15" />
            <p className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-black text-white/60">Or start from a template</p>
            <div className="h-px flex-1 bg-white/15" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
            {GOAL_TEMPLATES.map((template, i) => {
              const isActive = goal === template.goal;
              return (
                <button
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  disabled={isGenerating}
                  className={`text-left p-3 md:p-4 transition-all hover:scale-[1.03] disabled:opacity-50 ${isActive ? 'ring-2 ring-white/60 scale-[1.03]' : ''}`}
                  style={{
                    backgroundColor: monotone ? "#222222" : BRIGHT_COLORS[(i * 3 + 1) % BRIGHT_COLORS.length],
                    clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
                  }}
                  aria-label={`Use ${template.title} template`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl md:text-2xl" aria-hidden>{template.icon}</span>
                    <span className="text-sm md:text-base font-black text-black uppercase tracking-wide truncate">{template.title}</span>
                  </div>
                  <p className="text-xs md:text-sm text-black/70 font-medium leading-snug line-clamp-2">{template.goal}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div className="w-full space-y-1 mb-4 md:mb-8 py-3 md:py-6">
        {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, 'left', 0)}
        {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, 'right', 1)}
        {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, 'left', 2)}
      </div>
      <div className="flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <div className="p-4 md:p-12">
            <div className="mb-4 md:mb-8">
              <div
                className="overflow-hidden"
                style={{ backgroundColor: monotone ? "#333333" : FIELD_COLORS[1], clipPath: SHARD_CLIPS[1] }}
              >
                <label htmlFor="why-input" className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">Why do you want to achieve this?</label>
                <div className="mx-4 border-t border-black/10" />
                <Textarea id="why-input" value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Tell us what motivates you..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none resize-none min-h-[80px] md:min-h-[120px]" disabled={isGenerating} rows={3} />
              </div>
            </div>
            <div className="mb-4 md:mb-8">
              <label id="experience-level-label" className="block text-sm font-semibold text-white/80 mb-2 md:mb-3">What&apos;s your experience level?</label>
              <div className="flex flex-col gap-3" role="radiogroup" aria-labelledby="experience-level-label">
                {[{ value: 'beginner' as const, label: 'Beginner', desc: 'Just starting', color: monotone ? "#555555" : EXP_COLORS[0] }, { value: 'intermediate' as const, label: 'Intermediate', desc: 'Some experience', color: monotone ? "#555555" : EXP_COLORS[1] }, { value: 'advanced' as const, label: 'Advanced', desc: 'Experienced', color: monotone ? "#555555" : EXP_COLORS[2] }].map((level, index) => (
                  <button
                    key={level.value}
                    onClick={() => setExperienceLevel(level.value)}
                    disabled={isGenerating}
                    role="radio"
                    aria-checked={experienceLevel === level.value}
                    className={`p-4 transition-all text-left text-black font-bold flex items-center gap-4 ${experienceLevel === level.value ? 'ring-2 ring-white/40 scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: level.color, clipPath: SHARD_CLIPS[index % SHARD_CLIPS.length] }}
                  >
                    <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center border-2 border-black/40 transition-all ${experienceLevel === level.value ? 'bg-black' : 'bg-transparent'}`}>
                      {experienceLevel === level.value && <Check className="w-5 h-5 text-white" strokeWidth={3} />}
                    </div>
                    <div>
                      <div className="font-bold text-black">{level.label}</div>
                      <div className="text-sm text-black/70">{level.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 md:mb-8">
              <button type="button" onClick={() => setShowOptional(!showOptional)} className="flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors" disabled={isGenerating} aria-expanded={showOptional}>
                {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Tell us more (optional)
              </button>
              {showOptional && (
                <div className="mt-4 space-y-4 md:space-y-6">
                  <div
                    className="overflow-hidden"
                    style={{ backgroundColor: monotone ? "#333333" : FIELD_COLORS[2], clipPath: SHARD_CLIPS[2] }}
                  >
                    <label htmlFor="prior-experience-input" className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">What have you tried before?</label>
                    <div className="mx-4 border-t border-black/10" />
                    <Input id="prior-experience-input" type="text" value={priorExperience} onChange={(e) => setPriorExperience(e.target.value)} placeholder="e.g., Took an online course, read a book..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none" disabled={isGenerating} />
                  </div>
                  <div
                    className="overflow-hidden"
                    style={{ backgroundColor: monotone ? "#333333" : FIELD_COLORS[3], clipPath: SHARD_CLIPS[3] }}
                  >
                    <label htmlFor="preferred-tactics-input" className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">How do you like to learn?</label>
                    <div className="mx-4 border-t border-black/10" />
                    <Input id="preferred-tactics-input" type="text" value={preferredTactics} onChange={(e) => setPreferredTactics(e.target.value)} placeholder="e.g., Videos, hands-on practice, reading..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none" disabled={isGenerating} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              {/* Generate My Plan — shard-bordered button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full relative hover:scale-105 transition-transform disabled:hover:scale-100 disabled:opacity-50 group"
              >
                {/* Shard bar border — top */}
                <div className="flex gap-[2px] h-2 w-full mb-0">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={`t${i}`} className="flex-1" style={{ backgroundColor: monotone ? "#555" : BRIGHT_COLORS[i % BRIGHT_COLORS.length], clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length] }} />
                  ))}
                </div>
                {/* Main button body */}
                <div className="bg-black py-6 md:py-8 flex items-center justify-center gap-3 overflow-hidden">
                  {isGenerating ? (
                    <><Loader2 className="w-8 h-8 animate-spin text-white" /><span className="text-4xl md:text-5xl font-black uppercase tracking-wide text-white" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>Generating...</span></>
                  ) : (
                    <span className="flex items-center" style={{ fontFamily: "var(--font-bebas), system-ui, sans-serif" }}>
                      {"GENERATE MY PLAN".split("").map((char, i) => (
                        <span key={i} className="text-5xl md:text-6xl font-black uppercase tracking-wide" style={{ color: char === " " ? "transparent" : monotone ? "#ffffff" : BRIGHT_COLORS[i % BRIGHT_COLORS.length], width: char === " " ? "0.3em" : undefined, display: "inline-block", animation: char === " " ? "none" : `letterWave 2s ease-in-out ${i * 0.12}s infinite` }}>{char}</span>
                      ))}
                    </span>
                  )}
                </div>
                {/* Shard bar border — bottom */}
                <div className="flex gap-[2px] h-2 w-full mt-0">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={`b${i}`} className="flex-1" style={{ backgroundColor: monotone ? "#555" : BRIGHT_COLORS[(i + 5) % BRIGHT_COLORS.length], clipPath: SHARD_CLIPS[(i + 2) % SHARD_CLIPS.length] }} />
                  ))}
                </div>
              </button>
              <button
                onClick={onCancel}
                disabled={isGenerating}
                className="self-center inline-flex items-center px-3 py-2 text-sm font-bold text-white/50 hover:text-white/90 uppercase tracking-wide transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-white/50">AI will create a personalized 30-day plan just for you</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
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
              aria-labelledby="validation-title"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="bg-black p-8 mx-4 max-w-sm text-center"
              style={{ clipPath: "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <p id="validation-title" className="text-xl text-white font-black uppercase tracking-wide mb-2">Hold up!</p>
              <p className="text-base text-white/80 font-medium mb-6">Just fill in your goal above and we&apos;ll build your plan</p>
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
  );
}
