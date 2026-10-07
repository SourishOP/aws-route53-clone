"use client";

import { Breadcrumb } from "@/components/Breadcrumb";
import { InfoLink } from "@/components/icons";
import { NOTIFICATIONS } from "@/lib/notifications";

export default function NotificationsPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Notifications" },
        ]}
      />

      <div className="page-header">
        <div>
          <h1>
            Notification center ({NOTIFICATIONS.length}) <InfoLink />
          </h1>
        </div>
      </div>

      <div className="helper-line">
        AWS managed notifications for your Route 53 resources.
      </div>

      <div className="container-box">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Notification</th>
                <th>Resource</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATIONS.map((n) => (
                <tr key={n.id}>
                  <td>{n.title}</td>
                  <td className="cell-mono">{n.resource}</td>
                  <td>
                    <span
                      className={`badge ${
                        n.level === "success"
                          ? "badge--public"
                          : n.level === "warning"
                          ? "badge--private"
                          : ""
                      }`}
                    >
                      {n.status}
                    </span>
                  </td>
                  <td>{n.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
