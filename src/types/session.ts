export type UserRole = string;

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
  organization_ids?: string[];
  site_ids?: string[];
}

export interface SessionScope {
  organization_id: string;
  site_ids: string[];
  all_sites: boolean;
  scope_role: string;
  can_view: boolean;
  can_operate: boolean;
  can_admin: boolean;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: string | null;
  user: CurrentUser;
  role: UserRole;
  roles: UserRole[];
  context: SessionOperationalContext;
}

export type MockSession = AuthSession;

export interface CurrentUser {
  user_id: string;
  username: string;
  email: string;
  name: string;
  display_name: string;
  role: UserRole;
  roles: UserRole[];
  is_active: boolean;
  organization_id: string | null;
  site_id: string | null;
  organization_ids: string[];
  site_ids: string[];
  scopes: SessionScope[];
}

export interface PermissionResourceContext {
  organization_id?: string | null;
  site_id?: string | null;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}
