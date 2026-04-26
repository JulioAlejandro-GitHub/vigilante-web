import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceWorkspace } from "./EvidenceWorkspace";
import { renderWithAppProviders } from "../../test/render";

describe("EvidenceWorkspace", () => {
  it("shows quick summary, structured evidence and media-ready layout", () => {
    renderWithAppProviders(
      <EvidenceWorkspace
        sourceEventId="event-1"
        payload={{
          confidence: 0.91,
          evidence_count: 3,
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
    expect(screen.getByText("Media-ready evidence")).toBeInTheDocument();
    expect(screen.getByText("Media evidence slot")).toBeInTheDocument();
  });
});
