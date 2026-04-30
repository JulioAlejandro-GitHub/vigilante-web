import { useCallback, useEffect, useMemo, useState } from "react";

import type { EvidenceMediaItem } from "../types/api";

export function useEvidenceViewer(items: EvidenceMediaItem[]) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= items.length) {
      setSelectedIndex(null);
    }
  }, [items.length, selectedIndex]);

  const selectedItem = useMemo(() => {
    if (selectedIndex === null) {
      return null;
    }
    return items[selectedIndex] ?? null;
  }, [items, selectedIndex]);

  const openAt = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) {
        return;
      }
      setSelectedIndex(index);
    },
    [items.length],
  );

  const close = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= items.length) {
        return;
      }
      setSelectedIndex(index);
    },
    [items.length],
  );

  const goPrevious = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null) {
        return current;
      }
      return Math.max(0, current - 1);
    });
  }, []);

  const goNext = useCallback(() => {
    setSelectedIndex((current) => {
      if (current === null) {
        return current;
      }
      return Math.min(items.length - 1, current + 1);
    });
  }, [items.length]);

  return {
    selectedIndex,
    selectedItem,
    openAt,
    close,
    goTo,
    goPrevious,
    goNext,
    hasPrevious: selectedIndex !== null && selectedIndex > 0,
    hasNext: selectedIndex !== null && selectedIndex < items.length - 1,
    positionLabel: selectedIndex !== null ? `${selectedIndex + 1} / ${items.length}` : `0 / ${items.length}`,
  };
}
