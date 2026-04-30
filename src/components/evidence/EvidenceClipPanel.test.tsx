import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceClipPanel } from "./EvidenceClipPanel";
import { EvidenceClipPlayer } from "./EvidenceClipPlayer";
import { renderWithAppProviders } from "../../test/render";
import { evidenceMediaFixture } from "../../test/fixtures";

describe("EvidenceClipPanel", () => {
  it("renders clip availability and a native video player", () => {
    renderWithAppProviders(<EvidenceClipPanel media={[evidenceMediaFixture()]} />);

    expect(screen.getByTestId("evidence-clip-panel")).toBeInTheDocument();
    expect(screen.getAllByText("Clip available").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /Open clip/i })).toBeInTheDocument();

    const video = screen.getByLabelText(/Evidence clip/i);
    expect(video).toHaveAttribute("controls");
    expect(video).toHaveAttribute("src", "/api/v1/media/media-frame-001/clip/content");
  });

  it("does not render the panel when no clip exists", () => {
    renderWithAppProviders(
      <EvidenceClipPanel
        media={[
          evidenceMediaFixture({
            clip_available: false,
            clip_status: "insufficient_frames",
            clip_url: null,
          }),
        ]}
      />,
    );

    expect(screen.queryByTestId("evidence-clip-panel")).not.toBeInTheDocument();
  });

  it("falls back to the image when clip playback fails", () => {
    renderWithAppProviders(<EvidenceClipPlayer item={evidenceMediaFixture()} />);

    fireEvent.error(screen.getByLabelText(/Evidence clip/i));

    expect(screen.getByText("Clip unavailable")).toBeInTheDocument();
    expect(screen.getByText("Status: clip_load_error")).toBeInTheDocument();
    expect(screen.getByAltText(/Evidence fallback/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");
  });
});
