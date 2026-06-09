// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OFSTED WORKFORCE EVIDENCE ENGINE (pure / deterministic)
//
// Assembles the workforce evidence an inspector looks for into RAG-rated domains
// (safer recruitment, induction, supervision, training, probation, leadership
// oversight, staff voice, reflective practice, learning culture, workforce
// stability, actions completed) — each with the real evidence behind it and any
// gaps. Print/PDF-ready. The engine is DATA-AGNOSTIC: the route computes each
// domain's metric + evidence from live data and passes it in; the engine applies
// the RAG and assembles the overall picture.
//
// Honest by design: a domain with no underlying data is "no_data", never a
// fabricated green. This is decision-support for inspection PREPARATION — it is
// not a claim of Ofsted approval.
// ══════════════════════════════════════════════════════════════════════════════

export interface DomainInput {
  key: string;
  label: string;
  rate: number | null;            // 0–100 primary metric, or null when not measurable
  numerator?: number | null;
  denominator?: number | null;
  evidence: string[];             // real evidence points from the data
  gaps?: string[];
  good?: number;                  // green threshold (default 85)
  ok?: number;                    // amber threshold (default 65)
  // when rate is null but evidence exists, status falls back to this (default "amber")
  qualitative_status?: "green" | "amber" | "red" | null;
}

export type EvidenceStatus = "green" | "amber" | "red" | "no_data";

export interface DomainResult {
  key: string;
  label: string;
  status: EvidenceStatus;
  rate: number | null;
  numerator: number | null;
  denominator: number | null;
  summary: string;
  evidence: string[];
  gaps: string[];
}

export interface OfstedWorkforceEvidence {
  overall: {
    rating: "strong" | "secure" | "developing" | "insufficient_data";
    green: number; amber: number; red: number; no_data: number;
    headline: string;
  };
  domains: DomainResult[];
  home_name: string;
  generated_on: string;
  disclaimer: string;
}

export const EVIDENCE_DISCLAIMER =
  "This dashboard helps you prepare and evidence the quality of your workforce for inspection. It is decision-support, organised the way an inspector reads, and is not a claim of Ofsted approval.";

function statusFor(d: DomainInput): EvidenceStatus {
  const good = d.good ?? 85;
  const ok = d.ok ?? 65;
  if (d.rate === null || d.rate === undefined) {
    if (d.evidence.length === 0) return "no_data";
    return d.qualitative_status ?? "amber";
  }
  if (d.rate >= good) return "green";
  if (d.rate >= ok) return "amber";
  return "red";
}

function summaryFor(d: DomainInput, status: EvidenceStatus): string {
  if (status === "no_data") return "No data recorded yet to evidence this area.";
  const pct = d.rate !== null && d.rate !== undefined ? `${d.rate}%` : null;
  const counts = (d.numerator != null && d.denominator != null) ? ` (${d.numerator}/${d.denominator})` : "";
  if (pct) return `${pct}${counts} — ${status === "green" ? "strong evidence" : status === "amber" ? "evidence in place, with gaps to close" : "needs attention"}.`;
  return status === "green" ? "Strong qualitative evidence in place." : status === "red" ? "Limited evidence — needs attention." : "Evidence in place, with gaps to close.";
}

export function computeOfstedWorkforceEvidence(input: {
  domains: DomainInput[];
  home_name: string;
  generated_on: string;
}): OfstedWorkforceEvidence {
  const domains: DomainResult[] = input.domains.map((d) => {
    const status = statusFor(d);
    return {
      key: d.key, label: d.label, status,
      rate: d.rate ?? null,
      numerator: d.numerator ?? null,
      denominator: d.denominator ?? null,
      summary: summaryFor(d, status),
      evidence: d.evidence,
      gaps: d.gaps ?? [],
    };
  });

  const green = domains.filter((d) => d.status === "green").length;
  const amber = domains.filter((d) => d.status === "amber").length;
  const red = domains.filter((d) => d.status === "red").length;
  const no_data = domains.filter((d) => d.status === "no_data").length;
  const rated = green + amber + red;

  const rating: OfstedWorkforceEvidence["overall"]["rating"] =
    rated === 0 ? "insufficient_data" : red > 0 ? "developing" : amber > 0 ? "secure" : "strong";

  const ratingLabel = { strong: "Strong", secure: "Secure", developing: "Developing", insufficient_data: "Insufficient data" }[rating];
  const parts = [`Workforce evidence: ${ratingLabel}`, `${green} strong`];
  if (amber > 0) parts.push(`${amber} with gaps`);
  if (red > 0) parts.push(`${red} need attention`);
  if (no_data > 0) parts.push(`${no_data} not yet evidenced`);
  const headline = parts.join(" · ") + ".";

  return {
    overall: { rating, green, amber, red, no_data, headline },
    domains,
    home_name: input.home_name,
    generated_on: input.generated_on,
    disclaimer: EVIDENCE_DISCLAIMER,
  };
}
