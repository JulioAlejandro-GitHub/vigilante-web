import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { runSequentialBulkAction } from "../api/bulkActions";
import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { FilterBar } from "../components/filters/FilterBar";
import { FormField } from "../components/forms/FormField";
import { OwnerBadge } from "../components/ownership/OwnerBadge";
import { PageHeader } from "../components/PageHeader";
import { PaginationControls } from "../components/PaginationControls";
import { BulkActionBar } from "../components/selection/BulkActionBar";
import { SelectionToolbar } from "../components/selection/SelectionToolbar";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useCurrentUser } from "../context/CurrentUserContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { useBulkSelection } from "../hooks/useBulkSelection";
import { useQueryParams } from "../hooks/useQueryParams";
import type { CaseListParams, CaseRecord } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";

type CasesQueryParams = {
  status: string;
  assigned_to: string;
  priority: string;
  severity: string;
  case_type: string;
  organization_id: string;
  site_id: string;
  q: string;
  ownership: "all" | "mine" | "unassigned";
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
  organization_id: "",
  site_id: "",
  q: "",
  ownership: "all",
  limit: 25,
  offset: 0,
  sort_by: "updated_at",
  sort_order: "desc",
};

function activeCaseFilters(params: CasesQueryParams) {
  return ["status", "assigned_to", "priority", "severity", "case_type", "organization_id", "site_id", "q", "ownership"].filter((key) => {
    const value = params[key as keyof CasesQueryParams];
    return value !== undefined && value !== "" && value !== "all";
  }).length;
}

