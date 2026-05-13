import { Camera, ImageOff, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

import { CameraStatusBadge, ConfidenceBadge, formatRelativeTime } from "./StatusBadges";
import type { ControlCenterCameraTile } from "../types/controlCenter.types";
import { shortId } from "../../../utils/format";

interface CameraTileProps {
  item: ControlCenterCameraTile;
  selected: boolean;
}

export function CameraTile({ item, selected }: CameraTileProps) {
  const [imageError, setImageError] = useState(false);
  const displayName = item.camera.name || item.camera.external_camera_key || shortId(item.camera.camera_id);

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
            {item.status === "offline" ? <WifiOff className="h-7 w-7" aria-hidden="true" /> : <ImageOff className="h-7 w-7" aria-hidden="true" />}
            <span className="text-xs font-medium">{item.reason || "Sin snapshot firmado disponible"}</span>
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
        {selected ? <div className="absolute right-2 top-2 rounded bg-teal-500 px-2 py-1 text-xs font-semibold text-white">evento seleccionado</div> : null}
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
          <Metric label="Lat." value={item.latencyMs === null ? "—" : `${Math.round(item.latencyMs)}ms`} />
          <Metric label="Último" value={formatRelativeTime(item.lastSeenAt)} />
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-zinc-50 px-2 py-1">
      <div className="text-[10px] font-medium uppercase text-zinc-500">{label}</div>
      <div className="truncate font-semibold text-zinc-800">{value}</div>
    </div>
  );
}
