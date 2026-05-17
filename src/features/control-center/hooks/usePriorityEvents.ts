import { useEffect, useMemo, useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import type { ControlCenterEventGroup } from "../types/controlCenter.types";
import { buildPriorityInsight, comparePriorityGroups } from "../utils/priority";
import type { EvidenceMediaItem, TimelineEvent } from "../../../types/api";

interface UsePriorityEventsOptions {
  enabled?: boolean;
  previewLimit?: number;
}

export function usePriorityEvents(events: TimelineEvent[], { enabled = true, previewLimit = 5 }: UsePriorityEventsOptions = {}) {
  const baseGroups = useMemo(() => groupEvents(events), [events]);
  const [previewByEventId, setPreviewByEventId] = useState<Record<string, EvidenceMediaItem | null>>({});

  const previewTargetIds = useMemo(
    () =>
      baseGroups
        .filter((group) => group.priority.hasVisualEvidence && !firstRenderableEvidence(group.event))
        .slice(0, previewLimit)
        .map((group) => group.event.source_event_id)
        .filter(Boolean),
    [baseGroups, previewLimit],
  );
  const previewTargetKey = previewTargetIds.join("|");

  useEffect(() => {
    if (!enabled || previewTargetIds.length === 0) {
      return;
    }
    const missing = previewTargetIds.filter((sourceEventId) => !(sourceEventId in previewByEventId));
    if (missing.length === 0) {
      return;
    }

    let active = true;
    void Promise.all(
      missing.map(async (sourceEventId) => {
        try {
          const page = await controlCenterApi.listTimelineEvidence(sourceEventId, { limit: 1, offset: 0 });
          return [sourceEventId, page.items?.[0] ?? null] as const;
        } catch {
          return [sourceEventId, null] as const;
        }
      }),
    ).then((resolved) => {
      if (!active) {
        return;
      }
      setPreviewByEventId((current) => {
        const next = { ...current };
        resolved.forEach(([sourceEventId, item]) => {
          next[sourceEventId] = item;
        });
        return next;
      });
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, previewTargetKey]);

  return useMemo(
    () =>
      baseGroups.map((group) => ({
        ...group,
        previewEvidence: firstRenderableEvidence(group.event) ?? previewByEventId[group.event.source_event_id] ?? null,
      })),
    [baseGroups, previewByEventId],
  );
}

function groupEvents(events: TimelineEvent[]): ControlCenterEventGroup[] {
  const groups = new Map<string, TimelineEvent[]>();

  for (const event of events) {
    const key = eventGroupKey(event);
    const current = groups.get(key) ?? [];
    current.push(event);
    groups.set(key, current);
  }

  return Array.from(groups.entries())
    .map(([id, groupedEvents]) => {
      const sortedEvents = [...groupedEvents].sort((left, right) => {
        const leftPriority = buildPriorityInsight(left, groupedEvents);
        const rightPriority = buildPriorityInsight(right, groupedEvents);
        return comparePriorityGroups({ event: left, priority: leftPriority }, { event: right, priority: rightPriority });
      });
      const representative = sortedEvents[0];
      return {
        id,
        event: representative,
        groupedEvents: [...groupedEvents].sort((left, right) => new Date(right.event_ts).getTime() - new Date(left.event_ts).getTime()),
        relatedCount: groupedEvents.length,
        priority: buildPriorityInsight(representative, groupedEvents),
        previewEvidence: null,
      };
    })
    .sort(comparePriorityGroups);
}

function eventGroupKey(event: TimelineEvent) {
  if (event.case_id) {
    return `case:${event.case_id}`;
  }
  if (event.subject_id) {
    return `subject:${event.subject_id}`;
  }
  if (event.track_id) {
    return `track:${event.track_id}`;
  }
  return `event:${event.source_event_id}`;
}

function firstRenderableEvidence(event: TimelineEvent) {
  return (
    (event.evidence_media ?? []).find(
      (item) => item.resolved !== false && Boolean(item.thumbnail_url || item.content_url || item.proxy_url || item.clip_url),
    ) ?? null
  );
}
