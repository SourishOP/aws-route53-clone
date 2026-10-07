"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { useFilterFocus } from "./FilterFocusProvider";
import { ShortcutsHelpModal } from "./ShortcutsHelpModal";

function isTypingTarget(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (el) {
    const tag = el.tagName;
    if (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable
    ) {
      return true;
    }
  }
  // A modal is open
  if (document.querySelector(".modal-overlay")) return true;
  return false;
}

export function ShortcutsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleTheme } = useTheme();
  const { focusFilter } = useFilterFocus();
  const [helpOpen, setHelpOpen] = useState(false);
  const pendingG = useRef(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function clearPending() {
      pendingG.current = false;
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    }

    function onKey(e: KeyboardEvent) {
      // Alt+S always works, even inside a text field.
      if (e.altKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        document.getElementById("topnav-search")?.focus();
        return;
      }

      if (isTypingTarget()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      // Resolve a pending "g" sequence
      if (pendingG.current) {
        const k = e.key.toLowerCase();
        clearPending();
        if (k === "h") router.push("/hosted-zones");
        else if (k === "d") router.push("/dashboard");
        else if (k === "c") router.push("/health-checks");
        return;
      }

      if (e.key === "g") {
        pendingG.current = true;
        pendingTimer.current = setTimeout(clearPending, 1200);
        return;
      }

      if (e.key === "/") {
        e.preventDefault();
        focusFilter();
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }

      if (e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        toggleTheme();
        return;
      }

      if (e.key === "c") {
        if (pathname === "/hosted-zones") {
          router.push("/hosted-zones/create");
        } else if (/^\/hosted-zones\/[^/]+$/.test(pathname)) {
          window.dispatchEvent(new CustomEvent("r53:create-record"));
        }
        return;
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [router, pathname, toggleTheme, focusFilter]);

  return (
    <>
      {children}
      {helpOpen && <ShortcutsHelpModal onClose={() => setHelpOpen(false)} />}
    </>
  );
}
