import { ArrowRight, UserMinus } from "lucide-react";

import type { TimelineEvent } from "../../types/api";
import { asRecord, summarizeValue } from "../../utils/evidence";
import { formatDateTime } from "../../utils/format";

interface OwnershipHistoryPreviewProps {
  timeline: TimelineEvent[];
  currentOwner?: string | null;
}

interface OwnershipEvent {
  id: string;
  action: string;
  previousOwner: string | null;
  nextOwner: string | null;
  actor: string | null;
  reason: string | null;
  at: string;
}

function ownershipEvent(item: TimelineEvent): OwnershipEvent | null {
  if (!["case_assigned", "case_reassigned", "case_unassigned"].includes(item.event_type)) {
    return null;
  }

  const payload = asRecord(item.payload.case_assignment) ?? item.payload;
  return {
    id: item.source_event_id,
    action: String(payload.action_type ?? item.event_type.replace("case_", "")),
    previousOwner: typeof payload.previous_assigned_to === "string" ? payload.previous_assigned_to : null,
    nextOwner: typeof payload.assigned_to === "string" ? payload.assigned_to : null,
    actor: typeof payload.assigned_by === "string" ? payload.assigned_by : null,
    reason: typeof payload.assignment_reason === "string" ? payload.assignment_reason : null,
    at: formatDateTime(typeof payload.assigned_at === "string" ? payload.assigned_at : item.event_ts),
  };
}

export function OwnershipHistoryPreview({ timeline, currentOwner }: OwnershipHistoryPreviewProps) {
  const events = timeline.map(ownershipEvent).filter((item): item is OwnershipEvent => item !== null).slice(0, 4);

  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Ownership history</h2>
          <p className="mt-1 text-sm text-zinc-600">Recent assignment events inferred from the case timeline.</p>
        </div>
        <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{events.length} events</span>
      </div>

      <div className="mt-4 space-y-3">
        {events.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-600">
            No assignment events are present in the recent timeline.
            <div className="mt-1 font-medium text-zinc-800">Current owner: {currentOwner ?? "Unassigned"}</div>
          </div>
        ) : null}
        {events.map((event) => (
          <article key={event.id} className="rounded border border-zinc-200 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-900">
              {event.previousOwner ? <span>{event.previousOwner}</span> : <UserMinus className="h-4 w-4 text-zinc-500" aria-hidden="true" />}
              <ArrowRight className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
              <span>{event.nextOwner ?? "Unassigned"}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span>{event.action}</span>
              <span>{event.at}</span>
              {event.actor ? <span>by {event.actor}</span> : null}
            </div>
            {event.reason ? <p className="mt-2 text-sm text-zinc-700">{summarizeValue(event.reason)}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
