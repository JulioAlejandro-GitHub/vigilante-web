import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../../api/vigilanteApi";
import { useCameraRecommendationActions } from "../../hooks/useCameraRecommendationActions";
import type { CameraRecommendationAction } from "../../hooks/useCameraRecommendationActions";
import { useAsyncData } from "../../hooks/useAsyncData";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import type { CameraRecommendation, CameraRecommendationPreviewResponse } from "../../types/api";
import { summarizeValue } from "../../utils/evidence";
import { formatDateTime, shortId } from "../../utils/format";
import { DataState } from "../DataState";
import { EvidenceSection } from "../evidence/EvidenceSection";
import { Feedback } from "../Feedback";
import { KeyValue } from "../KeyValue";
import { RoleAwareAction } from "../permissions/RoleAwareAction";
import { QueueActionPanel } from "../queues/QueueActionPanel";
import { StatusBadge } from "../StatusBadge";
import { CameraRecommendationActionDialog } from "./CameraRecommendationActionDialog";
import { CameraRecommendationPreview } from "./CameraRecommendationPreview";
import {
  CameraRecommendationFlagBadge,
  CameraRecommendationSeverityBadge,
  CameraRecommendationStatusBadge,
} from "./CameraRecommendationStatusBadge";
import { CameraRecommendationValueBlock } from "./CameraRecommendationValueBlock";

interface CameraRecommendationDetailProps {
  recommendation: CameraRecommendation | null;
  onChanged: () => void;
  onClose?: () => void;
}

