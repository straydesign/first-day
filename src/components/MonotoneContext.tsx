"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { MotionConfig } from "framer-motion";

interface MonotoneContextValue {
  monotone: boolean;
  toggleMonotone: () => void;
}

const MonotoneContext = createContext<MonotoneContextValue>({ monotone: false, toggleMonotone: () => {} });

export function MonotoneProvider({ children }: { children: React.ReactNode }) {
  const [monotone, setMonotone] = useState(false);

  useEffect(() => {
    setMonotone(localStorage.getItem("fd-monotone") === "true");
  }, []);

  const toggleMonotone = useCallback(() => {
    setMonotone(prev => {
      const next = !prev;
      localStorage.setItem("fd-monotone", String(next));
      return next;
    });
  }, []);

  return (
    <MonotoneContext.Provider value={{ monotone, toggleMonotone }}>
      <MotionConfig reducedMotion="user">
        <div
          style={monotone ? { filter: "grayscale(1)", WebkitFilter: "grayscale(1)" } : undefined}
        >
          {children}
        </div>
      </MotionConfig>
    </MonotoneContext.Provider>
  );
}

export function useMonotone() {
  return useContext(MonotoneContext);
}
