import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceGallery } from "./EvidenceGallery";
import { renderWithAppProviders } from "../../test/render";
import { evidenceMediaFixture } from "../../test/fixtures";

describe("EvidenceGallery", () => {
  it("uses thumbnail_url for preview images", () => {
    renderWithAppProviders(<EvidenceGallery media={[evidenceMediaFixture()]} />);

    const image = screen.getByAltText(/Evidence preview/i);
    expect(image).toHaveAttribute("src", "/api/v1/media/media-frame-001/thumbnail");
    expect(screen.getByText("image/jpeg")).toBeInTheDocument();
    expect(screen.getByText("1280 x 720")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open" })).toBeEnabled();
  });

  it("falls back to content_url when thumbnail_url is missing", () => {
    renderWithAppProviders(
      <EvidenceGallery
        media={[
          evidenceMediaFixture({
            thumbnail_url: null,
            thumbnail_content_type: null,
            thumbnail_width: null,
            thumbnail_height: null,
            thumbnail_available: false,
            thumbnail_status: "unsupported",
          }),
        ]}
      />,
    );

    expect(screen.getByAltText(/Evidence preview/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");
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
    expect(screen.getByRole("button", { name: "Open" })).toBeEnabled();
  });

  it("opens the evidence viewer with the original content_url", () => {
    renderWithAppProviders(<EvidenceGallery media={[evidenceMediaFixture()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByRole("dialog", { name: /media-fr/i })).toBeInTheDocument();
    expect(screen.getByText("Visual metadata")).toBeInTheDocument();
    expect(screen.getByAltText(/Evidence image/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");

    fireEvent.click(screen.getByRole("button", { name: "Close viewer" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("zooms in and resets the enhanced viewer", () => {
    renderWithAppProviders(<EvidenceGallery media={[evidenceMediaFixture()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByText("100%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));

    expect(screen.getByText("125%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));

    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("navigates previous and next between multiple evidence images without leaving the modal", () => {
    renderWithAppProviders(
      <EvidenceGallery
        media={[
          evidenceMediaFixture(),
          evidenceMediaFixture({
            ref: "s3://vigilante-frames/camera-1/frame-002.jpg",
            media_id: "media-frame-002",
            content_url: "/api/v1/media/media-frame-002/content",
            thumbnail_url: "/api/v1/media/media-frame-002/thumbnail",
            captured_at: "2026-01-01T10:05:00Z",
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Open" })[0]);

    expect(screen.getAllByText("1 / 2").length).toBeGreaterThan(0);
    expect(screen.getByAltText(/Evidence image/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");

    fireEvent.click(screen.getByRole("button", { name: "Next evidence" }));

    expect(screen.getAllByText("2 / 2").length).toBeGreaterThan(0);
    expect(screen.getByAltText(/Evidence image/i)).toHaveAttribute("src", "/api/v1/media/media-frame-002/content");

    fireEvent.click(screen.getByRole("button", { name: "Previous evidence" }));

    expect(screen.getAllByText("1 / 2").length).toBeGreaterThan(0);
    expect(screen.getByAltText(/Evidence image/i)).toHaveAttribute("src", "/api/v1/media/media-frame-001/content");
  });

  it("renders rich visual metadata without dumping raw JSON", () => {
    renderWithAppProviders(<EvidenceGallery media={[evidenceMediaFixture()]} />);

    fireEvent.click(screen.getByRole("button", { name: "Open" }));

    expect(screen.getByText("Identity and capture")).toBeInTheDocument();
    expect(screen.getByText("Image delivery")).toBeInTheDocument();
    expect(screen.getByText("Resolution state")).toBeInTheDocument();
    expect(screen.getByText("Operational timestamps")).toBeInTheDocument();
    expect(screen.getAllByText("Original content_url used in viewer").length).toBeGreaterThan(0);
    expect(screen.getByText("camera-1/frame-001.jpg")).toBeInTheDocument();
  });

  it("renders unresolved fallback when neither thumbnail nor content is available", () => {
    renderWithAppProviders(
      <EvidenceGallery
        media={[
          evidenceMediaFixture({
            resolved: false,
            content_url: null,
            thumbnail_url: null,
            proxy_url: null,
            error: "remote_object_not_found",
          }),
        ]}
        fallbackRefs={["s3://vigilante-frames/camera-1/frame-001.jpg"]}
      />,
    );

    expect(screen.getByText("Media could not be displayed")).toBeInTheDocument();
    expect(screen.getByText("Error: remote_object_not_found")).toBeInTheDocument();
  });
});
