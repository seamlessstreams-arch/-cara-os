import { describe, it, expect } from "vitest";
import { performSmartUpload } from "../smart-upload";

// A tiny valid data URL ("Hello world").
const DATA_URL = "data:text/plain;base64,SGVsbG8gd29ybGQ=";

describe("performSmartUpload — file attachment", () => {
  it("stores the attached file's data URL so the actual file is downloadable", async () => {
    const doc = await performSmartUpload({
      fileName: "referral.pdf",
      text: "Referral for a young person, placement details and risk factors.",
      fileType: "application/pdf",
      fileDataUrl: DATA_URL,
    });
    expect(doc.stored_file_path).toBe(DATA_URL);
    expect(doc.original_file_name).toBe("referral.pdf");
  });

  it("drops anything that is not a data URL (never stores junk in the file slot)", async () => {
    const doc = await performSmartUpload({
      fileName: "x.txt",
      text: "hi",
      fileDataUrl: "https://example.com/not-a-data-url",
    });
    expect(doc.stored_file_path).toBe("");
  });

  it("stores no file for a text-only upload (the existing paste path)", async () => {
    const doc = await performSmartUpload({ fileName: "note.txt", text: "just some pasted text" });
    expect(doc.stored_file_path).toBe("");
  });
});

describe("performSmartUpload — object storage", () => {
  it("prefers the object-storage path over the inline data URL, sentinel-prefixed", async () => {
    const doc = await performSmartUpload({
      fileName: "big-referral.pdf",
      text: "referral",
      fileDataUrl: DATA_URL,
      storedObjectPath: "docs/2026-08/abc-big-referral.pdf",
    });
    expect(doc.stored_file_path).toBe("storage:docs/2026-08/abc-big-referral.pdf");
  });

  it("accepts a sentinel-prefixed path without double-prefixing", async () => {
    const doc = await performSmartUpload({
      fileName: "x.pdf",
      text: "t",
      storedObjectPath: "storage:docs/2026-08/x.pdf",
    });
    expect(doc.stored_file_path).toBe("storage:docs/2026-08/x.pdf");
  });

  it("rejects paths outside docs/ and traversal attempts, falling back to the data URL", async () => {
    for (const bad of ["secrets/x.pdf", "docs/../secrets/x.pdf", "docs//x.pdf"]) {
      const doc = await performSmartUpload({
        fileName: "x.pdf",
        text: "t",
        fileDataUrl: DATA_URL,
        storedObjectPath: bad,
      });
      expect(doc.stored_file_path, bad).toBe(DATA_URL);
    }
  });
});
