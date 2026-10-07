"use client";

import { useState, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useSidebar } from "./SidebarProvider";
import { useTheme } from "./ThemeProvider";
import { useOutsideClose } from "./useOutsideClose";
import { ALL_SECTIONS } from "@/lib/nav";
import { NOTIFICATIONS } from "@/lib/notifications";
import {
  HamburgerIcon,
  GridIcon,
  CloudShellIcon,
  BellIcon,
} from "./icons";

export function TopNav() {
  const { user, logout } = useAuth();
  const { toggle: toggleSidebar, collapsed } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [menuOpen, setMenuOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [shellOpen, setShellOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const menuRef = useRef<HTMLDivElement>(null);
  const appsRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useOutsideClose(menuRef, () => setMenuOpen(false), menuOpen);
  useOutsideClose(appsRef, () => setAppsOpen(false), appsOpen);
  useOutsideClose(bellRef, () => setBellOpen(false), bellOpen);
  useOutsideClose(searchRef, () => setSearchOpen(false), searchOpen);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ALL_SECTIONS.filter((s) => s.label.toLowerCase().includes(q)).slice(
      0,
      8
    );
  }, [query]);

  const go = (href: string) => {
    router.push(href);
    setSearchOpen(false);
    setQuery("");
    setAppsOpen(false);
  };

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[highlight];
      if (r) go(r.href);
    } else if (e.key === "Escape") {
      setSearchOpen(false);
    }
  };

  return (
    <header className="topnav">
      <button
        type="button"
        className="topnav__icon-btn"
        aria-label="Toggle navigation"
        aria-expanded={!collapsed}
        onClick={toggleSidebar}
      >
        <HamburgerIcon />
      </button>
      <div className="topnav__logo" title="AWS">
        <svg width="28" height="18" viewBox="0 0 40 24" fill="none" aria-hidden>
          <path
            d="M11.5 13.2c0 .5.05.9.15 1.2.1.3.25.6.45.95.07.1.1.2.1.3 0 .13-.08.26-.25.4l-.82.55a.63.63 0 0 1-.34.12c-.13 0-.26-.06-.39-.18a4 4 0 0 1-.47-.6 10 10 0 0 1-.4-.76c-1 1.18-2.27 1.77-3.8 1.77-1.08 0-1.95-.31-2.58-.93-.63-.62-.95-1.45-.95-2.48 0-1.1.39-1.99 1.18-2.66.79-.67 1.84-1 3.18-1 .44 0 .9.04 1.38.1.48.07.98.17 1.5.3v-.95c0-.98-.2-1.66-.6-2.06-.42-.4-1.12-.59-2.12-.59-.45 0-.92.05-1.4.16-.48.11-.95.25-1.4.43a3.7 3.7 0 0 1-.46.17.8.8 0 0 1-.2.03c-.18 0-.27-.13-.27-.4v-.63c0-.2.03-.36.1-.45a.97.97 0 0 1 .38-.27c.45-.23 1-.43 1.63-.58a7.9 7.9 0 0 1 2.02-.24c1.54 0 2.66.35 3.38 1.05.71.7 1.07 1.76 1.07 3.18v4.19zm-5.25 1.97c.42 0 .86-.08 1.32-.23.46-.15.87-.43 1.21-.81.2-.24.36-.5.43-.8.08-.3.13-.66.13-1.08v-.52a11 11 0 0 0-1.2-.22 9.8 9.8 0 0 0-1.23-.08c-.88 0-1.52.17-1.95.52-.43.35-.64.85-.64 1.5 0 .62.16 1.08.48 1.39.31.32.76.47 1.35.47zm10.38 1.4c-.23 0-.38-.04-.48-.12-.1-.08-.19-.25-.26-.49l-2.95-9.7a2.2 2.2 0 0 1-.12-.5c0-.2.1-.3.3-.3h1.28c.24 0 .4.04.49.12.1.08.17.25.24.49l2.11 8.32 1.96-8.32c.06-.24.14-.41.23-.49.1-.08.27-.12.5-.12h1.04c.24 0 .4.04.5.12.1.08.18.25.23.49l1.98 8.42 2.17-8.42c.07-.24.15-.41.24-.49.1-.08.26-.12.49-.12h1.21c.2 0 .31.1.31.3 0 .06-.01.12-.02.2a1.8 1.8 0 0 1-.1.3l-3.02 9.7c-.07.24-.16.41-.26.49-.1.08-.26.12-.48.12h-1.12c-.24 0-.4-.04-.5-.12-.1-.09-.18-.26-.23-.5l-1.95-8.11-1.93 8.1c-.06.25-.14.42-.24.5-.1.09-.27.13-.5.13h-1.12zm16.6.35c-.68 0-1.35-.08-2-.23-.65-.16-1.16-.33-1.5-.52-.21-.12-.35-.25-.4-.37a.93.93 0 0 1-.08-.37v-.66c0-.27.1-.4.29-.4.08 0 .15.01.23.04l.33.14c.44.2.92.35 1.42.46.52.11 1.02.17 1.54.17.82 0 1.46-.14 1.9-.43.44-.29.67-.7.67-1.24 0-.37-.12-.68-.36-.93-.24-.25-.69-.48-1.34-.69l-1.93-.6c-.97-.31-1.69-.76-2.14-1.35a3.17 3.17 0 0 1-.67-1.92c0-.56.12-1.05.36-1.47.24-.42.56-.78.96-1.07.4-.3.86-.52 1.4-.68a5.9 5.9 0 0 1 1.7-.23c.3 0 .6.02.9.06.3.04.59.1.86.16.26.07.5.14.73.23.23.08.4.17.52.25.17.1.3.21.37.33.07.11.1.26.1.45v.61c0 .27-.1.41-.29.41a1.3 1.3 0 0 1-.48-.15 5.76 5.76 0 0 0-2.42-.49c-.74 0-1.33.12-1.73.36-.4.24-.6.61-.6 1.12 0 .37.13.69.4.94.26.25.75.5 1.45.72l1.9.6c.95.3 1.64.73 2.07 1.28.42.55.63 1.18.63 1.88 0 .57-.12 1.08-.35 1.53-.24.45-.56.84-.98 1.16-.42.33-.92.57-1.5.74a6.44 6.44 0 0 1-1.93.27z"
            fill="#fff"
          />
          <path
            d="M36.1 19.3c-4.37 3.23-10.72 4.95-16.18 4.95-7.65 0-14.55-2.83-19.76-7.54-.41-.37-.04-.87.45-.59 5.63 3.27 12.58 5.25 19.76 5.25 4.85 0 10.18-1.01 15.08-3.08.74-.32 1.36.48.65 1z"
            fill="#F90"
          />
          <path
            d="M37.93 17.22c-.56-.72-3.7-.34-5.11-.17-.43.05-.5-.32-.1-.6 2.5-1.76 6.6-1.25 7.08-.66.48.6-.13 4.7-2.47 6.66-.36.3-.7.14-.54-.26.53-1.3 1.7-4.26 1.14-4.97z"
            fill="#F90"
          />
        </svg>
      </div>

      <div className="topnav__item-wrap" ref={appsRef}>
        <button
          type="button"
          className="topnav__icon-btn"
          aria-label="Applications"
          aria-expanded={appsOpen}
          onClick={() => setAppsOpen((o) => !o)}
        >
          <GridIcon />
        </button>
        {appsOpen && (
          <div className="topnav__apps" role="menu">
            <div className="topnav__apps-title">Route 53 — all sections</div>
            <div className="topnav__apps-grid">
              {ALL_SECTIONS.map((s) => (
                <button
                  key={s.href}
                  type="button"
                  className="topnav__apps-item"
                  onClick={() => go(s.href)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="topnav__search" ref={searchRef}>
        <input
          id="topnav-search"
          placeholder="Search"
          aria-label="Search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSearchOpen(true);
            setHighlight(0);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={onSearchKey}
        />
        <span className="topnav__kbd">[Alt+S]</span>
        {searchOpen && query.trim() && (
          <div className="topnav__search-panel" role="listbox">
            <div className="topnav__search-side">
              <div className="topnav__search-side-item active">Services</div>
              <div className="topnav__search-side-item">Features</div>
              <div className="topnav__search-side-item">Resources</div>
              <div className="topnav__search-side-item">Documentation</div>
              <div className="topnav__search-side-item">Marketplace</div>
            </div>
            <div className="topnav__search-main">
              <div className="topnav__search-section-title">Services</div>
              <div className="topnav__search-service">
                <div className="topnav__search-service-head">
                  <span className="topnav__search-service-icon" aria-hidden>
                    53
                  </span>
                  <div>
                    <button
                      type="button"
                      className="topnav__search-service-name"
                      onClick={() => go("/dashboard")}
                    >
                      Route 53
                    </button>
                    <div className="topnav__search-service-desc">
                      Scalable DNS and Domain Name Registration
                    </div>
                  </div>
                </div>
                <div className="topnav__search-topfeatures">
                  <span>Top features</span>
                  <button type="button" onClick={() => go("/traffic-policies")}>
                    Traffic flow
                  </button>
                  <button type="button" onClick={() => go("/health-checks")}>
                    Health checks
                  </button>
                  <button type="button" onClick={() => go("/hosted-zones")}>
                    Hosted zones
                  </button>
                  <button type="button" onClick={() => go("/registered-domains")}>
                    Domain names
                  </button>
                  <button type="button" onClick={() => go("/inbound-endpoints")}>
                    Resolver endpoints
                  </button>
                </div>
              </div>

              {results.length > 0 && (
                <>
                  <div className="topnav__search-section-title">
                    Matching pages
                  </div>
                  {results.map((r, i) => (
                    <button
                      key={r.href}
                      type="button"
                      className={`topnav__search-result ${
                        i === highlight ? "active" : ""
                      }`}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => go(r.href)}
                    >
                      {r.label}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="topnav__spacer" />

      <button
        type="button"
        className="topnav__icon-btn"
        aria-label="CloudShell"
        onClick={() => setShellOpen((o) => !o)}
      >
        <CloudShellIcon />
      </button>

      <div className="topnav__item-wrap" ref={bellRef}>
        <button
          type="button"
          className="topnav__icon-btn"
          aria-label="Notifications"
          aria-expanded={bellOpen}
          onClick={() => setBellOpen((o) => !o)}
        >
          <BellIcon />
        </button>
        {bellOpen && (
          <div className="topnav__menu topnav__notifications" role="menu">
            <div className="topnav__notif-header">
              <span className="topnav__menu-title">Notifications</span>
              <button
                type="button"
                className="aws-signin__link topnav__notif-center"
                onClick={() => {
                  setBellOpen(false);
                  router.push("/notifications");
                }}
              >
                Notification center
              </button>
            </div>
            <ul className="topnav__notif-list">
              {NOTIFICATIONS.map((n) => (
                <li key={n.id} className="topnav__notif-item">
                  <span className={`topnav__notif-dot ${n.level}`} aria-hidden />
                  <div className="topnav__notif-body">
                    <div className="topnav__notif-title">{n.title}</div>
                    <div className="topnav__notif-meta">
                      {n.resource} · {n.time}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="topnav__item-wrap" ref={menuRef}>
        <div
          className="topnav__item"
          title={user?.account_id}
          onClick={() => setMenuOpen((o) => !o)}
          role="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          {user ? `${user.username} @ ${user.account_id}` : ""} ▾
        </div>
        {menuOpen && (
          <div className="topnav__menu" role="menu">
            <button
              type="button"
              className="topnav__menu-item"
              onClick={() => {
                toggleTheme();
                setMenuOpen(false);
              }}
            >
              Switch to {theme === "dark" ? "light" : "dark"} mode
            </button>
            <button
              type="button"
              className="topnav__menu-item"
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {shellOpen && (
        <div className="cloudshell-panel" role="dialog" aria-label="CloudShell">
          <div className="cloudshell-panel__header">
            <span>CloudShell</span>
            <button
              type="button"
              className="cloudshell-panel__close"
              aria-label="Close CloudShell"
              onClick={() => setShellOpen(false)}
            >
              ×
            </button>
          </div>
          <div className="cloudshell-panel__body">
            <div>Welcome to AWS CloudShell (mock)</div>
            <div className="cloudshell-panel__prompt">
              [cloudshell-user@ip-10-0-0-1 ~]$ <span className="cloudshell-cursor">▋</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
