import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import type { CaseListParams } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";

const limit = 25;

export function CasesPage() {
  const [filters, setFilters] = useState<CaseListParams>({
    limit,
    offset: 0,
    sort_by: "updated_at",
    sort_order: "desc",
  });
  const [draft, setDraft] = useState({
    status: "",
    assigned_to: "",
    priority: "",
    severity: "",
    case_type: "",
    q: "",
  });

  const { data, loading, error, refresh } = useAsyncData(() => api.listCases(filters), [JSON.stringify(filters)]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      ...draft,
      offset: 0,
    }));
  }

  function setPage(nextOffset: number) {
    setFilters((current) => ({ ...current, offset: Math.max(0, nextOffset) }));
  }

  const offset = filters.offset ?? 0;
  const cases = data ?? [];

  return (
    <div>
      <PageHeader
        title="Cases"
        description="Canonical case list with assignment, lifecycle and basic filtering."
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <form className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6" onSubmit={applyFilters}>
        <input className="field" placeholder="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
        <input
          className="field"
          placeholder="Assigned to"
          value={draft.assigned_to}
          onChange={(e) => setDraft({ ...draft, assigned_to: e.target.value })}
        />
        <input className="field" placeholder="Priority" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} />
        <input className="field" placeholder="Severity" value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })} />
        <input className="field" placeholder="Case type" value={draft.case_type} onChange={(e) => setDraft({ ...draft, case_type: e.target.value })} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <input className="field" placeholder="Search" value={draft.q} onChange={(e) => setDraft({ ...draft, q: e.target.value })} />
          <button className="btn btn-primary shrink-0" type="submit">
            Apply
          </button>
        </div>
      </form>

      <DataState loading={loading} error={error}>
        {cases.length === 0 ? (
          <EmptyState label="No cases match the current filters." />
        ) : (
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-sm">
                <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">Case</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Opened</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {cases.map((item) => (
                    <tr key={item.case_id} className="align-top hover:bg-zinc-50">
                      <td className="px-4 py-3">
                        <Link className="font-medium text-zinc-950 underline-offset-2 hover:underline" to={`/cases/${item.case_id}`}>
                          {item.title}
                        </Link>
                        <div className="mt-1 text-xs text-zinc-500">{shortId(item.case_id)}</div>
                      </td>
                      <td className="px-4 py-3">{item.case_type}</td>
                      <td className="px-4 py-3">
                        <StatusBadge value={item.status} tone={statusTone(item.status)} />
                      </td>
                      <td className="px-4 py-3">{item.priority}</td>
                      <td className="px-4 py-3">
                        <StatusBadge value={item.severity} tone={statusTone(item.severity)} />
                      </td>
                      <td className="px-4 py-3">{item.assigned_to ?? "Unassigned"}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.opened_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </DataState>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-zinc-500">Offset {offset}</div>
        <div className="flex gap-2">
          <button className="btn" type="button" onClick={() => setPage(offset - limit)} disabled={offset === 0}>
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button className="btn" type="button" onClick={() => setPage(offset + limit)} disabled={cases.length < limit}>
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
