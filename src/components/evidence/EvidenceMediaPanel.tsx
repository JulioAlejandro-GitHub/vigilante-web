import { AlertTriangle, FileText, Image, Video } from "lucide-react";
import type { ReactNode } from "react";

import { EvidenceGallery } from "./EvidenceGallery";
import { evidencePreviewUrl } from "./EvidenceImageCard";
import type { EvidenceMediaItem } from "../../types/api";
import { dedupeEvidenceMedia } from "../../utils/evidence";

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
  const mediaItems = dedupeEvidenceMedia(evidenceMedia ?? []);
  const resolvedCount = mediaItems.filter((item) => item.resolved !== false && evidencePreviewUrl(item)).length;
  const unresolvedCount = mediaItems.filter((item) => item.resolved === false || item.error || !evidencePreviewUrl(item)).length;
  const clipCount = mediaItems.filter((item) => item.resolved !== false && item.clip_available && item.clip_url).length;
  const refCount = fallbackRefs.length;

  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          <p className="mt-1 text-sm text-zinc-600">Thumbnail previews stay light; originals load only inside the forensic viewer.</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <EvidenceCount icon={<Image className="h-3.5 w-3.5" aria-hidden="true" />} label="images" value={resolvedCount} />
          {clipCount > 0 ? (
            <EvidenceCount icon={<Video className="h-3.5 w-3.5" aria-hidden="true" />} label={clipCount === 1 ? "clip" : "clips"} value={clipCount} />
          ) : null}
          {unresolvedCount > 0 ? <EvidenceCount icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />} label="unresolved" value={unresolvedCount} /> : null}
          {refCount > 0 ? <EvidenceCount icon={<FileText className="h-3.5 w-3.5" aria-hidden="true" />} label="refs" value={refCount} /> : null}
        </div>
      </div>

      <div className="mt-4">
        <EvidenceGallery media={mediaItems} fallbackRefs={fallbackRefs} sourceEventId={sourceEventId} />
      </div>
    </section>
  );
}

function EvidenceCount({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
      {icon}
      {value} {label}
    </span>
  );
}
