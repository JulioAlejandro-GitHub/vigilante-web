interface TechnicalPayloadPanelProps {
  payload: Record<string, unknown>;
}

export function TechnicalPayloadPanel({ payload }: TechnicalPayloadPanelProps) {
  if (!payload || Object.keys(payload).length === 0) {
    return null;
  }

  return (
    <details className="rounded border border-zinc-200 bg-zinc-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-zinc-800">View technical payload</summary>
      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded bg-zinc-950 p-3 text-xs text-zinc-50">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
}
