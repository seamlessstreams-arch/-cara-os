// ══════════════════════════════════════════════════════════════════════════════
// API — HOME ENRICHMENT & ACHIEVEMENT INTELLIGENCE
// Maps in-memory store → engine input → JSON response.
// CHR 2015 Reg 9.
// ══════════════════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeEnrichmentAchievement,
  type CreativeProjectInput,
  type ExtracurricularClubInput,
  type PositiveAchievementInput,
  type ClubRecordInput,
  type SanctionRewardInput,
} from "@/lib/engines/home-enrichment-achievement-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Creative Projects ─────────────────────────────────────────────
  const creative_projects: CreativeProjectInput[] = (store.creativeProjectRecords as any[]).map((p: any) => ({
    id: p.id,
    child_id: p.child_id,
    status: p.status ?? "idea",
    skills_growing_count: p.skills_growing?.length ?? 0,
    child_voice_provided: !!(p.child_voice),
    review_date: (p.review_date ?? "").toString().slice(0, 10),
    external_showcase_present: !!(p.external_showcase),
    contests_entered_count: p.contests_entered?.length ?? 0,
  }));

  // ── Extracurricular Clubs ─────────────────────────────────────────
  const extracurricular_clubs: ExtracurricularClubInput[] = (store.extracurricularClubRecords as any[]).map((c: any) => ({
    id: c.id,
    child_id: c.child_id,
    ongoing: !!(c.ongoing),
    child_initiated: !!(c.child_initiated),
    attendance_rate: c.attendance_rate ?? 0,
    skills_built_count: c.skills_built?.length ?? 0,
    child_voice_provided: !!(c.child_voice),
    review_date: (c.review_date ?? "").toString().slice(0, 10),
  }));

  // ── Positive Achievements ─────────────────────────────────────────
  const positive_achievements: PositiveAchievementInput[] = (store.positiveAchievements as any[]).map((a: any) => ({
    id: a.id,
    child_id: a.child_id,
    date: (a.date ?? "").toString().slice(0, 10),
    shared_with_count: a.shared_with?.length ?? 0,
    celebrated_how_provided: !!(a.celebrated_how),
  }));

  // ── Club Records ──────────────────────────────────────────────────
  const club_records: ClubRecordInput[] = (store.clubRecords as any[]).map((c: any) => ({
    id: c.id,
    child_id: c.child_id,
    ongoing_status: c.ongoing_status ?? "ended",
    child_enjoyment_rating: c.child_enjoyment_rating ?? 1,
    achievements_count: c.achievements_at_club?.length ?? 0,
    child_comments_provided: !!(c.child_comments),
    reviewed_date: (c.reviewed_date ?? "").toString().slice(0, 10),
  }));

  // ── Sanction/Reward Entries ───────────────────────────────────────
  const sanction_rewards: SanctionRewardInput[] = (store.sanctionRewards as any[]).map((sr: any) => ({
    id: sr.id,
    child_id: sr.child_id,
    date: (sr.date ?? "").toString().slice(0, 10),
    direction: sr.direction ?? "sanction",
    proportionate: !!(sr.proportionate),
    child_response_provided: !!(sr.child_response),
  }));

  const result = computeHomeEnrichmentAchievement({
    today,
    creative_projects,
    extracurricular_clubs,
    positive_achievements,
    club_records,
    sanction_rewards,
    total_children: store.children?.length ?? 0,
  });

  return NextResponse.json({ data: result });
}
