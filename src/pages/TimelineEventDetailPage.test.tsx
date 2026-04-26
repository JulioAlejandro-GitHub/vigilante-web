import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { TimelineEventDetailPage } from "./TimelineEventDetailPage";
import { renderWithAppProviders } from "../test/render";
import { timelineEventFixture } from "../test/fixtures";

describe("TimelineEventDetailPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(timelineEventFixture()), { status: 200 })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a dedicated timeline event route with forensic links", async () => {
    renderWithAppProviders(
      <Routes>
        <Route path="/timeline/:sourceEventId" element={<TimelineEventDetailPage />} />
      </Routes>,
      "/timeline/event-1?returnTo=%2Ftimeline%3Fevent_group%3Dtechnical",
    );

    expect(await screen.findByText("Case suggestion created from recognition evidence")).toBeInTheDocument();
    expect(screen.getByText("Timeline evidence workspace")).toBeInTheDocument();
    expect(screen.getByText("Event metadata")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to context/i })).toHaveAttribute("href", "/timeline?event_group=technical");
    expect(screen.getAllByRole("link", { name: /Review/i })[0]).toHaveAttribute("href", expect.stringContaining("/manual-reviews/review-1"));
    expect(screen.getAllByRole("link", { name: /Suggestion/i })[0]).toHaveAttribute("href", expect.stringContaining("/case-suggestions/suggestion-1"));
  });
});
