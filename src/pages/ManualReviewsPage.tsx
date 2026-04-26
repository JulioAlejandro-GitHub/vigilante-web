import { RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { runSequentialBulkAction } from "../api/bulkActions";
import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { FilterBar } from "../components/filters/FilterBar";
import { FormField } from "../components/forms/FormField";
import { PageHeader } from "../components/PageHeader";
import { PaginationControls } from "../components/PaginationControls";
import { ReviewDetailPanel } from "../components/reviews/ReviewDetailPanel";
import { BulkActionBar } from "../components/selection/BulkActionBar";
import { SelectionToolbar } from "../components/selection/SelectionToolbar";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useCurrentUser } from "../context/CurrentUserContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { useBulkSelection } from "../hooks/useBulkSelection";
import { useQueryParams } from "../hooks/useQueryParams";
import type { ManualReview, QueueListParams } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";

type ManualReviewQueryParams = {
  status: string;
  review_type: string;
  priority: string;
  camera_id: string;
  subject_id: string;
  limit: number;
  offset: number;
};

const MANUAL_REVIEW_DEFAULTS: ManualReviewQueryParams = {
  status: "",
  review_type: "",
  priority: "",
  camera_id: "",
  subject_id: "",
  limit: 25,
  offset: 0,
};

function activeReviewFilters(params: ManualReviewQueryParams) {
  return ["status", "review_type", "priority", "camera_id", "subject_id"].filter((key) => {
    const value = params[key as keyof ManualReviewQueryParams];
    return value !== undefined && value !== "";
  }).length;
}

