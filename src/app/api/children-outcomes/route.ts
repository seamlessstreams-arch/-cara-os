// ══════════════════════════════════════════════════════════════════════════════
// API: /api/children-outcomes — Children's Progress & Outcomes Tracking
//
// Returns child progress assessments, cohort analysis, domain trends,
// and goal tracking. Powers the children's outcomes dashboard and care
// plan review screens.
//
// SCCIF: Positive contribution of the residential experience.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import {
  evaluateChildProgress,
  analyzeCohort,
  analyzeDomainTrends,
  getAllDomains,
  getDomainLabel,
} from "@/lib/children-outcomes";
import type { ChildProfile, OutcomeDomain, ProgressRating } from "@/lib/children-outcomes";

type SB = any;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const homeId = url.searchParams.get("homeId") ?? "home-oak";
    const childId = url.searchParams.get("childId");
    const view = url.searchParams.get("view") ?? "overview";

    const sb = createServerClient();

    if (sb && isSupabaseEnabled()) {
      return await handleLiveData(sb, homeId, childId, view);
    }

    return NextResponse.json(getDemoData(homeId, childId, view));
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// ── Live Data ──────────────────────────────────────────────────────────────

async function handleLiveData(sb: any, homeId: string, childId: string | null, view: string) {
  let query = (sb.from("child_profiles") as SB)
    .select("*, child_outcomes(*), child_goals(*), child_reviews(*)");
  if (homeId) query = query.eq("home_id", homeId);
  if (childId) query = query.eq("id", childId);

  const { data: children, error } = await query;
  if (error) throw error;

  const profiles: ChildProfile[] = (children ?? []).map(mapToProfile);
  const now = new Date().toISOString();

  if (view === "child" && childId) {
    const profile = profiles[0];
    if (!profile) return NextResponse.json({ error: "Child not found" }, { status: 404 });
    const progress = evaluateChildProgress(profile, now);
    const trends = analyzeDomainTrends(profile);
    return NextResponse.json({ profile, progress, trends });
  }

  if (view === "cohort") {
    const cohort = analyzeCohort(profiles, homeId, now);
    return NextResponse.json({ cohort });
  }

  // Overview
  const cohort = analyzeCohort(profiles, homeId, now);
  const childResults = profiles.map(p => ({
    ...evaluateChildProgress(p, now),
    keyworkerName: p.keyworkerName,
  }));

  return NextResponse.json({
    cohort,
    children: childResults,
    domains: getAllDomains().map(d => ({ domain: d, label: getDomainLabel(d) })),
  });
}

