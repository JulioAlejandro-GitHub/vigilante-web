import { useMemo, useState } from "react";
import { PlayCircle, Video } from "lucide-react";

import { EvidenceClipBadge } from "./EvidenceClipBadge";
import { EvidenceClipPlayer } from "./EvidenceClipPlayer";
import { evidenceTitle } from "./EvidenceImageCard";
import type { EvidenceMediaItem } from "../../types/api";
import { dedupeEvidenceMedia } from "../../utils/evidence";

interface EvidenceClipPanelProps {
  media?: EvidenceMediaItem[] | null;
}

export function EvidenceClipPanel({ media = [] }: EvidenceClipPanelProps) {
  const clipItems = useMemo(
    () => dedupeEvidenceMedia(media ?? []).filter((item) => item.resolved !== false && item.clip_available && item.clip_url),
    [media],
  );
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const selectedItem = clipItems.find((item) => clipItemKey(item) === selectedKey) ?? clipItems[0] ?? null;

  if (clipItems.length === 0) {
    return null;
  }

  return (
    <section className="panel p-4" data-testid="evidence-clip-panel">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold text-zinc-950">
            <Video className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            Temporal clips
          </h2>
          <p className="mt-1 text-sm text-zinc-600">Short derived clips from neighboring evidence frames.</p>
        </div>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">
          {clipItems.length} available
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="space-y-2">
          {clipItems.map((item) => {
            const key = clipItemKey(item);
            const selected = selectedItem ? key === clipItemKey(selectedItem) : false;
            return (
              <article key={key} className={`rounded border p-3 ${selected ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-950">{evidenceTitle(item)}</div>
                    <div className="mt-1 text-xs text-zinc-500">{clipSummary(item)}</div>
                  </div>
                  <button className="btn shrink-0 px-2 py-1 text-xs" type="button" onClick={() => setSelectedKey(key)}>
                    <PlayCircle className="h-3.5 w-3.5" aria-hidden="true" />
                    Open clip
                  </button>
                </div>
                <div className="mt-2">
                  <EvidenceClipBadge item={item} />
                </div>
              </article>
            );
          })}
        </div>

        {selectedItem ? <EvidenceClipPlayer item={selectedItem} /> : null}
      </div>
    </section>
  );
}

function clipSummary(item: EvidenceMediaItem) {
  const parts = [
    item.clip_duration_seconds ? `${formatSeconds(item.clip_duration_seconds)}` : null,
    item.clip_frame_count ? `${item.clip_frame_count} frames` : null,
    item.clip_fps ? `${item.clip_fps} fps` : null,
    item.clip_content_type,
  ].filter(Boolean);
  return parts.join(" · ") || item.clip_status || "clip";
}

function formatSeconds(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}s`;
}

function clipItemKey(item: EvidenceMediaItem) {
  return item.media_id || item.clip_url || item.ref;
}
