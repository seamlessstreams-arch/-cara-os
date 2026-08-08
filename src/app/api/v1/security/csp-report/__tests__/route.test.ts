import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";

// The sink's contract: a browser beacon must NEVER get a 400 back — malformed
// bodies are acknowledged (204) without recording. A codemod once broke
// exactly this (readJsonBody's 400-on-malformed); these tests pin it shut.

const post = (body: string) =>
  POST(
    new NextRequest("http://localhost/api/v1/security/csp-report", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/csp-report" },
    }),
  );

describe("POST /api/v1/security/csp-report", () => {
  it("acknowledges malformed and empty bodies with 204 — never 400", async () => {
    for (const body of ["{broken", "", "not json at all"]) {
      const res = await post(body);
      expect(res.status, JSON.stringify(body)).toBe(204);
    }
  });

  it("records report-uri format violations", async () => {
    const before = (await (await GET()).json()).count;
    const res = await post(
      JSON.stringify({
        "csp-report": {
          "violated-directive": "script-src",
          "blocked-uri": "https://evil.example/x.js",
          "document-uri": "https://cara-paintpoint.vercel.app/",
        },
      }),
    );
    expect(res.status).toBe(204);
    const after = await (await GET()).json();
    expect(after.count).toBe(before + 1);
    expect(after.recent.at(-1).directive).toBe("script-src");
  });

  it("records report-to array format violations", async () => {
    const before = (await (await GET()).json()).count;
    const res = await post(
      JSON.stringify([
        { type: "csp-violation", body: { effectiveDirective: "img-src", blockedURL: "https://evil.example/p.png" } },
      ]),
    );
    expect(res.status).toBe(204);
    const after = await (await GET()).json();
    expect(after.count).toBe(before + 1);
    expect(after.recent.at(-1).directive).toBe("img-src");
  });
});
