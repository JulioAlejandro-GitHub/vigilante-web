import { StatusBadge, statusTone } from "./StatusBadge";
import type { TimelineEvent } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";
import { Link, useLocation } from "react-router-dom";

export function TimelineList({ items }: { items: TimelineEvent[] }) {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;

  if (items.length === 0) {
    return <div className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">No timeline events.</div>;
  }

  return (
    <div className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
      {items.map((item) => (
        <article key={`${item.source_component}:${item.source_event_id}`} className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={item.event_type} tone={statusTone(item.event_type)} />
                <StatusBadge value={item.severity} tone={statusTone(item.severity)} />
                <span className="text-xs text-zinc-500">{item.source_component}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-900">{item.summary}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
                {item.case_id ? (
                  <Link className="font-medium text-teal-800 underline-offset-2 hover:underline" to={`/cases/${item.case_id}`} state={{ returnTo }}>
                    Case {shortId(item.case_id)}
                  </Link>
                ) : null}
                {item.camera_id ? <span>Camera {shortId(item.camera_id)}</span> : null}
                {item.subject_id ? <span>Subject {shortId(item.subject_id)}</span> : null}
              </div>
            </div>
            <div className="text-xs text-zinc-500 sm:text-right">
              <div>{formatDateTime(item.event_ts)}</div>
              <div>{shortId(item.source_event_id)}</div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
