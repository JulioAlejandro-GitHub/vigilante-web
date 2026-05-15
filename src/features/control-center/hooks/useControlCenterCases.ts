import { useCallback, useEffect, useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import type { ControlCenterCaseBundle } from "../types/controlCenter.types";
import type { CaseDetail, EvidenceMediaItem, TimelineEvent } from "../../../types/api";
import { asErrorMessage } from "../../../utils/format";

const CASE_TIMELINE_PAGE_SIZE = 6;
const EVIDENCE_PAGE_SIZE = 6;

interface UseControlCenterCasesOptions {
  caseId: string | null;
  sourceEventId: string | null;
}

export function useControlCenterCases({ caseId, sourceEventId }: UseControlCenterCasesOptions): ControlCenterCaseBundle {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [evidence, setEvidence] = useState<EvidenceMediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineLoadingMore, setTimelineLoadingMore] = useState(false);
  const [timelineNextOffset, setTimelineNextOffset] = useState<number | null>(0);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceLoadingMore, setEvidenceLoadingMore] = useState(false);
  const [evidenceNextOffset, setEvidenceNextOffset] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const loadSummary = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (!caseId) {
        setDetail(null);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        setDetail(await controlCenterApi.getCaseSummary(caseId));
      } catch (caught) {
        setError(asErrorMessage(caught));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [caseId],
  );

  const loadTimelinePage = useCallback(
    async (offset: number, mode: "initial" | "more" = "initial") => {
      if (!caseId) {
        setTimeline([]);
        setTimelineNextOffset(0);
        setTimelineLoading(false);
        setTimelineLoadingMore(false);
        return;
      }
      if (mode === "more") {
        setTimelineLoadingMore(true);
      } else {
        setTimelineLoading(true);
      }
      try {
        const next = await controlCenterApi.getCaseTimeline(caseId, {
          limit: CASE_TIMELINE_PAGE_SIZE,
          offset,
          include_evidence: false,
        });
        setTimeline((current) => (mode === "more" ? dedupeTimeline([...current, ...next]) : next));
        setTimelineNextOffset(next.length >= CASE_TIMELINE_PAGE_SIZE ? offset + next.length : null);
      } catch (caught) {
        setError(asErrorMessage(caught));
      } finally {
        setTimelineLoading(false);
        setTimelineLoadingMore(false);
      }
    },
    [caseId],
  );

  const loadEvidencePage = useCallback(
    async (offset: number, mode: "initial" | "more" = "initial") => {
      if (!caseId && !sourceEventId) {
        setEvidence([]);
        setEvidenceNextOffset(0);
        setEvidenceLoading(false);
        setEvidenceLoadingMore(false);
        setEvidenceError(null);
        return;
      }
      if (mode === "more") {
        setEvidenceLoadingMore(true);
      } else {
        setEvidenceLoading(true);
      }
      setEvidenceError(null);
      try {
        const page =
          caseId !== null
            ? await controlCenterApi.listCaseEvidence(caseId, {
                limit: EVIDENCE_PAGE_SIZE,
                offset,
                source_event_id: sourceEventId,
              })
            : await controlCenterApi.listTimelineEvidence(sourceEventId!, {
                limit: EVIDENCE_PAGE_SIZE,
                offset,
              });
        setEvidence((current) => (mode === "more" ? dedupeEvidence([...current, ...page.items]) : page.items));
        setEvidenceNextOffset(page.next_offset);
      } catch (caught) {
        setEvidenceError(asErrorMessage(caught));
      } finally {
        setEvidenceLoading(false);
        setEvidenceLoadingMore(false);
      }
    },
    [caseId, sourceEventId],
  );

  useEffect(() => {
    setTimeline([]);
    setEvidence([]);
    setTimelineNextOffset(0);
    setEvidenceNextOffset(0);
    void loadSummary("initial");
    void loadTimelinePage(0, "initial");
    void loadEvidencePage(0, "initial");
  }, [loadSummary, loadTimelinePage, loadEvidencePage]);

  return {
    detail,
    timeline,
    evidence,
    loading,
    refreshing,
    timelineLoading,
    timelineLoadingMore,
    timelineHasMore: timelineNextOffset !== null,
    evidenceLoading,
    evidenceLoadingMore,
    evidenceHasMore: evidenceNextOffset !== null,
    error,
    evidenceError,
    refresh: () => {
      void loadSummary("refresh");
      void loadTimelinePage(0, "initial");
      void loadEvidencePage(0, "initial");
    },
    loadMoreTimeline: () => {
      if (timelineNextOffset !== null && !timelineLoadingMore) {
        void loadTimelinePage(timelineNextOffset, "more");
      }
    },
    loadMoreEvidence: () => {
      if (evidenceNextOffset !== null && !evidenceLoadingMore) {
        void loadEvidencePage(evidenceNextOffset, "more");
      }
    },
  };
}

function dedupeTimeline(events: TimelineEvent[]) {
  const seen = new Set<string>();
  const deduped: TimelineEvent[] = [];
  for (const event of events) {
    const key = `${event.source_component}:${event.source_event_id}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(event);
  }
  return deduped;
}

function dedupeEvidence(items: EvidenceMediaItem[]) {
  const seen = new Set<string>();
  const deduped: EvidenceMediaItem[] = [];
  for (const item of items) {
    const key = item.media_id || item.ref || item.thumbnail_url || item.content_url || "";
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}
