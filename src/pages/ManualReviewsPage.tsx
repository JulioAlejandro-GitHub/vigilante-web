import { RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";

import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { Feedback } from "../components/Feedback";
import { KeyValue } from "../components/KeyValue";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import type { ManualReview, QueueListParams } from "../types/api";
import { asErrorMessage, formatDateTime, shortId } from "../utils/format";

export function ManualReviewsPage() {
  const [filters, setFilters] = useState<QueueListParams>({ limit: 25, offset: 0 });
  const [draft, setDraft] = useState({ status: "", review_type: "", priority: "" });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, loading, error, refresh } = useAsyncData(() => api.listManualReviews(filters), [JSON.stringify(filters)]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    setFilters({ ...filters, ...draft, offset: 0 });
  }

  const reviews = data ?? [];
  const currentReviewId = selectedId ?? reviews[0]?.review_id ?? null;
  const {
    data: selectedReview,
    loading: selectedLoading,
    error: selectedError,
    refresh: refreshSelected,
  } = useAsyncData<ManualReview | null>(
    () => (currentReviewId ? api.getManualReview(currentReviewId) : Promise.resolve(null)),
    [currentReviewId],
  );
  const refreshAll = () => {
    refresh();
    refreshSelected();
  };

  return (
    <div>
      <PageHeader
        title="Manual reviews"
        description="Operational queue for reviews projected from recognition events."
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <form className="panel mb-4 grid gap-3 p-4 sm:grid-cols-4" onSubmit={applyFilters}>
        <input className="field" placeholder="Status" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })} />
        <input
          className="field"
          placeholder="Review type"
          value={draft.review_type}
          onChange={(e) => setDraft({ ...draft, review_type: e.target.value })}
        />
        <input className="field" placeholder="Priority" value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value })} />
        <button className="btn btn-primary" type="submit">
          Apply
        </button>
      </form>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <DataState loading={loading} error={error}>
          {reviews.length === 0 ? (
            <EmptyState label="No manual reviews match the current filters." />
          ) : (
            <div className="panel overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-zinc-200 text-sm">
                  <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase text-zinc-500">
                    <tr>
                      <th className="px-4 py-3">Review</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Event time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white">
                    {reviews.map((review) => (
                      <tr
                        key={review.review_id}
                        className="cursor-pointer align-top hover:bg-zinc-50"
                        onClick={() => setSelectedId(review.review_id)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{review.review_type}</div>
                          <div className="mt-1 text-xs text-zinc-500">{shortId(review.review_id)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={review.status} tone={statusTone(review.status)} />
                        </td>
                        <td className="px-4 py-3">{review.priority}</td>
                        <td className="px-4 py-3">{shortId(review.subject_id)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatDateTime(review.event_ts)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DataState>
        <DataState loading={selectedLoading} error={selectedError}>
          <ReviewDetail review={selectedReview} onChanged={refreshAll} />
        </DataState>
      </div>
    </div>
  );
}

function ReviewDetail({ review, onChanged }: { review: ManualReview | null; onChanged: () => void }) {
  const [decision, setDecision] = useState<"approved" | "rejected" | "needs_more_evidence">("approved");
  const [reason, setReason] = useState("confirmed by analyst");
  const [actor, setActor] = useState("julio");
  const [identityResolution, setIdentityResolution] = useState<"confirm_identity" | "discard_candidate" | "mark_unresolved" | "escalate">(
    "confirm_identity",
  );
  const [confirmedPerson, setConfirmedPerson] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!review) {
    return <EmptyState label="Select a manual review." />;
  }
  const currentReview = review;

  async function resolve(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await api.resolveManualReview(currentReview.review_id, {
        decision,
        decision_reason: reason,
        resolved_by: actor,
        ...(currentReview.review_type === "identity_conflict"
          ? {
              identity_resolution: identityResolution,
              confirmed_person_profile_id: confirmedPerson || undefined,
            }
          : {}),
      });
      setSuccess("Review resolved");
      onChanged();
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">Review detail</h2>
      <div className="mt-4 grid gap-3">
        <KeyValue label="Review ID" value={shortId(review.review_id)} />
        <KeyValue label="Type" value={review.review_type} />
        <KeyValue label="Status" value={<StatusBadge value={review.status} tone={statusTone(review.status)} />} />
        <KeyValue label="Reason" value={review.reason_summary} />
      </div>
      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={resolve}>
        <Feedback error={error} success={success} />
        <select className="field" value={decision} onChange={(e) => setDecision(e.target.value as typeof decision)}>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="needs_more_evidence">needs_more_evidence</option>
        </select>
        <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Decision reason" />
        <input className="field" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Resolved by" />
        {review.review_type === "identity_conflict" ? (
          <>
            <select className="field" value={identityResolution} onChange={(e) => setIdentityResolution(e.target.value as typeof identityResolution)}>
              <option value="confirm_identity">confirm_identity</option>
              <option value="discard_candidate">discard_candidate</option>
              <option value="mark_unresolved">mark_unresolved</option>
              <option value="escalate">escalate</option>
            </select>
            <input className="field" value={confirmedPerson} onChange={(e) => setConfirmedPerson(e.target.value)} placeholder="Confirmed person profile ID" />
          </>
        ) : null}
        <button className="btn btn-primary" type="submit" disabled={busy}>
          Resolve review
        </button>
      </form>
    </aside>
  );
}
