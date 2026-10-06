"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Requests" }]}
      title="Requests"
      count={0}
      info
      filterPlaceholder="Find requests"
      columns={[
        { label: "Request ID" },
        { label: "Domain name" },
        { label: "Operation" },
        { label: "Status" },
        { label: "Last updated" },
      ]}
      emptyTitle="No requests"
      emptyText="There are no requests to display."
    />
  );
}
