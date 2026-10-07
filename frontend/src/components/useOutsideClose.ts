"use client";

import { useEffect, RefObject } from "react";

/** Calls onClose when the user clicks outside `ref` or presses Escape. */
export function useOutsideClose(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, onClose, enabled]);
}
