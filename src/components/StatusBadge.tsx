interface StatusBadgeProps {
  value: string | number | null | undefined;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

const tones = {
  default: "border-zinc-200 bg-zinc-100 text-zinc-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
};

export function StatusBadge({ value, tone = "default" }: StatusBadgeProps) {
  return (
    <span className={`inline-flex max-w-full items-center rounded border px-2 py-1 text-xs font-medium ${tones[tone]}`}>
      <span className="truncate">{value ?? "—"}</span>
    </span>
  );
}

export function statusTone(value: string | null | undefined): StatusBadgeProps["tone"] {
  if (!value) {
    return "default";
  }
  if (["approved", "accepted", "resolved", "open", "reopened"].includes(value)) {
    return "success";
  }
  if (["pending", "in_review", "under_review", "deferred"].includes(value)) {
    return "warning";
  }
  if (["rejected", "closed", "dismissed"].includes(value)) {
    return "danger";
  }
  return "info";
}
