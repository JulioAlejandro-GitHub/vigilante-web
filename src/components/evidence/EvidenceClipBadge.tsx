import { Video } from "lucide-react";

import type { EvidenceMediaItem } from "../../types/api";

interface EvidenceClipBadgeProps {
  item: EvidenceMediaItem;
}

export function EvidenceClipBadge({ item }: EvidenceClipBadgeProps) {
  if (!item.clip_available || !item.clip_url) {
    return null;
  }

  return (
    <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
      <Video className="h-3.5 w-3.5" aria-hidden="true" />
      Clip available
    </span>
  );
}
