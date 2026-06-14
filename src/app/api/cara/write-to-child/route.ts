// ══════════════════════════════════════════════════════════════════════════════
// POST /api/cara/write-to-child
// GET  /api/cara/write-to-child?recordId=xxx
//
// Generates and manages child-friendly versions of care records using
// trauma-informed language (PACE, ARC, relational safeguarding).
// Dual output: management version + child-understandable version.
// Full audit trail for Reg 44, Reg 45, and internal QA.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// ── Pure helpers (exported for testing) ────────────────────────────────────

export type WriteToChildSource =
  | "incident"
  | "complaint"
  | "missing_from_care"
  | "weekly_summary"
  | "direct_work"
  | "management_oversight"
  | "key_work_session";

const VALID_SOURCES = new Set<string>([
  "incident", "complaint", "missing_from_care", "weekly_summary",
  "direct_work", "management_oversight", "key_work_session",
]);

export function validateSource(source: unknown): source is WriteToChildSource {
  return typeof source === "string" && VALID_SOURCES.has(source);
}

export function validateChildLensScore(score: unknown): boolean {
  if (!score || typeof score !== "object") return false;
  const s = score as Record<string, unknown>;
  const required = ["overall", "clarity", "dignity", "jargonRisk", "blameRisk", "explanationOfConcern", "supportOffered"];
  return required.every((k) => typeof s[k] === "number" && (s[k] as number) >= 0 && (s[k] as number) <= 100);
}

// Jargon detection — words that should be flagged in child-facing text
const JARGON_TERMS = [
  "proportionate", "de-escalation", "multi-agency", "statutory",
  "safeguarding referral", "strategy discussion", "risk assessment",
  "behaviour support plan", "LAC review", "Section 47", "LADO",
  "chronology", "threshold", "allegation management", "significant harm",
  "reasonable chastisement", "disclosure", "perpetrator", "duty of care",
  "professional curiosity", "triangulation",
];

const BLAME_PATTERNS = [
  /\byou caused\b/i, /\byour fault\b/i, /\byou made\b/i,
  /\byou chose to\b/i, /\bbecause of you\b/i, /\byou should have\b/i,
  /\byou refused\b/i, /\byou failed\b/i, /\byou were aggressive\b/i,
  /\byou were violent\b/i, /\byou attacked\b/i,
  /\byou were naughty\b/i, /\bbad behaviour\b/i,
];

export function detectJargon(text: string): string[] {
  return JARGON_TERMS.filter((term) =>
    text.toLowerCase().includes(term.toLowerCase()),
  );
}

export function detectBlameLanguage(text: string): string[] {
  return BLAME_PATTERNS
    .filter((pattern) => pattern.test(text))
    .map((p) => {
      const match = text.match(p);
      return match ? match[0] : "";
    })
    .filter(Boolean);
}

export function computeChildLensScore(childText: string): {
  overall: number;
  clarity: number;
  dignity: number;
  jargonRisk: number;
  blameRisk: number;
  explanationOfConcern: number;
  supportOffered: number;
} {
  const jargon = detectJargon(childText);
  const blame = detectBlameLanguage(childText);

  // Sentence complexity (avg words per sentence)
  const sentences = childText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
    : 0;

  // Clarity: penalise long sentences
  const clarity = Math.max(0, Math.min(100, 100 - (avgWordsPerSentence - 12) * 4));

  // Jargon risk: 0 jargon = 0 risk, each term adds 15
  const jargonRisk = Math.min(100, jargon.length * 15);

  // Blame risk: 0 blame = 0 risk, each pattern adds 25
  const blameRisk = Math.min(100, blame.length * 25);

  // Dignity: starts at 100, penalised by blame and certain words
  const dignityPenalties = blame.length * 10 + (childText.match(/\bnaughty\b|\bbad\b|\bterrible\b/gi)?.length ?? 0) * 15;
  const dignity = Math.max(0, 100 - dignityPenalties);

  // Explanation of concern: check for "because", "worried", "want to help"
  const explanationSignals = ["because", "worried", "concerned", "want to help", "want you to know", "what happened"];
  const explanationHits = explanationSignals.filter((s) => childText.toLowerCase().includes(s)).length;
  const explanationOfConcern = Math.min(100, (explanationHits / 3) * 100);

  // Support offered: check for supportive phrases
  const supportSignals = ["here for you", "can help", "your choice", "your right", "talk to", "ask us", "support", "safe"];
  const supportHits = supportSignals.filter((s) => childText.toLowerCase().includes(s)).length;
  const supportOffered = Math.min(100, (supportHits / 3) * 100);

  // Overall: weighted average
  const overall = Math.round(
    clarity * 0.2 +
    dignity * 0.2 +
    (100 - jargonRisk) * 0.15 +
    (100 - blameRisk) * 0.15 +
    explanationOfConcern * 0.15 +
    supportOffered * 0.15,
  );

  return {
    overall: Math.max(0, Math.min(100, overall)),
    clarity: Math.round(clarity),
    dignity: Math.round(dignity),
    jargonRisk: Math.round(jargonRisk),
    blameRisk: Math.round(blameRisk),
    explanationOfConcern: Math.round(Math.min(100, explanationOfConcern)),
    supportOffered: Math.round(Math.min(100, supportOffered)),
  };
}

// ── Route handlers ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { source, sourceText, sourceRecordId, childName, childAge, childVersion, managementVersion, status } = body;

    if (!validateSource(source)) {
      return NextResponse.json({ ok: false, error: "Invalid source type" }, { status: 400 });
    }
    if (!sourceRecordId || typeof sourceRecordId !== "string") {
      return NextResponse.json({ ok: false, error: "sourceRecordId required" }, { status: 400 });
    }

    // Compute Child Lens Score for the child version
    const lensScore = childVersion ? computeChildLensScore(childVersion) : null;

    // Try Supabase
    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        const { data, error } = await (sb.from("cara_write_to_child") as any).insert({
          source_type: source,
          source_record_id: sourceRecordId,
          source_text: sourceText,
          child_name: childName,
          child_age: childAge,
          management_version: managementVersion || sourceText,
          child_version: childVersion,
          child_lens_score: lensScore,
          status: status || "draft",
        }).select().single();

        if (!error && data) {
          return NextResponse.json({ ok: true, data });
        }
      }
    }

    // Demo fallback
    return NextResponse.json({
      ok: true,
      data: {
        id: `wtc_${Date.now()}`,
        source_type: source,
        source_record_id: sourceRecordId,
        child_name: childName,
        management_version: managementVersion || sourceText,
        child_version: childVersion,
        child_lens_score: lensScore,
        status: status || "draft",
        created_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[cara/write-to-child] POST Error:", err);
    return NextResponse.json({ ok: false, error: "Failed to create write-to-child record" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const recordId = url.searchParams.get("recordId");
    const source = url.searchParams.get("source");

    if (isSupabaseEnabled()) {
      const sb = createServerClient();
      if (sb) {
        let query = (sb.from("cara_write_to_child") as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20);

        if (recordId) query = query.eq("source_record_id", recordId);
        if (source && validateSource(source)) query = query.eq("source_type", source);

        const { data, error } = await query;
        if (!error && data) {
          return NextResponse.json({ ok: true, data });
        }
      }
    }

    // Demo fallback
    return NextResponse.json({ ok: true, data: [] });
  } catch (err) {
    console.error("[cara/write-to-child] GET Error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch write-to-child records" }, { status: 500 });
  }
}
