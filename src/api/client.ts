const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const apiBaseUrl = import.meta.env.DEV ? "" : configuredBaseUrl.replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : `Request failed with status ${status}`);
    this.status = status;
    this.detail = detail;
  }
}

export function buildQueryString(params: Record<string, string | number | null | undefined> | object): string {
  const search = new URLSearchParams();
  Object.entries(params as Record<string, string | number | null | undefined>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

export async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let detail: unknown = response.statusText;
    try {
      const payload = await response.json();
      detail = payload.detail ?? payload;
    } catch {
      detail = await response.text();
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
}

export function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestJson<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
