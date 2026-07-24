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
