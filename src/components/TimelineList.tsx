import { TimelineEventCard } from "./timeline/TimelineEventCard";
import type { TimelineEvent } from "../types/api";

export function TimelineList({ items }: { items: TimelineEvent[] }) {
  if (items.length === 0) {
    return <div className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">No timeline events.</div>;
  }

  return (
    <div className="divide-y divide-zinc-200 rounded border border-zinc-200 bg-white">
      {items.map((item) => (
        <TimelineEventCard key={`${item.source_component}:${item.source_event_id}`} item={item} />
      ))}
    </div>
  );
}
