import { Feedback } from "../Feedback";

interface BulkActionBarProps {
  selectedCount: number;
  busy?: boolean;
  error?: string | null;
  success?: string | null;
  children: React.ReactNode;
}

export function BulkActionBar({ selectedCount, busy = false, error, success, children }: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded border border-teal-200 bg-teal-50 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm font-semibold text-teal-950">{selectedCount} selected</div>
          <div className="text-xs text-teal-800">{busy ? "Running bulk action..." : "Bulk actions run sequentially from this browser."}</div>
        </div>
        <div className="flex flex-wrap gap-2">{children}</div>
      </div>
      <div className="mt-3">
        <Feedback error={error} success={success} />
      </div>
    </div>
  );
}
