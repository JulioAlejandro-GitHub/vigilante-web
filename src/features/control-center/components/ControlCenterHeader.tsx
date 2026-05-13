import { Activity, AlertTriangle, Camera, RefreshCw, Server, UserCheck } from "lucide-react";

import { CameraStatusBadge, normalizeSeverityRank } from "./StatusBadges";
import type { ControlCenterCameraTile, ControlCenterEventGroup, ControlCenterOverview } from "../types/controlCenter.types";

interface ControlCenterHeaderProps {
  overview: ControlCenterOverview;
  cameras: ControlCenterCameraTile[];
  events: ControlCenterEventGroup[];
  onRefresh: () => void;
  refreshing?: boolean;
}

export function ControlCenterHeader({ overview, cameras, events, onRefresh, refreshing }: ControlCenterHeaderProps) {
  const activeCameras = cameras.filter((item) => item.status === "online").length;
  const degradedCameras = cameras.filter((item) => item.status === "degraded").length;
  const criticalAlerts = events.filter((item) => normalizeSeverityRank(String(item.event.severity)) >= 4).length;
  const pendingCases = (overview.summary?.open_cases ?? 0) + (overview.summary?.under_review_cases ?? 0);
  const healthStatus = overview.health?.status || (overview.error ? "degraded" : "connected");

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-zinc-200 bg-zinc-950 px-4 py-4 text-white sm:px-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">Vigilante Control Center</h1>
              <span className="rounded border border-teal-300/40 bg-teal-300/10 px-2 py-1 text-xs font-semibold text-teal-100">modo activo</span>
              <span className="inline-flex items-center gap-1 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-200">
                <Server className="h-3.5 w-3.5" aria-hidden="true" />
                servidor {healthStatus}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-zinc-300">
              Eventos procesados, evidencia visual y acciones humanas en una vista operativa.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {degradedCameras > 0 ? <CameraStatusBadge status="degraded" /> : <CameraStatusBadge status="online" />}
            <button className="btn border-zinc-600 bg-zinc-900 text-white hover:bg-zinc-800" type="button" onClick={onRefresh}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>
      </div>
      <div className="grid gap-px bg-zinc-200 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={<Camera className="h-4 w-4" />} label="Cámaras activas" value={`${activeCameras}/${cameras.length}`} />
        <Metric icon={<Activity className="h-4 w-4" />} label="Eventos recientes" value={events.length} />
        <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Casos pendientes" value={pendingCases} />
        <Metric icon={<AlertTriangle className="h-4 w-4" />} label="Alertas críticas" value={criticalAlerts} tone={criticalAlerts > 0 ? "danger" : "default"} />
        <Metric icon={<UserCheck className="h-4 w-4" />} label="Revisión humana" value={overview.summary?.pending_manual_reviews ?? 0} />
      </div>
    </section>
  );
}

function Metric({ icon, label, value, tone = "default" }: { icon: React.ReactNode; label: string; value: string | number; tone?: "default" | "danger" }) {
  return (
    <div className="bg-white px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase text-zinc-500">{label}</div>
        <span className={tone === "danger" ? "text-rose-700" : "text-zinc-500"}>{icon}</span>
      </div>
      <div className={`mt-1 text-2xl font-semibold ${tone === "danger" ? "text-rose-700" : "text-zinc-950"}`}>{value}</div>
    </div>
  );
}
