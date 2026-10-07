"use client";

import { useState, useCallback } from "react";

/** Multi-select state for a table page, keyed by row id. */
export function useSelection(pageIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someSelected = pageIds.some((id) => selected.has(id)) && !allSelected;

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const all = pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      if (all) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      pageIds.forEach((id) => next.add(id));
      return next;
    });
  }, [pageIds]);

  return {
    selected,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
    count: selected.size,
  };
}
