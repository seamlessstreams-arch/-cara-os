// ══════════════════════════════════════════════════════════════════════════════
// Tests — a contact nobody wrote up neither happened nor was cancelled
//
// `occurred` and `planned` defaulted to `true`, so a family contact with no
// recorded outcome counted as one that took place: it entered the attendance
// percentage, the contact-quality flag and the sibling-contact check. It could
// also never be a cancellation, since that is `!occurred && planned`.
//
// The inverse matters just as much. `childWanted ?? true` meant a child who was
// never asked counted as wanting the contact; making it nullable without care
// would have made every unasked contact "unwanted".
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseFamilyContact,
  type FamilyContactInput,
  type FamilyContact,
} from "../family-contact-intelligence";

function contact(
  occurred: boolean | null,
  planned: boolean | null,
  id = "fc1",
  cancelledBy?: FamilyContact["cancelledBy"],
): FamilyContact {
  return {
    id,
    date: "2026-05-01",
    contactType: "face_to_face",
    familyMember: "Mum",
    familyMemberRelation: "mother",
    planned,
    occurred,
    quality: "positive",
    ...(cancelledBy ? { cancelledBy } : {}),
  };
}

/** No cast: `Partial` would let a wrong field name through, and a cast hides
 *  a wrong shape entirely — which is how the first draft of this fixture
 *  compiled while passing `careplanRequirements` to a field called
 *  `planRequirements`. */
function input(contacts: FamilyContact[]): FamilyContactInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    contacts,
    planRequirements: [],
    placementStartDate: "2026-01-01",
  };
}

describe("an unrecorded family contact", () => {
  it("is not counted as having occurred", () => {
    const unrecorded = analyseFamilyContact(input([contact(null, true)]));
    const occurred = analyseFamilyContact(input([contact(true, true)]));
    const occurredCount = (a: ReturnType<typeof analyseFamilyContact>) =>
      a.memberAnalysis.reduce((t, m) => t + m.occurredCount, 0);
    expect(occurredCount(unrecorded)).toBeLessThan(occurredCount(occurred));
    expect(occurredCount(unrecorded)).toBe(0);
  });

  it("is not counted as a cancellation either", () => {
    const unrecorded = analyseFamilyContact(input([
      contact(null, true, "a"), contact(null, true, "b"), contact(null, true, "c"),
    ]));
    expect(unrecorded.patterns.some(p => p.type === "family_cancellation_pattern")).toBe(false);
  });

  it("still detects a recorded pattern of family cancellations", () => {
    const cancelled = analyseFamilyContact(input([
      contact(false, true, "a", "family"),
      contact(false, true, "b", "family"),
      contact(false, true, "c", "family"),
    ]));
    expect(cancelled.patterns.some(p => p.type === "family_cancellation_pattern")).toBe(true);
  });

  it("does not claim quality contact facilitation it cannot evidence", () => {
    // Reg 7(2)(a) is the flag driven by `occurred`; Reg 7 above it is driven by
    // the care-plan requirements, which this fixture deliberately leaves empty.
    const reg7a = (cs: FamilyContact[]) =>
      analyseFamilyContact(input(cs)).regulatoryFlags
        .find(f => f.regulation === "CHR 2015 Reg 7(2)(a)")?.status;
    expect(reg7a([contact(null, true)])).toBe("not_met");
    expect(reg7a([contact(true, true)])).toBe("met");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// contact-intelligence — `childWanted`
// ══════════════════════════════════════════════════════════════════════════════

import { analyseContact, type ContactInput, type ContactSession } from "../contact-intelligence";

function session(childWanted: boolean | null, id: string): ContactSession {
  return {
    id,
    date: "2026-05-01",
    person: "mother",
    personName: "Mum",
    type: "face_to_face",
    plannedDuration: 60,
    actualDuration: 60,
    occurred: true,
    outcome: "positive",
    childWanted,
    supervisedRequired: false,
  };
}

function contactInput(contactSessions: ContactSession[]): ContactInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    contactSessions,
    arrangements: [],
    contactPlanReviewed: true,
    childConsultedOnPlan: true,
    advocateAvailableForContact: true,
    lifestoryWorkStarted: false,
    siblingPlacementConsidered: true,
    letterboxContactAvailable: false,
  };
}

describe("a child who was never asked did not say no", () => {
  const unwanted = (v: boolean | null) =>
    analyseContact(contactInput([session(v, "a"), session(v, "b"), session(v, "c")]))
      .concerns.some(c => c.description.startsWith("Child repeatedly having contact they don't want"));

  it("does not report contact as unwanted when the child's view was never recorded", () => {
    expect(unwanted(null)).toBe(false);
  });

  it("still reports it when the child recorded that they did not want the contact", () => {
    expect(unwanted(false)).toBe(true);
  });
});
