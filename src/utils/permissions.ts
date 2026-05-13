import type { Permission, PermissionResourceContext, PermissionResult, SessionOperationalContext, UserRole } from "../types/session";

const rolePermissions: Record<string, Set<Permission>> = {
  auditor: new Set<Permission>(["control-center:view"]),
  analyst: new Set<Permission>([
    "control-center:view",
    "case:write",
    "case:assign",
    "case:status",
    "case:note",
    "queue:resolve",
    "suggestion:resolve",
    "camera-recommendation:operate",
  ]),
  supervisor: new Set<Permission>([
    "control-center:view",
    "case:write",
    "case:assign",
    "case:reassign",
    "case:unassign",
    "case:status",
    "case:close",
    "case:note",
    "queue:resolve",
    "suggestion:resolve",
    "suggestion:promote",
    "camera-recommendation:operate",
    "bulk:write",
    "supervisor:view",
  ]),
};

const permissionLabels: Record<Permission, string> = {
  "control-center:view": "view Control Center",
  "case:write": "edit cases",
  "case:assign": "assign cases",
  "case:reassign": "reassign cases",
  "case:unassign": "unassign cases",
  "case:status": "change case status",
  "case:close": "close or reopen cases",
  "case:note": "add notes",
  "queue:resolve": "resolve queue items",
  "suggestion:resolve": "resolve suggestions",
  "suggestion:promote": "promote suggestions",
  "camera-recommendation:operate": "operate camera recommendations",
  "bulk:write": "run bulk actions",
  "supervisor:view": "view supervisor controls",
};

const supervisorRoles = new Set(["supervisor", "admin"]);
const analystRoles = new Set(["analyst", "operator", "reviewer", ...supervisorRoles]);
const auditorRoles = new Set(["auditor"]);

function normalizeRoles(role: UserRole, roles: UserRole[] = []) {
  return [role, ...roles].map((item) => item.toLowerCase());
}

function permissionProfile(role: UserRole, roles: UserRole[] = []) {
  const normalized = normalizeRoles(role, roles);
  if (normalized.some((item) => supervisorRoles.has(item))) {
    return "supervisor";
  }
  if (normalized.some((item) => analystRoles.has(item))) {
    return "analyst";
  }
  if (normalized.some((item) => auditorRoles.has(item))) {
    return "auditor";
  }
  return normalized[0] ?? "none";
}

function contextMismatch(sessionContext: SessionOperationalContext, resourceContext?: PermissionResourceContext) {
  if (!resourceContext) {
    return null;
  }

  const organizationIds = sessionContext.organization_ids ?? (sessionContext.organization_id ? [sessionContext.organization_id] : []);
  const siteIds = sessionContext.site_ids ?? (sessionContext.site_id ? [sessionContext.site_id] : []);

  if (
    organizationIds.length > 0 &&
    resourceContext.organization_id &&
    !organizationIds.includes(resourceContext.organization_id)
  ) {
    return "Outside authenticated organization scope.";
  }

  if (siteIds.length > 0 && resourceContext.site_id && !siteIds.includes(resourceContext.site_id)) {
    return "Outside authenticated site scope.";
  }

  return null;
}

export function checkPermission(
  role: UserRole,
  permission: Permission,
  sessionContext: SessionOperationalContext,
  resourceContext?: PermissionResourceContext,
  roles: UserRole[] = [],
): PermissionResult {
  const profile = permissionProfile(role, roles);
  const allowedPermissions = rolePermissions[profile] ?? new Set<Permission>();

  if (!allowedPermissions.has(permission)) {
    return {
      allowed: false,
      reason: `${role} role cannot ${permissionLabels[permission]} in this authenticated session.`,
    };
  }

  const mismatch = contextMismatch(sessionContext, resourceContext);
  if (mismatch) {
    return { allowed: false, reason: mismatch };
  }

  return { allowed: true };
}

export function permissionHint(result: PermissionResult) {
  return result.allowed ? null : result.reason ?? "Action is not available in this authenticated session.";
}