export function CasesPage() {
  const location = useLocation();
  const { currentUser, can } = useCurrentUser();
  const { params, setParams, resetParams } = useQueryParams(CASE_DEFAULTS);
  const [draft, setDraft] = useState(params);
  const [bulkStatus, setBulkStatus] = useState("in_review");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const filters = useMemo<CaseListParams>(
    () => ({
      status: params.status,
      assigned_to: params.ownership === "mine" ? currentUser.username : params.ownership === "unassigned" ? "" : params.assigned_to,
      priority: params.priority,
      severity: params.severity,
      case_type: params.case_type,
      organization_id: params.organization_id,
      site_id: params.site_id,
      q: params.q,
      limit: params.limit,
      offset: params.offset,
      sort_by: params.sort_by,
      sort_order: params.sort_order,
    }),
    [currentUser.username, params],
  );
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
  const visibleCases = params.ownership === "unassigned" ? cases.filter((item) => !item.assigned_to) : cases;
  const selection = useBulkSelection(visibleCases.map((item) => item.case_id));
  const activeCount = activeCaseFilters(params);
  const returnTo = `${location.pathname}${location.search}`;

  async function runBulk(label: string, action: (caseId: string) => Promise<unknown>) {
    if (bulkBusy || selection.selectedCount === 0 || !can("bulk:write")) return;
    setBulkBusy(true);
    setBulkError(null);
    setBulkSuccess(null);
    const result = await runSequentialBulkAction(selection.selectedList, (caseId) => caseId, action);

    setBulkSuccess(`${label}: ${result.succeeded}/${result.total} completed`);
    setBulkError(result.failures.length > 0 ? result.failures.map((item) => `${shortId(item.id)}: ${item.error}`).join(" | ") : null);
    selection.clearSelection();
    refresh();
    setBulkBusy(false);
  }

  return (
    <div>
      <PageHeader
        title="Cases"
        description="Canonical case list with assignment, lifecycle and operational filtering."
        actions={
          <>
            <button
              className="btn"
              type="button"
              onClick={() => setParams({ ownership: "mine", assigned_to: currentUser.username, offset: 0 })}
            >
              Assigned to me
            </button>
            <button className="btn" type="button" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button className={`btn ${params.ownership === "mine" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ ownership: "mine", assigned_to: currentUser.username, offset: 0 })}>
          Assigned to me
        </button>
        <button className={`btn ${params.ownership === "unassigned" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ ownership: "unassigned", assigned_to: "", offset: 0 })}>
          Unassigned
        </button>
        <button className={`btn ${params.status === "open" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ status: "open", offset: 0 })}>
          Open
        </button>
        <button className={`btn ${params.status === "in_review" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ status: "in_review", offset: 0 })}>
          Under review
        </button>
      </div>

      <FilterBar title="Case filters" activeCount={activeCount} onReset={clearFilters}>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={applyFilters}>
          <FormField label="Ownership">
            <select className="field" value={draft.ownership} onChange={(event) => setDraft({ ...draft, ownership: event.target.value as CasesQueryParams["ownership"] })}>
              <option value="all">All</option>
              <option value="mine">Assigned to me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </FormField>
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
          <FormField label="Organization">
            <input
              className="field"
              value={draft.organization_id}
              onChange={(event) => setDraft({ ...draft, organization_id: event.target.value })}
              placeholder="organization_id"
            />
          </FormField>
          <FormField label="Site">
            <input className="field" value={draft.site_id} onChange={(event) => setDraft({ ...draft, site_id: event.target.value })} placeholder="site_id" />
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
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-4">
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
        {visibleCases.length === 0 ? (
          <EmptyState label="No cases match the current filters." />
        ) : (
          <>
            <SelectionToolbar
              selectedCount={selection.selectedCount}
              allVisibleSelected={selection.allVisibleSelected}
              visibleCount={visibleCases.length}
              onToggleAll={selection.toggleAllVisible}
              onClear={selection.clearSelection}
            />
            <BulkActionBar selectedCount={selection.selectedCount} busy={bulkBusy} error={bulkError} success={bulkSuccess}>
              <button
                className="btn btn-primary"
                type="button"
                disabled={bulkBusy || !can("bulk:write")}
                onClick={() =>
                  void runBulk("Assign to me", (caseId) =>
                    api.assignCase(caseId, {
                      assigned_to: currentUser.username,
                      assigned_by: currentUser.username,
                      assignment_reason: "bulk assignment from work queue",
                    }),
                  )
                }
              >
                Assign to me
              </button>
              <button
                className="btn"
                type="button"
                disabled={bulkBusy || !can("bulk:write")}
                onClick={() =>
                  void runBulk("Unassign", (caseId) =>
                    api.unassignCase(caseId, {
                      assigned_by: currentUser.username,
                      assignment_reason: "bulk unassignment from work queue",
                    }),
                  )
                }
              >
                Unassign
              </button>
              <select className="field w-auto min-w-36" value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} disabled={bulkBusy}>
                <option value="open">open</option>
                <option value="in_review">in_review</option>
                <option value="resolved">resolved</option>
                <option value="closed">closed</option>
                <option value="reopened">reopened</option>
              </select>
              <button
                className="btn"
                type="button"
                disabled={bulkBusy || !can("bulk:write")}
                onClick={() =>
                  void runBulk("Change status", (caseId) =>
                    api.changeCaseStatus(caseId, {
                      status: bulkStatus,
                      reason: "bulk status update from work queue",
                      changed_by: currentUser.username,
                    }),
                  )
                }
              >
                Set status
              </button>
            </BulkActionBar>
            <div className="hidden overflow-hidden md:block md:rounded md:border md:border-zinc-200 md:bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Select</th>
                      <th className="px-4 py-3">Case</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Severity</th>
                      <th className="px-4 py-3">Owner</th>
                      <th className="px-4 py-3">Org / site</th>
                      <th className="px-4 py-3">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {visibleCases.map((item) => (
                      <tr key={item.case_id} className="align-top hover:bg-zinc-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selection.isSelected(item.case_id)}
                            onChange={() => selection.toggle(item.case_id)}
                            aria-label={`Select ${item.title}`}
                          />
                        </td>
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
                        <td className="px-4 py-3">
                          <OwnerBadge assignedTo={item.assigned_to} assignedAt={item.assigned_at} compact />
                        </td>
                        <td className="px-4 py-3">
                          <div>{shortId(item.organization_id)}</div>
                          <div className="mt-1 text-xs text-zinc-500">{shortId(item.site_id)}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(item.updated_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {visibleCases.map((item) => (
                <CaseCard key={item.case_id} item={item} returnTo={returnTo} selected={selection.isSelected(item.case_id)} onToggle={() => selection.toggle(item.case_id)} />
              ))}
            </div>

            <PaginationControls limit={params.limit} offset={params.offset} itemCount={cases.length} onPage={setPage} />
          </>
        )}
      </DataState>
    </div>
  );
}

function CaseCard({ item, returnTo, selected, onToggle }: { item: CaseRecord; returnTo: string; selected: boolean; onToggle: () => void }) {
  return (
    <div className={`panel p-4 hover:border-teal-200 hover:bg-teal-50/30 ${selected ? "border-teal-300 bg-teal-50/60" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <input className="mt-1" type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${item.title}`} />
          <div className="min-w-0">
            <Link className="font-medium text-zinc-950 underline-offset-2 hover:underline" to={`/cases/${item.case_id}`} state={{ returnTo }}>
              {item.title}
            </Link>
            <div className="mt-1 text-xs text-zinc-500">{shortId(item.case_id)}</div>
          </div>
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
          <div className="mt-1">
            <OwnerBadge assignedTo={item.assigned_to} assignedAt={item.assigned_at} compact />
          </div>
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
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>Updated {formatDateTime(item.updated_at)}</span>
        <span>Org {shortId(item.organization_id)}</span>
        <span>Site {shortId(item.site_id)}</span>
      </div>
    </div>
  );
}
