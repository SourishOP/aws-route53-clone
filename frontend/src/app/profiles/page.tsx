"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Profiles" }]}
      title="Profiles"
      count={0}
      info
      filterPlaceholder="Find profiles"
      columns={[
        { label: "Name" },
        { label: "ID" },
        { label: "Status" },
        { label: "Created" },
      ]}
      emptyTitle="No profiles"
      emptyText="There are no profiles to display."
    />
  );
}
