import { AlertTriangle, Camera, Eye, FileText, ImageOff, UserRound } from "lucide-react";

import { ConfidenceBadge, formatRelativeTime, SeverityBadge } from "./StatusBadges";
import type { ControlCenterEventGroup, ControlCenterPriorityTier } from "../types/controlCenter.types";
import { subjectDisplayName, visualEventSummary } from "../utils/priority";
import { shortId } from "../../../utils/format";

interface EventCardProps {
  item: ControlCenterEventGroup;
  selected: boolean;
  onSelect: () => void;
}

export function EventCard({ item, selected, onSelect }: EventCardProps) {
  const event = item.event;
  const preview = item.previewEvidence ?? event.evidence_media?.find((candidate) => candidate.thumbnail_url || candidate.content_url || candidate.proxy_url);
  const previewUrl = preview?.thumbnail_url || preview?.content_url || preview?.proxy_url || null;
  const identity = subjectDisplayName(event);
  const tone = priorityTone(item.priority.tier);

  return (
    <button
      type="button"
      data-testid="priority-event-card"
      data-priority-tier={item.priority.tier}
      className={`w-full overflow-hidden rounded border text-left transition ${
        selected ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-100" : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
      }`}
      onClick={onSelect}
    >
      <div className={`h-1.5 ${tone.bar}`} />
      <div className="flex gap-3 p-3">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded bg-zinc-100">
          {previewUrl ? (
            <img src={previewUrl} alt={`Evidencia del evento ${shortId(event.source_event_id)}`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center text-zinc-400">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
              <span className="text-[10px] font-medium">evidencia bajo demanda</span>
            </div>
          )}
          <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-semibold ${tone.badge}`}>{item.priority.label}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={event.severity} />
            <ConfidenceBadge value={event.confidence} />
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold ${tone.soft}`}>
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              score {item.priority.score}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold uppercase text-zinc-500">{item.priority.eventLabel}</div>
          <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-950">
            <UserRound className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
            <span className="truncate">{identity}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-700">{visualEventSummary(event, event.summary)}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.priority.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              {shortId(event.camera_id)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              {item.priority.sightingsCount} avist.
            </span>
            <span>{formatRelativeTime(event.event_ts)}</span>
            {event.case_id ? (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                {shortId(event.case_id)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </button>
  );
}

function priorityTone(tier: ControlCenterPriorityTier) {
  if (tier === "critical") {
    return {
      bar: "bg-rose-600",
      badge: "bg-rose-600 text-white",
      soft: "border-rose-200 bg-rose-50 text-rose-700",
    };
  }
  if (tier === "attention") {
    return {
      bar: "bg-amber-500",
      badge: "bg-amber-400 text-zinc-950",
      soft: "border-amber-200 bg-amber-50 text-amber-800",
    };
  }
  if (tier === "watch") {
    return {
      bar: "bg-sky-500",
      badge: "bg-sky-600 text-white",
      soft: "border-sky-200 bg-sky-50 text-sky-700",
    };
  }
  return {
    bar: "bg-zinc-300",
    badge: "bg-zinc-800 text-white",
    soft: "border-zinc-200 bg-zinc-50 text-zinc-600",
  };
}
