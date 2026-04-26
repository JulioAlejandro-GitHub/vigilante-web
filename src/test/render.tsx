import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";

import { CurrentUserProvider } from "../context/CurrentUserContext";

export function renderWithAppProviders(ui: ReactElement, route = "/") {
  return render(
    <CurrentUserProvider>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </CurrentUserProvider>,
  );
}