function mapToProfile(row: any): ChildProfile {
  return {
    childId: row.id,
    childName: row.name ?? row.child_name,
    homeId: row.home_id,
    dateOfBirth: row.date_of_birth,
    placementStartDate: row.placement_start_date,
    keyworkerId: row.keyworker_id,
    keyworkerName: row.keyworker_name ?? "Unknown",
    currentOutcomes: (row.child_outcomes ?? []).map((o: any) => ({
      domain: o.domain,
      rating: o.rating,
      trend: o.trend,
      lastAssessedAt: o.assessed_at,
      assessedBy: o.assessed_by,
      evidence: o.evidence ?? [],
      targets: o.targets ?? [],
      barriers: o.barriers ?? [],
    })),
    goals: (row.child_goals ?? []).map((g: any) => ({
      id: g.id,
      domain: g.domain,
      description: g.description,
      targetDate: g.target_date,
      status: g.status,
      milestones: g.milestones ?? [],
      createdAt: g.created_at,
      achievedAt: g.achieved_at,
    })),
    reviews: (row.child_reviews ?? []).map((r: any) => ({
      id: r.id,
      date: r.date,
      type: r.type,
      overallProgress: r.overall_progress,
      domainRatings: r.domain_ratings ?? [],
      childVoice: r.child_voice ?? "",
      strengthsIdentified: r.strengths ?? [],
      areasForDevelopment: r.areas_for_development ?? [],
      reviewedBy: r.reviewed_by,
    })),
    riskLevel: row.risk_level ?? "medium",
    legalStatus: row.legal_status ?? "section_31",
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

function getDemoData(homeId: string, childId: string | null, view: string) {
  const now = new Date().toISOString();

  const demoProfiles: ChildProfile[] = [
    {
      childId: "child-jordan",
      childName: "Jordan Williams",
      homeId,
      dateOfBirth: "2010-06-15T00:00:00Z",
      placementStartDate: "2024-09-01T00:00:00Z",
      keyworkerId: "staff-001",
      keyworkerName: "Sarah Mitchell",
      currentOutcomes: [
        { domain: "safety", rating: 4, trend: "stable", lastAssessedAt: "2026-05-01T10:00:00Z", assessedBy: "staff-005", evidence: ["No missing episodes this month", "Positive engagement with boundaries"], targets: ["Continue building trust with adults"], barriers: [] },
        { domain: "health", rating: 3, trend: "improving", lastAssessedAt: "2026-05-01T10:00:00Z", assessedBy: "staff-005", evidence: ["Attending CAMHS fortnightly", "Improved sleep pattern"], targets: ["Maintain CAMHS engagement", "Develop healthy eating habits"], barriers: ["Historical trauma impact"] },
        { domain: "education", rating: 4, trend: "improving", lastAssessedAt: "2026-05-01T10:00:00Z", assessedBy: "staff-005", evidence: ["92% attendance", "On track for targets in Maths"], targets: ["Maintain attendance above 90%"], barriers: [] },
        { domain: "positive_contribution", rating: 4, trend: "stable", lastAssessedAt: "2026-05-01T10:00:00Z", assessedBy: "staff-005", evidence: ["Participates in house meetings", "Helping younger child with homework"], targets: ["Join community group"], barriers: [] },
        { domain: "economic_wellbeing", rating: 3, trend: "stable", lastAssessedAt: "2026-05-01T10:00:00Z", assessedBy: "staff-005", evidence: ["Managing pocket money", "Started cooking sessions"], targets: ["Open savings account", "Learn to budget weekly"], barriers: ["Age-appropriate limitations"] },
        { domain: "identity", rating: 4, trend: "improving", lastAssessedAt: "2026-05-01T10:00:00Z", assessedBy: "staff-005", evidence: ["Life story work progressing well", "Positive contact with sibling"], targets: ["Continue life story work"], barriers: [] },
        { domain: "emotional_wellbeing", rating: 3, trend: "improving", lastAssessedAt: "2026-05-01T10:00:00Z", assessedBy: "staff-005", evidence: ["Using calm-down strategies more", "Fewer dysregulated episodes"], targets: ["Use strategies independently", "Build emotional vocabulary"], barriers: ["Attachment difficulties"] },
      ],
      goals: [
        { id: "g-j-1", domain: "education", description: "Achieve 90% attendance for summer term", targetDate: "2026-07-20T00:00:00Z", status: "active", milestones: [{ description: "Full attendance first week back", achieved: true, achievedAt: "2026-04-15" }, { description: "No unauthorised absences in May", achieved: true, achievedAt: "2026-05-31" }], createdAt: "2026-04-01T00:00:00Z" },
        { id: "g-j-2", domain: "emotional_wellbeing", description: "Use calm-down strategies without adult prompting 3x weekly", targetDate: "2026-06-30T00:00:00Z", status: "active", milestones: [{ description: "Identify own triggers", achieved: true, achievedAt: "2026-04-20" }, { description: "Choose strategy independently", achieved: false }], createdAt: "2026-03-15T00:00:00Z" },
        { id: "g-j-3", domain: "health", description: "Attend all CAMHS appointments", targetDate: "2026-09-01T00:00:00Z", status: "achieved", milestones: [{ description: "Attend first 3 sessions", achieved: true }], createdAt: "2026-01-10T00:00:00Z", achievedAt: "2026-04-15T00:00:00Z" },
      ],
      reviews: [
        { id: "r-j-1", date: "2026-05-01T10:00:00Z", type: "keyworker", overallProgress: 4, domainRatings: [{ domain: "safety", rating: 4 }, { domain: "health", rating: 3 }, { domain: "education", rating: 4 }, { domain: "positive_contribution", rating: 4 }, { domain: "economic_wellbeing", rating: 3 }, { domain: "identity", rating: 4 }, { domain: "emotional_wellbeing", rating: 3 }], childVoice: "I like living here. School is good. I want to see my sister more.", strengthsIdentified: ["School engagement improving", "Using calm-down box more"], areasForDevelopment: ["Emotional regulation when tired", "Independence skills"], reviewedBy: "staff-001" },
        { id: "r-j-2", date: "2026-04-03T10:00:00Z", type: "monthly", overallProgress: 3, domainRatings: [{ domain: "safety", rating: 4 }, { domain: "health", rating: 3 }, { domain: "education", rating: 3 }, { domain: "positive_contribution", rating: 3 }, { domain: "economic_wellbeing", rating: 3 }, { domain: "identity", rating: 3 }, { domain: "emotional_wellbeing", rating: 3 }], childVoice: "Things are OK. I miss my mum sometimes.", strengthsIdentified: ["Settled in routine"], areasForDevelopment: ["School attendance dipped", "Needs more social activities"], reviewedBy: "staff-005" },
      ],
      riskLevel: "medium",
      legalStatus: "section_31",
    },
    {
      childId: "child-alex",
      childName: "Alex Rivera",
      homeId,
      dateOfBirth: "2009-02-20T00:00:00Z",
      placementStartDate: "2025-03-15T00:00:00Z",
      keyworkerId: "staff-002",
      keyworkerName: "James Cooper",
      currentOutcomes: [
        { domain: "safety", rating: 3, trend: "improving", lastAssessedAt: "2026-05-05T10:00:00Z", assessedBy: "staff-005", evidence: ["One missing episode this quarter (down from 3)", "Engaging with safety planning"], targets: ["Zero missing episodes next quarter"], barriers: ["Peer influence"] },
        { domain: "health", rating: 4, trend: "stable", lastAssessedAt: "2026-05-05T10:00:00Z", assessedBy: "staff-005", evidence: ["Good physical health", "Regular exercise"], targets: ["Continue gym attendance"], barriers: [] },
        { domain: "education", rating: 3, trend: "stable", lastAssessedAt: "2026-05-05T10:00:00Z", assessedBy: "staff-005", evidence: ["Attending alternative provision", "82% attendance"], targets: ["Improve attendance to 90%", "Engage with tutor"], barriers: ["School anxiety"] },
        { domain: "positive_contribution", rating: 3, trend: "improving", lastAssessedAt: "2026-05-05T10:00:00Z", assessedBy: "staff-005", evidence: ["Started football team", "Contributing to house decisions"], targets: ["Sustain football commitment"], barriers: [] },
        { domain: "economic_wellbeing", rating: 3, trend: "stable", lastAssessedAt: "2026-05-05T10:00:00Z", assessedBy: "staff-005", evidence: ["Budgeting sessions started"], targets: ["Saturday job exploration"], barriers: [] },
        { domain: "identity", rating: 3, trend: "stable", lastAssessedAt: "2026-05-05T10:00:00Z", assessedBy: "staff-005", evidence: ["Exploring cultural heritage"], targets: ["Connect with cultural mentor"], barriers: ["Limited family contact"] },
        { domain: "emotional_wellbeing", rating: 3, trend: "improving", lastAssessedAt: "2026-05-05T10:00:00Z", assessedBy: "staff-005", evidence: ["Engaging with therapist", "Fewer angry outbursts"], targets: ["Develop coping toolkit"], barriers: ["Unresolved loss"] },
      ],
      goals: [
        { id: "g-a-1", domain: "safety", description: "No missing episodes for 3 consecutive months", targetDate: "2026-08-01T00:00:00Z", status: "active", milestones: [{ description: "1 month clear", achieved: true, achievedAt: "2026-05-01" }, { description: "2 months clear", achieved: false }], createdAt: "2026-04-01T00:00:00Z" },
        { id: "g-a-2", domain: "education", description: "Achieve 90% attendance at alternative provision", targetDate: "2026-07-20T00:00:00Z", status: "active", milestones: [], createdAt: "2026-04-15T00:00:00Z" },
      ],
      reviews: [
        { id: "r-a-1", date: "2026-05-05T10:00:00Z", type: "keyworker", overallProgress: 3, domainRatings: [{ domain: "safety", rating: 3 }, { domain: "health", rating: 4 }, { domain: "education", rating: 3 }, { domain: "positive_contribution", rating: 3 }, { domain: "economic_wellbeing", rating: 3 }, { domain: "identity", rating: 3 }, { domain: "emotional_wellbeing", rating: 3 }], childVoice: "Football is the best thing. I want to do well but school is hard.", strengthsIdentified: ["Physical activity engagement", "Fewer missing episodes"], areasForDevelopment: ["School attendance", "Managing peer pressure"], reviewedBy: "staff-002" },
      ],
      riskLevel: "high",
      legalStatus: "section_31",
    },
    {
      childId: "child-mia",
      childName: "Mia Thompson",
      homeId,
      dateOfBirth: "2011-11-03T00:00:00Z",
      placementStartDate: "2025-01-10T00:00:00Z",
      keyworkerId: "staff-003",
      keyworkerName: "Priya Sharma",
      currentOutcomes: [
        { domain: "safety", rating: 5, trend: "stable", lastAssessedAt: "2026-05-08T10:00:00Z", assessedBy: "staff-005", evidence: ["No safeguarding concerns", "Confident in reporting worries"], targets: [], barriers: [] },
        { domain: "health", rating: 4, trend: "stable", lastAssessedAt: "2026-05-08T10:00:00Z", assessedBy: "staff-005", evidence: ["All health appointments attended", "Good diet and exercise"], targets: ["Dental check due"], barriers: [] },
        { domain: "education", rating: 5, trend: "stable", lastAssessedAt: "2026-05-08T10:00:00Z", assessedBy: "staff-005", evidence: ["98% attendance", "Above expected in all subjects", "Selected for gifted programme"], targets: ["Maintain outstanding progress"], barriers: [] },
        { domain: "positive_contribution", rating: 5, trend: "stable", lastAssessedAt: "2026-05-08T10:00:00Z", assessedBy: "staff-005", evidence: ["Youth council member", "Mentoring younger child", "Drama club lead"], targets: [], barriers: [] },
        { domain: "economic_wellbeing", rating: 4, trend: "improving", lastAssessedAt: "2026-05-08T10:00:00Z", assessedBy: "staff-005", evidence: ["Managing budget well", "Interested in career planning"], targets: ["Work experience placement"], barriers: [] },
        { domain: "identity", rating: 5, trend: "stable", lastAssessedAt: "2026-05-08T10:00:00Z", assessedBy: "staff-005", evidence: ["Strong sense of self", "Positive family contact", "Cultural activities"], targets: [], barriers: [] },
        { domain: "emotional_wellbeing", rating: 4, trend: "stable", lastAssessedAt: "2026-05-08T10:00:00Z", assessedBy: "staff-005", evidence: ["Resilient and confident", "Good peer relationships"], targets: ["Transition planning discussions"], barriers: [] },
      ],
      goals: [
        { id: "g-m-1", domain: "education", description: "Selected for gifted student programme", targetDate: "2026-06-01T00:00:00Z", status: "achieved", milestones: [{ description: "Teacher recommendation", achieved: true }, { description: "Interview", achieved: true }], createdAt: "2026-02-01T00:00:00Z", achievedAt: "2026-04-20T00:00:00Z" },
        { id: "g-m-2", domain: "economic_wellbeing", description: "Complete work experience placement", targetDate: "2026-07-31T00:00:00Z", status: "active", milestones: [{ description: "Identify placement options", achieved: true, achievedAt: "2026-05-01" }], createdAt: "2026-04-01T00:00:00Z" },
      ],
      reviews: [
        { id: "r-m-1", date: "2026-05-08T10:00:00Z", type: "keyworker", overallProgress: 5, domainRatings: [{ domain: "safety", rating: 5 }, { domain: "health", rating: 4 }, { domain: "education", rating: 5 }, { domain: "positive_contribution", rating: 5 }, { domain: "economic_wellbeing", rating: 4 }, { domain: "identity", rating: 5 }, { domain: "emotional_wellbeing", rating: 4 }], childVoice: "I love it here. I want to do well in school and help others. Can I do more drama?", strengthsIdentified: ["Exceptional academic progress", "Natural leader", "Positive role model"], areasForDevelopment: ["Transition planning for independence"], reviewedBy: "staff-003" },
        { id: "r-m-2", date: "2026-04-10T10:00:00Z", type: "monthly", overallProgress: 5, domainRatings: [{ domain: "safety", rating: 5 }, { domain: "health", rating: 4 }, { domain: "education", rating: 5 }, { domain: "positive_contribution", rating: 5 }, { domain: "economic_wellbeing", rating: 4 }, { domain: "identity", rating: 5 }, { domain: "emotional_wellbeing", rating: 4 }], childVoice: "Everything is going really well.", strengthsIdentified: ["Consistent excellence"], areasForDevelopment: ["None identified"], reviewedBy: "staff-005" },
      ],
      riskLevel: "low",
      legalStatus: "section_31",
    },
  ];

  if (childId) {
    const profile = demoProfiles.find(p => p.childId === childId);
    if (!profile) return { error: "Child not found" };
    const progress = evaluateChildProgress(profile, now);
    const trends = analyzeDomainTrends(profile);
    return { profile, progress, trends };
  }

  if (view === "cohort") {
    const cohort = analyzeCohort(demoProfiles, homeId, now);
    return { cohort };
  }

  // Default overview
  const cohort = analyzeCohort(demoProfiles, homeId, now);
  const childResults = demoProfiles.map(p => ({
    ...evaluateChildProgress(p, now),
    keyworkerName: p.keyworkerName,
    riskLevel: p.riskLevel,
  }));

  return {
    cohort,
    children: childResults,
    domains: getAllDomains().map(d => ({ domain: d, label: getDomainLabel(d) })),
  };
}
