import { Activity, ClipboardList, FileText, MessageSquare, RefreshCw, Search, ShieldCheck } from "lucide-react";
import { useSearchParams, useParams } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { CaseActionsPanel } from "../components/cases/CaseActionsPanel";
import { CaseHeader } from "../components/cases/CaseHeader";
import { CaseSummaryPanel } from "../components/cases/CaseSummaryPanel";
import { CaseTabId, CaseTabs } from "../components/cases/CaseTabs";
import { OwnershipHistoryPreview } from "../components/cases/OwnershipHistoryPreview";
import { RelatedEntitiesPanel } from "../components/cases/RelatedEntitiesPanel";
import { DataState, EmptyState } from "../components/DataState";
import { EvidenceWorkspace } from "../components/evidence/EvidenceWorkspace";
import { ContextualBackLink } from "../components/navigation/ContextualBackLink";
import { Breadcrumbs } from "../components/navigation/Breadcrumbs";
import { PageHeader } from "../components/PageHeader";
import { ReviewLinkCard } from "../components/reviews/ReviewLinkCard";
import { SuggestionLinkCard } from "../components/suggestions/SuggestionLinkCard";
import { TimelineList } from "../components/TimelineList";
import { useAsyncData } from "../hooks/useAsyncData";
import { useNavigationContext } from "../hooks/useNavigationContext";
import type { CaseDetail, CaseNote, CaseSuggestion, ManualReview, TimelineEvent } from "../types/api";
import { formatDateTime } from "../utils/format";

interface DetailBundle {
  detail: CaseDetail;
  timeline: TimelineEvent[];
  notes: CaseNote[];
  reviews: ManualReview[];
  suggestions: CaseSuggestion[];
}

const VALID_TABS: CaseTabId[] = ["overview", "timeline", "notes", "reviews", "suggestions", "evidence"];

function normalizeTab(value: string | null): CaseTabId {
  return VALID_TABS.includes(value as CaseTabId) ? (value as CaseTabId) : "overview";
}

export function CaseDetailPage() {
  const { caseId = "" } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigationContext("/cases");
  const activeTab = normalizeTab(searchParams.get("tab"));
  const { data, loading, error, refresh } = useAsyncData<DetailBundle>(
    async () => {
      const [detail, timeline, notes, reviews, suggestions] = await Promise.all([
        api.getCase(caseId),
        api.getCaseTimeline(caseId),
        api.getCaseNotes(caseId),
        api.getCaseReviews(caseId),
        api.getCaseSuggestions(caseId),
      ]);
      return { detail, timeline, notes, reviews, suggestions };
    },
    [caseId],
  );

  function setActiveTab(tab: CaseTabId) {
    const next = new URLSearchParams(searchParams);
    if (tab === "overview") {
      next.delete("tab");
    } else {
      next.set("tab", tab);
    }
    setSearchParams(next);
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "Results", to: navigation.returnTo }, { label: data?.detail.case_code ?? "Case detail" }]} />
      <PageHeader
        title={data?.detail.title ?? "Case detail"}
        description={caseId}
        actions={
          <>
            <ContextualBackLink to={navigation.returnTo} label="Back to results" />
            <button className="btn" type="button" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      />
      <DataState loading={loading} error={error} onRetry={refresh}>
        {data ? (
          <CaseDetailContent
            bundle={data}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onChanged={refresh}
            navigation={navigation}
          />
        ) : null}
      </DataState>
    </div>
  );
}

