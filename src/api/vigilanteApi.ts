import { buildQueryString, getJson, postJson } from "./client";
import type {
  CaseDetail,
  CaseListParams,
  CaseNote,
  CaseRecord,
  CameraRecommendation,
  CameraRecommendationApplyResult,
  CameraRecommendationListParams,
  CameraRecommendationPreviewResponse,
  CaseSuggestion,
  DashboardSummary,
  HealthResponse,
  ManualReview,
  QueueListParams,
  TimelineListParams,
  TimelineEvent,
} from "../types/api";

export interface AssignCasePayload {
  assigned_to: string;
  assigned_by: string;
  assignment_reason?: string;
}

export interface UnassignCasePayload {
  assigned_by: string;
  assignment_reason?: string;
}

export interface ChangeStatusPayload {
  status: string;
  reason: string;
  changed_by: string;
}

export interface CaseReasonPayload {
  reason: string;
  changed_by: string;
}

export interface AddNotePayload {
  author: string;
  note_text: string;
}

export interface ResolveManualReviewPayload {
  decision: "approved" | "rejected" | "needs_more_evidence";
  decision_reason: string;
  resolved_by: string;
  identity_resolution?: "confirm_identity" | "discard_candidate" | "mark_unresolved" | "escalate";
  confirmed_person_profile_id?: string;
  discarded_person_profile_id?: string;
}

export interface ResolveCaseSuggestionPayload {
  decision: "accepted" | "rejected" | "deferred";
  decision_reason: string;
  resolved_by: string;
}

export interface PromoteCaseSuggestionPayload {
  resolved_by: string;
  case_type: string;
  title: string;
  priority: number | string;
  severity: string;
  description?: string;
  case_payload?: Record<string, unknown>;
}

export interface CameraRecommendationActionPayload {
  comment?: string;
}

export interface CaseDetailParams {
  recent_limit?: number;
  expand?: "all" | "summary";
  include_evidence?: boolean;
}

export interface CaseRelatedListParams {
  limit?: number;
  offset?: number;
  include_evidence?: boolean;
}

export const api = {
  health: () => getJson<HealthResponse>("/health"),
  dashboardSummary: (assignedTo?: string) =>
    getJson<DashboardSummary>(`/api/v1/dashboard/summary${buildQueryString({ assigned_to: assignedTo })}`),

  listCases: (params: CaseListParams) => getJson<CaseRecord[]>(`/api/v1/cases${buildQueryString(params)}`),
  getCase: (caseId: string, params: CaseDetailParams = {}) => getJson<CaseDetail>(`/api/v1/cases/${caseId}${buildQueryString(params)}`),
  getCaseTimeline: (caseId: string, params: CaseRelatedListParams = {}) =>
    getJson<TimelineEvent[]>(`/api/v1/cases/${caseId}/timeline${buildQueryString(params)}`),
  getCaseNotes: (caseId: string, params: Omit<CaseRelatedListParams, "include_evidence"> = {}) =>
    getJson<CaseNote[]>(`/api/v1/cases/${caseId}/notes${buildQueryString(params)}`),
  getCaseReviews: (caseId: string, params: CaseRelatedListParams = {}) =>
    getJson<ManualReview[]>(`/api/v1/cases/${caseId}/reviews${buildQueryString(params)}`),
  getCaseSuggestions: (caseId: string, params: CaseRelatedListParams = {}) =>
    getJson<CaseSuggestion[]>(`/api/v1/cases/${caseId}/suggestions${buildQueryString(params)}`),
  assignCase: (caseId: string, payload: AssignCasePayload) =>
    postJson<CaseRecord>(`/api/v1/cases/${caseId}/assign`, payload),
  unassignCase: (caseId: string, payload: UnassignCasePayload) =>
    postJson<CaseRecord>(`/api/v1/cases/${caseId}/unassign`, payload),
  changeCaseStatus: (caseId: string, payload: ChangeStatusPayload) =>
    postJson<CaseRecord>(`/api/v1/cases/${caseId}/status`, payload),
  closeCase: (caseId: string, payload: CaseReasonPayload) => postJson<CaseRecord>(`/api/v1/cases/${caseId}/close`, payload),
  reopenCase: (caseId: string, payload: CaseReasonPayload) =>
    postJson<CaseRecord>(`/api/v1/cases/${caseId}/reopen`, payload),
  addCaseNote: (caseId: string, payload: AddNotePayload) => postJson<CaseNote>(`/api/v1/cases/${caseId}/notes`, payload),

  listManualReviews: (params: QueueListParams) =>
    getJson<ManualReview[]>(`/api/v1/manual-reviews${buildQueryString(params)}`),
  getManualReview: (reviewId: string) => getJson<ManualReview>(`/api/v1/manual-reviews/${reviewId}`),
  resolveManualReview: (reviewId: string, payload: ResolveManualReviewPayload) =>
    postJson<ManualReview>(`/api/v1/manual-reviews/${reviewId}/resolve`, payload),

  listCaseSuggestions: (params: QueueListParams) =>
    getJson<CaseSuggestion[]>(`/api/v1/case-suggestions${buildQueryString(params)}`),
  getCaseSuggestion: (suggestionId: string) => getJson<CaseSuggestion>(`/api/v1/case-suggestions/${suggestionId}`),
  resolveCaseSuggestion: (suggestionId: string, payload: ResolveCaseSuggestionPayload) =>
    postJson<CaseSuggestion>(`/api/v1/case-suggestions/${suggestionId}/resolve`, payload),
  promoteCaseSuggestion: (suggestionId: string, payload: PromoteCaseSuggestionPayload) =>
    postJson<CaseRecord>(`/api/v1/case-suggestions/${suggestionId}/promote`, payload),

  listCameraRecommendations: (params: CameraRecommendationListParams) =>
    getJson<CameraRecommendation[]>(`/api/v1/camera-recommendations${buildQueryString(params)}`),
  getCameraRecommendation: (recommendationId: string) =>
    getJson<CameraRecommendation>(`/api/v1/camera-recommendations/${recommendationId}`),
  previewCameraRecommendation: (recommendationId: string) =>
    getJson<CameraRecommendationPreviewResponse>(`/api/v1/camera-recommendations/${recommendationId}/preview`),
  approveCameraRecommendation: (recommendationId: string, payload: CameraRecommendationActionPayload) =>
    postJson<CameraRecommendation>(`/api/v1/camera-recommendations/${recommendationId}/approve`, payload),
  rejectCameraRecommendation: (recommendationId: string, payload: CameraRecommendationActionPayload) =>
    postJson<CameraRecommendation>(`/api/v1/camera-recommendations/${recommendationId}/reject`, payload),
  applyCameraRecommendation: (recommendationId: string, payload: CameraRecommendationActionPayload) =>
    postJson<CameraRecommendationApplyResult>(`/api/v1/camera-recommendations/${recommendationId}/apply`, payload),
  rollbackCameraRecommendation: (recommendationId: string, payload: CameraRecommendationActionPayload) =>
    postJson<CameraRecommendationApplyResult>(`/api/v1/camera-recommendations/${recommendationId}/rollback`, payload),

  listTimeline: (params: TimelineListParams) =>
    getJson<TimelineEvent[]>(`/api/v1/timeline${buildQueryString(params)}`),
  getTimelineEvent: (sourceEventId: string) => getJson<TimelineEvent>(`/api/v1/timeline/${sourceEventId}`),
};
