import { useCallback, useEffect, useState } from "react";

export function useAsyncData<T>(loader: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const refresh = useCallback(() => setRefreshIndex((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loader()
      .then((value) => {
        if (active) {
          setData(value);
        }
      })
      .catch((caught: unknown) => {
        if (active) {
          setError(caught instanceof Error ? caught.message : "Unexpected error");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refreshIndex]);

  return { data, loading, error, refresh };
}
