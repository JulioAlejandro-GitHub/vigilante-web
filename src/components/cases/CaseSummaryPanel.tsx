import { Link } from "react-router-dom";

import { ContextChips } from "../context/ContextChips";
import { KeyValue } from "../KeyValue";
import { StatusBadge, statusTone } from "../StatusBadge";
import type { CaseDetail } from "../../types/api";
import { formatDateTime, shortId } from "../../utils/format";

interface CaseSummaryPanelProps {
  detail: CaseDetail;
}

export function CaseSummaryPanel({ detail }: CaseSummaryPanelProps) {
  return (
    <section className="panel p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Case overview</h2>
          <p className="mt-1 text-sm text-zinc-600">Operational identifiers, origin and current lifecycle state.</p>
          <div className="mt-3">
            <ContextChips organizationId={detail.organization_id} siteId={detail.site_id} showEmpty />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={detail.status} tone={statusTone(detail.status)} />
          <StatusBadge value={detail.severity} tone={statusTone(detail.severity)} />
          <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">Priority {detail.priority}</span>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KeyValue label="Case ID" value={detail.case_id} />
        <KeyValue label="Code" value={detail.case_code} />
        <KeyValue label="Type" value={detail.case_type} />
        <KeyValue label="Opened" value={formatDateTime(detail.opened_at)} />
        <KeyValue label="Updated" value={formatDateTime(detail.updated_at)} />
        <KeyValue label="Closed" value={formatDateTime(detail.closed_at)} />
        <KeyValue label="Primary subject" value={shortId(detail.primary_subject_id)} />
        <KeyValue label="Primary camera" value={shortId(detail.primary_camera_id)} />
        <KeyValue label="Organization" value={shortId(detail.organization_id)} />
        <KeyValue label="Site" value={shortId(detail.site_id)} />
        <KeyValue
          label="Source event"
          value={
            detail.source_event_id ? (
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/timeline/${detail.source_event_id}`}>
                {shortId(detail.source_event_id)}
              </Link>
            ) : (
              "—"
            )
          }
        />
        <KeyValue
          label="Source suggestion"
          value={
            detail.source_suggestion_id ? (
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/case-suggestions/${detail.source_suggestion_id}`}>
                {shortId(detail.source_suggestion_id)}
              </Link>
            ) : (
              "—"
            )
          }
        />
      </div>
    </section>
  );
}
