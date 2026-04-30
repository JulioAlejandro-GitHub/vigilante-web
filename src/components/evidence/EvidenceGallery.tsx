import { useMemo, useState } from "react";

import { EvidenceFallback } from "./EvidenceFallback";
import { EvidenceImageCard, evidenceImageUrl } from "./EvidenceImageCard";
import { EvidenceViewerModal } from "./EvidenceViewerModal";
import type { EvidenceMediaItem } from "../../types/api";
import { dedupeEvidenceMedia } from "../../utils/evidence";

interface EvidenceGalleryProps {
  media?: EvidenceMediaItem[] | null;
  fallbackRefs?: string[];
  sourceEventId?: string | null;
  maxItems?: number;
}

export function EvidenceGallery({ media = [], fallbackRefs = [], sourceEventId, maxItems = 8 }: EvidenceGalleryProps) {
  const [selectedItem, setSelectedItem] = useState<EvidenceMediaItem | null>(null);
  const mediaItems = useMemo(() => dedupeEvidenceMedia(media ?? []), [media]);
  const visualItems = mediaItems.filter(isRenderableImageEvidence);
  const visibleItems = visualItems.slice(0, maxItems);
  const extraCount = Math.max(0, visualItems.length - visibleItems.length);
  const fallbackItems = mediaItems.filter((item) => !isRenderableImageEvidence(item));
  const unresolvedRefs = fallbackRefs.filter((ref) => !mediaItems.some((item) => item.ref === ref));

  if (visibleItems.length === 0) {
    return <EvidenceFallback fallbackRefs={fallbackRefs} mediaItems={mediaItems} sourceEventId={sourceEventId} />;
  }

  return (
    <div className="space-y-3" data-testid="evidence-gallery">
      <div className="grid gap-3 sm:grid-cols-2">
        {visibleItems.map((item) => (
          <EvidenceImageCard key={evidenceItemKey(item)} item={item} onOpen={setSelectedItem} />
        ))}
      </div>

      {extraCount > 0 ? (
        <div className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
          Showing first {visibleItems.length} of {visualItems.length} resolved image evidence items.
        </div>
      ) : null}

      {fallbackItems.length > 0 || unresolvedRefs.length > 0 ? (
        <EvidenceFallback fallbackRefs={unresolvedRefs} mediaItems={fallbackItems} sourceEventId={sourceEventId} compact />
      ) : null}

      {selectedItem ? <EvidenceViewerModal item={selectedItem} onClose={() => setSelectedItem(null)} /> : null}
    </div>
  );
}

function isRenderableImageEvidence(item: EvidenceMediaItem) {
  const contentType = item.content_type?.toLowerCase();
  const isImage = !contentType || contentType.startsWith("image/");
  return item.resolved !== false && isImage && Boolean(evidenceImageUrl(item));
}

function evidenceItemKey(item: EvidenceMediaItem) {
  return item.media_id || item.content_url || item.proxy_url || item.ref;
}
