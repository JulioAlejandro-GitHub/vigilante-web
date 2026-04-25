import { StatusBadge, statusTone } from "./StatusBadge";
import type { TimelineEvent } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";

export function TimelineList({ items }: { items: TimelineEvent[] }) {
  if (items.length === 0) {
    return <div className="rounded border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No timeline events.</div>;
  }

  return (
    <div className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
      {items.map((item) => (
        <div key={`${item.source_component}:${item.source_event_id}`} className="p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={item.event_type} tone={statusTone(item.event_type)} />
                <span className="text-xs text-zinc-500">{item.source_component}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-900">{item.summary}</p>
            </div>
            <div className="text-xs text-zinc-500 sm:text-right">
              <div>{formatDateTime(item.event_ts)}</div>
              <div>{shortId(item.source_event_id)}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
