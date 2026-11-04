/** Must match the backend limits in src/lib/import.ts. */
export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".docx"];
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;

/** Checks a file before uploading. Returns an error message, or null if the file looks fine. */
export function validateUploadFile(file: { name: string; size: number }): string | null {
  const dot = file.name.lastIndexOf(".");
  const extension = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";

  if (!SUPPORTED_EXTENSIONS.includes(extension)) {
    return `Unsupported file type. Please choose a ${SUPPORTED_EXTENSIONS.join(", ")} file.`;
  }
  if (file.size === 0) return "This file is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return "This file is larger than 2 MB.";
  return null;
}
