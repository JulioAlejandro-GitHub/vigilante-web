import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ControlCenterPage } from "./ControlCenterPage";
import { renderWithAppProviders } from "../../test/render";
import { evidenceMediaFixture, timelineEventFixture } from "../../test/fixtures";
import type { CaseDetail, CaseRecord, TimelineEvent } from "../../types/api";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function caseRecord(patch: Partial<CaseRecord> = {}): CaseRecord {
  return {
    case_id: "case-1",
    case_code: "CASE-1",
    case_type: "multi_event_tracking",
    title: "Repeated observed subject",
    status: "open",
    db_status: "open",
    priority: 2,
    severity: "high",
    source_suggestion_id: "suggestion-1",
    source_event_id: "event-1",
    primary_subject_id: "subject-1",
    primary_camera_id: "camera-1",
    opened_at: "2026-01-01T10:00:00Z",
    closed_at: null,
    updated_at: "2026-01-01T10:03:00Z",
    assigned_to: null,
    assigned_by: null,
    assigned_at: null,
    assignment_reason: null,
    organization_id: "org-1",
    site_id: "site-1",
    case_payload: {
      suggested_reason: "Repeated unresolved subject near restricted access.",
      semantic_summary: "Subject appeared near a restricted access point.",
    },
    evidence_media: [evidenceMediaFixture({ media_id: "media-case-001", camera_id: "camera-1" })],
    ...patch,
  };
}

function caseDetail(patch: Partial<CaseDetail> = {}): CaseDetail {
  const base = caseRecord(patch);
  return {
    ...base,
    notes: [],
    reviews: [],
    suggestions: [],
    timeline: [timelineEventFixture({ case_id: base.case_id, camera_id: base.primary_camera_id, source_event_id: base.source_event_id ?? "event-1" })],
    ...patch,
  };
}

function installFetch(events: TimelineEvent[], cases: Record<string, CaseDetail>) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith("/health")) {
        return jsonResponse({ status: "ok", app: "vigilante-api", env: "test", projection_strategy: "timeline_event_payload" });
      }
      if (url.includes("/api/v1/dashboard/summary")) {
        return jsonResponse({
          total_cases: 2,
          open_cases: 1,
          under_review_cases: 1,
          unassigned_cases: 1,
          assigned_cases: 1,
          cases_assigned_to_user: 0,
          pending_manual_reviews: 1,
          pending_case_suggestions: 1,
        });
      }
      if (url.includes("/api/v1/cameras")) {
        return jsonResponse([
          {
            camera_id: "camera-1",
            external_camera_key: "cam-lobby",
            site_id: "site-1",
            zone_id: null,
            name: "Camera Lobby",
            is_active: true,
            source_type: "rtsp",
            camera_hostname: "camera-1.local",
            camera_port: 554,
            camera_path: null,
            rtsp_transport: "tcp",
            channel: null,
            subtype: null,
            camera_user: "operator",
            metadata: { fps: 12, latency_ms: 88 },
          },
          {
            camera_id: "camera-2",
            external_camera_key: "cam-door",
            site_id: "site-1",
            zone_id: null,
            name: "Camera Door",
            is_active: true,
            source_type: "rtsp",
            camera_hostname: "camera-2.local",
            camera_port: 554,
            camera_path: null,
            rtsp_transport: "tcp",
            channel: null,
            subtype: null,
            camera_user: "operator",
            metadata: { status: "degraded" },
          },
        ]);
      }
      const timelineEvidenceMatch = url.match(/\/api\/v1\/timeline\/([^/?]+)\/evidence/);
      if (timelineEvidenceMatch) {
        return jsonResponse({
          items: [
            evidenceMediaFixture({
              media_id: `preview-${timelineEvidenceMatch[1]}`,
              camera_id: events.find((event) => event.source_event_id === timelineEvidenceMatch[1])?.camera_id ?? "camera-1",
            }),
          ],
          limit: 1,
          offset: 0,
          next_offset: null,
          total_refs: 1,
        });
      }
      if (url.includes("/api/v1/timeline")) {
        return jsonResponse(events);
      }
      const caseEvidenceMatch = url.match(/\/api\/v1\/cases\/([^/?]+)\/evidence/);
      if (caseEvidenceMatch) {
        return jsonResponse({
          items: cases[caseEvidenceMatch[1]]?.evidence_media ?? [],
          limit: 6,
          offset: 0,
          next_offset: null,
          total_refs: cases[caseEvidenceMatch[1]]?.evidence_media?.length ?? 0,
        });
      }
      const caseTimelineMatch = url.match(/\/api\/v1\/cases\/([^/?]+)\/timeline/);
      if (caseTimelineMatch) {
        return jsonResponse(cases[caseTimelineMatch[1]]?.timeline ?? []);
      }
      const caseMatch = url.match(/\/api\/v1\/cases\/([^/?]+)/);
      if (caseMatch) {
        return jsonResponse(cases[caseMatch[1]]);
      }
      return jsonResponse({});
    }),
  );
}

