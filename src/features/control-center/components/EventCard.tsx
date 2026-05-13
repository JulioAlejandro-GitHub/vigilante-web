import { Camera, FileText, ImageOff, UserRound } from "lucide-react";

import { ConfidenceBadge, formatRelativeTime, SeverityBadge } from "./StatusBadges";
import type { ControlCenterEventGroup } from "../types/controlCenter.types";
import { shortId } from "../../../utils/format";
import { asRecord, payloadString, summarizeValue } from "../../../utils/evidence";

interface EventCardProps {
  item: ControlCenterEventGroup;
  selected: boolean;
  onSelect: () => void;
}

export function EventCard({ item, selected, onSelect }: EventCardProps) {
  const event = item.event;
  const preview = event.evidence_media?.find((candidate) => candidate.thumbnail_url || candidate.content_url || candidate.proxy_url);
  const previewUrl = preview?.thumbnail_url || preview?.content_url || preview?.proxy_url || null;
  const identity = identityLabel(event);

  return (
    <button
      type="button"
      className={`w-full rounded border p-3 text-left transition ${
        selected ? "border-teal-500 bg-teal-50/60 ring-2 ring-teal-100" : "border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50"
      }`}
      onClick={onSelect}
    >
      <div className="flex gap-3">
        <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded bg-zinc-100">
          {previewUrl ? (
            <img src={previewUrl} alt={`Evidencia del evento ${shortId(event.source_event_id)}`} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={event.severity} />
            <ConfidenceBadge value={event.confidence} />
            {item.relatedCount > 1 ? (
              <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">
                {item.relatedCount} relacionados
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-950">
            <UserRound className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
            <span className="truncate">{identity}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-700">{event.summary || summarizeValue(event.payload)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1">
              <Camera className="h-3.5 w-3.5" aria-hidden="true" />
              {shortId(event.camera_id)}
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

function identityLabel(event: ControlCenterEventGroup["event"]) {
  const payload = event.payload ?? {};
  const knownName = payloadString(payload, ["identity_name", "person_name", "candidate_name", "matched_name"]);
  if (knownName) {
    return knownName;
  }
  const personProfile = payloadString(payload, ["person_profile_id", "matched_person_profile_id"]);
  if (personProfile) {
    return `Identidad ${shortId(personProfile)}`;
  }
  const observed = event.subject_id || payloadString(payload, ["observed_subject_id", "subject_id"]);
  if (observed) {
    return `Sujeto Observado ${shortId(observed)}`;
  }
  const sourceEvent = asRecord(payload.source_event);
  const nestedSubject = sourceEvent ? payloadString(sourceEvent, ["subject_id", "observed_subject_id"]) : null;
  return nestedSubject ? `Sujeto Observado ${shortId(nestedSubject)}` : "Sujeto no identificado";
}
