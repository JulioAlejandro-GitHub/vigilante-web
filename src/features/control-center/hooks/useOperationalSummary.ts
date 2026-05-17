import { useControlCenterOverview } from "./useControlCenterOverview";

interface UseOperationalSummaryOptions {
  assignedTo?: string;
  enabled?: boolean;
}

export function useOperationalSummary(options: UseOperationalSummaryOptions = {}) {
  return useControlCenterOverview(options);
}