function confidenceLabel(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${Math.round(value * 100)}%`;
}

function availableActions(recommendation: CameraRecommendation): CameraRecommendationAction[] {
  if (recommendation.status === "pending") return ["approve", "reject"];
  if (recommendation.status === "approved") return ["apply"];
  if (recommendation.status === "applied") return ["rollback"];
  return [];
}

function actionButtonTone(action: CameraRecommendationAction) {
  if (action === "reject" || action === "rollback") return "btn btn-danger w-full";
  if (action === "approve" || action === "apply") return "btn btn-primary w-full";
  return "btn w-full";
}

function actionButtonText(action: CameraRecommendationAction) {
  if (action === "approve") return "Approve";
  if (action === "reject") return "Reject";
  if (action === "apply") return "Apply";
  return "Rollback";
}

export function CameraRecommendationDetail({ recommendation, onChanged, onClose }: CameraRecommendationDetailProps) {
  const { currentUser } = useCurrentUser();
  const [dialogAction, setDialogAction] = useState<CameraRecommendationAction | null>(null);
  const recommendationId = recommendation?.recommendation_id ?? "";
  const {
    data: preview,
    loading: previewLoading,
    error: previewError,
    refresh: refreshPreview,
  } = useAsyncData<CameraRecommendationPreviewResponse | null>(
    () => (recommendationId ? api.previewCameraRecommendation(recommendationId) : Promise.resolve(null)),
    [recommendationId],
  );
  const { busyAction, error, success, runAction, resetFeedback } = useCameraRecommendationActions();

  useEffect(() => {
    setDialogAction(null);
    resetFeedback();
  }, [recommendationId, resetFeedback]);

  const actions = useMemo(() => (recommendation ? availableActions(recommendation) : []), [recommendation]);

  if (!recommendation) {
    return (
      <div className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
        Select a camera recommendation.
      </div>
    );
  }

  async function confirmAction(comment: string) {
    if (!dialogAction || !recommendation) return;

    try {
      await runAction(recommendation.recommendation_id, dialogAction, { comment });
      setDialogAction(null);
      onChanged();
      refreshPreview();
    } catch {
      onChanged();
      refreshPreview();
    }
  }

  return (
    <QueueActionPanel
      title="Recommendation detail"
      subtitle={`${shortId(recommendation.recommendation_id)} - acting as ${currentUser.username}`}
      status={<CameraRecommendationStatusBadge status={recommendation.status} />}
    >
      {onClose ? (
        <div className="mb-4 flex justify-end">
          <button className="btn px-2 py-1 text-xs" type="button" onClick={onClose}>
            Close detail
          </button>
        </div>
      ) : null}

      <div className="space-y-5">
        <Feedback error={error ?? recommendation.last_error} success={success} />

        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">{recommendation.title || recommendation.recommendation_type}</h2>
            <p className="mt-2 text-sm text-zinc-700">{recommendation.reason || "No reason returned by API."}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CameraRecommendationSeverityBadge severity={recommendation.severity} />
            <CameraRecommendationFlagBadge label="actionable" active={recommendation.actionable} activeText="true" inactiveText="false" />
            <CameraRecommendationFlagBadge label="auto_apply" active={recommendation.auto_apply} activeText="true" inactiveText="false" />
            <StatusBadge value={recommendation.applicable ? "applicable" : "not applicable"} tone={recommendation.applicable ? "success" : "warning"} />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <KeyValue label="Camera" value={recommendation.camera_id} />
          <KeyValue label="Type" value={recommendation.recommendation_type} />
          <KeyValue label="Generated" value={formatDateTime(recommendation.generated_at)} />
          <KeyValue label="Confidence" value={confidenceLabel(recommendation.confidence)} />
          <KeyValue label="Rule set" value={recommendation.rule_set_version || "-"} />
          <KeyValue label="Source status" value={recommendation.source_status || "-"} />
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div>
            <div className="label">Current value</div>
            <div className="mt-1 text-sm text-zinc-900">
              <CameraRecommendationValueBlock value={recommendation.current_value} />
            </div>
          </div>
          <div>
            <div className="label">Suggested value</div>
            <div className="mt-1 text-sm text-zinc-900">
              <CameraRecommendationValueBlock value={recommendation.suggested_value} />
            </div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="label">Recognition metadata paths</div>
          {recommendation.metadata_paths.length > 0 ? (
            <div className="space-y-2">
              {recommendation.metadata_paths.map((path) => (
                <div key={path} className="break-all rounded border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800">
                  {path}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-600">No metadata path inferred by API.</p>
          )}
        </section>

        <section>
          <EvidenceSection payload={recommendation.evidence} title="Recommendation evidence" compact showMediaSlot={false} />
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <div>
            <div className="label">Metrics used</div>
            <div className="mt-1 text-sm text-zinc-900">
              {recommendation.metrics_used.length > 0 ? recommendation.metrics_used.join(", ") : "-"}
            </div>
          </div>
          <div>
            <div className="label">Window summary</div>
            <div className="mt-1 text-sm text-zinc-900">
              <CameraRecommendationValueBlock value={recommendation.window_summary} compact />
            </div>
          </div>
        </section>

        <section className="space-y-3 border-t border-zinc-200 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-950">Workflow actions</h3>
            <button className="btn px-2 py-1 text-xs" type="button" onClick={refreshPreview}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh preview
            </button>
          </div>
          {actions.length === 0 ? (
            <p className="rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
              No workflow action is available for status {recommendation.status}.
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {actions.map((action) => (
                <RoleAwareAction key={action} permission="camera-recommendation:operate">
                  {({ disabled, reason }) => (
                    <button
                      className={actionButtonTone(action)}
                      type="button"
                      disabled={busyAction !== null || disabled}
                      title={reason ?? undefined}
                      onClick={() => {
                        resetFeedback();
                        setDialogAction(action);
                      }}
                    >
                      {actionButtonText(action)}
                    </button>
                  )}
                </RoleAwareAction>
              ))}
            </div>
          )}
        </section>

        <DataState loading={previewLoading} error={previewError} onRetry={refreshPreview}>
          <CameraRecommendationPreview preview={preview} />
        </DataState>

        <CameraRecommendationAuditTrail recommendation={recommendation} />
      </div>

      <CameraRecommendationActionDialog
        action={dialogAction}
        recommendation={recommendation}
        busy={busyAction !== null}
        error={error}
        onCancel={() => setDialogAction(null)}
        onConfirm={(comment) => void confirmAction(comment)}
      />
    </QueueActionPanel>
  );
}

function CameraRecommendationAuditTrail({ recommendation }: { recommendation: CameraRecommendation }) {
  const workflow = recommendation.workflow || {};
  const hasWorkflow = Boolean(workflow.last_event_type || workflow.occurred_at || workflow.actor || workflow.comment);
  const resultSummary = workflow.result && Object.keys(workflow.result).length > 0 ? summarizeValue(workflow.result) : "-";

  return (
    <section className="rounded border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Audit</h3>
          <p className="mt-1 text-xs text-zinc-500">Basic workflow state from the API recommendation payload.</p>
        </div>
        <Link
          className="shrink-0 text-xs font-medium text-teal-800 underline-offset-2 hover:underline"
          to={`/timeline?camera_id=${encodeURIComponent(recommendation.camera_id)}`}
        >
          Camera timeline
        </Link>
      </div>
      {hasWorkflow ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <KeyValue label="Last event" value={workflow.last_event_type || "-"} />
          <KeyValue label="Actor" value={workflow.actor || workflow.actor_user_id || "-"} />
          <KeyValue label="Timestamp" value={formatDateTime(workflow.occurred_at)} />
          <KeyValue label="Comment" value={workflow.comment || "-"} />
          <KeyValue label="Event ID" value={shortId(workflow.last_event_id)} />
          <KeyValue label="Result" value={resultSummary} />
        </div>
      ) : (
        <p className="mt-3 text-sm text-zinc-600">No workflow event has been recorded for this recommendation yet.</p>
      )}
    </section>
  );
}
