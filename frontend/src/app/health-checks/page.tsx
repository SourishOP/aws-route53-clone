"use client";

import { Breadcrumb } from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { InfoLink, RefreshIcon, GearIcon } from "@/components/icons";

const COLUMNS = ["ID", "Name", "State", "Details", "Status in last 24 hours", "Actions"];

export default function Page() {
  return (
    <div>
      <Breadcrumb
        items={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Health checks" }]}
      />

      <div className="page-header">
        <div>
          <h1>
            Health checks (0) <InfoLink />
          </h1>
        </div>
        <div className="page-header__actions">
          <button type="button" className="icon-btn" aria-label="Refresh">
            <RefreshIcon />
          </button>
          <button type="button" className="btn btn--create">
            Create health check
          </button>
        </div>
      </div>

      <div className="helper-line">
        Health checks monitor the health and performance of your web applications,
        web servers, and other resources.
      </div>

      <div className="container-box">
        <div className="toolbar">
          <div className="toolbar__search">
            <input placeholder="Find health check" aria-label="Find health check" />
          </div>
          <div className="toolbar__spacer" />
          <Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />
          <button type="button" className="icon-btn" aria-label="Settings">
            <GearIcon />
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th className="checkbox-cell"></th>
                {COLUMNS.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={COLUMNS.length + 1}>
                  <div className="empty-state">
                    <strong>No health checks to display.</strong>
                    <div style={{ marginTop: 16 }}>
                      <button type="button" className="btn btn--create">
                        Create health check
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
