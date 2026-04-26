import type { Permission, PermissionResourceContext, PermissionResult, SessionOperationalContext, UserRole } from "../types/session";

const rolePermissions: Record<UserRole, Set<Permission>> = {
  analyst: new Set<Permission>(["case:write", "case:assign", "case:status", "case:note", "queue:resolve", "suggestion:resolve"]),
  supervisor: new Set<Permission>([
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
    "bulk:write",
    "supervisor:view",
  ]),
};

const permissionLabels: Record<Permission, string> = {
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
  "bulk:write": "run bulk actions",
  "supervisor:view": "view supervisor controls",
};

function contextMismatch(role: UserRole, sessionContext: SessionOperationalContext, resourceContext?: PermissionResourceContext) {
  if (role === "supervisor" || !resourceContext) {
    return null;
  }

  if (
    sessionContext.organization_id &&
    resourceContext.organization_id &&
    sessionContext.organization_id !== resourceContext.organization_id
  ) {
    return `Outside organization ${sessionContext.organization_id}.`;
  }

  if (sessionContext.site_id && resourceContext.site_id && sessionContext.site_id !== resourceContext.site_id) {
    return `Outside site ${sessionContext.site_id}.`;
  }

  return null;
}

export function checkPermission(
  role: UserRole,
  permission: Permission,
  sessionContext: SessionOperationalContext,
  resourceContext?: PermissionResourceContext,
): PermissionResult {
  if (!rolePermissions[role].has(permission)) {
    return {
      allowed: false,
      reason: `${role} role cannot ${permissionLabels[permission]} in this mock session.`,
    };
  }

  const mismatch = contextMismatch(role, sessionContext, resourceContext);
  if (mismatch) {
    return { allowed: false, reason: mismatch };
  }

  return { allowed: true };
}

export function permissionHint(result: PermissionResult) {
  return result.allowed ? null : result.reason ?? "Action is not available in this mock session.";
}
