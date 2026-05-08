import { useMemo } from "react";

import { api } from "../api/vigilanteApi";
import { useAsyncData } from "./useAsyncData";
import type { CameraRecommendation, CameraRecommendationListParams } from "../types/api";

const RECOMMENDATION_FETCH_LIMIT = 1000;

export interface UseCameraRecommendationsFilters {
  status?: string;
  camera_id?: string;
  actionable?: boolean;
}

export function useCameraRecommendations(filters: UseCameraRecommendationsFilters) {
  const apiFilters = useMemo<CameraRecommendationListParams>(
    () => ({
      status: filters.status,
      camera_id: filters.camera_id,
      actionable: filters.actionable,
      limit: RECOMMENDATION_FETCH_LIMIT,
      offset: 0,
    }),
    [filters.actionable, filters.camera_id, filters.status],
  );

  return useAsyncData<CameraRecommendation[]>(() => api.listCameraRecommendations(apiFilters), [JSON.stringify(apiFilters)]);
}
