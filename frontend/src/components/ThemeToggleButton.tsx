"use client";

import { useTheme } from "./ThemeProvider";
import { SunIcon, MoonIcon } from "./icons";

export function ThemeToggleButton() {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={toggleTheme}
    >
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
