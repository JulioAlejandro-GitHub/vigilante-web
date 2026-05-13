import { useCallback, useEffect, useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import type { ControlCenterOverview } from "../types/controlCenter.types";
import type { DashboardSummary, HealthResponse } from "../../../types/api";
import { asErrorMessage } from "../../../utils/format";

interface UseControlCenterOverviewOptions {
  assignedTo?: string;
  enabled?: boolean;
}

export function useControlCenterOverview({ assignedTo, enabled = true }: UseControlCenterOverviewOptions = {}): ControlCenterOverview {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setHealth(null);
      setSummary(null);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextHealth, nextSummary] = await Promise.all([
        controlCenterApi.health().catch(() => null),
        controlCenterApi.dashboardSummary(assignedTo),
      ]);
      setHealth(nextHealth);
      setSummary(nextSummary);
    } catch (caught) {
      setError(asErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, [assignedTo, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    health,
    summary,
    loading,
    error,
    refresh: () => void load(),
  };
}
