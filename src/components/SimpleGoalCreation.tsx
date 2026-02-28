"use client";
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleGoalCreationProps {
  onComplete: (goalData: any) => void;
  onCancel: () => void;
}

export function SimpleGoalCreation({ onComplete, onCancel }: SimpleGoalCreationProps) {
  const [goal, setGoal] = useState('');
  const [why, setWhy] = useState('');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [priorExperience, setPriorExperience] = useState('');
  const [preferredTactics, setPreferredTactics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  const commonGoalsRow1 = ['Learn to play guitar', 'Run a 5K', 'Learn Spanish', 'Start a meditation practice', 'Write a book', 'Learn to code', 'Get in shape', 'Learn photography'];
  const commonGoalsRow2 = ['Master Public Speaking', 'Learn Sign Language', 'Start a Podcast', 'Cook Healthy Meals', 'Learn Video Editing', 'Practice Yoga Daily', 'Build a Mobile App', 'Start a Side Business'];
  const commonGoalsRow3 = ['Read 10 Books', 'Learn Japanese', 'Master Time Management', 'Learn Graphic Design', 'Write Poetry Daily', 'Learn Calligraphy', 'Brew Your Own Coffee', 'Garden From Scratch'];

  const goalMapping: Record<string, 'running' | 'language' | 'coding' | 'meditation'> = {
    "Run a 5K": "running", "Get in shape": "running", "Practice Yoga Daily": "running",
    "Start a meditation practice": "meditation", "Cook Healthy Meals": "meditation", "Master Time Management": "meditation", "Brew Your Own Coffee": "meditation", "Garden From Scratch": "meditation",
    "Learn Spanish": "language", "Learn Sign Language": "language", "Write a book": "language", "Learn photography": "language", "Read 10 Books": "language", "Learn Japanese": "language", "Write Poetry Daily": "language", "Learn Calligraphy": "language", "Learn to play guitar": "language",
    "Learn to code": "coding", "Master Public Speaking": "coding", "Start a Podcast": "coding", "Learn Video Editing": "coding", "Build a Mobile App": "coding", "Start a Side Business": "coding", "Learn Graphic Design": "coding",
  };

  const getGoalColorClasses = (g: string) => {
    const goalType = goalMapping[g] || 'meditation';
    const colorClasses = {
      running: 'border-[#7cff67] bg-[#7cff67]/10 hover:bg-[#7cff67]/20 hover:border-[#7cff67]',
      language: 'border-[#00c7fc] bg-[#00c7fc]/10 hover:bg-[#00c7fc]/20 hover:border-[#00c7fc]',
      coding: 'border-[#5227FF] bg-[#5227FF]/10 hover:bg-[#5227FF]/20 hover:border-[#5227FF]',
      meditation: 'border-[#ff6b5a] bg-[#ff6b5a]/10 hover:bg-[#ff6b5a]/20 hover:border-[#ff6b5a]'
    };
    return colorClasses[goalType];
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
          <button key={index} onClick={(e) => handleButtonClick(e, suggestion)} disabled={isGenerating} className={`inline-block px-5 py-2.5 text-sm border-2 rounded-full transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mx-1 ${getGoalColorClasses(suggestion)}`}>
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-2 pl-6">
        <button onClick={onCancel} disabled={isGenerating} className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-coral-600 text-coral-600 hover:bg-coral-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium">
          <ArrowLeft className="w-5 h-5" /><span>Back</span>
        </button>
      </div>
      <div className="flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <div className="bg-white p-6 md:p-12">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Let&apos;s Create Your Goal</h1>
              <p className="text-lg text-gray-600">Tell us what you want to achieve</p>
            </div>
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mb-0">
              <label className="block text-sm font-semibold text-gray-700 mb-3">What&apos;s your goal?</label>
              <textarea value={goal} onChange={(e) => { setGoal(e.target.value); setError(null); }} placeholder="Type your goal here..." className="w-full px-5 py-4 bg-white/50 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-coral-400 focus:ring-4 focus:ring-coral-100 transition-all resize-none min-h-[120px]" disabled={isGenerating} autoFocus rows={3} />
            </div>
          </div>
        </motion.div>
      </div>
      <div className="w-full space-y-0 mb-8 bg-purple-50 py-6">
        {renderScrollRow(commonGoalsRow1, 'left')}
        {renderScrollRow(commonGoalsRow2, 'right')}
        {renderScrollRow(commonGoalsRow3, 'left')}
      </div>
      <div className="flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl mx-auto">
          <div className="bg-white p-6 md:p-12">
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Why do you want to achieve this?</label>
              <textarea value={why} onChange={(e) => setWhy(e.target.value)} placeholder="Tell us what motivates you..." className="w-full px-5 py-4 bg-white/50 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-coral-400 focus:ring-4 focus:ring-coral-100 transition-all resize-none min-h-[120px]" disabled={isGenerating} rows={3} />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">What&apos;s your experience level?</label>
              <div className="flex flex-col gap-3">
                {[{ value: 'beginner' as const, label: 'Beginner', desc: 'Just starting' }, { value: 'intermediate' as const, label: 'Intermediate', desc: 'Some experience' }, { value: 'advanced' as const, label: 'Advanced', desc: 'Experienced' }].map((level) => (
                  <button key={level.value} onClick={() => setExperienceLevel(level.value)} disabled={isGenerating} className={`p-4 rounded-xl border-2 transition-all text-left ${experienceLevel === level.value ? 'border-coral-400 bg-coral-50 shadow-md' : 'border-gray-200 bg-white/50 hover:border-gray-300'}`}>
                    <div className="font-semibold text-gray-900">{level.label}</div>
                    <div className="text-sm text-gray-600">{level.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Prior Experience</label>
              <input type="text" value={priorExperience} onChange={(e) => setPriorExperience(e.target.value)} placeholder="e.g., I have some basic knowledge..." className="w-full px-5 py-4 bg-white/50 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-coral-400 focus:ring-4 focus:ring-coral-100 transition-all" disabled={isGenerating} />
            </div>
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Preferred Tactics</label>
              <input type="text" value={preferredTactics} onChange={(e) => setPreferredTactics(e.target.value)} placeholder="e.g., I prefer visual learning..." className="w-full px-5 py-4 bg-white/50 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:border-coral-400 focus:ring-4 focus:ring-coral-100 transition-all" disabled={isGenerating} />
            </div>
            <div className="flex flex-col gap-3">
              <Button size="lg" onClick={handleGenerate} disabled={isGenerating || !goal.trim()} className="w-full bg-teal-600 hover:bg-teal-700 text-white shadow-lg">
                {isGenerating ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</>) : (<>Generate My Plan<ArrowRight className="w-5 h-5 ml-2" /></>)}
              </Button>
              <Button variant="outline" size="lg" onClick={onCancel} disabled={isGenerating} className="w-full border-2 border-coral-600 text-coral-600 hover:bg-coral-50">Cancel</Button>
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500"><Sparkles className="w-4 h-4 inline-block mr-1 text-purple-500" />AI will create a personalized 30-day plan just for you</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
