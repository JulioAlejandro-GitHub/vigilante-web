import { Radio } from "lucide-react";

import { EmptyState } from "../../../components/DataState";
import type { ControlCenterCameraTile } from "../types/controlCenter.types";
import type { CameraLiveBudget } from "../utils/cameraLiveBudget";
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
  liveBudget: CameraLiveBudget;
}

export function LiveCameraGrid({ cameras, selectedCameraId, loading, error, onRetry, canLoadMore, loadingMore, onLoadMore, liveBudget }: LiveCameraGridProps) {
  if (loading) {
    return (
      <section className="panel p-4">
        <SectionTitle count={0} loading liveBudget={liveBudget} />
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
        <SectionTitle count={0} liveBudget={liveBudget} />
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
        <SectionTitle count={0} liveBudget={liveBudget} />
        <EmptyState label="Sin cámaras disponibles para la sesión autorizada." />
      </section>
    );
  }

  return (
    <section className="panel p-4">
      <SectionTitle count={cameras.length} liveBudget={liveBudget} />
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

function SectionTitle({ count, loading, liveBudget }: { count: number; loading?: boolean; liveBudget: CameraLiveBudget }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <h2 className="text-base font-semibold text-zinc-950">Cámaras live</h2>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">
          {loading ? "cargando" : `${count} feeds`}
        </span>
        <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          {formatFps(liveBudget.activeMaxFps)} fps foco
        </span>
        <span className="rounded border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-500">
          {formatFps(liveBudget.backgroundMaxFps)} fps resto
        </span>
      </div>
    </div>
  );
}

function formatFps(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}
