import { EmptyState } from "../../../components/DataState";
import type { ControlCenterEventGroup } from "../types/controlCenter.types";
import { EventCard } from "./EventCard";

interface EventTimelineProps {
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

export function EventTimeline({ events, selectedId, loading, error, refreshing, onRetry, onSelect, canLoadMore, loadingMore, onLoadMore }: EventTimelineProps) {
  return (
    <section className="panel p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Eventos en vivo</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Último evento arriba, agrupado por caso cuando corresponde.</p>
        </div>
        {refreshing ? <span className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700">actualizando</span> : null}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded bg-zinc-100" />
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
          <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
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
    </section>
  );
}
