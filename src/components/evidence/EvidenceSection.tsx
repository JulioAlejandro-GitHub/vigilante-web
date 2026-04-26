import { FaceDetectionCard } from "./FaceDetectionCard";
import { SemanticDescriptorCard } from "./SemanticDescriptorCard";
import { SourceEventSummary } from "./SourceEventSummary";
import { TechnicalMetadataGrid } from "./TechnicalMetadataGrid";
import { TechnicalPayloadPanel } from "./TechnicalPayloadPanel";
import { asRecord, evidenceHighlights, payloadValue, summarizeValue } from "../../utils/evidence";

interface EvidenceSectionProps {
  payload: Record<string, unknown>;
  sourceEventId?: string | null;
  title?: string;
  compact?: boolean;
}

export function EvidenceSection({ payload, sourceEventId, title = "Evidence and technical context", compact = false }: EvidenceSectionProps) {
  const sourceEvent = payloadValue(payload, "source_event");
  const faceDetection = payloadValue(payload, "face_detection");
  const semanticDescriptor = payloadValue(payload, "semantic_descriptor");
  const recurrentSubject = payloadValue(payload, "recurrent_subject_assessment");
  const generationTrace = payloadValue(payload, "generation_trace");
  const highlights = evidenceHighlights(payload);
  const hasPayload = payload && Object.keys(payload).length > 0;

  if (!hasPayload) {
    return (
      <section className="rounded border border-dashed border-zinc-300 bg-white p-4">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        <p className="mt-2 text-sm text-zinc-600">No technical evidence payload is available for this item yet.</p>
        <MediaPlaceholder />
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        <p className="mt-1 text-xs text-zinc-500">Structured fields are summarized first. Full payload remains available for audit.</p>
      </div>

      <TechnicalMetadataGrid rows={highlights} />

      <div className={compact ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
        <FaceDetectionCard faceDetection={faceDetection} />
        <SemanticDescriptorCard descriptor={semanticDescriptor} />
      </div>

      {recurrentSubject !== undefined && recurrentSubject !== null ? (
        <article className="rounded border border-zinc-200 bg-white p-3">
          <h4 className="text-sm font-semibold text-zinc-950">Recurrent subject assessment</h4>
          <p className="mt-2 break-words text-sm text-zinc-900">{summarizeValue(recurrentSubject)}</p>
          {asRecord(recurrentSubject) ? (
            <div className="mt-3">
              <TechnicalMetadataGrid
                rows={Object.entries(asRecord(recurrentSubject) ?? {})
                  .slice(0, 6)
                  .map(([label, value]) => ({ label, value: summarizeValue(value) }))}
              />
            </div>
          ) : null}
        </article>
      ) : null}

      {generationTrace !== undefined && generationTrace !== null ? (
        <article className="rounded border border-zinc-200 bg-white p-3">
          <h4 className="text-sm font-semibold text-zinc-950">Generation trace</h4>
          <p className="mt-2 break-words text-sm text-zinc-900">{summarizeValue(generationTrace)}</p>
        </article>
      ) : null}

      <SourceEventSummary sourceEvent={sourceEvent} sourceEventId={sourceEventId} />
      <MediaPlaceholder />
      <TechnicalPayloadPanel payload={payload} />
    </section>
  );
}

function MediaPlaceholder() {
  return (
    <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-600">
      Media viewer placeholder. When image or video evidence endpoints exist, this section can host the real viewer without changing the
      surrounding investigation workflow.
    </div>
  );
}
