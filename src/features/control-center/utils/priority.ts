import type { ControlCenterPriorityInsight, ControlCenterPriorityTier } from "../types/controlCenter.types";
import type { TimelineEvent } from "../../../types/api";
import { asRecord, payloadString, payloadValue, summarizeValue } from "../../../utils/evidence";
import { shortId } from "../../../utils/format";

export function buildPriorityInsight(event: TimelineEvent, groupedEvents: TimelineEvent[] = [event]): ControlCenterPriorityInsight {
  const eventText = eventSearchText(event);
  const severityRank = normalizeSeverityRank(event.severity);
  const sightingsCount = Math.max(groupedEvents.length, numericPayloadValue(event, SIGHTING_COUNT_KEYS) ?? 0);
  const cameraCount = new Set(groupedEvents.map((item) => item.camera_id).filter(Boolean)).size;
  const requiresManualReview = eventText.includes("manual_review_required") || Boolean(payloadString(event.payload, ["review_id", "review_type"]));
  const isIdentityConflict = eventText.includes("identity_conflict") || payloadString(event.payload, ["review_type"]) === "identity_conflict";
  const isCaseSuggestion = eventText.includes("case_suggestion_created") || Boolean(payloadString(event.payload, ["suggestion_id", "suggestion_type"]));
  const isRecurrent = eventText.includes("recurrent") || sightingsCount >= 2 || Boolean(asRecord(payloadValue(event.payload, "recurrent_subject_assessment")));
  const hasUsefulMatch = hasMatchSignal(event);
  const hasVisualEvidence = hasEvidenceSignal(event);
  const faceState = faceUsability(event);
  const hasKnownIdentity = Boolean(
    payloadString(event.payload, ["identity_name", "person_name", "candidate_name", "matched_name", "person_profile_id", "matched_person_profile_id"]),
  );
  const hasUsableUnknownFace = faceState === "usable" && !hasKnownIdentity && !hasUsefulMatch;

  let score = severityRank * 16;
  if (requiresManualReview) score += 28;
  if (isIdentityConflict) score += 24;
  if (isRecurrent) score += Math.min(22, 10 + sightingsCount * 4);
  if (isCaseSuggestion) score += 12;
  if (hasUsefulMatch) score += 18;
  if (hasUsableUnknownFace) score += 16;
  if (hasVisualEvidence) score += 8;
  if ((event.confidence ?? 0) >= 0.85) score += 8;
  if (cameraCount > 1) score += Math.min(12, cameraCount * 4);

  const reasons: string[] = [];
  if (severityRank >= 4) reasons.push("severidad crítica");
  else if (severityRank >= 3) reasons.push("severidad alta");
  if (requiresManualReview) reasons.push("verificación manual requerida");
  if (isIdentityConflict) reasons.push("conflicto de identidad");
  if (hasUsefulMatch) reasons.push("match útil");
  if (hasUsableUnknownFace) reasons.push("rostro usable sin identidad");
  if (isRecurrent) reasons.push(`${sightingsCount} avistamientos`);
  if (cameraCount > 1) reasons.push(`${cameraCount} cámaras`);
  if (hasVisualEvidence) reasons.push("evidencia visual disponible");

  const tier = priorityTier(score);
  return {
    score: Math.min(100, Math.round(score)),
    tier,
    label: priorityLabel(tier),
    eventLabel: eventTypeLabel(event, {
      requiresManualReview,
      isIdentityConflict,
      isRecurrent,
      isCaseSuggestion,
      hasUsefulMatch,
      hasUsableUnknownFace,
    }),
    primaryReason: reasons[0] ?? "evento reciente",
    reasons: reasons.length ? reasons.slice(0, 5) : ["evento reciente"],
    tags: priorityTags({
      requiresManualReview,
      isIdentityConflict,
      isRecurrent,
      hasUsefulMatch,
      hasUsableUnknownFace,
      hasVisualEvidence,
      sightingsCount,
      confidence: event.confidence,
    }),
    recognitionSummary: recognitionSummary(event, {
      faceState,
      hasKnownIdentity,
      hasUsefulMatch,
      hasUsableUnknownFace,
      isIdentityConflict,
      requiresManualReview,
      isRecurrent,
      sightingsCount,
    }),
    sightingsCount,
    cameraCount,
    hasVisualEvidence,
    requiresManualReview,
    isIdentityConflict,
    isRecurrent,
    hasUsefulMatch,
    hasUsableUnknownFace,
  };
}

