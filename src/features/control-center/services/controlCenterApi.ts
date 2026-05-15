import { api } from "../../../api/vigilanteApi";
import { buildQueryString, getJson } from "../../../api/client";
import type { CaseDetail, DashboardSummary, EvidenceMediaPage, HealthResponse, TimelineEvent, TimelineListParams } from "../../../types/api";
import type { ControlCenterCamera } from "../types/controlCenter.types";

export interface ControlCenterEventParams extends TimelineListParams {
  limit?: number;
  offset?: number;
}

export interface ControlCenterEvidenceParams {
  limit?: number;
  offset?: number;
  include_evidence?: boolean;
  source_event_id?: string | null;
}

export const controlCenterApi = {
  health: () => api.health(),
  dashboardSummary: (assignedTo?: string): Promise<DashboardSummary> => api.dashboardSummary(assignedTo),
  listCameras: (limit = 6, offset = 0): Promise<ControlCenterCamera[]> =>
    getJson<ControlCenterCamera[]>(`/api/v1/cameras${buildQueryString({ limit, offset })}`),
  listRecentEvents: (params: ControlCenterEventParams = {}): Promise<TimelineEvent[]> =>
    api.listTimeline({ limit: 20, offset: 0, include_evidence: false, ...params }),
  getCaseSummary: (caseId: string): Promise<CaseDetail> => api.getCase(caseId, { expand: "summary", include_evidence: false, recent_limit: 1 }),
  getCaseTimeline: (caseId: string, params: ControlCenterEvidenceParams = {}): Promise<TimelineEvent[]> =>
    api.getCaseTimeline(caseId, { limit: 6, offset: 0, include_evidence: false, ...params }),
  listCaseEvidence: (caseId: string, params: ControlCenterEvidenceParams = {}): Promise<EvidenceMediaPage> =>
    getJson<EvidenceMediaPage>(`/api/v1/cases/${caseId}/evidence${buildQueryString({ limit: 6, offset: 0, ...params })}`),
  listTimelineEvidence: (sourceEventId: string, params: ControlCenterEvidenceParams = {}): Promise<EvidenceMediaPage> =>
    getJson<EvidenceMediaPage>(`/api/v1/timeline/${sourceEventId}/evidence${buildQueryString({ limit: 6, offset: 0, ...params })}`),
  changeCaseStatus: api.changeCaseStatus,
  closeCase: api.closeCase,
  reopenCase: api.reopenCase,
};

export type { HealthResponse };
