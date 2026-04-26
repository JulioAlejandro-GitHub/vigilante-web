import { Link, useLocation } from "react-router-dom";

import { ContextChips } from "../context/ContextChips";
import { EvidenceSection } from "../evidence/EvidenceSection";
import { OwnerBadge } from "../ownership/OwnerBadge";
import { EventTypeBadge } from "./EventTypeBadge";
import { TechnicalMetadataGrid } from "../evidence/TechnicalMetadataGrid";
import { StatusBadge, statusTone } from "../StatusBadge";
import type { TimelineEvent } from "../../types/api";
import { asRecord, payloadString } from "../../utils/evidence";
import { formatDateTime, shortId } from "../../utils/format";

interface TimelineEventCardProps {
  item: TimelineEvent;
}

export function TimelineEventCard({ item }: TimelineEventCardProps) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const reviewId = payloadString(item.payload, ["review_id", "manual_review_id"]);
  const suggestionId = payloadString(item.payload, ["suggestion_id", "case_suggestion_id"]);
  const confidence = item.confidence ?? payloadString(item.payload, ["confidence", "match_confidence"]);
  const assignment = asRecord(item.payload.case_assignment);
  const assignedTo = typeof assignment?.assigned_to === "string" ? assignment.assigned_to : null;
  const assignedAt = typeof assignment?.assigned_at === "string" ? assignment.assigned_at : null;

  return (
    <article className="p-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <EventTypeBadge eventType={item.event_type} />
            <StatusBadge value={item.severity} tone={statusTone(item.severity)} />
            <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{item.source_component}</span>
            {assignedTo || item.event_type === "case_unassigned" ? <OwnerBadge assignedTo={assignedTo} assignedAt={assignedAt} compact /> : null}
          </div>
          <p className="mt-2 text-sm text-zinc-900">{item.summary}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {item.case_id ? (
              <Link className="rounded bg-teal-50 px-2 py-1 font-medium text-teal-800 hover:bg-teal-100" to={`/cases/${item.case_id}?returnTo=${encodeURIComponent(returnTo)}`}>
                Case {shortId(item.case_id)}
              </Link>
            ) : null}
            {reviewId ? (
              <Link
                className="rounded bg-indigo-50 px-2 py-1 font-medium text-indigo-800 hover:bg-indigo-100"
                to={`/manual-reviews?review_id=${encodeURIComponent(reviewId)}&returnTo=${encodeURIComponent(returnTo)}`}
              >
                Review {shortId(reviewId)}
              </Link>
            ) : null}
            {suggestionId ? (
              <Link
                className="rounded bg-amber-50 px-2 py-1 font-medium text-amber-800 hover:bg-amber-100"
                to={`/case-suggestions?suggestion_id=${encodeURIComponent(suggestionId)}&returnTo=${encodeURIComponent(returnTo)}`}
              >
                Suggestion {shortId(suggestionId)}
              </Link>
            ) : null}
            <Link className="rounded bg-zinc-100 px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-200" to={`/timeline?source_event_id=${encodeURIComponent(item.source_event_id)}&limit=50`}>
              Source {shortId(item.source_event_id)}
            </Link>
          </div>
        </div>
        <div className="shrink-0 text-xs text-zinc-500 sm:text-right">
          <div>{formatDateTime(item.event_ts)}</div>
          <div>{shortId(item.source_event_id)}</div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        <ContextChips organizationId={item.organization_id} siteId={item.site_id} />
        <TechnicalMetadataGrid
          rows={[
            { label: "Camera", value: shortId(item.camera_id) },
            { label: "Subject", value: shortId(item.subject_id) },
            { label: "Track", value: shortId(item.track_id) },
            { label: "Confidence", value: confidence ?? "—" },
            { label: "Organization", value: shortId(item.organization_id) },
            { label: "Site", value: shortId(item.site_id) },
          ]}
        />
      </div>

      <details className="mt-3 rounded border border-zinc-200 bg-zinc-50 p-3">
        <summary className="cursor-pointer text-sm font-medium text-zinc-800">Evidence summary and payload</summary>
        <div className="mt-3">
          <EvidenceSection payload={item.payload} sourceEventId={item.source_event_id} title="Timeline evidence" compact />
        </div>
      </details>
    </article>
  );
}
