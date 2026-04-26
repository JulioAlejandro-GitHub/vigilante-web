import { Link } from "react-router-dom";

import { ContextChips } from "../context/ContextChips";
import { StatusBadge, statusTone } from "../StatusBadge";
import type { CaseSuggestion } from "../../types/api";
import { formatDateTime, shortId } from "../../utils/format";

interface SuggestionLinkCardProps {
  suggestion: CaseSuggestion;
  to: string;
}

export function SuggestionLinkCard({ suggestion, to }: SuggestionLinkCardProps) {
  return (
    <Link className="block rounded border border-zinc-200 bg-white p-3 text-sm hover:border-teal-200 hover:bg-teal-50/30" to={to}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-zinc-950">{suggestion.suggestion_type}</div>
          <div className="mt-1 text-xs text-zinc-500">{shortId(suggestion.suggestion_id)}</div>
        </div>
        <StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-zinc-600">
        <span>Evidence {suggestion.evidence_count}</span>
        <span>Subject {shortId(suggestion.subject_id)}</span>
        <span>Camera {shortId(suggestion.camera_id)}</span>
        <span>{formatDateTime(suggestion.event_ts)}</span>
      </div>
      <div className="mt-3">
        <ContextChips organizationId={suggestion.organization_id} siteId={suggestion.site_id} compact />
      </div>
    </Link>
  );
}
