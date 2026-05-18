import type { TimelineEvent } from "../../../types/api";

export function cameraFocusUrl(cameraId: string | null | undefined) {
  const params = new URLSearchParams();
  if (cameraId) {
    params.set("camera_id", cameraId);
  }
  params.set("event_group", "operational");
  return `/timeline?${params.toString()}`;
}

export function evidenceFocusUrl(event: TimelineEvent | null | undefined, fallbackCameraId?: string | null) {
  if (event?.case_id) {
    return `/cases/${encodeURIComponent(event.case_id)}?tab=evidence`;
  }
  if (event?.source_event_id) {
    return `/timeline/${encodeURIComponent(event.source_event_id)}`;
  }

  const params = new URLSearchParams();
  if (event?.subject_id) {
    params.set("subject_id", event.subject_id);
  } else if (fallbackCameraId || event?.camera_id) {
    params.set("camera_id", fallbackCameraId || event?.camera_id || "");
  }
  params.set("event_group", "operational");
  return `/timeline?${params.toString()}`;
}
