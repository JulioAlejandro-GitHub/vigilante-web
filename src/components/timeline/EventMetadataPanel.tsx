import { KeyValue } from "../KeyValue";
import { EventTypeBadge } from "./EventTypeBadge";
import { StatusBadge, statusTone } from "../StatusBadge";
import type { TimelineEvent } from "../../types/api";
import { formatDateTime, shortId } from "../../utils/format";

export function EventMetadataPanel({ event }: { event: TimelineEvent }) {
  return (
    <section className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">Event metadata</h2>
      <div className="mt-4 grid gap-3">
        <KeyValue label="Event type" value={<EventTypeBadge eventType={event.event_type} />} />
        <KeyValue label="Severity" value={<StatusBadge value={event.severity} tone={statusTone(event.severity)} />} />
        <KeyValue label="Event time" value={formatDateTime(event.event_ts)} />
        <KeyValue label="Confidence" value={event.confidence ?? "—"} />
        <KeyValue label="Source event" value={shortId(event.source_event_id)} />
        <KeyValue label="Source component" value={event.source_component} />
        <KeyValue label="Case" value={shortId(event.case_id)} />
        <KeyValue label="Subject" value={shortId(event.subject_id)} />
        <KeyValue label="Track" value={shortId(event.track_id)} />
        <KeyValue label="Camera" value={shortId(event.camera_id)} />
        <KeyValue label="Organization" value={shortId(event.organization_id)} />
        <KeyValue label="Site" value={shortId(event.site_id)} />
      </div>
    </section>
  );
}
