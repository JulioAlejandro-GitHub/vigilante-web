import { Radio } from "lucide-react";

import { EmptyState } from "../../../components/DataState";
import type { ControlCenterCameraTile } from "../types/controlCenter.types";
import { CameraTile } from "./CameraTile";

interface LiveCameraGridProps {
  cameras: ControlCenterCameraTile[];
  selectedCameraId: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  canLoadMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}

export function LiveCameraGrid({ cameras, selectedCameraId, loading, error, onRetry, canLoadMore, loadingMore, onLoadMore }: LiveCameraGridProps) {
  if (loading) {
    return (
      <section className="panel p-4">
        <SectionTitle count={0} loading />
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-video animate-pulse rounded bg-zinc-200" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel p-4">
        <SectionTitle count={0} />
        <div className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <div>{error}</div>
          <button className="btn mt-3" type="button" onClick={onRetry}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  if (cameras.length === 0) {
    return (
      <section className="panel p-4">
        <SectionTitle count={0} />
        <EmptyState label="Sin cámaras disponibles para la sesión autorizada." />
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <SectionTitle count={cameras.length} />
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {cameras.map((item) => (
          <CameraTile key={item.camera.camera_id} item={item} selected={selectedCameraId === item.camera.camera_id} />
        ))}
      </div>
      {canLoadMore ? (
        <button className="btn mt-3 w-full justify-center" type="button" onClick={onLoadMore} disabled={loadingMore}>
          {loadingMore ? "Cargando cámaras..." : "Cargar más cámaras"}
        </button>
      ) : null}
    </section>
  );
}

function SectionTitle({ count, loading }: { count: number; loading?: boolean }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-zinc-950">Mosaico vivo de cámaras</h2>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">Snapshots seguros, actividad reciente y señales recognition por cámara.</p>
      </div>
      <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">
        {loading ? "cargando" : `${count} feeds`}
      </span>
    </div>
  );
}
