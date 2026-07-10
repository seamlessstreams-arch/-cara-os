import { describe, it, expect } from "vitest";
import { getStore } from "@/lib/db/store";
import { buildAskSnapshot } from "../build-snapshot";
import { answerQuestion, resolveChild, roleTier } from "../ask-cara-engine";
import { buildGroundingPack } from "../build-grounding";
import { buildRecordCatalogue } from "../record-catalogue";

// Regression guards for the readiness-audit hardening pass (six confirmed fixes
// in shipped Ask CARA code, surfaced by the multi-agent review).
const snapshot = buildAskSnapshot(getStore());
const asOf = new Date().toISOString().slice(0, 10);
const ask = (q: string, role = "registered_manager") => answerQuestion({ question: q, asOf, role, snapshot });

describe("Ask CARA hardening — readiness fixes", () => {
  // Fix 1 — keyWorkerName was always undefined (read `.name`; field is `.fullName`)
  it("names the real key worker instead of a false 'none assigned'", () => {
    const alex = snapshot.practice?.relationalSafety?.perChild.find((p) => p.childId === "yp_alex");
    expect(alex?.keyWorkerName).toBeTruthy();
    const a = ask("what does the relational safety map show for Alex?");
    expect(a.text).not.toContain("⚠ none assigned");
    expect(a.text.toLowerCase()).toContain("key worker");
  });

  // Fix 2 — bare "hold" hijacked ordinary uses of the verb
  it("does not mis-route ordinary uses of 'hold' to restraints", () => {
    expect(ask("should staff hold the boundary with Alex?").intent).not.toBe("restraints");
    expect(ask("can we hold off telling Casey about the visit?").intent).not.toBe("restraints");
    expect(ask("how many restraints this week?").intent).toBe("restraints"); // real ones still route
    expect(ask("was there a physical hold on Alex?").intent).toBe("restraints");
  });

  // Fix 3 — reflector child branch leaked child data to the everyone tier
  it("gates child-grounded reflection to care_team, keeps generic reflection open", () => {
    expect(ask("help me reflect on Alex", "external_visitor").intent).toBe("access_denied");
    expect(ask("help me reflect on Alex", "registered_manager").intent).toBe("reflector");
    expect(ask("help me reflect", "external_visitor").intent).toBe("reflector"); // no child → open
  });

  // Fix 4 — grounding leaked the child roster + safeguarding counts to everyone
  it("grounding withholds the roster + safeguarding counts from the everyone tier", () => {
    const answer = ask("how is the home doing?", "external_visitor");
    const everyonePack = buildGroundingPack({ question: "how is the home doing?", snapshot, tier: "everyone", answer, child: null, asOf });
    expect(everyonePack).not.toContain("young people placed:");
    expect(everyonePack).not.toContain("restraint debrief gaps");
    // management still gets them
    const mgmtPack = buildGroundingPack({ question: "how is the home doing?", snapshot, tier: "management", answer, child: null, asOf });
    expect(mgmtPack).toContain("young people placed:");
  });

  // Fix 5 — grounding gave care_team the management-gated team-approach line
  it("grounding withholds team-approach (staff comparison) below management", () => {
    const answer = ask("tell me about Alex");
    const child = resolveChild("tell me about alex", snapshot);
    const careTeam = buildGroundingPack({ question: "tell me about Alex", snapshot, tier: "care_team", answer, child, asOf });
    expect(careTeam).not.toContain("Team approach");
    const mgmt = buildGroundingPack({ question: "tell me about Alex", snapshot, tier: "management", answer, child, asOf });
    expect(mgmt).toContain("Team approach");
  });

  // Fix 6 — MGMT_RE missed cpdRecords (live) + whistleblowing (`wb`) + latent HR/finance
  it("tier-gates sensitive HR/finance/whistleblowing collections to management", () => {
    const cat = buildRecordCatalogue(getStore());
    const tierOf = (k: string) => cat.find((e) => e.key === k)?.tier;
    expect(tierOf("cpdRecords")).toBe("management");
    expect(tierOf("wbInvestigationRecords")).toBe("management");
    expect(tierOf("employmentHistory")).toBe("management");
    expect(tierOf("expenses")).toBe("management");
    // care-team collections must NOT be over-gated
    expect(tierOf("chronology")).toBe("care_team");
    expect(tierOf("youngPeople")).toBe("care_team");
    expect(tierOf("welfareChecks")).toBe("care_team");
  });

  it("care worker cannot read staff CPD via the record lookup", () => {
    expect(ask("any CPD records on file?", "residential_care_worker").intent).toBe("access_denied");
    expect(ask("any CPD records on file?", "registered_manager").intent).toBe("record_lookup");
  });

  // Fix 7 — child_feedback name phrasing coverage
  it("answers 'what has Alex told us?' from the child's feedback", () => {
    expect(ask("what has Alex told us?").intent).toBe("child_feedback");
  });
});
