import { describe, it, expect } from "vitest";
import { extractReferralDocument, parseDate } from "../referral-extraction-engine";

const TODAY = "2026-07-13";

const REFERRAL = `
Referral for: Jordan Mensah
Date of Birth: 22/08/2011
Gender: Male
Local Authority: Nottinghamshire County Council
Referral Source: Local Authority placement
Date of Referral: 3 July 2026
Social Worker: Michael Osei

Presenting Needs:
- Emotional dysregulation following family breakdown
- Disrupted education, needs reintegration support
- Attachment difficulties

Risk Factors:
- History of going missing
- Vulnerable to child criminal exploitation
- Self-harm (historic)

Estimated Placement Date: 1 August 2026
`;

describe("extractReferralDocument — a realistic referral", () => {
  const r = extractReferralDocument({ text: REFERRAL, today: TODAY });

  it("pulls the identity fields", () => {
    expect(r.fields.child_name).toBe("Jordan Mensah");
    expect(r.fields.date_of_birth).toBe("2011-08-22");
    expect(r.fields.gender).toBe("Male");
    expect(r.fields.referred_by).toBe("Michael Osei");
  });

  it("infers referral_source and reads the local authority", () => {
    expect(r.fields.referral_source).toBe("local_authority");
    expect(r.fields.local_authority).toBe("Nottinghamshire County Council");
  });

  it("parses the referral and placement dates", () => {
    expect(r.fields.referral_date).toBe("2026-07-03");
    expect(r.fields.estimated_placement_date).toBe("2026-08-01");
  });

  it("collects presenting needs and risk factors as lists", () => {
    expect(r.fields.presenting_needs).toHaveLength(3);
    expect(r.fields.presenting_needs[0]).toMatch(/Emotional dysregulation/);
    expect(r.fields.risk_factors).toEqual([
      "History of going missing",
      "Vulnerable to child criminal exploitation",
      "Self-harm (historic)",
    ]);
  });

  it("reports high confidence with all core fields found", () => {
    expect(r.missing).toEqual([]);
    expect(r.confidence).toBe(1);
  });
});

describe("extractReferralDocument — source inference precedence", () => {
  const src = (t: string) => extractReferralDocument({ text: t, today: TODAY }).fields.referral_source;
  it("emergency beats local authority when both appear", () => {
    expect(src("Emergency placement requested by the local authority social care team")).toBe("emergency");
  });
  it("court-directed detected", () => {
    expect(src("Placement is court-directed under a secure order")).toBe("court_directed");
  });
  it("agency detected", () => {
    expect(src("Referral received via an independent placement agency")).toBe("agency");
  });
  it("plain local authority", () => {
    expect(src("Referred by Derby City Council social services")).toBe("local_authority");
  });
  it("no source cues → null (never guessed)", () => {
    expect(src("A young person needs a placement soon.")).toBeNull();
  });
});

describe("extractReferralDocument — honesty (no fabrication)", () => {
  it("sparse text yields nulls, empty lists, low confidence — nothing invented", () => {
    const r = extractReferralDocument({ text: "We have a referral to discuss at panel next week.", today: TODAY });
    expect(r.fields.child_name).toBeNull();
    expect(r.fields.date_of_birth).toBeNull();
    expect(r.fields.local_authority).toBeNull();
    expect(r.fields.presenting_needs).toEqual([]);
    expect(r.fields.risk_factors).toEqual([]);
    expect(r.confidence).toBe(0);
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it("a non-name value after 'Name:' is rejected, not stored", () => {
    const r = extractReferralDocument({ text: "Name: see attached CAF form reference 99182/AB/2026-team", today: TODAY });
    expect(r.fields.child_name).toBeNull();
  });

  it("risk-term fallback fires only when there is no risk section", () => {
    const withSection = extractReferralDocument({
      text: "Risk Factors:\n- Bespoke risk one\n\nNeeds:\n- x",
      today: TODAY,
    });
    expect(withSection.fields.risk_factors).toEqual(["Bespoke risk one"]);

    const noSection = extractReferralDocument({
      text: "Background: the young person has a history of going missing and self-harm.",
      today: TODAY,
    });
    expect(noSection.fields.risk_factors).toEqual(
      expect.arrayContaining(["History of going missing", "Self-harm"]),
    );
  });

  it("London Borough local authorities are recognised", () => {
    const r = extractReferralDocument({ text: "Placing authority: London Borough of Camden", today: TODAY });
    expect(r.fields.local_authority).toBe("London Borough of Camden");
  });
});

describe("parseDate — UK formats", () => {
  it("handles ISO, dd/mm/yyyy, long and month-year", () => {
    expect(parseDate("2026-08-01")).toBe("2026-08-01");
    expect(parseDate("dob 22/08/2011")).toBe("2011-08-22");
    expect(parseDate("1st March 2026")).toBe("2026-03-01");
    expect(parseDate("March 2026")).toBe("2026-03-01");
    expect(parseDate("no date here")).toBeNull();
  });
});
