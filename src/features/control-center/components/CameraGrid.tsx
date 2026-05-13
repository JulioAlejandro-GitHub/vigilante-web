import { EmptyState } from "../../../components/DataState";
import type { ControlCenterCameraTile } from "../types/controlCenter.types";
import { CameraTile } from "./CameraTile";

interface CameraGridProps {
  cameras: ControlCenterCameraTile[];
  selectedCameraId: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function CameraGrid({ cameras, selectedCameraId, loading, error, onRetry }: CameraGridProps) {
  if (loading) {
    return (
      <section className="panel p-4">
        <SectionTitle title="Cámaras activas" />
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="aspect-video animate-pulse rounded bg-zinc-200" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel p-4">
        <SectionTitle title="Cámaras activas" />
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
        <SectionTitle title="Cámaras activas" />
        <EmptyState label="Sin cámaras disponibles para la sesión autorizada." />
      </section>
    );
  }

  const visibleCameras = cameras.slice(0, 6);
  const extraCount = cameras.length - visibleCameras.length;

  return (
    <section className="panel p-4">
      <SectionTitle title="Cámaras activas" count={cameras.length} />
      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {visibleCameras.map((item) => (
          <CameraTile key={item.camera.camera_id} item={item} selected={selectedCameraId === item.camera.camera_id} />
        ))}
      </div>
      {extraCount > 0 ? (
        <div className="mt-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
          Mostrando {visibleCameras.length} cámaras con foco operativo. Hay {extraCount} adicionales disponibles en la API.
        </div>
      ) : null}
    </section>
  );
}

function SectionTitle({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      {count !== undefined ? <span className="text-xs font-medium text-zinc-500">{count}</span> : null}
    </div>
  );
}
