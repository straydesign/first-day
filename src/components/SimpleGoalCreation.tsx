"use client";
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, GOAL_TEMPLATES, type GoalTemplate } from '@/constants';
import { SCROLL_SPEEDS } from '@/tokens';
import { motion, AnimatePresence } from 'framer-motion';
import { Panel } from '@/components/ui/Panel';
import { COPY } from '@/content/copy';
import { FONT } from '@/lib/design';
import {
  OPTIONAL_FIELDS,
  wizardField,
  initialWizardValues,
  type WizardField,
  type WizardFieldKey,
  type WizardValues,
} from '@/content/steps';
import type { GoalFormData } from '@/types';
import {
  DEFAULT_SKILL_LEVEL,
  SKILL_MAX,
  SKILL_MIN,
  clampLevel,
  experienceFromLevel,
  levelLabel,
  skillBand,
} from '@/lib/skill-level';


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
  // One values object keyed by field — driven by WIZARD_FIELDS, not 5 useStates.
  const [values, setValues] = useState<WizardValues>(() => initialWizardValues(initialData));
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptional, setShowOptional] = useState(
    !!(initialData?.contextAnswers?.priorExperience || initialData?.contextAnswers?.preferredTactics)
  );
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const setValue = (key: WizardFieldKey, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const handleSuggestionClick = (suggestion: string) => { setValue('goal', suggestion); setError(null); };

  const handleTemplateClick = (template: GoalTemplate) => {
    // A template fills in the goal, not the person: the slider keeps its value.
    setValues((prev) => ({
      ...prev,
      goal: template.goal,
      why: template.why,
      priorExperience: template.priorExperience,
      preferredTactics: template.preferredTactics,
    }));
    setShowOptional(true);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!values.goal.trim()) { setShowValidation(true); return; }
    setIsGenerating(true);
    setError(null);
    const skillLevel = clampLevel(values.skillLevel) ?? DEFAULT_SKILL_LEVEL;
    const experienceLevel = experienceFromLevel(skillLevel);
    const contextAnswers = {
      why: values.why.trim(),
      skillLevel: String(skillLevel),
      experienceLevel,
      priorExperience: values.priorExperience.trim(),
      preferredTactics: values.preferredTactics.trim(),
    };
    try {
      await onComplete({
        goal: values.goal.trim(),
        why: values.why.trim(),
        skillLevel,
        experienceLevel,
        priorExperience: values.priorExperience.trim(),
        preferredTactics: values.preferredTactics.trim(),
        contextAnswers,
        timestamp: Date.now(),
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // ---- Field renderers (drive markup off the WIZARD_FIELDS config) ----

  const renderTextField = (field: WizardField) => {
    const isArea = field.type === 'textarea';
    return (
      <div key={field.key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
        <label htmlFor={`${field.key}-input`} className="block px-5 pt-3 pb-1 text-white/40 text-[11px] font-medium uppercase tracking-[0.08em]">
          {field.label}
        </label>
        <div className="mx-5 border-t border-white/5" />
        {isArea ? (
          <Textarea
            id={`${field.key}-input`}
            value={values[field.key]}
            onChange={(e) => { setValue(field.key, e.target.value); if (field.key === 'goal') setError(null); }}
            placeholder={field.placeholder}
            className="px-5 py-3 bg-transparent border-0 text-white placeholder:text-white/35 text-[17px] focus-visible:ring-0 rounded-none resize-none min-h-[80px] md:min-h-[120px]"
            disabled={isGenerating}
            autoFocus={field.autoFocus}
            rows={3}
          />
        ) : (
          <Input
            id={`${field.key}-input`}
            type="text"
            value={values[field.key]}
            onChange={(e) => setValue(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="px-5 py-3 bg-transparent border-0 text-white placeholder:text-white/35 text-[17px] focus-visible:ring-0 rounded-none"
            disabled={isGenerating}
          />
        )}
      </div>
    );
  };

  const renderSliderField = (field: WizardField) => {
    const level = clampLevel(values[field.key]) ?? DEFAULT_SKILL_LEVEL;
    const band = skillBand(level);
    const pct = ((level - SKILL_MIN) / (SKILL_MAX - SKILL_MIN)) * 100;
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 focus-within:border-white/30 transition-colors">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <label htmlFor={`${field.key}-input`} className="text-[14px] font-medium text-white/55">
            {field.label}
          </label>
          <span
            data-testid="skill-level-label"
            className="shrink-0 text-[15px] font-semibold tabular-nums text-white"
            style={{ fontFamily: FONT }}
            aria-hidden
          >
            {levelLabel(level)}
          </span>
        </div>
        <p data-testid="skill-level-example" className="text-[13px] text-white/45 mb-3">
          {COPY.goalCreation.skillExamples[band.id]}
        </p>
        <input
          id={`${field.key}-input`}
          type="range"
          min={SKILL_MIN}
          max={SKILL_MAX}
          step={1}
          value={level}
          onChange={(e) => setValue(field.key, e.target.value)}
          disabled={isGenerating}
          aria-valuetext={`${level}, ${band.name}`}
          className="block w-full h-11 cursor-pointer appearance-none bg-transparent disabled:opacity-50
            [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[image:var(--track)]
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:-mt-[9px] [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,0,0,0.5)]
            [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-[image:var(--track)]
            [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white
            focus-visible:outline-none focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-white/60"
          style={{ ['--track' as string]: `linear-gradient(to right, rgba(255,255,255,0.9) ${pct}%, rgba(255,255,255,0.15) ${pct}%)` }}
        />
        <div className="flex justify-between text-[12px] text-white/40" aria-hidden>
          <span>{COPY.goalCreation.skillLow}</span>
          <span>{COPY.goalCreation.skillHigh}</span>
        </div>
      </div>
    );
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
              values.goal === suggestion
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
    <div className="min-h-dvh relative">
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
                  {COPY.goalCreation.title}
                </h1>
                <p className="text-[16px] leading-relaxed text-white/55">
                  {COPY.goalCreation.subtitle}
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

              {/* Goal input — the primary field */}
              <div className="mb-0">
                {renderTextField(wizardField('goal'))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Template grid */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-4xl mx-auto px-4 md:px-12 pb-2 md:pb-6">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-[11px] uppercase tracking-[0.08em] font-medium text-white/40">{COPY.goalCreation.templateDivider}</p>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
              {GOAL_TEMPLATES.map((template) => {
                const isActive = values.goal === template.goal;
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

              {/* Why input */}
              <div className="mb-4 md:mb-8">
                {renderTextField(wizardField('why'))}
              </div>

              {/* Skill level slider */}
              <div className="mb-4 md:mb-8">
                {renderSliderField(wizardField('skillLevel'))}
              </div>

              {/* Optional fields — mapped from config */}
              <div className="mb-4 md:mb-8">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center gap-2 text-[14px] font-medium text-white/55 hover:text-white transition-colors"
                  disabled={isGenerating}
                  aria-expanded={showOptional}
                >
                  {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {COPY.goalCreation.optionalToggle}
                </button>
                {showOptional && (
                  <div className="mt-4 space-y-4 md:space-y-6">
                    {OPTIONAL_FIELDS.map((field) => renderTextField(field))}
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
                      <span>{COPY.goalCreation.generatingButton}</span>
                    </>
                  ) : (
                    COPY.goalCreation.generateButton
                  )}
                </button>
                <button
                  onClick={onCancel}
                  disabled={isGenerating}
                  className="self-center rounded-full border border-white/15 text-white/80 hover:bg-white/5 transition px-6 py-2.5 text-[14px] font-medium disabled:opacity-50"
                >
                  {COPY.goalCreation.cancelButton}
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-[13px] text-white/40">{COPY.goalCreation.footerMicrocopy}</p>
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
                  {COPY.goalCreation.validationTitle}
                </p>
                <p className="text-[15px] leading-relaxed text-black/60 mb-6">
                  {COPY.goalCreation.validationBody}
                </p>
                <button
                  onClick={() => setShowValidation(false)}
                  className="rounded-full bg-black text-white text-[15px] font-semibold py-3 px-8 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  autoFocus
                >
                  {COPY.goalCreation.validationConfirm}
                </button>
              </Panel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
