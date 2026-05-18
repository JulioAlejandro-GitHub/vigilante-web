import { Activity, AlertTriangle } from "lucide-react";

import { EmptyState } from "../../../components/DataState";
import type { ControlCenterEventGroup } from "../types/controlCenter.types";
import { EventCard } from "./EventCard";

interface LiveEventTimelineProps {
  events: ControlCenterEventGroup[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRetry: () => void;
  onSelect: (event: ControlCenterEventGroup) => void;
  canLoadMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export function LiveEventTimeline({
  events,
  selectedId,
  loading,
  error,
  refreshing,
  onRetry,
  onSelect,
  canLoadMore,
  loadingMore,
  onLoadMore,
}: LiveEventTimelineProps) {
  const criticalCount = events.filter((event) => event.priority.tier === "critical").length;

  return (
    <aside className="panel flex min-h-0 flex-col overflow-hidden">
      <div className="border-b border-zinc-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="truncate text-base font-semibold text-zinc-950">Eventos live</h2>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
            {refreshing ? <span className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">actualizando</span> : null}
            {criticalCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                {criticalCount} críticos
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-2.5">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded bg-zinc-100" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <div>{error}</div>
            <button className="btn mt-3" type="button" onClick={onRetry}>
              Reintentar
            </button>
          </div>
        ) : events.length === 0 ? (
          <EmptyState label="Sin eventos procesados recientes." />
        ) : (
          <>
            <div className="max-h-[calc(100vh-210px)] space-y-2 overflow-y-auto pr-1">
              {events.map((item) => (
                <EventCard key={item.id} item={item} selected={selectedId === item.id} onSelect={() => onSelect(item)} />
              ))}
            </div>
            {canLoadMore ? (
              <button className="btn mt-3 w-full justify-center" type="button" onClick={onLoadMore} disabled={loadingMore}>
                {loadingMore ? "Cargando eventos..." : "Cargar más eventos"}
              </button>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
