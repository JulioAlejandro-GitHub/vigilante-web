import { Image } from "lucide-react";

import { EvidenceGallery } from "./EvidenceGallery";
import type { EvidenceMediaItem } from "../../types/api";

interface EvidenceMediaPanelProps {
  evidenceMedia?: EvidenceMediaItem[] | null;
  fallbackRefs?: string[];
  sourceEventId?: string | null;
  title?: string;
}

export function EvidenceMediaPanel({
  evidenceMedia = [],
  fallbackRefs = [],
  sourceEventId,
  title = "Visual evidence",
}: EvidenceMediaPanelProps) {
  const resolvedCount = (evidenceMedia ?? []).filter((item) => item.resolved !== false && (item.content_url || item.proxy_url)).length;

  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">Real image evidence served by backend media URLs, with technical fallback preserved.</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
          <Image className="h-3.5 w-3.5" aria-hidden="true" />
          {resolvedCount}
        </span>
      </div>

      <div className="mt-4">
        <EvidenceGallery media={evidenceMedia} fallbackRefs={fallbackRefs} sourceEventId={sourceEventId} />
      </div>
    </section>
  );
}
