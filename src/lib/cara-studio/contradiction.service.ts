// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CONTRADICTION DETECTION SERVICE
//
// Identifies conflicting information across evidence sources: risk levels
// that disagree, dates that don't align, facts stated differently in
// different records. Surfaces these for human review — never auto-resolves.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import type { CaraStudioContradiction } from "@/types/cara-studio";

function homeId(): string {
  return process.env.SUPABASE_HOME_ID ?? "a0000000-0000-0000-0000-000000000001";
}

// ── Presentation sentiment (word-boundary + negation aware) ──────────────────
// Bare `.includes()` inverted these checks: "unsettled" contains "settled" (read
// as positive), "no concerns" contains "concerns" (read as negative) — so a
// genuinely-negative record paired with a genuinely-positive one produced a FALSE
// "conflicting presentation" contradiction. Word boundaries + negation guards fix
// it while still catching real settled-vs-distressed conflicts. Exported for tests.
// See project_keyword_matching_bugs.

export function readsAsPositivePresentation(content: string): boolean {
  const c = content.toLowerCase();
  return (
    /\bno concerns?\b/.test(c) ||
    /\bsettled\b/.test(c) || // \b excludes "unsettled"
    (/\bpositive\b/.test(c) && !/\b(not|no|never|isn't|wasn't|n't) positive\b/.test(c))
  );
}

export function readsAsNegativePresentation(content: string): boolean {
  const c = content.toLowerCase();
  return (
    /\bunsettled\b/.test(c) ||
    /\bdistressed\b/.test(c) ||
    (/\bconcerns?\b/.test(c) && !/\b(no|without|zero|any|not) concerns?\b/.test(c)) // exclude "no concerns"
  );
}

interface SourceRow {
  id: string;
  source_type: string;
  title: string | null;
  content: string | null;
  summary: string | null;
  source_date: string | null;
}

// ── Detect contradictions ───────────────────────────────────────────────────

export async function detectContradictions(
  hId: string,
  childId?: string,
): Promise<CaraStudioContradiction[]> {
  const sb = createServerClient();
  if (!sb) return getDemoContradictions();

  let query = (sb.from("cara_studio_sources") as any)
    .select("id, source_type, title, content, summary, source_date")
    .eq("home_id", hId)
    .order("source_date", { ascending: false })
    .limit(100);

  if (childId) query = query.eq("child_id", childId);

  const { data: sources, error } = await query;
  if (error || !sources || sources.length < 2) return [];

  const rows = sources as SourceRow[];
  const contradictions: CaraStudioContradiction[] = [];

  // ── Risk level mismatches ──────────────────────────────────────────────
  const riskSources = rows.filter(
    (s) => s.source_type === "risk_assessment" || s.source_type === "management_oversight" || s.source_type === "safeguarding",
  );

  for (let i = 0; i < riskSources.length - 1; i++) {
    for (let j = i + 1; j < riskSources.length; j++) {
      const a = riskSources[i];
      const b = riskSources[j];
      const aContent = (a.content ?? a.summary ?? "").toLowerCase();
      const bContent = (b.content ?? b.summary ?? "").toLowerCase();

      const riskLevels = ["high risk", "medium risk", "low risk"];
      const aLevel = riskLevels.find((l) => aContent.includes(l));
      const bLevel = riskLevels.find((l) => bContent.includes(l));

      if (aLevel && bLevel && aLevel !== bLevel) {
        contradictions.push(buildContradiction({
          home_id: hId, child_id: childId ?? null,
          source_a_id: a.id, source_b_id: b.id,
          contradiction_type: "risk_level_mismatch",
          description: `Risk level stated as "${aLevel}" in "${a.title}" but "${bLevel}" in "${b.title}". A manager should review.`,
          severity: "high",
        }));
      }
    }
  }

  // ── Behaviour description conflicts ───────────────────────────────────
  const datedSources = rows.filter((s) => s.source_date);
  for (let i = 0; i < datedSources.length - 1; i++) {
    for (let j = i + 1; j < datedSources.length; j++) {
      const a = datedSources[i];
      const b = datedSources[j];
      if (a.source_date && b.source_date && a.source_date === b.source_date && a.source_type !== b.source_type) {
        const aHasPositive = readsAsPositivePresentation(a.content ?? "");
        const bHasNegative = readsAsNegativePresentation(b.content ?? "");

        if (aHasPositive && bHasNegative) {
          contradictions.push(buildContradiction({
            home_id: hId, child_id: childId ?? null,
            source_a_id: a.id, source_b_id: b.id,
            contradiction_type: "behaviour_description_conflict",
            description: `Records from the same date describe conflicting presentations. "${a.title}" indicates positive while "${b.title}" raises concerns.`,
            severity: "medium",
          }));
        }
      }
    }
  }

  // Persist
  if (contradictions.length > 0) {
    const { error: insertErr } = await (sb.from("cara_studio_contradictions") as any)
      .insert(contradictions.map((c) => ({
        home_id: c.home_id, child_id: c.child_id, source_a_id: c.source_a_id,
        source_b_id: c.source_b_id, contradiction_type: c.contradiction_type,
        description: c.description, severity: c.severity,
        recommended_review_action: c.recommended_review_action, status: "open",
      })));
    if (insertErr) console.error("[cara-studio/contradiction] Insert error:", insertErr);
  }

  return contradictions;
}

// ── List ─────────────────────────────────────────────────────────────────────

export async function listContradictions(hId: string, childId?: string, status?: string): Promise<CaraStudioContradiction[]> {
  const sb = createServerClient();
  if (!sb) return getDemoContradictions();

  let query = (sb.from("cara_studio_contradictions") as any)
    .select("*").eq("home_id", hId).order("created_at", { ascending: false });
  if (childId) query = query.eq("child_id", childId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) { console.error("[cara-studio/contradiction] List error:", error); return []; }
  return (data ?? []) as CaraStudioContradiction[];
}

// ── Resolve ─────────────────────────────────────────────────────────────────

export async function resolveContradiction(contradictionId: string, reviewedBy: string, resolution: string): Promise<boolean> {
  const sb = createServerClient();
  if (!sb) return false;

  const { error } = await (sb.from("cara_studio_contradictions") as any)
    .update({ status: "resolved", reviewed_by: reviewedBy, reviewed_at: new Date().toISOString(), recommended_review_action: resolution })
    .eq("id", contradictionId);

  if (error) { console.error("[cara-studio/contradiction] Resolve error:", error); return false; }
  return true;
}

// ── Builder ─────────────────────────────────────────────────────────────────

function buildContradiction(partial: Partial<CaraStudioContradiction> & { home_id: string; contradiction_type: string; severity: string }): CaraStudioContradiction {
  const now = new Date().toISOString();
  return {
    id: `contradiction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    home_id: partial.home_id, child_id: partial.child_id ?? null,
    source_a_id: partial.source_a_id ?? null, source_b_id: partial.source_b_id ?? null,
    contradiction_type: partial.contradiction_type, description: partial.description ?? null,
    severity: partial.severity,
    recommended_review_action: partial.recommended_review_action ?? "A manager should review both records and confirm which is accurate.",
    status: "open", reviewed_by: null, reviewed_at: null, created_at: now,
  };
}

function getDemoContradictions(): CaraStudioContradiction[] {
  return [
    buildContradiction({ home_id: homeId(), child_id: "demo-child-1", contradiction_type: "risk_level_mismatch", description: "Risk assessment from 5 May states 'low risk' but management oversight from 6 May references 'medium risk'.", severity: "high" }),
    buildContradiction({ home_id: homeId(), child_id: "demo-child-1", contradiction_type: "behaviour_description_conflict", description: "Daily log from 8 May describes 'settled and happy' but an incident record from the same day references a verbal altercation.", severity: "medium" }),
  ];
}
