import { SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

interface FilterBarProps {
  title?: string;
  activeCount?: number;
  children: React.ReactNode;
  onReset?: () => void;
}

export function FilterBar({ title = "Filters", activeCount = 0, children, onReset }: FilterBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="panel mb-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <button
          className="inline-flex min-w-0 items-center gap-2 text-left text-sm font-semibold text-zinc-950 md:pointer-events-none"
          type="button"
          onClick={() => setOpen((value) => !value)}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-teal-700" />
          <span>{title}</span>
          {activeCount > 0 ? (
            <span className="rounded bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-800">{activeCount} active</span>
          ) : null}
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {onReset ? (
            <button className="btn px-2 py-1 text-xs" type="button" onClick={onReset}>
              <X className="h-3.5 w-3.5" />
              Reset
            </button>
          ) : null}
          <button className="btn px-2 py-1 text-xs md:hidden" type="button" onClick={() => setOpen((value) => !value)}>
            {open ? "Hide" : "Show"}
          </button>
        </div>
      </div>
      <div className={`${open ? "block" : "hidden"} p-4 md:block`}>{children}</div>
    </section>
  );
}
