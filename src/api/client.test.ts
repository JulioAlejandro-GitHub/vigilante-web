import { describe, expect, it } from "vitest";

import { buildQueryString } from "./client";

describe("buildQueryString", () => {
  it("omits empty values and serializes supported filters", () => {
    expect(
      buildQueryString({
        status: "in_review",
        assigned_to: "",
        limit: 25,
        offset: 0,
        q: null,
      }),
    ).toBe("?status=in_review&limit=25&offset=0");
  });
});
