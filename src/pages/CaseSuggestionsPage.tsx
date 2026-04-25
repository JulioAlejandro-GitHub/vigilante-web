import { RefreshCw } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { Feedback } from "../components/Feedback";
import { KeyValue } from "../components/KeyValue";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import type { CaseSuggestion, QueueListParams } from "../types/api";
import { asErrorMessage, formatDateTime, shortId } from "../utils/format";

export function CaseSuggestionsPage() {
  const [filters, setFilters] = useState<QueueListParams>({ limit: 25, offset: 0 });
  const [draft, setDraft] = useState({ status: "", suggestion_type: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading, error, refresh } = useAsyncData(() => api.listCaseSuggestions(filters), [JSON.stringify(filters)]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setFilters({ ...filters, ...draft, offset: 0 });
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
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <form className="panel mb-4 grid gap-3 p-4 sm:grid-cols-3" onSubmit={applyFilters}>
        <input className="field" placeholder="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
        <input
          className="field"
          placeholder="Suggestion type"
          value={draft.suggestion_type}
          onChange={(e) => setDraft({ ...draft, suggestion_type: e.target.value })}
        />
        <button className="btn btn-primary" type="submit">
          Apply
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <DataState loading={loading} error={error}>
          {suggestions.length === 0 ? (
            <EmptyState label="No case suggestions match the current filters." />
          ) : (
            <div className="panel overflow-hidden">
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
                        className="cursor-pointer align-top hover:bg-zinc-50"
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
          )}
        </DataState>
        <DataState loading={selectedLoading} error={selectedError}>
          <SuggestionDetail suggestion={selectedSuggestion} onChanged={refreshAll} />
        </DataState>
      </div>
    </div>
  );
}

function SuggestionDetail({ suggestion, onChanged }: { suggestion: CaseSuggestion | null; onChanged: () => void }) {
  const [decision, setDecision] = useState<"accepted" | "rejected" | "deferred">("accepted");
  const [reason, setReason] = useState("sufficient evidence for case creation");
  const [actor, setActor] = useState("julio");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const suggestedTitle = useMemo(() => {
    const value = suggestion?.payload?.suggested_title;
    return typeof value === "string" ? value : "Recurring unidentified subject";
  }, [suggestion]);

  async function resolve(event: FormEvent) {
    event.preventDefault();
    if (!suggestion) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.resolveCaseSuggestion(suggestion.suggestion_id, { decision, decision_reason: reason, resolved_by: actor });
      setSuccess("Suggestion resolved");
      onChanged();
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function promote() {
    if (!suggestion) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.promoteCaseSuggestion(suggestion.suggestion_id, {
        resolved_by: actor,
        case_type: "unresolved_subject_case",
        title: suggestedTitle,
        priority: "medium",
        severity: "medium",
        case_payload: { created_from: "vigilante-web" },
      });
      setSuccess("Suggestion promoted to case");
      onChanged();
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  if (!suggestion) {
    return <EmptyState label="Select a case suggestion." />;
  }

  return (
    <aside className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">Suggestion detail</h2>
      <div className="mt-4 grid gap-3">
        <KeyValue label="Suggestion ID" value={shortId(suggestion.suggestion_id)} />
        <KeyValue label="Type" value={suggestion.suggestion_type} />
        <KeyValue label="Status" value={<StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />} />
        <KeyValue label="Reason" value={suggestion.reason_summary} />
        {suggestion.promoted_case_id ? (
          <KeyValue label="Promoted case" value={<Link className="text-zinc-950 underline" to={`/cases/${suggestion.promoted_case_id}`}>{shortId(suggestion.promoted_case_id)}</Link>} />
        ) : null}
      </div>
      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={resolve}>
        <Feedback error={error} success={success} />
        <select className="field" value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)}>
          <option value="accepted">accepted</option>
          <option value="rejected">rejected</option>
          <option value="deferred">deferred</option>
        </select>
        <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Decision reason" />
        <input className="field" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Resolved by" />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit" disabled={busy}>
            Resolve suggestion
          </button>
          <button className="btn" type="button" disabled={busy} onClick={() => void promote()}>
            Promote to case
          </button>
        </div>
      </form>
    </aside>
  );
}
