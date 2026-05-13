import { AlertTriangle, ImageOff, Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { ConfidenceBadge } from "./StatusBadges";
import type { ControlCenterEvidenceItem } from "../types/controlCenter.types";
import { formatDateTime, shortId } from "../../../utils/format";

interface EvidenceThumbnailProps {
  item: ControlCenterEvidenceItem;
  selected: boolean;
  index: number;
  onSelect: () => void;
}

export function EvidenceThumbnail({ item, selected, index, onSelect }: EvidenceThumbnailProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(thumbnailUrl(item) ? "loading" : "error");
  const url = thumbnailUrl(item);

  useEffect(() => {
    setStatus(url ? "loading" : "error");
  }, [url]);

  const unavailable = evidenceUnavailableLabel(item, status);

  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={`w-36 shrink-0 overflow-hidden rounded border bg-white text-left transition ${
        selected ? "border-teal-500 ring-2 ring-teal-200" : "border-zinc-200 hover:border-zinc-300"
      }`}
      onClick={onSelect}
    >
      <div className="relative aspect-video bg-zinc-100">
        {url && status !== "error" ? (
          <img
            src={url}
            alt={`Miniatura evidencia ${index + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400">
            {unavailable === "no autorizado" ? <Lock className="h-5 w-5" aria-hidden="true" /> : <ImageOff className="h-5 w-5" aria-hidden="true" />}
          </div>
        )}
        {status === "loading" ? <div className="absolute inset-0 bg-white/70" /> : null}
        <span className="absolute left-1 top-1 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">{index + 1}</span>
        {item.error ? (
          <span className="absolute right-1 top-1 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            <AlertTriangle className="inline h-3 w-3" aria-hidden="true" />
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-2">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-semibold text-zinc-900">{item.control_center_label ?? item.media_type ?? "evidencia"}</span>
          <ConfidenceBadge value={item.control_center_score} />
        </div>
        <div className="truncate text-[11px] text-zinc-500">{shortId(item.camera_id)}</div>
        <div className="truncate text-[11px] text-zinc-500">{formatDateTime(item.captured_at)}</div>
        {unavailable ? <div className="truncate text-[11px] font-medium text-rose-700">{unavailable}</div> : null}
      </div>
    </button>
  );
}

export function thumbnailUrl(item: ControlCenterEvidenceItem) {
  return item.thumbnail_url || item.content_url || item.proxy_url || null;
}

export function mainEvidenceUrl(item: ControlCenterEvidenceItem | null) {
  return item?.content_url || item?.proxy_url || item?.thumbnail_url || null;
}

export function evidenceUnavailableLabel(item: ControlCenterEvidenceItem, imageStatus?: "loading" | "ready" | "error") {
  const error = String(item.error || "").toLowerCase();
  if (error.includes("unauthorized") || error.includes("forbidden") || error.includes("permission")) {
    return "no autorizado";
  }
  if (error.includes("expired") || error.includes("signature") || error.includes("token")) {
    return "url expirada";
  }
  if (item.resolved === false) {
    return "no resuelta";
  }
  if (item.error) {
    return "error";
  }
  if (imageStatus === "error") {
    return "imagen no disponible";
  }
  return null;
}
