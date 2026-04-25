import { ArrowLeft, RefreshCw } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { api } from "../api/vigilanteApi";
import { DataState, EmptyState } from "../components/DataState";
import { Feedback } from "../components/Feedback";
import { FormField } from "../components/forms/FormField";
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
      <section className="panel p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge value={detail.status} tone={statusTone(detail.status)} />
              <StatusBadge value={detail.severity} tone={statusTone(detail.severity)} />
              <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">Priority {detail.priority}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-zinc-950">{detail.title}</h2>
            <div className="mt-1 text-sm text-zinc-500">{detail.case_code}</div>
          </div>
          <div className="grid gap-3 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm sm:grid-cols-3 lg:min-w-[420px]">
            <KeyValue label="Owner" value={detail.assigned_to ?? "Unassigned"} />
            <KeyValue label="Assigned at" value={formatDateTime(detail.assigned_at)} />
            <KeyValue label="Updated" value={formatDateTime(detail.updated_at)} />
          </div>
        </div>
        <div className="mt-5 grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <KeyValue label="Type" value={detail.case_type} />
          <KeyValue label="Opened" value={formatDateTime(detail.opened_at)} />
          <KeyValue label="Closed" value={formatDateTime(detail.closed_at)} />
          <KeyValue label="Source event" value={shortId(detail.source_event_id)} />
          <KeyValue label="Source suggestion" value={shortId(detail.source_suggestion_id)} />
          <KeyValue label="Primary subject" value={shortId(detail.primary_subject_id)} />
          <KeyValue label="Primary camera" value={shortId(detail.primary_camera_id)} />
          <KeyValue label="Organization" value={shortId(detail.organization_id)} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <NotesSection notes={notes} />
          <section>
            <SectionHeader title="Case timeline" count={timeline.length} />
            <TimelineList items={timeline.slice(0, 20)} />
          </section>
          <RelatedWork reviews={reviews} suggestions={suggestions} />
        </div>

        <CaseActions caseId={detail.case_id} status={detail.status} currentOwner={detail.assigned_to} onChanged={onChanged} />
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

