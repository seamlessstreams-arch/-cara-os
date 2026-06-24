// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE FRAMEWORK USAGE INTELLIGENCE
// GET /api/v1/practice-framework-usage
//
// Aggregates KB-framework engagement signals from five platform engines:
// Writing Assistant, Reflective Supervision, Incident Mode, PACE Profiles,
// and Practice Observations. Shows which frameworks the team is genuinely
// working with and where supervision attention is needed.
//
// All deterministic. No LLM calls.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";

// ── KB framework stubs (inline — no dep on feat/cara-knowledge-base) ─────────

const KB_FRAMEWORKS = {
  model_pace: {
    id: "model_pace",
    title: "PACE Model",
    shortDesc: "Playfulness, Acceptance, Curiosity, Empathy — Dan Hughes.",
    icon: "Heart",
  },
  skills_21_residential: {
    id: "skills_21_residential",
    title: "21 Skills for Residential Childcare",
    shortDesc: "Outcomes change through skills practised under pressure. Precise, observable recording is skill one.",
    icon: "ListChecks",
  },
  concept_psychological_safety: {
    id: "concept_psychological_safety",
    title: "Psychological Safety",
    shortDesc: "Amy Edmondson: teams that speak up without fear learn faster and care better.",
    icon: "ShieldCheck",
  },
  concept_aces: {
    id: "concept_aces",
    title: "Adverse Childhood Experiences",
    shortDesc: "Understanding how early adversity shapes brain, body and behaviour — the science behind trauma-informed care.",
    icon: "Activity",
  },
  model_ddp: {
    id: "model_ddp",
    title: "Dyadic Developmental Psychotherapy",
    shortDesc: "PACE + blocked care + therapeutic parenting. DDP underpins relational residential practice.",
    icon: "Users",
  },
  concept_rupture_repair: {
    id: "concept_rupture_repair",
    title: "Rupture-Repair Cycle",
    shortDesc: "Every rupture is an opportunity for repair — repair teaches children that relationships survive difficulty.",
    icon: "RefreshCcw",
  },
} as const;

type FrameworkId = keyof typeof KB_FRAMEWORKS;
const FRAMEWORK_IDS = Object.keys(KB_FRAMEWORKS) as FrameworkId[];

// ── Source → framework mappings ───────────────────────────────────────────────

const WA_ISSUE_TO_FW: Record<string, FrameworkId> = {
  tone:                  "model_pace",
  "professional-language": "model_pace",
  "safeguarding-quality":  "skills_21_residential",
  "writing-to-child":      "skills_21_residential",
  clarity:               "skills_21_residential",
  chronology:            "skills_21_residential",
};

const DOMAIN_TO_FW: Record<string, FrameworkId> = {
  therapeutic_relationships:         "model_pace",
  trauma_informed_practice:          "concept_aces",
  safeguarding_and_child_protection: "skills_21_residential",
  communication_and_recording:       "skills_21_residential",
  self_care_and_resilience:          "concept_psychological_safety",
  leadership_and_supervision:        "concept_psychological_safety",
};

// ── Signal helpers ────────────────────────────────────────────────────────────

type Signal = "active" | "emerging" | "dormant";
type Trend  = "increasing" | "stable" | "declining";

function signal(total: number): Signal {
  if (total >= 10) return "active";
  if (total >= 3)  return "emerging";
  return "dormant";
}

function trend(recentCount: number, priorCount: number): Trend {
  // No prior baseline: a single recent engagement is not yet a trend.
  if (priorCount === 0) return recentCount >= 2 ? "increasing" : "stable";
  if (recentCount > priorCount) return "increasing";
  if (recentCount < priorCount * 0.75) return "declining"; // a >25% drop is a real decline
  return "stable";
}

