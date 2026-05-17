import { useCallback, useEffect, useMemo, useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import type {
  ControlCenterCamera,
  ControlCenterCameraStatus,
  ControlCenterCameraTile,
  ControlCenterOverlay,
} from "../types/controlCenter.types";
import { buildPriorityInsight } from "../utils/priority";
import type { TimelineEvent } from "../../../types/api";
import { asErrorMessage } from "../../../utils/format";
import { asRecord } from "../../../utils/evidence";

interface UseCameraStreamsOptions {
  pollMs?: number;
  limit?: number;
  enabled?: boolean;
}

export function useCameraStreams(events: TimelineEvent[], { pollMs = 30000, limit = 6, enabled = true }: UseCameraStreamsOptions = {}) {
  const [cameras, setCameras] = useState<ControlCenterCamera[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "more" = "refresh", requestedOffset = 0) => {
      if (!enabled) {
        setCameras([]);
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        setNextOffset(0);
        setError(null);
        return;
      }
      if (mode === "initial") {
        setLoading(true);
      } else if (mode === "more") {
        setLoadingMore(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const offset = mode === "more" ? requestedOffset : 0;
        const next = await controlCenterApi.listCameras(limit, offset);
        setNextOffset(next.length >= limit ? offset + next.length : null);
        setCameras((current) => (mode === "more" ? dedupeCameras([...current, ...next]) : next));
      } catch (caught) {
        setError(asErrorMessage(caught));
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [enabled, limit],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  useEffect(() => {
    if (!enabled || pollMs <= 0) {
      return;
    }
    const interval = window.setInterval(() => {
      if (document.visibilityState === "hidden") {
        return;
      }
      void load("refresh");
    }, pollMs);
    return () => window.clearInterval(interval);
  }, [load, pollMs]);

  const tiles = useMemo(() => buildCameraTiles(cameras, events), [cameras, events]);

  return {
    cameras,
    tiles,
    loading,
    refreshing,
    loadingMore,
    hasMore: nextOffset !== null,
    error,
    refresh: () => void load("refresh"),
    loadMore: () => {
      if (nextOffset !== null && !loadingMore) {
        void load("more", nextOffset);
      }
    },
  };
}

function dedupeCameras(cameras: ControlCenterCamera[]) {
  const seen = new Set<string>();
  const deduped: ControlCenterCamera[] = [];
  for (const camera of cameras) {
    if (seen.has(camera.camera_id)) {
      continue;
    }
    seen.add(camera.camera_id);
    deduped.push(camera);
  }
  return deduped;
}

function buildCameraTiles(cameras: ControlCenterCamera[], events: TimelineEvent[]): ControlCenterCameraTile[] {
  const eventsByCamera = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    if (!event.camera_id) {
      continue;
    }
    const list = eventsByCamera.get(event.camera_id) ?? [];
    list.push(event);
    eventsByCamera.set(event.camera_id, list);
  }

  return cameras.map((camera) => {
    const cameraEvents = (eventsByCamera.get(camera.camera_id) ?? []).sort(
      (left, right) => new Date(right.event_ts).getTime() - new Date(left.event_ts).getTime(),
    );
    const latestEvent = cameraEvents[0] ?? null;
    const metadata = camera.metadata ?? {};
    const status = cameraStatus(camera, latestEvent);

    return {
      camera,
      status,
      fps: numberFromMetadata(metadata, ["fps", "last_fps", "stream_fps"]),
      latencyMs: numberFromMetadata(metadata, ["latency_ms", "last_latency_ms", "stream_latency_ms"]),
      lastSeenAt: latestEvent?.event_ts ?? stringFromMetadata(metadata, ["last_seen_at", "last_frame_at", "updated_at"]),
      latestEvent,
      priority: latestEvent ? buildPriorityInsight(latestEvent, cameraEvents) : null,
      snapshotUrl: latestEvent ? eventEvidencePreview(latestEvent) : secureMetadataImageUrl(metadata),
      snapshotSource: latestEvent ? "recognition" : secureMetadataImageUrl(metadata) ? "camera_metadata" : null,
      liveFrame: null,
      overlays: latestEvent ? extractOverlays(latestEvent) : [],
      reason: statusReason(camera, latestEvent, metadata),
    };
  });
}

function cameraStatus(camera: ControlCenterCamera, latestEvent: TimelineEvent | null): ControlCenterCameraStatus {
  if (!camera.is_active) {
    return "offline";
  }
  const metadataStatus = stringFromMetadata(camera.metadata, ["status", "health_status", "operational_status"])?.toLowerCase();
  if (metadataStatus === "offline" || metadataStatus === "disabled") {
    return "offline";
  }
  if (metadataStatus === "degraded" || metadataStatus === "warning") {
    return "degraded";
  }
  if (!latestEvent) {
    return "degraded";
  }
  const ageMs = Date.now() - new Date(latestEvent.event_ts).getTime();
  if (Number.isFinite(ageMs) && ageMs > 10 * 60 * 1000) {
    return "degraded";
  }
  return "online";
}

function statusReason(camera: ControlCenterCamera, latestEvent: TimelineEvent | null, metadata: Record<string, unknown>) {
  if (!camera.is_active) {
    return "Camera disabled in API configuration";
  }
  const reason = stringFromMetadata(metadata, ["status_reason", "health_reason", "last_error"]);
  if (reason) {
    return reason;
  }
  if (!latestEvent) {
    return "No recent processed event available";
  }
  return null;
}

function eventEvidencePreview(event: TimelineEvent) {
  const item = (event.evidence_media ?? []).find((candidate) => candidate.resolved !== false && (candidate.thumbnail_url || candidate.content_url || candidate.proxy_url));
  return item?.thumbnail_url || item?.content_url || item?.proxy_url || null;
}

function secureMetadataImageUrl(metadata: Record<string, unknown>) {
  const explicit = stringFromMetadata(metadata, ["signed_snapshot_url", "temporary_snapshot_url", "signed_thumbnail_url"]);
  if (explicit) {
    return explicit;
  }
  return null;
}

function extractOverlays(event: TimelineEvent): ControlCenterOverlay[] {
  const payload = event.payload ?? {};
  const candidates = [
    payload.bounding_box,
    payload.bbox,
    asRecord(payload.face_detection)?.bounding_box,
    asRecord(payload.face_detection)?.bbox,
    asRecord(payload.person_detection)?.bounding_box,
    asRecord(payload.person_detection)?.bbox,
  ];
  const detections = Array.isArray(payload.detections) ? payload.detections : [];
  const overlays = candidates
    .map((candidate, index) => overlayFromBox(candidate, `detection-${index + 1}`, event.confidence))
    .filter((overlay): overlay is ControlCenterOverlay => Boolean(overlay));

  detections.slice(0, 4).forEach((candidate, index) => {
    const record = asRecord(candidate);
    if (!record) {
      return;
    }
    const overlay = overlayFromBox(record.bbox ?? record.bounding_box, String(record.label ?? `detection-${index + 1}`), numberFromUnknown(record.confidence ?? record.score));
    if (overlay) {
      overlays.push(overlay);
    }
  });

  return overlays.slice(0, 5);
}

function overlayFromBox(value: unknown, label: string, confidence: number | null): ControlCenterOverlay | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const x = numberFromUnknown(record.x ?? record.left);
  const y = numberFromUnknown(record.y ?? record.top);
  const width = numberFromUnknown(record.width ?? record.w);
  const height = numberFromUnknown(record.height ?? record.h);
  if (x === null || y === null || width === null || height === null) {
    return null;
  }
  return {
    id: `${label}:${x}:${y}:${width}:${height}`,
    label,
    confidence,
    box: normalizeBox({ x, y, width, height }),
  };
}

function normalizeBox(box: { x: number; y: number; width: number; height: number }) {
  const looksNormalized = [box.x, box.y, box.width, box.height].every((value) => value >= 0 && value <= 1);
  if (looksNormalized) {
    return {
      x: box.x * 100,
      y: box.y * 100,
      width: box.width * 100,
      height: box.height * 100,
    };
  }
  return {
    x: clamp(box.x, 0, 100),
    y: clamp(box.y, 0, 100),
    width: clamp(box.width, 1, 100),
    height: clamp(box.height, 1, 100),
  };
}

function numberFromMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = numberFromUnknown(metadata[key]);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

function stringFromMetadata(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return null;
}

function numberFromUnknown(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
