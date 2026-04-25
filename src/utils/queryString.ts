export type QueryValue = string | number | null | undefined;

export function buildQueryString(params: Record<string, QueryValue> | object): string {
  const search = new URLSearchParams();

  Object.entries(params as Record<string, QueryValue>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export function normalizeQueryParams(params: Record<string, QueryValue>): URLSearchParams {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  return search;
}
