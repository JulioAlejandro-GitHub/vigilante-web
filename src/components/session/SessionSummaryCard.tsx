import { ShieldCheck, UserCircle } from "lucide-react";

import { ContextChips } from "../context/ContextChips";
import { RoleBadge } from "./RoleBadge";
import { useCurrentUser } from "../../hooks/useCurrentUser";

function listValue(values: string[]) {
  if (values.length === 0) {
    return "No scope returned";
  }
  return values.join(", ");
}

export function SessionSummaryCard() {
  const { currentUser } = useCurrentUser();

  return (
    <section className="panel p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <UserCircle className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <span className="truncate">{currentUser.name}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">
            @{currentUser.username} · {currentUser.email}
          </div>
          <div className="mt-3">
            <ContextChips organizationId={currentUser.organization_id} siteId={currentUser.site_id} showEmpty />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RoleBadge role={currentUser.role} />
        </div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-3">
        <div>
          <div className="label">Authenticated user</div>
          <div className="mt-1 break-words text-zinc-900">{currentUser.user_id}</div>
        </div>
        <div>
          <div className="label">Roles</div>
          <div className="mt-1 inline-flex items-center gap-1 text-zinc-900">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
            {currentUser.roles.length ? currentUser.roles.join(", ") : currentUser.role}
          </div>
        </div>
        <div>
          <div className="label">Scope</div>
          <div className="mt-1 text-zinc-900">
            {currentUser.organization_ids.length} org · {currentUser.site_ids.length} site
          </div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-600 sm:grid-cols-2">
        <div>
          <div className="label">Organizations</div>
          <div className="mt-1 break-words">{listValue(currentUser.organization_ids)}</div>
        </div>
        <div>
          <div className="label">Sites</div>
          <div className="mt-1 break-words">{listValue(currentUser.site_ids)}</div>
        </div>
      </div>
    </section>
  );
}
