import { AlertTriangle, ImageOff, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

import { mainEvidenceUrl, evidenceUnavailableLabel } from "./EvidenceThumbnail";
import { ConfidenceBadge } from "./StatusBadges";
import type { ControlCenterEvidenceItem } from "../types/controlCenter.types";
import { formatDateTime, shortId } from "../../../utils/format";

interface EvidenceViewerProps {
  item: ControlCenterEvidenceItem | null;
  loading?: boolean;
  onRefreshEvidence: () => void;
}

export function EvidenceViewer({ item, loading, onRefreshEvidence }: EvidenceViewerProps) {
  const url = mainEvidenceUrl(item);
  const [imageStatus, setImageStatus] = useState<"loading" | "ready" | "error">(url ? "loading" : "error");

  useEffect(() => {
    setImageStatus(url ? "loading" : "error");
  }, [url]);

  if (loading) {
    return (
      <div className="flex aspect-video animate-pulse items-center justify-center rounded border border-zinc-200 bg-zinc-100 text-sm text-zinc-500">
        Evidencia cargando...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex aspect-video flex-col items-center justify-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-4 text-center text-sm text-zinc-500">
        <ImageOff className="h-6 w-6" aria-hidden="true" />
        Sin evidencia visual.
      </div>
    );
  }

  const unavailable = evidenceUnavailableLabel(item, imageStatus);

  return (
    <div className="overflow-hidden rounded border border-zinc-200 bg-zinc-950">
      <div className="relative aspect-video">
        {url && imageStatus !== "error" ? (
          <img
            src={url}
            alt={`Evidencia principal ${shortId(item.media_id || item.ref)}`}
            className="h-full w-full object-contain"
            onLoad={() => setImageStatus("ready")}
            onError={() => setImageStatus("error")}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-sm text-zinc-400">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
            <span>{unavailable || "Imagen expirada o no disponible."}</span>
            <button className="btn border-zinc-600 bg-zinc-900 text-white hover:bg-zinc-800" type="button" onClick={onRefreshEvidence}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Renovar evidencia
            </button>
          </div>
        )}
        {imageStatus === "loading" ? <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/45 text-sm font-medium text-white">Cargando imagen...</div> : null}
      </div>
      <div className="border-t border-zinc-800 bg-zinc-950 px-3 py-2 text-white">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-zinc-800 px-2 py-1 text-xs font-semibold">{item.control_center_label ?? item.media_type ?? "evidencia"}</span>
          <span className="rounded bg-zinc-800 px-2 py-1 text-xs">{shortId(item.camera_id)}</span>
          <span className="rounded bg-zinc-800 px-2 py-1 text-xs">{formatDateTime(item.captured_at)}</span>
          <ConfidenceBadge value={item.control_center_score} />
        </div>
      </div>
    </div>
  );
}
