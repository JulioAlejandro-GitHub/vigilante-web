import { FormEvent, useEffect, useState } from "react";

import { EvidenceSummary } from "../evidence/EvidenceSummary";
import { Feedback } from "../Feedback";
import { FormField } from "../forms/FormField";
import { KeyValue } from "../KeyValue";
import { QueueActionPanel } from "../queues/QueueActionPanel";
import { StatusBadge, statusTone } from "../StatusBadge";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { api } from "../../api/vigilanteApi";
import type { ManualReview } from "../../types/api";
import { asErrorMessage, formatDateTime, shortId } from "../../utils/format";

interface ReviewDetailPanelProps {
  review: ManualReview | null;
  onChanged: () => void;
}

export function ReviewDetailPanel({ review, onChanged }: ReviewDetailPanelProps) {
  const { currentUser, can } = useCurrentUser();
  const [decision, setDecision] = useState<"approved" | "rejected" | "needs_more_evidence">("approved");
  const [reason, setReason] = useState("confirmed by analyst");
  const [actor, setActor] = useState(currentUser.username);
  const [identityResolution, setIdentityResolution] = useState<"confirm_identity" | "discard_candidate" | "mark_unresolved" | "escalate">(
    "confirm_identity",
  );
  const [confirmedPerson, setConfirmedPerson] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    setError(null);
    setSuccess(null);
  }, [review?.review_id]);

  useEffect(() => {
    setActor(currentUser.username);
  }, [currentUser.username]);

  if (!review) {
    return <div className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">Select a manual review.</div>;
  }
  const currentReview = review;

  async function resolve(event: FormEvent) {
    event.preventDefault();
    if (busy || !can("queue:resolve")) return;

    const trimmedReason = reason.trim();
    const trimmedActor = actor.trim();
    if (!trimmedReason || !trimmedActor) {
      setFormError("Decision reason and resolved by are required.");
      return;
    }

    setBusy(true);
    setFormError(null);
    setError(null);
    setSuccess(null);
    try {
      await api.resolveManualReview(currentReview.review_id, {
        decision,
        decision_reason: trimmedReason,
        resolved_by: trimmedActor,
        ...(currentReview.review_type === "identity_conflict"
          ? {
              identity_resolution: identityResolution,
              confirmed_person_profile_id: confirmedPerson.trim() || undefined,
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
    <QueueActionPanel
      title="Review detail"
      subtitle={`${shortId(review.review_id)} · acting as ${currentUser.username}`}
      status={<StatusBadge value={review.status} tone={statusTone(review.status)} />}
    >
      <div className="grid gap-3">
        <KeyValue label="Type" value={review.review_type} />
        <KeyValue label="Subject" value={shortId(review.subject_id)} />
        <KeyValue label="Track" value={shortId(review.track_id)} />
        <KeyValue label="Camera" value={shortId(review.camera_id)} />
        <KeyValue label="Priority" value={review.priority} />
        <KeyValue label="Severity" value={<StatusBadge value={review.severity} tone={statusTone(review.severity)} />} />
        <KeyValue label="Organization" value={shortId(review.organization_id)} />
        <KeyValue label="Site" value={shortId(review.site_id)} />
        <KeyValue label="Event time" value={formatDateTime(review.event_ts)} />
        <KeyValue label="Reason" value={review.reason_summary} />
      </div>

      <div className="mt-5 border-t border-zinc-200 pt-4">
        <EvidenceSummary payload={review.payload} />
      </div>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={resolve}>
        <Feedback error={formError ?? error} success={success} />
        {!can("queue:resolve") ? (
          <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Role cannot resolve reviews in this mock session.</div>
        ) : null}
        <FormField label="Decision">
          <select className="field" value={decision} onChange={(event) => setDecision(event.target.value as typeof decision)}>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="needs_more_evidence">needs_more_evidence</option>
          </select>
        </FormField>
        <FormField label="Decision reason">
          <input className="field" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="confirmed by analyst" />
        </FormField>
        <FormField label="Resolved by">
          <input className="field" value={actor} onChange={(event) => setActor(event.target.value)} placeholder={currentUser.username} />
        </FormField>
        {review.review_type === "identity_conflict" ? (
          <>
            <FormField label="Identity resolution">
              <select className="field" value={identityResolution} onChange={(event) => setIdentityResolution(event.target.value as typeof identityResolution)}>
                <option value="confirm_identity">confirm_identity</option>
                <option value="discard_candidate">discard_candidate</option>
                <option value="mark_unresolved">mark_unresolved</option>
                <option value="escalate">escalate</option>
              </select>
            </FormField>
            <FormField label="Confirmed profile">
              <input className="field" value={confirmedPerson} onChange={(event) => setConfirmedPerson(event.target.value)} placeholder="person_profile_id" />
            </FormField>
          </>
        ) : null}
        <button className="btn btn-primary w-full" type="submit" disabled={busy || !reason.trim() || !actor.trim() || !can("queue:resolve")}>
          {busy ? "Resolving..." : "Resolve review"}
        </button>
      </form>
    </QueueActionPanel>
  );
}
