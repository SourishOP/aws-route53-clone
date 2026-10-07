"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { HostedZone } from "@/lib/types";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pagination } from "@/components/Pagination";
import { EditZoneModal } from "@/components/EditZoneModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { useFlash } from "@/components/FlashbarProvider";
import { RefreshIcon, InfoLink } from "@/components/icons";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import {
  PropertyFilter,
  PropertyFilterHandle,
  PropertyDefinition,
  FilterToken,
} from "@/components/PropertyFilter";
import { useSelection } from "@/components/useSelection";
import { useFilterFocus } from "@/components/FilterFocusProvider";
import { downloadText } from "@/lib/download";

const PAGE_SIZE = 10;

const DEFS: PropertyDefinition[] = [
  { key: "name", label: "Hosted zone name", operator: "contains" },
  {
    key: "type",
    label: "Type",
    operator: "equals",
    suggestedValues: ["Public", "Private"],
  },
  { key: "created_by", label: "Created by", operator: "contains" },
  { key: "record_count", label: "Record count", operator: "equals" },
  { key: "description", label: "Description", operator: "contains" },
  { key: "zone_id", label: "Hosted zone ID", operator: "contains" },
];

export default function HostedZonesPage() {
  const flash = useFlash();
  const filterFocus = useFilterFocus();
  const filterRef = useRef<PropertyFilterHandle>(null);

  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tokens, setTokens] = useState<FilterToken[]>([]);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [loading, setLoading] = useState(true);

  const sel = useSelection(zones.map((z) => z.id));
  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Register the page filter for the "/" shortcut.
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
      const data = await api.listZones({
        ...buildParams(),
        page,
        page_size: PAGE_SIZE,
        sort,
        order,
      });
      setZones(data.items);
      setTotal(data.total);
    } catch (err) {
      if ((err as { status?: number }).status !== 401) {
        flash.error((err as Error).message);
      }
    } finally {
      setLoading(false);
    }
  }, [buildParams, page, sort, order, flash]);

  useEffect(() => {
    load();
  }, [load]);

  // reset page + selection when filters change
  useEffect(() => {
    setPage(1);
    sel.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const toggleSort = (col: string) => {
    if (sort === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
    else {
      setSort(col);
      setOrder("asc");
    }
  };
  const sortIndicator = (col: string) =>
    sort === col ? (order === "asc" ? " ▲" : " ▼") : "";

  const selectedList = zones.filter((z) => sel.isSelected(z.id));
  const singleZone = sel.count === 1 ? selectedList[0] : null;

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current)
      headerCheckboxRef.current.indeterminate = sel.someSelected;
  }, [sel.someSelected]);

  const doExport = async (format: "json" | "bind") => {
    if (!singleZone) return;
    setExportOpen(false);
    try {
      const { filename, content } = await api.exportZone(singleZone.id, format);
      downloadText(filename, content, format === "json" ? "application/json" : "text/plain");
      flash.success(`Exported ${singleZone.name} as ${format.toUpperCase()}.`);
    } catch (err) {
      flash.error((err as Error).message);
    }
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Route 53", href: "/hosted-zones" },
          { label: "Hosted zones" },
        ]}
      />

      <div className="page-header">
        <div>
          <h1>
            Hosted zones ({total}) <InfoLink />
          </h1>
        </div>
        <div className="page-header__actions">
          <button className="icon-btn" aria-label="Refresh" onClick={() => load()}>
            <RefreshIcon />
          </button>
          <Link
            className="btn"
            href={singleZone ? `/hosted-zones/${singleZone.id}` : "#"}
            style={!singleZone ? { pointerEvents: "none", opacity: 0.5 } : {}}
          >
            View details
          </Link>
          <button
            className="btn"
            disabled={!singleZone}
            onClick={() => singleZone && setEditZone(singleZone)}
          >
            Edit
          </button>
          <div className="topnav__item-wrap" style={{ display: "inline-block" }}>
            <button
              className="btn"
              disabled={!singleZone}
              onClick={() => setExportOpen((o) => !o)}
            >
              Export ▾
            </button>
            {exportOpen && singleZone && (
              <div className="dropdown-menu" role="menu">
                <button className="dropdown-menu__item" onClick={() => doExport("json")}>
                  Export as JSON
                </button>
                <button className="dropdown-menu__item" onClick={() => doExport("bind")}>
                  Export as BIND
                </button>
              </div>
            )}
          </div>
          <button
            className="btn"
            disabled={sel.count === 0}
            onClick={() => setShowBulkDelete(true)}
          >
            Delete{sel.count > 0 ? ` (${sel.count})` : ""}
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
          <PropertyFilter
            ref={filterRef}
            definitions={DEFS}
            tokens={tokens}
            onChange={setTokens}
            placeholder="Filter records by property or value"
          />
          <div className="toolbar__spacer" />
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPageChange={(p) => {
              setPage(p);
              sel.clear();
            }}
          />
          <ThemeToggleButton />
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="loading-row">
              <span className="spinner" /> Loading hosted zones…
            </div>
          ) : zones.length === 0 ? (
            <div className="empty-state">
              <strong>No hosted zones</strong>
              <div>There are no hosted zones created for this account.</div>
              <div style={{ marginTop: 16 }}>
                <Link className="btn btn--create" href="/hosted-zones/create">
                  Create hosted zone
                </Link>
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
                    className={sel.isSelected(z.id) ? "selected" : ""}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("a")) return;
                      sel.toggle(z.id);
                    }}
                  >
                    <td
                      className="checkbox-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={sel.isSelected(z.id)}
                        onChange={() => sel.toggle(z.id)}
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
          onPageChange={(p) => {
            setPage(p);
            sel.clear();
          }}
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

      {showBulkDelete && (
        <ConfirmDeleteModal
          title={`Delete ${sel.count} hosted zone${sel.count > 1 ? "s" : ""}`}
          message={
            <div>
              <p>
                Are you sure you want to delete {sel.count} hosted zone
                {sel.count > 1 ? "s" : ""}? This permanently deletes the zone
                {sel.count > 1 ? "s" : ""} and all records. This cannot be
                undone.
              </p>
              <ul>
                {selectedList.map((z) => (
                  <li key={z.id}>{z.name}</li>
                ))}
              </ul>
            </div>
          }
          onClose={() => setShowBulkDelete(false)}
          onConfirm={async () => {
            const ids = selectedList.map((z) => z.id);
            let ok = 0;
            let fail = 0;
            for (const id of ids) {
              try {
                await api.deleteZone(id);
                ok++;
              } catch {
                fail++;
              }
            }
            setShowBulkDelete(false);
            sel.clear();
            if (fail) flash.error(`${ok} deleted, ${fail} failed.`);
            else flash.success(`${ok} hosted zone${ok > 1 ? "s" : ""} deleted.`);
            setPage(1);
            load();
          }}
        />
      )}
    </div>
  );
}
