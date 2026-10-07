"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
}

const Ctx = createContext<ThemeCtx>({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(Ctx);
}

/** Inline script string that applies the stored/system theme before paint. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('r53-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','light');}})();`;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Read the attribute the inline script already applied.
  useEffect(() => {
    const applied =
      (document.documentElement.getAttribute("data-theme") as Theme) || "light";
    setThemeState(applied);
  }, []);

  const setTheme = (t: Theme) => {
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem("r53-theme", t);
    } catch {
      /* ignore */
    }
    setThemeState(t);
  };

  const toggleTheme = () => {
    // Read the live DOM attribute so the toggle never relies on stale state.
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme) || theme;
    setTheme(current === "dark" ? "light" : "dark");
  };

  return (
    <Ctx.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </Ctx.Provider>
  );
}
