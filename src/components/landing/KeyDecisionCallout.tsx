"use client";

import type { LucideIcon } from "lucide-react";

interface KeyDecisionCalloutProps {
  number: number;
  icon: LucideIcon;
  title: string;
  description: string;
}

export function KeyDecisionCallout({ number, icon: Icon, title, description }: KeyDecisionCalloutProps) {
  return (
    <div className="flex items-start gap-3 bg-white/60 backdrop-blur-sm rounded-xl p-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
        <Icon className="w-5 h-5 text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 rounded-full px-2 py-0.5">
            #{number}
          </span>
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
