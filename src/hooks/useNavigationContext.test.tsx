import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useNavigationContext } from "./useNavigationContext";
import { renderWithAppProviders } from "../test/render";

function NavigationProbe() {
  const navigation = useNavigationContext("/fallback");
  return (
    <div>
      <div data-testid="return-to">{navigation.returnTo}</div>
      <div data-testid="case-href">{navigation.caseHref("case-1")}</div>
      <div data-testid="review-href">{navigation.reviewHref("review-1")}</div>
    </div>
  );
}

describe("useNavigationContext", () => {
  it("preserves returnTo and builds contextual links", () => {
    renderWithAppProviders(<NavigationProbe />, "/timeline?returnTo=%2Fcases%3Fstatus%3Dopen&limit=50");

    expect(screen.getByTestId("return-to")).toHaveTextContent("/cases?status=open");
    const caseHref = screen.getByTestId("case-href").textContent ?? "";
    const reviewHref = screen.getByTestId("review-href").textContent ?? "";
    expect(caseHref.startsWith("/cases/case-1?")).toBe(true);
    expect(reviewHref.startsWith("/manual-reviews/review-1?")).toBe(true);
    expect(new URLSearchParams(caseHref.split("?")[1]).get("returnTo")).toBe(
      "/timeline?returnTo=%2Fcases%3Fstatus%3Dopen&limit=50",
    );
    expect(new URLSearchParams(reviewHref.split("?")[1]).get("returnTo")).toBe(
      "/timeline?returnTo=%2Fcases%3Fstatus%3Dopen&limit=50",
    );
  });
});
