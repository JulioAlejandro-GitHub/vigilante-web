import { useEffect, useState } from "react";
import { AlertTriangle, Image, X } from "lucide-react";

import { EvidenceMetadataPanel } from "./EvidenceMetadataPanel";
import { evidenceOriginalImageUrl, evidenceTitle } from "./EvidenceImageCard";
import type { EvidenceMediaItem } from "../../types/api";

interface EvidenceViewerModalProps {
  item: EvidenceMediaItem;
  onClose: () => void;
}

export function EvidenceViewerModal({ item, onClose }: EvidenceViewerModalProps) {
  const imageUrl = evidenceOriginalImageUrl(item);
  const title = evidenceTitle(item);
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(imageUrl ? "loading" : "error");

  useEffect(() => {
    setStatus(imageUrl ? "loading" : "error");
  }, [imageUrl]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/80 p-3 sm:p-6" role="presentation" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-viewer-title"
        className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded border border-zinc-700 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
          <div className="min-w-0">
            <div className="label">Evidence viewer</div>
            <h2 id="evidence-viewer-title" className="truncate text-base font-semibold text-zinc-950">
              {title}
            </h2>
          </div>
          <button className="btn px-2" type="button" onClick={onClose} aria-label="Close viewer">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative flex min-h-[280px] items-center justify-center bg-zinc-950 p-3 sm:p-5">
            {imageUrl && status !== "error" ? (
              <img
                src={imageUrl}
                alt={`Evidence image ${title}`}
                className="max-h-full max-w-full object-contain"
                onLoad={() => setStatus("loaded")}
                onError={() => setStatus("error")}
              />
            ) : (
              <div className="flex max-w-sm flex-col items-center gap-3 text-center text-sm text-zinc-200">
                <AlertTriangle className="h-7 w-7" aria-hidden="true" />
                <div>
                  <div className="font-semibold text-white">Image could not be loaded</div>
                  <p className="mt-1 text-zinc-300">The content URL is unavailable or returned an error.</p>
                </div>
              </div>
            )}

            {status === "loading" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/70 text-sm font-medium text-white">
                <Image className="mr-2 h-4 w-4" aria-hidden="true" />
                Loading image...
              </div>
            ) : null}
          </div>

          <aside className="min-h-0 overflow-auto border-t border-zinc-200 p-4 lg:border-l lg:border-t-0">
            <h3 className="text-sm font-semibold text-zinc-950">Media metadata</h3>
            <div className="mt-3">
              <EvidenceMetadataPanel item={item} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
