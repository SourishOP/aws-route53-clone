"use client";

import {
  createContext,
  useContext,
  useRef,
  useCallback,
  ReactNode,
} from "react";

interface FilterFocusCtx {
  register: (fn: () => void) => () => void;
  focusFilter: () => void;
}

const Ctx = createContext<FilterFocusCtx>({
  register: () => () => {},
  focusFilter: () => {},
});

export function useFilterFocus() {
  return useContext(Ctx);
}

export function FilterFocusProvider({ children }: { children: ReactNode }) {
  const fnRef = useRef<(() => void) | null>(null);

  const register = useCallback((fn: () => void) => {
    fnRef.current = fn;
    return () => {
      if (fnRef.current === fn) fnRef.current = null;
    };
  }, []);

  const focusFilter = useCallback(() => {
    fnRef.current?.();
  }, []);

  return (
    <Ctx.Provider value={{ register, focusFilter }}>{children}</Ctx.Provider>
  );
}
