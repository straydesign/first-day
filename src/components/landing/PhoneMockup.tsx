"use client";

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className = "" }: PhoneMockupProps) {
  return (
    <div className={`mx-auto max-w-[320px] md:max-w-[375px] ${className}`}>
      {/* Phone frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[120px] h-[34px] bg-black rounded-full z-20" />

        {/* Screen */}
        <div className="relative bg-white rounded-[2rem] overflow-hidden min-h-[520px]">
          {/* Status bar spacer */}
          <div className="h-14" />

          {/* Content */}
          <div className="px-4 pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
