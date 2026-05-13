import { GitCompareArrows } from "lucide-react";

import { mainEvidenceUrl } from "./EvidenceThumbnail";
import type { ControlCenterEvidenceItem } from "../types/controlCenter.types";
import { shortId } from "../../../utils/format";

interface EvidenceComparisonProps {
  selected: ControlCenterEvidenceItem | null;
  items: ControlCenterEvidenceItem[];
  onSelect: (index: number) => void;
}

export function EvidenceComparison({ selected, items, onSelect }: EvidenceComparisonProps) {
  if (!selected || items.length < 2) {
    return null;
  }

  const candidates = comparisonCandidates(selected, items);
  if (candidates.length === 0) {
    return null;
  }

  return (
    <div className="rounded border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900">
        <GitCompareArrows className="h-4 w-4 text-zinc-500" aria-hidden="true" />
        Comparación rápida
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {candidates.map((candidate) => {
          const url = mainEvidenceUrl(candidate.item);
          return (
            <button
              key={candidate.label}
              type="button"
              className="overflow-hidden rounded border border-zinc-200 bg-white text-left hover:border-zinc-300"
              onClick={() => onSelect(candidate.index)}
            >
              <div className="aspect-video bg-zinc-100">
                {url ? <img src={url} alt={candidate.label} className="h-full w-full object-cover" loading="lazy" /> : null}
              </div>
              <div className="p-2">
                <div className="truncate text-xs font-semibold text-zinc-900">{candidate.label}</div>
                <div className="truncate text-[11px] text-zinc-500">{shortId(candidate.item.camera_id)}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function comparisonCandidates(selected: ControlCenterEvidenceItem, items: ControlCenterEvidenceItem[]) {
  const selectedKey = selected.media_id || selected.ref;
  const withIndex = items.map((item, index) => ({ item, index }));
  const candidates: Array<{ label: string; item: ControlCenterEvidenceItem; index: number }> = [];

  const bestFrame = withIndex.find(({ item }) => (item.control_center_kind === "frame" || item.control_center_kind === "context") && (item.media_id || item.ref) !== selectedKey);
  const bestMatch = withIndex.find(({ item }) => item.control_center_kind === "match" && (item.media_id || item.ref) !== selectedKey);
  const crossCamera = withIndex.find(({ item }) => item.camera_id && item.camera_id !== selected.camera_id);
  const previous = withIndex.find(({ item }) => (item.media_id || item.ref) !== selectedKey);

  if (bestFrame) candidates.push({ label: "Mejor frame", ...bestFrame });
  if (bestMatch && !candidates.some((candidate) => candidate.index === bestMatch.index)) candidates.push({ label: "Mejor match", ...bestMatch });
  if (crossCamera && !candidates.some((candidate) => candidate.index === crossCamera.index)) candidates.push({ label: "Cross-camera", ...crossCamera });
  if (previous && candidates.length === 0) candidates.push({ label: "Frame previo", ...previous });

  return candidates.slice(0, 3);
}
