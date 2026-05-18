import { useCallback, useEffect, useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import { usePriorityEvents } from "./usePriorityEvents";
import type { TimelineEvent, TimelineListParams } from "../../../types/api";
import { asErrorMessage } from "../../../utils/format";

interface UseControlCenterEventsOptions {
  limit?: number;
  pollMs?: number;
  previewLimit?: number;
  filters?: Pick<TimelineListParams, "organization_id" | "site_id" | "camera_id" | "subject_id">;
  enabled?: boolean;
}

export function useControlCenterEvents({ limit = 20, pollMs = 15000, previewLimit = 0, filters = {}, enabled = true }: UseControlCenterEventsOptions = {}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const filtersKey = JSON.stringify(filters);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "more" = "refresh", requestedOffset = 0) => {
      if (!enabled) {
        setEvents([]);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setNextOffset(0);
        setError(null);
        return;
      }
      if (mode === "initial") {
        setLoading(true);
      } else if (mode === "more") {
        setLoadingMore(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const offset = mode === "more" ? requestedOffset : 0;
        const next = await controlCenterApi.listRecentEvents({ limit, offset, include_evidence: false, ...filters });
        setNextOffset(next.length >= limit ? offset + next.length : null);
        setEvents((current) => sortEventsDesc(dedupeEvents(mode === "more" ? [...current, ...next] : next)));
        setLastUpdatedAt(new Date().toISOString());
      } catch (caught) {
        setError(asErrorMessage(caught));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, limit, filtersKey],
  );

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setLoading(false);
      setNextOffset(0);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    controlCenterApi
      .listRecentEvents({ limit, offset: 0, include_evidence: false, ...filters })
      .then((next) => {
        if (active) {
          setEvents(sortEventsDesc(dedupeEvents(next)));
          setNextOffset(next.length >= limit ? next.length : null);
          setLastUpdatedAt(new Date().toISOString());
        }
      })
      .catch((caught) => {
        if (active) {
          setError(asErrorMessage(caught));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, limit, filtersKey]);

  useEffect(() => {
    if (!enabled || pollMs <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void load("refresh");
    }, pollMs);

    return () => window.clearInterval(interval);
  }, [load, pollMs]);

  const groups = usePriorityEvents(events, { enabled, previewLimit });

  return {
    events,
    groups,
    loading,
    refreshing,
    loadingMore,
    hasMore: nextOffset !== null,
    error,
    lastUpdatedAt,
    refresh: () => void load("refresh"),
    loadMore: () => {
      if (nextOffset !== null && !loadingMore) {
        void load("more", nextOffset);
      }
    },
  };
}

function dedupeEvents(events: TimelineEvent[]) {
  const seen = new Set<string>();
  const deduped: TimelineEvent[] = [];

  for (const event of events) {
    const key = event.source_event_id || `${event.event_type}:${event.event_ts}:${event.camera_id ?? ""}:${event.subject_id ?? ""}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(event);
  }

  return deduped;
}

function sortEventsDesc(events: TimelineEvent[]) {
  return [...events].sort((left, right) => new Date(right.event_ts).getTime() - new Date(left.event_ts).getTime());
}
