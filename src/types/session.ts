export type UserRole = "analyst" | "supervisor";

export type Permission =
  | "case:write"
  | "case:assign"
  | "case:reassign"
  | "case:unassign"
  | "case:status"
  | "case:close"
  | "case:note"
  | "queue:resolve"
  | "suggestion:resolve"
  | "suggestion:promote"
  | "bulk:write"
  | "supervisor:view";

export interface SessionIdentity {
  username: string;
  name: string;
  default_role: UserRole;
  default_organization_id: string | null;
  default_site_id: string | null;
}

export interface SessionOperationalContext {
  organization_id: string | null;
  site_id: string | null;
}

export interface MockSession {
  identity: SessionIdentity;
  role: UserRole;
  context: SessionOperationalContext;
}

export interface CurrentUser {
  username: string;
  name: string;
  role: UserRole;
  organization_id: string | null;
  site_id: string | null;
}

export interface PermissionResourceContext {
  organization_id?: string | null;
  site_id?: string | null;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}