const SUPERVISION_PROMPTS: Record<FrameworkId, Record<Signal, string>> = {
  model_pace: {
    active:   "PACE is well-evidenced. Deepen: which PACE quality felt hardest this week, and what got in the way?",
    emerging: "PACE language is beginning to appear. Build: ask staff to bring one Acceptance or Curiosity moment from this week.",
    dormant:  "PACE is not yet visible in recordings. Explore: what gets in the way of staying curious about behaviour as communication?",
  },
  skills_21_residential: {
    active:   "Recording reflects the 21 Skills well. Ask: which skills feel most natural under pressure?",
    emerging: "Some 21-Skills-aligned recording is appearing. Focus on: describing what was seen and heard, not inferred.",
    dormant:  "Recording quality is not yet reflecting the 21 Skills. Explore: what does good recording mean to this staff member?",
  },
  concept_psychological_safety: {
    active:   "Good signs of psychological safety in how this team reflects. Ask: do staff feel they can admit uncertainty without judgement?",
    emerging: "Some indicators of emerging psychological safety. Explore: what would help staff say 'I got it wrong' more easily?",
    dormant:  "Low reflective engagement suggests psychological safety may need attention. Explore what gets in the way of honest reflection.",
  },
  concept_aces: {
    active:   "Trauma-informed language is well-evidenced. Deepen: how does the team connect ACEs science to this child's specific presentation?",
    emerging: "Some trauma-informed framing is appearing. Build: use supervision to link specific behaviour to specific adversity.",
    dormant:  "ACEs / trauma-informed framing is not yet visible. Explore: what training would help staff understand the science of adversity?",
  },
  model_ddp: {
    active:   "DDP-aligned practice is visible. Explore: where does 'blocked care' feel most real for this staff member?",
    emerging: "Some DDP-aligned approaches are emerging. Deepen: explore intersubjectivity — sharing emotion — as the heart of DDP.",
    dormant:  "DDP practice evidence is not showing. Explore: what does therapeutic parenting look like day-to-day to this team?",
  },
  concept_rupture_repair: {
    active:   "Rupture-repair is well-evidenced. Ask: how does the team decide when a repair has been genuinely made vs performed?",
    emerging: "Some repair language is appearing. Build on it: explore what repair feels like for staff, not just the child.",
    dormant:  "Rupture-repair is not visible. Explore: what is the team's default pattern after a difficult moment?",
  },
};

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET() {
  const store = getStore();
  const NOW_MS = Date.now();
  const MS_30D = 30 * 24 * 60 * 60 * 1000;

  // Counters: fwId → { total, recent, prior, byStaff: Map<staffId, count>, sources: {...} }
  type Counts = {
    total: number;
    recent: number;
    prior: number;
    byStaff: Map<string, number>;
    sources: { writingAssistant: number; reflectiveSupervision: number; incidentMode: number; paceProfiles: number; practiceObservations: number };
  };
  const counts: Map<FrameworkId, Counts> = new Map(
    FRAMEWORK_IDS.map((id) => [id, {
      total: 0, recent: 0, prior: 0,
      byStaff: new Map(),
      sources: { writingAssistant: 0, reflectiveSupervision: 0, incidentMode: 0, paceProfiles: 0, practiceObservations: 0 },
    }]),
  );

  function bump(fwId: FrameworkId, dateStr: string | null | undefined, staffId: string | null | undefined, source: keyof Counts["sources"]) {
    const c = counts.get(fwId);
    if (!c) return;
    c.total += 1;
    c.sources[source] += 1;
    if (staffId) c.byStaff.set(staffId, (c.byStaff.get(staffId) ?? 0) + 1);
    const ms = dateStr ? new Date(dateStr).getTime() : NaN;
    if (!isNaN(ms)) {
      const age = NOW_MS - ms;
      if (age >= 0 && age <= MS_30D) c.recent += 1;
      else if (age > MS_30D && age <= MS_30D * 2) c.prior += 1;
    }
  }

  // ── 1. Writing Assistant audit events ─────────────────────────────────────
  const waud = (store.writingAssistantAuditEvents ?? []) as Array<{
    user_id: string; issue_type: string; action: string; created_at: string;
  }>;
  for (const e of waud) {
    if (e.action !== "accepted") continue;
    const fwId = WA_ISSUE_TO_FW[e.issue_type];
    if (fwId) bump(fwId, e.created_at, e.user_id, "writingAssistant");
  }

  // ── 2. Reflective supervision sessions ────────────────────────────────────
  const reflSups = (store.reflectiveSupervisions ?? []) as Array<{
    id: string; staff_id: string; date: string; pace_examples: string;
    confidence_level: number; emotional_wellbeing: string;
  }>;
  for (const s of reflSups) {
    if (s.pace_examples && s.pace_examples.trim().length > 10) {
      bump("model_pace", s.date, s.staff_id, "reflectiveSupervision");
    }
    if (s.confidence_level !== undefined) {
      bump("concept_psychological_safety", s.date, s.staff_id, "reflectiveSupervision");
    }
  }

  // ── 3. Cara incident sessions ─────────────────────────────────────────────
  const incSessions = (store.caraIncidentSessions ?? []) as Array<{
    started_by_user_id: string; created_at: string; incident_type: string;
  }>;
  for (const s of incSessions) {
    bump("model_pace", s.created_at, s.started_by_user_id, "incidentMode");
    bump("concept_rupture_repair", s.created_at, s.started_by_user_id, "incidentMode");
  }

  // ── 4. PACE profiles ──────────────────────────────────────────────────────
  const paceProfiles = (store.childPaceProfiles ?? []) as Array<{
    updatedBy: string; updatedAt: string; trustedAdults: string[]; traumaInformedStrategies: string[];
  }>;
  for (const p of paceProfiles) {
    if (p.trustedAdults?.length > 0) {
      bump("model_pace", p.updatedAt, p.updatedBy, "paceProfiles");
    }
    if (p.traumaInformedStrategies?.length > 0) {
      bump("concept_aces", p.updatedAt, p.updatedBy, "paceProfiles");
    }
  }

  // ── 5. Practice observations ──────────────────────────────────────────────
  const practiceObs = (store.practiceObservations ?? []) as Array<{
    observer_id: string; observation_date: string; domains_observed: string[];
  }>;
  for (const o of practiceObs) {
    for (const domain of (o.domains_observed ?? [])) {
      const fwId = DOMAIN_TO_FW[domain];
      if (fwId) bump(fwId, o.observation_date, o.observer_id, "practiceObservations");
    }
  }

  // ── Build per-framework results ───────────────────────────────────────────
  const staffArr = (store.staff ?? []) as Array<{
    id: string; full_name?: string; first_name?: string; last_name?: string;
  }>;
  function staffName(id: string): string {
    const s = staffArr.find((x) => x.id === id);
    if (!s) return id;
    if (s.full_name) return s.full_name;
    const parts = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim();
    return parts || id;
  }

  const frameworks = FRAMEWORK_IDS.map((fwId) => {
    const c = counts.get(fwId)!;
    const sig = signal(c.total);
    const topEngagers = [...c.byStaff.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([staffId, count]) => ({ staffId, name: staffName(staffId), count }));

    return {
      frameworkId: fwId,
      title: KB_FRAMEWORKS[fwId].title,
      shortDesc: KB_FRAMEWORKS[fwId].shortDesc,
      icon: KB_FRAMEWORKS[fwId].icon,
      totalEngagements: c.total,
      sources: c.sources,
      signal: sig,
      trend: trend(c.recent, c.prior),
      topEngagers,
      supervisionPrompt: SUPERVISION_PROMPTS[fwId][sig],
    };
  });

  // Sort: active → emerging → dormant, then by total desc
  const signalRank: Record<Signal, number> = { active: 0, emerging: 1, dormant: 2 };
  frameworks.sort((a, b) => {
    const rank = signalRank[a.signal] - signalRank[b.signal];
    return rank !== 0 ? rank : b.totalEngagements - a.totalEngagements;
  });

  // ── Team summary ──────────────────────────────────────────────────────────
  const mostActive = frameworks.find((f) => f.signal === "active") ?? null;
  const needsAttention = frameworks.slice().reverse().find((f) => f.signal === "dormant") ?? null;
  const totalEngagements = frameworks.reduce((s, f) => s + f.totalEngagements, 0);
  const activeCount = frameworks.filter((f) => f.signal === "active").length;

  // Staff with most total engagements across all frameworks
  const staffTotals = new Map<string, number>();
  for (const f of frameworks) {
    for (const e of f.topEngagers) {
      staffTotals.set(e.staffId, (staffTotals.get(e.staffId) ?? 0) + e.count);
    }
  }
  const topPractitioner = staffTotals.size > 0
    ? [...staffTotals.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 1)
        .map(([id, count]) => ({ staffId: id, name: staffName(id), count }))[0]
    : null;

  return NextResponse.json({
    data: {
      frameworks,
      summary: {
        totalEngagements,
        activeFrameworks: activeCount,
        mostActiveFramework: mostActive ? { id: mostActive.frameworkId, title: mostActive.title } : null,
        needsAttentionFramework: needsAttention ? { id: needsAttention.frameworkId, title: needsAttention.title } : null,
        topPractitioner,
        sourceBreakdown: {
          writingAssistant: frameworks.reduce((s, f) => s + f.sources.writingAssistant, 0),
          reflectiveSupervision: frameworks.reduce((s, f) => s + f.sources.reflectiveSupervision, 0),
          incidentMode: frameworks.reduce((s, f) => s + f.sources.incidentMode, 0),
          paceProfiles: frameworks.reduce((s, f) => s + f.sources.paceProfiles, 0),
          practiceObservations: frameworks.reduce((s, f) => s + f.sources.practiceObservations, 0),
        },
      },
    },
  });
}
