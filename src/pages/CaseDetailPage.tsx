import { ArrowLeft, RefreshCw } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { CaseActionsPanel } from "../components/cases/CaseActionsPanel";
import { CaseHeader } from "../components/cases/CaseHeader";
import { DataState, EmptyState } from "../components/DataState";
import { Breadcrumbs } from "../components/navigation/Breadcrumbs";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { TimelineList } from "../components/TimelineList";
import { useAsyncData } from "../hooks/useAsyncData";
import type { CaseDetail, CaseNote, CaseSuggestion, ManualReview, TimelineEvent } from "../types/api";
import { formatDateTime, shortId } from "../utils/format";

interface DetailBundle {
  detail: CaseDetail;
  timeline: TimelineEvent[];
  notes: CaseNote[];
  reviews: ManualReview[];
  suggestions: CaseSuggestion[];
}

interface LocationState {
  returnTo?: string;
}

export function CaseDetailPage() {
  const { caseId = "" } = useParams();
  const location = useLocation();
  const returnTo = (location.state as LocationState | null)?.returnTo ?? "/cases";
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

  return (
    <div>
      <Breadcrumbs items={[{ label: "Results", to: returnTo }, { label: data?.detail.case_code ?? "Case detail" }]} />
      <PageHeader
        title={data?.detail.title ?? "Case detail"}
        description={caseId}
        actions={
          <>
            <Link className="btn" to={returnTo}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <button className="btn" type="button" onClick={refresh}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </>
        }
      />
      <DataState loading={loading} error={error} onRetry={refresh}>
        {data ? <CaseDetailContent bundle={data} onChanged={refresh} /> : null}
      </DataState>
    </div>
  );
}

function CaseDetailContent({ bundle, onChanged }: { bundle: DetailBundle; onChanged: () => void }) {
  const { detail, notes, reviews, suggestions, timeline } = bundle;

  return (
    <div className="space-y-6">
      <CaseHeader detail={detail} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <NotesSection notes={notes} />
          <section>
            <SectionHeader title="Case timeline" count={timeline.length} />
            <TimelineList items={timeline.slice(0, 20)} />
          </section>
          <RelatedWork reviews={reviews} suggestions={suggestions} />
        </div>

        <CaseActionsPanel
          caseId={detail.case_id}
          status={detail.status}
          currentOwner={detail.assigned_to}
          assignedAt={detail.assigned_at}
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

function RelatedWork({ reviews, suggestions }: { reviews: ManualReview[]; suggestions: CaseSuggestion[] }) {
  return (
    <section>
      <SectionHeader title="Related work" count={reviews.length + suggestions.length} />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h3 className="text-sm font-semibold text-zinc-950">Reviews</h3>
          <div className="mt-3 space-y-2">
            {reviews.length === 0 ? <EmptyState label="No related reviews." /> : null}
            {reviews.map((review) => (
              <div key={review.review_id} className="rounded border border-zinc-200 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{review.review_type}</span>
                  <StatusBadge value={review.status} tone={statusTone(review.status)} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                  <span>{shortId(review.review_id)}</span>
                  <span className="text-right">{formatDateTime(review.event_ts)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <h3 className="text-sm font-semibold text-zinc-950">Suggestions</h3>
          <div className="mt-3 space-y-2">
            {suggestions.length === 0 ? <EmptyState label="No related suggestions." /> : null}
            {suggestions.map((suggestion) => (
              <div key={suggestion.suggestion_id} className="rounded border border-zinc-200 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{suggestion.suggestion_type}</span>
                  <StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-500">
                  <span>{shortId(suggestion.suggestion_id)}</span>
                  <span className="text-right">{suggestion.evidence_count} evidence</span>
                </div>
                {suggestion.promoted_case_id ? (
                  <Link className="mt-2 block text-xs font-medium text-teal-800 underline-offset-2 hover:underline" to={`/cases/${suggestion.promoted_case_id}`}>
                    Promoted case {shortId(suggestion.promoted_case_id)}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
