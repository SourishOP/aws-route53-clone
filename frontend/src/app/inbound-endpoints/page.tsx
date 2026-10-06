"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Inbound endpoints" }]}
      title="Inbound endpoints"
      count={0}
      info
      filterPlaceholder="Find inbound endpoints"
      columns={[
        { label: "ID" },
        { label: "Name" },
        { label: "VPC" },
        { label: "Status" },
      ]}
      emptyTitle="No inbound endpoints"
      emptyText="There are no inbound endpoints to display."
    />
  );
}
