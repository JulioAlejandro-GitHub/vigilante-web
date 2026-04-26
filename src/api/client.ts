import { buildQueryString } from "../utils/queryString";
import { readStoredToken } from "../utils/tokenStorage";

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const apiBaseUrl = import.meta.env.DEV ? "" : configuredBaseUrl.replace(/\/$/, "");

type AuthFailureHandler = (error: ApiError) => void;
type JsonRequestInit = RequestInit & {
  skipAuth?: boolean;
};

const authFailureHandlers = new Set<AuthFailureHandler>();

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    const detailMessage = typeof detail === "string" ? detail : `Request failed with status ${status}`;
    const message =
      status === 401
        ? `Authentication required: ${detailMessage}`
        : status === 403
          ? `Access denied: ${detailMessage}`
          : detailMessage;
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export { buildQueryString };

export function onApiAuthFailure(handler: AuthFailureHandler) {
  authFailureHandlers.add(handler);
  return () => {
    authFailureHandlers.delete(handler);
  };
}

function emitAuthFailure(error: ApiError) {
  authFailureHandlers.forEach((handler) => handler(error));
}

export async function requestJson<T>(path: string, options: JsonRequestInit = {}): Promise<T> {
  const { skipAuth = false, headers, ...requestOptions } = options;
  const token = skipAuth ? null : readStoredToken();

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...requestOptions,
    headers: {
      "content-type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
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
    const error = new ApiError(response.status, detail);
    if (!skipAuth && response.status === 401) {
      emitAuthFailure(error);
    }
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
}

export function postJson<T>(path: string, body?: unknown, options: JsonRequestInit = {}): Promise<T> {
  return requestJson<T>(path, {
    ...options,
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
