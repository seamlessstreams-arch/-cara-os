import { describe, it, expect } from "vitest";
import { tryRulesFirst, hasRuleHandler, getRuleHandledCommands, getRuleStats } from "../rules-engine";

describe("ARIA Rules Engine", () => {
  // ── Registry ────────────────────────────────────────────────────────────
  describe("rule registry", () => {
    it("has handlers for extraction commands", () => {
      expect(hasRuleHandler("extract_actions")).toBe(true);
      expect(hasRuleHandler("create_task_list")).toBe(true);
      expect(hasRuleHandler("extract_key_points")).toBe(true);
    });

    it("has handlers for analysis commands", () => {
      expect(hasRuleHandler("check_missing_information")).toBe(true);
      expect(hasRuleHandler("check_tone")).toBe(true);
      expect(hasRuleHandler("check_factuality")).toBe(true);
      expect(hasRuleHandler("identify_document_risks")).toBe(true);
    });

    it("has handlers for suggestion commands", () => {
      expect(hasRuleHandler("suggest_due_date")).toBe(true);
      expect(hasRuleHandler("suggest_task_owner")).toBe(true);
    });

    it("returns false for LLM-only commands", () => {
      expect(hasRuleHandler("improve_writing")).toBe(false);
      expect(hasRuleHandler("draft_daily_log")).toBe(false);
      expect(hasRuleHandler("professionalise_record")).toBe(false);
    });

    it("getRuleHandledCommands returns all handled IDs", () => {
      const commands = getRuleHandledCommands();
      expect(commands.length).toBeGreaterThanOrEqual(15);
      expect(commands).toContain("extract_actions");
      expect(commands).toContain("check_tone");
    });

    it("getRuleStats returns coverage info", () => {
      const stats = getRuleStats();
      expect(stats.total_handlers).toBeGreaterThanOrEqual(15);
      expect(stats.command_ids.length).toBe(stats.total_handlers);
      expect(Object.keys(stats.categories).length).toBeGreaterThan(3);
    });
  });

  // ── Extract Actions ─────────────────────────────────────────────────────
  describe("extract_actions", () => {
    it("extracts action items from text", () => {
      const result = tryRulesFirst("extract_actions", "Staff need to contact the social worker by Friday. We must update the risk assessment. Please book a dental appointment for Jake.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Action Items");
      expect(result!.method).toBe("pattern");
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.action_count).toBeGreaterThanOrEqual(2);
    });

    it("returns helpful message when no actions found", () => {
      const result = tryRulesFirst("extract_actions", "Jake had a good day today.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("No specific action items");
    });

    it("extracts multiple distinct actions", () => {
      const result = tryRulesFirst("extract_actions", "We need to book a GP appointment. Staff should arrange a school meeting. Please ensure the care plan is updated.");
      expect(result).not.toBeNull();
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.action_count).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Check Missing Information ───────────────────────────────────────────
  describe("check_missing_information", () => {
    it("identifies missing fields in a sparse record", () => {
      const result = tryRulesFirst("check_missing_information", "Something happened today.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Missing Information");
      expect(result!.output).toContain("No specific time");
    });

    it("recognises present fields", () => {
      const result = tryRulesFirst("check_missing_information", "At 14:30 in the living room, staff Sarah observed Jake becoming upset. The child said he felt angry. Staff offered a sensory break and followed up with a key work session.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Present");
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.present_count).toBeGreaterThanOrEqual(4);
    });

    it("adds severity-specific checks for high incidents", () => {
      const result = tryRulesFirst("check_missing_information", "Jake hit another child.", { severity: "critical" });
      expect(result).not.toBeNull();
      expect(result!.output).toContain("manager notification");
    });

    it("calculates completeness percentage", () => {
      const result = tryRulesFirst("check_missing_information", "At 14:30 in the kitchen, staff noticed Jake was upset. The child said he was angry about school. Staff offered support and will follow up tomorrow.");
      expect(result).not.toBeNull();
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.completeness).toBeGreaterThan(0);
      expect(meta.completeness).toBeLessThanOrEqual(100);
    });
  });

  // ── Check Tone ──────────────────────────────────────────────────────────
  describe("check_tone", () => {
    it("flags judgemental language", () => {
      const result = tryRulesFirst("check_tone", "Jake was being naughty and attention-seeking all day.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("naughty");
      expect(result!.output).toContain("Judgemental language");
    });

    it("flags informal language", () => {
      const result = tryRulesFirst("check_tone", "Jake kicked off again during dinner.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("kicked off");
    });

    it("flags compliance-framing", () => {
      const result = tryRulesFirst("check_tone", "Jake refused to go to school.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("refused");
      expect(result!.output).toContain("trauma-informed");
    });

    it("passes clean professional text", () => {
      const result = tryRulesFirst("check_tone", "Jake appeared settled during the morning routine. He engaged well with breakfast and left for school on time. Staff noted positive interactions with peers.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Good");
      expect(result!.output).toContain("No significant");
    });

    it("includes writing to the child reminder", () => {
      const result = tryRulesFirst("check_tone", "The stupid kid was being lazy.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("writing to the child");
    });
  });

  // ── Risk Identification ─────────────────────────────────────────────────
  describe("identify_risks / incident_risk_analysis", () => {
    it("detects safeguarding keywords", () => {
      const result = tryRulesFirst("identify_document_risks", "Jake made a disclosure about being hit at school.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("safeguarding");
      expect(result!.output).toContain("critical");
    });

    it("detects self-harm indicators", () => {
      const result = tryRulesFirst("incident_risk_analysis", "Staff found Jake had self-harmed in his bedroom.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("self-harm");
      expect(result!.warnings).toBeDefined();
      expect(result!.warnings!.length).toBeGreaterThan(0);
    });

    it("detects missing from care", () => {
      const result = tryRulesFirst("identify_document_risks", "Jake absconded from the home at 22:00.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("missing");
    });

    it("returns no risks for safe text", () => {
      const result = tryRulesFirst("identify_document_risks", "Jake had a calm evening watching TV with staff.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("No specific risk indicators");
    });
  });

  // ── Suggest Due Date ────────────────────────────────────────────────────
  describe("suggest_due_date", () => {
    it("suggests today for urgent items", () => {
      const result = tryRulesFirst("suggest_due_date", "This is urgent and needs immediate attention.");
      expect(result).not.toBeNull();
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.days_from_now).toBe(0);
    });

    it("suggests 7 days for standard items", () => {
      const result = tryRulesFirst("suggest_due_date", "Please check this document when you have time.");
      expect(result).not.toBeNull();
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.days_from_now).toBe(7);
    });

    it("overrides based on critical severity context", () => {
      const result = tryRulesFirst("suggest_due_date", "Review needed next month.", { severity: "critical" });
      expect(result).not.toBeNull();
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.days_from_now).toBeLessThanOrEqual(1);
    });

    it("returns a valid ISO date", () => {
      const result = tryRulesFirst("suggest_due_date", "Complete by next week.");
      expect(result).not.toBeNull();
      const meta = result!.metadata as Record<string, unknown>;
      expect(meta.due_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  // ── Suggest Task Owner ──────────────────────────────────────────────────
  describe("suggest_task_owner", () => {
    it("suggests RM for safeguarding", () => {
      const result = tryRulesFirst("suggest_task_owner", "Safeguarding concern needs investigating.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Manager");
    });

    it("suggests key worker for family contact", () => {
      const result = tryRulesFirst("suggest_task_owner", "Contact the family about weekend arrangements.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Key Worker");
    });

    it("escalates for critical severity", () => {
      const result = tryRulesFirst("suggest_task_owner", "Book dental appointment.", { severity: "critical" });
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Manager");
    });
  });

  // ── Check Factuality ────────────────────────────────────────────────────
  describe("check_factuality", () => {
    it("flags template placeholders", () => {
      const result = tryRulesFirst("check_factuality", "The child [insert name] attended school on [DATE].");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("placeholder");
    });

    it("flags mixed pronouns", () => {
      const result = tryRulesFirst("check_factuality", "He went to school in the morning. Later she came back upset. He then went to his room.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("pronoun");
    });

    it("passes clean consistent text", () => {
      const result = tryRulesFirst("check_factuality", "Jake attended school at 8:45am. He was in a positive mood when he left. Staff Sarah accompanied him to the bus stop. He returned at 3:30pm and completed homework before dinner.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("No structural issues");
    });
  });

  // ── Follow-up Suggestions ───────────────────────────────────────────────
  describe("suggest_incident_follow_up_tasks", () => {
    it("generates follow-up tasks for a restraint incident", () => {
      const result = tryRulesFirst("suggest_incident_follow_up_tasks", "Staff had to physically restrain Jake after he became aggressive.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("debrief");
      expect(result!.output).toContain("body map");
      expect(result!.output).toContain("behaviour support plan");
    });

    it("generates self-harm specific follow-ups", () => {
      const result = tryRulesFirst("suggest_incident_follow_up_tasks", "Jake was found to have self-harmed in his room.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("observation level");
      expect(result!.output).toContain("safety plan");
    });

    it("always includes oversight and Reg 40 checks", () => {
      const result = tryRulesFirst("suggest_incident_follow_up_tasks", "Jake had a minor disagreement with another child.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("oversight");
      expect(result!.output).toContain("Reg 40");
    });
  });

  // ── Fall-through behaviour ──────────────────────────────────────────────
  describe("LLM fall-through", () => {
    it("returns null for commands without rules", () => {
      expect(tryRulesFirst("improve_writing", "Some text")).toBeNull();
      expect(tryRulesFirst("draft_daily_log", "Some text")).toBeNull();
      expect(tryRulesFirst("professionalise_record", "Some text")).toBeNull();
      expect(tryRulesFirst("summarise_text", "Some text")).toBeNull();
    });

    it("returns null for unknown commands", () => {
      expect(tryRulesFirst("nonexistent_command", "Some text")).toBeNull();
    });
  });

  // ── Output format ───────────────────────────────────────────────────────
  describe("output format", () => {
    it("all rule results include rules engine tag", () => {
      const result = tryRulesFirst("extract_actions", "Need to contact the social worker.");
      expect(result).not.toBeNull();
      expect(result!.output).toContain("Aria Rules Engine");
      expect(result!.output).toContain("no AI API call");
    });

    it("all rule results have confidence and method", () => {
      const result = tryRulesFirst("check_tone", "Jake had a good day.");
      expect(result).not.toBeNull();
      expect(["high", "medium", "low"]).toContain(result!.confidence);
      expect(["rules", "template", "pattern", "hybrid"]).toContain(result!.method);
    });
  });
});
