"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Breadcrumb, Crumb } from "./Breadcrumb";
import { Pagination } from "./Pagination";
import { InfoLink, RefreshIcon } from "./icons";

export interface ConsoleColumn {
  label: string;
}

export interface ConsoleAction {
  label: string;
  variant?: "secondary" | "outlined-orange";
  onClick?: () => void;
  disabled?: boolean;
  dropdown?: boolean;
}

export interface ConsoleListPageProps {
  breadcrumb: Crumb[];
  title: string;
  count?: number;
  info?: boolean;
  description?: string;
  actions?: ConsoleAction[];
  showRefresh?: boolean;
  filterPlaceholder?: string;
  columns?: ConsoleColumn[];
  emptyTitle?: string;
  emptyText?: string;
  emptyAction?: ConsoleAction;
  banner?: ReactNode;
  showPager?: boolean;
  showGear?: boolean;
  children?: ReactNode;
}

function actionClass(variant?: ConsoleAction["variant"]) {
  return variant === "outlined-orange" ? "btn btn--create" : "btn";
}

function ActionButton({ action }: { action: ConsoleAction }) {
  const label = action.dropdown ? `${action.label} ▾` : action.label;
  if (action.onClick) {
    return (
      <button
        type="button"
        className={actionClass(action.variant)}
        onClick={action.onClick}
        disabled={action.disabled}
      >
        {label}
      </button>
    );
  }
  if (action.disabled) {
    return (
      <button type="button" className={actionClass(action.variant)} disabled>
        {label}
      </button>
    );
  }
  return (
    <Link href="#" className={actionClass(action.variant)}>
      {label}
    </Link>
  );
}

export function ConsoleListPage({
  breadcrumb,
  title,
  count,
  info,
  description,
  actions,
  showRefresh,
  filterPlaceholder,
  columns,
  emptyTitle,
  emptyText,
  emptyAction,
  banner,
  showPager,
  showGear,
  children,
}: ConsoleListPageProps) {
  const hasColumns = !!columns && columns.length > 0;
  const pagerEnabled = showPager ?? hasColumns;

  const titleText =
    count !== undefined ? `${title} (${count})` : title;

  return (
    <div>
      <Breadcrumb items={breadcrumb} />

      {banner}

      <div className="page-header">
        <div>
          <h1>
            {titleText}
            {info && (
              <>
                {" "}
                <InfoLink />
              </>
            )}
          </h1>
        </div>
        <div className="page-header__actions">
          {showRefresh && (
            <button type="button" className="icon-btn" aria-label="Refresh">
              <RefreshIcon />
            </button>
          )}
          {actions?.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </div>
      </div>

      {description && <div className="helper-line">{description}</div>}

      <div className="container-box">
        {hasColumns ? (
          <>
            <div className="toolbar">
              {filterPlaceholder && (
                <div className="toolbar__search">
                  <input placeholder={filterPlaceholder} aria-label={filterPlaceholder} />
                </div>
              )}
              <div className="toolbar__spacer" />
              {pagerEnabled && (
                <Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />
              )}

            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns!.map((col) => (
                      <th key={col.label}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={columns!.length}>
                      <div className="empty-state">
                        {emptyTitle && <strong>{emptyTitle}</strong>}
                        {emptyText && <div>{emptyText}</div>}
                        {emptyAction && (
                          <div style={{ marginTop: 16 }}>
                            <ActionButton action={emptyAction} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
