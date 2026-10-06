"use client";

import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { InfoLink, RefreshIcon, GearIcon } from "@/components/icons";

export default function Page() {
  return (
    <div>
      <Breadcrumb
        items={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Dashboard" }]}
      />

      <div className="page-header">
        <div>
          <h1>
            Route 53 Dashboard <InfoLink />
          </h1>
        </div>
      </div>

      <div className="dash-grid">
        <div className="dash-card">
          <div className="dash-card__title">DNS management</div>
          <div className="dash-card__body">
            Create and manage hosted zones and records for your domains.
          </div>
          <div style={{ marginTop: 16 }}>
            <Link className="btn btn--outline-blue" href="/hosted-zones/create">
              Create hosted zone
            </Link>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__title">Availability monitoring</div>
          <div className="dash-card__body">
            Monitor the health of your resources with health checks.
          </div>
          <div style={{ marginTop: 16 }}>
            <a className="btn btn--outline-blue" href="#">
              Create health check
            </a>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__title">Traffic management</div>
          <div className="dash-card__body">
            Route traffic to your resources using traffic policies.
          </div>
          <div style={{ marginTop: 16 }}>
            <a className="btn btn--outline-blue" href="#">
              Create policy
            </a>
          </div>
        </div>

        <div className="dash-card">
          <div className="dash-card__title">Domain registration</div>
          <div className="dash-card__body">
            <span style={{ color: "var(--color-error-text, #d13212)", fontWeight: 700 }}>
              Error
            </span>
          </div>
        </div>
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <div className="dash-card__title">Register domain</div>
        <div className="dash-card__body">
          Register a new domain name or transfer an existing domain to Route 53.
        </div>
        <div style={{ marginTop: 16 }}>
          <a className="btn btn--outline-blue" href="#">
            Register domain
          </a>
        </div>
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <div className="dash-card__title">Notifications</div>
        <div className="toolbar">
          <div className="toolbar__search">
            <input placeholder="Find notifications" aria-label="Find notifications" />
          </div>
          <div className="toolbar__spacer" />
          <button type="button" className="icon-btn" aria-label="Refresh">
            <RefreshIcon />
          </button>
          <Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />
          <button type="button" className="icon-btn" aria-label="Settings">
            <GearIcon />
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2}>
                  <div className="empty-state">
                    <strong>No notifications to display</strong>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <div className="dash-card__title">
          <a className="info-link" href="#">
            More resources ↗
          </a>
        </div>
        <ul className="resource-list">
          <li>
            <a className="info-link" href="#">
              Route 53 documentation ↗
            </a>
          </li>
          <li>
            <a className="info-link" href="#">
              Pricing ↗
            </a>
          </li>
          <li>
            <a className="info-link" href="#">
              FAQ ↗
            </a>
          </li>
        </ul>
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <div className="dash-card__title">Service health</div>
        <div className="dash-card__body">
          All services are operating normally.
        </div>
      </div>
    </div>
  );
}
