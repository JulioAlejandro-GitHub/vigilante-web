interface SelectionToolbarProps {
  selectedCount: number;
  allVisibleSelected: boolean;
  visibleCount: number;
  onToggleAll: () => void;
  onClear: () => void;
}

export function SelectionToolbar({ selectedCount, allVisibleSelected, visibleCount, onToggleAll, onClear }: SelectionToolbarProps) {
  return (
    <div className="mb-3 flex flex-col gap-2 rounded border border-zinc-200 bg-white px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
      <label className="inline-flex items-center gap-2 font-medium text-zinc-700">
        <input type="checkbox" checked={allVisibleSelected} onChange={onToggleAll} />
        Select visible ({visibleCount})
      </label>
      <div className="flex items-center gap-2 text-zinc-600">
        <span>{selectedCount} selected</span>
        <button className="btn px-2 py-1 text-xs" type="button" onClick={onClear} disabled={selectedCount === 0}>
          Clear
        </button>
      </div>
    </div>
  );
}
