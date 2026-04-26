import { Building2, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { shortId } from "../../utils/format";

interface ContextChipsProps {
  organizationId?: string | null;
  siteId?: string | null;
  compact?: boolean;
  showEmpty?: boolean;
}

function Chip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700">
      <span className="shrink-0 text-zinc-500">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

export function ContextChips({ organizationId, siteId, compact = false, showEmpty = false }: ContextChipsProps) {
  const hasOrganization = Boolean(organizationId);
  const hasSite = Boolean(siteId);

  if (!hasOrganization && !hasSite && !showEmpty) {
    return null;
  }

  return (
    <div className={`flex min-w-0 flex-wrap gap-1.5 ${compact ? "text-xs" : ""}`}>
      {hasOrganization || showEmpty ? (
        <Chip icon={<Building2 className="h-3.5 w-3.5" aria-hidden="true" />} label={`Org ${hasOrganization ? shortId(organizationId) : "any"}`} />
      ) : null}
      {hasSite || showEmpty ? (
        <Chip icon={<MapPin className="h-3.5 w-3.5" aria-hidden="true" />} label={`Site ${hasSite ? shortId(siteId) : "any"}`} />
      ) : null}
    </div>
  );
}
