import { useCallback, useState } from "react";

import { api } from "../api/vigilanteApi";
import type { CameraRecommendation } from "../types/api";
import { asErrorMessage } from "../utils/format";

export type CameraRecommendationAction = "approve" | "reject" | "apply" | "rollback";

interface ActionOptions {
  comment?: string;
}

export function cameraRecommendationActionLabel(action: CameraRecommendationAction) {
  if (action === "approve") return "Approve";
  if (action === "reject") return "Reject";
  if (action === "apply") return "Apply";
  return "Rollback";
}

export function useCameraRecommendationActions() {
  const [busyAction, setBusyAction] = useState<CameraRecommendationAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const runAction = useCallback(async (
    recommendationId: string,
    action: CameraRecommendationAction,
    options: ActionOptions = {},
  ): Promise<CameraRecommendation> => {
    if (busyAction) {
      throw new Error("Another recommendation action is already running.");
    }

    setBusyAction(action);
    setError(null);
    setSuccess(null);
    const payload = options.comment?.trim() ? { comment: options.comment.trim() } : {};

    try {
      const result =
        action === "approve"
          ? await api.approveCameraRecommendation(recommendationId, payload)
          : action === "reject"
            ? await api.rejectCameraRecommendation(recommendationId, payload)
            : action === "apply"
              ? (await api.applyCameraRecommendation(recommendationId, payload)).recommendation
              : (await api.rollbackCameraRecommendation(recommendationId, payload)).recommendation;

      setSuccess(`${cameraRecommendationActionLabel(action)} completed.`);
      return result;
    } catch (caught) {
      const message = asErrorMessage(caught);
      setError(message);
      throw caught;
    } finally {
      setBusyAction(null);
    }
  }, [busyAction]);

  const resetFeedback = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return { busyAction, error, success, runAction, resetFeedback };
}
