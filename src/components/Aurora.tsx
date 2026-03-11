"use client";
import { useEffect, useState } from 'react';

interface AuroraProps {
  colorStops?: string[];
}

export default function Aurora({ colorStops = ['#FFE633', '#FF2D55', '#7C4DFF'] }: AuroraProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-gradient-to-br from-black via-black to-black" />;
  }

  return (
    <div className="w-full h-full bg-black" />
  );
}
