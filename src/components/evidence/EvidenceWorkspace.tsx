import { EvidenceSection } from "./EvidenceSection";
import { MediaReadyPanel } from "./MediaReadyPanel";
import { TechnicalMetadataGrid } from "./TechnicalMetadataGrid";
import { evidenceHighlights } from "../../utils/evidence";

interface EvidenceWorkspaceProps {
  payload: Record<string, unknown>;
  sourceEventId?: string | null;
  title?: string;
}

export function EvidenceWorkspace({ payload, sourceEventId, title = "Evidence workspace" }: EvidenceWorkspaceProps) {
  const highlights = evidenceHighlights(payload);

  return (
    <section className="space-y-4">
      <div className="panel p-4">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <p className="mt-1 text-sm text-zinc-600">Quick evidence summary, structured technical context and audit payload.</p>
        <div className="mt-4">
          <TechnicalMetadataGrid rows={highlights} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <EvidenceSection payload={payload} sourceEventId={sourceEventId} title="Technical evidence" showMediaSlot={false} />
        <MediaReadyPanel sourceEventId={sourceEventId} />
      </div>
    </section>
  );
}
