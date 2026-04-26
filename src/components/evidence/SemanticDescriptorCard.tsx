import { asRecord, summarizeValue } from "../../utils/evidence";

interface SemanticDescriptorCardProps {
  descriptor: unknown;
}

export function SemanticDescriptorCard({ descriptor }: SemanticDescriptorCardProps) {
  if (descriptor === undefined || descriptor === null) {
    return null;
  }

  const record = asRecord(descriptor);
  const rows = record
    ? Object.entries(record)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .slice(0, 8)
    : [["summary", descriptor] as const];

  return (
    <article className="rounded border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold text-zinc-950">Semantic descriptor</h4>
        <span className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-800">context</span>
      </div>
      <div className="mt-3 grid gap-2">
        {rows.map(([key, value]) => (
          <div key={String(key)} className="text-sm">
            <span className="font-medium text-zinc-700">{String(key)}: </span>
            <span className="break-words text-zinc-900">{summarizeValue(value)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
