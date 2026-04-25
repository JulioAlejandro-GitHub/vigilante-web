import { EmptyState } from "./feedback/EmptyState";
import { ErrorState } from "./feedback/ErrorState";
import { LoadingState } from "./feedback/LoadingState";

interface DataStateProps {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}

export function DataState({ loading, error, onRetry, children }: DataStateProps) {
  if (loading) {
    return <LoadingState />;
  }
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }
  return <>{children}</>;
}

export { EmptyState };
