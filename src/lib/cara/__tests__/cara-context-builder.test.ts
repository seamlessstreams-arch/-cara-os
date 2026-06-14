// ══════════════════════════════════════════════════════════════════════════════
// Tests — Cara Safe Context Builder
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase before importing
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => null),
  isSupabaseEnabled: vi.fn(() => false),
}));

import { buildCaraContext, _testing } from "../cara-context-builder";
import type { CaraActor } from "../cara-permissions";

const {
  resolveModule,
  getSourceConfigs,
  inferSignificance,
  buildContextSnippet,
  truncate,
  SOURCE_TABLES,
  UNIVERSAL_SOURCES,
  MODULE_ALIASES,
} = _testing;

// ─── Helper ──────────────────────────────────────────────────────────────────

const defaultActor: CaraActor = {
  userId: "staff_darren",
  role: "registered_manager",
};

// ─── Module resolution ──────────────────────────────────────────────────────

describe("resolveModule", () => {
  it("returns undefined for undefined input", () => {
    expect(resolveModule(undefined)).toBeUndefined();
  });

  it("returns the module as-is when no alias exists", () => {
    expect(resolveModule("incident")).toBe("incident");
    expect(resolveModule("daily_log")).toBe("daily_log");
    expect(resolveModule("hr")).toBe("hr");
  });

  it("resolves aliases", () => {
    expect(resolveModule("child_review")).toBe("child_record");
    expect(resolveModule("team_meeting")).toBe("calendar");
    expect(resolveModule("regulation_44")).toBe("ri_dashboard");
    expect(resolveModule("regulation_45")).toBe("ri_dashboard");
  });
});

// ─── Source table coverage ──────────────────────────────────────────────────

describe("SOURCE_TABLES coverage", () => {
  it("has source configs for key modules", () => {
    const expectedModules = [
      "daily_log",
      "incident",
      "key_work",
      "child_record",
      "management_oversight",
      "shift",
      "shift_summary",
      "hr",
      "supervision",
      "safer_recruitment",
      "audit",
      "quality_assurance",
      "ri_dashboard",
      "documents",
      "calendar",
      "complaint",
    ];
    for (const mod of expectedModules) {
      expect(SOURCE_TABLES[mod]).toBeDefined();
      expect(SOURCE_TABLES[mod].length).toBeGreaterThan(0);
    }
  });

  it("every source config has required fields", () => {
    for (const [module, configs] of Object.entries(SOURCE_TABLES)) {
      for (const config of configs) {
        expect(config.table).toBeTruthy();
        expect(config.dateColumn).toBeTruthy();
        expect(typeof config.childScoped).toBe("boolean");
        expect(typeof config.staffScoped).toBe("boolean");
        expect(config.selectColumns).toBeTruthy();
        expect(typeof config.summaryFn).toBe("function");
      }
    }
  });

  it("universal sources are defined", () => {
    expect(UNIVERSAL_SOURCES.length).toBeGreaterThan(0);
    expect(UNIVERSAL_SOURCES[0].table).toBe("tasks");
  });

  it("module aliases map to existing modules", () => {
    for (const [alias, target] of Object.entries(MODULE_ALIASES)) {
      expect(SOURCE_TABLES[target]).toBeDefined();
    }
  });
});

// ─── getSourceConfigs ────────────────────────────────────────────────────────

