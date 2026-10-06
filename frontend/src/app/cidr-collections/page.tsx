"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "CIDR collections" }]}
      title="CIDR collections"
      count={0}
      info
      filterPlaceholder="Find CIDR collections"
      columns={[
        { label: "Name" },
        { label: "ID" },
        { label: "CIDR blocks" },
      ]}
      emptyTitle="No cidr collections"
      emptyText="There are no cidr collections to display."
    />
  );
}
