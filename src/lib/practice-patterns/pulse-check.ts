// ══════════════════════════════════════════════════════════════════════════════
// CARA — PULSE-CHECK FILE AUDIT  (pure · deterministic)
//
// Practice-patterns brief B1 / pattern pp_pulse_file_audit:
// Sample a few files, test a fixed list of criteria, rate RAG. Missing evidence
// defaults to amber/red, and ANY single red CAPS the overall at red (worst-of,
// NOT an average). For admissions, the sample must include DECLINED referrals.
//
// This is the correct aggregation per the method. It is ADDITIVE: the existing
// `regulatory-pulse` / `home-case-file-audit-quality` engines (which average)
// are left untouched; migrating a live surface onto this rule is a later
// decision. Pure: no store, no AI, no imports.
// ══════════════════════════════════════════════════════════════════════════════

export type Rag = "green" | "amber" | "red";

/** How a single criterion came out on a single file. */
export type CriterionResult = "met" | "missing" | "concern";

export interface AuditCriterion {
  id: string;
  label: string;
}

export interface AuditedFile {
  id: string;
  label: string;
  /** criterionId → result. A criterion ABSENT here is treated as "missing". */
  results: Record<string, CriterionResult>;
}

export type PulseTopic = "safeguarding" | "safer_recruitment" | "admissions" | (string & {});

export interface PulseCheckInput {
  topic: PulseTopic;
  criteria: AuditCriterion[];
  sample: AuditedFile[];
  /** Admissions only: did the sample include DECLINED referrals, not just accepted? */
  declinedReferralsReviewed?: boolean;
}

export interface FileRag {
  id: string;
  label: string;
  rag: Rag;
  missing: string[]; // criterion ids with no/absent evidence
  concerns: string[]; // criterion ids rated a concern
}

export interface PulseFinding {
  severity: Rag;
  message: string;
}

export interface PulseCheckResult {
  topic: PulseTopic;
  overall: Rag; // worst-of across files (+ the declined-referral floor) — never an average
  files: FileRag[];
  findings: PulseFinding[];
  rule: string;
}

const RANK: Record<Rag, number> = { green: 0, amber: 1, red: 2 };
const BY_RANK: Rag[] = ["green", "amber", "red"];

function worse(a: Rag, b: Rag): Rag {
  return BY_RANK[Math.max(RANK[a], RANK[b])];
}

function rateFile(file: AuditedFile, criteria: AuditCriterion[]): FileRag {
  const missing: string[] = [];
  const concerns: string[] = [];
  for (const c of criteria) {
    const result = file.results[c.id] ?? "missing"; // absent evidence defaults to missing
    if (result === "concern") concerns.push(c.id);
    else if (result === "missing") missing.push(c.id);
  }
  // Any concern caps this file at red; otherwise missing evidence => amber.
  const rag: Rag = concerns.length > 0 ? "red" : missing.length > 0 ? "amber" : "green";
  return { id: file.id, label: file.label, rag, missing, concerns };
}

/**
 * Run a pulse-check file audit. Overall is the WORST file rating (any red caps
 * the total at red), never an average. For admissions, failing to review
 * declined referrals floors the overall at amber.
 */
export function runPulseCheck(input: PulseCheckInput): PulseCheckResult {
  const files = input.sample.map((f) => rateFile(f, input.criteria));
  const findings: PulseFinding[] = [];

  // Worst-of aggregation — the defining rule of the method.
  let overall: Rag = "green";
  for (const f of files) {
    overall = worse(overall, f.rag);
    if (f.rag === "red") {
      findings.push({ severity: "red", message: `${f.label}: a concern was rated red (${f.concerns.join(", ")}).` });
    } else if (f.rag === "amber") {
      findings.push({ severity: "amber", message: `${f.label}: evidence missing (${f.missing.join(", ")}).` });
    }
  }

  // Admissions must sample declined referrals, not only accepted ones.
  if (input.topic === "admissions" && input.declinedReferralsReviewed !== true) {
    overall = worse(overall, "amber");
    findings.push({
      severity: "amber",
      message:
        "Declined referrals were not reviewed. An admissions audit that only samples accepted referrals cannot assure matching and decision-making — floor the result at amber until declined referrals are included.",
    });
  }

  return {
    topic: input.topic,
    overall,
    files,
    findings,
    rule: "Missing evidence defaults to amber; a concern is red; any red caps the overall at red (worst-of, not an average).",
  };
}
