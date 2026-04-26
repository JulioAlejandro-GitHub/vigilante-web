import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { CurrentUserProvider, useCurrentUser } from "./CurrentUserContext";
import { CurrentUserMenu } from "../components/session/CurrentUserMenu";
import { authUserFixture } from "../test/auth";

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

  it("exposes the authenticated user, role permissions and backend scope", () => {
    render(
      <CurrentUserProvider
        initialToken="test-token"
        initialUser={authUserFixture({
          username: "maria",
          email: "maria@example.test",
          name: "Maria Supervisor",
          display_name: "Maria Supervisor",
          role: "supervisor",
          roles: ["supervisor"],
          organization_id: "org-1",
          site_id: "site-1",
          organization_ids: ["org-1", "org-2"],
          site_ids: ["site-1", "site-2"],
        })}
        skipBootstrap
      >
        <CurrentUserMenu compact />
        <SessionProbe />
      </CurrentUserProvider>,
    );

    expect(screen.getByTestId("identity")).toHaveTextContent("maria");
    expect(screen.getByTestId("role")).toHaveTextContent("supervisor");
    expect(screen.getByTestId("context")).toHaveTextContent("org-1 / site-1");
    expect(screen.getByTestId("bulk")).toHaveTextContent("allowed");
    expect(screen.getByText("Maria Supervisor")).toBeInTheDocument();
    expect(screen.getByText("2 scopes · 2 scopes")).toBeInTheDocument();
  });
});
