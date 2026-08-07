import { describe, expect, it } from "vitest";
import {
  createDocumentDownloadUrl,
  createDocumentUploadTarget,
  isDocumentStorageEnabled,
  normaliseStoredObjectPath,
} from "../document-storage";

describe("normaliseStoredObjectPath", () => {
  it("strips the sentinel and accepts docs/ paths", () => {
    expect(normaliseStoredObjectPath("storage:docs/2026-08/x.pdf")).toBe("docs/2026-08/x.pdf");
    expect(normaliseStoredObjectPath("docs/2026-08/x.pdf")).toBe("docs/2026-08/x.pdf");
  });

  it("rejects traversal, out-of-prefix, doubled slashes and oversized paths", () => {
    expect(normaliseStoredObjectPath("docs/../secrets/x")).toBeNull();
    expect(normaliseStoredObjectPath("secrets/x.pdf")).toBeNull();
    expect(normaliseStoredObjectPath("storage:avatars/x.png")).toBeNull();
    expect(normaliseStoredObjectPath("docs//x.pdf")).toBeNull();
    expect(normaliseStoredObjectPath(`docs/${"a".repeat(400)}`)).toBeNull();
    expect(normaliseStoredObjectPath("")).toBeNull();
    expect(normaliseStoredObjectPath(null)).toBeNull();
  });
});

// The vitest env has no Supabase config, so the degrade path IS the demo path.
describe("document storage in demo mode", () => {
  it("reports disabled and returns null targets/urls instead of throwing", async () => {
    expect(isDocumentStorageEnabled()).toBe(false);
    expect(await createDocumentUploadTarget("x.pdf")).toBeNull();
    expect(await createDocumentDownloadUrl("storage:docs/2026-08/x.pdf")).toBeNull();
  });
});