function CaseDetailContent({
  bundle,
  activeTab,
  onTabChange,
  onChanged,
  navigation,
}: {
  bundle: DetailBundle;
  activeTab: CaseTabId;
  onTabChange: (tab: CaseTabId) => void;
  onChanged: () => void;
  navigation: ReturnType<typeof useNavigationContext>;
}) {
  const { detail, notes, reviews, suggestions, timeline } = bundle;
  const reviewHref = (reviewId: string) => navigation.withReturnTo(navigation.reviewHref(reviewId));
  const suggestionHref = (suggestionId: string) => navigation.withReturnTo(navigation.suggestionHref(suggestionId));

  return (
    <div className="space-y-6">
      <CaseHeader detail={detail} />
      <CaseTabs
        activeTab={activeTab}
        onChange={onTabChange}
        tabs={[
          { id: "overview", label: "Overview", icon: <ShieldCheck className="h-4 w-4" /> },
          { id: "timeline", label: "Timeline", count: timeline.length, icon: <Activity className="h-4 w-4" /> },
          { id: "notes", label: "Notes", count: notes.length, icon: <MessageSquare className="h-4 w-4" /> },
          { id: "reviews", label: "Reviews", count: reviews.length, icon: <ClipboardList className="h-4 w-4" /> },
          { id: "suggestions", label: "Suggestions", count: suggestions.length, icon: <Search className="h-4 w-4" /> },
          { id: "evidence", label: "Evidence", icon: <FileText className="h-4 w-4" /> },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          {activeTab === "overview" ? (
            <>
              <CaseSummaryPanel detail={detail} />
              <OwnershipHistoryPreview timeline={timeline} currentOwner={detail.assigned_to} />
              <RelatedEntitiesPanel reviews={reviews} suggestions={suggestions} reviewHref={reviewHref} suggestionHref={suggestionHref} />
              <section>
                <SectionHeader title="Recent timeline" count={timeline.length} />
                <TimelineList items={timeline.slice(0, 5)} />
              </section>
            </>
          ) : null}

          {activeTab === "timeline" ? (
            <section>
              <SectionHeader title="Case timeline" count={timeline.length} />
              <TimelineList items={timeline} />
            </section>
          ) : null}

          {activeTab === "notes" ? <NotesSection notes={notes} /> : null}

          {activeTab === "reviews" ? (
            <section>
              <SectionHeader title="Related reviews" count={reviews.length} />
              <div className="grid gap-3 lg:grid-cols-2">
                {reviews.length === 0 ? <EmptyState label="No related reviews." /> : null}
                {reviews.map((review) => (
                  <ReviewLinkCard key={review.review_id} review={review} to={reviewHref(review.review_id)} />
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "suggestions" ? (
            <section>
              <SectionHeader title="Related suggestions" count={suggestions.length} />
              <div className="grid gap-3 lg:grid-cols-2">
                {suggestions.length === 0 ? <EmptyState label="No related suggestions." /> : null}
                {suggestions.map((suggestion) => (
                  <SuggestionLinkCard key={suggestion.suggestion_id} suggestion={suggestion} to={suggestionHref(suggestion.suggestion_id)} />
                ))}
              </div>
            </section>
          ) : null}

          {activeTab === "evidence" ? (
            <EvidenceWorkspace payload={detail.case_payload ?? {}} sourceEventId={detail.source_event_id} title="Case evidence and source context" />
          ) : null}
        </div>

        <CaseActionsPanel
          caseId={detail.case_id}
          status={detail.status}
          currentOwner={detail.assigned_to}
          assignedAt={detail.assigned_at}
          resourceContext={{ organization_id: detail.organization_id, site_id: detail.site_id }}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      {count !== undefined ? <span className="text-xs font-medium text-zinc-500">{count}</span> : null}
    </div>
  );
}

function NotesSection({ notes }: { notes: CaseNote[] }) {
  return (
    <section>
      <SectionHeader title="Notes" count={notes.length} />
      <div className="space-y-3">
        {notes.length === 0 ? <EmptyState label="No notes yet." /> : null}
        {notes.map((note) => (
          <article key={note.note_id} className="panel p-4">
            <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
              <span className="font-medium text-zinc-700">{note.author}</span>
              <span>{formatDateTime(note.created_at)}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-900">{note.note_text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
