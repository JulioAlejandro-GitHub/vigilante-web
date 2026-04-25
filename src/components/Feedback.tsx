interface FeedbackProps {
  error?: string | null;
  success?: string | null;
}

export function Feedback({ error, success }: FeedbackProps) {
  if (!error && !success) {
    return null;
  }
  return (
    <div className="space-y-2">
      {error ? <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div> : null}
      {success ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</div>
      ) : null}
    </div>
  );
}
