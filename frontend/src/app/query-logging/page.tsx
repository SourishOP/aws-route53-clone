"use client";

import { ConsoleListPage } from "@/components/ConsoleListPage";

export default function Page() {
  return (
    <ConsoleListPage
      breadcrumb={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Query logging" }]}
      title="Query logging"
      count={0}
      info
      filterPlaceholder="Find query logging configurations"
      columns={[
        { label: "ID" },
        { label: "Hosted zone" },
        { label: "Destination" },
      ]}
      emptyTitle="No query logging"
      emptyText="There are no query logging to display."
    />
  );
}
