"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Rules" }]}
      title="Rules"
      count={0}
      info
      filterPlaceholder="Find rules"
      columns={[
        { label: "Name" },
        { label: "ID" },
        { label: "Type" },
        { label: "Domain" },
      ]}
      emptyTitle="No rules"
      emptyText="There are no rules to display."
    />
  );
}
