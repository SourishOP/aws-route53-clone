"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Shared DNS views" }]}
      title="Shared DNS views"
      count={0}
      info
      filterPlaceholder="Find shared DNS views"
      columns={[
        { label: "Name" },
        { label: "ID" },
        { label: "Owner" },
        { label: "Status" },
        { label: "Created" },
      ]}
      emptyTitle="No shared DNS views"
      emptyText="There are no shared DNS views to display."
    />
  );
}
