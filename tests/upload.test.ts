import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUploadFile } from "@/lib/upload";

describe("validateUploadFile", () => {
  it.each(["notes.txt", "README.md", "Report.DOCX", "my.file.name.md"])("accepts %s", (name) => {
    expect(validateUploadFile({ name, size: 100 })).toBeNull();
  });

  it.each(["photo.png", "contract.pdf", "archive.zip", "no-extension", "notes.txt.exe"])("rejects %s", (name) => {
    expect(validateUploadFile({ name, size: 100 })).toMatch(/Unsupported file type/);
  });

  it("rejects empty files", () => {
    expect(validateUploadFile({ name: "a.txt", size: 0 })).toMatch(/empty/);
  });

  it("accepts exactly 2 MB and rejects anything larger", () => {
    expect(validateUploadFile({ name: "a.txt", size: MAX_UPLOAD_BYTES })).toBeNull();
    expect(validateUploadFile({ name: "a.txt", size: MAX_UPLOAD_BYTES + 1 })).toMatch(/2 MB/);
  });
});
