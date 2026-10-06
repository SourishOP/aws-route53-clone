"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Outposts" }]}
      title="Outposts"
      count={0}
      info
      filterPlaceholder="Find Outposts"
      columns={[
        { label: "ID" },
        { label: "Name" },
        { label: "Status" },
      ]}
      emptyTitle="No outposts"
      emptyText="There are no outposts to display."
    />
  );
}
