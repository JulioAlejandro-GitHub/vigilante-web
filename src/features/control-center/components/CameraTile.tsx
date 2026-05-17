import { Activity, Camera, ImageOff, PauseCircle, Radio, ScanFace, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { CameraStatusBadge, ConfidenceBadge, formatRelativeTime } from "./StatusBadges";
import type { ControlCenterCameraTile, ControlCenterPriorityTier } from "../types/controlCenter.types";
import { visualEventSummary } from "../utils/priority";
import { shortId } from "../../../utils/format";

interface CameraTileProps {
  item: ControlCenterCameraTile;
  selected: boolean;
}

export function CameraTile({ item, selected }: CameraTileProps) {
  const [imageError, setImageError] = useState(false);
  const displayName = item.camera.name || item.camera.external_camera_key || shortId(item.camera.camera_id);
  const priorityClass = priorityTone(item.priority?.tier);
  const frameAgeLabel = item.liveFrame?.latest_frame_at ? formatRelativeTime(item.liveFrame.latest_frame_at) : null;
  const hasLiveFrame = Boolean(item.liveFrame?.latest_frame_ref);
  const recognitionProcessed = Boolean(item.latestEvent);

  useEffect(() => {
    setImageError(false);
  }, [item.snapshotUrl]);

  return (
    <article className={`overflow-hidden rounded border bg-white ${selected ? "border-teal-500 ring-2 ring-teal-200" : "border-zinc-200"}`}>
      <div className="relative aspect-video bg-zinc-950">
        {item.snapshotUrl && !imageError ? (
          <img
            src={item.snapshotUrl}
            alt={`Última evidencia visual de ${displayName}`}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center text-zinc-400">
            {emptyStateIcon(item.status)}
            <span className="text-xs font-medium">{statusReasonLabel(item.reason, item.status)}</span>
          </div>
        )}

        {item.overlays.map((overlay) =>
          overlay.box ? (
            <div
              key={overlay.id}
              className="absolute border-2 border-teal-300 bg-teal-300/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
              style={{
                left: `${overlay.box.x}%`,
                top: `${overlay.box.y}%`,
                width: `${overlay.box.width}%`,
                height: `${overlay.box.height}%`,
              }}
            >
              <span className="absolute left-0 top-0 -translate-y-full rounded-t bg-teal-300 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
                {overlay.label}
              </span>
            </div>
          ) : null,
        )}

        <div className="absolute left-2 top-2">
          <CameraStatusBadge status={item.status} />
        </div>
        <div className="absolute right-2 top-2 flex max-w-[65%] flex-wrap justify-end gap-1">
          {hasLiveFrame ? (
            <span className="inline-flex items-center gap-1 rounded bg-zinc-950/80 px-2 py-1 text-xs font-semibold text-white">
              <Radio className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              frame {frameAgeLabel}
            </span>
          ) : null}
          {item.priority ? <span className={`rounded px-2 py-1 text-xs font-semibold ${priorityClass}`}>{item.priority.label}</span> : null}
          {selected ? <span className="rounded bg-teal-500 px-2 py-1 text-xs font-semibold text-white">activo</span> : null}
        </div>
        {item.latestEvent ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/75 to-transparent p-2 pt-8 text-white">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-zinc-300">
              <ScanFace className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
              {item.priority?.eventLabel ?? item.latestEvent.event_type}
            </div>
            <div className="mt-0.5 line-clamp-1 text-xs text-zinc-100">{visualEventSummary(item.latestEvent, item.latestEvent.summary)}</div>
          </div>
        ) : hasLiveFrame ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent p-2 pt-8 text-white">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-zinc-300">
              <Activity className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
              Sin procesamiento reciente
            </div>
            <div className="mt-0.5 line-clamp-1 text-xs text-zinc-100">Frame vivo disponible; recognition aún no publica insight.</div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
              <Camera className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              <span className="truncate">{displayName}</span>
            </div>
            <div className="mt-0.5 text-xs text-zinc-500">{shortId(item.camera.camera_id)}</div>
          </div>
          <ConfidenceBadge value={item.latestEvent?.confidence} />
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="FPS" value={item.fps === null ? "—" : item.fps.toFixed(item.fps % 1 === 0 ? 0 : 1)} />
          <Metric label="Frame" value={frameAgeLabel ?? formatRelativeTime(item.lastSeenAt)} />
          <Metric label="Proc." value={recognitionProcessed ? formatRelativeTime(item.latestEvent?.event_ts) : "pend."} />
        </div>
        <div className="flex flex-wrap gap-1">
          <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${hasLiveFrame ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
            {hasLiveFrame ? "imagen ingestion" : "sin imagen live"}
          </span>
          <span className={`rounded border px-1.5 py-0.5 text-[11px] font-medium ${recognitionProcessed ? "border-teal-200 bg-teal-50 text-teal-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
            {recognitionProcessed ? "recognition listo" : "recognition pendiente"}
          </span>
        </div>
        {item.priority?.tags.length ? (
          <div className="flex flex-wrap gap-1">
            {item.priority.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function emptyStateIcon(status: ControlCenterCameraTile["status"]) {
  if (status === "offline") return <WifiOff className="h-7 w-7" aria-hidden="true" />;
  if (status === "not_started_concurrency") return <PauseCircle className="h-7 w-7" aria-hidden="true" />;
  return <ImageOff className="h-7 w-7" aria-hidden="true" />;
}

function statusReasonLabel(reason: string | null, status: ControlCenterCameraTile["status"]) {
  if (status === "not_started_concurrency") {
    return "No iniciada por límite de concurrencia";
  }
  if (reason === "no_ingested_frame") {
    return "Sin snapshot reciente de ingestion";
  }
  if (reason === "latest_frame_is_stale") {
    return "Último frame antiguo";
  }
  if (reason === "latest_frame_too_old") {
    return "Cámara sin frames recientes";
  }
  if (reason === "No recent processed event available") {
    return "Sin procesamiento reciente";
  }
  return reason || "Sin snapshot reciente";
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-zinc-50 px-2 py-1">
      <div className="text-[10px] font-medium uppercase text-zinc-500">{label}</div>
      <div className="truncate font-semibold text-zinc-800">{value}</div>
    </div>
  );
}

function priorityTone(tier: ControlCenterPriorityTier | undefined) {
  if (tier === "critical") return "bg-rose-600 text-white";
  if (tier === "attention") return "bg-amber-500 text-zinc-950";
  if (tier === "watch") return "bg-sky-500 text-white";
  return "bg-zinc-800 text-white";
}
