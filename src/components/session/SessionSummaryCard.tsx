import { RotateCcw, ShieldCheck, UserCircle } from "lucide-react";

import { ContextChips } from "../context/ContextChips";
import { RoleBadge } from "./RoleBadge";
import { useCurrentUser } from "../../hooks/useCurrentUser";

export function SessionSummaryCard() {
  const { currentUser, session, resetSessionContext } = useCurrentUser();

  return (
    <section className="panel p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950">
            <UserCircle className="h-4 w-4 text-zinc-500" aria-hidden="true" />
            <span className="truncate">{currentUser.name}</span>
          </div>
          <div className="mt-1 text-xs text-zinc-500">@{currentUser.username}</div>
          <div className="mt-3">
            <ContextChips organizationId={currentUser.organization_id} siteId={currentUser.site_id} showEmpty />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RoleBadge role={currentUser.role} />
          <button className="btn px-2 py-1 text-xs" type="button" onClick={resetSessionContext}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset context
          </button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 border-t border-zinc-200 pt-4 text-sm sm:grid-cols-3">
        <div>
          <div className="label">Identity</div>
          <div className="mt-1 break-words text-zinc-900">{session.identity.username}</div>
        </div>
        <div>
          <div className="label">Role</div>
          <div className="mt-1 inline-flex items-center gap-1 text-zinc-900">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" aria-hidden="true" />
            {session.role}
          </div>
        </div>
        <div>
          <div className="label">Scope</div>
          <div className="mt-1 text-zinc-900">
            {session.context.organization_id || session.context.site_id ? "Scoped mock session" : "No org/site scope"}
          </div>
        </div>
      </div>
    </section>
  );
}
