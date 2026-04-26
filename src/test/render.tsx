import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { CurrentUserProvider } from "../context/CurrentUserContext";
import { authUserFixture } from "./auth";

export function renderWithAppProviders(ui: ReactElement, route = "/") {
  return render(
    <CurrentUserProvider initialToken="test-token" initialUser={authUserFixture()} skipBootstrap>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </CurrentUserProvider>,
  );
}
