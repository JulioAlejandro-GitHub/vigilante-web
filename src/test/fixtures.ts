import type { CaseSuggestion, ManualReview, TimelineEvent } from "../types/api";

export function manualReviewFixture(patch: Partial<ManualReview> = {}): ManualReview {
  return {
    review_id: "review-1",
    source_event_id: "event-1",
    source_event_type: "recognition.manual_review_required",
    review_type: "identity_conflict",
    status: "pending",
    priority: 2,
    severity: "high",
    subject_id: "subject-1",
    track_id: "track-1",
    camera_id: "camera-1",
    organization_id: "org-1",
    site_id: "site-1",
    event_ts: "2026-01-01T10:00:00Z",
    reason_summary: "Identity conflict requires analyst review",
    payload: {
      case_id: "case-1",
      confidence: 0.91,
      face_detection: { status: "detected", confidence: 0.91 },
      semantic_descriptor: { summary: "person near restricted door" },
    },
    decision: null,
    decision_reason: null,
    resolved_by: null,
    resolved_at: null,
    resolution_payload: {},
    resolution_event_id: null,
    ...patch,
  };
}

export function caseSuggestionFixture(patch: Partial<CaseSuggestion> = {}): CaseSuggestion {
  return {
    suggestion_id: "suggestion-1",
    source_event_id: "event-1",
    source_event_type: "recognition.case_suggestion_created",
    suggestion_type: "unresolved_subject_case",
    status: "pending",
    subject_id: "subject-1",
    track_id: "track-1",
    camera_id: "camera-1",
    organization_id: "org-1",
    site_id: "site-1",
    event_ts: "2026-01-01T10:00:00Z",
    evidence_count: 3,
    reason_summary: "Repeated unresolved subject",
    payload: {
      suggested_title: "Repeated unresolved subject",
      suggested_reason: "Repeated unresolved subject",
      evidence_count: 3,
      recurrent_subject_assessment: { summary: "three sightings" },
    },
    decision: null,
    decision_reason: null,
    resolved_by: null,
    resolved_at: null,
    resolution_payload: {},
    resolution_event_id: null,
    promoted_case_id: "case-1",
    promoted_at: null,
    ...patch,
  };
}

export function timelineEventFixture(patch: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    source_event_id: "event-1",
    event_type: "case_suggestion_created",
    event_ts: "2026-01-01T10:00:00Z",
    case_id: "case-1",
    camera_id: "camera-1",
    subject_id: "subject-1",
    track_id: "track-1",
    severity: "high",
    confidence: 0.91,
    summary: "Case suggestion created from recognition evidence",
    payload: {
      suggestion_id: "suggestion-1",
      review_id: "review-1",
      confidence: 0.91,
      source_event: { source_event_id: "event-1", event_type: "recognition" },
    },
    source_component: "vigilante-api",
    organization_id: "org-1",
    site_id: "site-1",
    ...patch,
  };
}
