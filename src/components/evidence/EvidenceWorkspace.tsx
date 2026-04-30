import { EvidenceSection } from "./EvidenceSection";
import { EvidenceMediaPanel } from "./EvidenceMediaPanel";
import { TechnicalMetadataGrid } from "./TechnicalMetadataGrid";
import type { EvidenceMediaItem } from "../../types/api";
import { dedupeEvidenceMedia, evidenceHighlights, extractEvidenceMedia, extractEvidenceRefs } from "../../utils/evidence";

interface EvidenceWorkspaceProps {
  payload: Record<string, unknown>;
  evidenceMedia?: EvidenceMediaItem[] | null;
  sourceEventId?: string | null;
  title?: string;
}

export function EvidenceWorkspace({ payload, evidenceMedia, sourceEventId, title = "Evidence workspace" }: EvidenceWorkspaceProps) {
  const highlights = evidenceHighlights(payload);
  const fallbackRefs = extractEvidenceRefs([payload]);
  const mediaItems = dedupeEvidenceMedia([...(evidenceMedia ?? []), ...extractEvidenceMedia(payload)]);
  const visualCount = mediaItems.filter((item) => item.resolved !== false && (item.thumbnail_url || item.content_url || item.proxy_url)).length;
  const technicalCount = Object.keys(payload ?? {}).length;

  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
            <p className="mt-1 text-sm text-zinc-600">Visual evidence is separated from structured technical context for faster review.</p>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-medium text-zinc-600">
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">{visualCount} visual</span>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">{fallbackRefs.length} refs</span>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1">{technicalCount} payload fields</span>
          </div>
        </div>
        <div className="mt-4">
          <TechnicalMetadataGrid rows={highlights} />
        </div>
      </div>

      <EvidenceMediaPanel evidenceMedia={mediaItems} fallbackRefs={fallbackRefs} sourceEventId={sourceEventId} />
      <EvidenceSection payload={payload} sourceEventId={sourceEventId} title="Technical evidence" showMediaSlot={false} />
    </section>
  );
}
