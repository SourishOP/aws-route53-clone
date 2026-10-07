// Mocked Route 53 account notifications (static demo data).
export interface Notification {
  id: string;
  title: string;
  resource: string;
  status: string;
  time: string;
  level: "info" | "success" | "warning";
}

export const NOTIFICATIONS: Notification[] = [
  {
    id: "ntf-01",
    title: "Hosted zone example.com. created",
    resource: "example.com.",
    status: "Success",
    time: "2 hours ago",
    level: "success",
  },
  {
    id: "ntf-02",
    title: "Health check hc-7f3a is now Healthy",
    resource: "hc-7f3a2b1c",
    status: "Healthy",
    time: "5 hours ago",
    level: "success",
  },
  {
    id: "ntf-03",
    title: "Domain myapp.io auto-renew succeeded",
    resource: "myapp.io",
    status: "Renewed",
    time: "Yesterday",
    level: "info",
  },
  {
    id: "ntf-04",
    title: "Query logging enabled for internal.local.",
    resource: "internal.local.",
    status: "Enabled",
    time: "2 days ago",
    level: "info",
  },
  {
    id: "ntf-05",
    title: "TLS certificate for example.com. renewed",
    resource: "example.com.",
    status: "Renewed",
    time: "3 days ago",
    level: "success",
  },
  {
    id: "ntf-06",
    title: "Resolver endpoint approaching query limit",
    resource: "rslvr-in-9c2e",
    status: "Warning",
    time: "4 days ago",
    level: "warning",
  },
];
