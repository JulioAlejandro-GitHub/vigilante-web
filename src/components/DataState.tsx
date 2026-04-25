interface DataStateProps {
  loading: boolean;
  error: string | null;
  children: React.ReactNode;
}

export function DataState({ loading, error, children }: DataStateProps) {
  if (loading) {
    return <div className="panel p-4 text-sm text-zinc-600">Loading…</div>;
  }
  if (error) {
    return <div className="panel border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>;
  }
  return <>{children}</>;
}

export function EmptyState({ label }: { label: string }) {
  return <div className="rounded border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">{label}</div>;
}
