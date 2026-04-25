interface QueueActionPanelProps {
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  children: React.ReactNode;
}

export function QueueActionPanel({ title, subtitle, status, children }: QueueActionPanelProps) {
  return (
    <aside className="panel p-4 xl:sticky xl:top-24">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-zinc-950">{title}</h2>
          {subtitle ? <div className="mt-1 truncate text-xs text-zinc-500">{subtitle}</div> : null}
        </div>
        {status}
      </div>
      <div className="mt-4">{children}</div>
    </aside>
  );
}
