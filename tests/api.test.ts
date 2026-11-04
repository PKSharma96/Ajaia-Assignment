import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, api, navigation } from "@/lib/api";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(navigation, "toLogin").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  fetchMock.mockReset();
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("api client", () => {
  it("calls the proxied /api path with JSON and returns the parsed body", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { user: { id: "1", name: "Alice", email: "a@x.dev" } }));

    const result = await api.login("a@x.dev");

    expect(result.user.name).toBe("Alice");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/auth/login");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(JSON.parse(init.body)).toEqual({ email: "a@x.dev" });
  });

  it("returns undefined for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api.deleteDocument("doc1")).resolves.toBeUndefined();
  });

  it("throws ApiError with the server's error message", async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { error: "This document was changed somewhere else." }));

    const error = await api.updateDocument("doc1", { title: "x", version: 1 }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe("This document was changed somewhere else.");
  });

  it("shows a friendly message when a proxy returns an HTML error page", async () => {
    fetchMock.mockResolvedValue(new Response("<html>Bad Gateway</html>", { status: 502 }));
    await expect(api.listDocuments()).rejects.toThrow(/may be waking up/);
  });

  it("shows a friendly message when the network is down", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await api.listDocuments().catch((e) => e);
    expect(error.status).toBe(0);
    expect(error.message).toMatch(/Cannot reach the server/);
  });

  it("redirects to /login when the session has expired", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: "Please log in to continue" }));
    await expect(api.listDocuments()).rejects.toThrow(ApiError);
    expect(navigation.toLogin).toHaveBeenCalled();
  });

  it("does not redirect when the login itself fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse(401, { error: "No demo account found with that email" }));
    await expect(api.login("nobody@x.dev")).rejects.toThrow(/No demo account/);
    expect(navigation.toLogin).not.toHaveBeenCalled();
  });

  it("uploads files as multipart form data without forcing a JSON content type", async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, { id: "new" }));
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });

    await api.importDocument(file);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/documents/import");
    expect(init.body).toBeInstanceOf(FormData);
    expect((init.body as FormData).get("file")).toBeInstanceOf(File);
    expect(init.headers?.["Content-Type"]).toBeUndefined();
  });
});
