import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { normalizeQueryParams, QueryValue } from "../utils/queryString";

type QueryDefaults = Record<string, QueryValue>;

function parseValue(rawValue: string | null, defaultValue: QueryValue): QueryValue {
  if (rawValue === null) {
    return defaultValue;
  }

  if (typeof defaultValue === "number") {
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  return rawValue;
}

export function useQueryParams<T extends QueryDefaults>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const next = { ...defaults } as Record<string, QueryValue>;

    Object.entries(defaults).forEach(([key, defaultValue]) => {
      next[key] = parseValue(searchParams.get(key), defaultValue);
    });

    return next as T;
  }, [defaults, searchParams]);

  const setParams = useCallback(
    (patch: Partial<T>, options: { replace?: boolean } = {}) => {
      const next = new URLSearchParams(searchParams);

      Object.entries(patch as Record<string, QueryValue>).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      setSearchParams(next, { replace: options.replace ?? false });
    },
    [searchParams, setSearchParams],
  );

  const resetParams = useCallback(() => {
    setSearchParams(normalizeQueryParams(defaults), { replace: false });
  }, [defaults, setSearchParams]);

  return { params, setParams, resetParams };
}
