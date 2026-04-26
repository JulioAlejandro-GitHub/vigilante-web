import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface RelatedLink {
  label: string;
  value: string;
  to: string;
  tone?: "case" | "review" | "suggestion" | "timeline" | "default";
}

interface RelatedLinksPanelProps {
  title?: string;
  links: Array<RelatedLink | null | undefined>;
}

const tones = {
  case: "border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100",
  review: "border-indigo-200 bg-indigo-50 text-indigo-900 hover:bg-indigo-100",
  suggestion: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  timeline: "border-sky-200 bg-sky-50 text-sky-900 hover:bg-sky-100",
  default: "border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100",
};

export function RelatedLinksPanel({ title = "Related investigation links", links }: RelatedLinksPanelProps) {
  const visibleLinks = links.filter((link): link is RelatedLink => Boolean(link));

  return (
    <section className="panel p-4">
      <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
      <div className="mt-4 grid gap-2">
        {visibleLinks.length === 0 ? (
          <div className="rounded border border-dashed border-zinc-300 bg-zinc-50 p-3 text-sm text-zinc-600">
            No related entities were found in the current payload.
          </div>
        ) : null}
        {visibleLinks.map((link) => (
          <Link
            key={`${link.label}:${link.value}`}
            className={`flex items-center justify-between gap-3 rounded border px-3 py-2 text-sm font-medium ${tones[link.tone ?? "default"]}`}
            to={link.to}
          >
            <span className="min-w-0">
              <span className="block text-xs opacity-75">{link.label}</span>
              <span className="block truncate">{link.value}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
