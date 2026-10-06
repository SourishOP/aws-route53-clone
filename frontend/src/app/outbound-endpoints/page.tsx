"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Outbound endpoints" }]}
      title="Outbound endpoints"
      count={0}
      info
      filterPlaceholder="Find outbound endpoints"
      columns={[
        { label: "ID" },
        { label: "Name" },
        { label: "VPC" },
        { label: "Status" },
      ]}
      emptyTitle="No outbound endpoints"
      emptyText="There are no outbound endpoints to display."
    />
  );
}
