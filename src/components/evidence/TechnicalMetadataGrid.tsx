import type { MetadataRow } from "../../utils/evidence";

interface TechnicalMetadataGridProps {
  rows: MetadataRow[];
}

export function TechnicalMetadataGrid({ rows }: TechnicalMetadataGridProps) {
  const visibleRows = rows.filter((row) => row.value !== undefined && row.value !== null && row.value !== "" && row.value !== "—");

  if (visibleRows.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {visibleRows.map((row) => (
        <div key={row.label} className="rounded border border-zinc-200 bg-zinc-50 p-3">
          <div className="label">{row.label}</div>
          <div className="mt-1 break-words text-sm text-zinc-950">{row.value}</div>
        </div>
      ))}
    </div>
  );
}
