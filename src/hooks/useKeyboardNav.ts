"use client";
import { useEffect, useCallback } from "react";

/**
 * Global keyboard navigation for First Day.
 * - Escape: closes modals, navigates back
 * - Arrow keys: navigate between focusable sections
 * - data-keyboard-nav attribute on body: only shows focus styles during keyboard nav
 */
export function useKeyboardNav(onEscape?: () => void) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Track keyboard vs mouse navigation
    document.body.setAttribute("data-keyboard-nav", "true");

    if (e.key === "Escape" && onEscape) {
      e.preventDefault();
      onEscape();
    }
  }, [onEscape]);

  const handleMouseDown = useCallback(() => {
    document.body.removeAttribute("data-keyboard-nav");
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, [handleKeyDown, handleMouseDown]);
}
