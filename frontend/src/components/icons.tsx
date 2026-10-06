"use client";

/**
 * Shared presentational icon/snippet set for the Route 53 console overhaul.
 * All icons are inline SVG matching the existing TopNav style. These components
 * are pure and prop-less (except InfoLink, which optionally takes an href).
 */

export function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5V5h-2.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
      <path
        d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SortIcon() {
  return (
    <span className="sort-indicator" aria-hidden>
      <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
        <path d="M5 1l3 3H2l3-3zM5 11L2 8h6l-3 3z" fill="currentColor" />
      </svg>
    </span>
  );
}

export function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <g fill="currentColor">
        <rect x="2" y="2" width="3" height="3" rx="0.5" />
        <rect x="7.5" y="2" width="3" height="3" rx="0.5" />
        <rect x="13" y="2" width="3" height="3" rx="0.5" />
        <rect x="2" y="7.5" width="3" height="3" rx="0.5" />
        <rect x="7.5" y="7.5" width="3" height="3" rx="0.5" />
        <rect x="13" y="7.5" width="3" height="3" rx="0.5" />
        <rect x="2" y="13" width="3" height="3" rx="0.5" />
        <rect x="7.5" y="13" width="3" height="3" rx="0.5" />
        <rect x="13" y="13" width="3" height="3" rx="0.5" />
      </g>
    </svg>
  );
}

export function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M9 2a4 4 0 0 0-4 4v3L3.5 11.5h11L13 9V6a4 4 0 0 0-4-4zM7 14a2 2 0 0 0 4 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M2.5 5h13M2.5 9h13M2.5 13h13"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CloudShellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect
        x="2"
        y="3"
        width="14"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.3"
        fill="none"
      />
      <path
        d="M5 7l2.5 2L5 11M9.5 11H13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InfoLink({ href = "#" }: { href?: string }) {
  return (
    <a href={href} className="info-link">
      Info
    </a>
  );
}

export function NewTag() {
  return <span className="sidebar__tag-new">New</span>;
}
