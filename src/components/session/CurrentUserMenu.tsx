import { LogOut, UserCircle } from "lucide-react";

import { ContextChips } from "../context/ContextChips";
import { RoleBadge } from "./RoleBadge";
import { useAuth } from "../../hooks/useAuth";

interface CurrentUserMenuProps {
  compact?: boolean;
}

function scopeLabel(values: string[], fallback: string) {
  if (values.length === 0) {
    return fallback;
  }
  if (values.length === 1) {
    return values[0];
  }
  return `${values.length} scopes`;
}

export function CurrentUserMenu({ compact = false }: CurrentUserMenuProps) {
  const { currentUser, logout } = useAuth();

  if (!currentUser) {
    return null;
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <UserCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-zinc-950">{currentUser.name}</div>
            <div className="truncate text-xs text-zinc-500">@{currentUser.username}</div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RoleBadge role={currentUser.role} />
          <ContextChips organizationId={currentUser.organization_id} siteId={currentUser.site_id} showEmpty />
        </div>
        <div className="text-xs text-zinc-500">
          {scopeLabel(currentUser.organization_ids, "No organization scope")} · {scopeLabel(currentUser.site_ids, "No site scope")}
        </div>
        <button className="btn w-full px-2 py-1 text-xs" type="button" onClick={() => void logout()}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 text-right">
        <div className="truncate text-xs font-medium text-zinc-700">{currentUser.name}</div>
        <div className="truncate text-xs text-zinc-500">
          @{currentUser.username} · {scopeLabel(currentUser.organization_ids, "No org scope")}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <RoleBadge role={currentUser.role} />
        <ContextChips organizationId={currentUser.organization_id} siteId={currentUser.site_id} compact showEmpty />
        <button className="btn px-2 py-1 text-xs" type="button" onClick={() => void logout()}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
}
