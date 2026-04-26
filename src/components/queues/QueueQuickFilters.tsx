export interface QueueQuickFilter {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface QueueQuickFiltersProps {
  filters: QueueQuickFilter[];
}

export function QueueQuickFilters({ filters }: QueueQuickFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {filters.map((filter) => (
        <button
          key={filter.label}
          className={`btn ${filter.active ? "btn-primary" : ""}`}
          type="button"
          onClick={filter.onClick}
          disabled={filter.disabled}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
