"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Policy records" }]}
      title="Policy records"
      count={0}
      info
      actions={[
        { label: "Create policy record", variant: "outlined-orange" },
      ]}
      filterPlaceholder="Find policy records"
      columns={[
        { label: "Name" },
        { label: "Policy" },
        { label: "Version" },
        { label: "DNS name" },
      ]}
      emptyTitle="No policy records"
      emptyText="There are no policy records to display."
    />
  );
}
