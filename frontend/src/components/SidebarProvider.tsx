"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface SidebarCtx {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
}

const Ctx = createContext<SidebarCtx>({
  collapsed: false,
  setCollapsed: () => {},
  toggle: () => {},
});

export function useSidebar() {
  return useContext(Ctx);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  useEffect(() => {
    try {
      setCollapsedState(localStorage.getItem("r53-sidebar-collapsed") === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem("r53-sidebar-collapsed", v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const toggle = () => setCollapsed(!collapsed);

  return (
    <Ctx.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </Ctx.Provider>
  );
}
