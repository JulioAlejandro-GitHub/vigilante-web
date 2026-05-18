import { Activity, AlertTriangle, Camera, RefreshCw, Server, ShieldCheck, UserCheck } from "lucide-react";

import { CameraStatusBadge, formatRelativeTime } from "./StatusBadges";
import type { ControlCenterCameraTile, ControlCenterEventGroup, ControlCenterOverview } from "../types/controlCenter.types";
import type { CurrentUser } from "../../../types/session";
import { shortId } from "../../../utils/format";

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
  const priorityLine = topEvent ? `${topEvent.priority.eventLabel}: ${topEvent.priority.recognitionSummary}` : "Sin eventos en cola";
  const operatorContext = [
    currentUser.display_name || currentUser.username,
    currentUser.site_id ? shortId(currentUser.site_id) : "todos",
    currentUser.organization_id ? shortId(currentUser.organization_id) : "todas",
  ].join(" · ");

  return (
    <section data-testid="operational-header" className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="inline-flex h-7 items-center gap-1.5 rounded border border-emerald-400/40 bg-emerald-400/10 px-2 text-xs font-semibold text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(110,231,183,0.14)]" />
            live
          </span>
          <h1 className="text-sm font-semibold text-white sm:text-base">Centro de Control</h1>
          <span className="inline-flex h-7 items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 text-xs font-medium text-zinc-200">
            <Server className="h-3.5 w-3.5" aria-hidden="true" />
            API {healthStatus}
          </span>
          {degradedCameras > 0 ? <CameraStatusBadge status="degraded" /> : <CameraStatusBadge status="online" />}
          <span className="min-w-[160px] flex-1 truncate text-xs text-zinc-300">
            <span className="font-semibold text-zinc-100">Prioridad:</span> {priorityLine}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <CompactMetric icon={<Camera className="h-3.5 w-3.5" />} label="Cam" value={`${activeCameras}/${cameras.length}`} />
          <CompactMetric icon={<Activity className="h-3.5 w-3.5" />} label="Ev" value={events.length} />
          <CompactMetric icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Crit" value={criticalAlerts} tone={criticalAlerts > 0 ? "danger" : "default"} />
          <CompactMetric icon={<UserCheck className="h-3.5 w-3.5" />} label="Rev" value={manualReview || overview.summary?.pending_manual_reviews || 0} tone={manualReview > 0 ? "warning" : "default"} />
          <CompactMetric icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Casos" value={pendingCases} />
          <ContextChip label="Ctx" value={operatorContext} wide />
          <ContextChip label="Upd" value={lastUpdatedAt ? formatRelativeTime(lastUpdatedAt) : "sin"} />
          <button
            className="inline-flex h-7 items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
            type="button"
            onClick={onRefresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
            Refrescar
          </button>
        </div>
      </div>
    </section>
  );
}

function ContextChip({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <span className={`inline-flex h-7 items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 text-zinc-300 ${wide ? "max-w-[260px]" : "max-w-[110px]"}`}>
      <span className="font-semibold uppercase text-zinc-500">{label}</span>
      <span className="truncate font-medium text-zinc-100">{value}</span>
    </span>
  );
}

function CompactMetric({
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
    <span className={`inline-flex h-7 items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 font-semibold ${toneClass}`}>
      {icon}
      <span className="uppercase text-zinc-500">{label}</span>
      <span>{value}</span>
    </span>
  );
}
