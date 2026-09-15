import { describe, it, expect, beforeAll } from "vitest";
import { GET } from "../route";
import { getStore } from "@/lib/db/store";

// Regression for fix/typed-queries-facade: "active staff" filtered on
// `s.status !== "inactive"` — but StaffMember has no `status` field in any
// schema, so the comparison was always true and DEPARTED staff counted in
// the workforce mix. The filter now reads the real `is_active` flag.
describe("workforce-risk active staff", () => {
  beforeAll(() => {
    const s = getStore();
    s.staff.push({
      ...s.staff[0],
      id: "staff_departed_test",
      full_name: "Departed Tester",
      is_active: false,
      employment_type: "permanent",
    } as (typeof s.staff)[number]);
  });

  it("excludes is_active: false staff from the Active staff indicator", async () => {
    const body = (await (await GET()).json()).data;
    const active = body.staffingIndicators.find(
      (i: { label: string }) => i.label === "Active staff",
    );
    expect(active).toBeDefined();
    const store = getStore();
    expect(store.staff.some((x) => x.id === "staff_departed_test")).toBe(true);
    expect(active.value).toBe(store.staff.filter((x) => x.is_active).length);
    // The departed member exists but is not counted.
    expect(active.value).toBeLessThan(store.staff.length);
  });
});
