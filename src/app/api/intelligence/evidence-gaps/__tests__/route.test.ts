import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/intelligence/evidence-gaps/route";
import { NextRequest } from "next/server";

function makeReq(url: string): NextRequest {
  return new NextRequest(new Request(url));
}

describe("evidence-gaps route (fallback mode)", () => {
  it("derives gaps from voice + reg44 + reg45 fallback collections", async () => {
    const res = await GET(makeReq("http://x/api/intelligence/evidence-gaps?homeId=home_oak"));
    const body = await res.json();

    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
    expect(typeof body.totalGaps).toBe("number");
    expect(Array.isArray(body.gaps)).toBe(true);
    expect(body.gapsByType).toBeTypeOf("object");
    // counts must add up
    const sumByType = Object.values(body.gapsByType as Record<string, number>).reduce(
      (a, b) => a + b,
      0,
    );
    expect(sumByType).toBe(body.totalGaps);
  });

  it("defaults to home_oak when homeId omitted", async () => {
    const res = await GET(makeReq("http://x/api/intelligence/evidence-gaps"));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.persisted).toBe(true);
  });

  it("returns no gaps for an unknown home", async () => {
    const res = await GET(makeReq("http://x/api/intelligence/evidence-gaps?homeId=does_not_exist"));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.totalGaps).toBe(0);
    expect(body.gaps).toEqual([]);
  });
});
