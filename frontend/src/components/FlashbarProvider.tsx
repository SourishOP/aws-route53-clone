"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type FlashType = "success" | "error" | "info";

interface Flash {
  id: number;
  type: FlashType;
  message: string;
}

interface FlashContextValue {
  notify: (type: FlashType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const FlashContext = createContext<FlashContextValue | null>(null);

let counter = 0;

export function FlashbarProvider({ children }: { children: ReactNode }) {
  const [flashes, setFlashes] = useState<Flash[]>([]);

  const remove = useCallback((id: number) => {
    setFlashes((f) => f.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (type: FlashType, message: string) => {
      const id = ++counter;
      setFlashes((f) => [...f, { id, type, message }]);
      // auto dismiss success/info
      if (type !== "error") {
        setTimeout(() => remove(id), 5000);
      }
    },
    [remove]
  );

  const value: FlashContextValue = {
    notify,
    success: (m) => notify("success", m),
    error: (m) => notify("error", m),
    info: (m) => notify("info", m),
  };

  return (
    <FlashContext.Provider value={value}>
      {children}
      <div className="flashbar">
        {flashes.map((f) => (
          <div key={f.id} className={`flash flash--${f.type}`} role="alert">
            <span aria-hidden>
              {f.type === "success" ? "✓" : f.type === "error" ? "⚠" : "ℹ"}
            </span>
            <div className="flash__content">{f.message}</div>
            <button
              className="flash__close"
              onClick={() => remove(f.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </FlashContext.Provider>
  );
}

export function useFlash() {
  const ctx = useContext(FlashContext);
  if (!ctx) throw new Error("useFlash must be used within FlashbarProvider");
  return ctx;
}
