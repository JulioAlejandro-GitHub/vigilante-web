import { Image, Video } from "lucide-react";

interface MediaPlaceholderPanelProps {
  sourceEventId?: string | null;
  compact?: boolean;
}

export function MediaPlaceholderPanel({ sourceEventId, compact = false }: MediaPlaceholderPanelProps) {
  return (
    <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-500">
          <Image className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-zinc-900">
            Media evidence slot
            <span className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-white px-2 py-0.5 text-xs font-medium text-zinc-500">
              <Video className="h-3 w-3" aria-hidden="true" />
              viewer-ready
            </span>
          </div>
          <p className={`${compact ? "mt-1" : "mt-2"} text-sm text-zinc-600`}>
            Reserved for image or video evidence once media endpoints exist. No synthetic media is shown.
          </p>
          {sourceEventId ? <div className="mt-2 break-words text-xs text-zinc-500">Source event: {sourceEventId}</div> : null}
        </div>
      </div>
    </div>
  );
}