function CaseActions({
  caseId,
  status,
  currentOwner,
  onChanged,
}: {
  caseId: string;
  status: string;
  currentOwner: string | null;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState(currentOwner ?? "julio");
  const [actor, setActor] = useState("julio");
  const [assignmentReason, setAssignmentReason] = useState("analyst taking ownership");
  const [lifecycleReason, setLifecycleReason] = useState("analyst operational update");
  const [targetStatus, setTargetStatus] = useState(status === "in_review" ? "open" : "in_review");
  const [note, setNote] = useState("");

  useEffect(() => {
    setAssignedTo(currentOwner ?? "julio");
  }, [currentOwner]);

  useEffect(() => {
    setTargetStatus(status === "in_review" ? "open" : "in_review");
  }, [status]);

  async function run(label: string, action: () => Promise<unknown>, after?: () => void) {
    if (busy) return;

    setBusy(label);
    setFormError(null);
    setError(null);
    setSuccess(null);
    try {
      await action();
      after?.();
      setSuccess(`${label} completed`);
      onChanged();
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  function requireFields(fields: Array<[string, string]>) {
    const missing = fields.filter(([, value]) => !value.trim()).map(([label]) => label);
    if (missing.length > 0) {
      setFormError(`${missing.join(", ")} required.`);
      return false;
    }
    return true;
  }

  function submitAssign(event: FormEvent) {
    event.preventDefault();
    if (!requireFields([["Assigned to", assignedTo], ["Actor", actor]])) return;
    void run("Assign", () =>
      api.assignCase(caseId, {
        assigned_to: assignedTo.trim(),
        assigned_by: actor.trim(),
        assignment_reason: assignmentReason.trim() || undefined,
      }),
    );
  }

  function submitStatus(event: FormEvent) {
    event.preventDefault();
    if (!requireFields([["Reason", lifecycleReason], ["Actor", actor]])) return;
    void run("Change status", () =>
      api.changeCaseStatus(caseId, { status: targetStatus, reason: lifecycleReason.trim(), changed_by: actor.trim() }),
    );
  }

  function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!requireFields([["Note", note], ["Author", actor]])) return;
    void run("Add note", () => api.addCaseNote(caseId, { author: actor.trim(), note_text: note.trim() }), () => setNote(""));
  }

  const actionDisabled = busy !== null;

  return (
    <aside className="panel p-4 xl:sticky xl:top-24 xl:self-start">
      <h2 className="text-base font-semibold text-zinc-950">Case actions</h2>
      <div className="mt-4">
        <Feedback error={formError ?? error} success={success} />
      </div>

      <form className="mt-4 space-y-3" onSubmit={submitAssign}>
        <div className="label">Assignment</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <FormField label="Assigned to">
            <input className="field" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="julio" />
          </FormField>
          <FormField label="Actor">
            <input className="field" value={actor} onChange={(event) => setActor(event.target.value)} placeholder="julio" />
          </FormField>
        </div>
        <FormField label="Reason">
          <input
            className="field"
            value={assignmentReason}
            onChange={(event) => setAssignmentReason(event.target.value)}
            placeholder="analyst taking ownership"
          />
        </FormField>
        <div className="grid gap-2 sm:grid-cols-2">
          <button className="btn btn-primary" type="submit" disabled={actionDisabled || !assignedTo.trim() || !actor.trim()}>
            {busy === "Assign" ? "Assigning..." : "Assign"}
          </button>
          <button
            className="btn"
            type="button"
            disabled={actionDisabled || !actor.trim()}
            onClick={() => {
              if (!requireFields([["Actor", actor]])) return;
              void run("Unassign", () =>
                api.unassignCase(caseId, { assigned_by: actor.trim(), assignment_reason: assignmentReason.trim() || undefined }),
              );
            }}
          >
            {busy === "Unassign" ? "Unassigning..." : "Unassign"}
          </button>
        </div>
      </form>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={submitStatus}>
        <div className="label">Lifecycle</div>
        <FormField label="Next status">
          <select className="field" value={targetStatus} onChange={(event) => setTargetStatus(event.target.value)}>
            <option value="open">open</option>
            <option value="in_review">in_review</option>
            <option value="resolved">resolved</option>
            <option value="closed">closed</option>
            <option value="reopened">reopened</option>
          </select>
        </FormField>
        <FormField label="Reason">
          <input
            className="field"
            value={lifecycleReason}
            onChange={(event) => setLifecycleReason(event.target.value)}
            placeholder="analyst operational update"
          />
        </FormField>
        <button className="btn btn-primary w-full" type="submit" disabled={actionDisabled || !lifecycleReason.trim() || !actor.trim()}>
          {busy === "Change status" ? "Changing..." : "Change status"}
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="btn btn-danger"
            type="button"
            disabled={actionDisabled || !lifecycleReason.trim() || !actor.trim()}
            onClick={() => {
              if (!requireFields([["Reason", lifecycleReason], ["Actor", actor]])) return;
              void run("Close", () => api.closeCase(caseId, { reason: lifecycleReason.trim(), changed_by: actor.trim() }));
            }}
          >
            {busy === "Close" ? "Closing..." : "Close"}
          </button>
          <button
            className="btn"
            type="button"
            disabled={actionDisabled || !lifecycleReason.trim() || !actor.trim()}
            onClick={() => {
              if (!requireFields([["Reason", lifecycleReason], ["Actor", actor]])) return;
              void run("Reopen", () => api.reopenCase(caseId, { reason: lifecycleReason.trim(), changed_by: actor.trim() }));
            }}
          >
            {busy === "Reopen" ? "Reopening..." : "Reopen"}
          </button>
        </div>
      </form>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={submitNote}>
        <div className="label">Note</div>
        <FormField label="Note text">
          <textarea className="field min-h-28 resize-y" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Analyst note" />
        </FormField>
        <button className="btn btn-primary w-full" type="submit" disabled={actionDisabled || !note.trim() || !actor.trim()}>
          {busy === "Add note" ? "Adding..." : "Add note"}
        </button>
      </form>
    </aside>
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
