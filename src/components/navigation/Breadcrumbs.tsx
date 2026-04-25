import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1 text-sm text-zinc-500" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-1">
          {item.to ? (
            <Link className="font-medium text-zinc-700 underline-offset-2 hover:text-zinc-950 hover:underline" to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-zinc-950">{item.label}</span>
          )}
          {index < items.length - 1 ? <ChevronRight className="h-4 w-4 text-zinc-400" aria-hidden="true" /> : null}
        </span>
      ))}
    </nav>
  );
}
