import { RefreshCw } from "lucide-react";
import { FormEvent, useState } from "react";
import { useParams } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { Feedback } from "../components/Feedback";
import { KeyValue } from "../components/KeyValue";
import { PageHeader } from "../components/PageHeader";
import { StatusBadge, statusTone } from "../components/StatusBadge";
import { TimelineList } from "../components/TimelineList";
import { useAsyncData } from "../hooks/useAsyncData";
import type { CaseDetail, CaseNote, CaseSuggestion, ManualReview, TimelineEvent } from "../types/api";
import { asErrorMessage, formatDateTime, shortId } from "../utils/format";

interface DetailBundle {
  detail: CaseDetail;
  timeline: TimelineEvent[];
  notes: CaseNote[];
  reviews: ManualReview[];
  suggestions: CaseSuggestion[];
}

export function CaseDetailPage() {
  const { caseId = "" } = useParams();
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
      <PageHeader
        title={data?.detail.title ?? "Case detail"}
        description={caseId}
        actions={
          <button className="btn" type="button" onClick={refresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />
      <DataState loading={loading} error={error}>
        {data ? <CaseDetailContent bundle={data} onChanged={refresh} /> : null}
      </DataState>
    </div>
  );
}

function CaseDetailContent({ bundle, onChanged }: { bundle: DetailBundle; onChanged: () => void }) {
  const { detail, notes, reviews, suggestions, timeline } = bundle;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <section className="panel p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KeyValue label="Code" value={detail.case_code} />
            <KeyValue label="Status" value={<StatusBadge value={detail.status} tone={statusTone(detail.status)} />} />
            <KeyValue label="Priority" value={detail.priority} />
            <KeyValue label="Severity" value={<StatusBadge value={detail.severity} tone={statusTone(detail.severity)} />} />
            <KeyValue label="Type" value={detail.case_type} />
            <KeyValue label="Owner" value={detail.assigned_to ?? "Unassigned"} />
            <KeyValue label="Opened" value={formatDateTime(detail.opened_at)} />
            <KeyValue label="Updated" value={formatDateTime(detail.updated_at)} />
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-950">Notes</h2>
          <div className="space-y-3">
            {notes.length === 0 ? <EmptyState label="No notes yet." /> : null}
            {notes.map((note) => (
              <article key={note.note_id} className="panel p-4">
                <div className="flex flex-wrap justify-between gap-2 text-xs text-zinc-500">
                  <span>{note.author}</span>
                  <span>{formatDateTime(note.created_at)}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-900">{note.note_text}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold text-zinc-950">Timeline</h2>
          <TimelineList items={timeline.slice(0, 20)} />
        </section>
      </div>

      <aside className="space-y-6">
        <CaseActions caseId={detail.case_id} status={detail.status} onChanged={onChanged} />
        <RelatedPanel reviews={reviews} suggestions={suggestions} />
      </aside>
    </div>
  );
}

function CaseActions({ caseId, status, onChanged }: { caseId: string; status: string; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState("julio");
  const [actor, setActor] = useState("julio");
  const [reason, setReason] = useState("analyst taking ownership");
  const [targetStatus, setTargetStatus] = useState(status === "in_review" ? "open" : "in_review");
  const [note, setNote] = useState("");

  async function run(label: string, action: () => Promise<unknown>) {
    setBusy(label);
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

  function submitAssign(event: FormEvent) {
    event.preventDefault();
    void run("Assign", () => api.assignCase(caseId, { assigned_to: assignedTo, assigned_by: actor, assignment_reason: reason }));
  }

  function submitStatus(event: FormEvent) {
    event.preventDefault();
    void run("Change status", () => api.changeCaseStatus(caseId, { status: targetStatus, reason, changed_by: actor }));
  }

  function submitNote(event: FormEvent) {
    event.preventDefault();
    void run("Add note", async () => {
      await api.addCaseNote(caseId, { author: actor, note_text: note });
      setNote("");
    });
  }

  return (
    <section className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">Case actions</h2>
      <Feedback error={error} success={success} />

      <form className="mt-4 space-y-3" onSubmit={submitAssign}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <input className="field" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Assigned to" />
          <input className="field" value={actor} onChange={(e) => setActor(e.target.value)} placeholder="Actor" />
        </div>
        <input className="field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" type="submit" disabled={busy !== null}>
            Assign
          </button>
          <button
            className="btn"
            type="button"
            disabled={busy !== null}
            onClick={() => void run("Unassign", () => api.unassignCase(caseId, { assigned_by: actor, assignment_reason: reason }))}
          >
            Unassign
          </button>
        </div>
      </form>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={submitStatus}>
        <select className="field" value={targetStatus} onChange={(e) => setTargetStatus(e.target.value)}>
          <option value="open">open</option>
          <option value="in_review">in_review</option>
          <option value="resolved">resolved</option>
        </select>
        <button className="btn btn-primary" type="submit" disabled={busy !== null}>
          Change status
        </button>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-danger" type="button" disabled={busy !== null} onClick={() => void run("Close", () => api.closeCase(caseId, { reason, changed_by: actor }))}>
            Close
          </button>
          <button className="btn" type="button" disabled={busy !== null} onClick={() => void run("Reopen", () => api.reopenCase(caseId, { reason, changed_by: actor }))}>
            Reopen
          </button>
        </div>
      </form>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={submitNote}>
        <textarea className="field min-h-24" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Case note" />
        <button className="btn btn-primary" type="submit" disabled={busy !== null || !note.trim()}>
          Add note
        </button>
      </form>
    </section>
  );
}

function RelatedPanel({ reviews, suggestions }: { reviews: ManualReview[]; suggestions: CaseSuggestion[] }) {
  return (
    <section className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">Related work</h2>
      <div className="mt-4 space-y-4">
        <div>
          <h3 className="label">Reviews</h3>
          <div className="mt-2 space-y-2">
            {reviews.length === 0 ? <EmptyState label="No related reviews." /> : null}
            {reviews.map((review) => (
              <div key={review.review_id} className="rounded border border-zinc-200 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{review.review_type}</span>
                  <StatusBadge value={review.status} tone={statusTone(review.status)} />
                </div>
                <div className="mt-1 text-xs text-zinc-500">{shortId(review.review_id)}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="label">Suggestions</h3>
          <div className="mt-2 space-y-2">
            {suggestions.length === 0 ? <EmptyState label="No related suggestions." /> : null}
            {suggestions.map((suggestion) => (
              <div key={suggestion.suggestion_id} className="rounded border border-zinc-200 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{suggestion.suggestion_type}</span>
                  <StatusBadge value={suggestion.status} tone={statusTone(suggestion.status)} />
                </div>
                <div className="mt-1 text-xs text-zinc-500">{shortId(suggestion.suggestion_id)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
