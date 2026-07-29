import { describe, it, expect } from "vitest";
import {
  csvCell,
  toCsv,
  candidateAuditCsv,
  timeToAppointCsv,
  scrCsv,
} from "../csv-export";
import type { CandidateProfile, CandidateCheck } from "@/types/recruitment";

// ── csvCell: RFC-4180 escaping ──────────────────────────────────────────────

describe("csvCell", () => {
  it("returns empty string for null and undefined", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("passes plain strings through unquoted", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell("with space")).toBe("with space");
  });

  it("quotes a value containing a comma", () => {
    expect(csvCell("a,b")).toBe(`"a,b"`);
  });

  it("quotes a value containing a double quote and doubles the inner quote", () => {
    expect(csvCell(`say "hi"`)).toBe(`"say ""hi"""`);
  });

  it("quotes a value containing CR or LF", () => {
    expect(csvCell("line1\nline2")).toBe(`"line1\nline2"`);
    expect(csvCell("line1\r\nline2")).toBe(`"line1\r\nline2"`);
  });

  it("stringifies numbers and booleans", () => {
    expect(csvCell(42)).toBe("42");
    expect(csvCell(0)).toBe("0");
    expect(csvCell(true)).toBe("true");
    expect(csvCell(false)).toBe("false");
  });
});

// ── toCsv: row assembly ─────────────────────────────────────────────────────

