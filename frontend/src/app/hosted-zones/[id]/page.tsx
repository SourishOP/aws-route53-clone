"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import type { HostedZone, DnsRecord } from "@/lib/types";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { RecordModal } from "@/components/RecordModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { ImportRecordsModal } from "@/components/ImportRecordsModal";
import { useFlash } from "@/components/FlashbarProvider";
import {
  PropertyFilter,
  PropertyFilterHandle,
  PropertyDefinition,
  FilterToken,
} from "@/components/PropertyFilter";
import { useSelection } from "@/components/useSelection";
import { useFilterFocus } from "@/components/FilterFocusProvider";
import { RECORD_TYPES } from "@/lib/types";
import { downloadText } from "@/lib/download";

const PAGE_SIZE = 10;

function distinct(values: (string | number)[]): string[] {
  return Array.from(new Set(values.map((v) => String(v)))).sort();
}

export default function ZoneDetailPage() {
  const params = useParams();
  const zoneId = params.id as string;
  const flash = useFlash();
  const filterFocus = useFilterFocus();
  const filterRef = useRef<PropertyFilterHandle>(null);

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [tab, setTab] = useState<"records" | "details">("records");

  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [allRecords, setAllRecords] = useState<DnsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tokens, setTokens] = useState<FilterToken[]>([]);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  const sel = useSelection(records.map((r) => r.id));
  const [showCreate, setShowCreate] = useState(false);
  const [editRecord, setEditRecord] = useState<DnsRecord | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    api
      .getZone(zoneId)
      .then(setZone)
      .catch((err) => {
        if ((err as { status?: number }).status !== 401) {
          flash.error((err as Error).message);
        }
      });
  }, [zoneId, flash]);

  // "c" shortcut on a zone page opens Create record.
  useEffect(() => {
    const h = () => setShowCreate(true);
    window.addEventListener("r53:create-record", h);
    return () => window.removeEventListener("r53:create-record", h);
  }, []);

  useEffect(() => filterFocus.register(() => filterRef.current?.focus()), [
    filterFocus,
  ]);

  const buildParams = useCallback(() => {
    const p: Record<string, string> = {};
    const free: string[] = [];
    for (const t of tokens) {
      if (t.property === "") free.push(t.value);
      else p[t.property] = t.value;
    }
    if (free.length) p.search = free.join(" ");
    return p;
  }, [tokens]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listRecords(zoneId, {
        ...buildParams(),
        page,
        page_size: PAGE_SIZE,
        sort,
        order,
      });
      setRecords(data.items);
      setTotal(data.total);
    } catch (err) {
      if ((err as { status?: number }).status !== 401) {
        flash.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [zoneId, buildParams, page, sort, order, flash]);

  useEffect(() => {
    load();
  }, [load]);

  // Fetch an unfiltered snapshot of the zone's records to build the filter's
  // value suggestions (so every real name/value/TTL is pickable, not typed).
  const loadAll = useCallback(async () => {
    try {
      const data = await api.listRecords(zoneId, { page: 1, page_size: 100 });
      setAllRecords(data.items);
    } catch {
      /* suggestions are best-effort */
    }
  }, [zoneId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Property definitions with real, pickable value suggestions per property.
  const DEFS: PropertyDefinition[] = useMemo(
    () => [
      {
        key: "name",
        label: "Record name",
        operator: "contains",
        suggestedValues: distinct(allRecords.map((r) => r.name)),
      },
      {
        key: "type",
        label: "Type",
        operator: "equals",
        // Only the types that actually exist in this zone, falling back to all.
        suggestedValues: allRecords.length
          ? distinct(allRecords.map((r) => r.type))
          : [...RECORD_TYPES],
      },
      {
        key: "value",
        label: "Value",
        operator: "contains",
        suggestedValues: distinct(allRecords.map((r) => r.value)),
      },
      {
        key: "ttl",
        label: "TTL",
        operator: "equals",
        suggestedValues: distinct(allRecords.map((r) => r.ttl)),
      },
      {
        key: "routing_policy",
        label: "Routing policy",
        operator: "contains",
        suggestedValues: distinct(allRecords.map((r) => r.routing_policy)),
      },
    ],
    [allRecords]
  );

  useEffect(() => {
    setPage(1);
    sel.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const refreshZone = () => {
    api.getZone(zoneId).then(setZone).catch(() => {});
    loadAll(); // keep filter suggestions in sync after mutations
  };

  const toggleSort = (col: string) => {
    if (sort === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(col);
      setOrder("asc");
    }
  };
  const sortIndicator = (col: string) =>
    sort === col ? (order === "asc" ? " ▲" : " ▼") : "";

  const selectedList = records.filter((r) => sel.isSelected(r.id));
  const singleRecord = sel.count === 1 ? selectedList[0] : null;

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current)
      headerCheckboxRef.current.indeterminate = sel.someSelected;
  }, [sel.someSelected]);

  const doExport = async (format: "json" | "bind") => {
    setExportOpen(false);
    try {
      const { filename, content } = await api.exportZone(zoneId, format);
      downloadText(
        filename,
        content,
        format === "json" ? "application/json" : "text/plain"
      );
      flash.success(`Exported zone as ${format.toUpperCase()}.`);
    } catch (err) {
      flash.error((err as Error).message);
    }
  };

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
              <button className="btn" onClick={() => setShowImport(true)}>
                Import records
              </button>
              <div
                className="topnav__item-wrap"
                style={{ display: "inline-block" }}
              >
                <button className="btn" onClick={() => setExportOpen((o) => !o)}>
                  Export ▾
                </button>
                {exportOpen && (
                  <div className="dropdown-menu" role="menu">
                    <button
                      className="dropdown-menu__item"
                      onClick={() => doExport("json")}
                    >
                      Export as JSON
                    </button>
                    <button
                      className="dropdown-menu__item"
                      onClick={() => doExport("bind")}
                    >
                      Export as BIND
                    </button>
                  </div>
                )}
              </div>
              <button
                className="btn"
                disabled={!singleRecord}
                onClick={() => singleRecord && setEditRecord(singleRecord)}
              >
                Edit record
              </button>
              <button
                className="btn"
                disabled={sel.count === 0}
                onClick={() => setShowBulkDelete(true)}
              >
                Delete record{sel.count > 0 ? ` (${sel.count})` : ""}
              </button>
              <button
                className="btn btn--create"
                onClick={() => setShowCreate(true)}
              >
                Create record
              </button>
            </div>
          </div>

          <div className="toolbar">
            <PropertyFilter
              ref={filterRef}
              definitions={DEFS}
              tokens={tokens}
              onChange={setTokens}
              placeholder="Filter records by property or value"
            />
          </div>

          <div className="table-wrap">
            {loading ? (
              <div className="loading-row">
                <span className="spinner" /> Loading records…
              </div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <strong>No records</strong>
                <div>
                  {tokens.length
                    ? "No records match your filters."
                    : "Create a record to get started."}
                </div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-cell">
                      <input
                        ref={headerCheckboxRef}
                        type="checkbox"
                        checked={sel.allSelected}
                        onChange={sel.toggleAll}
                        aria-label="Select all"
                      />
                    </th>
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
                      className={sel.isSelected(r.id) ? "selected" : ""}
                      onClick={() => sel.toggle(r.id)}
                    >
                      <td
                        className="checkbox-cell"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={sel.isSelected(r.id)}
                          onChange={() => sel.toggle(r.id)}
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
            onPageChange={(p) => {
              setPage(p);
              sel.clear();
            }}
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

      {showImport && (
        <ImportRecordsModal
          zoneId={zoneId}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            setPage(1);
            load();
            refreshZone();
          }}
        />
      )}

      {showBulkDelete && (
        <ConfirmDeleteModal
          title={`Delete ${sel.count} record${sel.count > 1 ? "s" : ""}`}
          message={
            <div>
              <p>
                Are you sure you want to delete {sel.count} record
                {sel.count > 1 ? "s" : ""}? This cannot be undone.
              </p>
              <ul>
                {selectedList.map((r) => (
                  <li key={r.id}>
                    {r.type} {r.name}
                  </li>
                ))}
              </ul>
            </div>
          }
          onClose={() => setShowBulkDelete(false)}
          onConfirm={async () => {
            const ids = selectedList.map((r) => r.id);
            let ok = 0;
            let fail = 0;
            for (const id of ids) {
              try {
                await api.deleteRecord(zoneId, id);
                ok++;
              } catch {
                fail++;
              }
            }
            setShowBulkDelete(false);
            sel.clear();
            if (fail) flash.error(`${ok} deleted, ${fail} failed.`);
            else flash.success(`${ok} record${ok > 1 ? "s" : ""} deleted.`);
            load();
            refreshZone();
          }}
        />
      )}
    </div>
  );
}
