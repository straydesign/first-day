"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sparkles, ArrowRight, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';
import { GOAL_CATEGORY_MAP, GOAL_CATEGORY_COLORS, GOAL_SUGGESTIONS_ROW_1, GOAL_SUGGESTIONS_ROW_2, GOAL_SUGGESTIONS_ROW_3, AURORA_COLORS } from '@/constants';
import { motion, AnimatePresence } from 'framer-motion';
import Aurora from './Aurora';
import { MosaicButton } from './MosaicButton';
import type { GoalFormData } from '@/types';

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
  const [isPaused, setIsPaused] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const getGoalColorClasses = (g: string) => {
    const goalType = GOAL_CATEGORY_MAP[g] || 'lifestyle';
    return GOAL_CATEGORY_COLORS[goalType];
  };

  const handleSuggestionClick = (suggestion: string) => { setGoal(suggestion); setError(null); setIsPaused(false); };
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => { const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX; const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY; setDragStartPos({ x: clientX, y: clientY }); setIsPaused(true); };
  const handleMouseUp = () => { setIsPaused(false); setDragStartPos(null); };
  const handleButtonClick = (e: React.MouseEvent, suggestion: string) => { if (dragStartPos) { const distance = Math.sqrt(Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)); if (distance > 10) return; } e.stopPropagation(); handleSuggestionClick(suggestion); };

  const handleGenerate = () => {
    if (!goal.trim()) { setError('Please enter a goal'); return; }
    setIsGenerating(true);
    setError(null);
    onComplete({ goal: goal.trim(), why: why.trim(), experienceLevel, priorExperience: priorExperience.trim(), preferredTactics: preferredTactics.trim(), timestamp: Date.now() });
  };

  const renderScrollRow = (goals: string[], direction: 'left' | 'right') => (
    <div className="overflow-x-scroll py-0.5 scrollbar-hide cursor-grab active:cursor-grabbing" onMouseDown={handleMouseDown} onMouseUp={handleMouseUp} onMouseLeave={() => setIsPaused(false)} onTouchStart={handleMouseDown} onTouchEnd={handleMouseUp}>
      <div className={`flex whitespace-nowrap ${isPaused ? '' : direction === 'left' ? 'animate-scroll-left' : 'animate-scroll-right'}`}>
        {[...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals, ...goals].map((suggestion, index) => (
          <button key={index} onClick={(e) => handleButtonClick(e, suggestion)} disabled={isGenerating} className={`inline-block px-5 py-2.5 text-sm border-2 ${index % 2 === 0 ? 'clip-badge-a' : 'clip-badge-b'} transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mx-1 ${getGoalColorClasses(suggestion)} ${goal === suggestion ? 'scale-105 ring-2 ring-white/40 shadow-md' : ''}`}>
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
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 md:mb-3">Let&apos;s Create Your Goal</h1>
              <p className="text-lg text-white/80 font-bold">Tell us what you want to achieve</p>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-50 border border-red-200 clip-tile-c p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mb-0">
              <label className="block text-sm font-semibold text-white/80 mb-3">What&apos;s your goal?</label>
              <Textarea value={goal} onChange={(e) => { setGoal(e.target.value); setError(null); }} placeholder="Type your goal here..." className="px-5 py-4 bg-white/50 border-2 border-white/10 text-lg focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all resize-none min-h-[80px] md:min-h-[120px]" disabled={isGenerating} autoFocus rows={3} />
            </div>
          </div>
        </motion.div>
      </div>
      <div className="w-full space-y-0 mb-4 md:mb-8 py-3 md:py-6">
        {renderScrollRow(GOAL_SUGGESTIONS_ROW_1, 'left')}
        {renderScrollRow(GOAL_SUGGESTIONS_ROW_2, 'right')}
        {renderScrollRow(GOAL_SUGGESTIONS_ROW_3, 'left')}
      </div>
      <div className="flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <div className="p-4 md:p-12">
            <div className="mb-4 md:mb-8">
              <label className="block text-sm font-semibold text-white/80 mb-2 md:mb-3">Why do you want to achieve this?</label>
              <Textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Tell us what motivates you..." className="px-5 py-4 bg-white/50 border-2 border-white/10 text-lg focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all resize-none min-h-[80px] md:min-h-[120px]" disabled={isGenerating} rows={3} />
            </div>
            <div className="mb-4 md:mb-8">
              <label className="block text-sm font-semibold text-white/80 mb-2 md:mb-3">What&apos;s your experience level?</label>
              <div className="flex flex-col gap-3">
                {[{ value: 'beginner' as const, label: 'Beginner', desc: 'Just starting' }, { value: 'intermediate' as const, label: 'Intermediate', desc: 'Some experience' }, { value: 'advanced' as const, label: 'Advanced', desc: 'Experienced' }].map((level, index) => (
                  <button key={level.value} onClick={() => setExperienceLevel(level.value)} disabled={isGenerating} className={`p-4 clip-tile-${['a','b','c'][index] || 'a'} border-2 transition-all text-left ${experienceLevel === level.value ? 'border-white/40 bg-[#1A0A5E]' : 'border-white/10 bg-white/50 hover:border-white/20'}`}>
                    <div className="font-semibold text-white">{level.label}</div>
                    <div className="text-sm text-white/80">{level.desc}</div>
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
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2 md:mb-3">What have you tried before?</label>
                    <Input type="text" value={priorExperience} onChange={(e) => setPriorExperience(e.target.value)} placeholder="e.g., Took an online course, read a book..." className="px-5 py-4 bg-white/50 border-2 border-white/10 text-lg focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all" disabled={isGenerating} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white/80 mb-2 md:mb-3">How do you like to learn?</label>
                    <Input type="text" value={preferredTactics} onChange={(e) => setPreferredTactics(e.target.value)} placeholder="e.g., Videos, hands-on practice, reading..." className="px-5 py-4 bg-white/50 border-2 border-white/10 text-lg focus:border-white/40 focus:ring-4 focus:ring-white/10 transition-all" disabled={isGenerating} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <MosaicButton size="lg" onClick={handleGenerate} disabled={isGenerating || !goal.trim()} className="w-full shadow-lg transition-smooth hover:scale-105 disabled:hover:scale-100">
                {isGenerating ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</>) : (<>Generate My Plan<ArrowRight className="w-5 h-5 ml-2" /></>)}
              </MosaicButton>
              <Button variant="outline" size="lg" onClick={onCancel} disabled={isGenerating} className="w-full border-2 border-white/10 text-white/80 hover:bg-white/10">Cancel</Button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-white/50"><Sparkles className="w-4 h-4 inline-block mr-1 text-purple-500" />AI will create a personalized 30-day plan just for you</p>
            </div>
          </div>
        </motion.div>
      </div>
      </div>
    </div>
  );
}