describe("toCsv", () => {
  it("joins cells with commas and rows with \\r\\n and terminates with \\r\\n", () => {
    const out = toCsv([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
    expect(out).toBe("a,b,c\r\n1,2,3\r\n");
  });

  it("escapes cells per csvCell inside the assembled row", () => {
    const out = toCsv([["ok", "has, comma", `has "quote"`]]);
    expect(out).toBe(`ok,"has, comma","has ""quote"""\r\n`);
  });

  it("handles a header-only sheet", () => {
    expect(toCsv([["col1", "col2"]])).toBe("col1,col2\r\n");
  });

  it("passes null / boolean / number cells through cell escaping", () => {
    expect(toCsv([[null, true, 5]])).toBe(",true,5\r\n");
  });
});

// ── Fixture helpers ─────────────────────────────────────────────────────────

function makeCandidate(overrides: Partial<CandidateProfile> = {}): CandidateProfile {
  return {
    id: "cand_1",
    home_id: "home_oak",
    vacancy_id: "vac_1",
    first_name: "Alex",
    last_name: "Rivers",
    preferred_name: null,
    email: "alex@example.com",
    phone: "07000000000",
    dob: "1990-05-01",
    current_address: null,
    source: "website",
    current_stage: "shortlisted",
    compliance_status: "pending",
    risk_level: "low",
    shortlisted: true,
    appointed: false,
    assigned_manager_id: "staff_1",
    cv_url: null,
    application_form_url: null,
    cover_letter_url: null,
    adjustments_requested: false,
    adjustments_notes: null,
    notes: null,
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-05T10:00:00Z",
    created_by: "staff_hr",
    ...overrides,
  };
}

function makeCheck(overrides: Partial<CandidateCheck> = {}): CandidateCheck {
  return {
    id: "chk_1",
    candidate_id: "cand_1",
    check_type: "enhanced_dbs",
    status: "not_started",
    required: true,
    owner_id: null,
    due_date: null,
    requested_at: null,
    received_at: null,
    verified_at: null,
    verified_by: null,
    concern_flag: false,
    concern_summary: null,
    override_used: false,
    ...overrides,
  } as CandidateCheck;
}

// ── candidateAuditCsv ───────────────────────────────────────────────────────

describe("candidateAuditCsv", () => {
  it("returns a header-only sheet for zero candidates", () => {
    const csv = candidateAuditCsv([]);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Candidate ID");
    expect(lines[0]).toContain("First name");
    expect(lines[0]).toContain("Compliance status");
  });

  it("emits one row per candidate", () => {
    const csv = candidateAuditCsv([
      makeCandidate({ id: "c1", first_name: "Alex" }),
      makeCandidate({ id: "c2", first_name: "Sam" }),
    ]);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it("sorts by created_at descending (most-recent first)", () => {
    const csv = candidateAuditCsv([
      makeCandidate({ id: "old", created_at: "2026-01-01T10:00:00Z" }),
      makeCandidate({ id: "new", created_at: "2026-03-01T10:00:00Z" }),
      makeCandidate({ id: "mid", created_at: "2026-02-01T10:00:00Z" }),
    ]);
    const lines = csv.split("\r\n").filter(Boolean);
    // Line 0 = header; the first data row is the newest.
    expect(lines[1]).toContain("new");
    expect(lines[2]).toContain("mid");
    expect(lines[3]).toContain("old");
  });

  it("quotes fields that contain commas", () => {
    const csv = candidateAuditCsv([
      makeCandidate({ notes: "concern raised, followed up" }),
    ]);
    expect(csv).toContain(`"concern raised, followed up"`);
  });
});

// ── timeToAppointCsv ────────────────────────────────────────────────────────

describe("timeToAppointCsv", () => {
  it("only includes candidates with current_stage='appointed' AND appointed=true", () => {
    const csv = timeToAppointCsv([
      makeCandidate({ id: "in_pipeline", current_stage: "shortlisted", appointed: false }),
      makeCandidate({ id: "appointed_stage_only", current_stage: "appointed", appointed: false }),
      makeCandidate({ id: "appointed_flag_only", current_stage: "shortlisted", appointed: true }),
      makeCandidate({ id: "truly_appointed", current_stage: "appointed", appointed: true }),
    ]);
    const lines = csv.split("\r\n").filter(Boolean);
    // Header + 1 row.
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("truly_appointed");
  });

  it("computes days from created_at to updated_at, rounded and floored at 0", () => {
    const csv = timeToAppointCsv([
      makeCandidate({
        id: "c1", current_stage: "appointed", appointed: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-02-01T00:00:00Z", // ~31 days
      }),
    ]);
    const lines = csv.split("\r\n").filter(Boolean);
    // Last column is the day count.
    expect(lines[1]).toMatch(/,31\r?$|,31$/);
  });

  it("emits blank days when created_at is missing", () => {
    const csv = timeToAppointCsv([
      makeCandidate({
        id: "c1", current_stage: "appointed", appointed: true,
        created_at: "" as unknown as string,
        updated_at: "2026-02-01T00:00:00Z",
      }),
    ]);
    expect(csv).toContain(",\r\n"); // trailing empty cell before the row terminator
  });

  it("sorts by updated_at descending", () => {
    const csv = timeToAppointCsv([
      makeCandidate({ id: "old", current_stage: "appointed", appointed: true, updated_at: "2026-01-01T00:00:00Z" }),
      makeCandidate({ id: "new", current_stage: "appointed", appointed: true, updated_at: "2026-03-01T00:00:00Z" }),
    ]);
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines[1]).toContain("new");
    expect(lines[2]).toContain("old");
  });
});

// ── scrCsv ──────────────────────────────────────────────────────────────────

describe("scrCsv", () => {
  const scrHeaderColumns = [
    "Enhanced DBS", "Barred list check", "Right to work", "Identity verified",
    "Overseas criminal record", "Qualifications", "Employment history",
    "Medical fitness", "References", "Safeguarding training",
  ];

  it("renders one row per candidate + the Ofsted-shaped header", () => {
    const csv = scrCsv([
      makeCandidate({ id: "c1", first_name: "Alex", last_name: "Rivers" }),
    ], new Map());
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines).toHaveLength(2);
    for (const col of scrHeaderColumns) {
      expect(lines[0]).toContain(col);
    }
  });

  it("shows blank statuses when a candidate has no checks", () => {
    const csv = scrCsv([makeCandidate({ id: "c1" })], new Map());
    const lines = csv.split("\r\n").filter(Boolean);
    // 15 cells: 5 leading (id/name/dob/stage/appointed) + 10 SCR columns.
    // Trailing SCR columns should all be empty, so the row ends with commas.
    expect(lines[1]).toMatch(/,,,,,,,,,,$/);
  });

  it("picks the LATEST status per check type", () => {
    const csv = scrCsv(
      [makeCandidate({ id: "c1" })],
      new Map([
        [
          "c1",
          [
            makeCheck({ id: "k_old", check_type: "enhanced_dbs", status: "requested", verified_at: null, received_at: null, requested_at: "2026-01-01T00:00:00Z" }),
            makeCheck({ id: "k_new", check_type: "enhanced_dbs", status: "verified", verified_at: "2026-02-01T00:00:00Z" }),
          ],
        ],
      ]),
    );
    // The verified (newer) one wins over the requested (older) one.
    expect(csv).toContain("verified");
    // Sanity: not both.
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines[1].match(/requested/g) ?? []).toHaveLength(0);
  });

  it("omits internal-only checks (social_media, driving_licence) from the header", () => {
    const csv = scrCsv([makeCandidate({ id: "c1" })], new Map());
    const header = csv.split("\r\n")[0];
    expect(header).not.toContain("Social media");
    expect(header).not.toContain("Driving licence");
  });

  it("sorts candidates by last-name then first-name", () => {
    const csv = scrCsv(
      [
        makeCandidate({ id: "c1", first_name: "Zoe", last_name: "Anderson" }),
        makeCandidate({ id: "c2", first_name: "Alex", last_name: "Zephyr" }),
      ],
      new Map(),
    );
    const lines = csv.split("\r\n").filter(Boolean);
    expect(lines[1]).toContain("Zoe Anderson");
    expect(lines[2]).toContain("Alex Zephyr");
  });
});
