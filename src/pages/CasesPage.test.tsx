import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CasesPage } from "./CasesPage";
import { renderWithAppProviders } from "../test/render";
import type { CaseRecord } from "../types/api";

function caseRecord(patch: Partial<CaseRecord>): CaseRecord {
  return {
    case_id: "case-1",
    case_code: "CASE-1",
    case_type: "unresolved_subject_case",
    title: "Case A",
    status: "open",
    db_status: "open",
    priority: 2,
    severity: "medium",
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
    case_payload: {},
    ...patch,
  };
}

describe("CasesPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            caseRecord({ case_id: "case-1", title: "Case A", assigned_to: "julio" }),
            caseRecord({ case_id: "case-2", title: "Case B", assigned_to: "maria" }),
            caseRecord({ case_id: "case-3", title: "Case C", assigned_to: null, assigned_at: null }),
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders a case list with ownership and persistent quick filters", async () => {
    renderWithAppProviders(<CasesPage />, "/cases?limit=25&offset=0");

    expect((await screen.findAllByText("Case A")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Assigned to me").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Org org-1").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Someone else" }));

    await waitFor(() => expect(screen.queryAllByText("Case A")).toHaveLength(0));
    expect(screen.getAllByText("Case B").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Case C")).toHaveLength(0);
  });
});
