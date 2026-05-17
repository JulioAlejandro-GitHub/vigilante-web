import { ChevronRight, ImageOff } from "lucide-react";

import { EvidenceComparison } from "./EvidenceComparison";
import { EvidenceThumbnail } from "./EvidenceThumbnail";
import { EvidenceViewer } from "./EvidenceViewer";
import type { ControlCenterEvidenceItem } from "../types/controlCenter.types";

interface EvidenceReelProps {
  items: ControlCenterEvidenceItem[];
  visibleItems: ControlCenterEvidenceItem[];
  selectedItem: ControlCenterEvidenceItem | null;
  selectedIndex: number;
  loading: boolean;
  loadingMore: boolean;
  canShowMore: boolean;
  error: string | null;
  onSelect: (index: number) => void;
  onShowMore: () => void;
  onRefreshEvidence: () => void;
}

export function EvidenceReel({
  items,
  visibleItems,
  selectedItem,
  selectedIndex,
  loading,
  loadingMore,
  canShowMore,
  error,
  onSelect,
  onShowMore,
  onRefreshEvidence,
}: EvidenceReelProps) {
  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Evidencia visual principal</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Imagen grande para decidir; reel y evidencia relacionada cargan de forma progresiva.</p>
        </div>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">{items.length}</span>
      </div>

      <EvidenceViewer item={selectedItem} loading={loading} onRefreshEvidence={onRefreshEvidence} />

      {items.length === 0 && !loading ? (
        <div className="mt-3 flex items-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500">
          <ImageOff className="h-4 w-4" aria-hidden="true" />
          Sin evidencia visual resuelta para este caso o evento.
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
          <button className="btn mt-2" type="button" onClick={onRefreshEvidence}>
            Reintentar evidencia
          </button>
        </div>
      ) : null}

      {visibleItems.length > 0 ? (
        <div className="mt-3">
          <div className="flex gap-2 overflow-x-auto pb-2" role="listbox" aria-label="Evidencias visuales del caso">
            {visibleItems.map((item, index) => (
              <EvidenceThumbnail
                key={item.media_id || item.ref || index}
                item={item}
                index={index}
                selected={selectedIndex === index}
                onSelect={() => onSelect(index)}
              />
            ))}
            {canShowMore ? (
              <button
                type="button"
                className="flex w-28 shrink-0 flex-col items-center justify-center gap-2 rounded border border-dashed border-zinc-300 bg-zinc-50 text-sm font-medium text-zinc-600"
                onClick={onShowMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Cargando" : "Ver más"}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <EvidenceComparison selected={selectedItem} items={items} onSelect={onSelect} />
      </div>
    </section>
  );
}
