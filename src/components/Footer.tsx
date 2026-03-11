"use client";

import { VORONOI_LIGHT } from "@/constants";

interface FooterProps {
  onPrivacyClick?: () => void;
  onTermsClick?: () => void;
}

const SHARD_CLIPS = [
  "polygon(2% 0%, 100% 3%, 98% 100%, 0% 97%)",
  "polygon(0% 2%, 97% 0%, 100% 98%, 3% 100%)",
  "polygon(1% 3%, 100% 0%, 99% 97%, 0% 100%)",
  "polygon(3% 0%, 100% 2%, 97% 100%, 0% 98%)",
  "polygon(0% 0%, 98% 3%, 100% 100%, 2% 97%)",
];

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const items = [
    {
      content: onPrivacyClick
        ? <button onClick={onPrivacyClick} className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Privacy Policy</button>
        : <a href="/privacy" className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Privacy Policy</a>,
      color: VORONOI_LIGHT[0],
    },
    {
      content: onTermsClick
        ? <button onClick={onTermsClick} className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Terms of Service</button>
        : <a href="/terms" className="text-black font-bold text-sm hover:opacity-70 transition-opacity">Terms of Service</a>,
      color: VORONOI_LIGHT[1],
    },
    {
      content: <span className="text-black font-bold text-xs">&copy; {currentYear} First Day. All rights reserved.</span>,
      color: VORONOI_LIGHT[2],
    },
    {
      content: <a href="mailto:support@firstday.life" className="text-black font-bold text-xs hover:opacity-70 transition-opacity">support@firstday.life</a>,
      color: VORONOI_LIGHT[3],
    },
    {
      content: <a href="https://straydesign.co" target="_blank" rel="noopener noreferrer" className="text-black font-bold text-xs hover:opacity-70 transition-opacity">Built by Stray Design</a>,
      color: VORONOI_LIGHT[0],
    },
  ];

  return (
    <footer className="bg-black py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap gap-3 justify-center items-center">
          {items.map((item, i) => (
            <div
              key={i}
              className="px-4 py-2 inline-flex items-center justify-center"
              style={{
                backgroundColor: item.color,
                clipPath: SHARD_CLIPS[i % SHARD_CLIPS.length],
              }}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
