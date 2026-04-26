import { Link } from "react-router-dom";

import { TechnicalMetadataGrid } from "./TechnicalMetadataGrid";
import { asRecord, sourceEventMetadata, summarizeValue } from "../../utils/evidence";

interface SourceEventSummaryProps {
  sourceEvent: unknown;
  sourceEventId?: string | null;
}

export function SourceEventSummary({ sourceEvent, sourceEventId }: SourceEventSummaryProps) {
  const record = asRecord(sourceEvent);
  const eventId = sourceEventId ?? (record?.source_event_id as string | undefined) ?? (record?.event_id as string | undefined);

  if (!record && !eventId) {
    return null;
  }

  return (
    <article className="rounded border border-zinc-200 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-zinc-950">Source event</h4>
          <p className="mt-1 text-xs text-zinc-500">Origin signal that fed this operational artifact.</p>
        </div>
        {eventId ? (
          <Link className="btn" to={`/timeline?source_event_id=${encodeURIComponent(eventId)}&limit=50`}>
            Open in timeline
          </Link>
        ) : null}
      </div>
      {record ? (
        <div className="mt-3">
          <TechnicalMetadataGrid rows={sourceEventMetadata(record)} />
          {record.summary ? <p className="mt-3 text-sm text-zinc-900">{summarizeValue(record.summary)}</p> : null}
        </div>
      ) : null}
    </article>
  );
}
