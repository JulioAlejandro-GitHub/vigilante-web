export type Severity = "low" | "medium" | "high" | "critical" | string;

export interface EvidenceMediaItem {
  ref: string;
  resolved?: boolean;
  media_id?: string | null;
  media_type?: string | null;
  storage_backend?: string | null;
  bucket?: string | null;
  object_key?: string | null;
  content_type?: string | null;
  size_bytes?: number | null;
  width?: number | null;
  height?: number | null;
  captured_at?: string | null;
  last_modified_at?: string | null;
  camera_id?: string | null;
  checksum_sha256?: string | null;
  etag?: string | null;
  content_url?: string | null;
  thumbnail_url?: string | null;
  thumbnail_content_type?: string | null;
  thumbnail_width?: number | null;
  thumbnail_height?: number | null;
  thumbnail_available?: boolean | null;
  thumbnail_status?: string | null;
  proxy_url?: string | null;
  metadata_url?: string | null;
  metadata?: Record<string, unknown>;
  error?: string | null;
  [key: string]: unknown;
}

export interface DashboardSummary {
  total_cases: number;
  open_cases: number;
  under_review_cases: number;
  unassigned_cases: number;
  assigned_cases: number;
  cases_assigned_to_user: number | null;
  pending_manual_reviews: number;
  pending_case_suggestions: number;
}

export interface CaseRecord {
  case_id: string;
  case_code: string;
  case_type: string;
  title: string;
  status: string;
  db_status: string;
  priority: number;
  severity: Severity;
  source_suggestion_id: string | null;
  source_event_id: string | null;
  primary_subject_id: string | null;
  primary_camera_id: string | null;
  opened_at: string;
  closed_at: string | null;
  updated_at: string;
  assigned_to: string | null;
  assigned_by: string | null;
  assigned_at: string | null;
  assignment_reason: string | null;
  organization_id: string | null;
  site_id: string | null;
  case_payload: Record<string, unknown>;
  evidence_media?: EvidenceMediaItem[];
}

export interface CaseNote {
  note_id: string;
  case_id: string;
  author: string;
  note_text: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

export interface TimelineEvent {
  source_event_id: string;
  event_type: string;
  event_ts: string;
  case_id: string | null;
  camera_id: string | null;
  subject_id: string | null;
  track_id: string | null;
  severity: Severity;
  confidence: number | null;
  summary: string;
  payload: Record<string, unknown>;
  source_component: string;
  organization_id: string | null;
  site_id: string | null;
  evidence_media?: EvidenceMediaItem[];
}

export interface ManualReview {
  review_id: string;
  source_event_id: string;
  source_event_type: string;
  review_type: string;
  status: string;
  priority: number;
  severity: Severity;
  subject_id: string | null;
  track_id: string | null;
  camera_id: string | null;
  organization_id: string | null;
  site_id: string | null;
  event_ts: string;
  reason_summary: string;
  payload: Record<string, unknown>;
  decision: string | null;
  decision_reason: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_payload: Record<string, unknown>;
  resolution_event_id: string | null;
  evidence_media?: EvidenceMediaItem[];
}

export interface CaseSuggestion {
  suggestion_id: string;
  source_event_id: string;
  source_event_type: string;
  suggestion_type: string;
  status: string;
  subject_id: string | null;
  track_id: string | null;
  camera_id: string | null;
  organization_id: string | null;
  site_id: string | null;
  event_ts: string;
  evidence_count: number;
  reason_summary: string;
  payload: Record<string, unknown>;
  decision: string | null;
  decision_reason: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_payload: Record<string, unknown>;
  resolution_event_id: string | null;
  promoted_case_id: string | null;
  promoted_at: string | null;
  evidence_media?: EvidenceMediaItem[];
}

export interface CaseDetail extends CaseRecord {
  notes: CaseNote[];
  reviews: ManualReview[];
  suggestions: CaseSuggestion[];
  timeline: TimelineEvent[];
}

export interface HealthResponse {
  status: string;
  app: string;
  env: string;
  projection_strategy: string;
}

export interface CaseListParams {
  status?: string;
  assigned_to?: string;
  priority?: string;
  severity?: string;
  case_type?: string;
  organization_id?: string;
  site_id?: string;
  q?: string;
  limit?: number;
  offset?: number;
  sort_by?: "updated_at" | "opened_at" | "priority";
  sort_order?: "asc" | "desc";
}

export interface QueueListParams {
  status?: string;
  review_type?: string;
  suggestion_type?: string;
  priority?: string;
  camera_id?: string;
  subject_id?: string;
  limit?: number;
  offset?: number;
}

export interface TimelineListParams {
  event_type?: string;
  camera_id?: string;
  subject_id?: string;
  organization_id?: string;
  site_id?: string;
  case_id?: string;
  limit?: number;
}
