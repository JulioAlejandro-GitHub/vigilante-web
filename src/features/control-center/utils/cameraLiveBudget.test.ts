import { describe, expect, it } from "vitest";

import { fpsToIntervalMs, shouldAcceptLatestFrame, splitCameraRefreshPlan, versionedLatestFrameImageUrl } from "./cameraLiveBudget";
import type { ControlCenterLatestFrame } from "../types/controlCenter.types";

describe("cameraLiveBudget", () => {
  it("turns active and background fps into bounded intervals", () => {
    expect(fpsToIntervalMs(1)).toBe(1000);
    expect(fpsToIntervalMs(0.5)).toBe(2000);
    expect(fpsToIntervalMs(10)).toBe(250);
  });

  it("prioritizes the selected camera and treats the rest as background", () => {
    const plan = splitCameraRefreshPlan(["cam-1", "cam-2", "cam-3"], "cam-2");
    expect(plan.activeIds).toEqual(["cam-2"]);
    expect(plan.backgroundIds).toEqual(["cam-1", "cam-3"]);
  });

  it("coalesces visual backlog by keeping the newest frame", () => {
    const older = frame("cam-1", "2026-01-01T10:00:00Z");
    const newer = frame("cam-1", "2026-01-01T10:00:01Z");
    expect(shouldAcceptLatestFrame(older, newer)).toBe(true);
    expect(shouldAcceptLatestFrame(newer, older)).toBe(false);
  });

  it("keeps a short-lived previous frame when a transient no-frame response arrives", () => {
    const current = frame("cam-1", new Date().toISOString());
    const next = { ...current, latest_frame_ref: null, latest_frame_at: null, state: "no_snapshot", reason: "no_ingested_frame", media: null };

    expect(shouldAcceptLatestFrame(current, next)).toBe(false);
  });

  it("versions same-origin media urls with the latest frame timestamp", () => {
    const item = frame("cam-1", "2026-01-01T10:00:01Z");
    item.media = {
      ref: item.latest_frame_ref ?? "",
      resolved: true,
      thumbnail_url: "/api/v1/media/latest/thumbnail",
    };

    expect(versionedLatestFrameImageUrl(item)).toBe("/api/v1/media/latest/thumbnail?live_frame=2026-01-01T10%3A00%3A01Z");
  });
});

function frame(cameraId: string, latestFrameAt: string): ControlCenterLatestFrame {
  return {
    camera_id: cameraId,
    latest_frame_ref: `s3://frames/${cameraId}/${latestFrameAt}.jpg`,
    latest_frame_at: latestFrameAt,
    frame_age_seconds: 1,
    event_id: "evt-frame",
    content_type: "image/jpeg",
    width: 1280,
    height: 720,
    state: "live",
    reason: null,
    media: null,
    ingestion: null,
    metadata: {},
  };
}
