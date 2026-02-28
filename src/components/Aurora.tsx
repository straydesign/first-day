"use client";
import { useEffect, useState } from 'react';

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
}

export default function Aurora({ colorStops = ['#7cff67', '#00c7fc', '#5227FF'] }: AuroraProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50" />;
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50">
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 100% 80% at 50% 30%, ${colorStops[0]} 0%, transparent 70%)`, opacity: 0.4 }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 70% at 20% 50%, ${colorStops[1]} 0%, transparent 60%)`, opacity: 0.35 }} />
      <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 90% 75% at 80% 60%, ${colorStops[2]} 0%, transparent 65%)`, opacity: 0.35 }} />
    </div>
  );
}
