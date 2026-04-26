import { useEffect, useMemo, useState } from "react";

export function useBulkSelection(visibleIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const visibleIdKey = visibleIds.join("|");

  useEffect(() => {
    setSelectedIds((current) => {
      const visible = new Set(visibleIds);
      return new Set([...current].filter((id) => visible.has(id)));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIdKey]);

  const selectedList = useMemo(() => [...selectedIds], [selectedIds]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAllVisible() {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    selectedIds,
    selectedList,
    selectedCount: selectedIds.size,
    allVisibleSelected,
    isSelected: (id: string) => selectedIds.has(id),
    toggle,
    toggleAllVisible,
    clearSelection,
  };
}
