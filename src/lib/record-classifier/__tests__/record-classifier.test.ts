import { describe, it, expect } from "vitest";
import { classifyRecord } from "../record-classifier";

describe("Record Classifier", () => {
  describe("safeguarding detection", () => {
    it("detects disclosure as safeguarding", () => {
      const r = classifyRecord("Jake disclosed that someone has been touching him inappropriately", "Jake");
      expect(r.primary_type).toBe("safeguarding_concern");
      expect(r.severity).toBe("critical");
      expect(r.requires_immediate_action).toBe(true);
    });

    it("detects exploitation as safeguarding", () => {
      const r = classifyRecord("Concerns about Jake being groomed online by an older person", "Jake");
      expect(r.primary_type).toBe("safeguarding_concern");
      expect(r.flags.some((f) => f.type === "safeguarding")).toBe(true);
    });

    it("detects allegation as safeguarding", () => {
      const r = classifyRecord("Allegation against staff member regarding inappropriate behaviour", "Jake");
      expect(r.primary_type).toBe("safeguarding_concern");
    });
  });

  describe("missing from care detection", () => {
    it("detects absconding", () => {
      const r = classifyRecord("Jake absconded from the home at 10pm and has not returned", "Jake");
      expect(r.primary_type).toBe("missing_from_care");
      expect(r.severity).toBe("high");
      expect(r.requires_immediate_action).toBe(true);
    });

    it("detects not returned", () => {
      const r = classifyRecord("Jake hasn't come back from school. Whereabouts unknown.", "Jake");
      expect(r.primary_type).toBe("missing_from_care");
    });
  });

  describe("restraint detection", () => {
    it("detects physical intervention", () => {
      const r = classifyRecord("Staff had to use physical intervention after Jake became aggressive towards another child", "Jake");
      expect(r.primary_type).toBe("restraint");
      expect(r.flags.some((f) => f.type === "restraint")).toBe(true);
    });

    it("detects two-person hold", () => {
      const r = classifyRecord("Two-person team intervention used to guide Jake to a safe space", "Jake");
      expect(r.primary_type).toBe("restraint");
    });
  });

  describe("incident detection", () => {
    it("detects aggressive behaviour", () => {
      const r = classifyRecord("Jake became aggressive and threw furniture across the room", "Jake");
      expect(r.primary_type).toBe("incident");
    });

    it("detects self-harm", () => {
      const r = classifyRecord("Staff found that Jake had been self-harming in his bedroom", "Jake");
      expect(r.primary_type).toBe("incident");
      expect(r.severity).toBe("high");
      expect(r.tags).toContain("self-harm");
    });

    it("detects property damage", () => {
      const r = classifyRecord("Jake smashed the TV remote and damaged the wall", "Jake");
      expect(r.primary_type).toBe("incident");
    });

    it("detects bullying", () => {
      const r = classifyRecord("Jake reported being bullied by an older child at school today", "Jake");
      expect(r.primary_type).toBe("incident");
      expect(r.tags).toContain("bullying");
    });
  });

  describe("health detection", () => {
    it("detects GP appointment", () => {
      const r = classifyRecord("Jake attended his GP appointment today. Doctor prescribed new medication for his asthma.", "Jake");
      expect(r.primary_type).toBe("health_update");
    });

    it("detects illness", () => {
      const r = classifyRecord("Jake has been unwell today with a fever and vomiting. Kept in bed with fluids.", "Jake");
      expect(r.primary_type).toBe("health_update");
      expect(r.flags.some((f) => f.type === "health")).toBe(true);
    });

    it("detects medication issue", () => {
      const r = classifyRecord("Medication error — Jake was given the wrong dose of his evening medication", "Jake");
      expect(r.primary_type).toBe("health_update");
      expect(r.flags.some((f) => f.type === "medication")).toBe(true);
    });
  });

  describe("education detection", () => {
    it("detects school update", () => {
      const r = classifyRecord("Jake attended school today. Teacher reported good progress in maths. Homework completed.", "Jake");
      expect(r.primary_type).toBe("education_update");
      expect(r.tags).toContain("education");
    });

    it("detects exclusion", () => {
      const r = classifyRecord("Jake was excluded from school for 3 days following an incident with another pupil", "Jake");
      expect(r.primary_type).toBe("education_update");
    });
  });

  describe("family contact detection", () => {
    it("detects family visit", () => {
      const r = classifyRecord("Jake had supervised contact with mum today. He was happy to see her.", "Jake");
      expect(r.primary_type).toBe("family_contact");
      expect(r.tags).toContain("family");
    });

    it("detects phone call with parent", () => {
      const r = classifyRecord("Jake had a phone call with dad this evening. He seemed settled afterwards.", "Jake");
      expect(r.primary_type).toBe("family_contact");
    });
  });

  describe("key work detection", () => {
    it("detects key work session", () => {
      const r = classifyRecord("Had a 1-to-1 key work session with Jake today. We discussed his feelings about contact.", "Jake");
      expect(r.primary_type).toBe("key_work_session");
    });

    it("detects wishes and feelings", () => {
      const r = classifyRecord("Completed wishes and feelings work with Jake. He expressed worries about moving placement.", "Jake");
      expect(r.primary_type).toBe("key_work_session");
    });
  });

  describe("daily log default", () => {
    it("classifies general updates as daily log", () => {
      const r = classifyRecord("Jake had a settled morning. He ate breakfast and was in good mood all day.", "Jake");
      expect(r.primary_type).toBe("daily_log");
    });

    it("classifies routine events as daily log", () => {
      const r = classifyRecord("Quiet evening. Jake watched TV, had dinner, went to bed at 9pm.", "Jake");
      expect(r.primary_type).toBe("daily_log");
    });

    it("short text defaults to low confidence", () => {
      const r = classifyRecord("Jake was fine today.", "Jake");
      expect(r.confidence).toBe("low");
    });
  });

  describe("severity detection", () => {
    it("critical for disclosure", () => {
      expect(classifyRecord("Jake made a disclosure about sexual abuse").severity).toBe("critical");
    });

    it("high for self-harm", () => {
      expect(classifyRecord("Jake self-harmed in his room").severity).toBe("high");
    });

    it("medium for aggression", () => {
      expect(classifyRecord("Jake was aggressive during dinner time").severity).toBe("medium");
    });

    it("null for routine daily log", () => {
      expect(classifyRecord("Jake had a good day at school").severity).toBeNull();
    });
  });

  describe("tags", () => {
    it("extracts multiple tags", () => {
      const r = classifyRecord("Jake was anxious about school today. Family contact with mum didn't go well.");
      expect(r.tags).toContain("emotional-wellbeing");
      expect(r.tags).toContain("education");
      expect(r.tags).toContain("family");
    });

    it("extracts positive tag", () => {
      const r = classifyRecord("Jake achieved his reading goal today. Very proud of his progress.");
      expect(r.tags).toContain("positive");
    });
  });

  describe("flows_to", () => {
    it("safeguarding flows to many systems", () => {
      const r = classifyRecord("Jake made a disclosure about abuse");
      expect(r.flows_to).toContain("safeguarding_register");
      expect(r.flows_to).toContain("timeline");
      expect(r.flows_to).toContain("reg_40");
      expect(r.flows_to).toContain("cara");
    });

    it("daily log flows to standard systems", () => {
      const r = classifyRecord("Jake had a good day today");
      expect(r.flows_to).toContain("timeline");
      expect(r.flows_to).toContain("dashboard");
    });
  });

  describe("suggested_title", () => {
    it("generates child-specific title", () => {
      const r = classifyRecord("Quiet day for Jake", "Jake");
      expect(r.suggested_title).toContain("Jake");
    });

    it("includes type in title", () => {
      const r = classifyRecord("Jake made a safeguarding disclosure", "Jake");
      expect(r.suggested_title.toLowerCase()).toContain("safeguarding");
    });
  });
});
