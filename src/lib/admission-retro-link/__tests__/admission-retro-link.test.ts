import { describe, it, expect } from "vitest";
import {
  buildOriginStory,
  resolveReferralToChild,
  normaliseName,
  type YoungPersonLite,
  type AdmissionReferralLite,
  type MatchingReferralLite,
} from "../admission-retro-link-engine";
import { getStore } from "@/lib/db/store";

const alex: YoungPersonLite = {
  id: "yp_alex", first_name: "Alex", last_name: "Thompson", preferred_name: "Al",
  date_of_birth: "2010-03-04",
};

describe("normaliseName", () => {
  it("strips punctuation/case/space", () => {
    expect(normaliseName("  Alex   O'Brien-Smith! ")).toBe("alex obriensmith");
  });
});

describe("buildOriginStory — retro-link by name/DOB", () => {
  it("exact confidence when name + DOB agree, consolidating both models", () => {
    const ad: AdmissionReferralLite = {
      id: "ar1", child_name: "Alex Thompson", date_of_birth: "2010-03-04",
      referral_source: "local_authority", local_authority: "Oldham", status: "placed",
      presenting_needs: ["CSE risk", "education gap"], risk_factors: ["missing episodes"],
      referral_date: "2025-01-10",
    };
    const mr: MatchingReferralLite = {
      id: "mr1", child_name: "Alex Thompson", status: "accepted", placement_type: "solo",
      presenting_needs: ["therapeutic support"],
    };
    const story = buildOriginStory(alex, [ad], [mr])!;
    expect(story.match_confidence).toBe("exact");
    expect(story.match_basis).toContain("date of birth");
    expect(story.referral_source).toBe("local_authority");
    expect(story.risk_factors).toEqual(["missing episodes"]);
    // presenting needs consolidated across both models, deduped
    expect(story.presenting_needs.sort()).toEqual(["CSE risk", "education gap", "therapeutic support"].sort());
    expect(story.admission_referral?.id).toBe("ar1");
    expect(story.matching_referral?.id).toBe("mr1");
  });

  it("matches the preferred name form", () => {
    const ad: AdmissionReferralLite = { id: "ar2", child_name: "Al Thompson", date_of_birth: "2010-03-04" };
    const story = buildOriginStory(alex, [ad], []);
    expect(story?.match_confidence).toBe("exact");
  });

  it("name-only match (no DOB on referral) is 'strong', not 'exact'", () => {
    const ad: AdmissionReferralLite = { id: "ar3", child_name: "Alex Thompson" };
    const story = buildOriginStory(alex, [ad], []);
    expect(story?.match_confidence).toBe("strong");
    expect(story?.match_basis).toContain("no date of birth");
  });

  it("rejects a same-name different-DOB referral (never a false link)", () => {
    const ad: AdmissionReferralLite = { id: "ar4", child_name: "Alex Thompson", date_of_birth: "2001-01-01" };
    const story = buildOriginStory(alex, [ad], []);
    expect(story).toBeNull();
  });

  it("returns null when nothing matches — no fabricated origin", () => {
    const ad: AdmissionReferralLite = { id: "ar5", child_name: "Someone Else", date_of_birth: "2010-03-04" };
    expect(buildOriginStory(alex, [ad], [])).toBeNull();
  });
});

describe("resolveReferralToChild — reverse view", () => {
  it("resolves a placed referral to the matching young person", () => {
    const ad: AdmissionReferralLite = { id: "ar6", child_name: "Alex Thompson", date_of_birth: "2010-03-04", status: "placed" };
    const r = resolveReferralToChild(ad, [alex, { id: "yp_x", first_name: "Sam", last_name: "Lee" }]);
    expect(r?.child_id).toBe("yp_alex");
    expect(r?.confidence).toBe("exact");
  });
});

describe("over the real seeded store", () => {
  it("does not throw and returns well-formed stories for real referrals", () => {
    const store = getStore();
    const yps = store.youngPeople as unknown as YoungPersonLite[];
    const ars = store.admissionReferrals as unknown as AdmissionReferralLite[];
    const mrs = store.matchingReferrals as unknown as MatchingReferralLite[];
    for (const yp of yps) {
      const story = buildOriginStory(yp, ars, mrs);
      if (story) {
        expect(["exact", "strong"]).toContain(story.match_confidence);
        expect(story.child_id).toBe(yp.id);
        expect(Array.isArray(story.presenting_needs)).toBe(true);
      }
    }
  });
});
