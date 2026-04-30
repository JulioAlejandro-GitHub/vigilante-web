import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { CaseSuggestionDetailPage } from "./CaseSuggestionDetailPage";
import { renderWithAppProviders } from "../test/render";
import { caseSuggestionFixture } from "../test/fixtures";

describe("CaseSuggestionDetailPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(caseSuggestionFixture()), { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a dedicated suggestion route with related case and timeline links", async () => {
    renderWithAppProviders(
      <Routes>
        <Route path="/case-suggestions/:suggestionId" element={<CaseSuggestionDetailPage />} />
      </Routes>,
      "/case-suggestions/suggestion-1?returnTo=%2Fcase-suggestions%3Fstatus%3Dpending",
    );

    expect(await screen.findByText("Case suggestion")).toBeInTheDocument();
    expect(screen.getAllByText("unresolved_subject_case").length).toBeGreaterThan(0);
    expect(screen.getByText("Suggestion evidence workspace")).toBeInTheDocument();
    expect(screen.getByText("Visual evidence")).toBeInTheDocument();
    expect(screen.getByAltText(/Evidence preview/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/thumbnail");
    expect(screen.getByRole("link", { name: /Back to context/i })).toHaveAttribute("href", "/case-suggestions?status=pending");
    expect(screen.getByRole("link", { name: /Related case/i })).toHaveAttribute("href", expect.stringContaining("/cases/case-1"));
  });
});