describe("getSourceConfigs", () => {
  it("returns universal sources when module is undefined", () => {
    const configs = getSourceConfigs(undefined);
    expect(configs.length).toBe(UNIVERSAL_SOURCES.length);
    expect(configs[0].table).toBe("tasks");
  });

  it("returns module sources + universal sources", () => {
    const configs = getSourceConfigs("incident");
    const tables = configs.map((c) => c.table);
    expect(tables).toContain("incidents");
    expect(tables).toContain("tasks");
  });

  it("deduplicates by table name", () => {
    const configs = getSourceConfigs("audit");
    const tables = configs.map((c) => c.table);
    const uniqueTables = [...new Set(tables)];
    expect(tables.length).toBe(uniqueTables.length);
  });

  it("includes child record sources for child_record module", () => {
    const configs = getSourceConfigs("child_record");
    const tables = configs.map((c) => c.table);
    expect(tables).toContain("young_people");
    expect(tables).toContain("voice_records");
    expect(tables).toContain("chronology_entries");
  });

  it("includes HR sources for hr module", () => {
    const configs = getSourceConfigs("hr");
    const tables = configs.map((c) => c.table);
    expect(tables).toContain("staff_members");
    expect(tables).toContain("supervisions");
    expect(tables).toContain("training_records");
  });
});

// ─── inferSignificance ──────────────────────────────────────────────────────

describe("inferSignificance", () => {
  it("returns critical for high severity", () => {
    expect(inferSignificance({ severity: "high" })).toBe("critical");
    expect(inferSignificance({ severity: "critical" })).toBe("critical");
  });

  it("returns significant for is_significant", () => {
    expect(inferSignificance({ is_significant: true })).toBe("significant");
  });

  it("returns critical for escalated records", () => {
    expect(inferSignificance({ escalated: true })).toBe("critical");
  });

  it("returns critical for urgent priority", () => {
    expect(inferSignificance({ priority: "urgent" })).toBe("critical");
  });

  it("returns significant for high priority", () => {
    expect(inferSignificance({ priority: "high" })).toBe("significant");
  });

  it("returns routine for ordinary records", () => {
    expect(inferSignificance({ content: "Normal entry" })).toBe("routine");
  });

  it("respects explicit significance field", () => {
    expect(inferSignificance({ significance: "critical" })).toBe("critical");
    expect(inferSignificance({ significance: "significant" })).toBe("significant");
  });
});

// ─── truncate ────────────────────────────────────────────────────────────────

