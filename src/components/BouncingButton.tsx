"use client";
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BouncingButtonProps {
  onClick: () => void;
}

export function BouncingButton({ onClick }: BouncingButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const positionRef = useRef({ x: 200, y: 300 });
  const velocityRef = useRef({ x: 1.275, y: 1.275 });
  const [bgColor, setBgColor] = useState('rgb(20, 184, 166)');
  const [position, setPosition] = useState({ x: 200, y: 300 });

  useEffect(() => {
    const speed = 40;
    let timeoutId: number;
    let isRunning = true;

    const pickRandomColor = () => {
      const colors = [
        'rgb(20, 184, 166)',
        'rgb(250, 82, 82)',
        'rgb(168, 85, 247)',
        'rgb(22, 163, 74)',
        'rgb(59, 130, 246)',
      ];
      return colors[Math.floor(Math.random() * colors.length)];
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

      const horizontalPadding = containerWidth * -0.05;
      const topPadding = containerHeight * 0.345;
      const bottomPadding = containerHeight * -0.10;
      const minX = -horizontalPadding;
      const maxX = containerWidth + horizontalPadding;
      const minY = topPadding;
      const maxY = containerHeight + bottomPadding;

      let newX = positionRef.current.x + velocityRef.current.x;
      let newY = positionRef.current.y + velocityRef.current.y;
      let colorChanged = false;

      if (newX + buttonWidth >= maxX || newX <= minX) {
        velocityRef.current.x *= -1;
        colorChanged = true;
      }
      if (newY + buttonHeight >= maxY || newY <= minY) {
        velocityRef.current.y *= -1;
        colorChanged = true;
      }

      newX = Math.max(minX, Math.min(newX, maxX - buttonWidth));
      newY = Math.max(minY, Math.min(newY, maxY - buttonHeight));

      positionRef.current = { x: newX, y: newY };
      setPosition({ x: newX, y: newY });

      if (colorChanged) {
        setBgColor(pickRandomColor());
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
    <div ref={containerRef} className="fixed inset-0 top-[44px]" style={{ overflow: 'hidden' }}>
      <Button
        ref={buttonRef}
        onClick={onClick}
        size="lg"
        className="text-white shadow-lg shadow-black/30 hover:shadow-xl transition-smooth hover:scale-105 text-lg px-8 py-6 absolute"
        style={{ left: `${position.x}px`, top: `${position.y}px`, backgroundColor: bgColor }}
      >
        Create Your Goal
      </Button>
    </div>
  );
}
