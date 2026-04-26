import { UserCheck, UserMinus, Users } from "lucide-react";

import { useCurrentUser } from "../../context/CurrentUserContext";
import { formatDateTime } from "../../utils/format";
import { ownershipState } from "../../utils/ownership";

interface OwnerBadgeProps {
  assignedTo: string | null | undefined;
  assignedAt?: string | null;
  compact?: boolean;
}

export function OwnerBadge({ assignedTo, assignedAt, compact = false }: OwnerBadgeProps) {
  const { currentUser } = useCurrentUser();
  const state = ownershipState(assignedTo, currentUser.username);
  const Icon = state === "mine" ? UserCheck : state === "other" ? Users : UserMinus;
  const label = state === "mine" ? "Assigned to me" : state === "other" ? `Assigned to ${assignedTo}` : "Unassigned";
  const classes =
    state === "mine"
      ? "border-teal-200 bg-teal-50 text-teal-900"
      : state === "other"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded border px-2 py-1 text-xs font-medium ${classes}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
      {!compact && assignedAt ? <span className="hidden text-[11px] opacity-75 sm:inline">since {formatDateTime(assignedAt)}</span> : null}
    </span>
  );
}
