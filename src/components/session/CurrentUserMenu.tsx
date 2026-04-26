import { RotateCcw } from "lucide-react";

import { ContextChips } from "../context/ContextChips";
import { RoleBadge } from "./RoleBadge";
import { useCurrentUser } from "../../hooks/useCurrentUser";

interface CurrentUserMenuProps {
  compact?: boolean;
}

export function CurrentUserMenu({ compact = false }: CurrentUserMenuProps) {
  const { currentUser, availableIdentities, availableRoles, setCurrentUserName, setRole, updateSessionContext, resetSessionContext } =
    useCurrentUser();

  return (
    <div className={compact ? "space-y-3" : "flex items-end gap-2"}>
      <label className={compact ? "block" : "block text-right"}>
        <span className="block text-xs font-medium text-zinc-700">Identity</span>
        <select
          className="mt-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
          value={currentUser.username}
          onChange={(event) => setCurrentUserName(event.target.value)}
        >
          {availableIdentities.map((identity) => (
            <option key={identity.username} value={identity.username}>
              {identity.name}
            </option>
          ))}
        </select>
      </label>
      <label className={compact ? "block" : "block text-right"}>
        <span className="block text-xs font-medium text-zinc-700">Role</span>
        <select
          className="mt-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
          value={currentUser.role}
          onChange={(event) => setRole(event.target.value as typeof currentUser.role)}
        >
          {availableRoles.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </label>
      <div className={compact ? "flex flex-wrap items-center gap-2" : "mb-1 flex items-center gap-2"}>
        <RoleBadge role={currentUser.role} />
        {!compact ? <ContextChips organizationId={currentUser.organization_id} siteId={currentUser.site_id} compact showEmpty /> : null}
      </div>
      {compact ? (
        <div className="grid gap-2">
          <div>
            <span className="block text-xs font-medium text-zinc-700">Current context</span>
            <div className="mt-1">
              <ContextChips organizationId={currentUser.organization_id} siteId={currentUser.site_id} showEmpty />
            </div>
          </div>
          <input
            className="field py-1 text-xs"
            value={currentUser.organization_id ?? ""}
            onChange={(event) => updateSessionContext({ organization_id: event.target.value || null })}
            placeholder="organization_id"
          />
          <input
            className="field py-1 text-xs"
            value={currentUser.site_id ?? ""}
            onChange={(event) => updateSessionContext({ site_id: event.target.value || null })}
            placeholder="site_id"
          />
          <button className="btn px-2 py-1 text-xs" type="button" onClick={resetSessionContext}>
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Reset context
          </button>
        </div>
      ) : null}
    </div>
  );
}
