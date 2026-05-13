import { AlertTriangle, CheckCircle2, Circle, Clock, ShieldAlert } from "lucide-react";

import type { ControlCenterCameraStatus } from "../types/controlCenter.types";
import type { Severity } from "../../../types/api";

export function SeverityBadge({ severity }: { severity: Severity | null | undefined }) {
  const value = String(severity || "informative").toLowerCase();
  const classes = severityClasses(value);
  const Icon = value === "critical" || value === "high" ? ShieldAlert : value === "medium" ? AlertTriangle : Circle;

  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded border px-2 py-1 text-xs font-semibold ${classes}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{severityLabel(value)}</span>
    </span>
  );
}

export function CameraStatusBadge({ status }: { status: ControlCenterCameraStatus }) {
  const classes =
    status === "online"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "degraded"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-zinc-300 bg-zinc-100 text-zinc-600";
  const Icon = status === "online" ? CheckCircle2 : status === "degraded" ? Clock : AlertTriangle;

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-xs font-semibold ${classes}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}

export function ConfidenceBadge({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  const percent = value <= 1 ? Math.round(value * 100) : Math.round(value);
  const tone = percent >= 85 ? "border-emerald-200 bg-emerald-50 text-emerald-700" : percent >= 60 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-zinc-200 bg-zinc-50 text-zinc-600";
  return <span className={`rounded border px-2 py-1 text-xs font-semibold ${tone}`}>{percent}%</span>;
}

export function severityClasses(value: string | null | undefined) {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "critical") return "border-rose-300 bg-rose-50 text-rose-800";
  if (normalized === "high") return "border-orange-200 bg-orange-50 text-orange-800";
  if (normalized === "medium") return "border-amber-200 bg-amber-50 text-amber-800";
  if (normalized === "low") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (normalized.includes("match")) return "border-teal-200 bg-teal-50 text-teal-800";
  if (normalized.includes("technical")) return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-zinc-200 bg-zinc-50 text-zinc-600";
}

export function severityLabel(value: string) {
  if (value === "critical") return "crítico";
  if (value === "high") return "alto";
  if (value === "medium") return "sospechoso";
  if (value === "low") return "informativo";
  return value.replace(/_/g, " ");
}

export function formatRelativeTime(value: string | null | undefined) {
  if (!value) {
    return "sin hora";
  }
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return value;
  }
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

export function normalizeSeverityRank(severity: string | null | undefined) {
  const normalized = String(severity || "").toLowerCase();
  if (normalized === "critical") return 4;
  if (normalized === "high") return 3;
  if (normalized === "medium") return 2;
  if (normalized === "low") return 1;
  return 0;
}
