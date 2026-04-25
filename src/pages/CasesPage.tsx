import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { FilterBar } from "../components/filters/FilterBar";
import { FormField } from "../components/forms/FormField";
import { PageHeader } from "../components/PageHeader";
import { PaginationControls } from "../components/PaginationControls";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { useQueryParams } from "../hooks/useQueryParams";
import type { CaseListParams, CaseRecord } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";

type CasesQueryParams = {
  status: string;
  assigned_to: string;
  priority: string;
  severity: string;
  case_type: string;
  q: string;
  limit: number;
  offset: number;
  sort_by: "updated_at" | "opened_at" | "priority";
  sort_order: "asc" | "desc";
};

const CASE_DEFAULTS: CasesQueryParams = {
  status: "",
  assigned_to: "",
  priority: "",
  severity: "",
  case_type: "",
  q: "",
  limit: 25,
  offset: 0,
  sort_by: "updated_at",
  sort_order: "desc",
};

function activeCaseFilters(params: CasesQueryParams) {
  return ["status", "assigned_to", "priority", "severity", "case_type", "q"].filter((key) => {
    const value = params[key as keyof CasesQueryParams];
    return value !== undefined && value !== "";
  }).length;
}

export function CasesPage() {
  const location = useLocation();
  const { params, setParams, resetParams } = useQueryParams(CASE_DEFAULTS);
  const [draft, setDraft] = useState(params);
  const filters = useMemo<CaseListParams>(() => params, [params]);
  const { data, loading, error, refresh } = useAsyncData(() => api.listCases(filters), [JSON.stringify(filters)]);

  useEffect(() => {
    setDraft(params);
  }, [params]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setParams({ ...draft, offset: 0 });
  }

  function clearFilters() {
    resetParams();
  }

  function setPage(nextOffset: number) {
    setParams({ offset: Math.max(0, nextOffset) });
  }

  const cases = data ?? [];
  const activeCount = activeCaseFilters(params);
  const returnTo = `${location.pathname}${location.search}`;

  return (
    <div>
      <PageHeader
        title="Cases"
        description="Canonical case list with assignment, lifecycle and operational filtering."
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <FilterBar title="Case filters" activeCount={activeCount} onReset={clearFilters}>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={applyFilters}>
          <FormField label="Status">
            <select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="">Any</option>
              <option value="open">open</option>
              <option value="in_review">in_review</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
              <option value="reopened">reopened</option>
            </select>
          </FormField>
          <FormField label="Owner">
            <input
              className="field"
              value={draft.assigned_to}
              onChange={(event) => setDraft({ ...draft, assigned_to: event.target.value })}
              placeholder="assigned_to"
            />
          </FormField>
          <FormField label="Priority">
            <select className="field" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}>
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </FormField>
          <FormField label="Severity">
            <select className="field" value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value })}>
              <option value="">Any</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </FormField>
          <FormField label="Case type">
            <input
              className="field"
              value={draft.case_type}
              onChange={(event) => setDraft({ ...draft, case_type: event.target.value })}
              placeholder="case_type"
            />
          </FormField>
          <FormField label="Search">
            <input className="field" value={draft.q} onChange={(event) => setDraft({ ...draft, q: event.target.value })} placeholder="title or code" />
          </FormField>
          <FormField label="Sort by">
            <select className="field" value={draft.sort_by} onChange={(event) => setDraft({ ...draft, sort_by: event.target.value as CasesQueryParams["sort_by"] })}>
              <option value="updated_at">updated_at</option>
              <option value="opened_at">opened_at</option>
              <option value="priority">priority</option>
            </select>
          </FormField>
          <FormField label="Order">
            <select className="field" value={draft.sort_order} onChange={(event) => setDraft({ ...draft, sort_order: event.target.value as CasesQueryParams["sort_order"] })}>
              <option value="desc">desc</option>
              <option value="asc">asc</option>
            </select>
          </FormField>
          <FormField label="Limit">
            <select className="field" value={draft.limit} onChange={(event) => setDraft({ ...draft, limit: Number(event.target.value) })}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </FormField>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">
            <button className="btn btn-primary w-full sm:w-auto" type="submit">
              Apply filters
            </button>
            <button className="btn w-full sm:w-auto" type="button" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </form>
      </FilterBar>

      <DataState loading={loading} error={error} onRetry={refresh}>
        {cases.length === 0 ? (
          <EmptyState label="No cases match the current filters." />
        ) : (
          <>
            <div className="hidden overflow-hidden md:block md:rounded md:border md:border-zinc-200 md:bg-white">
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
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {cases.map((item) => (
                      <tr key={item.case_id} className="align-top hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <Link
                            className="font-medium text-zinc-950 underline-offset-2 hover:underline"
                            to={`/cases/${item.case_id}`}
                            state={{ returnTo }}
                          >
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
                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {cases.map((item) => (
                <CaseCard key={item.case_id} item={item} returnTo={returnTo} />
              ))}
            </div>

            <PaginationControls limit={params.limit} offset={params.offset} itemCount={cases.length} onPage={setPage} />
          </>
        )}
      </DataState>
    </div>
  );
}

function CaseCard({ item, returnTo }: { item: CaseRecord; returnTo: string }) {
  return (
    <Link className="panel block p-4 hover:border-teal-200 hover:bg-teal-50/30" to={`/cases/${item.case_id}`} state={{ returnTo }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-zinc-950">{item.title}</div>
          <div className="mt-1 text-xs text-zinc-500">{shortId(item.case_id)}</div>
        </div>
        <StatusBadge value={item.status} tone={statusTone(item.status)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="label">Type</div>
          <div className="mt-1 break-words text-zinc-900">{item.case_type}</div>
        </div>
        <div>
          <div className="label">Owner</div>
          <div className="mt-1 break-words text-zinc-900">{item.assigned_to ?? "Unassigned"}</div>
        </div>
        <div>
          <div className="label">Priority</div>
          <div className="mt-1 text-zinc-900">{item.priority}</div>
        </div>
        <div>
          <div className="label">Severity</div>
          <div className="mt-1">
            <StatusBadge value={item.severity} tone={statusTone(item.severity)} />
          </div>
        </div>
      </div>
      <div className="mt-3 text-xs text-zinc-500">Updated {formatDateTime(item.updated_at)}</div>
    </Link>
  );
}
