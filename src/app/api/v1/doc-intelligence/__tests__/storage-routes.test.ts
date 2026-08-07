import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as uploadUrlPost } from "../upload-url/route";
import { GET as fileGet } from "../file/route";

// The vitest env has no Supabase config — these tests pin the demo-mode
// contract: the client is told plainly that storage is unavailable and falls
// back to the inline-base64 path; nothing throws, nothing 500s.

describe("POST /api/v1/doc-intelligence/upload-url", () => {
  it("says enabled:false in demo mode", async () => {
    const res = await uploadUrlPost(
      new NextRequest("http://localhost/api/v1/doc-intelligence/upload-url", {
        method: "POST",
        body: JSON.stringify({ file_name: "x.pdf" }),
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.enabled).toBe(false);
    expect(json.data.token).toBeUndefined();
  });

  it("returns 400 on malformed JSON (readJsonBody idiom)", async () => {
    const res = await uploadUrlPost(
      new NextRequest("http://localhost/api/v1/doc-intelligence/upload-url", {
        method: "POST",
        body: "{broken",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/v1/doc-intelligence/file", () => {
  it("rejects missing, out-of-prefix and traversal paths with 400", async () => {
    for (const qs of ["", "?path=secrets%2Fx.pdf", "?path=storage%3Adocs%2F..%2Fsecrets"]) {
      const res = await fileGet(
        new NextRequest(`http://localhost/api/v1/doc-intelligence/file${qs}`),
      );
      expect(res.status, qs).toBe(400);
    }
  });

  it("returns 404 for a well-formed path when storage is unavailable", async () => {
    const res = await fileGet(
      new NextRequest(
        "http://localhost/api/v1/doc-intelligence/file?path=storage%3Adocs%2F2026-08%2Fx.pdf",
      ),
    );
    expect(res.status).toBe(404);
  });
});
