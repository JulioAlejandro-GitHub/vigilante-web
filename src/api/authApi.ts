import { getJson, postJson } from "./client";
import type { CurrentUser, SessionScope, UserRole } from "../types/session";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthScopeSummary {
  organization_ids: string[];
  site_ids: string[];
}

export interface BackendCurrentUser {
  user_id: string;
  username: string;
  email: string;
  display_name: string;
  role: string;
  roles: string[];
  is_active: boolean;
  organization_ids: string[];
  site_ids: string[];
  scopes: SessionScope[];
}

export interface LoginResponse {
  access_token: string;
  token_type: "bearer" | string;
  expires_at: string;
  user: BackendCurrentUser;
  roles: UserRole[];
  scope: AuthScopeSummary;
}

export interface LogoutResponse {
  status: string;
  message: string;
}

export function normalizeCurrentUser(user: BackendCurrentUser): CurrentUser {
  const organizationIds = Array.isArray(user.organization_ids) ? user.organization_ids : [];
  const siteIds = Array.isArray(user.site_ids) ? user.site_ids : [];
  const roles = Array.isArray(user.roles) ? user.roles.map((role) => role.toLowerCase()) : [];
  const role = (user.role || roles[0] || "none").toLowerCase();

  return {
    user_id: user.user_id,
    username: user.username,
    email: user.email,
    name: user.display_name || user.username,
    display_name: user.display_name || user.username,
    role,
    roles,
    is_active: user.is_active,
    organization_id: organizationIds[0] ?? null,
    site_id: siteIds[0] ?? null,
    organization_ids: organizationIds,
    site_ids: siteIds,
    scopes: Array.isArray(user.scopes) ? user.scopes : [],
  };
}

export const authApi = {
  login: (payload: LoginRequest) => postJson<LoginResponse>("/api/v1/auth/login", payload, { skipAuth: true }),
  logout: () => postJson<LogoutResponse>("/api/v1/auth/logout"),
  me: () => getJson<BackendCurrentUser>("/api/v1/auth/me"),
};