export function comparePriorityGroups(left: { event: TimelineEvent; priority: ControlCenterPriorityInsight }, right: { event: TimelineEvent; priority: ControlCenterPriorityInsight }) {
  if (left.priority.score !== right.priority.score) {
    return right.priority.score - left.priority.score;
  }
  return new Date(right.event.event_ts).getTime() - new Date(left.event.event_ts).getTime();
}

export function normalizeSeverityRank(severity: string | null | undefined) {
  const normalized = String(severity || "").toLowerCase();
  if (normalized === "critical") return 4;
  if (normalized === "high") return 3;
  if (normalized === "medium") return 2;
  if (normalized === "low") return 1;
  return 0;
}

export function visualEventSummary(event: TimelineEvent, fallback?: string | null) {
  const descriptor = asRecord(payloadValue(event.payload, "semantic_descriptor"));
  const descriptorText = descriptor
    ? payloadString(descriptor, ["summary", "description", "caption", "visual_description", "label"])
    : null;
  return (
    descriptorText ||
    payloadString(event.payload, ["semantic_summary", "reason_summary", "description", "suggested_reason", "review_reason"]) ||
    fallback ||
    event.summary ||
    summarizeValue(event.payload)
  );
}

export function subjectDisplayName(event: TimelineEvent) {
  const knownName = payloadString(event.payload, ["identity_name", "person_name", "candidate_name", "matched_name"]);
  if (knownName) return knownName;
  const personProfile = payloadString(event.payload, ["person_profile_id", "matched_person_profile_id"]);
  if (personProfile) return `Identidad ${shortId(personProfile)}`;
  const observed = event.subject_id || payloadString(event.payload, ["observed_subject_id", "subject_id"]);
  if (observed) return `Sujeto observado ${shortId(observed)}`;
  const trackId = event.track_id || payloadString(event.payload, ["track_id"]);
  return trackId ? `Track ${shortId(trackId)}` : "Sujeto no identificado";
}

function priorityTier(score: number): ControlCenterPriorityTier {
  if (score >= 80) return "critical";
  if (score >= 56) return "attention";
  if (score >= 34) return "watch";
  return "normal";
}

function priorityLabel(tier: ControlCenterPriorityTier) {
  if (tier === "critical") return "crítico";
  if (tier === "attention") return "atención";
  if (tier === "watch") return "observación";
  return "normal";
}

