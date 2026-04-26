import type { ReactNode } from "react";

import { ContextChips } from "../context/ContextChips";

interface EntityHeaderProps {
  eyebrow: string;
  title: string;
  description?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  organizationId?: string | null;
  siteId?: string | null;
}

export function EntityHeader({ eyebrow, title, description, badges, actions, organizationId, siteId }: EntityHeaderProps) {
  return (
    <section className="panel p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="label">{eyebrow}</div>
          <h1 className="mt-2 break-words text-2xl font-semibold text-zinc-950">{title}</h1>
          {description ? <div className="mt-2 text-sm text-zinc-600">{description}</div> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {badges}
            <ContextChips organizationId={organizationId} siteId={siteId} showEmpty />
          </div>
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  );
}
