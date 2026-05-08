import type { ComponentProps } from "react";

import { StatusBadge } from "../StatusBadge";
import type { CameraRecommendationStatus, Severity } from "../../types/api";

type BadgeTone = ComponentProps<typeof StatusBadge>["tone"];

export function cameraRecommendationStatusTone(status: CameraRecommendationStatus | string | null | undefined): BadgeTone {
  if (status === "approved" || status === "applied") return "success";
  if (status === "pending") return "warning";
  if (status === "rejected" || status === "failed") return "danger";
  if (status === "rolled_back") return "info";
  return "default";
}

export function recommendationSeverityTone(severity: Severity | null | undefined): BadgeTone {
  if (severity === "critical" || severity === "high") return "danger";
  if (severity === "medium") return "warning";
  if (severity === "low") return "success";
  return "default";
}

export function CameraRecommendationStatusBadge({ status }: { status: CameraRecommendationStatus | string | null | undefined }) {
  return <StatusBadge value={status ?? "unknown"} tone={cameraRecommendationStatusTone(status)} />;
}

export function CameraRecommendationSeverityBadge({ severity }: { severity: Severity | null | undefined }) {
  return <StatusBadge value={severity ?? "unscored"} tone={recommendationSeverityTone(severity)} />;
}

export function CameraRecommendationFlagBadge({
  label,
  active,
  activeText,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeText: string;
  inactiveText: string;
}) {
  return <StatusBadge value={`${label}: ${active ? activeText : inactiveText}`} tone={active ? "success" : "default"} />;
}
