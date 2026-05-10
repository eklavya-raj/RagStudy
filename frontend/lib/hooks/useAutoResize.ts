"use client";
import { useRef, useCallback } from "react";

export function useAutoResize(maxHeight = 160) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const adjust = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [maxHeight]);

  const reset = useCallback(() => {
    if (ref.current) ref.current.style.height = "auto";
  }, []);

  return { ref, adjust, reset };
}
