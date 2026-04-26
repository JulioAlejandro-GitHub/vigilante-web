import { asRecord, summarizeValue } from "../../utils/evidence";

interface FaceDetectionCardProps {
  faceDetection: unknown;
}

export function FaceDetectionCard({ faceDetection }: FaceDetectionCardProps) {
  if (faceDetection === undefined || faceDetection === null) {
    return null;
  }

  const record = asRecord(faceDetection);
  const rows = record
    ? [
        ["confidence", record.confidence ?? record.score ?? record.detection_confidence],
        ["quality", record.quality ?? record.image_quality],
        ["bbox", record.bbox ?? record.bounding_box],
        ["landmarks", record.landmarks],
        ["pose", record.pose],
      ].filter(([, value]) => value !== undefined && value !== null)
    : [["summary", faceDetection] as const];

  return (
    <article className="rounded border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950">Face detection</h4>
        <span className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">signal</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(([key, value]) => (
          <div key={String(key)} className="text-sm">
            <div className="label">{String(key)}</div>
            <div className="mt-1 break-words text-zinc-900">{summarizeValue(value)}</div>
          </div>
        ))}
      </div>
    </article>
  );
}
