interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
      <div className="font-medium">Unable to load data</div>
      <div className="mt-1">{message}</div>
      {onRetry ? (
        <button className="btn mt-3 border-rose-200 bg-white text-rose-800 hover:bg-rose-100" type="button" onClick={onRetry}>
          Retry
        </button>
      ) : null}
    </div>
  );
}
