import { KeyValue } from "../KeyValue";
import { OwnerBadge } from "../ownership/OwnerBadge";
import { StatusBadge, statusTone } from "../StatusBadge";
import type { CaseDetail } from "../../types/api";
import { formatDateTime, shortId } from "../../utils/format";

interface CaseHeaderProps {
  detail: CaseDetail;
}

export function CaseHeader({ detail }: CaseHeaderProps) {
  return (
    <section className="panel p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge value={detail.status} tone={statusTone(detail.status)} />
            <StatusBadge value={detail.severity} tone={statusTone(detail.severity)} />
            <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">Priority {detail.priority}</span>
            <OwnerBadge assignedTo={detail.assigned_to} assignedAt={detail.assigned_at} />
          </div>
          <h2 className="mt-3 text-lg font-semibold text-zinc-950">{detail.title}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
            <span>{detail.case_code}</span>
            <span>{detail.case_type}</span>
          </div>
        </div>
        <div className="grid gap-3 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm sm:grid-cols-3 lg:min-w-[460px]">
          <KeyValue label="Owner" value={detail.assigned_to ?? "Unassigned"} />
          <KeyValue label="Assigned at" value={formatDateTime(detail.assigned_at)} />
          <KeyValue label="Updated" value={formatDateTime(detail.updated_at)} />
        </div>
      </div>
      <div className="mt-5 grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <KeyValue label="Type" value={detail.case_type} />
        <KeyValue label="Opened" value={formatDateTime(detail.opened_at)} />
        <KeyValue label="Closed" value={formatDateTime(detail.closed_at)} />
        <KeyValue label="Source event" value={shortId(detail.source_event_id)} />
        <KeyValue label="Source suggestion" value={shortId(detail.source_suggestion_id)} />
        <KeyValue label="Primary subject" value={shortId(detail.primary_subject_id)} />
        <KeyValue label="Primary camera" value={shortId(detail.primary_camera_id)} />
        <KeyValue label="Organization" value={shortId(detail.organization_id)} />
        <KeyValue label="Site" value={shortId(detail.site_id)} />
      </div>
    </section>
  );
}
