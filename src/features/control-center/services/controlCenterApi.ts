import { api } from "../../../api/vigilanteApi";
import { buildQueryString, getJson } from "../../../api/client";
import type { CaseDetail, DashboardSummary, HealthResponse, TimelineEvent, TimelineListParams } from "../../../types/api";
import type { ControlCenterCamera } from "../types/controlCenter.types";

export interface ControlCenterEventParams extends TimelineListParams {
  limit?: number;
}

export const controlCenterApi = {
  health: () => api.health(),
  dashboardSummary: (assignedTo?: string): Promise<DashboardSummary> => api.dashboardSummary(assignedTo),
  listCameras: (limit = 100): Promise<ControlCenterCamera[]> => getJson<ControlCenterCamera[]>(`/api/v1/cameras${buildQueryString({ limit })}`),
  listRecentEvents: (params: ControlCenterEventParams = {}): Promise<TimelineEvent[]> =>
    api.listTimeline({ limit: 80, ...params }),
  getCase: (caseId: string): Promise<CaseDetail> => api.getCase(caseId),
  changeCaseStatus: api.changeCaseStatus,
  closeCase: api.closeCase,
  reopenCase: api.reopenCase,
};

export type { HealthResponse };
