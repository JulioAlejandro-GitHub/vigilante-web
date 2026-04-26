import { TechnicalPayloadPanel } from "./TechnicalPayloadPanel";

interface EvidenceSummaryProps {
  payload: Record<string, unknown>;
}

const interestingKeys = [
  "face_detection",
  "semantic_descriptor",
  "match_confidence",
  "generation_trace",
  "recurrent_subject_assessment",
  "source_event",
  "suggested_title",
  "suggested_reason",
  "suggested_priority",
  "suggested_severity",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function summarizeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `${value.length} item${value.length === 1 ? "" : "s"}`;
  }
  if (isRecord(value)) {
    const preferred = ["summary", "label", "description", "reason", "status", "confidence", "score"]
      .map((key) => value[key])
      .find((item) => item !== undefined && item !== null);
    if (preferred !== undefined) {
      return summarizeValue(preferred);
    }
    return Object.keys(value).slice(0, 4).join(", ") || "object";
  }
  return String(value);
}

function nestedLookup(payload: Record<string, unknown>, key: string) {
  if (payload[key] !== undefined) {
    return payload[key];
  }
  const sourceEvent = payload.source_event;
  if (isRecord(sourceEvent) && sourceEvent[key] !== undefined) {
    return sourceEvent[key];
  }
  return undefined;
}

export function EvidenceSummary({ payload }: EvidenceSummaryProps) {
  const rows = interestingKeys
    .map((key) => [key, nestedLookup(payload, key)] as const)
    .filter(([, value]) => value !== undefined && value !== null);

  if (rows.length === 0 && Object.keys(payload || {}).length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-zinc-950">Evidence context</h3>
      {rows.length > 0 ? (
        <div className="grid gap-2">
          {rows.map(([key, value]) => (
            <div key={key} className="rounded border border-zinc-200 bg-white p-3">
              <div className="label">{key}</div>
              <div className="mt-1 break-words text-sm text-zinc-900">{summarizeValue(value)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-zinc-300 p-3 text-sm text-zinc-600">No summarized evidence fields available.</div>
      )}
      <TechnicalPayloadPanel payload={payload} />
    </section>
  );
}
