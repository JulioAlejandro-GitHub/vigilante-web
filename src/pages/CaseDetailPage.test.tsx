import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route, Routes } from "react-router-dom";

import { CaseDetailPage } from "./CaseDetailPage";
import { renderWithAppProviders } from "../test/render";
import { evidenceMediaFixture } from "../test/fixtures";
import type { CaseDetail, TimelineEvent } from "../types/api";

const detail: CaseDetail = {
  case_id: "case-1",
  case_code: "CASE-1",
  case_type: "unresolved_subject_case",
  title: "Evidence rich case",
  status: "in_review",
  db_status: "in_review",
  priority: 1,
  severity: "high",
  source_suggestion_id: null,
  source_event_id: "event-1",
  primary_subject_id: "subject-1",
  primary_camera_id: "camera-1",
  opened_at: "2026-01-01T10:00:00Z",
  closed_at: null,
  updated_at: "2026-01-02T10:00:00Z",
  assigned_to: "julio",
  assigned_by: "julio",
  assigned_at: "2026-01-01T11:00:00Z",
  assignment_reason: "test",
  organization_id: "org-1",
  site_id: "site-1",
  case_payload: {
    confidence: 0.91,
    evidence_refs: ["s3://vigilante-frames/camera-1/frame-001.jpg"],
    face_detection: { status: "detected", confidence: 0.91 },
    semantic_descriptor: { summary: "person near restricted access" },
  },
  evidence_media: [
    evidenceMediaFixture({ media_id: "media-case-001" }),
    evidenceMediaFixture({
      ref: "s3://vigilante-frames/camera-1/frame-002.jpg",
      media_id: "media-case-002",
      content_url: "/api/v1/media/media-case-002/content",
      thumbnail_url: "/api/v1/media/media-case-002/thumbnail",
      captured_at: "2026-01-01T10:05:00Z",
    }),
  ],
  notes: [],
  reviews: [],
  suggestions: [],
  timeline: [],
};

const timeline: TimelineEvent[] = [
  {
    source_event_id: "event-1",
    event_type: "case_assigned",
    event_ts: "2026-01-01T11:00:00Z",
    case_id: "case-1",
    camera_id: "camera-1",
    subject_id: "subject-1",
    track_id: null,
    severity: "high",
    confidence: null,
    summary: "Case assigned",
    payload: { case_assignment: { assigned_to: "julio", assigned_by: "julio", assigned_at: "2026-01-01T11:00:00Z" } },
    source_component: "vigilante-api",
    organization_id: "org-1",
    site_id: "site-1",
  },
];

describe("CaseDetailPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/timeline")) {
          return new Response(JSON.stringify(timeline), { status: 200 });
        }
        if (url.includes("/notes") || url.includes("/reviews") || url.includes("/suggestions")) {
          return new Response(JSON.stringify([]), { status: 200 });
        }
        return new Response(JSON.stringify(detail), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders case detail evidence with real image media", async () => {
    renderWithAppProviders(
      <Routes>
        <Route path="/cases/:caseId" element={<CaseDetailPage />} />
      </Routes>,
      "/cases/case-1?tab=evidence",
    );

    expect((await screen.findAllByText("Evidence rich case")).length).toBeGreaterThan(0);
    expect(screen.getByText("Case evidence and source context")).toBeInTheDocument();
    expect(screen.getByText("Visual evidence")).toBeInTheDocument();
    expect(screen.getAllByAltText(/Evidence preview/i)[0]).toHaveAttribute("src", "/api/v1/media/media-frame-001/thumbnail");
    expect(screen.getByText("Face detection")).toBeInTheDocument();
    expect(screen.getAllByText("Org org-1").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);

    expect(screen.getByText("Visual metadata")).toBeInTheDocument();
    expect(screen.getAllByText("1 / 2").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Next evidence" }));

    expect(screen.getAllByText("2 / 2").length).toBeGreaterThan(0);
    expect(screen.getByAltText(/Evidence image/i)).toHaveAttribute("src", "/api/v1/media/media-case-002/content");
  });
});
