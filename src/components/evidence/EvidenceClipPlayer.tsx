import { useEffect, useState } from "react";
import { AlertTriangle, Image, Loader2 } from "lucide-react";

import { evidenceOriginalImageUrl, evidenceTitle } from "./EvidenceImageCard";
import type { EvidenceMediaItem } from "../../types/api";

interface EvidenceClipPlayerProps {
  item: EvidenceMediaItem;
}

type ClipStatus = "loading" | "ready" | "error";

export function EvidenceClipPlayer({ item }: EvidenceClipPlayerProps) {
  const clipUrl = item.clip_available ? item.clip_url : null;
  const fallbackImageUrl = evidenceOriginalImageUrl(item);
  const title = evidenceTitle(item);
  const [status, setStatus] = useState<ClipStatus>(clipUrl ? "loading" : "error");

  useEffect(() => {
    setStatus(clipUrl ? "loading" : "error");
  }, [clipUrl]);

  if (!clipUrl) {
    return <ClipFallback item={item} imageUrl={fallbackImageUrl} reason={item.clip_status || "not_available"} />;
  }

  return (
    <div className="overflow-hidden rounded border border-zinc-200 bg-white" data-testid="evidence-clip-player">
      <div className="relative aspect-video bg-zinc-950">
        <video
          src={clipUrl}
          controls
          preload="metadata"
          className="h-full w-full bg-zinc-950"
          aria-label={`Evidence clip ${title}`}
          onCanPlay={() => setStatus("ready")}
          onError={() => setStatus("error")}
        />
        {status === "loading" ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 bg-zinc-950/75 px-3 py-2 text-xs font-medium text-white">
            <Loader2 className="h-3.5 w-3.5" aria-hidden="true" />
            Loading clip
          </div>
        ) : null}
      </div>
      {status === "error" ? <ClipFallback item={item} imageUrl={fallbackImageUrl} reason="clip_load_error" compact /> : null}
    </div>
  );
}

function ClipFallback({
  item,
  imageUrl,
  reason,
  compact = false,
}: {
  item: EvidenceMediaItem;
  imageUrl: string | null;
  reason: string;
  compact?: boolean;
}) {
  const title = evidenceTitle(item);

  return (
    <div className={compact ? "border-t border-zinc-200 bg-zinc-50 p-3" : "rounded border border-dashed border-zinc-300 bg-zinc-50 p-3"}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500">
          {imageUrl ? <Image className="h-4 w-4" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-zinc-900">Clip unavailable</div>
          <div className="mt-1 text-xs text-zinc-500">Status: {reason}</div>
          {imageUrl ? (
            <img src={imageUrl} alt={`Evidence fallback ${title}`} className="mt-3 max-h-56 w-full rounded border border-zinc-200 object-contain" />
          ) : null}
          {!imageUrl ? <p className="mt-2 text-sm text-zinc-600">Image fallback is unavailable for this evidence item.</p> : null}
        </div>
      </div>
    </div>
  );
}
