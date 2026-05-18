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
    if (currentTs === null) {
      return true;
    }
    if (next.state === "offline" || next.reason === "camera_disabled") {
      return true;
    }
    return Date.now() - currentTs > 5 * 60 * 1000;
  }
  if (currentTs === null) {
    return true;
  }
  return nextTs >= currentTs;
}

export function latestFrameImageUrl(frame: ControlCenterLatestFrame | null | undefined) {
  const mediaUrl = frame?.media?.thumbnail_url || frame?.media?.content_url || frame?.media?.proxy_url || null;
  if (mediaUrl) {
    return mediaUrl;
  }
  const metadataUrl = metadataImageUrl(frame?.metadata);
  if (metadataUrl) {
    return metadataUrl;
  }
  return null;
}

export function versionedLatestFrameImageUrl(frame: ControlCenterLatestFrame | null | undefined) {
  const url = latestFrameImageUrl(frame);
  if (!url) {
    return null;
  }
  const version = frame?.latest_frame_at || frame?.event_id || frame?.latest_frame_ref || null;
  if (!version || !shouldVersionImageUrl(url)) {
    return url;
  }
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}live_frame=${encodeURIComponent(version)}`;
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

function metadataImageUrl(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return null;
  }
  for (const key of ["thumbnail_url", "content_url", "proxy_url", "signed_snapshot_url", "temporary_snapshot_url", "signed_thumbnail_url"]) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function shouldVersionImageUrl(url: string) {
  if (url.startsWith("/")) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return new URL(url, window.location.origin).origin === window.location.origin;
  } catch {
    return false;
  }
}

function readPositiveNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function readPositiveInteger(value: unknown, fallback: number) {
  const parsed = Math.floor(Number(value));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
