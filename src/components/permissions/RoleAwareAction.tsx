import type { ReactNode } from "react";

import { useCurrentUser } from "../../hooks/useCurrentUser";
import type { Permission, PermissionResourceContext, PermissionResult } from "../../types/session";

interface RoleAwareActionProps {
  permission: Permission;
  resourceContext?: PermissionResourceContext;
  mode?: "disable" | "hide";
  children: (state: { disabled: boolean; reason: string | null; result: PermissionResult }) => ReactNode;
  fallback?: ReactNode;
  showHint?: boolean;
}

export function RoleAwareAction({
  permission,
  resourceContext,
  mode = "disable",
  children,
  fallback = null,
  showHint = true,
}: RoleAwareActionProps) {
  const { check } = useCurrentUser();
  const result = check(permission, resourceContext);

  if (!result.allowed && mode === "hide") {
    return <>{fallback}</>;
  }

  const reason = result.allowed ? null : result.reason ?? "Action is not available in this mock session.";

  return (
    <div className="min-w-0">
      {children({ disabled: !result.allowed, reason, result })}
      {!result.allowed && showHint ? <div className="mt-1 text-xs text-amber-700">{reason}</div> : null}
    </div>
  );
}
