interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  error?: string | null;
}

export function FormField({ label, children, hint, error }: FormFieldProps) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-zinc-500">{hint}</span> : null}
      {error ? <span className="mt-1 block text-xs font-medium text-rose-700">{error}</span> : null}
    </label>
  );
}
