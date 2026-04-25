import { FormEvent, useEffect, useState } from "react";

import { Feedback } from "../Feedback";
import { FormField } from "../forms/FormField";
import { OwnerBadge } from "../ownership/OwnerBadge";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { api } from "../../api/vigilanteApi";
import { asErrorMessage } from "../../utils/format";

interface CaseActionsPanelProps {
  caseId: string;
  status: string;
  currentOwner: string | null;
  assignedAt?: string | null;
  onChanged: () => void;
}

export function CaseActionsPanel({ caseId, status, currentOwner, assignedAt, onChanged }: CaseActionsPanelProps) {
  const { currentUser } = useCurrentUser();
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignedTo, setAssignedTo] = useState(currentOwner ?? currentUser.username);
  const [actor, setActor] = useState(currentUser.username);
  const [assignmentReason, setAssignmentReason] = useState("analyst taking ownership");
  const [lifecycleReason, setLifecycleReason] = useState("analyst operational update");
  const [targetStatus, setTargetStatus] = useState(status === "in_review" ? "open" : "in_review");
  const [note, setNote] = useState("");

  useEffect(() => {
    setAssignedTo(currentOwner ?? currentUser.username);
  }, [currentOwner, currentUser.username]);

  useEffect(() => {
    setActor(currentUser.username);
  }, [currentUser.username]);

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

  function assignToMe() {
    void run("Assign to me", () =>
      api.assignCase(caseId, {
        assigned_to: currentUser.username,
        assigned_by: currentUser.username,
        assignment_reason: "analyst taking ownership",
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
  const isMine = currentOwner === currentUser.username;

  return (
    <aside className="panel p-4 xl:sticky xl:top-24 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Case actions</h2>
          <div className="mt-1 text-xs text-zinc-500">Acting as {currentUser.username}</div>
        </div>
        <OwnerBadge assignedTo={currentOwner} assignedAt={assignedAt} compact />
      </div>
      <div className="mt-4">
        <Feedback error={formError ?? error} success={success} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <button className="btn btn-primary" type="button" disabled={actionDisabled || isMine} onClick={assignToMe}>
          {busy === "Assign to me" ? "Assigning..." : isMine ? "Assigned to me" : "Assign to me"}
        </button>
        <button
          className="btn"
          type="button"
          disabled={actionDisabled || !currentOwner}
          onClick={() =>
            void run("Unassign", () =>
              api.unassignCase(caseId, { assigned_by: currentUser.username, assignment_reason: "returning to unassigned queue" }),
            )
          }
        >
          {busy === "Unassign" ? "Unassigning..." : "Unassign"}
        </button>
      </div>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={submitAssign}>
        <div className="label">Assignment</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <FormField label="Assigned to">
            <input className="field" value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder={currentUser.username} />
          </FormField>
          <FormField label="Actor">
            <input className="field" value={actor} onChange={(event) => setActor(event.target.value)} placeholder={currentUser.username} />
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
        <button className="btn btn-primary w-full" type="submit" disabled={actionDisabled || !assignedTo.trim() || !actor.trim()}>
          {busy === "Assign" ? "Assigning..." : "Assign / reassign"}
        </button>
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
