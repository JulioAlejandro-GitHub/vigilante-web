import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, WheelEvent } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Image, Move, RotateCcw, X, ZoomIn, ZoomOut } from "lucide-react";

import { EvidenceCarousel } from "./EvidenceCarousel";
import { EvidenceCompareToggle } from "./EvidenceCompareToggle";
import { EvidenceMetadataPanel } from "./EvidenceMetadataPanel";
import { evidenceFallbackLabel, evidenceOriginalImageUrl, evidenceTitle } from "./EvidenceImageCard";
import type { EvidenceMediaItem } from "../../types/api";

interface EvidenceViewerModalProps {
  item?: EvidenceMediaItem;
  items?: EvidenceMediaItem[];
  selectedIndex?: number | null;
  onClose: () => void;
  onSelect?: (index: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  positionLabel?: string;
}

type ImageStatus = "loading" | "loaded" | "error";

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export function EvidenceViewerModal({
  item,
  items,
  selectedIndex,
  onClose,
  onSelect,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
  positionLabel,
}: EvidenceViewerModalProps) {
  const modalItems = useMemo(() => (items && items.length > 0 ? items : item ? [item] : []), [item, items]);
  const currentIndex = selectedIndex ?? 0;
  const currentItem = modalItems[currentIndex] ?? modalItems[0];
  const imageUrl = currentItem ? evidenceOriginalImageUrl(currentItem) : null;
  const title = currentItem ? evidenceTitle(currentItem) : "media";
  const effectivePosition = positionLabel ?? `${Math.min(currentIndex + 1, modalItems.length)} / ${modalItems.length}`;
  const canGoPrevious = hasPrevious ?? currentIndex > 0;
  const canGoNext = hasNext ?? currentIndex < modalItems.length - 1;
  const compareIndex = currentIndex < modalItems.length - 1 ? currentIndex + 1 : currentIndex > 0 ? currentIndex - 1 : null;
  const compareItem = compareIndex !== null ? modalItems[compareIndex] : null;
  const compareUrl = compareItem ? evidenceOriginalImageUrl(compareItem) : null;
  const [status, setStatus] = useState<ImageStatus>(imageUrl ? "loading" : "error");
  const [compareStatus, setCompareStatus] = useState<ImageStatus>(compareUrl ? "loading" : "error");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; offsetX: number; offsetY: number } | null>(null);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const setClampedZoom = useCallback((nextValue: number) => {
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(nextValue.toFixed(2))));
    if (nextZoom === MIN_ZOOM) {
      setOffset({ x: 0, y: 0 });
    }
    setZoom(nextZoom);
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((current) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((current + ZOOM_STEP).toFixed(2))));
      return nextZoom;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => {
      const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number((current - ZOOM_STEP).toFixed(2))));
      if (nextZoom === MIN_ZOOM) {
        setOffset({ x: 0, y: 0 });
      }
      return nextZoom;
    });
  }, []);

  const goPrevious = useCallback(() => {
    if (!canGoPrevious) {
      return;
    }
    if (onPrevious) {
      onPrevious();
      return;
    }
    onSelect?.(currentIndex - 1);
  }, [canGoPrevious, currentIndex, onPrevious, onSelect]);

  const goNext = useCallback(() => {
    if (!canGoNext) {
      return;
    }
    if (onNext) {
      onNext();
      return;
    }
    onSelect?.(currentIndex + 1);
  }, [canGoNext, currentIndex, onNext, onSelect]);

  useEffect(() => {
    setStatus(imageUrl ? "loading" : "error");
    resetZoom();
    setDragging(false);
  }, [imageUrl, resetZoom]);

  useEffect(() => {
    setCompareStatus(compareUrl ? "loading" : "error");
  }, [compareUrl]);

  useEffect(() => {
    if (compareMode && !compareItem) {
      setCompareMode(false);
    }
  }, [compareItem, compareMode]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        goPrevious();
      }
      if (event.key === "ArrowRight") {
        goNext();
      }
      if (event.key === "+" || event.key === "=") {
        zoomIn();
      }
      if (event.key === "-") {
        zoomOut();
      }
      if (event.key === "0") {
        resetZoom();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrevious, onClose, resetZoom, zoomIn, zoomOut]);

  if (!currentItem) {
    return null;
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setClampedZoom(zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
  }

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    if (zoom <= MIN_ZOOM) {
      return;
    }
    event.preventDefault();
    setDragging(true);
    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!dragStartRef.current || !dragging) {
      return;
    }
    const deltaX = event.clientX - dragStartRef.current.clientX;
    const deltaY = event.clientY - dragStartRef.current.clientY;
    setOffset({
      x: dragStartRef.current.offsetX + deltaX,
      y: dragStartRef.current.offsetY + deltaY,
    });
  }

  function endPan() {
    setDragging(false);
    dragStartRef.current = null;
  }

  const sharedStageProps = {
    zoom,
    offset,
    dragging,
    onWheel: handleWheel,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: endPan,
    onMouseLeave: endPan,
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/85 p-2 sm:p-6" role="presentation" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="evidence-viewer-title"
        className="mx-auto flex h-full max-w-7xl flex-col overflow-hidden rounded border border-zinc-700 bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex flex-col gap-3 border-b border-zinc-200 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="label">Evidence viewer</div>
            <h2 id="evidence-viewer-title" className="truncate text-base font-semibold text-zinc-950">
              {title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>{effectivePosition}</span>
              <span>{evidenceFallbackLabel(currentItem)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn px-2 py-1 text-xs" type="button" onClick={goPrevious} disabled={!canGoPrevious} aria-label="Previous evidence">
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Prev
            </button>
            <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">{effectivePosition}</span>
            <button className="btn px-2 py-1 text-xs" type="button" onClick={goNext} disabled={!canGoNext} aria-label="Next evidence">
              Next
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <div className="mx-1 hidden h-6 w-px bg-zinc-200 sm:block" />
            <button className="btn px-2 py-1 text-xs" type="button" onClick={zoomOut} disabled={zoom <= MIN_ZOOM} aria-label="Zoom out">
              <ZoomOut className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="min-w-14 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-center text-xs font-semibold text-zinc-700">
              {Math.round(zoom * 100)}%
            </span>
            <button className="btn px-2 py-1 text-xs" type="button" onClick={zoomIn} disabled={zoom >= MAX_ZOOM} aria-label="Zoom in">
              <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button className="btn px-2 py-1 text-xs" type="button" onClick={resetZoom} aria-label="Reset zoom">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Reset
            </button>
            <EvidenceCompareToggle
              enabled={compareMode}
              disabled={!compareItem}
              compareLabel={compareIndex !== null ? `image ${compareIndex + 1}` : undefined}
              onToggle={() => setCompareMode((value) => !value)}
            />
            <button className="btn px-2 py-1 text-xs" type="button" onClick={onClose} aria-label="Close viewer">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-h-0 flex-col bg-zinc-950">
            <div className={compareMode && compareItem ? "grid min-h-0 flex-1 md:grid-cols-2" : "min-h-0 flex-1"}>
              <EvidenceImageStage
                item={currentItem}
                imageUrl={imageUrl}
                title={title}
                status={status}
                onLoad={() => setStatus("loaded")}
                onError={() => setStatus("error")}
                label={compareMode && compareItem ? "Current" : "Original"}
                {...sharedStageProps}
              />
              {compareMode && compareItem ? (
                <EvidenceImageStage
                  item={compareItem}
                  imageUrl={compareUrl}
                  title={evidenceTitle(compareItem)}
                  status={compareStatus}
                  onLoad={() => setCompareStatus("loaded")}
                  onError={() => setCompareStatus("error")}
                  label={`Compare ${compareIndex !== null ? compareIndex + 1 : ""}`}
                  {...sharedStageProps}
                />
              ) : null}
            </div>

            <EvidenceCarousel items={modalItems} selectedIndex={currentIndex} onSelect={(index) => onSelect?.(index)} />
          </div>

          <aside className="min-h-0 overflow-auto border-t border-zinc-200 p-4 lg:border-l lg:border-t-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">Visual metadata</h3>
                <p className="mt-1 text-xs text-zinc-500">Operational fields only; full technical payload stays outside the viewer.</p>
              </div>
              <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700">{effectivePosition}</span>
            </div>
            <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
              <div className="flex items-center gap-2 font-semibold text-zinc-800">
                <Move className="h-3.5 w-3.5" aria-hidden="true" />
                Zoom and pan
              </div>
              <p className="mt-1">Use the controls or mouse wheel to zoom. Drag the image when zoomed in.</p>
            </div>
            <div className="mt-4">
              <EvidenceMetadataPanel item={currentItem} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

interface EvidenceImageStageProps {
  item: EvidenceMediaItem;
  imageUrl: string | null;
  title: string;
  status: ImageStatus;
  label: string;
  zoom: number;
  offset: { x: number; y: number };
  dragging: boolean;
  onLoad: () => void;
  onError: () => void;
  onWheel: (event: WheelEvent<HTMLDivElement>) => void;
  onMouseDown: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (event: MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

function EvidenceImageStage({
  item,
  imageUrl,
  title,
  status,
  label,
  zoom,
  offset,
  dragging,
  onLoad,
  onError,
  onWheel,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
}: EvidenceImageStageProps) {
  return (
    <div
      className={`relative flex min-h-[320px] items-center justify-center overflow-hidden border-zinc-800 bg-zinc-950 p-3 sm:p-5 ${
        zoom > MIN_ZOOM ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
      }`}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
    >
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
        <span className="rounded bg-zinc-900/85 px-2 py-1 text-xs font-semibold text-white shadow-sm">{label}</span>
        {item.camera_id ? <span className="rounded bg-white/90 px-2 py-1 text-xs font-medium text-zinc-700 shadow-sm">{item.camera_id}</span> : null}
      </div>

      {imageUrl && status !== "error" ? (
        <img
          src={imageUrl}
          alt={`Evidence image ${title}`}
          className="max-h-full max-w-full select-none object-contain transition-transform duration-100"
          draggable={false}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          onLoad={onLoad}
          onError={onError}
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
  );
}
