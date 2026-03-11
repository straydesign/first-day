"use client";
import { useEffect, useRef, useState } from 'react';

interface BouncingButtonProps {
  onClick: () => void;
}

export function BouncingButton({ onClick }: BouncingButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const positionRef = useRef({ x: 200, y: 300 });
  const velocityRef = useRef({ x: 1.275, y: 1.275 });
  const [position, setPosition] = useState({ x: 200, y: 300 });

  useEffect(() => {
    const speed = 40;
    let timeoutId: number;
    let isRunning = true;

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

      const horizontalPadding = containerWidth * -0.05;
      const topPadding = containerHeight * 0.345;
      const bottomPadding = containerHeight * -0.10;
      const minX = -horizontalPadding;
      const maxX = containerWidth + horizontalPadding;
      const minY = topPadding;
      const maxY = containerHeight + bottomPadding;

      let newX = positionRef.current.x + velocityRef.current.x;
      let newY = positionRef.current.y + velocityRef.current.y;

      if (newX + buttonWidth >= maxX || newX <= minX) {
        velocityRef.current.x *= -1;
      }
      if (newY + buttonHeight >= maxY || newY <= minY) {
        velocityRef.current.y *= -1;
      }

      newX = Math.max(minX, Math.min(newX, maxX - buttonWidth));
      newY = Math.max(minY, Math.min(newY, maxY - buttonHeight));

      positionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });

      timeoutId = window.setTimeout(update, speed);
    };

    timeoutId = window.setTimeout(update, speed);

    return () => {
      isRunning = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 top-[44px]" style={{ overflow: 'hidden' }}>
      <button
        ref={buttonRef}
        onClick={onClick}
        className="absolute shadow-lg shadow-black/30 hover:shadow-xl transition-smooth hover:scale-105 px-10 py-7 overflow-hidden bg-black"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          clipPath: "polygon(2% 0%, 100% 4%, 98% 100%, 0% 96%)",
        }}
      >
        <span
          className="text-2xl md:text-3xl font-black uppercase tracking-wider"
          style={{
            background: "linear-gradient(90deg, #FFE633, #FF6B2B, #FF2D55, #00EAFF, #FF10F0, #FF1493, #4FC3F7, #FF4500, #FFE633)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "gradient-shift 3s linear infinite",
          }}
        >
          Create Your Goal
        </span>
      </button>
    </div>
  );
}
