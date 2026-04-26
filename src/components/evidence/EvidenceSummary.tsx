import { EvidenceSection } from "./EvidenceSection";

interface EvidenceSummaryProps {
  payload: Record<string, unknown>;
  sourceEventId?: string | null;
}

export function EvidenceSummary({ payload, sourceEventId }: EvidenceSummaryProps) {
  return <EvidenceSection payload={payload} sourceEventId={sourceEventId} title="Evidence context" compact />;
}
