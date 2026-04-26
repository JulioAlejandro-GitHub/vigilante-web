import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useQueryParams } from "./useQueryParams";
import { renderWithAppProviders } from "../test/render";

const defaults = {
  status: "",
  ownership: "all",
  limit: 25,
  offset: 0,
};

function QueryProbe() {
  const { params, setParams } = useQueryParams(defaults);
  return (
    <div>
      <div data-testid="params">
        {params.status} / {params.ownership} / {params.limit} / {params.offset}
      </div>
      <button type="button" onClick={() => setParams({ ownership: "mine", status: "in_review", offset: 0 })}>
        Mine
      </button>
    </div>
  );
}

describe("useQueryParams", () => {
  it("reads persisted filters from the URL and writes updates back to query params", () => {
    renderWithAppProviders(<QueryProbe />, "/cases?status=open&limit=10&offset=25");

    expect(screen.getByTestId("params")).toHaveTextContent("open / all / 10 / 25");
    fireEvent.click(screen.getByRole("button", { name: "Mine" }));
    expect(screen.getByTestId("params")).toHaveTextContent("in_review / mine / 10 / 0");
  });
});
