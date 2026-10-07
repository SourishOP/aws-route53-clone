// Single source of truth for the app's navigation model.
// Used by Sidebar, the top-nav app launcher, and the section search.

export interface NavItem {
  label: string;
  href: string;
  isNew?: boolean;
  external?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const TOP_LINKS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Hosted zones", href: "/hosted-zones" },
  { label: "Health checks", href: "/health-checks" },
  { label: "Profiles", href: "/profiles" },
];

export const GROUPS: NavGroup[] = [
  {
    label: "Global Resolver",
    items: [
      { label: "Global resolvers", href: "/global-resolvers", isNew: true },
      { label: "Shared DNS views", href: "/shared-dns-views", isNew: true },
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

export const DNS_FIREWALL: NavItem = {
  label: "DNS Firewall",
  href: "#",
  external: true,
};

// Flattened list of all navigable sections (excludes the external DNS Firewall).
export const ALL_SECTIONS: NavItem[] = [
  ...TOP_LINKS,
  ...GROUPS.flatMap((g) => g.items),
];
