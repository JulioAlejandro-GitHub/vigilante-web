import { useMemo } from "react";

import type { ControlCenterCameraTile, ControlCenterLatestFrame } from "../types/controlCenter.types";
import { normalizeLatestFrameStatus, versionedLatestFrameImageUrl } from "../utils/cameraLiveBudget";

export function useCameraLiveTiles(
  tiles: ControlCenterCameraTile[],
  framesByCameraId: Record<string, ControlCenterLatestFrame>,
): ControlCenterCameraTile[] {
  return useMemo(
    () =>
      tiles.map((tile) => {
        const liveFrame = framesByCameraId[tile.camera.camera_id] ?? null;
        if (!liveFrame) {
          return tile;
        }
        const liveImageUrl = versionedLatestFrameImageUrl(liveFrame);
        const liveStatus = normalizeLatestFrameStatus(liveFrame);
        return {
          ...tile,
          status: liveStatus ?? tile.status,
          lastSeenAt: liveFrame.latest_frame_at ?? tile.lastSeenAt,
          snapshotUrl: liveImageUrl ?? tile.snapshotUrl,
          snapshotSource: liveImageUrl ? "ingestion" : tile.snapshotSource,
          liveFrame,
          reason: liveFrame.reason ?? tile.reason,
        };
      }),
    [framesByCameraId, tiles],
  );
}
