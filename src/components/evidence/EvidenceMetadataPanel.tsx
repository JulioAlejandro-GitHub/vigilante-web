import type { ReactNode } from "react";

import { KeyValue } from "../KeyValue";
import { evidenceFallbackLabel, evidenceResolutionLabel } from "./EvidenceImageCard";
import type { EvidenceMediaItem } from "../../types/api";
import { summarizeValue } from "../../utils/evidence";
import { formatDateTime } from "../../utils/format";

interface EvidenceMetadataPanelProps {
  item: EvidenceMediaItem;
  compact?: boolean;
}

interface MetadataRow {
  label: string;
  value: ReactNode;
}

export function EvidenceMetadataPanel({ item, compact = false }: EvidenceMetadataPanelProps) {
  const dimensions = item.width && item.height ? `${item.width} x ${item.height}` : null;
  const thumbnailDimensions = item.thumbnail_width && item.thumbnail_height ? `${item.thumbnail_width} x ${item.thumbnail_height}` : null;
  const clipDimensions = item.clip_width && item.clip_height ? `${item.clip_width} x ${item.clip_height}` : null;
  const storage = [item.storage_backend, safeStorageValue(item.bucket)].filter(Boolean).join(" / ");
  const objectKey = safeStorageValue(item.object_key);
  const identityRows = [
    { label: "Media ID", value: item.media_id },
    { label: "Reference", value: item.ref },
    { label: "Camera", value: item.camera_id },
    { label: "Captured", value: formatOptionalDate(item.captured_at) },
  ];
  const imageRows = [
    { label: "Content type", value: item.content_type },
    { label: "Dimensions", value: dimensions },
    { label: "Size", value: formatBytes(item.size_bytes) },
    { label: "Thumbnail type", value: item.thumbnail_content_type },
    { label: "Thumbnail dimensions", value: thumbnailDimensions },
    { label: "Thumbnail status", value: item.thumbnail_status },
    { label: "Clip type", value: item.clip_content_type },
    { label: "Clip duration", value: formatSeconds(item.clip_duration_seconds) },
    { label: "Clip frames", value: item.clip_frame_count },
    { label: "Clip FPS", value: item.clip_fps },
    { label: "Clip dimensions", value: clipDimensions },
  ];
  const resolutionRows = [
    { label: "Resolution", value: evidenceResolutionLabel(item) },
    { label: "Fallback", value: evidenceFallbackLabel(item) },
    { label: "Thumbnail available", value: formatBoolean(item.thumbnail_available) },
    { label: "Clip available", value: formatBoolean(item.clip_available) },
    { label: "Clip status", value: item.clip_status },
    { label: "Content URL", value: item.content_url ? "Available" : null },
    { label: "Clip URL", value: item.clip_url ? "Available" : null },
    { label: "Proxy URL", value: item.proxy_url ? "Available" : null },
    { label: "Metadata URL", value: item.metadata_url ? "Available" : null },
    { label: "Storage", value: storage || null },
    { label: "Object key", value: objectKey },
    { label: "Error", value: item.error },
  ];
  const timestampRows = [
    { label: "Last modified", value: formatOptionalDate(item.last_modified_at) },
    { label: "Ingested", value: formatUnknownDate(item.ingested_at ?? item.metadata?.ingested_at) },
    { label: "Created", value: formatUnknownDate(item.created_at ?? item.metadata?.created_at) },
    { label: "Updated", value: formatUnknownDate(item.updated_at ?? item.metadata?.updated_at) },
    { label: "Resolved", value: formatUnknownDate(item.resolved_at ?? item.metadata?.resolved_at) },
  ];
  const integrityRows = [
    { label: "Checksum", value: item.checksum_sha256 },
    { label: "ETag", value: item.etag },
  ];
  const metadataRows = Object.entries(item.metadata ?? {})
    .filter(([key]) => !["width", "height", "created_at", "updated_at", "ingested_at", "resolved_at"].includes(key))
    .slice(0, compact ? 4 : 8);

  const hasRows = [identityRows, imageRows, resolutionRows, timestampRows, integrityRows].some(hasVisibleRows);

  if (!hasRows && metadataRows.length === 0) {
    return <p className="text-sm text-zinc-600">No media metadata available.</p>;
  }

  return (
    <div className="space-y-4">
      <MetadataGroup title="Identity and capture" rows={identityRows} compact={compact} />
      <MetadataGroup title="Image delivery" rows={imageRows} compact={compact} />
      <MetadataGroup title="Resolution state" rows={resolutionRows} compact={compact} />
      <MetadataGroup title="Operational timestamps" rows={timestampRows} compact={compact} />
      <MetadataGroup title="Integrity" rows={integrityRows} compact={compact} />

      {metadataRows.length > 0 ? (
        <details className="rounded border border-zinc-200 bg-zinc-50 p-3">
          <summary className="cursor-pointer text-sm font-medium text-zinc-800">Additional metadata</summary>
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

function MetadataGroup({ title, rows, compact }: { title: string; rows: MetadataRow[]; compact: boolean }) {
  const visibleRows = rows.filter(isVisibleRow);

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <section className="rounded border border-zinc-200 bg-white p-3">
      <h4 className="text-sm font-semibold text-zinc-950">{title}</h4>
      <div className={compact ? "mt-3 grid gap-3 sm:grid-cols-2" : "mt-3 grid gap-3"}>
        {visibleRows.map((row) => (
          <KeyValue key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </section>
  );
}

function hasVisibleRows(rows: MetadataRow[]) {
  return rows.some(isVisibleRow);
}

function isVisibleRow(row: MetadataRow) {
  return row.value !== undefined && row.value !== null && row.value !== "" && row.value !== "—";
}

function formatOptionalDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }
  return formatDateTime(value);
}

function formatUnknownDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
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

function formatSeconds(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)}s`;
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) {
    return null;
  }
  return value ? "Yes" : "No";
}

function safeStorageValue(value: string | null | undefined) {
  if (!value || !value.trim()) {
    return null;
  }
  const normalized = value.toLowerCase();
  const looksUnsafe =
    value.includes("?") ||
    value.includes("=") ||
    normalized.includes("secret") ||
    normalized.includes("token") ||
    normalized.includes("credential") ||
    normalized.includes("x-amz");

  return looksUnsafe ? null : value;
}
