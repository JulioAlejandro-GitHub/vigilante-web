import { ArrowRight, LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface WorkQueueCardProps {
  label: string;
  value: number | null;
  to: string;
  icon: LucideIcon;
  description?: string;
  tone?: "default" | "attention" | "success";
}

const tones = {
  default: "hover:border-zinc-300 hover:bg-zinc-50",
  attention: "hover:border-amber-200 hover:bg-amber-50/50",
  success: "hover:border-teal-200 hover:bg-teal-50/50",
};

export function WorkQueueCard({ label, value, to, icon: Icon, description, tone = "default" }: WorkQueueCardProps) {
  return (
    <Link className={`panel group block p-4 ${tones[tone]}`} to={to}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-zinc-500">{label}</div>
          <div className="mt-3 text-3xl font-semibold text-zinc-950">{value ?? "—"}</div>
          {description ? <div className="mt-2 text-sm text-zinc-600">{description}</div> : null}
        </div>
        <div className="rounded bg-zinc-100 p-2 text-zinc-600 group-hover:bg-white">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-teal-800">
        Open
        <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}