describe("truncate", () => {
  it("returns short text unchanged", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("truncates long text with ellipsis", () => {
    const result = truncate("a very long piece of text that exceeds the limit", 20);
    expect(result.length).toBe(20);
    expect(result.endsWith("…")).toBe(true);
  });

  it("handles empty string", () => {
    expect(truncate("", 10)).toBe("");
  });
});

// ─── buildContextSnippet ────────────────────────────────────────────────────

describe("buildContextSnippet", () => {
  it("returns header and grouped records", () => {
    const snippet = buildContextSnippet([
      {
        sourceTable: "daily_log_entries",
        sourceRecordId: "dl_1",
        summary: "Log entry one",
        date: "2026-05-10",
        significance: "routine",
      },
      {
        sourceTable: "incidents",
        sourceRecordId: "inc_1",
        summary: "Incident one",
        date: "2026-05-11",
        significance: "critical",
      },
    ]);

    expect(snippet).toContain("ADDITIONAL CONTEXT FROM CARA RECORDS");
    expect(snippet).toContain("Daily Log Entries");
    expect(snippet).toContain("Incidents");
    expect(snippet).toContain("Log entry one");
    expect(snippet).toContain("Incident one");
  });

  it("sorts critical records before routine", () => {
    const snippet = buildContextSnippet([
      {
        sourceTable: "daily_log_entries",
        sourceRecordId: "dl_1",
        summary: "Routine",
        date: "2026-05-12",
        significance: "routine",
      },
      {
        sourceTable: "incidents",
        sourceRecordId: "inc_1",
        summary: "Critical incident",
        date: "2026-05-10",
        significance: "critical",
      },
    ]);

    const critIdx = snippet.indexOf("Incidents");
    const routIdx = snippet.indexOf("Daily Log Entries");
    expect(critIdx).toBeLessThan(routIdx);
  });

  it("shows record count per table", () => {
    const snippet = buildContextSnippet([
      { sourceTable: "tasks", sourceRecordId: "t_1", summary: "Task 1", date: "2026-05-01" },
      { sourceTable: "tasks", sourceRecordId: "t_2", summary: "Task 2", date: "2026-05-02" },
    ]);
    expect(snippet).toContain("Tasks (2 records)");
  });
});

// ─── Summary functions ──────────────────────────────────────────────────────

describe("summaryFn coverage", () => {
  it("daily_log summary includes date and type", () => {
    const fn = SOURCE_TABLES.daily_log[0].summaryFn;
    const result = fn({
      date: "2026-05-12",
      time: "10:00",
      entry_type: "mood",
      content: "Child appeared settled",
      is_significant: true,
    });
    expect(result).toContain("2026-05-12");
    expect(result).toContain("mood");
    expect(result).toContain("★");
  });

  it("incident summary includes reference and type", () => {
    const fn = SOURCE_TABLES.incident[0].summaryFn;
    const result = fn({
      date: "2026-05-12",
      reference: "INC-042",
      type: "behaviour_incident",
      severity: "medium",
      description: "Verbal altercation",
      immediate_action: "De-escalation",
    });
    expect(result).toContain("INC-042");
    expect(result).toContain("behaviour_incident");
    expect(result).toContain("Verbal altercation");
  });

  it("key_work summary includes child voice", () => {
    const fn = SOURCE_TABLES.key_work[0].summaryFn;
    const result = fn({
      title: "Feelings session",
      theme: "emotional regulation",
      aims: "Explore triggers",
      child_voice: "I felt angry when...",
    });
    expect(result).toContain("Feelings session");
    expect(result).toContain("I felt angry when...");
  });

  it("hr staff_members summary includes role", () => {
    const fn = SOURCE_TABLES.hr[0].summaryFn;
    const result = fn({
      first_name: "Sarah",
      last_name: "Jones",
      job_title: "Residential Support Worker",
      employment_status: "active",
      start_date: "2025-01-15",
    });
    expect(result).toContain("Sarah");
    expect(result).toContain("Residential Support Worker");
  });
});

// ─── buildCaraContext (integration, with Supabase off) ──────────────────────

describe("buildCaraContext", () => {
  it("returns empty context when Supabase is disabled", async () => {
    const result = await buildCaraContext({
      actor: defaultActor,
      homeId: "home_oak",
      childId: "child_1",
      sourceModule: "daily_log",
    });

    expect(result.fetched).toBe(false);
    expect(result.contextSnippet).toBe("");
    expect(result.records).toEqual([]);
    expect(result.redactedSummary).toContain("No additional context");
  });

  it("returns empty context without actor", async () => {
    const result = await buildCaraContext({
      actor: { userId: "", role: "none" },
    });
    expect(result.fetched).toBe(false);
  });
});

// ─── Permission gating on source configs ────────────────────────────────────

describe("permission-gated sources", () => {
  it("incident source requires cara.view_sensitive_context", () => {
    const incidentConfig = SOURCE_TABLES.incident[0];
    expect(incidentConfig.requiredPermission).toBe("cara.view_sensitive_context");
  });

  it("HR sources require cara.hr", () => {
    for (const config of SOURCE_TABLES.hr) {
      expect(config.requiredPermission).toBe("cara.hr");
    }
  });

  it("safer_recruitment sources require cara.recruitment", () => {
    for (const config of SOURCE_TABLES.safer_recruitment) {
      expect(config.requiredPermission).toBe("cara.recruitment");
    }
  });

  it("ri_dashboard sources require cara.ri_qa", () => {
    for (const config of SOURCE_TABLES.ri_dashboard) {
      expect(config.requiredPermission).toBe("cara.ri_qa");
    }
  });

  it("daily_log source has no extra permission requirement", () => {
    const dlConfig = SOURCE_TABLES.daily_log[0];
    expect(dlConfig.requiredPermission).toBeUndefined();
  });
});
