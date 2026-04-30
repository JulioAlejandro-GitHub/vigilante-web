import { AlertTriangle, FileText, ImageOff } from "lucide-react";

import type { EvidenceMediaItem } from "../../types/api";
import { shortId } from "../../utils/format";

interface EvidenceFallbackProps {
  fallbackRefs?: string[];
  mediaItems?: EvidenceMediaItem[];
  sourceEventId?: string | null;
  compact?: boolean;
}

export function EvidenceFallback({ fallbackRefs = [], mediaItems = [], sourceEventId, compact = false }: EvidenceFallbackProps) {
  const unresolvedItems = mediaItems.filter((item) => item.resolved === false || item.error || !(item.thumbnail_url || item.content_url || item.proxy_url));
  const shownRefs = dedupeRefs([
    ...unresolvedItems.map((item) => item.ref).filter(Boolean),
    ...fallbackRefs,
  ]).slice(0, compact ? 3 : 6);
  const hasUnresolved = unresolvedItems.length > 0;
  const hasRefs = shownRefs.length > 0;

  return (
    <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500">
          {hasUnresolved ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <ImageOff className="h-4 w-4" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-900">
            {hasUnresolved ? "Media could not be displayed" : hasRefs ? "Media not resolved yet" : "No visual evidence available"}
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            {hasUnresolved
              ? "The technical reference is preserved, but the image endpoint did not resolve usable content."
              : hasRefs
                ? "The API returned evidence references without resolved image content."
                : "This item does not include resolved media or evidence references."}
          </p>

          {hasRefs ? (
            <div className="mt-3 space-y-2">
              {shownRefs.map((ref) => {
                const item = unresolvedItems.find((media) => media.ref === ref);
                return (
                  <div key={ref} className="flex min-w-0 items-start gap-2 rounded border border-zinc-200 bg-white p-2 text-xs text-zinc-700">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="break-words font-medium text-zinc-800">{ref}</div>
                      {item?.error ? <div className="mt-1 text-zinc-500">Error: {item.error}</div> : null}
                      {item?.media_id ? <div className="mt-1 text-zinc-500">Media: {shortId(item.media_id)}</div> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {sourceEventId ? <div className="mt-2 break-words text-xs text-zinc-500">Source event: {sourceEventId}</div> : null}
        </div>
      </div>
    </div>
  );
}

function dedupeRefs(values: string[]) {
  const seen = new Set<string>();
  const refs: string[] = [];
  values.forEach((value) => {
    if (!value || seen.has(value)) {
      return;
    }
    seen.add(value);
    refs.push(value);
  });
  return refs;
}
