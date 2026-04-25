import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  limit: number;
  offset: number;
  itemCount: number;
  onPage: (offset: number) => void;
}

export function PaginationControls({ limit, offset, itemCount, onPage }: PaginationControlsProps) {
  const page = Math.floor(offset / limit) + 1;

  return (
    <div className="mt-4 flex flex-col gap-3 rounded border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
      <div>
        Page <span className="font-medium text-zinc-950">{page}</span>
        <span className="mx-2 text-zinc-300">/</span>
        Offset {offset}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <button className="btn" type="button" onClick={() => onPage(Math.max(0, offset - limit))} disabled={offset === 0}>
          <ChevronLeft className="h-4 w-4" />
          Previous
        </button>
        <button className="btn" type="button" onClick={() => onPage(offset + limit)} disabled={itemCount < limit}>
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
