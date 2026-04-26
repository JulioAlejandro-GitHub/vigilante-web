import type { CaseListParams, TimelineListParams } from "../types/api";
import type { CurrentUser } from "../types/session";

export function assignedToMeCaseParams(username: string, overrides: CaseListParams = {}): CaseListParams {
  return {
    assigned_to: username,
    limit: 50,
    offset: 0,
    sort_by: "updated_at",
    sort_order: "desc",
    ...overrides,
  };
}

export function currentContextCaseParams(currentUser: CurrentUser): Pick<CaseListParams, "organization_id" | "site_id"> {
  return {
    organization_id: currentUser.organization_id ?? "",
    site_id: currentUser.site_id ?? "",
  };
}

export function currentContextTimelineParams(currentUser: CurrentUser): Pick<TimelineListParams, "organization_id" | "site_id"> {
  return {
    organization_id: currentUser.organization_id ?? "",
    site_id: currentUser.site_id ?? "",
  };
}
