import { fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssignmentActions } from "./AssignmentActions";
import { renderWithAppProviders } from "../../test/render";

describe("AssignmentActions", () => {
  let resolveFetch: (response: Response) => void;

  beforeEach(() => {
    window.localStorage.clear();
    const fetchPromise = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(() => fetchPromise),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("assigns a case to the current user and disables submit while running", async () => {
    const onChanged = vi.fn();
    renderWithAppProviders(<AssignmentActions caseId="case-1" currentOwner={null} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole("button", { name: "Assign to me" }));

    expect(screen.getByRole("button", { name: "Assigning..." })).toBeDisabled();
    resolveFetch(new Response(JSON.stringify({ case_id: "case-1", assigned_to: "julio" }), { status: 200 }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/cases/case-1/assign",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          assigned_to: "julio",
          assigned_by: "julio",
          assignment_reason: "analyst taking ownership",
        }),
      }),
    );
    expect(await screen.findByText("Assign to me completed")).toBeInTheDocument();
  });
});
