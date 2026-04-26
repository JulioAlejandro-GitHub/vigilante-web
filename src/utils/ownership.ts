import type { CaseRecord } from "../types/api";
import type { CurrentUser, PermissionResourceContext } from "../types/session";

export type OwnershipFilter = "all" | "mine" | "others" | "unassigned";
export type OwnershipState = "mine" | "other" | "unassigned";

export function ownershipState(assignedTo: string | null | undefined, currentUsername: string): OwnershipState {
  if (!assignedTo) {
    return "unassigned";
  }
  return assignedTo === currentUsername ? "mine" : "other";
}

export function matchesOwnershipFilter(item: CaseRecord, filter: OwnershipFilter, currentUsername: string) {
  const state = ownershipState(item.assigned_to, currentUsername);
  if (filter === "all") return true;
  if (filter === "mine") return state === "mine";
  if (filter === "others") return state === "other";
  return state === "unassigned";
}

export function matchesSessionContext(item: PermissionResourceContext, currentUser: CurrentUser) {
  if (currentUser.organization_id && item.organization_id && item.organization_id !== currentUser.organization_id) {
    return false;
  }
  if (currentUser.site_id && item.site_id && item.site_id !== currentUser.site_id) {
    return false;
  }
  return true;
}
