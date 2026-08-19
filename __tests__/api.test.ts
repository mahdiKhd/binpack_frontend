import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, clearTokens, setTokens } from "@/lib/api";

describe("API client", () => {
  afterEach(() => { vi.restoreAllMocks(); clearTokens(); sessionStorage.clear(); });

  it("attaches an access token", async () => {
    setTokens("access-1", "refresh-1");
    const mocked = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await apiFetch("/example");
    const headers = new Headers(mocked.mock.calls[0][1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer access-1");
  });

  it("refreshes once after a 401 and retries the request", async () => {
    setTokens("expired", "refresh-1");
    const mocked = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: "Expired" } }), { status: 401, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access: "access-2", refresh: "refresh-2" }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ value: 42 }), { status: 200, headers: { "Content-Type": "application/json" } }));
    await expect(apiFetch<{ value: number }>("/private")).resolves.toEqual({ value: 42 });
    expect(mocked).toHaveBeenCalledTimes(3);
    const retryHeaders = new Headers(mocked.mock.calls[2][1]?.headers);
    expect(retryHeaders.get("Authorization")).toBe("Bearer access-2");
    expect(sessionStorage.getItem("packlab.refresh")).toBe("refresh-2");
  });
});