export function ManualReviewsPage() {
  const { currentUser } = useCurrentUser();
  const { params, setParams, resetParams } = useQueryParams(MANUAL_REVIEW_DEFAULTS);
  const [draft, setDraft] = useState(params);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const filters = useMemo<QueueListParams>(() => params, [params]);
  const { data, loading, error, refresh } = useAsyncData(() => api.listManualReviews(filters), [JSON.stringify(filters)]);

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

  const reviews = data ?? [];
  const selection = useBulkSelection(reviews.map((review) => review.review_id));
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

  async function bulkApprove() {
    if (bulkBusy || selection.selectedCount === 0) return;
    const selectedReviews = reviews.filter((review) => selection.selectedIds.has(review.review_id));
    setBulkBusy(true);
    setBulkError(null);
    setBulkSuccess(null);
    const result = await runSequentialBulkAction(
      selectedReviews,
      (review) => review.review_id,
      (review) =>
        api.resolveManualReview(review.review_id, {
          decision: "approved",
          decision_reason: "bulk approved from work queue",
          resolved_by: currentUser.username,
          ...(review.review_type === "identity_conflict" ? { identity_resolution: "mark_unresolved" } : {}),
        }),
    );

    setBulkSuccess(`Bulk approve: ${result.succeeded}/${result.total} completed`);
    setBulkError(result.failures.length > 0 ? result.failures.map((item) => `${shortId(item.id)}: ${item.error}`).join(" | ") : null);
    selection.clearSelection();
    refreshAll();
    setBulkBusy(false);
  }

  return (
    <div>
      <PageHeader
        title="Manual reviews"
        description="Operational review queue projected from recognition events."
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
        <button className={`btn ${params.status === "approved" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ status: "approved", offset: 0 })}>
          Approved
        </button>
        <button className={`btn ${params.review_type === "identity_conflict" ? "btn-primary" : ""}`} type="button" onClick={() => setParams({ review_type: "identity_conflict", offset: 0 })}>
          Identity conflicts
        </button>
      </div>

      <FilterBar title="Review filters" activeCount={activeReviewFilters(params)} onReset={clearFilters}>
        <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-6" onSubmit={applyFilters}>
          <FormField label="Status">
            <select className="field" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
              <option value="">Any</option>
              <option value="pending">pending</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
              <option value="needs_more_evidence">needs_more_evidence</option>
            </select>
          </FormField>
          <FormField label="Review type">
            <input
              className="field"
              value={draft.review_type}
              onChange={(event) => setDraft({ ...draft, review_type: event.target.value })}
              placeholder="identity_conflict"
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
          <div className="flex items-end gap-2 md:col-span-2 xl:col-span-6">
            <button className="btn btn-primary w-full sm:w-auto" type="submit">
              Apply filters
            </button>
            <button className="btn w-full sm:w-auto" type="button" onClick={clearFilters}>
              Clear
            </button>
          </div>
        </form>
      </FilterBar>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div>
          <DataState loading={loading} error={error} onRetry={refresh}>
            {reviews.length === 0 ? (
              <EmptyState label="No manual reviews match the current filters." />
            ) : (
              <>
                <SelectionToolbar
                  selectedCount={selection.selectedCount}
                  allVisibleSelected={selection.allVisibleSelected}
                  visibleCount={reviews.length}
                  onToggleAll={selection.toggleAllVisible}
                  onClear={selection.clearSelection}
                />
                <BulkActionBar selectedCount={selection.selectedCount} busy={bulkBusy} error={bulkError} success={bulkSuccess}>
                  <button className="btn btn-primary" type="button" disabled={bulkBusy} onClick={() => void bulkApprove()}>
                    Bulk approve
                  </button>
                </BulkActionBar>
                <div className="hidden overflow-hidden md:block md:rounded md:border md:border-zinc-200 md:bg-white">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 text-sm">
                      <thead className="bg-zinc-100 text-left text-xs font-semibold uppercase text-zinc-500">
                        <tr>
                          <th className="px-4 py-3">Select</th>
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
                            className={`cursor-pointer align-top hover:bg-zinc-50 ${
                              currentReviewId === review.review_id ? "bg-teal-50/60" : ""
                            }`}
                            onClick={() => setSelectedId(review.review_id)}
                          >
                            <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={selection.isSelected(review.review_id)}
                                onChange={() => selection.toggle(review.review_id)}
                                aria-label={`Select ${review.review_type}`}
                              />
                            </td>
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

                <div className="space-y-3 md:hidden">
                  {reviews.map((review) => (
                    <button
                      key={review.review_id}
                      className={`panel w-full p-4 text-left hover:border-teal-200 hover:bg-teal-50/30 ${
                        currentReviewId === review.review_id ? "border-teal-300 bg-teal-50/60" : ""
                      }`}
                      type="button"
                      onClick={() => setSelectedId(review.review_id)}
                    >
                      <span className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-zinc-700" onClick={(event) => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selection.isSelected(review.review_id)}
                          onChange={() => selection.toggle(review.review_id)}
                          aria-label={`Select ${review.review_type}`}
                        />
                        Select
                      </span>
                      <ReviewSummary review={review} />
                    </button>
                  ))}
                </div>

                <PaginationControls limit={params.limit} offset={params.offset} itemCount={reviews.length} onPage={setPage} />
              </>
            )}
          </DataState>
        </div>

        <DataState loading={selectedLoading} error={selectedError} onRetry={refreshSelected}>
          <ReviewDetailPanel review={selectedReview} onChanged={refreshAll} />
        </DataState>
      </div>
    </div>
  );
}

function ReviewSummary({ review }: { review: ManualReview }) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-zinc-950">{review.review_type}</div>
          <div className="mt-1 text-xs text-zinc-500">{shortId(review.review_id)}</div>
        </div>
        <StatusBadge value={review.status} tone={statusTone(review.status)} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-zinc-900">
        <div>
          <div className="label">Priority</div>
          <div className="mt-1">{review.priority}</div>
        </div>
        <div>
          <div className="label">Severity</div>
          <div className="mt-1">
            <StatusBadge value={review.severity} tone={statusTone(review.severity)} />
          </div>
        </div>
        <div>
          <div className="label">Subject</div>
          <div className="mt-1 break-words">{shortId(review.subject_id)}</div>
        </div>
        <div>
          <div className="label">Camera</div>
          <div className="mt-1 break-words">{shortId(review.camera_id)}</div>
        </div>
      </div>
      <div className="mt-3 text-xs text-zinc-500">{formatDateTime(review.event_ts)}</div>
    </>
  );
}
