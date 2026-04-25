import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { Feedback } from "../components/Feedback";
import { FilterBar } from "../components/filters/FilterBar";
import { FormField } from "../components/forms/FormField";
import { KeyValue } from "../components/KeyValue";
import { PageHeader } from "../components/PageHeader";
import { PaginationControls } from "../components/PaginationControls";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { useQueryParams } from "../hooks/useQueryParams";
import type { CaseSuggestion, QueueListParams } from "../types/api";
import { asErrorMessage, formatDateTime, shortId } from "../utils/format";

type SuggestionQueryParams = {
  status: string;
  suggestion_type: string;
  camera_id: string;
  subject_id: string;
  limit: number;
  offset: number;
};

const SUGGESTION_DEFAULTS: SuggestionQueryParams = {
  status: "",
  suggestion_type: "",
  camera_id: "",
  subject_id: "",
  limit: 25,
  offset: 0,
};

function activeSuggestionFilters(params: SuggestionQueryParams) {
  return ["status", "suggestion_type", "camera_id", "subject_id"].filter((key) => {
    const value = params[key as keyof SuggestionQueryParams];
    return value !== undefined && value !== "";
  }).length;
}

function suggestedTitle(suggestion: CaseSuggestion | null) {
  const value = suggestion?.payload?.suggested_title;
  return typeof value === "string" && value.trim() ? value : "Recurring unidentified subject";
}

export function CaseSuggestionsPage() {
  const { params, setParams, resetParams } = useQueryParams(SUGGESTION_DEFAULTS);
  const [draft, setDraft] = useState(params);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filters = useMemo<QueueListParams>(() => params, [params]);
  const { data, loading, error, refresh } = useAsyncData(() => api.listCaseSuggestions(filters), [JSON.stringify(filters)]);

  useEffect(() => {
    setDraft(params);
  }, [params]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setSelectedId(null);
    setParams({ ...draft, offset: 0 });
  }

  function clearFilters() {
    setSelectedId(null);
    resetParams();
  }

  function setPage(nextOffset: number) {
    setSelectedId(null);
    setParams({ offset: Math.max(0, nextOffset) });
  }

  const suggestions = data ?? [];
  const currentSuggestionId = selectedId ?? suggestions[0]?.suggestion_id ?? null;
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

  return (
    <div>
      <PageHeader
        title="Case suggestions"
        description="Suggested cases from recognition evidence thresholds."
        actions={
          <button className="btn" type="button" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

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
                <div className="hidden overflow-hidden md:block md:rounded md:border md:border-zinc-200 md:bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 text-sm">
                      <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase text-zinc-500">
                        <tr>
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
                            onClick={() => setSelectedId(suggestion.suggestion_id)}
                          >
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
                      onClick={() => setSelectedId(suggestion.suggestion_id)}
                    >
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
          <SuggestionDetail suggestion={selectedSuggestion} onChanged={refreshAll} />
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

function SuggestionDetail({ suggestion, onChanged }: { suggestion: CaseSuggestion | null; onChanged: () => void }) {
  const [decision, setDecision] = useState<"accepted" | "rejected" | "deferred">("accepted");
  const [reason, setReason] = useState("sufficient evidence for case creation");
  const [actor, setActor] = useState("julio");
  const [caseTitle, setCaseTitle] = useState(suggestedTitle(suggestion));
  const [caseType, setCaseType] = useState("unresolved_subject_case");
  const [priority, setPriority] = useState("medium");
  const [severity, setSeverity] = useState("medium");
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setCaseTitle(suggestedTitle(suggestion));
    setFormError(null);
    setError(null);
    setSuccess(null);
  }, [suggestion?.suggestion_id]);

  if (!suggestion) {
    return <EmptyState label="Select a case suggestion." />;
  }
  const currentSuggestion = suggestion;

  async function run(label: string, action: () => Promise<unknown>) {
    if (busy) return;

    setBusy(label);
    setFormError(null);
    setError(null);
    setSuccess(null);
    try {
      await action();
      setSuccess(`${label} completed`);
      onChanged();
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  function resolve(event: FormEvent) {
    event.preventDefault();
    const trimmedReason = reason.trim();
    const trimmedActor = actor.trim();
    if (!trimmedReason || !trimmedActor) {
      setFormError("Decision reason and resolved by are required.");
      return;
    }
    void run("Resolve suggestion", () =>
      api.resolveCaseSuggestion(currentSuggestion.suggestion_id, { decision, decision_reason: trimmedReason, resolved_by: trimmedActor }),
    );
  }

  function promote() {
    const trimmedActor = actor.trim();
    const trimmedTitle = caseTitle.trim();
    const trimmedCaseType = caseType.trim();
    if (!trimmedActor || !trimmedTitle || !trimmedCaseType) {
      setFormError("Resolved by, title and case type are required before promotion.");
      return;
    }
    void run("Promote to case", () =>
      api.promoteCaseSuggestion(currentSuggestion.suggestion_id, {
        resolved_by: trimmedActor,
        case_type: trimmedCaseType,
        title: trimmedTitle,
        priority,
        severity,
        case_payload: { created_from: "vigilante-web" },
      }),
    );
  }

  return (
    <aside className="panel p-4 xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Suggestion detail</h2>
          <div className="mt-1 text-xs text-zinc-500">{shortId(suggestion.suggestion_id)}</div>
        </div>
        <StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />
      </div>
      <div className="mt-4 grid gap-3">
        <KeyValue label="Type" value={suggestion.suggestion_type} />
        <KeyValue label="Evidence" value={suggestion.evidence_count} />
        <KeyValue label="Reason" value={suggestion.reason_summary} />
        {suggestion.promoted_case_id ? (
          <KeyValue
            label="Promoted case"
            value={
              <Link className="text-teal-800 underline-offset-2 hover:underline" to={`/cases/${suggestion.promoted_case_id}`}>
                {shortId(suggestion.promoted_case_id)}
              </Link>
            }
          />
        ) : null}
      </div>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={resolve}>
        <Feedback error={formError ?? error} success={success} />
        <FormField label="Decision">
          <select className="field" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
            <option value="accepted">accepted</option>
            <option value="rejected">rejected</option>
            <option value="deferred">deferred</option>
          </select>
        </FormField>
        <FormField label="Decision reason">
          <input className="field" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="sufficient evidence" />
        </FormField>
        <FormField label="Resolved by">
          <input className="field" value={actor} onChange={(event) => setActor(event.target.value)} placeholder="julio" />
        </FormField>
        <button className="btn btn-primary w-full" type="submit" disabled={busy !== null || !reason.trim() || !actor.trim()}>
          {busy === "Resolve suggestion" ? "Resolving..." : "Resolve suggestion"}
        </button>
      </form>

      <div className="mt-5 space-y-3 border-t border-zinc-200 pt-4">
        <FormField label="Case title">
          <input className="field" value={caseTitle} onChange={(event) => setCaseTitle(event.target.value)} placeholder="Case title" />
        </FormField>
        <FormField label="Case type">
          <input className="field" value={caseType} onChange={(event) => setCaseType(event.target.value)} placeholder="case_type" />
        </FormField>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <FormField label="Priority">
            <select className="field" value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </FormField>
          <FormField label="Severity">
            <select className="field" value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </FormField>
        </div>
        <button className="btn w-full" type="button" disabled={busy !== null || !caseTitle.trim() || !caseType.trim() || !actor.trim()} onClick={promote}>
          {busy === "Promote to case" ? "Promoting..." : "Promote to case"}
        </button>
      </div>
    </aside>
  );
}