describe("ControlCenterPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the live control center with prioritized events, evidence, insights and actions", async () => {
    const events = [
      timelineEventFixture({
        source_event_id: "event-2",
        event_type: "recognition.manual_review_required",
        event_ts: "2026-01-01T10:00:00Z",
        case_id: "case-2",
        camera_id: "camera-2",
        severity: "high",
        summary: "Identity conflict at restricted door",
        payload: {
          review_id: "review-2",
          review_type: "identity_conflict",
          source_event_type: "recognition.manual_review_required",
          confidence: 0.93,
          evidence_count: 3,
          face_detection: { status: "detected", usable: true, confidence: 0.93 },
          semantic_descriptor: { summary: "Persona con gorra roja y chaqueta azul cerca de acceso restringido." },
        },
        evidence_media: [],
      }),
      timelineEventFixture({
        source_event_id: "event-1",
        event_ts: "2026-01-01T10:05:00Z",
        case_id: "case-1",
        camera_id: "camera-1",
        severity: "low",
        confidence: 0.66,
        summary: "Routine lobby movement",
        payload: {
          confidence: 0.66,
          evidence_count: 1,
          semantic_descriptor: { summary: "Movimiento humano rutinario en lobby." },
        },
        evidence_media: [],
      }),
    ];
    installFetch(events, {
      "case-1": caseDetail(),
      "case-2": caseDetail({
        case_id: "case-2",
        case_code: "CASE-2",
        title: "Identity conflict at restricted door",
        severity: "high",
        source_event_id: "event-2",
        primary_camera_id: "camera-2",
        primary_subject_id: "subject-2",
        case_payload: {
          suggested_reason: "Identity conflict requires human action.",
          semantic_summary: "Persona con gorra roja y chaqueta azul cerca de acceso restringido.",
        },
        evidence_media: [evidenceMediaFixture({ media_id: "media-case-002", camera_id: "camera-2" })],
      }),
    });

    renderWithAppProviders(<ControlCenterPage />, "/control-center");

    expect(await screen.findByText("Centro de Control Vigilante")).toBeInTheDocument();
    expect(screen.getByText("Mosaico vivo de cámaras")).toBeInTheDocument();
    expect(screen.getByText("Cola viva de eventos")).toBeInTheDocument();
    expect(await screen.findByText("Camera Lobby")).toBeInTheDocument();
    expect(screen.getByText("Camera Door")).toBeInTheDocument();

    const cards = await screen.findAllByTestId("priority-event-card");
    expect(cards[0]).toHaveTextContent("Conflicto de identidad");
    expect(cards[0]).toHaveAttribute("data-priority-tier", "critical");
    expect(cards[1]).toHaveTextContent("Sugerencia de caso");

    const timelineUrl = fetchUrls().find((url) => url.includes("/api/v1/timeline?"));
    expect(timelineUrl).toContain("limit=20");
    expect(timelineUrl).toContain("include_evidence=false");
    expect(fetchUrls().find((url) => url.includes("/api/v1/cameras?"))).toContain("limit=6");

    expect(await screen.findByText("CASE-2")).toBeInTheDocument();
    expect(screen.getByText("Evidencia visual principal")).toBeInTheDocument();
    expect(screen.getByText("Insight de recognition")).toBeInTheDocument();
    expect(screen.getByText("Acciones del operador")).toBeInTheDocument();
    expect(screen.getAllByText("Persona con gorra roja y chaqueta azul cerca de acceso restringido.").length).toBeGreaterThan(0);
    expect(screen.getByText("Vincular perfil")).toBeInTheDocument();
    expect(screen.getByText("Marcar sospechoso")).toBeInTheDocument();
    expect(screen.getByText("Merge caso")).toBeInTheDocument();
    expect(screen.getByText("Resolver benigno")).toBeInTheDocument();
    expect(screen.getByText("Abrir revisión")).toBeInTheDocument();
    expect(screen.getByText("Ver detalle completo")).toBeInTheDocument();
    await waitFor(() => expect(fetchUrls().some((url) => url.includes("/api/v1/cases/case-2?") && url.includes("expand=summary"))).toBe(true));
    expect(fetchUrls().some((url) => url.includes("/api/v1/cases/case-2/evidence") && url.includes("limit=6"))).toBe(true);
    await waitFor(() => expect(fetchUrls().some((url) => url.includes("/api/v1/timeline/event-2/evidence") && url.includes("limit=1"))).toBe(true));

    fireEvent.click(cards[1]);

    await waitFor(() => expect(screen.getByText("CASE-1")).toBeInTheDocument());
    expect(screen.getAllByText("Movimiento humano rutinario en lobby.").length).toBeGreaterThan(0);
  });
});

function fetchUrls() {
  return vi.mocked(fetch).mock.calls.map(([input]) => String(input));
}
