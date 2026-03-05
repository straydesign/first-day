"use client";
import { useState, useEffect, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Calendar, Youtube, ExternalLink, Zap } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { previewDayXP } from "@/lib/engagement";

export function DayView({ day, onComplete, isCompleted = false, savedProgress = null, onBack, currentStreak = 0 }: any) {
  const [completedActivities, setCompletedActivities] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (savedProgress) {
      if (savedProgress.completed) setCompletedActivities(savedProgress.completed);
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
    <div className="min-h-screen bg-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50"></div>
      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 pt-4 md:pt-8">
        {onBack && <BackButton onClick={onBack} />}
        {isCompleted && (
          <div className="mb-4 md:mb-6 p-4 bg-lime-600 text-white rounded-xl text-center shadow-lg animate-slideInUp">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg">Day Completed{savedProgress?.completedAt ? ` on ${new Date(savedProgress.completedAt).toLocaleDateString()}` : ''}</span>
            </div>
            <p className="text-sm text-lime-100 mt-1">Your activities and notes are saved below.</p>
          </div>
        )}
        <div className="text-center mb-4 md:mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-teal-500" />
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{isToday ? `Today (Day ${day.number})` : `Day ${day.number}`}</h1>
            {day.dateDisplay && <span className="text-xl text-teal-500 ml-2">• {day.dateDisplay}</span>}
          </div>
        </div>
        {hasActivities ? (
          <Card className="mb-4 md:mb-6 shadow-lg border border-gray-200 rounded-xl animate-slideInUp bg-white/90 backdrop-blur-sm">
            <CardHeader><CardTitle className="text-2xl text-slate-800">Your Activities</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {activities.map((activity: any, index: number) => {
                const activityText = typeof activity === 'string' ? activity : activity.text;
                const resources = typeof activity === 'object' ? activity.resources : null;
                return (
                  <div key={index} className="space-y-2">
                    <div className={`flex items-start gap-2 md:gap-4 p-2 md:p-4 rounded-lg border-2 transition-smooth ${completedActivities[index] ? 'border-lime-500 bg-lime-50/50 shadow-md' : 'border-gray-300 hover:border-teal-500 hover:shadow-sm'} ${isCompleted ? 'opacity-75' : ''}`}>
                      <Checkbox checked={completedActivities[index] || false} onCheckedChange={() => !isCompleted && toggleActivity(index)} id={`activity-${index}`} className="mt-1 flex-shrink-0 size-6 border-2 border-gray-400 data-[state=checked]:border-lime-500 data-[state=checked]:bg-lime-500 rounded-md" disabled={isCompleted} />
                      <label htmlFor={`activity-${index}`} className="flex-1 min-w-0 cursor-pointer">
                        <div className="text-base md:text-lg leading-relaxed select-text text-gray-700">{activityText}</div>
                        {resources && resources.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {resources.map((resource: any, rIndex: number) => (
                              <div key={rIndex} onClick={(e) => e.preventDefault()}>
                                {resource.type === 'youtube' && (
                                  <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.query)}`} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 text-sm hover:underline ${completedActivities[index] ? 'text-lime-600 hover:text-lime-500' : 'text-teal-600 hover:text-teal-500'}`} onClick={(e) => e.stopPropagation()}>
                                    <Youtube className="w-4 h-4" />Search YouTube: {resource.query}
                                  </a>
                                )}
                                {resource.type === 'link' && (
                                  <a href={resource.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 text-sm hover:underline ${completedActivities[index] ? 'text-lime-600 hover:text-lime-500' : 'text-teal-600 hover:text-teal-500'}`} onClick={(e) => e.stopPropagation()}>
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
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-4 md:mb-6 shadow-lg border border-gray-200 rounded-xl animate-slideInUp bg-white/90 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 text-lg">Activities for this day are not available yet.</p>
              <p className="text-gray-400 text-sm mt-2">Check back later or contact support if this persists.</p>
            </CardContent>
          </Card>
        )}
        <Card className="mb-4 md:mb-6 shadow-lg border border-gray-200 rounded-xl animate-slideInUp bg-white/90 backdrop-blur-sm" style={{ animationDelay: '0.1s' }}>
          <CardHeader><CardTitle className="text-2xl text-slate-800">How did today go?</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={feedback} onChange={(e) => !isCompleted && setFeedback(e.target.value)} placeholder="Share your thoughts, challenges, or wins from today..." className="min-h-32 text-lg border-gray-300 focus:border-teal-500 bg-white text-gray-900 placeholder:text-gray-500" disabled={isCompleted} />
            {!isCompleted && <p className="text-sm text-gray-500 mt-2">Reflect on your progress — what went well and what you can improve.</p>}
          </CardContent>
        </Card>
        {!isCompleted && (
          <>
            <div className="flex justify-center">
              <Button onClick={handleSubmit} disabled={!canSubmit} className="px-6 py-5 md:px-8 md:py-6 text-base md:text-lg shadow-lg hover:shadow-xl disabled:opacity-50 transition-smooth hover:scale-105 disabled:hover:scale-100">Complete Day</Button>
            </div>
            {canSubmit && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-teal-700 animate-fadeIn">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span>You&apos;ll earn ~<strong>{xpPreview.total} XP</strong></span>
              </div>
            )}
            {!canSubmit && <p className="text-center text-sm text-teal-600 mt-4">Check at least one activity or add a reflection to continue</p>}
          </>
        )}
      </div>
    </div>
  );
}
