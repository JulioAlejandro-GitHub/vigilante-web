import { useCallback, useEffect, useState } from "react";

import { controlCenterApi } from "../services/controlCenterApi";
import type { ControlCenterCaseBundle } from "../types/controlCenter.types";
import type { CaseDetail } from "../../../types/api";
import { asErrorMessage } from "../../../utils/format";

export function useControlCenterCases(caseId: string | null): ControlCenterCaseBundle {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      if (!caseId) {
        setDetail(null);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      if (mode === "initial") {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(null);
      try {
        const next = await controlCenterApi.getCase(caseId);
        setDetail(next);
      } catch (caught) {
        setError(asErrorMessage(caught));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [caseId],
  );

  useEffect(() => {
    void load("initial");
  }, [load]);

  return {
    detail,
    loading,
    refreshing,
    error,
    refresh: () => void load("refresh"),
  };
}
