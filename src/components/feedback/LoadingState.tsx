interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Loading data" }: LoadingStateProps) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-3 text-sm text-zinc-600">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-teal-700" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </div>
  );
}
