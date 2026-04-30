import { KeyValue } from "../KeyValue";
import type { EvidenceMediaItem } from "../../types/api";
import { summarizeValue } from "../../utils/evidence";
import { formatDateTime } from "../../utils/format";

interface EvidenceMetadataPanelProps {
  item: EvidenceMediaItem;
  compact?: boolean;
}

export function EvidenceMetadataPanel({ item, compact = false }: EvidenceMetadataPanelProps) {
  const dimensions = item.width && item.height ? `${item.width} x ${item.height}` : null;
  const storage = [item.storage_backend, item.bucket].filter(Boolean).join(" / ");
  const rows = [
    { label: "Content type", value: item.content_type },
    { label: "Dimensions", value: dimensions },
    { label: "Media ID", value: item.media_id },
    { label: "Reference", value: item.ref },
    { label: "Captured", value: formatOptionalDate(item.captured_at) },
    { label: "Camera", value: item.camera_id },
    { label: "Size", value: formatBytes(item.size_bytes) },
    { label: "Storage", value: storage || null },
    { label: "Object key", value: item.object_key },
    { label: "Last modified", value: formatOptionalDate(item.last_modified_at) },
    { label: "Checksum", value: item.checksum_sha256 },
    { label: "Error", value: item.error },
  ].filter((row) => row.value !== undefined && row.value !== null && row.value !== "");

  const metadataRows = Object.entries(item.metadata ?? {}).slice(0, compact ? 4 : 8);

  if (rows.length === 0 && metadataRows.length === 0) {
    return <p className="text-sm text-zinc-600">No media metadata available.</p>;
  }

  return (
    <div className="space-y-3">
      <div className={compact ? "grid gap-3 sm:grid-cols-2" : "space-y-3"}>
        {rows.map((row) => (
          <KeyValue key={row.label} label={row.label} value={row.value} />
        ))}
      </div>

      {metadataRows.length > 0 ? (
        <details className="rounded border border-zinc-200 bg-zinc-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-zinc-800">Metadata</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {metadataRows.map(([key, value]) => (
              <KeyValue key={key} label={key} value={summarizeValue(value)} />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function formatOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  return formatDateTime(value);
}

function formatBytes(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}
