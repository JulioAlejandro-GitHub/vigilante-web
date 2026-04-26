import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { ManualReviewDetailPage } from "./ManualReviewDetailPage";
import { renderWithAppProviders } from "../test/render";
import { manualReviewFixture } from "../test/fixtures";

describe("ManualReviewDetailPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        if (init?.method === "POST") {
          return new Response(JSON.stringify(manualReviewFixture({ status: "approved", decision: "approved" })), { status: 200 });
        }
        return new Response(JSON.stringify(manualReviewFixture()), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a dedicated review route and resolves from detail", async () => {
    renderWithAppProviders(
      <Routes>
        <Route path="/manual-reviews/:reviewId" element={<ManualReviewDetailPage />} />
      </Routes>,
      "/manual-reviews/review-1?returnTo=%2Fmanual-reviews%3Fstatus%3Dpending",
    );

    expect(await screen.findByText("Manual review")).toBeInTheDocument();
    expect(screen.getAllByText("identity_conflict").length).toBeGreaterThan(0);
    expect(screen.getByText("Review evidence workspace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to context/i })).toHaveAttribute("href", "/manual-reviews?status=pending");
    expect(screen.getAllByRole("link", { name: /event-1|Timeline event/i })[0]).toHaveAttribute("href", expect.stringContaining("/timeline/event-1"));

    fireEvent.click(screen.getByRole("button", { name: "Resolve review" }));

    await waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/v1/manual-reviews/review-1/resolve", expect.any(Object)));
    expect(await screen.findByText("Review resolved")).toBeInTheDocument();
  });
});
