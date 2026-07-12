import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "../route";
import { getStore } from "@/lib/db/store";

// Live-probe defect: POST {} returned 201 and minted a blank chronology row on
// a child's timeline of record. The handler now requires the identifying
// essentials (child_id + date + title-or-description).

const post = (body: unknown) =>
  POST(
    new NextRequest("http://localhost/api/v1/chronology-entries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("POST /api/v1/chronology-entries — required-field guard", () => {
  it("rejects an empty body with 400 (no blank rows on a child's timeline)", async () => {
    const before = getStore().chronology.length;
    const res = await post({});
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toContain("child_id");
    expect(j.error).toContain("date");
    expect(getStore().chronology.length).toBe(before); // nothing minted
  });

  it("rejects a dated entry with no title or description", async () => {
    const res = await post({ child_id: "yp_alex", date: "2026-07-01" });
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error).toContain("title or description");
  });

  it("creates a valid entry (201) and stamps recorded_by from the caller", async () => {
    const before = getStore().chronology.length;
    const res = await post({
      child_id: "yp_alex",
      date: "2026-07-01",
      title: "Settled first family visit",
      description: "Alex managed the visit calmly and asked to phone home after.",
      category: "family",
      significance: "significant",
    });
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.data.child_id).toBe("yp_alex");
    expect(j.data.recorded_by).toBe("staff_darren"); // demo default identity
    expect(getStore().chronology.length).toBe(before + 1);
    // cleanup — keep the shared store clean for other suites
    const arr = getStore().chronology;
    arr.splice(arr.findIndex((e) => e.id === j.data.id), 1);
  });

  it("caller-supplied recorded_by wins over the default", async () => {
    const res = await post({
      child_id: "yp_alex",
      date: "2026-07-02",
      title: "Key work session",
      recorded_by: "staff_ryan",
    });
    expect(res.status).toBe(201);
    const j = await res.json();
    expect(j.data.recorded_by).toBe("staff_ryan");
    const arr = getStore().chronology;
    arr.splice(arr.findIndex((e) => e.id === j.data.id), 1);
  });

  it("GET still lists entries", async () => {
    const res = await GET(new NextRequest("http://localhost/api/v1/chronology-entries"));
    expect(res.status).toBe(200);
    const j = await res.json();
    expect(Array.isArray(j.data)).toBe(true);
  });
});
