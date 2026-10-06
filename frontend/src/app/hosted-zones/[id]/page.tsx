"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { HostedZone, DnsRecord } from "@/lib/types";
import { RECORD_TYPES } from "@/lib/types";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { RecordModal } from "@/components/RecordModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { useFlash } from "@/components/FlashbarProvider";

const PAGE_SIZE = 10;

export default function ZoneDetailPage() {
  const params = useParams();
  const zoneId = params.id as string;
  const flash = useFlash();

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [tab, setTab] = useState<"records" | "details">("records");

  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<DnsRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<DnsRecord | null>(null);

  useEffect(() => {
    api
      .getZone(zoneId)
      .then(setZone)
      .catch((err) => flash.error((err as Error).message));
  }, [zoneId, flash]);

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
      const data = await api.listRecords(zoneId, {
        search: debounced,
        type: typeFilter,
        page,
        page_size: PAGE_SIZE,
        sort,
        order,
      });
      setRecords(data.items);
      setTotal(data.total);
    } catch (err) {
      flash.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [zoneId, debounced, typeFilter, page, sort, order, flash]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshZone = () =>
    api.getZone(zoneId).then(setZone).catch(() => {});

  const toggleSort = (col: string) => {
    if (sort === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(col);
      setOrder("asc");
    }
  };
  const sortIndicator = (col: string) =>
    sort === col ? (order === "asc" ? " ▲" : " ▼") : "";

  const selectedRecord = records.find((r) => r.id === selected) || null;

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones", href: "/hosted-zones" },
          { label: zone?.name ?? "…" },
        ]}
      />

      <div className="page-header">
        <div>
          <h1>{zone?.name ?? "Loading…"}</h1>
          {zone && (
            <div className="desc">
              Hosted zone ID: <span className="cell-mono">{zone.zone_id}</span>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${tab === "records" ? "active" : ""}`}
          onClick={() => setTab("records")}
        >
          Records ({total})
        </button>
        <button
          className={`tab ${tab === "details" ? "active" : ""}`}
          onClick={() => setTab("details")}
        >
          Hosted zone details
        </button>
      </div>

      {tab === "details" && zone && (
        <div className="container-box">
          <div className="container-box__header">
            <h2>Hosted zone details</h2>
          </div>
          <div className="kv-grid">
            <div className="kv-item">
              <div className="kv-label">Hosted zone name</div>
              <div className="kv-value">{zone.name}</div>
            </div>
            <div className="kv-item">
              <div className="kv-label">Type</div>
              <div className="kv-value">{zone.type}</div>
            </div>
            <div className="kv-item">
              <div className="kv-label">Hosted zone ID</div>
              <div className="kv-value cell-mono">{zone.zone_id}</div>
            </div>
            <div className="kv-item">
              <div className="kv-label">Record count</div>
              <div className="kv-value">{zone.record_count}</div>
            </div>
            <div className="kv-item">
              <div className="kv-label">Description</div>
              <div className="kv-value">{zone.comment || "-"}</div>
            </div>
            <div className="kv-item">
              <div className="kv-label">Created</div>
              <div className="kv-value">
                {new Date(zone.created_at).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "records" && (
        <div className="container-box">
          <div className="container-box__header">
            <h2>
              Records <span className="count">({total})</span>
            </h2>
            <div className="page-header__actions">
              <button
                className="btn"
                disabled={!selectedRecord}
                onClick={() => selectedRecord && setEditRecord(selectedRecord)}
              >
                Edit record
              </button>
              <button
                className="btn"
                disabled={!selectedRecord}
                onClick={() =>
                  selectedRecord && setDeleteRecord(selectedRecord)
                }
              >
                Delete record
              </button>
              <button
                className="btn btn--primary"
                onClick={() => setShowCreate(true)}
              >
                Create record
              </button>
            </div>
          </div>

          <div className="toolbar">
            <div className="toolbar__search">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <input
                placeholder="Search records by name or value"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="select"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by record type"
            >
              <option value="">All types</option>
              {RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="loading-row">
                <span className="spinner" /> Loading records…
              </div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <strong>No records</strong>
                {debounced || typeFilter
                  ? "No records match your filters."
                  : "Create a record to get started."}
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-cell"></th>
                    <th className="sortable" onClick={() => toggleSort("name")}>
                      Record name{sortIndicator("name")}
                    </th>
                    <th className="sortable" onClick={() => toggleSort("type")}>
                      Type{sortIndicator("type")}
                    </th>
                    <th>Routing policy</th>
                    <th>Value</th>
                    <th className="sortable" onClick={() => toggleSort("ttl")}>
                      TTL{sortIndicator("ttl")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr
                      key={r.id}
                      className={selected === r.id ? "selected" : ""}
                      onClick={() => setSelected(r.id)}
                    >
                      <td className="checkbox-cell">
                        <input
                          type="radio"
                          name="record-select"
                          checked={selected === r.id}
                          onChange={() => setSelected(r.id)}
                          aria-label={`Select ${r.name}`}
                        />
                      </td>
                      <td>{r.name}</td>
                      <td>
                        <span className="record-type-badge">{r.type}</span>
                      </td>
                      <td>{r.routing_policy}</td>
                      <td className="cell-mono">{r.value}</td>
                      <td>{r.ttl}</td>
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
      )}

      {showCreate && zone && (
        <RecordModal
          zoneId={zoneId}
          zoneName={zone.name}
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            setPage(1);
            load();
            refreshZone();
          }}
        />
      )}

      {editRecord && zone && (
        <RecordModal
          zoneId={zoneId}
          zoneName={zone.name}
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={() => {
            setEditRecord(null);
            load();
          }}
        />
      )}

      {deleteRecord && (
        <ConfirmDeleteModal
          title="Delete record"
          message={
            <p>
              Are you sure you want to delete the{" "}
              <strong>{deleteRecord.type}</strong> record{" "}
              <strong>{deleteRecord.name}</strong>? This action cannot be undone.
            </p>
          }
          onClose={() => setDeleteRecord(null)}
          onConfirm={async () => {
            await api.deleteRecord(zoneId, deleteRecord.id);
            flash.success("Record deleted.");
            setDeleteRecord(null);
            setSelected(null);
            load();
            refreshZone();
          }}
        />
      )}
    </div>
  );
}
