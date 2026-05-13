import type { CaseDetail, DashboardSummary, EvidenceMediaItem, HealthResponse, TimelineEvent } from "../../../types/api";
import type { Permission } from "../../../types/session";

export type ControlCenterCameraStatus = "online" | "degraded" | "offline";

export interface ControlCenterCamera {
  camera_id: string;
  external_camera_key: string | null;
  site_id: string | null;
  zone_id: string | null;
  name: string | null;
  is_active: boolean;
  source_type: string | null;
  camera_hostname: string | null;
  camera_port: number | null;
  camera_path: string | null;
  rtsp_transport: string | null;
  channel: number | null;
  subtype: number | null;
  camera_user: string | null;
  metadata: Record<string, unknown>;
}

export interface ControlCenterOverlay {
  id: string;
  label: string;
  confidence: number | null;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null;
}

export interface ControlCenterCameraTile {
  camera: ControlCenterCamera;
  status: ControlCenterCameraStatus;
  fps: number | null;
  latencyMs: number | null;
  lastSeenAt: string | null;
  latestEvent: TimelineEvent | null;
  snapshotUrl: string | null;
  overlays: ControlCenterOverlay[];
  reason: string | null;
}

export interface ControlCenterEventGroup {
  id: string;
  event: TimelineEvent;
  groupedEvents: TimelineEvent[];
  relatedCount: number;
}

export interface ControlCenterOverview {
  health: HealthResponse | null;
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface ControlCenterCaseBundle {
  detail: CaseDetail | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refresh: () => void;
}

export type EvidenceKind = "face" | "body" | "frame" | "context" | "clip" | "recurrence" | "match" | "cross-camera" | "evidence";

export interface ControlCenterEvidenceItem extends EvidenceMediaItem {
  control_center_kind?: EvidenceKind;
  control_center_label?: string;
  control_center_score?: number | null;
}

export interface RiskSignal {
  key: string;
  label: string;
  value: number | null;
  detail: string;
}

export interface OperatorActionDefinition {
  key: "flag_suspicious" | "resolve_benign" | "close_case" | "reopen_case" | "link_profile" | "merge_case";
  label: string;
  tone: "default" | "primary" | "danger";
  permission: Permission | null;
  critical: boolean;
  disabledReason?: string;
}
