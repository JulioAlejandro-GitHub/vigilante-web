import { FormEvent, useEffect, useState } from "react";

import { AssignmentActions } from "./AssignmentActions";
import { Feedback } from "../Feedback";
import { FormField } from "../forms/FormField";
import { RoleAwareAction } from "../permissions/RoleAwareAction";
import { useCurrentUser } from "../../context/CurrentUserContext";
import { api } from "../../api/vigilanteApi";
import type { PermissionResourceContext } from "../../types/session";
import { asErrorMessage } from "../../utils/format";

interface CaseActionsPanelProps {
  caseId: string;
  status: string;
  currentOwner: string | null;
  assignedAt?: string | null;
  resourceContext?: PermissionResourceContext;
  onChanged: () => void;
}

export function CaseActionsPanel({ caseId, status, currentOwner, assignedAt, resourceContext, onChanged }: CaseActionsPanelProps) {
  const { currentUser, can } = useCurrentUser();
  const [busy, setBusy] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actor, setActor] = useState(currentUser.username);
  const [lifecycleReason, setLifecycleReason] = useState("analyst operational update");
  const [targetStatus, setTargetStatus] = useState(status === "in_review" ? "open" : "in_review");
  const [note, setNote] = useState("");

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

  function submitStatus(event: FormEvent) {
    event.preventDefault();
    if (!can("case:status", resourceContext)) return;
    if (!requireFields([["Reason", lifecycleReason], ["Actor", actor]])) return;
    void run("Change status", () =>
      api.changeCaseStatus(caseId, { status: targetStatus, reason: lifecycleReason.trim(), changed_by: actor.trim() }),
    );
  }

  function submitNote(event: FormEvent) {
    event.preventDefault();
    if (!can("case:note", resourceContext)) return;
    if (!requireFields([["Note", note], ["Author", actor]])) return;
    void run("Add note", () => api.addCaseNote(caseId, { author: actor.trim(), note_text: note.trim() }), () => setNote(""));
  }

  const actionDisabled = busy !== null;

  return (
    <aside className="panel p-4 xl:sticky xl:top-24 xl:self-start">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950">Case actions</h2>
          <div className="mt-1 text-xs text-zinc-500">
            Acting as {currentUser.username} · {currentUser.role}
          </div>
        </div>
      </div>
      <div className="mt-4">
        <Feedback error={formError ?? error} success={success} />
      </div>

      <div className="mt-4">
        <AssignmentActions
          caseId={caseId}
          currentOwner={currentOwner}
          assignedAt={assignedAt}
          resourceContext={resourceContext}
          onChanged={onChanged}
        />
      </div>

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
        <RoleAwareAction permission="case:status" resourceContext={resourceContext}>
          {({ disabled, reason }) => (
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={actionDisabled || disabled || !lifecycleReason.trim() || !actor.trim()}
              title={reason ?? undefined}
            >
              {busy === "Change status" ? "Changing..." : "Change status"}
            </button>
          )}
        </RoleAwareAction>
        <div className="grid gap-2 sm:grid-cols-2">
          <RoleAwareAction permission="case:close" resourceContext={resourceContext}>
            {({ disabled, reason }) => (
              <button
                className="btn btn-danger w-full"
                type="button"
                disabled={actionDisabled || disabled || !lifecycleReason.trim() || !actor.trim()}
                title={reason ?? undefined}
                onClick={() => {
                  if (!can("case:close", resourceContext)) return;
                  if (!requireFields([["Reason", lifecycleReason], ["Actor", actor]])) return;
                  void run("Close", () => api.closeCase(caseId, { reason: lifecycleReason.trim(), changed_by: actor.trim() }));
                }}
              >
                {busy === "Close" ? "Closing..." : "Close"}
              </button>
            )}
          </RoleAwareAction>
          <RoleAwareAction permission="case:close" resourceContext={resourceContext}>
            {({ disabled, reason }) => (
              <button
                className="btn w-full"
                type="button"
                disabled={actionDisabled || disabled || !lifecycleReason.trim() || !actor.trim()}
                title={reason ?? undefined}
                onClick={() => {
                  if (!can("case:close", resourceContext)) return;
                  if (!requireFields([["Reason", lifecycleReason], ["Actor", actor]])) return;
                  void run("Reopen", () => api.reopenCase(caseId, { reason: lifecycleReason.trim(), changed_by: actor.trim() }));
                }}
              >
                {busy === "Reopen" ? "Reopening..." : "Reopen"}
              </button>
            )}
          </RoleAwareAction>
        </div>
      </form>

      <form className="mt-5 space-y-3 border-t border-zinc-200 pt-4" onSubmit={submitNote}>
        <div className="label">Note</div>
        <FormField label="Note text">
          <textarea className="field min-h-28 resize-y" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Analyst note" />
        </FormField>
        <RoleAwareAction permission="case:note" resourceContext={resourceContext}>
          {({ disabled, reason }) => (
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={actionDisabled || disabled || !note.trim() || !actor.trim()}
              title={reason ?? undefined}
            >
              {busy === "Add note" ? "Adding..." : "Add note"}
            </button>
          )}
        </RoleAwareAction>
      </form>
    </aside>
  );
}
