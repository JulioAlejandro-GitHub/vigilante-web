import { useMemo } from "react";

import { EvidenceFallback } from "./EvidenceFallback";
import { EvidenceImageCard, evidenceItemKey, evidencePreviewUrl } from "./EvidenceImageCard";
import { EvidenceViewerModal } from "./EvidenceViewerModal";
import { useEvidenceViewer } from "../../hooks/useEvidenceViewer";
import type { EvidenceMediaItem } from "../../types/api";
import { dedupeEvidenceMedia } from "../../utils/evidence";

interface EvidenceGalleryProps {
  media?: EvidenceMediaItem[] | null;
  fallbackRefs?: string[];
  sourceEventId?: string | null;
  maxItems?: number;
}

export function EvidenceGallery({ media = [], fallbackRefs = [], sourceEventId, maxItems = 8 }: EvidenceGalleryProps) {
  const mediaItems = useMemo(() => sortEvidenceItems(dedupeEvidenceMedia(media ?? [])), [media]);
  const visualItems = mediaItems.filter(isRenderableImageEvidence);
  const visibleItems = visualItems.slice(0, maxItems);
  const extraCount = Math.max(0, visualItems.length - visibleItems.length);
  const fallbackItems = mediaItems.filter((item) => !isRenderableImageEvidence(item));
  const unresolvedRefs = fallbackRefs.filter((ref) => !mediaItems.some((item) => item.ref === ref));
  const viewer = useEvidenceViewer(visualItems);

  if (visibleItems.length === 0) {
    return <EvidenceFallback fallbackRefs={fallbackRefs} mediaItems={mediaItems} sourceEventId={sourceEventId} />;
  }

  return (
    <div className="space-y-3" data-testid="evidence-gallery">
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleItems.map((item, index) => (
          <EvidenceImageCard key={evidenceItemKey(item)} item={item} index={index} total={visualItems.length} onOpen={() => viewer.openAt(index)} />
        ))}
      </div>

      {extraCount > 0 ? (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          Showing first {visibleItems.length} of {visualItems.length} resolved image evidence items. Open any visible item to navigate the full set.
        </div>
      ) : null}

      {fallbackItems.length > 0 || unresolvedRefs.length > 0 ? (
        <EvidenceFallback fallbackRefs={unresolvedRefs} mediaItems={fallbackItems} sourceEventId={sourceEventId} compact />
      ) : null}

      {viewer.selectedItem ? (
        <EvidenceViewerModal
          items={visualItems}
          selectedIndex={viewer.selectedIndex}
          onClose={viewer.close}
          onSelect={viewer.goTo}
          onPrevious={viewer.goPrevious}
          onNext={viewer.goNext}
          hasPrevious={viewer.hasPrevious}
          hasNext={viewer.hasNext}
          positionLabel={viewer.positionLabel}
        />
      ) : null}
    </div>
  );
}

function isRenderableImageEvidence(item: EvidenceMediaItem) {
  const contentType = item.content_type?.toLowerCase();
  const isImage = !contentType || contentType.startsWith("image/");
  return item.resolved !== false && isImage && Boolean(evidencePreviewUrl(item));
}

function sortEvidenceItems(items: EvidenceMediaItem[]) {
  return [...items].sort((left, right) => {
    const leftValue = evidenceSortValue(left);
    const rightValue = evidenceSortValue(right);

    if (leftValue !== rightValue) {
      return leftValue.localeCompare(rightValue);
    }

    return evidenceItemKey(left).localeCompare(evidenceItemKey(right));
  });
}

function evidenceSortValue(item: EvidenceMediaItem) {
  return item.captured_at || item.last_modified_at || stringFromUnknown(item.metadata?.captured_at) || stringFromUnknown(item.metadata?.event_ts) || "";
}

function stringFromUnknown(value: unknown) {
  return typeof value === "string" ? value : "";
}
