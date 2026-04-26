import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CurrentUserProvider, useCurrentUser } from "./CurrentUserContext";
import { CurrentUserMenu } from "../components/session/CurrentUserMenu";

function SessionProbe() {
  const { currentUser, can } = useCurrentUser();
  return (
    <div>
      <div data-testid="identity">{currentUser.username}</div>
      <div data-testid="role">{currentUser.role}</div>
      <div data-testid="context">
        {currentUser.organization_id ?? "any"} / {currentUser.site_id ?? "any"}
      </div>
      <div data-testid="bulk">{can("bulk:write") ? "allowed" : "blocked"}</div>
    </div>
  );
}

describe("CurrentUserContext", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("separates identity, role and org/site context and persists the mock session", () => {
    render(
      <CurrentUserProvider>
        <CurrentUserMenu compact />
        <SessionProbe />
      </CurrentUserProvider>,
    );

    fireEvent.change(screen.getByLabelText("Identity"), { target: { value: "ana" } });
    fireEvent.change(screen.getByLabelText("Role"), { target: { value: "supervisor" } });
    fireEvent.change(screen.getByPlaceholderText("organization_id"), { target: { value: "org-1" } });
    fireEvent.change(screen.getByPlaceholderText("site_id"), { target: { value: "site-1" } });

    expect(screen.getByTestId("identity")).toHaveTextContent("ana");
    expect(screen.getByTestId("role")).toHaveTextContent("supervisor");
    expect(screen.getByTestId("context")).toHaveTextContent("org-1 / site-1");
    expect(screen.getByTestId("bulk")).toHaveTextContent("allowed");

    const stored = JSON.parse(window.localStorage.getItem("vigilante.session.v1") ?? "{}");
    expect(stored.identity.username).toBe("ana");
    expect(stored.role).toBe("supervisor");
    expect(stored.context).toEqual({ organization_id: "org-1", site_id: "site-1" });
  });
});
