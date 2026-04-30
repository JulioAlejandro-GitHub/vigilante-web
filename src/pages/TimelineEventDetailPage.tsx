import { RefreshCw } from "lucide-react";
import { useParams } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState } from "../components/DataState";
import { EvidenceWorkspace } from "../components/evidence/EvidenceWorkspace";
import { Breadcrumbs } from "../components/navigation/Breadcrumbs";
import { ContextualBackLink } from "../components/navigation/ContextualBackLink";
import { EntityHeader } from "../components/navigation/EntityHeader";
import { RelatedLinksPanel } from "../components/navigation/RelatedLinksPanel";
import { EventMetadataPanel } from "../components/timeline/EventMetadataPanel";
import { EventTypeBadge } from "../components/timeline/EventTypeBadge";
import { SourceTracePanel } from "../components/timeline/SourceTracePanel";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { useAsyncData } from "../hooks/useAsyncData";
import { useNavigationContext } from "../hooks/useNavigationContext";
import type { TimelineEvent } from "../types/api";
import { payloadString } from "../utils/evidence";
import { formatDateTime, shortId } from "../utils/format";

export function TimelineEventDetailPage() {
  const { sourceEventId = "" } = useParams();
  const navigation = useNavigationContext("/timeline");
  const { data: event, loading, error, refresh } = useAsyncData<TimelineEvent>(() => api.getTimelineEvent(sourceEventId), [sourceEventId]);

  const reviewId = payloadString(event?.payload, ["review_id", "manual_review_id"]);
  const suggestionId = payloadString(event?.payload, ["suggestion_id", "case_suggestion_id"]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Timeline", to: navigation.returnTo }, { label: event ? shortId(event.source_event_id) : "Timeline event" }]} />
      <DataState loading={loading} error={error} onRetry={refresh}>
        {event ? (
          <div className="space-y-6">
            <EntityHeader
              eyebrow="Timeline event"
              title={event.summary || event.event_type}
              description={
                <span>
                  {shortId(event.source_event_id)} · {formatDateTime(event.event_ts)}
                </span>
              }
              organizationId={event.organization_id}
              siteId={event.site_id}
              badges={
                <>
                  <EventTypeBadge eventType={event.event_type} />
                  <StatusBadge value={event.severity} tone={statusTone(event.severity)} />
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
                <EvidenceWorkspace
                  payload={event.payload}
                  evidenceMedia={event.evidence_media}
                  sourceEventId={event.source_event_id}
                  title="Timeline evidence workspace"
                />
                <RelatedLinksPanel
                  links={[
                    event.case_id ? { label: "Case", value: shortId(event.case_id), to: navigation.caseHref(event.case_id), tone: "case" } : null,
                    reviewId ? { label: "Review", value: shortId(reviewId), to: navigation.reviewHref(reviewId), tone: "review" } : null,
                    suggestionId
                      ? { label: "Suggestion", value: shortId(suggestionId), to: navigation.suggestionHref(suggestionId), tone: "suggestion" }
                      : null,
                    { label: "Source event", value: shortId(event.source_event_id), to: navigation.timelineQueueHref(event.source_event_id), tone: "timeline" },
                  ]}
                />
              </div>

              <div className="space-y-4">
                <EventMetadataPanel event={event} />
                <SourceTracePanel event={event} returnTo={navigation.currentPath} />
              </div>
            </div>
          </div>
        ) : null}
      </DataState>
    </div>
  );
}
