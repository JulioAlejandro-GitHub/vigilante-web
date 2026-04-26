import { RoleBadge } from "./RoleBadge";
import { useCurrentUser } from "../../hooks/useCurrentUser";

interface CurrentUserMenuProps {
  compact?: boolean;
}

export function CurrentUserMenu({ compact = false }: CurrentUserMenuProps) {
  const { currentUser, availableUsers, setCurrentUserName, updateCurrentUser } = useCurrentUser();

  return (
    <div className={compact ? "space-y-2" : "flex items-end gap-2"}>
      <label className={compact ? "block" : "block text-right"}>
        <span className="block text-xs font-medium text-zinc-700">Current user</span>
        <select
          className="mt-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
          value={currentUser.username}
          onChange={(event) => setCurrentUserName(event.target.value)}
        >
          {availableUsers.map((user) => (
            <option key={user.username} value={user.username}>
              {user.name}
            </option>
          ))}
        </select>
      </label>
      <label className={compact ? "block" : "block text-right"}>
        <span className="block text-xs font-medium text-zinc-700">Role</span>
        <select
          className="mt-1 rounded border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-900"
          value={currentUser.role}
          onChange={(event) => updateCurrentUser({ role: event.target.value as typeof currentUser.role })}
        >
          <option value="analyst">analyst</option>
          <option value="supervisor">supervisor</option>
        </select>
      </label>
      <div className={compact ? "flex items-center gap-2" : "mb-1"}>
        <RoleBadge role={currentUser.role} />
      </div>
      {compact ? (
        <div className="grid gap-2">
          <input
            className="field py-1 text-xs"
            value={currentUser.organization_id ?? ""}
            onChange={(event) => updateCurrentUser({ organization_id: event.target.value || null })}
            placeholder="organization_id"
          />
          <input
            className="field py-1 text-xs"
            value={currentUser.site_id ?? ""}
            onChange={(event) => updateCurrentUser({ site_id: event.target.value || null })}
            placeholder="site_id"
          />
        </div>
      ) : null}
    </div>
  );
}
