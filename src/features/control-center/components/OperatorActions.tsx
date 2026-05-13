import { AlertTriangle, Lock, Send } from "lucide-react";
import { useState } from "react";

import { Feedback } from "../../../components/Feedback";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import type { PermissionResourceContext } from "../../../types/session";
import type { OperatorActionDefinition } from "../types/controlCenter.types";
import { useOperatorActions } from "../hooks/useOperatorActions";

interface OperatorActionsProps {
  caseId: string | null;
  resourceContext?: PermissionResourceContext;
  onChanged: () => void;
}

export function OperatorActions({ caseId, resourceContext, onChanged }: OperatorActionsProps) {
  const { check } = useCurrentUser();
  const { actions, busy, error, success, run, clearFeedback } = useOperatorActions({ caseId, resourceContext, onChanged });
  const [pendingAction, setPendingAction] = useState<OperatorActionDefinition | null>(null);
  const [reason, setReason] = useState("Control Center operator decision");

  function actionDisabled(action: OperatorActionDefinition) {
    if (!caseId) return "Seleccione un caso para operar.";
    if (action.disabledReason) return action.disabledReason;
    if (!action.permission) return null;
    const result = check(action.permission, resourceContext);
    return result.allowed ? null : result.reason ?? "Acción no autorizada.";
  }

  function open(action: OperatorActionDefinition) {
    clearFeedback();
    const disabledReason = actionDisabled(action);
    if (disabledReason) {
      return;
    }
    setPendingAction(action);
  }

  async function confirm() {
    if (!pendingAction) {
      return;
    }
    await run(pendingAction, reason);
    setPendingAction(null);
  }

  return (
    <section className="rounded border border-zinc-200 bg-white p-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-950">Acciones del operador</h3>
        <p className="mt-0.5 text-xs text-zinc-500">Acciones críticas con confirmación y auditoría vía timeline del backend.</p>
      </div>
      <div className="mt-3">
        <Feedback error={error} success={success} />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {actions.map((action) => {
          const disabledReason = actionDisabled(action);
          return (
            <button
              key={action.key}
              type="button"
              className={`btn w-full ${action.tone === "primary" ? "btn-primary" : action.tone === "danger" ? "btn-danger" : ""}`}
              disabled={Boolean(disabledReason) || busy !== null}
              title={disabledReason ?? undefined}
              onClick={() => open(action)}
            >
              {disabledReason ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
              {busy === action.key ? "Procesando..." : action.label}
            </button>
          );
        })}
      </div>

      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded border border-zinc-200 bg-white p-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded bg-amber-50 p-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-semibold text-zinc-950">Confirmar acción crítica</h4>
                <p className="mt-1 text-sm text-zinc-600">{pendingAction.label} sobre el caso seleccionado.</p>
              </div>
            </div>
            <label className="mt-4 block text-sm font-medium text-zinc-700" htmlFor="operator-action-reason">
              Razón operativa
            </label>
            <textarea
              id="operator-action-reason"
              className="field mt-1 min-h-24"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn" type="button" onClick={() => setPendingAction(null)} disabled={busy !== null}>
                Cancelar
              </button>
              <button className={`btn ${pendingAction.tone === "danger" ? "btn-danger" : "btn-primary"}`} type="button" onClick={confirm} disabled={busy !== null || !reason.trim()}>
                {busy === pendingAction.key ? "Procesando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
