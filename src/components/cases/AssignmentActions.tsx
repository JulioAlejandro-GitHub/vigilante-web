import { FormEvent, useEffect, useState } from "react";

import { api } from "../../api/vigilanteApi";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import type { PermissionResourceContext } from "../../types/session";
import { asErrorMessage } from "../../utils/format";
import { Feedback } from "../Feedback";
import { FormField } from "../forms/FormField";
import { OwnerBadge } from "../ownership/OwnerBadge";
import { RoleAwareAction } from "../permissions/RoleAwareAction";

interface AssignmentActionsProps {
  caseId: string;
  currentOwner: string | null;
  assignedAt?: string | null;
  resourceContext?: PermissionResourceContext;
  onChanged: () => void;
}

export function AssignmentActions({ caseId, currentOwner, assignedAt, resourceContext, onChanged }: AssignmentActionsProps) {
  const { currentUser } = useCurrentUser();
  const [busy, setBusy] = useState<string | null>(null);
  const [targetOwner, setTargetOwner] = useState(currentOwner ?? currentUser.username);
  const [reason, setReason] = useState("operational ownership update");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const isMine = currentOwner === currentUser.username;

  useEffect(() => {
    setTargetOwner(currentOwner ?? currentUser.username);
  }, [currentOwner, currentUser.username]);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [caseId, currentOwner]);

  async function run(label: string, action: () => Promise<unknown>) {
    if (busy) return;

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

  function assignToMe() {
    void run("Assign to me", () =>
      api.assignCase(caseId, {
        assigned_to: currentUser.username,
        assigned_by: currentUser.username,
        assignment_reason: "analyst taking ownership",
      }),
    );
  }

  function unassign() {
    void run("Unassign", () =>
      api.unassignCase(caseId, {
        assigned_by: currentUser.username,
        assignment_reason: reason.trim() || "returning to unassigned queue",
      }),
    );
  }

  function reassign(event: FormEvent) {
    event.preventDefault();
    const nextOwner = targetOwner.trim();
    if (!nextOwner) {
      setError("Assigned to is required.");
      return;
    }

    void run("Reassign", () =>
      api.assignCase(caseId, {
        assigned_to: nextOwner,
        assigned_by: currentUser.username,
        assignment_reason: reason.trim() || undefined,
      }),
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label">Ownership</div>
          <div className="mt-1 text-sm text-zinc-600">Current owner and handoff controls.</div>
        </div>
        <OwnerBadge assignedTo={currentOwner} assignedAt={assignedAt} />
      </div>

      <Feedback error={error} success={success} />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        <RoleAwareAction permission="case:assign" resourceContext={resourceContext}>
          {({ disabled, reason: unavailableReason }) => (
            <button
              className="btn btn-primary w-full"
              type="button"
              disabled={busy !== null || disabled || isMine}
              onClick={assignToMe}
              title={unavailableReason ?? undefined}
            >
              {busy === "Assign to me" ? "Assigning..." : isMine ? "Assigned to me" : "Assign to me"}
            </button>
          )}
        </RoleAwareAction>
        <RoleAwareAction permission="case:unassign" resourceContext={resourceContext}>
          {({ disabled, reason: unavailableReason }) => (
            <button
              className="btn w-full"
              type="button"
              disabled={busy !== null || disabled || !currentOwner}
              onClick={unassign}
              title={unavailableReason ?? undefined}
            >
              {busy === "Unassign" ? "Unassigning..." : "Unassign"}
            </button>
          )}
        </RoleAwareAction>
      </div>

      <form className="space-y-3 border-t border-zinc-200 pt-4" onSubmit={reassign}>
        <FormField label="Reassign to">
          <input className="field" value={targetOwner} onChange={(event) => setTargetOwner(event.target.value)} placeholder={currentUser.username} />
        </FormField>
        <FormField label="Reason">
          <input className="field" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="handoff reason" />
        </FormField>
        <RoleAwareAction permission="case:reassign" resourceContext={resourceContext}>
          {({ disabled, reason: unavailableReason }) => (
            <button
              className="btn btn-primary w-full"
              type="submit"
              disabled={busy !== null || disabled || !targetOwner.trim() || targetOwner.trim() === currentOwner}
              title={unavailableReason ?? undefined}
            >
              {busy === "Reassign" ? "Reassigning..." : "Reassign"}
            </button>
          )}
        </RoleAwareAction>
      </form>
    </section>
  );
}
