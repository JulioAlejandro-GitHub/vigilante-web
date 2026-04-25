interface EmptyStateProps {
  label: string;
  action?: React.ReactNode;
}

export function EmptyState({ label, action }: EmptyStateProps) {
  return (
    <div className="rounded border border-dashed border-zinc-300 bg-white p-4 text-sm text-zinc-600">
      <div>{label}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
