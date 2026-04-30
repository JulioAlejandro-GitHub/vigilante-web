import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceGallery } from "./EvidenceGallery";
import { renderWithAppProviders } from "../../test/render";
import { evidenceMediaFixture } from "../../test/fixtures";

describe("EvidenceGallery", () => {
  it("renders real image evidence when content_url exists", () => {
    renderWithAppProviders(<EvidenceGallery media={[evidenceMediaFixture()]} />);

    const image = screen.getByAltText(/Evidence preview/i);
    expect(image).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");
    expect(screen.getByText("image/jpeg")).toBeInTheDocument();
    expect(screen.getByText("1280 x 720")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeEnabled();
  });

  it("falls back to evidence refs when evidence_media is missing", () => {
    renderWithAppProviders(<EvidenceGallery fallbackRefs={["s3://bucket/camera/frame.jpg"]} sourceEventId="event-1" />);

    expect(screen.getByText("Media not resolved yet")).toBeInTheDocument();
    expect(screen.getByText("s3://bucket/camera/frame.jpg")).toBeInTheDocument();
    expect(screen.getByText("Source event: event-1")).toBeInTheDocument();
  });

  it("shows an image fallback when the preview URL fails", () => {
    renderWithAppProviders(<EvidenceGallery media={[evidenceMediaFixture()]} />);

    fireEvent.error(screen.getByAltText(/Evidence preview/i));

    expect(screen.getByText("Image preview unavailable")).toBeInTheDocument();
    expect(screen.getByText("The image URL failed to load. Technical evidence remains available below.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeDisabled();
  });

  it("opens and closes the evidence viewer", () => {
    renderWithAppProviders(<EvidenceGallery media={[evidenceMediaFixture()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("dialog", { name: /media-fr/i })).toBeInTheDocument();
    expect(screen.getByText("Media metadata")).toBeInTheDocument();
    expect(screen.getByAltText(/Evidence image/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");

    fireEvent.click(screen.getByRole("button", { name: "Close viewer" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
