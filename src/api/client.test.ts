import { afterEach, describe, expect, it, vi } from "vitest";

import { buildQueryString, getJson, onApiAuthFailure } from "./client";
import { writeStoredToken } from "../utils/tokenStorage";

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

describe("requestJson auth handling", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("sends the persisted bearer token on protected API requests", async () => {
    writeStoredToken("token-1");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })));

    await getJson("/api/v1/cases");

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      "/api/v1/cases",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-1" }),
      }),
    );
  });

  it("notifies auth listeners on protected 401 responses", async () => {
    const listener = vi.fn();
    const unsubscribe = onApiAuthFailure(listener);
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ detail: "Missing bearer token" }), { status: 401 })));

    await expect(getJson("/api/v1/cases")).rejects.toThrow("Authentication required");

    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });
});
