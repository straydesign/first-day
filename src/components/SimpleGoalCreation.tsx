"use client";
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowRight, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, AURORA_COLORS } from '@/constants';
import { motion, AnimatePresence } from 'framer-motion';
import Aurora from './Aurora';
import type { GoalFormData } from '@/types';

const BRIGHT_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF", "#FF10F0", "#4FC3F7", "#FF4500", "#2979FF", "#FFD38A", "#39FF14"];

const SHARD_CLIPS = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 3%, 98% 0%, 100% 97%, 2% 100%)",
  "polygon(1% 0%, 100% 2%, 99% 100%, 0% 98%)",
  "polygon(3% 2%, 100% 0%, 97% 98%, 0% 100%)",
];

const FIELD_COLORS = ["#FFE633", "#FF6B2B", "#FF2D55", "#00EAFF"];

interface SimpleGoalCreationProps {
  onComplete: (goalData: GoalFormData) => void;
  onCancel: () => void;
}

export function SimpleGoalCreation({ onComplete, onCancel }: SimpleGoalCreationProps) {
  const [goal, setGoal] = useState('');
  const [why, setWhy] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [priorExperience, setPriorExperience] = useState('');
  const [preferredTactics, setPreferredTactics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSuggestionClick = (suggestion: string) => { setGoal(suggestion); setError(null); };

  const handleGenerate = () => {
    if (!goal.trim()) { setError('Please enter a goal'); return; }
    setIsGenerating(true);
    setError(null);
    onComplete({ goal: goal.trim(), why: why.trim(), experienceLevel, priorExperience: priorExperience.trim(), preferredTactics: preferredTactics.trim(), timestamp: Date.now() });
  };

  const SCROLL_SPEEDS = ["20s", "30s", "25s"];

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
              backgroundColor: BRIGHT_COLORS[(index * 7 + 3) % BRIGHT_COLORS.length],
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
    <div className="min-h-screen relative bg-black">
      <div className="fixed inset-0 z-0 w-full h-full"><Aurora colorStops={[...AURORA_COLORS]} /></div>
      <div className="relative z-10">
      <div className="pt-2 pl-6">
        <BackButton onClick={onCancel} disabled={isGenerating} />
      </div>
      <div className="flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <div className="p-4 md:p-12">
            <div className="text-center mb-6 md:mb-10">
              <div className="inline-block bg-black px-8 py-3 mb-3" style={{ clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Let&apos;s Create Your Goal</h1>
              </div>
              <div className="inline-block bg-black px-6 py-2" style={{ clipPath: "polygon(2% 0%, 98% 4%, 100% 96%, 0% 100%)" }}>
                <p className="text-lg text-white font-bold">Tell us what you want to achieve</p>
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
                style={{ backgroundColor: FIELD_COLORS[0], clipPath: SHARD_CLIPS[0] }}
              >
                <label className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">What&apos;s your goal?</label>
                <div className="mx-4 border-t border-black/10" />
                <Textarea value={goal} onChange={(e) => { setGoal(e.target.value); setError(null); }} placeholder="Type your goal here..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none resize-none min-h-[80px] md:min-h-[120px]" disabled={isGenerating} autoFocus rows={3} />
              </div>
            </div>
          </div>
        </motion.div>
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
                style={{ backgroundColor: FIELD_COLORS[1], clipPath: SHARD_CLIPS[1] }}
              >
                <label className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">Why do you want to achieve this?</label>
                <div className="mx-4 border-t border-black/10" />
                <Textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Tell us what motivates you..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none resize-none min-h-[80px] md:min-h-[120px]" disabled={isGenerating} rows={3} />
              </div>
            </div>
            <div className="mb-4 md:mb-8">
              <label className="block text-sm font-semibold text-white/80 mb-2 md:mb-3">What&apos;s your experience level?</label>
              <div className="flex flex-col gap-3">
                {[{ value: 'beginner' as const, label: 'Beginner', desc: 'Just starting', color: FIELD_COLORS[0] }, { value: 'intermediate' as const, label: 'Intermediate', desc: 'Some experience', color: FIELD_COLORS[2] }, { value: 'advanced' as const, label: 'Advanced', desc: 'Experienced', color: FIELD_COLORS[3] }].map((level, index) => (
                  <button
                    key={level.value}
                    onClick={() => setExperienceLevel(level.value)}
                    disabled={isGenerating}
                    className={`p-4 transition-all text-left text-black font-bold ${experienceLevel === level.value ? 'ring-2 ring-white/40 scale-[1.02]' : 'opacity-70 hover:opacity-100'}`}
                    style={{ backgroundColor: level.color, clipPath: SHARD_CLIPS[index % SHARD_CLIPS.length] }}
                  >
                    <div className="font-bold text-black">{level.label}</div>
                    <div className="text-sm text-black/70">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4 md:mb-8">
              <button type="button" onClick={() => setShowOptional(!showOptional)} className="flex items-center gap-2 text-sm font-bold text-white/80 hover:text-white transition-colors" disabled={isGenerating}>
                {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Tell us more (optional)
              </button>
              {showOptional && (
                <div className="mt-4 space-y-4 md:space-y-6">
                  <div
                    className="overflow-hidden"
                    style={{ backgroundColor: FIELD_COLORS[2], clipPath: SHARD_CLIPS[2] }}
                  >
                    <label className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">What have you tried before?</label>
                    <div className="mx-4 border-t border-black/10" />
                    <Input type="text" value={priorExperience} onChange={(e) => setPriorExperience(e.target.value)} placeholder="e.g., Took an online course, read a book..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none" disabled={isGenerating} />
                  </div>
                  <div
                    className="overflow-hidden"
                    style={{ backgroundColor: FIELD_COLORS[3], clipPath: SHARD_CLIPS[3] }}
                  >
                    <label className="block px-5 pt-3 pb-1 text-black/60 text-xs font-bold uppercase tracking-wider">How do you like to learn?</label>
                    <div className="mx-4 border-t border-black/10" />
                    <Input type="text" value={preferredTactics} onChange={(e) => setPreferredTactics(e.target.value)} placeholder="e.g., Videos, hands-on practice, reading..." className="px-5 py-3 bg-transparent border-0 text-black placeholder:text-black/40 text-lg focus-visible:ring-0 rounded-none" disabled={isGenerating} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !goal.trim()}
                className="w-full bg-black text-white py-4 text-xl font-black uppercase tracking-wide hover:scale-105 transition-transform disabled:hover:scale-100 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ clipPath: "polygon(1% 0%, 100% 3%, 99% 97%, 0% 100%)" }}
              >
                {isGenerating ? (<><Loader2 className="w-5 h-5 animate-spin" />Generating...</>) : (<>Generate My Plan<ArrowRight className="w-5 h-5" /></>)}
              </button>
              <button
                onClick={onCancel}
                disabled={isGenerating}
                className="w-full bg-black/50 text-white/70 py-3 font-bold uppercase tracking-wide hover:scale-105 transition-transform"
                style={{ clipPath: "polygon(0% 3%, 99% 0%, 100% 97%, 1% 100%)" }}
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
    </div>
  );
}
