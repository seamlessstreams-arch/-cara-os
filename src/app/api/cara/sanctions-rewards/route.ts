// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/sanctions-rewards — Sanctions & Rewards Intelligence
//
// Analyses behaviour management proportionality, reward ratios, effectiveness.
// Pure deterministic — no AI. Returns structured assessment.
// CHR 2015 Reg 19 alignment (Behaviour Management).
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { analyseSanctionsRewards } from "@/lib/cara/sanctions-rewards-intelligence";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { SanctionsRewardsInput, SanctionRecord, RewardRecord } from "@/lib/cara/sanctions-rewards-intelligence";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "childId query parameter is required" },
        { status: 400 },
      );
    }

    const sb = createServerClient();
    let input: SanctionsRewardsInput;

    if (sb && isSupabaseEnabled()) {
      input = await fetchData(sb, childId);
    } else {
      input = buildDemoData(childId);
    }

    const assessment = analyseSanctionsRewards(input);

    return NextResponse.json({ success: true, data: assessment });
  } catch (err) {
    console.error("[cara/sanctions-rewards] Error:", err);
    return NextResponse.json(
      { error: "Sanctions & rewards intelligence failed", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

// ── Supabase Fetch ──────────────────────────────────────────────────────────

async function fetchData(sb: any, childId: string): Promise<SanctionsRewardsInput> {
  const { data: child } = await (sb.from("children") as SB)
    .select("id, first_name, last_name, date_of_birth")
    .eq("id", childId)
    .single();

  const childName = child ? `${child.first_name} ${child.last_name}` : "Unknown";
  const age = child?.date_of_birth
    ? Math.floor((Date.now() - new Date(child.date_of_birth).getTime()) / 31557600000)
    : 15;

  const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  const { data: rawSanctions } = await (sb.from("sanctions") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const { data: rawRewards } = await (sb.from("rewards") as SB)
    .select("*")
    .eq("child_id", childId)
    .gte("date", cutoff)
    .order("date", { ascending: true });

  const { data: bsp } = await (sb.from("behaviour_support_plans") as SB)
    .select("*")
    .eq("child_id", childId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  const sanctions: SanctionRecord[] = (rawSanctions ?? []).map((s: any) => ({
    id: s.id,
    date: s.date,
    type: s.type ?? "other",
    reason: s.reason ?? "",
    duration: s.duration ?? undefined,
    proportionate: s.proportionate ?? true,
    childInformed: s.child_informed ?? true,
    childUnderstood: s.child_understood ?? true,
    linkedToBehaviour: s.linked_to_behaviour ?? true,
    staffMember: s.staff_member ?? "Unknown",
    behaviourCategory: s.behaviour_category ?? undefined,
    appealed: s.appealed ?? false,
    appealOutcome: s.appeal_outcome ?? undefined,
    followedUp: s.followed_up ?? false,
    effectivenessRating: s.effectiveness_rating ?? undefined,
    isProhibited: s.is_prohibited ?? false,
    prohibitedType: s.prohibited_type ?? undefined,
  }));

  const rewards: RewardRecord[] = (rawRewards ?? []).map((r: any) => ({
    id: r.id,
    date: r.date,
    type: r.type ?? "verbal_praise",
    reason: r.reason ?? "",
    staffMember: r.staff_member ?? "Unknown",
    childResponse: r.child_response ?? undefined,
    behaviourCategory: r.behaviour_category ?? undefined,
  }));

  return {
    childId,
    childName,
    age,
    sanctions,
    rewards,
    hasBehaviourSupportPlan: !!bsp,
    bspUpToDate: bsp?.is_current ?? false,
    bspReviewDate: bsp?.review_date ?? undefined,
    childParticipatedInBSP: bsp?.child_participated ?? false,
    sanctionPolicyExplainedToChild: bsp?.policy_explained ?? true,
    appealsProcessExplained: bsp?.appeals_explained ?? true,
  };
}

// ── Demo Data ───────────────────────────────────────────────────────────────

function buildDemoData(childId: string): SanctionsRewardsInput {
  const isJordan = childId.includes("jordan") || childId === "child_1";

  if (!isJordan) {
    return {
      childId,
      childName: "Sam",
      age: 14,
      sanctions: [
        { id: "s1", date: "2026-04-10", type: "verbal_warning", reason: "Swearing in communal area", proportionate: true, childInformed: true, childUnderstood: true, linkedToBehaviour: true, staffMember: "Carol", followedUp: true, effectivenessRating: 4 },
      ],
      rewards: [
        { id: "r1", date: "2026-04-05", type: "verbal_praise", reason: "Helped younger resident with homework", staffMember: "Carol", childResponse: "positive" },
        { id: "r2", date: "2026-04-12", type: "activity_reward", reason: "Excellent week at school", staffMember: "Dave", childResponse: "positive" },
        { id: "r3", date: "2026-04-20", type: "verbal_praise", reason: "Tidied room without being asked", staffMember: "Carol", childResponse: "positive" },
        { id: "r4", date: "2026-05-01", type: "extra_privilege", reason: "Consistent positive behaviour", staffMember: "Dave", childResponse: "positive" },
        { id: "r5", date: "2026-05-10", type: "verbal_praise", reason: "Managed anger well in difficult situation", staffMember: "Carol", childResponse: "positive" },
      ],
      hasBehaviourSupportPlan: true,
      bspUpToDate: true,
      childParticipatedInBSP: true,
      sanctionPolicyExplainedToChild: true,
      appealsProcessExplained: true,
    };
  }

  return {
    childId,
    childName: "Jordan",
    age: 15,
    sanctions: [
      { id: "s1", date: "2026-04-01", type: "loss_of_privilege", reason: "Refused to go to school", proportionate: true, childInformed: true, childUnderstood: true, linkedToBehaviour: true, staffMember: "Alice", followedUp: true, effectivenessRating: 2 },
      { id: "s2", date: "2026-04-08", type: "reduced_screen_time", reason: "Aggressive language to staff", proportionate: true, childInformed: true, childUnderstood: true, linkedToBehaviour: true, staffMember: "Bob", followedUp: true, effectivenessRating: 3 },
      { id: "s3", date: "2026-04-22", type: "verbal_warning", reason: "Late return from outing", proportionate: true, childInformed: true, childUnderstood: true, linkedToBehaviour: true, staffMember: "Alice", followedUp: true, effectivenessRating: 4 },
      { id: "s4", date: "2026-05-05", type: "restorative_conversation", reason: "Conflict with peer", proportionate: true, childInformed: true, childUnderstood: true, linkedToBehaviour: true, staffMember: "Bob", followedUp: true, effectivenessRating: 4 },
    ],
    rewards: [
      { id: "r1", date: "2026-04-03", type: "verbal_praise", reason: "Attended all lessons", staffMember: "Alice", childResponse: "neutral" },
      { id: "r2", date: "2026-04-10", type: "points_token", reason: "Completed chores all week", staffMember: "Bob", childResponse: "positive" },
      { id: "r3", date: "2026-04-15", type: "verbal_praise", reason: "Good key work session", staffMember: "Alice", childResponse: "positive" },
      { id: "r4", date: "2026-04-25", type: "activity_reward", reason: "Managed anger without aggression", staffMember: "Alice", childResponse: "positive" },
      { id: "r5", date: "2026-05-02", type: "verbal_praise", reason: "Apologised to peer unprompted", staffMember: "Bob", childResponse: "positive" },
      { id: "r6", date: "2026-05-08", type: "extra_privilege", reason: "Consistent improvement this week", staffMember: "Alice", childResponse: "positive" },
      { id: "r7", date: "2026-05-12", type: "verbal_praise", reason: "Positive interaction with visitor", staffMember: "Bob", childResponse: "positive" },
      { id: "r8", date: "2026-05-14", type: "treat_outing", reason: "Great progress on targets", staffMember: "Alice", childResponse: "positive" },
    ],
    hasBehaviourSupportPlan: true,
    bspUpToDate: true,
    bspReviewDate: "2026-04-15",
    childParticipatedInBSP: true,
    sanctionPolicyExplainedToChild: true,
    appealsProcessExplained: true,
  };
}
