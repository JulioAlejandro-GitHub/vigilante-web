export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function shortId(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value;
}

export function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected error";
}
