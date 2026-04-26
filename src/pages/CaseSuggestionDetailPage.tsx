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
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { SuggestionDetailPanel } from "../components/suggestions/SuggestionDetailPanel";
import { useAsyncData } from "../hooks/useAsyncData";
import { useNavigationContext } from "../hooks/useNavigationContext";
import type { CaseSuggestion } from "../types/api";
import { payloadString } from "../utils/evidence";
import { formatDateTime, shortId } from "../utils/format";

export function CaseSuggestionDetailPage() {
  const { suggestionId = "" } = useParams();
  const navigation = useNavigationContext("/case-suggestions");
  const { data: suggestion, loading, error, refresh } = useAsyncData<CaseSuggestion>(() => api.getCaseSuggestion(suggestionId), [suggestionId]);

  const relatedCaseId =
    suggestion?.promoted_case_id ??
    payloadString(suggestion?.payload, ["case_id", "linked_case_id", "promoted_case_id"]) ??
    payloadString(suggestion?.resolution_payload, ["case_id", "linked_case_id", "promoted_case_id"]);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Case suggestions", to: navigation.returnTo }, { label: suggestion ? shortId(suggestion.suggestion_id) : "Suggestion detail" }]} />
      <DataState loading={loading} error={error} onRetry={refresh}>
        {suggestion ? (
          <div className="space-y-6">
            <EntityHeader
              eyebrow="Case suggestion"
              title={suggestion.suggestion_type}
              description={
                <span>
                  {shortId(suggestion.suggestion_id)} · event {formatDateTime(suggestion.event_ts)}
                </span>
              }
              organizationId={suggestion.organization_id}
              siteId={suggestion.site_id}
              badges={
                <>
                  <StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />
                  <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                    Evidence {suggestion.evidence_count}
                  </span>
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
                <EvidenceWorkspace payload={suggestion.payload} sourceEventId={suggestion.source_event_id} title="Suggestion evidence workspace" />
                <RelatedLinksPanel
                  links={[
                    relatedCaseId
                      ? { label: "Related case", value: shortId(relatedCaseId), to: navigation.caseHref(relatedCaseId), tone: "case" }
                      : null,
                    suggestion.source_event_id
                      ? { label: "Timeline event", value: shortId(suggestion.source_event_id), to: navigation.timelineEventHref(suggestion.source_event_id), tone: "timeline" }
                      : null,
                  ]}
                />
              </div>

              <div className="space-y-4">
                <InvestigationContextPanel
                  subjectId={suggestion.subject_id}
                  trackId={suggestion.track_id}
                  cameraId={suggestion.camera_id}
                  eventTs={suggestion.event_ts}
                  organizationId={suggestion.organization_id}
                  siteId={suggestion.site_id}
                />
                <SuggestionDetailPanel suggestion={suggestion} returnTo={navigation.returnTo} onChanged={refresh} />
                <Link className="btn w-full justify-center" to={navigation.withReturnTo(navigation.suggestionQueueHref(suggestion.suggestion_id))}>
                  Open in suggestion queue
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </DataState>
    </div>
  );
}
