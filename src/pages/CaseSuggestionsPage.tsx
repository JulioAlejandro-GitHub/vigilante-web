import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";

import { runSequentialBulkAction } from "../api/bulkActions";
import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { FilterBar } from "../components/filters/FilterBar";
import { FormField } from "../components/forms/FormField";
import { PageHeader } from "../components/PageHeader";
import { PaginationControls } from "../components/PaginationControls";
import { BulkActionBar } from "../components/selection/BulkActionBar";
import { SelectionToolbar } from "../components/selection/SelectionToolbar";
import { SuggestionDetailPanel } from "../components/suggestions/SuggestionDetailPanel";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useCurrentUser } from "../context/CurrentUserContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { useBulkSelection } from "../hooks/useBulkSelection";
import { useQueryParams } from "../hooks/useQueryParams";
import type { CaseSuggestion, QueueListParams } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";

type SuggestionQueryParams = {
  status: string;
  suggestion_type: string;
  camera_id: string;
  subject_id: string;
  suggestion_id: string;
  limit: number;
  offset: number;
};

const SUGGESTION_DEFAULTS: SuggestionQueryParams = {
  status: "",
  suggestion_type: "",
  camera_id: "",
  subject_id: "",
  suggestion_id: "",
  limit: 25,
  offset: 0,
};

function activeSuggestionFilters(params: SuggestionQueryParams) {
  return ["status", "suggestion_type", "camera_id", "subject_id"].filter((key) => {
    const value = params[key as keyof SuggestionQueryParams];
    return value !== undefined && value !== "";
  }).length;
}

