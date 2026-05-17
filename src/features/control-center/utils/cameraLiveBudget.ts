import type { ControlCenterCameraStatus, ControlCenterLatestFrame } from "../types/controlCenter.types";

export const LIVE_TILE_ACTIVE_MAX_FPS = readPositiveNumber(import.meta.env.VITE_LIVE_TILE_ACTIVE_MAX_FPS, 1);
export const LIVE_TILE_BACKGROUND_MAX_FPS = readPositiveNumber(import.meta.env.VITE_LIVE_TILE_BACKGROUND_MAX_FPS, 0.4);
export const LIVE_TILE_MAX_CONCURRENT_REFRESHES = readPositiveInteger(import.meta.env.VITE_LIVE_TILE_MAX_CONCURRENT_REFRESHES, 2);

export interface CameraLiveBudget {
  activeMaxFps: number;
  backgroundMaxFps: number;
  maxConcurrentRefreshes: number;
  activeIntervalMs: number;
  backgroundIntervalMs: number;
}

export function getCameraLiveBudget(): CameraLiveBudget {
  return {
    activeMaxFps: LIVE_TILE_ACTIVE_MAX_FPS,
    backgroundMaxFps: LIVE_TILE_BACKGROUND_MAX_FPS,
    maxConcurrentRefreshes: LIVE_TILE_MAX_CONCURRENT_REFRESHES,
    activeIntervalMs: fpsToIntervalMs(LIVE_TILE_ACTIVE_MAX_FPS),
    backgroundIntervalMs: fpsToIntervalMs(LIVE_TILE_BACKGROUND_MAX_FPS),
  };
}

export function fpsToIntervalMs(fps: number) {
  if (!Number.isFinite(fps) || fps <= 0) {
    return 0;
  }
  return Math.max(250, Math.round(1000 / fps));
}

export function shouldAcceptLatestFrame(current: ControlCenterLatestFrame | undefined, next: ControlCenterLatestFrame) {
  if (!current) {
    return true;
  }
  const currentTs = timestamp(current.latest_frame_at);
  const nextTs = timestamp(next.latest_frame_at);
  if (nextTs === null) {
    return currentTs === null;
  }
  if (currentTs === null) {
    return true;
  }
  return nextTs >= currentTs;
}

export function latestFrameImageUrl(frame: ControlCenterLatestFrame | null | undefined) {
  if (!frame?.media?.resolved) {
    return null;
  }
  return frame.media.thumbnail_url || frame.media.content_url || frame.media.proxy_url || null;
}

export function normalizeLatestFrameStatus(frame: ControlCenterLatestFrame | null | undefined): ControlCenterCameraStatus | null {
  if (!frame) {
    return null;
  }
  if (frame.state === "live") return "live";
  if (frame.state === "online") return "online";
  if (frame.state === "stale") return "stale";
  if (frame.state === "offline") return "offline";
  if (frame.state === "not_started_concurrency") return "not_started_concurrency";
  if (frame.state === "no_snapshot") return "no_snapshot";
  if (frame.state === "degraded") return "degraded";
  return frame.latest_frame_ref ? "online" : "no_snapshot";
}

export function splitCameraRefreshPlan(cameraIds: string[], selectedCameraId: string | null) {
  const activeCameraId = selectedCameraId && cameraIds.includes(selectedCameraId) ? selectedCameraId : cameraIds[0] ?? null;
  return {
    activeCameraId,
    activeIds: activeCameraId ? [activeCameraId] : [],
    backgroundIds: cameraIds.filter((cameraId) => cameraId !== activeCameraId),
  };
}

function timestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function readPositiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readPositiveInteger(value: unknown, fallback: number) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
