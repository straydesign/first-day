"use client";
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, GOAL_TEMPLATES, type GoalTemplate } from '@/constants';
import { SCROLL_SPEEDS } from '@/tokens';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/components/ui/Panel';
import { FONT } from '@/lib/design';
import { fireCelebration, getRoomView } from './3d-shell/RoomRegistry';
import type { GoalFormData } from '@/types';


interface SimpleGoalCreationProps {
  onComplete: (goalData: GoalFormData) => void | Promise<void>;
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

  const handleGenerate = async () => {
    if (!goal.trim()) { setShowValidation(true); return; }
    setIsGenerating(true);
    setError(null);
    fireCelebration(getRoomView(), 1.2);
    try {
      await onComplete({ goal: goal.trim(), why: why.trim(), experienceLevel, priorExperience: priorExperience.trim(), preferredTactics: preferredTactics.trim(), contextAnswers: { why: why.trim(), experienceLevel, priorExperience: priorExperience.trim(), preferredTactics: preferredTactics.trim() }, timestamp: Date.now() });
    } finally {
      setIsGenerating(false);
    }
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
            className={`inline-block rounded-full px-4 py-1.5 text-[13px] font-medium mx-1.5 select-none hover:scale-105 transition-transform disabled:opacity-50 border ${
              goal === suggestion
                ? 'bg-white text-black border-white/0 scale-105'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
            }`}
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
              {/* Header — sleek Apple type, no Bebas, no clip-path shards */}
              <div className="text-center mb-6 md:mb-10">
                <h1
                  className="text-[32px] md:text-[40px] font-semibold tracking-[-0.02em] text-white leading-[1.05] mb-2"
                  style={{ fontFamily: FONT }}
                >
                  Let&apos;s Create Your Goal
                </h1>
                <p className="text-[16px] leading-relaxed text-white/55">
                  Tell us what you want to achieve
                </p>
              </div>

              {/* Error banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6"
                  >
                    <Panel contentClassName="p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-white/60 shrink-0 mt-0.5" />
                      <p className="text-[14px] font-medium text-white/80">{error}</p>
                    </Panel>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Goal input — dark glass */}
              <div className="mb-0">
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
                  <label htmlFor="goal-input" className="block px-5 pt-3 pb-1 text-white/40 text-[11px] font-medium uppercase tracking-[0.08em]">
                    What&apos;s your goal?
                  </label>
                  <div className="mx-5 border-t border-white/5" />
                  <Textarea
                    id="goal-input"
                    value={goal}
                    onChange={(e) => { setGoal(e.target.value); setError(null); }}
                    placeholder="Type your goal here..."
                    className="px-5 py-3 bg-transparent border-0 text-white placeholder:text-white/35 text-[17px] focus-visible:ring-0 rounded-none resize-none min-h-[80px] md:min-h-[120px]"
                    disabled={isGenerating}
                    autoFocus
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Template grid */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto px-4 md:px-12 pb-2 md:pb-6">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-white/40">Or start from a template</p>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {GOAL_TEMPLATES.map((template) => {
                const isActive = goal === template.goal;
                return (
                  <Panel
                    key={template.id}
                    className={`cursor-pointer transition-all hover:scale-[1.02] disabled:opacity-50 ${isActive ? 'ring-1 ring-white/30 scale-[1.02]' : ''}`}
                    contentClassName="p-3 md:p-4"
                    solid={isActive}
                  >
                    <button
                      onClick={() => handleTemplateClick(template)}
                      disabled={isGenerating}
                      className="w-full h-full text-left"
                      aria-label={`Use ${template.title} template`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl md:text-2xl" aria-hidden>{template.icon}</span>
                        <span
                          className={`text-[13px] md:text-[14px] font-semibold tracking-[-0.01em] truncate ${isActive ? 'text-black' : 'text-white'}`}
                          style={{ fontFamily: FONT }}
                        >
                          {template.title}
                        </span>
                      </div>
                      <p className={`text-[12px] md:text-[13px] leading-snug line-clamp-2 ${isActive ? 'text-black/60' : 'text-white/50'}`}>
                        {template.goal}
                      </p>
                    </button>
                  </Panel>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll suggestion rows */}
        <div className="w-full space-y-1 mb-4 md:mb-8 py-3 md:py-6">
          {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, 'left', 0)}
          {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, 'right', 1)}
          {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, 'left', 2)}
        </div>

        {/* Context fields + CTA */}
        <div className="flex items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
            <div className="p-4 md:p-12">

              {/* Why input — dark glass */}
              <div className="mb-4 md:mb-8">
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
                  <label htmlFor="why-input" className="block px-5 pt-3 pb-1 text-white/40 text-[11px] font-medium uppercase tracking-[0.08em]">
                    Why do you want to achieve this?
                  </label>
                  <div className="mx-5 border-t border-white/5" />
                  <Textarea
                    id="why-input"
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="Tell us what motivates you..."
                    className="px-5 py-3 bg-transparent border-0 text-white placeholder:text-white/35 text-[17px] focus-visible:ring-0 rounded-none resize-none min-h-[80px] md:min-h-[120px]"
                    disabled={isGenerating}
                    rows={3}
                  />
                </div>
              </div>

              {/* Experience level */}
              <div className="mb-4 md:mb-8">
                <label id="experience-level-label" className="block text-[14px] font-medium text-white/55 mb-2 md:mb-3">
                  What&apos;s your experience level?
                </label>
                <div className="flex flex-col gap-2" role="radiogroup" aria-labelledby="experience-level-label">
                  {([
                    { value: 'beginner' as const, label: 'Beginner', desc: 'Just starting' },
                    { value: 'intermediate' as const, label: 'Intermediate', desc: 'Some experience' },
                    { value: 'advanced' as const, label: 'Advanced', desc: 'Experienced' },
                  ]).map((level) => {
                    const isSelected = experienceLevel === level.value;
                    return (
                      <Panel
                        key={level.value}
                        solid={isSelected}
                        className={`cursor-pointer transition-all ${isSelected ? 'scale-[1.01]' : 'opacity-70 hover:opacity-100'}`}
                        contentClassName="px-4 py-3"
                      >
                        <button
                          onClick={() => setExperienceLevel(level.value)}
                          disabled={isGenerating}
                          role="radio"
                          aria-checked={isSelected}
                          className="w-full text-left flex items-center gap-3"
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? 'bg-black border-black' : 'bg-transparent border-white/25'}`}>
                            {isSelected && <Check className="w-4 h-4 text-white" strokeWidth={2.5} />}
                          </div>
                          <div>
                            <div className={`text-[15px] font-semibold tracking-[-0.01em] ${isSelected ? 'text-black' : 'text-white'}`} style={{ fontFamily: FONT }}>
                              {level.label}
                            </div>
                            <div className={`text-[13px] ${isSelected ? 'text-black/60' : 'text-white/45'}`}>{level.desc}</div>
                          </div>
                        </button>
                      </Panel>
                    );
                  })}
                </div>
              </div>

              {/* Optional fields */}
              <div className="mb-4 md:mb-8">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center gap-2 text-[14px] font-medium text-white/55 hover:text-white transition-colors"
                  disabled={isGenerating}
                  aria-expanded={showOptional}
                >
                  {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Tell us more (optional)
                </button>
                {showOptional && (
                  <div className="mt-4 space-y-4 md:space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
                      <label htmlFor="prior-experience-input" className="block px-5 pt-3 pb-1 text-white/40 text-[11px] font-medium uppercase tracking-[0.08em]">
                        What have you tried before?
                      </label>
                      <div className="mx-5 border-t border-white/5" />
                      <Input
                        id="prior-experience-input"
                        type="text"
                        value={priorExperience}
                        onChange={(e) => setPriorExperience(e.target.value)}
                        placeholder="e.g., Took an online course, read a book..."
                        className="px-5 py-3 bg-transparent border-0 text-white placeholder:text-white/35 text-[17px] focus-visible:ring-0 rounded-none"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
                      <label htmlFor="preferred-tactics-input" className="block px-5 pt-3 pb-1 text-white/40 text-[11px] font-medium uppercase tracking-[0.08em]">
                        How do you like to learn?
                      </label>
                      <div className="mx-5 border-t border-white/5" />
                      <Input
                        id="preferred-tactics-input"
                        type="text"
                        value={preferredTactics}
                        onChange={(e) => setPreferredTactics(e.target.value)}
                        placeholder="e.g., Videos, hands-on practice, reading..."
                        className="px-5 py-3 bg-transparent border-0 text-white placeholder:text-white/35 text-[17px] focus-visible:ring-0 rounded-none"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CTA — rounded-full primary button */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full rounded-full bg-white text-black text-[15px] font-semibold py-4 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Generating your plan...</span>
                    </>
                  ) : (
                    'Generate My Plan'
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isGenerating}
                  className="self-center rounded-full border border-white/15 text-white/80 hover:bg-white/5 transition px-6 py-2.5 text-[14px] font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-[13px] text-white/40">AI builds your first 7-day sprint right now — three more sprints generate as you finish each one.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Validation modal — Panel solid so it pops over the dark backdrop */}
      <AnimatePresence>
        {showValidation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
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
              className="mx-4 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Panel solid contentClassName="p-8 text-center">
                <p id="validation-title" className="text-[20px] font-semibold tracking-[-0.02em] text-black mb-2" style={{ fontFamily: FONT }}>
                  Hold up!
                </p>
                <p className="text-[15px] leading-relaxed text-black/60 mb-6">
                  Just fill in your goal above and we&apos;ll build your plan
                </p>
                <button
                  onClick={() => setShowValidation(false)}
                  className="rounded-full bg-black text-white text-[15px] font-semibold py-3 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  autoFocus
                >
                  Got It
                </button>
              </Panel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
