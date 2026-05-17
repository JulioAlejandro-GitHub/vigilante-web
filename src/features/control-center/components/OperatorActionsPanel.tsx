import { AlertTriangle, CheckCircle2, ExternalLink, Flag, GitMerge, Link as LinkIcon, Lock, RotateCcw, Search, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Feedback } from "../../../components/Feedback";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import type { CaseDetail, TimelineEvent } from "../../../types/api";
import type { PermissionResourceContext } from "../../../types/session";
import type { OperatorActionDefinition } from "../types/controlCenter.types";
import { useOperatorActions } from "../hooks/useOperatorActions";

interface OperatorActionsPanelProps {
  caseDetail: CaseDetail | null;
  selectedEvent: TimelineEvent;
  resourceContext?: PermissionResourceContext;
  onChanged: () => void;
}

export function OperatorActionsPanel({ caseDetail, selectedEvent, resourceContext, onChanged }: OperatorActionsPanelProps) {
  const { check } = useCurrentUser();
  const caseId = caseDetail?.case_id ?? selectedEvent.case_id;
  const { actions, busy, error, success, run, clearFeedback } = useOperatorActions({ caseId, resourceContext, onChanged });
  const [pendingAction, setPendingAction] = useState<OperatorActionDefinition | null>(null);
  const [reason, setReason] = useState("Decisión tomada desde Centro de Control");
  const reviewId = pendingReviewId(caseDetail, selectedEvent);
  const orderedActions = actionOrder(actions);

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
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Acciones del operador</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Rutas claras para decidir, revisar o profundizar el caso activo.</p>
        </div>
        <span className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">acción inmediata</span>
      </div>

      <div className="mt-3">
        <Feedback error={error} success={success} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {orderedActions.map((action) => {
          const disabledReason = actionDisabled(action);
          const Icon = actionIcon(action.key);
          return (
            <button
              key={action.key}
              type="button"
              className={`btn w-full ${action.tone === "primary" ? "btn-primary" : action.tone === "danger" ? "btn-danger" : ""}`}
              disabled={Boolean(disabledReason) || busy !== null}
              title={disabledReason ?? undefined}
              onClick={() => open(action)}
            >
              {disabledReason ? <Lock className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
              {busy === action.key ? "Procesando..." : action.label}
            </button>
          );
        })}

        {reviewId ? (
          <Link className="btn w-full" to={`/manual-reviews/${reviewId}`}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Abrir revisión
          </Link>
        ) : (
          <button className="btn w-full" type="button" disabled title="No hay revisión manual vinculada al evento activo.">
            <Lock className="h-4 w-4" aria-hidden="true" />
            Abrir revisión
          </button>
        )}

        {caseId ? (
          <Link className="btn w-full" to={`/cases/${caseId}`}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            Ver detalle completo
          </Link>
        ) : (
          <button className="btn w-full" type="button" disabled title="El evento activo no tiene caso asociado.">
            <Lock className="h-4 w-4" aria-hidden="true" />
            Ver detalle completo
          </button>
        )}
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

function actionOrder(actions: OperatorActionDefinition[]) {
  const order: OperatorActionDefinition["key"][] = ["link_profile", "flag_suspicious", "merge_case", "resolve_benign", "close_case", "reopen_case"];
  return [...actions].sort((left, right) => order.indexOf(left.key) - order.indexOf(right.key));
}

function actionIcon(key: OperatorActionDefinition["key"]) {
  if (key === "flag_suspicious") return Flag;
  if (key === "resolve_benign") return CheckCircle2;
  if (key === "close_case") return XCircle;
  if (key === "reopen_case") return RotateCcw;
  if (key === "link_profile") return LinkIcon;
  if (key === "merge_case") return GitMerge;
  return Send;
}

function pendingReviewId(caseDetail: CaseDetail | null, selectedEvent: TimelineEvent) {
  const linkedReview = caseDetail?.reviews?.find((review) => review.status !== "resolved") ?? caseDetail?.reviews?.[0];
  if (linkedReview) {
    return linkedReview.review_id;
  }
  const reviewId = selectedEvent.payload?.review_id;
  return typeof reviewId === "string" && reviewId.trim() ? reviewId : null;
}
