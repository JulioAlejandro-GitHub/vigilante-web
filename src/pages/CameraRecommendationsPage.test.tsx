import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CameraRecommendationsPage } from "./CameraRecommendationsPage";
import { renderWithAppProviders } from "../test/render";
import { cameraRecommendationFixture, cameraRecommendationPreviewFixture } from "../test/fixtures";
import type { CameraRecommendation } from "../types/api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function recommendationIdFromUrl(url: string) {
  const match = url.match(/camera-recommendations\/([^/]+)/);
  return match?.[1] ?? "rec-face-quality";
}

function installRecommendationFetch(recommendations: CameraRecommendation[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      const id = recommendationIdFromUrl(url);
      const recommendation = recommendations.find((item) => item.recommendation_id === id) ?? recommendations[0];

      if (url.endsWith("/preview")) {
        return jsonResponse(cameraRecommendationPreviewFixture(recommendation));
      }
      if (/\/api\/v1\/camera-recommendations\/[^/?]+$/.test(url)) {
        return jsonResponse(recommendation);
      }
      return jsonResponse(recommendations);
    }),
  );
}

describe("CameraRecommendationsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the list, filters results, opens detail and shows patch preview", async () => {
    const recommendations = [
      cameraRecommendationFixture(),
      cameraRecommendationFixture({
        recommendation_id: "rec-vlm-lighting",
        camera_id: "camera-2",
        status: "approved",
        recommendation_type: "vlm_policy",
        severity: "high",
        title: "Tune VLM policy",
        reason: "Lighting changes require a different VLM policy.",
        suggested_value: { preferred_model: "vlm-night" },
        metadata_paths: ["api.camera.metadata.recognition.vlm.preferred_model"],
      }),
    ];
    installRecommendationFetch(recommendations);

    renderWithAppProviders(<CameraRecommendationsPage />, "/camera-recommendations");

    expect((await screen.findAllByText("Lower face quality threshold")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Recent metrics show low quality face detections on camera-1.").length).toBeGreaterThan(0);
    expect(await screen.findByText("Patch preview")).toBeInTheDocument();
    expect(screen.getAllByText("api.camera.metadata.recognition.face_quality_threshold").length).toBeGreaterThan(0);
    expect(screen.getByText("Recommendation evidence")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "vlm_policy" } });
    fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "high" } });
    fireEvent.change(screen.getByLabelText("Search"), { target: { value: "lighting" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));

    await waitFor(() => expect(screen.queryAllByText("Lower face quality threshold")).toHaveLength(0));
    expect(screen.getAllByText("Tune VLM policy").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Lighting changes require a different VLM policy.").length).toBeGreaterThan(0);
  });

  it("approves, applies and rolls back through API workflow actions", async () => {
    let recommendation = cameraRecommendationFixture();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (init?.method === "POST" && url.endsWith("/approve")) {
        recommendation = {
          ...recommendation,
          status: "approved",
          workflow: {
            last_event_type: "camera_recommendation_approved",
            actor: "julio",
            comment: "looks good",
            occurred_at: "2026-01-01T11:00:00Z",
          },
        };
        return jsonResponse(recommendation);
      }
      if (init?.method === "POST" && url.endsWith("/apply")) {
        recommendation = {
          ...recommendation,
          status: "applied",
          workflow: {
            last_event_type: "camera_recommendation_applied",
            actor: "julio",
            occurred_at: "2026-01-01T11:05:00Z",
            result: { status: "applied", patch_count: 1 },
          },
        };
        return jsonResponse({
          recommendation,
          applied: true,
          patches: cameraRecommendationPreviewFixture(recommendation).patches,
          metadata_hash_before: "hash-before",
          metadata_hash_after: "hash-after",
          error: null,
        });
      }
      if (init?.method === "POST" && url.endsWith("/rollback")) {
        recommendation = {
          ...recommendation,
          status: "rolled_back",
          workflow: {
            last_event_type: "camera_recommendation_rolled_back",
            actor: "julio",
            comment: "restore previous metadata",
            occurred_at: "2026-01-01T11:10:00Z",
          },
        };
        return jsonResponse({
          recommendation,
          applied: true,
          patches: cameraRecommendationPreviewFixture(recommendation).patches,
          metadata_hash_before: "hash-after",
          metadata_hash_after: "hash-before",
          error: null,
        });
      }
      if (url.endsWith("/preview")) {
        return jsonResponse(cameraRecommendationPreviewFixture(recommendation));
      }
      if (/\/api\/v1\/camera-recommendations\/[^/?]+$/.test(url)) {
        return jsonResponse(recommendation);
      }
      return jsonResponse([recommendation]);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithAppProviders(<CameraRecommendationsPage />, "/camera-recommendations");

    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));
    fireEvent.change(screen.getByLabelText("Comment optional"), { target: { value: "looks good" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm approve" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/v1/camera-recommendations/rec-face-quality/approve", expect.any(Object)));
    expect(await screen.findByText("Approve completed.")).toBeInTheDocument();
    expect(JSON.parse(String(fetchMock.mock.calls.find(([url]) => String(url).endsWith("/approve"))?.[1]?.body))).toEqual({
      comment: "looks good",
    });

    fireEvent.click(await screen.findByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm apply" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/v1/camera-recommendations/rec-face-quality/apply", expect.any(Object)));
    expect(await screen.findByText("Apply completed.")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Rollback" }));
    fireEvent.change(screen.getByLabelText("Comment optional"), { target: { value: "restore previous metadata" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rollback" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/v1/camera-recommendations/rec-face-quality/rollback", expect.any(Object)));
    expect(await screen.findByText("Rollback completed.")).toBeInTheDocument();
    expect(screen.getAllByText("rolled_back").length).toBeGreaterThan(0);
  });

  it("rejects a pending recommendation with an optional comment", async () => {
    let recommendation = cameraRecommendationFixture();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (init?.method === "POST" && url.endsWith("/reject")) {
        recommendation = {
          ...recommendation,
          status: "rejected",
          workflow: {
            last_event_type: "camera_recommendation_rejected",
            actor: "julio",
            comment: "not enough evidence",
            occurred_at: "2026-01-01T11:00:00Z",
          },
        };
        return jsonResponse(recommendation);
      }
      if (url.endsWith("/preview")) {
        return jsonResponse(cameraRecommendationPreviewFixture(recommendation));
      }
      if (/\/api\/v1\/camera-recommendations\/[^/?]+$/.test(url)) {
        return jsonResponse(recommendation);
      }
      return jsonResponse([recommendation]);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithAppProviders(<CameraRecommendationsPage />, "/camera-recommendations");

    fireEvent.click(await screen.findByRole("button", { name: "Reject" }));
    fireEvent.change(screen.getByLabelText("Comment optional"), { target: { value: "not enough evidence" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm reject" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/v1/camera-recommendations/rec-face-quality/reject", expect.any(Object)));
    expect(await screen.findByText("Reject completed.")).toBeInTheDocument();
    expect(screen.getAllByText("rejected").length).toBeGreaterThan(0);
  });

  it("shows API errors without breaking the detail view", async () => {
    let recommendation = cameraRecommendationFixture({ status: "approved" });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (init?.method === "POST" && url.endsWith("/apply")) {
        recommendation = {
          ...recommendation,
          status: "failed",
          last_error: "Recommendation is stale for api.camera.metadata.recognition.face_quality_threshold",
          workflow: {
            last_event_type: "camera_recommendation_failed",
            actor: "julio",
            occurred_at: "2026-01-01T11:00:00Z",
            result: { error: "stale" },
          },
        };
        return jsonResponse({ detail: "Recommendation is stale for api.camera.metadata.recognition.face_quality_threshold" }, 422);
      }
      if (url.endsWith("/preview")) {
        return jsonResponse(cameraRecommendationPreviewFixture(recommendation, { applicable: false, validation_errors: ["stale_current_value"] }));
      }
      if (/\/api\/v1\/camera-recommendations\/[^/?]+$/.test(url)) {
        return jsonResponse(recommendation);
      }
      return jsonResponse([recommendation]);
    });
    vi.stubGlobal("fetch", fetchMock);

    renderWithAppProviders(<CameraRecommendationsPage />, "/camera-recommendations");

    fireEvent.click(await screen.findByRole("button", { name: "Apply" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm apply" }));

    expect((await screen.findAllByText("Recommendation is stale for api.camera.metadata.recognition.face_quality_threshold")).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getAllByText("failed").length).toBeGreaterThan(0));
    expect(screen.getByText("Recommendation detail")).toBeInTheDocument();
  });
});
