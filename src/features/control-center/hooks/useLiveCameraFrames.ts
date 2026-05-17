import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import type { ControlCenterCamera, ControlCenterLatestFrame } from "../types/controlCenter.types";
import { getCameraLiveBudget, shouldAcceptLatestFrame, splitCameraRefreshPlan } from "../utils/cameraLiveBudget";
import { asErrorMessage } from "../../../utils/format";

interface UseLiveCameraFramesOptions {
  selectedCameraId?: string | null;
  enabled?: boolean;
}

export function useLiveCameraFrames(cameras: ControlCenterCamera[], { selectedCameraId = null, enabled = true }: UseLiveCameraFramesOptions = {}) {
  const cameraIds = useMemo(() => cameras.map((camera) => camera.camera_id), [cameras]);
  const cameraIdsKey = cameraIds.join("|");
  const budget = useMemo(() => getCameraLiveBudget(), []);
  const refreshPlan = useMemo(() => splitCameraRefreshPlan(cameraIds, selectedCameraId), [cameraIds, selectedCameraId]);
  const [framesByCameraId, setFramesByCameraId] = useState<Record<string, ControlCenterLatestFrame>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const inFlightRef = useRef(0);
  const pendingIdsRef = useRef<Set<string>>(new Set());
  const visibleIdsRef = useRef<Set<string>>(new Set(cameraIds));

  useEffect(() => {
    visibleIdsRef.current = new Set(cameraIds);
    setFramesByCameraId((current) => {
      const next: Record<string, ControlCenterLatestFrame> = {};
      cameraIds.forEach((cameraId) => {
        if (current[cameraId]) {
          next[cameraId] = current[cameraId];
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraIdsKey]);

  const requestFrames = useCallback(
    async (ids: string[], mode: "initial" | "refresh" = "refresh") => {
      const visibleIds = visibleIdsRef.current;
      const scopedIds = dedupe(ids).filter((cameraId) => visibleIds.has(cameraId));
      if (!enabled || scopedIds.length === 0) {
        if (mode === "initial") {
          setLoading(false);
        }
        return;
      }
      if (document.visibilityState === "hidden") {
        if (mode === "initial") {
          setLoading(false);
        }
        return;
      }
      if (inFlightRef.current >= budget.maxConcurrentRefreshes) {
        scopedIds.forEach((cameraId) => pendingIdsRef.current.add(cameraId));
        return;
      }

      inFlightRef.current += 1;
      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const frames = await controlCenterApi.listCameraLatestFrames(scopedIds, true);
        setFramesByCameraId((current) => mergeLatestFrames(current, frames));
        setLastUpdatedAt(new Date().toISOString());
      } catch (caught) {
        setError(asErrorMessage(caught));
      } finally {
        inFlightRef.current = Math.max(0, inFlightRef.current - 1);
        setLoading(false);
        setRefreshing(false);
        const pending = Array.from(pendingIdsRef.current).filter((cameraId) => visibleIdsRef.current.has(cameraId));
        pendingIdsRef.current.clear();
        if (pending.length > 0) {
          window.setTimeout(() => {
            void requestFrames(pending, "refresh");
          }, 0);
        }
      }
    },
    [budget.maxConcurrentRefreshes, enabled],
  );

  useEffect(() => {
    if (!enabled) {
      setFramesByCameraId({});
      setLoading(false);
      setRefreshing(false);
      setError(null);
      setLastUpdatedAt(null);
      return;
    }
    void requestFrames(cameraIds, "initial");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, cameraIdsKey, requestFrames]);

  useEffect(() => {
    if (!enabled || !refreshPlan.activeIds.length || budget.activeIntervalMs <= 0) {
      return;
    }
    void requestFrames(refreshPlan.activeIds, "refresh");
    const interval = window.setInterval(() => {
      void requestFrames(refreshPlan.activeIds, "refresh");
    }, budget.activeIntervalMs);
    return () => window.clearInterval(interval);
  }, [budget.activeIntervalMs, enabled, refreshPlan.activeCameraId, requestFrames]);

  useEffect(() => {
    if (!enabled || !refreshPlan.backgroundIds.length || budget.backgroundIntervalMs <= 0) {
      return;
    }
    const interval = window.setInterval(() => {
      void requestFrames(refreshPlan.backgroundIds, "refresh");
    }, budget.backgroundIntervalMs);
    return () => window.clearInterval(interval);
  }, [budget.backgroundIntervalMs, enabled, refreshPlan.backgroundIds.join("|"), requestFrames]);

  return {
    framesByCameraId,
    activeCameraId: refreshPlan.activeCameraId,
    budget,
    loading,
    refreshing,
    error,
    lastUpdatedAt,
    refresh: () => void requestFrames(cameraIds, "refresh"),
  };
}

function mergeLatestFrames(current: Record<string, ControlCenterLatestFrame>, frames: ControlCenterLatestFrame[]) {
  const next = { ...current };
  frames.forEach((frame) => {
    if (shouldAcceptLatestFrame(next[frame.camera_id], frame)) {
      next[frame.camera_id] = frame;
    }
  });
  return next;
}

function dedupe(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
