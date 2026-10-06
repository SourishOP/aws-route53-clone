"use client";

import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <Fragment key={i}>
            {c.href && !isLast ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span className={isLast ? "current" : ""}>{c.label}</span>
            )}
            {!isLast && <span className="sep">/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}
