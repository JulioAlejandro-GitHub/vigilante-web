import type { CaseDetail, DashboardSummary, EvidenceMediaItem, HealthResponse, TimelineEvent } from "../../../types/api";
import type { Permission } from "../../../types/session";

export type ControlCenterCameraStatus = "live" | "online" | "degraded" | "stale" | "offline" | "no_snapshot" | "not_started_concurrency";

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
  priority: ControlCenterPriorityInsight | null;
  snapshotUrl: string | null;
  snapshotSource: "ingestion" | "recognition" | "camera_metadata" | null;
  liveFrame: ControlCenterLatestFrame | null;
  overlays: ControlCenterOverlay[];
  reason: string | null;
}

export interface ControlCenterIngestionState {
  camera_id: string;
  is_desired_active: boolean | null;
  worker_state: string | null;
  last_started_at: string | null;
  last_connected_at: string | null;
  last_frame_at: string | null;
  last_publish_at: string | null;
  frames_captured: number | null;
  events_published: number | null;
  last_error: string | null;
  updated_at: string | null;
}

export interface ControlCenterLatestFrame {
  camera_id: string;
  latest_frame_ref: string | null;
  latest_frame_at: string | null;
  frame_age_seconds: number | null;
  event_id: string | null;
  content_type: string | null;
  width: number | null;
  height: number | null;
  state: ControlCenterCameraStatus | "no_snapshot" | string;
  reason: string | null;
  media: EvidenceMediaItem | null;
  ingestion: ControlCenterIngestionState | null;
  metadata: Record<string, unknown>;
}

export type ControlCenterPriorityTier = "critical" | "attention" | "watch" | "normal";

export interface ControlCenterPriorityInsight {
  score: number;
  tier: ControlCenterPriorityTier;
  label: string;
  eventLabel: string;
  primaryReason: string;
  reasons: string[];
  tags: string[];
  recognitionSummary: string;
  sightingsCount: number;
  cameraCount: number;
  hasVisualEvidence: boolean;
  requiresManualReview: boolean;
  isIdentityConflict: boolean;
  isRecurrent: boolean;
  hasUsefulMatch: boolean;
  hasUsableUnknownFace: boolean;
}

export interface ControlCenterEventGroup {
  id: string;
  event: TimelineEvent;
  groupedEvents: TimelineEvent[];
  relatedCount: number;
  priority: ControlCenterPriorityInsight;
  previewEvidence: EvidenceMediaItem | null;
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
  timeline: TimelineEvent[];
  evidence: EvidenceMediaItem[];
  loading: boolean;
  refreshing: boolean;
  timelineLoading: boolean;
  timelineLoadingMore: boolean;
  timelineHasMore: boolean;
  evidenceLoading: boolean;
  evidenceLoadingMore: boolean;
  evidenceHasMore: boolean;
  error: string | null;
  evidenceError: string | null;
  refresh: () => void;
  loadMoreTimeline: () => void;
  loadMoreEvidence: () => void;
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
