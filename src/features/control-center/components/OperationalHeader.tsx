import { Activity, AlertTriangle, Camera, RefreshCw, Server, ShieldCheck, UserCheck } from "lucide-react";

import { CameraStatusBadge } from "./StatusBadges";
import type { ControlCenterCameraTile, ControlCenterEventGroup, ControlCenterOverview } from "../types/controlCenter.types";
import type { CurrentUser } from "../../../types/session";
import { formatDateTime } from "../../../utils/format";

interface OperationalHeaderProps {
  overview: ControlCenterOverview;
  cameras: ControlCenterCameraTile[];
  events: ControlCenterEventGroup[];
  currentUser: CurrentUser;
  lastUpdatedAt: string | null;
  onRefresh: () => void;
  refreshing?: boolean;
}

export function OperationalHeader({ overview, cameras, events, currentUser, lastUpdatedAt, onRefresh, refreshing }: OperationalHeaderProps) {
  const activeCameras = cameras.filter((item) => item.status === "live" || item.status === "online").length;
  const degradedCameras = cameras.filter((item) => item.status === "degraded" || item.status === "stale" || item.status === "no_snapshot" || item.status === "not_started_concurrency").length;
  const criticalAlerts = events.filter((item) => item.priority.tier === "critical").length;
  const manualReview = events.filter((item) => item.priority.requiresManualReview).length;
  const pendingCases = (overview.summary?.open_cases ?? 0) + (overview.summary?.under_review_cases ?? 0);
  const healthStatus = overview.health?.status || (overview.error ? "degradado" : "conectado");
  const topEvent = events[0];

  return (
    <section data-testid="operational-header" className="overflow-hidden rounded border border-zinc-800 bg-zinc-950 text-white shadow-sm">
      <div className="px-3 py-3 sm:px-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 xl:max-w-[58%]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-xs font-semibold text-emerald-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.14)]" />
                monitoreo en vivo
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-xs font-medium text-zinc-200">
                <Server className="h-3.5 w-3.5" aria-hidden="true" />
                API {healthStatus}
              </span>
              {degradedCameras > 0 ? <CameraStatusBadge status="degraded" /> : <CameraStatusBadge status="online" />}
            </div>
            <div className="mt-2 flex flex-col gap-1 lg:flex-row lg:items-end lg:gap-3">
              <h1 className="text-xl font-semibold text-white">Centro de Control Vigilante</h1>
              <div className="truncate text-xs text-zinc-400">
                {topEvent ? `${topEvent.priority.eventLabel}: ${topEvent.priority.recognitionSummary}` : "Sin eventos recientes en cola."}
              </div>
            </div>
          </div>

          <div className="grid gap-1.5 text-xs text-zinc-300 sm:grid-cols-2 xl:w-[420px]">
            <ContextLine label="Operador" value={currentUser.display_name || currentUser.username} />
            <ContextLine label="Sitio" value={currentUser.site_id ?? "todos los sitios"} />
            <ContextLine label="Organización" value={currentUser.organization_id ?? "todas"} />
            <ContextLine label="Actualizado" value={lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "sin refresco"} />
          </div>
        </div>

        <div className="mt-2 flex justify-end border-t border-zinc-800 pt-2">
          <button className="btn shrink-0 border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-white hover:bg-zinc-800" type="button" onClick={onRefresh}>
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            Refrescar
          </button>
        </div>
      </div>

      <div className="grid gap-px bg-zinc-800 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<Camera className="h-4 w-4" />} label="Cámaras activas" value={`${activeCameras}/${cameras.length}`} />
        <Metric icon={<Activity className="h-4 w-4" />} label="Eventos priorizados" value={events.length} />
        <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Críticos" value={criticalAlerts} tone={criticalAlerts > 0 ? "danger" : "default"} />
        <Metric icon={<UserCheck className="h-4 w-4" />} label="Revisión manual" value={manualReview || overview.summary?.pending_manual_reviews || 0} tone={manualReview > 0 ? "warning" : "default"} />
        <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Casos pendientes" value={pendingCases} />
      </div>
    </section>
  );
}

function ContextLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1.5">
      <div className="text-[11px] font-semibold uppercase text-zinc-500">{label}</div>
      <div className="mt-0.5 truncate font-medium text-zinc-100">{value}</div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "warning";
}) {
  const toneClass = tone === "danger" ? "text-rose-300" : tone === "warning" ? "text-amber-300" : "text-zinc-300";
  return (
    <div className="bg-zinc-950 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-medium uppercase text-zinc-500">{label}</div>
        <span className={toneClass}>{icon}</span>
      </div>
      <div className={`mt-0.5 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}
