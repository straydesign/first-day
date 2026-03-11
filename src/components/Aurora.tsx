"use client";
import { useEffect, useState } from 'react';

interface AuroraProps {
  colorStops?: string[];
}

export default function Aurora({ colorStops = ['#FFE633', '#FF2D55', '#7C4DFF'] }: AuroraProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-gradient-to-br from-[#060B18] via-[#FF1493] to-[#060B18]" />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-[#060B18] via-[#FF1493] to-[#060B18]">
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 100% 80% at 50% 30%, ${colorStops[0]} 0%, transparent 70%)`, opacity: 0.12 }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 70% at 20% 50%, ${colorStops[1]} 0%, transparent 60%)`, opacity: 0.10 }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 90% 75% at 80% 60%, ${colorStops[2]} 0%, transparent 65%)`, opacity: 0.10 }} />
    </div>
  );
}
