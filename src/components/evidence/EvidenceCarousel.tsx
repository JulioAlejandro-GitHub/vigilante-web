import { AlertTriangle, ImageOff } from "lucide-react";

import { evidenceItemKey, evidencePreviewUrl, evidenceTitle } from "./EvidenceImageCard";
import type { EvidenceMediaItem } from "../../types/api";

interface EvidenceCarouselProps {
  items: EvidenceMediaItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function EvidenceCarousel({ items, selectedIndex, onSelect }: EvidenceCarouselProps) {
  if (items.length <= 1) {
    return null;
  }

  return (
    <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-2">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-300">
        <span className="font-medium">Evidence strip</span>
        <span>
          {selectedIndex + 1} / {items.length}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1" role="listbox" aria-label="Evidence images">
        {items.map((item, index) => {
          const previewUrl = evidencePreviewUrl(item);
          const selected = index === selectedIndex;
          const title = evidenceTitle(item);

          return (
            <button
              key={evidenceItemKey(item)}
              type="button"
              role="option"
              aria-selected={selected}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded border text-left transition ${
                selected ? "border-teal-400 ring-2 ring-teal-300" : "border-zinc-700 hover:border-zinc-400"
              }`}
              onClick={() => onSelect(index)}
            >
              {previewUrl ? (
                <img src={previewUrl} alt={`Evidence thumbnail ${title}`} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-zinc-900 text-zinc-500">
                  {item.error ? <AlertTriangle className="h-4 w-4" aria-hidden="true" /> : <ImageOff className="h-4 w-4" aria-hidden="true" />}
                </span>
              )}
              <span className="absolute bottom-1 left-1 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[11px] font-medium text-white">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
