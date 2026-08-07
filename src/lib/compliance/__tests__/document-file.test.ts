import { describe, expect, it } from "vitest";
import { documentDownloadHref, isInlineData, isStorageBacked } from "../document-file";

describe("documentDownloadHref", () => {
  it("returns inline data URLs unchanged", () => {
    const dataUrl = "data:text/plain;base64,aGk=";
    expect(documentDownloadHref(dataUrl)).toBe(dataUrl);
    expect(isInlineData(dataUrl)).toBe(true);
  });

  it("routes storage-backed paths through the file API, encoded", () => {
    const href = documentDownloadHref("storage:docs/2026-08/a b.pdf");
    expect(href).toBe("/api/v1/doc-intelligence/file?path=storage%3Adocs%2F2026-08%2Fa%20b.pdf");
    expect(isStorageBacked("storage:docs/x.pdf")).toBe(true);
  });

  it("returns null when nothing is stored", () => {
    expect(documentDownloadHref("")).toBeNull();
    expect(documentDownloadHref(null)).toBeNull();
    expect(documentDownloadHref(undefined)).toBeNull();
  });
});
