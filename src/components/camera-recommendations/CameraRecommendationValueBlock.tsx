import { summarizeValue } from "../../utils/evidence";

export function formatRecommendationValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return summarizeValue(value);
  }
}

export function CameraRecommendationValueBlock({ value, compact = false }: { value: unknown; compact?: boolean }) {
  const formatted = formatRecommendationValue(value);
  const isStructured = typeof value === "object" && value !== null;

  if (!isStructured) {
    return <span>{formatted}</span>;
  }

  return (
    <pre
      className={`overflow-x-auto rounded border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-800 ${
        compact ? "max-h-40" : "max-h-80"
      }`}
    >
      {formatted}
    </pre>
  );
}
