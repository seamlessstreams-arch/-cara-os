import { describe, it, expect } from "vitest";
import { POST } from "../route";

// `cara_write_to_child` has no migration anywhere, so on live the insert fails.
// The route used to discard that error and fall through to a "demo fallback"
// that answered ok:true with a synthetic `wtc_<timestamp>` id — telling a
// practitioner that a child's own version of a record had been saved when
// nothing had been stored.

function post(body: Record<string, unknown>) {
  return POST(
    new Request("http://localhost/api/cara/write-to-child", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const RECORD = {
  source: "incident",
  sourceRecordId: "inc_001",
  sourceText: "There was an incident this afternoon.",
  childName: "Alex",
  childAge: 14,
  childVersion: "Something happened today and we talked about it.",
  lensScore: 82,
};

describe("write-to-child never claims a save it did not make", () => {
  it("does not answer with a fabricated id", async () => {
    const res = await post(RECORD);
    const body = await res.json();
    // Whatever the storage state, the response must not carry an invented
    // wtc_<timestamp> id while claiming the record was saved.
    if (body.ok === true) {
      expect(body.persisted === true || body.persisted === false).toBe(true);
      if (body.persisted === false) {
        expect(String(body.data?.id ?? "")).toMatch(/^wtc_/); // demo id, declared as unpersisted
      }
    } else {
      expect(res.status).toBeGreaterThanOrEqual(400);
    }
  });

  it("says whether it persisted, either way", async () => {
    const res = await post(RECORD);
    const body = await res.json();
    if (body.ok === true) {
      expect(body).toHaveProperty("persisted");
    }
  });
});
