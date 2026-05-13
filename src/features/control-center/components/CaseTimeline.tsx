import { Camera, CircleDot } from "lucide-react";

import { SeverityBadge, formatRelativeTime } from "./StatusBadges";
import type { TimelineEvent } from "../../../types/api";
import { formatDateTime, shortId } from "../../../utils/format";

interface CaseTimelineProps {
  events: TimelineEvent[];
}

export function CaseTimeline({ events }: CaseTimelineProps) {
  const chronological = [...events].sort((left, right) => new Date(left.event_ts).getTime() - new Date(right.event_ts).getTime());
  const cameras = Array.from(new Set(events.map((event) => event.camera_id).filter(Boolean)));

  return (
    <section className="rounded border border-zinc-200 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Cronología del caso</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Apariciones y acciones vinculadas.</p>
        </div>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">{events.length}</span>
      </div>
      {cameras.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cameras.slice(0, 5).map((cameraId) => (
            <span key={cameraId} className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              {shortId(cameraId)}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 space-y-3">
        {chronological.slice(-6).map((event) => (
          <div key={`${event.source_component}:${event.source_event_id}`} className="flex gap-3">
            <div className="pt-1 text-zinc-400">
              <CircleDot className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1 border-b border-zinc-100 pb-3 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <SeverityBadge severity={event.severity} />
                <span className="text-xs text-zinc-500" title={formatDateTime(event.event_ts)}>
                  {formatRelativeTime(event.event_ts)}
                </span>
              </div>
              <div className="mt-1 truncate text-sm font-medium text-zinc-900">{event.summary || event.event_type}</div>
              <div className="mt-0.5 text-xs text-zinc-500">
                {shortId(event.camera_id)} · {shortId(event.source_event_id)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
