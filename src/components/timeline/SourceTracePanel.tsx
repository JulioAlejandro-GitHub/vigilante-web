import { Link } from "react-router-dom";

import { KeyValue } from "../KeyValue";
import type { TimelineEvent } from "../../types/api";
import { payloadString } from "../../utils/evidence";
import { shortId } from "../../utils/format";

interface SourceTracePanelProps {
  event: TimelineEvent;
  returnTo: string;
}

export function SourceTracePanel({ event, returnTo }: SourceTracePanelProps) {
  const reviewId = payloadString(event.payload, ["review_id", "manual_review_id"]);
  const suggestionId = payloadString(event.payload, ["suggestion_id", "case_suggestion_id"]);

  return (
    <section className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">Source trace</h2>
      <div className="mt-4 grid gap-3">
        <KeyValue
          label="Case"
          value={
            event.case_id ? (
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/cases/${event.case_id}?returnTo=${encodeURIComponent(returnTo)}`}>
                {shortId(event.case_id)}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <KeyValue
          label="Review"
          value={
            reviewId ? (
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/manual-reviews/${reviewId}?returnTo=${encodeURIComponent(returnTo)}`}>
                {shortId(reviewId)}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <KeyValue
          label="Suggestion"
          value={
            suggestionId ? (
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/case-suggestions/${suggestionId}?returnTo=${encodeURIComponent(returnTo)}`}>
                {shortId(suggestionId)}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <KeyValue label="Source event" value={shortId(event.source_event_id)} />
      </div>
    </section>
  );
}
