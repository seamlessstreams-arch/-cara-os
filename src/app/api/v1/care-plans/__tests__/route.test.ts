import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/v1/care-plans/route";
import { intelligenceDb } from "@/lib/intelligence/store";
import { NextRequest } from "next/server";
import type { CarePlan } from "@/types/extended";

const HOME = "home_careplan_route_test";

function makePlan(over: Partial<CarePlan> = {}): CarePlan {
  return intelligenceDb.carePlans.create({
    home_id: HOME,
    child_id: "yp_test",
    version: 1,
    status: "active",
    placement_start: "2024-01-01",
    current_placement_type: "Full-time residential",
    legal_status: "S20",
    goals: [],
    last_lac_review: null,
    next_lac_review: null,
    lac_review_frequency_months: 6,
    keyworker_id: null,
    rm_id: null,
    rm_sign_off_date: null,
    rm_sign_off_by: null,
    strengths_summary: null,
    concerns_summary: null,
    cara_overview: null,
    created_by: "staff_test",
    ...over,
  } as Omit<CarePlan, "id" | "created_at" | "updated_at">);
}

function get(homeId: string): Promise<Response> {
  return GET(new NextRequest(new Request(`http://x/api/v1/care-plans?home_id=${homeId}`)));
}

describe("care-plans route — LAC-overdue / attention counts exclude archived plans", () => {
  it("does not count an archived plan's past next_lac_review as overdue", async () => {
    // Active plan, review in the past => a genuine overdue breach (counts).
    makePlan({ child_id: "yp_active", status: "active", next_lac_review: "2020-01-01" });
    // Archived plan (discharged child / superseded), past review => phantom (must NOT count).
    makePlan({ child_id: "yp_gone", status: "archived", next_lac_review: "2020-01-01" });
    // Active plan, review in the future => not overdue.
    makePlan({ child_id: "yp_future", status: "active", next_lac_review: "2099-01-01" });

    const body = await (await get(HOME)).json();

    expect(body.meta.total).toBe(3);          // data still returns every plan
    expect(body.meta.lac_overdue).toBe(1);    // only the live, genuinely-overdue plan
  });

  it("does not count attention_needed goals on archived plans", async () => {
    const home = HOME + "_attn";
    makePlan({ home_id: home, status: "active", goals: [{ status: "attention_needed" }] as never });
    makePlan({ home_id: home, status: "archived", goals: [{ status: "attention_needed" }] as never });

    const body = await (await get(home)).json();
    expect(body.meta.attention_needed).toBe(1);
  });
});