export function CaseSuggestionsPage() {
  const location = useLocation();
  const { currentUser } = useCurrentUser();
  const { params, setParams, resetParams } = useQueryParams(SUGGESTION_DEFAULTS);
  const [draft, setDraft] = useState(params);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const filters = useMemo<QueueListParams>(
    () => ({
      status: params.status,
      suggestion_type: params.suggestion_type,
      camera_id: params.camera_id,
      subject_id: params.subject_id,
      limit: params.limit,
      offset: params.offset,
    }),
    [params],
  );
  const { data, loading, error, refresh } = useAsyncData(() => api.listCaseSuggestions(filters), [JSON.stringify(filters)]);

  useEffect(() => {
    setDraft(params);
  }, [params]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setParams({ ...draft, suggestion_id: "", offset: 0 });
  }

  function clearFilters() {
    resetParams();
  }

  function setPage(nextOffset: number) {
    setParams({ offset: Math.max(0, nextOffset) });
  }

  const suggestions = data ?? [];
  const selection = useBulkSelection(suggestions.map((suggestion) => suggestion.suggestion_id));
  const returnTo = `${location.pathname}${location.search}`;
  const currentSuggestionId = params.suggestion_id || suggestions[0]?.suggestion_id || null;
  const {
    data: selectedSuggestion,
    loading: selectedLoading,
    error: selectedError,
    refresh: refreshSelected,
  } = useAsyncData<CaseSuggestion | null>(
    () => (currentSuggestionId ? api.getCaseSuggestion(currentSuggestionId) : Promise.resolve(null)),
    [currentSuggestionId],
  );
  const refreshAll = () => {
    refresh();
    refreshSelected();
  };

  async function bulkResolve(decision: "accepted" | "rejected" | "deferred") {
    if (bulkBusy || selection.selectedCount === 0) return;
    const selectedSuggestions = suggestions.filter((suggestion) => selection.selectedIds.has(suggestion.suggestion_id));
    setBulkBusy(true);
    setBulkError(null);
    setBulkSuccess(null);
    const result = await runSequentialBulkAction(
      selectedSuggestions,
      (suggestion) => suggestion.suggestion_id,
      (suggestion) =>
        api.resolveCaseSuggestion(suggestion.suggestion_id, {
          decision,
          decision_reason: `bulk ${decision} from work queue`,
          resolved_by: currentUser.username,
        }),
    );

    setBulkSuccess(`Bulk ${decision}: ${result.succeeded}/${result.total} completed`);
    setBulkError(result.failures.length > 0 ? result.failures.map((item) => `${shortId(item.id)}: ${item.error}`).join(" | ") : null);
    selection.clearSelection();
    refreshAll();
    setBulkBusy(false);
  }

  return (
    <div>
      <PageHeader
        title="Case suggestions"
        description="Suggested cases from recognition evidence thresholds."
        actions={
          <>
            <button className="btn" type="button" onClick={() => setParams({ status: "pending", offset: 0 })}>
              Pending
            </button>
            <button className="btn" type="button" onClick={refreshAll}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button className={`btn ${params.status === "pending" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ status: "pending", offset: 0 })}>
          Pending
        </button>
        <button className={`btn ${params.status === "accepted" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ status: "accepted", offset: 0 })}>
          Accepted
        </button>
        <button className={`btn ${params.suggestion_type === "unresolved_subject_case" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ suggestion_type: "unresolved_subject_case", offset: 0 })}>
          Unresolved subjects
        </button>
      </div>

      <FilterBar title="Suggestion filters" activeCount={activeSuggestionFilters(params)} onReset={clearFilters}>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={applyFilters}>
          <FormField label="Status">
            <select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="">Any</option>
              <option value="pending">pending</option>
              <option value="accepted">accepted</option>
              <option value="rejected">rejected</option>
              <option value="deferred">deferred</option>
            </select>
          </FormField>
          <FormField label="Suggestion type">
            <input
              className="field"
              value={draft.suggestion_type}
              onChange={(event) => setDraft({ ...draft, suggestion_type: event.target.value })}
              placeholder="unresolved_subject_case"
            />
          </FormField>
          <FormField label="Camera">
            <input className="field" value={draft.camera_id} onChange={(event) => setDraft({ ...draft, camera_id: event.target.value })} placeholder="camera_id" />
          </FormField>
          <FormField label="Subject">
            <input className="field" value={draft.subject_id} onChange={(event) => setDraft({ ...draft, subject_id: event.target.value })} placeholder="subject_id" />
          </FormField>
          <FormField label="Limit">
            <select className="field" value={draft.limit} onChange={(event) => setDraft({ ...draft, limit: Number(event.target.value) })}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </FormField>
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-5">
            <button className="btn btn-primary w-full sm:w-auto" type="submit">
              Apply filters
            </button>
            <button className="btn w-full sm:w-auto" type="button" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </form>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div>
          <DataState loading={loading} error={error} onRetry={refresh}>
            {suggestions.length === 0 ? (
              <EmptyState label="No case suggestions match the current filters." />
            ) : (
              <>
                <SelectionToolbar
                  selectedCount={selection.selectedCount}
                  allVisibleSelected={selection.allVisibleSelected}
                  visibleCount={suggestions.length}
                  onToggleAll={selection.toggleAllVisible}
                  onClear={selection.clearSelection}
                />
                <BulkActionBar selectedCount={selection.selectedCount} busy={bulkBusy} error={bulkError} success={bulkSuccess}>
                  <button className="btn btn-primary" type="button" disabled={bulkBusy} onClick={() => void bulkResolve("accepted")}>
                    Accept
                  </button>
                  <button className="btn" type="button" disabled={bulkBusy} onClick={() => void bulkResolve("deferred")}>
                    Defer
                  </button>
                  <button className="btn btn-danger" type="button" disabled={bulkBusy} onClick={() => void bulkResolve("rejected")}>
                    Reject
                  </button>
                </BulkActionBar>
                <div className="hidden overflow-hidden md:block md:rounded md:border md:border-zinc-200 md:bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 text-sm">
                      <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase text-zinc-500">
                        <tr>
                          <th className="px-4 py-3">Select</th>
                          <th className="px-4 py-3">Suggestion</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Evidence</th>
                          <th className="px-4 py-3">Subject</th>
                          <th className="px-4 py-3">Event time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 bg-white">
                        {suggestions.map((suggestion) => (
                          <tr
                            key={suggestion.suggestion_id}
                            className={`cursor-pointer align-top hover:bg-zinc-50 ${
                              currentSuggestionId === suggestion.suggestion_id ? "bg-teal-50/60" : ""
                            }`}
                            onClick={() => setParams({ suggestion_id: suggestion.suggestion_id })}
                          >
                            <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selection.isSelected(suggestion.suggestion_id)}
                                onChange={() => selection.toggle(suggestion.suggestion_id)}
                                aria-label={`Select ${suggestion.suggestion_type}`}
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{suggestion.suggestion_type}</div>
                              <div className="mt-1 text-xs text-zinc-500">{shortId(suggestion.suggestion_id)}</div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />
                            </td>
                            <td className="px-4 py-3">{suggestion.evidence_count}</td>
                            <td className="px-4 py-3">{shortId(suggestion.subject_id)}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(suggestion.event_ts)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3 md:hidden">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.suggestion_id}
                      className={`panel w-full p-4 text-left hover:border-teal-200 hover:bg-teal-50/30 ${
                        currentSuggestionId === suggestion.suggestion_id ? "border-teal-300 bg-teal-50/60" : ""
                      }`}
                      type="button"
                      onClick={() => setParams({ suggestion_id: suggestion.suggestion_id })}
                    >
                      <span className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-700" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selection.isSelected(suggestion.suggestion_id)}
                          onChange={() => selection.toggle(suggestion.suggestion_id)}
                          aria-label={`Select ${suggestion.suggestion_type}`}
                        />
                        Select
                      </span>
                      <SuggestionSummary suggestion={suggestion} />
                    </button>
                  ))}
                </div>

                <PaginationControls limit={params.limit} offset={params.offset} itemCount={suggestions.length} onPage={setPage} />
              </>
            )}
          </DataState>
        </div>

        <DataState loading={selectedLoading} error={selectedError} onRetry={refreshSelected}>
          <SuggestionDetailPanel suggestion={selectedSuggestion} returnTo={returnTo} onChanged={refreshAll} />
        </DataState>
      </div>
    </div>
  );
}

function SuggestionSummary({ suggestion }: { suggestion: CaseSuggestion }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-zinc-950">{suggestion.suggestion_type}</div>
          <div className="mt-1 text-xs text-zinc-500">{shortId(suggestion.suggestion_id)}</div>
        </div>
        <StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-900">
        <div>
          <div className="label">Evidence</div>
          <div className="mt-1">{suggestion.evidence_count}</div>
        </div>
        <div>
          <div className="label">Subject</div>
          <div className="mt-1 break-words">{shortId(suggestion.subject_id)}</div>
        </div>
        <div>
          <div className="label">Camera</div>
          <div className="mt-1 break-words">{shortId(suggestion.camera_id)}</div>
        </div>
        <div>
          <div className="label">Promoted</div>
          <div className="mt-1">{suggestion.promoted_case_id ? shortId(suggestion.promoted_case_id) : "No"}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-zinc-500">{formatDateTime(suggestion.event_ts)}</div>
    </>
  );
}
