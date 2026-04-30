import { EvidenceMediaPanel } from "./EvidenceMediaPanel";
import type { EvidenceMediaItem } from "../../types/api";

interface MediaReadyPanelProps {
  evidenceMedia?: EvidenceMediaItem[] | null;
  fallbackRefs?: string[];
  sourceEventId?: string | null;
}

export function MediaReadyPanel({ evidenceMedia, fallbackRefs, sourceEventId }: MediaReadyPanelProps) {
  return <EvidenceMediaPanel evidenceMedia={evidenceMedia} fallbackRefs={fallbackRefs} sourceEventId={sourceEventId} />;
}
