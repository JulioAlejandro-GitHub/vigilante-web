import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Image, Maximize2 } from "lucide-react";

import type { EvidenceMediaItem } from "../../types/api";
import { formatDateTime, shortId } from "../../utils/format";

interface EvidenceImageCardProps {
  item: EvidenceMediaItem;
  onOpen: () => void;
  index?: number;
  total?: number;
}

export function EvidenceImageCard({ item, onOpen, index, total }: EvidenceImageCardProps) {
  const imageUrl = evidencePreviewUrl(item);
  const viewerUrl = evidenceOriginalImageUrl(item);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(imageUrl ? "loading" : "error");
  const title = evidenceTitle(item);
  const dimensions = item.width && item.height ? `${item.width} x ${item.height}` : null;
  const failed = status === "error";
  const position = index !== undefined && total !== undefined ? `${index + 1} / ${total}` : null;

  useEffect(() => {
    setStatus(imageUrl ? "loading" : "error");
  }, [imageUrl]);

  return (
    <article className="overflow-hidden rounded border border-zinc-200 bg-white shadow-sm">
      <div className="relative aspect-video bg-zinc-100">
        {imageUrl && !failed ? (
          <img
            src={imageUrl}
            alt={`Evidence preview ${title}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onLoad={() => setStatus("loaded")}
            onError={() => setStatus("error")}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-zinc-500">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            <span>Image preview unavailable</span>
          </div>
        )}

        {status === "loading" ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 text-sm font-medium text-zinc-600">Loading image...</div>
        ) : null}

        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {position ? <span className="rounded bg-zinc-950/80 px-2 py-1 text-xs font-medium text-white shadow-sm">{position}</span> : null}
          {item.content_type ? (
            <span className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm">{item.content_type}</span>
          ) : null}
          {item.media_type ? <span className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm">{item.media_type}</span> : null}
        </div>
      </div>

      <div className="space-y-3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <Image className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              <span className="truncate">{title}</span>
            </div>
            <div className="mt-1 space-y-1 text-xs text-zinc-500">
              {dimensions ? <div>{dimensions}</div> : null}
              {item.captured_at ? <div>{formatDateTime(item.captured_at)}</div> : null}
              {item.ref ? <div className="break-words">Ref: {item.ref}</div> : null}
            </div>
          </div>
          <button className="btn shrink-0 px-2 py-1 text-xs" type="button" onClick={onOpen} disabled={!viewerUrl}>
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            Open
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-600">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {evidenceResolutionLabel(item)}
          </span>
          {item.thumbnail_status ? (
            <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 font-medium text-zinc-600">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Thumbnail {item.thumbnail_status}
            </span>
          ) : null}
        </div>

        {failed ? <p className="text-xs text-rose-700">The image URL failed to load. Technical evidence remains available below.</p> : null}
      </div>
    </article>
  );
}

export function evidencePreviewUrl(item: EvidenceMediaItem) {
  return item.thumbnail_url || item.content_url || item.proxy_url || null;
}

export function evidenceOriginalImageUrl(item: EvidenceMediaItem) {
  return item.content_url || item.proxy_url || item.thumbnail_url || null;
}

export function evidenceImageUrl(item: EvidenceMediaItem) {
  return evidencePreviewUrl(item);
}

export function evidenceTitle(item: EvidenceMediaItem) {
  return item.media_id ? shortId(item.media_id) : item.ref ? shortId(item.ref) : "media";
}

export function evidenceItemKey(item: EvidenceMediaItem) {
  return item.media_id || item.thumbnail_url || item.content_url || item.proxy_url || item.ref;
}

export function evidenceResolutionLabel(item: EvidenceMediaItem) {
  if (item.resolved === false) {
    return "Unresolved";
  }
  if (item.error) {
    return "Error";
  }
  if (item.content_url) {
    return "Original ready";
  }
  if (item.proxy_url) {
    return "Proxy fallback";
  }
  if (item.thumbnail_url) {
    return "Thumbnail fallback";
  }
  return "Reference only";
}

export function evidenceFallbackLabel(item: EvidenceMediaItem) {
  if (item.resolved === false || item.error) {
    return item.error ? `Resolution error: ${item.error}` : "Resolution fallback";
  }
  if (!item.content_url && item.proxy_url) {
    return "Proxy URL used because content_url is missing";
  }
  if (!item.content_url && item.thumbnail_url) {
    return "Thumbnail used because original content is missing";
  }
  if (item.content_url) {
    return "Original content_url used in viewer";
  }
  return "No display URL available";
}
