"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Registered domains" }]}
      title="Registered domains"
      count={0}
      info
      banner={
        <div className="banner banner--error" role="alert">
          You don&apos;t have permission to view registered domains. Contact your
          administrator.
        </div>
      }
      actions={[
        { label: "Register domain", variant: "secondary" },
        { label: "Transfer", variant: "secondary" },
        { label: "Transfer out", variant: "secondary" },
      ]}
      filterPlaceholder="Find domains"
      columns={[
        { label: "Domain name" },
        { label: "Expiration date" },
        { label: "Auto-renew" },
      ]}
      emptyTitle="No registered domains"
      emptyText="There are no registered domains to display."
    />
  );
}
