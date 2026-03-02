"use client";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Calendar, Youtube, ExternalLink, Sparkles } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export function DayView({ day, onComplete, isCompleted = false, savedProgress = null, onBack }: any) {
  const [completedActivities, setCompletedActivities] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (savedProgress) {
      if (savedProgress.completed) setCompletedActivities(savedProgress.completed);
      if (savedProgress.feedback) setFeedback(savedProgress.feedback);
    }
  }, [savedProgress]);

  const activities = day.activities || [
    "Review your progress and set today's intention",
    "Take one meaningful action toward your goal",
    "Reflect on what you learned today"
  ];

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

  return (
    <div className="min-h-screen bg-white relative">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-50"></div>
      {onBack && <BackButton onClick={onBack} variant="fixed" />}
      <div className="relative z-10 max-w-3xl mx-auto p-4 md:p-8 pt-20">
        {isCompleted && (
          <div className="mb-6 p-4 bg-lime-600 text-white rounded-xl text-center shadow-lg animate-slideInUp">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span className="text-lg">Day Completed on {savedProgress?.completedAt ? new Date(savedProgress.completedAt).toLocaleDateString() : 'Previously'}</span>
            </div>
          </div>
        )}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center gap-2">
            <Calendar className="w-8 h-8 text-teal-500" />
            <h1 className="text-4xl font-bold text-slate-800">{isToday ? `Today (Day ${day.number})` : `Day ${day.number}`}</h1>
            {day.dateDisplay && <span className="text-xl text-teal-500 ml-2">• {day.dateDisplay}</span>}
          </div>
        </div>
        <Card className="mb-6 shadow-lg border border-gray-200 rounded-xl animate-slideInUp bg-white/90 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-2xl text-slate-800">Your Activities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity: any, index: number) => {
              const activityText = typeof activity === 'string' ? activity : activity.text;
              const resources = typeof activity === 'object' ? activity.resources : null;
              return (
                <div key={index} className="space-y-2">
                  <div className={`flex items-start gap-2 md:gap-4 p-2 md:p-4 rounded-lg border-2 transition-smooth ${completedActivities[index] ? 'border-lime-500 bg-lime-50/50 shadow-md' : 'border-gray-300 hover:border-teal-500 hover:shadow-sm'} ${isCompleted ? 'opacity-75' : ''}`}>
                    <Checkbox checked={completedActivities[index] || false} onCheckedChange={() => !isCompleted && toggleActivity(index)} id={`activity-${index}`} className="mt-1 flex-shrink-0" disabled={isCompleted} />
                    <div className="flex-1 min-w-0">
                      <div className="text-base md:text-lg leading-relaxed select-text text-gray-700">{activityText}</div>
                      {resources && resources.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {resources.map((resource: any, rIndex: number) => (
                            <div key={rIndex}>
                              {resource.type === 'youtube' && (
                                <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(resource.query)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-500 hover:underline">
                                  <Youtube className="w-4 h-4" />Watch: {resource.query}
                                </a>
                              )}
                              {resource.type === 'link' && (
                                <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-500 hover:underline">
                                  <ExternalLink className="w-4 h-4" />{resource.title || resource.url}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {completedActivities[index] && <CheckCircle2 className="w-6 h-6 text-lime-500 flex-shrink-0 animate-scaleIn" />}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card className="mb-6 shadow-lg border border-gray-200 rounded-xl animate-slideInUp bg-white/90 backdrop-blur-sm" style={{ animationDelay: '0.1s' }}>
          <CardHeader><CardTitle className="text-2xl text-slate-800">How did today go?</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={feedback} onChange={(e) => !isCompleted && setFeedback(e.target.value)} placeholder="Share your thoughts, challenges, or wins from today..." className="min-h-32 text-lg border-gray-300 focus:border-teal-500 bg-white text-gray-900 placeholder:text-gray-500" disabled={isCompleted} />
            {!isCompleted && <p className="text-sm text-teal-600 mt-2">Your feedback helps create a better plan for tomorrow</p>}
          </CardContent>
        </Card>
        {!isCompleted && (
          <>
            <div className="flex justify-center">
              <Button onClick={handleSubmit} disabled={!canSubmit} className="px-8 py-6 text-lg shadow-lg hover:shadow-xl disabled:opacity-50 transition-smooth hover:scale-105 disabled:hover:scale-100">Submit Progress</Button>
            </div>
            {!canSubmit && <p className="text-center text-sm text-teal-600 mt-4">Check at least one activity or add feedback to continue</p>}
          </>
        )}
      </div>
    </div>
  );
}
