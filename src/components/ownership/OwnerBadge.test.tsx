import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OwnerBadge } from "./OwnerBadge";
import { renderWithAppProviders } from "../../test/render";

describe("OwnerBadge", () => {
  it("labels ownership relative to the current mock user", () => {
    renderWithAppProviders(
      <div>
        <OwnerBadge assignedTo="julio" />
        <OwnerBadge assignedTo="maria" />
        <OwnerBadge assignedTo={null} />
      </div>,
    );
    expect(screen.getByText("Assigned to me")).toBeInTheDocument();
    expect(screen.getByText("Assigned to maria")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });
});
