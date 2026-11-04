import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDocumentSaver } from "@/components/editor/useDocumentSaver";
import { ApiError, api } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";

const savedDoc = (version: number) => ({ id: "doc1", title: "T", version }) as DocumentDetail;

afterEach(() => vi.restoreAllMocks());

describe("useDocumentSaver", () => {
  it("starts as saved and becomes saved again after a successful save", async () => {
    vi.spyOn(api, "updateDocument").mockResolvedValue(savedDoc(2));
    const { result } = renderHook(() => useDocumentSaver("doc1", 1));

    expect(result.current.status).toBe("saved");
    await act(() => result.current.save({ title: "New" }));
    expect(result.current.status).toBe("saved");
  });

  it("runs saves one after another, each with the version returned by the previous save", async () => {
    const update = vi
      .spyOn(api, "updateDocument")
      .mockResolvedValueOnce(savedDoc(2))
      .mockResolvedValueOnce(savedDoc(3));
    const { result } = renderHook(() => useDocumentSaver("doc1", 1));

    await act(async () => {
      // Fire both without waiting, like a rename happening during an autosave.
      const first = result.current.save({ title: "A" });
      const second = result.current.save({ content: { type: "doc" } });
      await Promise.all([first, second]);
    });

    expect(update).toHaveBeenNthCalledWith(1, "doc1", { title: "A", version: 1 });
    expect(update).toHaveBeenNthCalledWith(2, "doc1", { content: { type: "doc" }, version: 2 });
  });

  it("stops saving after a conflict so newer work on the server is never overwritten", async () => {
    const update = vi
      .spyOn(api, "updateDocument")
      .mockRejectedValueOnce(new ApiError(409, "This document was changed somewhere else."));
    const { result } = renderHook(() => useDocumentSaver("doc1", 1));

    await act(() => result.current.save({ title: "A" }));
    expect(result.current.status).toBe("conflict");

    await act(() => result.current.save({ title: "B" }));
    act(() => result.current.markUnsaved());

    expect(update).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("conflict");
  });

  it("shows an error for other failures and recovers on the next successful save", async () => {
    vi.spyOn(api, "updateDocument")
      .mockRejectedValueOnce(new ApiError(500, "Server error"))
      .mockResolvedValueOnce(savedDoc(2));
    const { result } = renderHook(() => useDocumentSaver("doc1", 1));

    await act(() => result.current.save({ title: "A" }));
    expect(result.current.status).toBe("error");
    expect(result.current.errorMessage).toBe("Server error");

    await act(() => result.current.save({ title: "A" }));
    expect(result.current.status).toBe("saved");
    expect(result.current.errorMessage).toBeNull();
  });
});
