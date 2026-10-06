"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Global resolvers" }]}
      title="Global resolvers"
      count={0}
      info
      filterPlaceholder="Find global resolvers"
      columns={[
        { label: "Name" },
        { label: "ID" },
        { label: "Status" },
        { label: "Region" },
        { label: "Created" },
      ]}
      emptyTitle="No global resolvers"
      emptyText="There are no global resolvers to display."
    />
  );
}
