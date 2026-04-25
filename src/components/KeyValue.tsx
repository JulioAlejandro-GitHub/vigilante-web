interface KeyValueProps {
  label: string;
  value: React.ReactNode;
}

export function KeyValue({ label, value }: KeyValueProps) {
  return (
    <div className="min-w-0">
      <div className="label">{label}</div>
      <div className="mt-1 break-words text-sm text-zinc-900">{value || "—"}</div>
    </div>
  );
}
