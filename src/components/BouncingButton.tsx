"use client";
import { useEffect, useRef, useState } from 'react';
import { HERO_PALETTE } from '@/constants';

interface BouncingButtonProps {
  onClick: () => void;
}

export function BouncingButton({ onClick }: BouncingButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const positionRef = useRef({ x: 200, y: 200 });
  const velocityRef = useRef({ x: 1.5, y: 1.5 });
  const [bgColor, setBgColor] = useState(HERO_PALETTE[23]);
  const [position, setPosition] = useState({ x: 200, y: 200 });

  useEffect(() => {
    const speed = 30;
    let timeoutId: number;
    let isRunning = true;
    let colorIndex = 23;

    const pickNextColor = () => {
      // Cycle through the vibrant colors (skip the near-blacks)
      const vibrant = HERO_PALETTE.filter((_, i) => i > 2 && i !== 28);
      colorIndex = (colorIndex + 1) % vibrant.length;
      return vibrant[colorIndex];
    };

    const update = () => {
      if (!isRunning) return;
      if (!containerRef.current || !buttonRef.current) {
        timeoutId = window.setTimeout(update, speed);
        return;
      }

      const container = containerRef.current;
      const button = buttonRef.current;
      const buttonWidth = button.offsetWidth;
      const buttonHeight = button.offsetHeight;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;

      if (containerWidth === 0 || containerHeight === 0) {
        timeoutId = window.setTimeout(update, speed);
        return;
      }

      const minX = 0;
      const maxX = containerWidth - buttonWidth;
      const minY = 0;
      const maxY = containerHeight - buttonHeight;

      let newX = positionRef.current.x + velocityRef.current.x;
      let newY = positionRef.current.y + velocityRef.current.y;
      let bounced = false;

      if (newX >= maxX || newX <= minX) {
        velocityRef.current.x *= -1;
        bounced = true;
      }
      if (newY >= maxY || newY <= minY) {
        velocityRef.current.y *= -1;
        bounced = true;
      }

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      positionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });

      if (bounced) {
        setBgColor(pickNextColor());
      }

      timeoutId = window.setTimeout(update, speed);
    };

    timeoutId = window.setTimeout(update, speed);

    return () => {
      isRunning = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0" style={{ overflow: 'hidden' }}>
      <button
        ref={buttonRef}
        onClick={onClick}
        className="absolute shadow-lg shadow-black/30 hover:shadow-xl hover:scale-105 transition-colors duration-300 px-10 py-7"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          backgroundColor: bgColor,
          clipPath: "polygon(2% 0%, 100% 4%, 98% 100%, 0% 96%)",
        }}
      >
        <span className="text-2xl md:text-3xl font-black uppercase tracking-wider text-white">
          Create Your Goal
        </span>
      </button>
    </div>
  );
}
