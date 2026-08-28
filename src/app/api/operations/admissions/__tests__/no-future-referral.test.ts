import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../route";

// This route destructures `referralDate` and `childDateOfBirth` out of the
// parsed body. check-retrospective-dates only matched `body.<field>`, so it
// never saw them and neither did rejectFutureDates: a referral or a date of
// birth could be dated ahead. A future-dated record sorts to the top of a
// child's chronology and lands inside recency windows that have not happened.

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/operations/admissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

const TOMORROW = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

const BASE = {
  homeId: "home_oak",
  childFirstName: "Test",
  childLastName: "Child",
  childGender: "not_specified",
  referralSource: "local_authority",
  referringLa: "Oak LA",
  createdBy: "staff_darren",
};

describe("admissions will not accept a future referral", () => {
  it("rejects a referral dated ahead", async () => {
    const res = await post({ ...BASE, childDateOfBirth: "2010-01-01", referralDate: TOMORROW });
    expect(res.status).toBe(400);
    const { error } = await res.json();
    expect(String(error)).toContain("referralDate");
  });

  it("rejects a child born tomorrow", async () => {
    const res = await post({ ...BASE, childDateOfBirth: TOMORROW, referralDate: YESTERDAY });
    expect(res.status).toBe(400);
  });

  it("still accepts a referral that already happened", async () => {
    const res = await post({ ...BASE, childDateOfBirth: "2010-01-01", referralDate: YESTERDAY });
    expect(res.status).not.toBe(400);
  });
});
