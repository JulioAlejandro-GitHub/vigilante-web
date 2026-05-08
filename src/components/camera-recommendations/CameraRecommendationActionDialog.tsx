import { AlertTriangle, CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { Feedback } from "../Feedback";
import { FormField } from "../forms/FormField";
import type { CameraRecommendation } from "../../types/api";
import type { CameraRecommendationAction } from "../../hooks/useCameraRecommendationActions";
import { cameraRecommendationActionLabel } from "../../hooks/useCameraRecommendationActions";
import { shortId } from "../../utils/format";

interface CameraRecommendationActionDialogProps {
  action: CameraRecommendationAction | null;
  recommendation: CameraRecommendation;
  busy: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: (comment: string) => void;
}

const actionCopy: Record<CameraRecommendationAction, { title: string; description: string; confirm: string; danger?: boolean }> = {
  approve: {
    title: "Approve recommendation",
    description: "This records human approval. The camera metadata is not changed until apply runs.",
    confirm: "Confirm approve",
  },
  reject: {
    title: "Reject recommendation",
    description: "This records the recommendation as rejected and leaves camera metadata unchanged.",
    confirm: "Confirm reject",
    danger: true,
  },
  apply: {
    title: "Apply approved recommendation",
    description: "This will ask the API to patch the camera recognition metadata using the approved workflow state.",
    confirm: "Confirm apply",
  },
  rollback: {
    title: "Rollback applied recommendation",
    description: "This will ask the API to restore metadata from the audited apply payload.",
    confirm: "Confirm rollback",
    danger: true,
  },
};

function ActionIcon({ action }: { action: CameraRecommendationAction }) {
  if (action === "reject") return <XCircle className="h-5 w-5 text-rose-700" aria-hidden="true" />;
  if (action === "rollback") return <RotateCcw className="h-5 w-5 text-rose-700" aria-hidden="true" />;
  if (action === "apply") return <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden="true" />;
  return <CheckCircle2 className="h-5 w-5 text-teal-700" aria-hidden="true" />;
}

export function CameraRecommendationActionDialog({
  action,
  recommendation,
  busy,
  error,
  onCancel,
  onConfirm,
}: CameraRecommendationActionDialogProps) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    setComment("");
  }, [action, recommendation.recommendation_id]);

  if (!action) {
    return null;
  }

  const copy = actionCopy[action];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/40 p-4 sm:items-center" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded border border-zinc-200 bg-white shadow-xl">
        <div className="flex items-start gap-3 border-b border-zinc-200 p-4">
          <ActionIcon action={action} />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-zinc-950">{copy.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{copy.description}</p>
            <p className="mt-2 text-xs text-zinc-500">
              {shortId(recommendation.recommendation_id)} for camera {shortId(recommendation.camera_id)}
            </p>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <Feedback error={error} />
          <FormField label="Comment optional">
            <textarea
              className="field min-h-24"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={`${cameraRecommendationActionLabel(action)} comment`}
            />
          </FormField>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 p-4 sm:flex-row sm:justify-end">
          <button className="btn" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            className={`btn ${copy.danger ? "btn-danger" : "btn-primary"}`}
            type="button"
            onClick={() => onConfirm(comment)}
            disabled={busy}
          >
            {busy ? "Working..." : copy.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
