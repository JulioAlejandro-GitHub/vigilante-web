import { useEffect, useMemo, useState } from "react";

import type { ControlCenterEvidenceItem } from "../types/controlCenter.types";
import type { CaseDetail, EvidenceMediaItem, TimelineEvent } from "../../../types/api";
import { dedupeEvidenceMedia, extractEvidenceMedia, summarizeValue } from "../../../utils/evidence";

interface UseCaseEvidenceOptions {
  caseDetail: CaseDetail | null;
  selectedEvent: TimelineEvent | null;
  resolvedEvidence?: EvidenceMediaItem[];
  initialVisibleCount?: number;
}

export function useCaseEvidence({ caseDetail, selectedEvent, resolvedEvidence = [], initialVisibleCount = 6 }: UseCaseEvidenceOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  const items = useMemo(() => {
    const rawItems: EvidenceMediaItem[] = [];
    rawItems.push(...resolvedEvidence);
    if (selectedEvent) {
      rawItems.push(...(selectedEvent.evidence_media ?? []), ...extractEvidenceMedia(selectedEvent.payload));
    }
    if (caseDetail) {
      rawItems.push(...(caseDetail.evidence_media ?? []), ...extractEvidenceMedia(caseDetail.case_payload));
      caseDetail.timeline.forEach((event) => {
        rawItems.push(...(event.evidence_media ?? []), ...extractEvidenceMedia(event.payload));
      });
      caseDetail.reviews.forEach((review) => {
        rawItems.push(...(review.evidence_media ?? []), ...extractEvidenceMedia(review.payload));
      });
      caseDetail.suggestions.forEach((suggestion) => {
        rawItems.push(...(suggestion.evidence_media ?? []), ...extractEvidenceMedia(suggestion.payload));
      });
    }
    return sortEvidence(dedupeEvidenceMedia(rawItems).map(enrichEvidenceItem));
  }, [caseDetail, resolvedEvidence, selectedEvent]);

  useEffect(() => {
    setSelectedIndex(0);
    setVisibleCount(initialVisibleCount);
  }, [caseDetail?.case_id, selectedEvent?.source_event_id, initialVisibleCount]);

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  const selectedItem = items[selectedIndex] ?? null;
  const visibleItems = resolvedEvidence.length > 0 ? items : items.slice(0, visibleCount);
  const canShowMore = resolvedEvidence.length === 0 && visibleCount < items.length;

  return {
    items,
    visibleItems,
    selectedItem,
    selectedIndex,
    visibleCount,
    canShowMore,
    setSelectedIndex,
    showMore: () => setVisibleCount((current) => Math.min(items.length, current + initialVisibleCount)),
  };
}

function enrichEvidenceItem(item: EvidenceMediaItem): ControlCenterEvidenceItem {
  const metadata = item.metadata ?? {};
  const kind = evidenceKind(item);
  return {
    ...item,
    control_center_kind: kind,
    control_center_label: evidenceLabel(item, kind),
    control_center_score: numberFromUnknown(
      metadata.confidence ?? metadata.score ?? metadata.match_confidence ?? metadata.face_confidence ?? item.confidence,
    ),
  };
}

function evidenceKind(item: EvidenceMediaItem) {
  const haystack = [item.media_type, item.content_type, item.ref, summarizeValue(item.metadata)].filter(Boolean).join(" ").toLowerCase();
  if (item.clip_available || item.clip_url || haystack.includes("clip") || haystack.includes("video")) return "clip";
  if (haystack.includes("face") || haystack.includes("rostro")) return "face";
  if (haystack.includes("body") || haystack.includes("person") || haystack.includes("full_body")) return "body";
  if (haystack.includes("match")) return "match";
  if (haystack.includes("cross") || haystack.includes("camera")) return "cross-camera";
  if (haystack.includes("recurrence") || haystack.includes("recurrent")) return "recurrence";
  if (haystack.includes("context")) return "context";
  if (haystack.includes("frame")) return "frame";
  return "evidence";
}

function evidenceLabel(item: EvidenceMediaItem, kind: string) {
  if (item.media_type) {
    return item.media_type;
  }
  if (kind === "face") return "face";
  if (kind === "body") return "body";
  if (kind === "clip") return "clip";
  if (kind === "cross-camera") return "cross-camera";
  return "frame";
}

function sortEvidence(items: ControlCenterEvidenceItem[]) {
  return [...items].sort((left, right) => {
    const leftPrimary = priority(left);
    const rightPrimary = priority(right);
    if (leftPrimary !== rightPrimary) {
      return leftPrimary - rightPrimary;
    }
    return evidenceTime(right).localeCompare(evidenceTime(left));
  });
}

function priority(item: ControlCenterEvidenceItem) {
  if (item.control_center_kind === "face") return 0;
  if (item.control_center_kind === "match") return 1;
  if (item.control_center_kind === "body") return 2;
  if (item.control_center_kind === "frame" || item.control_center_kind === "context") return 3;
  return 4;
}

function evidenceTime(item: EvidenceMediaItem) {
  return item.captured_at || item.last_modified_at || String(item.metadata?.captured_at ?? item.metadata?.event_ts ?? "");
}

function numberFromUnknown(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
