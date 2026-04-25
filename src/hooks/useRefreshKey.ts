import { useCallback, useState } from "react";

export function useRefreshKey() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  return { refreshKey, refresh };
}
