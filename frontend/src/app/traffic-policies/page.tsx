"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Traffic policies" }]}
      title="Traffic policies"
      count={0}
      info
      actions={[
        { label: "Create traffic policy", variant: "outlined-orange" },
      ]}
      filterPlaceholder="Find traffic policies"
      columns={[
        { label: "Name" },
        { label: "ID" },
        { label: "Type" },
        { label: "Records" },
        { label: "Version" },
      ]}
      emptyTitle="No traffic policies"
      emptyText="There are no traffic policies to display."
    />
  );
}
