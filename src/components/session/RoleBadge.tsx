import type { UserRole } from "../../context/CurrentUserContext";

interface RoleBadgeProps {
  role: UserRole;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const classes =
    role === "supervisor"
      ? "border-indigo-200 bg-indigo-50 text-indigo-800"
      : "border-teal-200 bg-teal-50 text-teal-800";

  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${classes}`}>{role}</span>;
}
