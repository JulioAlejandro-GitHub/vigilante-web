import { useMemo } from "react";
import { useLocation } from "react-router-dom";

interface LocationState {
  returnTo?: string;
}

function appendQueryParam(to: string, key: string, value: string) {
  const [pathname, query = ""] = to.split("?");
  const params = new URLSearchParams(query);
  params.set(key, value);
  const nextQuery = params.toString();
  return nextQuery ? `${pathname}?${nextQuery}` : pathname;
}

function decodeReturnTo(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function useNavigationContext(fallback = "/dashboard") {
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}`;
  const searchParams = new URLSearchParams(location.search);
  const stateReturnTo = (location.state as LocationState | null)?.returnTo;
  const returnTo = decodeReturnTo(searchParams.get("returnTo")) ?? stateReturnTo ?? fallback;

  return useMemo(
    () => ({
      currentPath,
      returnTo,
      withReturnTo: (to: string, explicitReturnTo = currentPath) => appendQueryParam(to, "returnTo", explicitReturnTo),
      caseHref: (caseId: string, explicitReturnTo = currentPath) => appendQueryParam(`/cases/${caseId}`, "returnTo", explicitReturnTo),
      reviewHref: (reviewId: string) => appendQueryParam("/manual-reviews", "review_id", reviewId),
      suggestionHref: (suggestionId: string) => appendQueryParam("/case-suggestions", "suggestion_id", suggestionId),
      timelineEventHref: (sourceEventId: string) => appendQueryParam("/timeline", "source_event_id", sourceEventId),
    }),
    [currentPath, returnTo],
  );
}
