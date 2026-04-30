import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { TimelineEventDetailPage } from "./TimelineEventDetailPage";
import { renderWithAppProviders } from "../test/render";
import { evidenceMediaFixture, timelineEventFixture } from "../test/fixtures";

describe("TimelineEventDetailPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify(
              timelineEventFixture({
                evidence_media: [
                  evidenceMediaFixture({ media_id: "media-timeline-001" }),
                  evidenceMediaFixture({
                    ref: "s3://vigilante-frames/camera-1/frame-002.jpg",
                    media_id: "media-timeline-002",
                    content_url: "/api/v1/media/media-timeline-002/content",
                    thumbnail_url: "/api/v1/media/media-timeline-002/thumbnail",
                    captured_at: "2026-01-01T10:05:00Z",
                  }),
                ],
              }),
            ),
            { status: 200 },
          ),
      ),
    );
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
    expect(screen.getByText("Visual evidence")).toBeInTheDocument();
    expect(screen.getByText("Temporal clips")).toBeInTheDocument();
    expect(screen.getAllByText("Clip available").length).toBeGreaterThan(0);
    expect(screen.getAllByAltText(/Evidence preview/i)[0]).toHaveAttribute("src", "/api/v1/media/media-frame-001/thumbnail");
    expect(screen.getByText("Event metadata")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back to context/i })).toHaveAttribute("href", "/timeline?event_group=technical");
    expect(screen.getAllByRole("link", { name: /Review/i })[0]).toHaveAttribute("href", expect.stringContaining("/manual-reviews/review-1"));
    expect(screen.getAllByRole("link", { name: /Suggestion/i })[0]).toHaveAttribute("href", expect.stringContaining("/case-suggestions/suggestion-1"));

    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);

    expect(screen.getByText("Visual metadata")).toBeInTheDocument();
    expect(screen.getAllByText("1 / 2").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Next evidence" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Close viewer" }));
    fireEvent.click(screen.getAllByRole("button", { name: /Open clip/i })[0]);

    expect(screen.getByLabelText(/Evidence clip/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/clip/content");
  });
});
