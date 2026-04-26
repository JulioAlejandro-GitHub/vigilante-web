import { ContextChips } from "../context/ContextChips";
import { KeyValue } from "../KeyValue";
import { formatDateTime, shortId } from "../../utils/format";

interface InvestigationContextPanelProps {
  title?: string;
  subjectId?: string | null;
  trackId?: string | null;
  cameraId?: string | null;
  eventTs?: string | null;
  organizationId?: string | null;
  siteId?: string | null;
  sourceComponent?: string | null;
}

export function InvestigationContextPanel({
  title = "Investigation context",
  subjectId,
  trackId,
  cameraId,
  eventTs,
  organizationId,
  siteId,
  sourceComponent,
}: InvestigationContextPanelProps) {
  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
        <ContextChips organizationId={organizationId} siteId={siteId} />
      </div>
      <div className="mt-4 grid gap-3">
        <KeyValue label="Subject" value={shortId(subjectId)} />
        <KeyValue label="Track" value={shortId(trackId)} />
        <KeyValue label="Camera" value={shortId(cameraId)} />
        <KeyValue label="Event time" value={formatDateTime(eventTs)} />
        {sourceComponent ? <KeyValue label="Source component" value={sourceComponent} /> : null}
      </div>
    </section>
  );
}