function eventTypeLabel(
  event: TimelineEvent,
  flags: {
    requiresManualReview: boolean;
    isIdentityConflict: boolean;
    isRecurrent: boolean;
    isCaseSuggestion: boolean;
    hasUsefulMatch: boolean;
    hasUsableUnknownFace: boolean;
  },
) {
  if (flags.isIdentityConflict) return "Conflicto de identidad";
  if (flags.requiresManualReview) return "Revisión manual requerida";
  if (flags.isRecurrent) return "Sujeto recurrente detectado";
  if (flags.hasUsefulMatch) return "Match detectado";
  if (flags.hasUsableUnknownFace) return "Rostro usable no identificado";
  if (flags.isCaseSuggestion) return "Sugerencia de caso";
  const raw = event.event_type || "evento";
  return raw
    .split(".")
    .pop()!
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function priorityTags(flags: {
  requiresManualReview: boolean;
  isIdentityConflict: boolean;
  isRecurrent: boolean;
  hasUsefulMatch: boolean;
  hasUsableUnknownFace: boolean;
  hasVisualEvidence: boolean;
  sightingsCount: number;
  confidence: number | null;
}) {
  const tags: string[] = [];
  if (flags.requiresManualReview) tags.push("verificación manual");
  if (flags.isIdentityConflict) tags.push("conflicto");
  if (flags.hasUsefulMatch) tags.push("match");
  if (flags.hasUsableUnknownFace) tags.push("rostro usable");
  if (flags.isRecurrent) tags.push(`${flags.sightingsCount} avistamientos`);
  if (flags.hasVisualEvidence) tags.push("evidencia");
  if (flags.confidence !== null && flags.confidence !== undefined) tags.push(`confianza ${formatPercent(flags.confidence)}`);
  return tags.slice(0, 5);
}

function recognitionSummary(
  event: TimelineEvent,
  flags: {
    faceState: "usable" | "not_usable" | "unknown";
    hasKnownIdentity: boolean;
    hasUsefulMatch: boolean;
    hasUsableUnknownFace: boolean;
    isIdentityConflict: boolean;
    requiresManualReview: boolean;
    isRecurrent: boolean;
    sightingsCount: number;
  },
) {
  if (flags.isIdentityConflict) return "Verificación manual requerida por inconsistencia de identidad.";
  if (flags.hasUsefulMatch) return `Match detectado con confianza ${formatPercent(event.confidence)}.`;
  if (flags.hasUsableUnknownFace) return "Rostro detectado y usable, sin identidad conocida.";
  if (flags.faceState === "not_usable") return "Sin rostro usable, presencia humana confirmada.";
  if (flags.isRecurrent) return `Sujeto recurrente observado en ${flags.sightingsCount} avistamientos.`;
  if (flags.requiresManualReview) return "Evento requiere revisión humana antes de resolver.";
  const semantic = visualEventSummary(event, null);
  return semantic && semantic !== "—" ? semantic : "Recognition entregó señales operativas para triage.";
}

function faceUsability(event: TimelineEvent): "usable" | "not_usable" | "unknown" {
  const payload = event.payload ?? {};
  const face = asRecord(payloadValue(payload, "face_detection")) ?? asRecord(payloadValue(payload, "face"));
  const explicitUsable = booleanPayloadValue(event, ["face_usable", "usable_face", "has_usable_face"]);
  if (explicitUsable !== null) {
    return explicitUsable ? "usable" : "not_usable";
  }
  if (face) {
    const faceUsable = booleanFromUnknown(face.usable ?? face.face_usable ?? face.is_usable);
    if (faceUsable !== null) {
      return faceUsable ? "usable" : "not_usable";
    }
    const status = String(face.status ?? face.quality_status ?? "").toLowerCase();
    if (["usable", "detected", "ok", "good"].includes(status)) {
      return "usable";
    }
    if (status.includes("unusable") || status.includes("low_quality") || status.includes("no_face")) {
      return "not_usable";
    }
    const quality = numberFromUnknown(face.quality ?? face.quality_score ?? face.confidence);
    if (quality !== null) {
      return (quality <= 1 ? quality >= 0.5 : quality >= 50) ? "usable" : "not_usable";
    }
  }
  return "unknown";
}

function hasMatchSignal(event: TimelineEvent) {
  const text = eventSearchText(event);
  if (text.includes("match_detected") || text.includes("person_match") || text.includes("matched_person")) {
    return true;
  }
  return Boolean(payloadString(event.payload, ["match_id", "matched_person_profile_id", "match_confidence", "candidate_name", "matched_name"]));
}

function hasEvidenceSignal(event: TimelineEvent) {
  if ((event.evidence_media ?? []).length > 0) {
    return true;
  }
  const evidenceCount = numericPayloadValue(event, ["evidence_count", "media_count", "frame_count"]);
  if (evidenceCount && evidenceCount > 0) {
    return true;
  }
  return hasPayloadArray(event.payload, ["evidence_refs", "frame_refs", "image_refs", "media_refs", "evidence_media", "resolved_media"]);
}

function numericPayloadValue(event: TimelineEvent, keys: string[]) {
  for (const key of keys) {
    const parsed = numberFromUnknown(payloadValue(event.payload, key));
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function booleanPayloadValue(event: TimelineEvent, keys: string[]) {
  for (const key of keys) {
    const parsed = booleanFromUnknown(payloadValue(event.payload, key));
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function hasPayloadArray(payload: Record<string, unknown>, keys: string[]) {
  return keys.some((key) => {
    const value = payloadValue(payload, key);
    return Array.isArray(value) ? value.length > 0 : Boolean(value);
  });
}

function eventSearchText(event: TimelineEvent) {
  return [
    event.event_type,
    event.summary,
    event.source_component,
    payloadString(event.payload, ["source_event_type", "review_type", "suggestion_type", "reason_summary", "suggested_reason"]),
    summarizeValue(event.payload),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function numberFromUnknown(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function booleanFromUnknown(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "yes", "usable", "ok"].includes(normalized)) return true;
    if (["false", "no", "unusable", "low_quality"].includes(normalized)) return false;
  }
  return null;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "no informada";
  }
  const percent = value <= 1 ? Math.round(value * 100) : Math.round(value);
  return `${percent}%`;
}

const SIGHTING_COUNT_KEYS = [
  "sightings_count",
  "sighting_count",
  "appearance_count",
  "appearances",
  "recurrence_count",
  "related_count",
  "event_count",
  "evidence_count",
];
