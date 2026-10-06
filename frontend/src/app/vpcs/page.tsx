"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "VPCs" }]}
      title="VPCs"
      count={0}
      info
      filterPlaceholder="Find VPCs"
      columns={[
        { label: "VPC ID" },
        { label: "Name" },
        { label: "Region" },
      ]}
      emptyTitle="No vpcs"
      emptyText="There are no vpcs to display."
    />
  );
}
