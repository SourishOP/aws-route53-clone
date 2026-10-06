"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NewTag } from "./icons";

type NavLink = {
  label: string;
  href: string;
  tag?: "New";
  external?: boolean;
};
type NavGroup = { label: string; items: NavLink[]; defaultOpen?: boolean };

const TOP_LINKS: NavLink[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hosted zones", href: "/hosted-zones" },
  { label: "Health checks", href: "/health-checks" },
  { label: "Profiles", href: "/profiles" },
];

const GROUPS: NavGroup[] = [
  {
    label: "Global Resolver",
    items: [
      { label: "Global resolvers", href: "/global-resolvers", tag: "New" },
      { label: "Shared DNS views", href: "/shared-dns-views", tag: "New" },
    ],
  },
  {
    label: "VPC Resolver",
    items: [
      { label: "VPCs", href: "/vpcs" },
      { label: "Inbound endpoints", href: "/inbound-endpoints" },
      { label: "Outbound endpoints", href: "/outbound-endpoints" },
      { label: "Rules", href: "/rules" },
      { label: "Query logging", href: "/query-logging" },
      { label: "Outposts", href: "/outposts" },
    ],
  },
  {
    label: "Domains",
    items: [
      { label: "Registered domains", href: "/registered-domains" },
      { label: "Requests", href: "/requests" },
    ],
  },
  {
    label: "IP-based routing",
    items: [{ label: "CIDR collections", href: "/cidr-collections" }],
  },
  {
    label: "Traffic flow",
    items: [
      { label: "Traffic policies", href: "/traffic-policies" },
      { label: "Policy records", href: "/policy-records" },
    ],
  },
];

const DNS_FIREWALL: NavLink = {
  label: "DNS Firewall",
  href: "#",
  external: true,
};

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const seed: Record<string, boolean> = {};
    for (const g of GROUPS) seed[g.label] = g.defaultOpen ?? true;
    return seed;
  });

  const toggle = (label: string) =>
    setOpen((prev) => ({ ...prev, [label]: !prev[label] }));

  const renderLink = (item: NavLink) => {
    if (item.external) {
      return (
        <a
          key={item.label}
          href={item.href}
          className="sidebar__link sidebar__external"
          rel="noreferrer"
        >
          {item.label} ↗
        </a>
      );
    }
    return (
      <Link
        key={item.label}
        href={item.href}
        className={`sidebar__link ${isActive(item.href) ? "active" : ""}`}
      >
        {item.label}
        {item.tag === "New" && <NewTag />}
      </Link>
    );
  };

  return (
    <nav className="sidebar" aria-label="Route 53 navigation">
      <div className="sidebar__title">Route 53</div>

      {TOP_LINKS.map(renderLink)}

      {GROUPS.map((group) => {
        const isOpen = open[group.label];
        return (
          <div key={group.label}>
            <button
              type="button"
              className="sidebar__group-header"
              onClick={() => toggle(group.label)}
              aria-expanded={isOpen}
            >
              <span className="sidebar__chevron">{isOpen ? "▼" : "▶"}</span>
              {group.label}
            </button>
            {isOpen && group.items.map(renderLink)}
          </div>
        );
      })}

      <div className="sidebar__divider" />
      {renderLink(DNS_FIREWALL)}
    </nav>
  );
}
