"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { HostedZone } from "@/lib/types";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { EditZoneModal } from "@/components/EditZoneModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { useFlash } from "@/components/FlashbarProvider";
import { RefreshIcon, GearIcon } from "@/components/icons";

const PAGE_SIZE = 10;

export default function HostedZonesPage() {
  const flash = useFlash();
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [deleteZone, setDeleteZone] = useState<HostedZone | null>(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listZones({
        search: debounced,
        page,
        page_size: PAGE_SIZE,
        sort,
        order,
      });
      setZones(data.items);
      setTotal(data.total);
    } catch (err) {
      flash.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [debounced, page, sort, order, flash]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSort = (col: string) => {
    if (sort === col) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(col);
      setOrder("asc");
    }
  };

  const sortIndicator = (col: string) =>
    sort === col ? (order === "asc" ? " ▲" : " ▼") : "";

  const selectedZone = zones.find((z) => z.id === selected) || null;

  return (
    <div>
      <Breadcrumb items={[{ label: "Route 53", href: "/hosted-zones" }, { label: "Hosted zones" }]} />

      <div className="page-header">
        <div>
          <h1>
            Hosted zones <span className="count">({total})</span>
          </h1>
        </div>
        <div className="page-header__actions">
          <button className="icon-btn" onClick={() => load()} aria-label="Refresh">
            <RefreshIcon />
          </button>
          <Link
            className="btn"
            href={selectedZone ? `/hosted-zones/${selectedZone.id}` : "#"}
            style={!selectedZone ? { pointerEvents: "none", opacity: 0.5 } : {}}
          >
            View details
          </Link>
          <button
            className="btn"
            disabled={!selectedZone}
            onClick={() => selectedZone && setEditZone(selectedZone)}
          >
            Edit
          </button>
          <button
            className="btn"
            disabled={!selectedZone}
            onClick={() => selectedZone && setDeleteZone(selectedZone)}
          >
            Delete
          </button>
          <Link className="btn btn--create" href="/hosted-zones/create">
            Create hosted zone
          </Link>
        </div>
      </div>

      <div className="helper-line">
        Automatic mode is the current search behavior optimized for best filter
        results. <a href="#">To change modes go to settings.</a>
      </div>

      <div className="container-box">
        <div className="toolbar">
          <div className="toolbar__search">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              placeholder="Filter records by property or value"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={setPage}
          />
          <button className="icon-btn" aria-label="Settings">
            <GearIcon />
          </button>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-row">
              <span className="spinner" /> Loading hosted zones…
            </div>
          ) : zones.length === 0 ? (
            <div className="empty-state">
              <strong>No hosted zones</strong>
              There are no hosted zones created for this account.
              <Link className="btn btn--create" href="/hosted-zones/create">
                Create hosted zone
              </Link>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-cell"></th>
                  <th className="sortable" onClick={() => toggleSort("name")}>
                    Hosted zone name{sortIndicator("name")}
                  </th>
                  <th className="sortable" onClick={() => toggleSort("type")}>
                    Type{sortIndicator("type")}
                  </th>
                  <th>Created by</th>
                  <th>Record count</th>
                  <th>Description</th>
                  <th>Hosted zone ID</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((z) => (
                  <tr
                    key={z.id}
                    className={selected === z.id ? "selected" : ""}
                    onClick={() => setSelected(z.id)}
                  >
                    <td className="checkbox-cell">
                      <input
                        type="radio"
                        name="zone-select"
                        checked={selected === z.id}
                        onChange={() => setSelected(z.id)}
                        aria-label={`Select ${z.name}`}
                      />
                    </td>
                    <td>
                      <Link href={`/hosted-zones/${z.id}`}>{z.name}</Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          z.type === "Public" ? "badge--public" : "badge--private"
                        }`}
                      >
                        {z.type}
                      </span>
                    </td>
                    <td>{z.created_by}</td>
                    <td>{z.record_count}</td>
                    <td>{z.comment || "-"}</td>
                    <td className="cell-mono">{z.zone_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      </div>

      {editZone && (
        <EditZoneModal
          zone={editZone}
          onClose={() => setEditZone(null)}
          onSaved={() => {
            setEditZone(null);
            load();
          }}
        />
      )}

      {deleteZone && (
        <ConfirmDeleteModal
          title="Delete hosted zone"
          requireText={deleteZone.name}
          message={
            <p>
              Are you sure you want to delete the hosted zone{" "}
              <strong>{deleteZone.name}</strong>? This will permanently delete
              the zone and all {deleteZone.record_count} of its records. This
              action cannot be undone.
            </p>
          }
          onClose={() => setDeleteZone(null)}
          onConfirm={async () => {
            await api.deleteZone(deleteZone.id);
            flash.success(`Hosted zone ${deleteZone.name} deleted.`);
            setDeleteZone(null);
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
