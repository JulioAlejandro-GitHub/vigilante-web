import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceWorkspace } from "./EvidenceWorkspace";
import { renderWithAppProviders } from "../../test/render";
import { evidenceMediaFixture } from "../../test/fixtures";

describe("EvidenceWorkspace", () => {
  it("shows quick summary, structured evidence and real media layout", () => {
    renderWithAppProviders(
      <EvidenceWorkspace
        sourceEventId="event-1"
        evidenceMedia={[evidenceMediaFixture()]}
        payload={{
          confidence: 0.91,
          evidence_count: 3,
          evidence_refs: ["s3://vigilante-frames/camera-1/frame-001.jpg"],
          face_detection: { status: "detected", confidence: 0.91 },
          semantic_descriptor: { summary: "person near restricted door" },
          generation_trace: { model: "mock-model" },
        }}
      />,
    );

    expect(screen.getByText("Evidence workspace")).toBeInTheDocument();
    expect(screen.getAllByText("Confidence").length).toBeGreaterThan(0);
    expect(screen.getByText("Face detection")).toBeInTheDocument();
    expect(screen.getByText("Semantic descriptor")).toBeInTheDocument();
    expect(screen.getByText("Visual evidence")).toBeInTheDocument();
    expect(screen.getByAltText(/Evidence preview/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");
  });
});
