import { RefreshCw } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState } from "../components/DataState";
import { EvidenceWorkspace } from "../components/evidence/EvidenceWorkspace";
import { InvestigationContextPanel } from "../components/investigation/InvestigationContextPanel";
import { Breadcrumbs } from "../components/navigation/Breadcrumbs";
import { ContextualBackLink } from "../components/navigation/ContextualBackLink";
import { EntityHeader } from "../components/navigation/EntityHeader";
import { RelatedLinksPanel } from "../components/navigation/RelatedLinksPanel";
import { ReviewDetailPanel } from "../components/reviews/ReviewDetailPanel";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { useNavigationContext } from "../hooks/useNavigationContext";
import type { ManualReview } from "../types/api";
import { payloadString } from "../utils/evidence";
import { formatDateTime, shortId } from "../utils/format";

export function ManualReviewDetailPage() {
  const { reviewId = "" } = useParams();
  const navigation = useNavigationContext("/manual-reviews");
  const { data: review, loading, error, refresh } = useAsyncData<ManualReview>(() => api.getManualReview(reviewId), [reviewId]);

  const relatedCaseId =
    payloadString(review?.payload, ["case_id", "linked_case_id", "promoted_case_id"]) ??
    payloadString(review?.resolution_payload, ["case_id", "linked_case_id", "promoted_case_id"]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Manual reviews", to: navigation.returnTo }, { label: review ? shortId(review.review_id) : "Review detail" }]} />
      <DataState loading={loading} error={error} onRetry={refresh}>
        {review ? (
          <div className="space-y-6">
            <EntityHeader
              eyebrow="Manual review"
              title={review.review_type}
              description={
                <span>
                  {shortId(review.review_id)} · event {formatDateTime(review.event_ts)}
                </span>
              }
              organizationId={review.organization_id}
              siteId={review.site_id}
              badges={
                <>
                  <StatusBadge value={review.status} tone={statusTone(review.status)} />
                  <StatusBadge value={review.severity} tone={statusTone(review.severity)} />
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">Priority {review.priority}</span>
                </>
              }
              actions={
                <>
                  <ContextualBackLink to={navigation.returnTo} label="Back to context" />
                  <button className="btn" type="button" onClick={refresh}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </button>
                </>
              }
            />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
              <div className="space-y-6">
                <EvidenceWorkspace payload={review.payload} sourceEventId={review.source_event_id} title="Review evidence workspace" />
                <RelatedLinksPanel
                  links={[
                    relatedCaseId
                      ? { label: "Related case", value: shortId(relatedCaseId), to: navigation.caseHref(relatedCaseId), tone: "case" }
                      : null,
                    review.source_event_id
                      ? { label: "Timeline event", value: shortId(review.source_event_id), to: navigation.timelineEventHref(review.source_event_id), tone: "timeline" }
                      : null,
                  ]}
                />
              </div>

              <div className="space-y-4">
                <InvestigationContextPanel
                  subjectId={review.subject_id}
                  trackId={review.track_id}
                  cameraId={review.camera_id}
                  eventTs={review.event_ts}
                  organizationId={review.organization_id}
                  siteId={review.site_id}
                />
                <ReviewDetailPanel review={review} returnTo={navigation.returnTo} onChanged={refresh} />
                <Link className="btn w-full justify-center" to={navigation.withReturnTo(navigation.reviewQueueHref(review.review_id))}>
                  Open in review queue
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </DataState>
    </div>
  );
}
