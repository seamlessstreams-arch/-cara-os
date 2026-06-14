// ══════════════════════════════════════════════════════════════════════════════
// CARA — VISITORS INTELLIGENCE ENGINE
// Pure deterministic engine for visitor management analysis.
// Reg 12 (contact arrangements), Reg 22 (contact), Reg 44 (independent visits),
// SCCIF Helped & Protected, Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

export interface VisitorInput {
  id: string;
  date: string;
  visitor_name: string;
  organisation: string | null;
  category: string;
  purpose: string;
  dbs_checked: boolean;
  id_verified: boolean;
  sign_in_time: string;
  sign_out_time: string | null;
  status: string;
  host_staff_id: string;
  children_seen: string[];
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

export interface VisitorsOverview {
  total_visits: number;
  visits_last_30_days: number;
  currently_signed_in: number;
  unique_visitors: number;
  dbs_compliance_rate: number;
  id_compliance_rate: number;
  children_with_visits: number;
  professional_visits: number;
  family_visits: number;
}

export interface VisitorCategoryBreakdown {
  category: string;
  category_label: string;
  count: number;
  pct: number;
}

export interface ChildVisitorProfile {
  child_id: string;
  child_name: string;
  total_visits: number;
  professional_visits: number;
  family_visits: number;
  last_visit_date: string;
  days_since_last_visit: number;
  visitor_names: string[];
}

export interface RecentVisitor {
  id: string;
  date: string;
  visitor_name: string;
  category: string;
  category_label: string;
  purpose: string;
  status: string;
  children_seen_names: string[];
}

export interface VisitorAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface CaraVisitorInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

export interface VisitorsIntelligenceResult {
  overview: VisitorsOverview;
  category_breakdown: VisitorCategoryBreakdown[];
  child_profiles: ChildVisitorProfile[];
  recent_visitors: RecentVisitor[];
  alerts: VisitorAlert[];
  insights: CaraVisitorInsight[];
}

interface EngineInput {
  visitors: VisitorInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z");
  const db = new Date(b + "T00:00:00Z");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

const CATEGORY_LABELS: Record<string, string> = {
  professional: "Professional",
  family: "Family",
  tradesperson: "Tradesperson",
  inspector: "Inspector",
  volunteer: "Volunteer",
  other: "Other",
};

function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeVisitorsIntelligence(input: EngineInput): VisitorsIntelligenceResult {
  const { visitors, children, staff, today = new Date().toISOString().slice(0, 10) } = input;

  if (visitors.length === 0) {
    return {
      overview: {
        total_visits: 0, visits_last_30_days: 0, currently_signed_in: 0,
        unique_visitors: 0, dbs_compliance_rate: 100, id_compliance_rate: 100,
        children_with_visits: 0, professional_visits: 0, family_visits: 0,
      },
      category_breakdown: [],
      child_profiles: [],
      recent_visitors: [],
      alerts: [],
      insights: [],
    };
  }

  const childMap = new Map(children.map((c) => [c.id, c.name]));

  // ── Overview ────────────────────────────────────────────────────────────
  const last30 = visitors.filter((v) => {
    const d = daysBetween(v.date, today);
    return d >= 0 && d <= 30;
  });
  const signedIn = visitors.filter((v) => v.status === "signed_in");
  const uniqueNames = new Set(visitors.map((v) => v.visitor_name));
  const dbsRequired = visitors.filter((v) => v.category === "professional" || v.category === "inspector" || v.category === "volunteer");
  const dbsCompliant = dbsRequired.filter((v) => v.dbs_checked);
  const idVerified = visitors.filter((v) => v.id_verified);
  const childrenWithVisits = new Set(visitors.flatMap((v) => v.children_seen));
  const professional = visitors.filter((v) => v.category === "professional" || v.category === "inspector");
  const family = visitors.filter((v) => v.category === "family");

  const overview: VisitorsOverview = {
    total_visits: visitors.length,
    visits_last_30_days: last30.length,
    currently_signed_in: signedIn.length,
    unique_visitors: uniqueNames.size,
    dbs_compliance_rate: dbsRequired.length > 0 ? Math.round((dbsCompliant.length / dbsRequired.length) * 100) : 100,
    id_compliance_rate: visitors.length > 0 ? Math.round((idVerified.length / visitors.length) * 100) : 100,
    children_with_visits: childrenWithVisits.size,
    professional_visits: professional.length,
    family_visits: family.length,
  };

  // ── Category breakdown ──────────────────────────────────────────────────
  const catCounts = new Map<string, number>();
  for (const v of visitors) {
    catCounts.set(v.category, (catCounts.get(v.category) ?? 0) + 1);
  }
  const category_breakdown: VisitorCategoryBreakdown[] = [...catCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([cat, count]) => ({
      category: cat,
      category_label: categoryLabel(cat),
      count,
      pct: Math.round((count / visitors.length) * 100),
    }));

  // ── Child profiles ──────────────────────────────────────────────────────
  const childVisits = new Map<string, VisitorInput[]>();
  for (const v of visitors) {
    for (const cid of v.children_seen) {
      const arr = childVisits.get(cid) ?? [];
      arr.push(v);
      childVisits.set(cid, arr);
    }
  }

  const child_profiles: ChildVisitorProfile[] = [...childVisits.entries()]
    .map(([childId, visits]) => {
      const sorted = [...visits].sort((a, b) => b.date.localeCompare(a.date));
      const lastDate = sorted[0].date;
      const profVisits = visits.filter((v) => v.category === "professional" || v.category === "inspector");
      const famVisits = visits.filter((v) => v.category === "family");
      const names = [...new Set(visits.map((v) => v.visitor_name))];

      return {
        child_id: childId,
        child_name: childMap.get(childId) ?? childId,
        total_visits: visits.length,
        professional_visits: profVisits.length,
        family_visits: famVisits.length,
        last_visit_date: lastDate,
        days_since_last_visit: daysBetween(lastDate, today),
        visitor_names: names,
      };
    })
    .sort((a, b) => b.total_visits - a.total_visits);

  // ── Recent visitors ─────────────────────────────────────────────────────
  const recent_visitors: RecentVisitor[] = [...visitors]
    .sort((a, b) => b.date.localeCompare(a.date) || b.sign_in_time.localeCompare(a.sign_in_time))
    .slice(0, 6)
    .map((v) => ({
      id: v.id,
      date: v.date,
      visitor_name: v.visitor_name,
      category: v.category,
      category_label: categoryLabel(v.category),
      purpose: v.purpose,
      status: v.status,
      children_seen_names: v.children_seen.map((cid) => childMap.get(cid) ?? cid),
    }));

  // ── Alerts ──────────────────────────────────────────────────────────────
  const alerts: VisitorAlert[] = [];

  // Critical: visitors currently signed in who haven't signed out
  for (const v of signedIn) {
    const daysOld = daysBetween(v.date, today);
    if (daysOld >= 1) {
      alerts.push({
        type: "unsigned_out",
        severity: "critical",
        message: `${v.visitor_name} signed in on ${v.date} but never signed out. Check sign-out records and update immediately.`,
      });
    }
  }

  // High: DBS not checked for professional visitors
  const noDbs = visitors.filter((v) =>
    (v.category === "professional" || v.category === "inspector" || v.category === "volunteer") && !v.dbs_checked
  );
  if (noDbs.length > 0) {
    alerts.push({
      type: "dbs_gap",
      severity: "high",
      message: `${noDbs.length} professional/inspector/volunteer visit${noDbs.length > 1 ? "s" : ""} without DBS verification. Safeguarding risk — ensure all regulated visitors have DBS checked before contact.`,
    });
  }

  // Medium: children not visited recently (>21 days no professional contact)
  for (const child of children) {
    const profile = child_profiles.find((p) => p.child_id === child.id);
    if (!profile) {
      alerts.push({
        type: "no_visits",
        severity: "medium",
        message: `${child.name} has no recorded visitor contact. Ensure statutory visits and family contact are logged.`,
      });
    } else if (profile.days_since_last_visit > 21) {
      alerts.push({
        type: "infrequent_visits",
        severity: "medium",
        message: `${child.name}'s last visitor contact was ${profile.days_since_last_visit} days ago. Review contact frequency.`,
      });
    }
  }

  // Low: ID not verified
  const noId = visitors.filter((v) => !v.id_verified);
  if (noId.length > 0) {
    alerts.push({
      type: "id_gap",
      severity: "low",
      message: `${noId.length} visit${noId.length > 1 ? "s" : ""} without ID verification. Ensure all visitors present identification on arrival.`,
    });
  }

  // ── Cara Insights ──────────────────────────────────────────────────────
  const insights: CaraVisitorInsight[] = [];

  // Critical: DBS gap for professional visitors
  if (noDbs.length > 0) {
    insights.push({
      severity: "critical",
      text: `${noDbs.length} regulated visitor${noDbs.length > 1 ? "s" : ""} attended without DBS verification. This is a safeguarding breach — review visitor management procedures immediately.`,
    });
  }

  // Warning: children without family contact
  const noFamilyContact = children.filter((c) => {
    const profile = child_profiles.find((p) => p.child_id === c.id);
    return !profile || profile.family_visits === 0;
  });
  if (noFamilyContact.length > 0) {
    insights.push({
      severity: "warning",
      text: `${noFamilyContact.length} child${noFamilyContact.length > 1 ? "ren have" : " has"} no recorded family visitor contact. Review contact plans per Reg 12 (contact arrangements).`,
    });
  }

  // Warning: unsigned out visitors
  const unsignedOld = signedIn.filter((v) => daysBetween(v.date, today) >= 1);
  if (unsignedOld.length > 0) {
    insights.push({
      severity: "warning",
      text: `${unsignedOld.length} visitor${unsignedOld.length > 1 ? "s" : ""} still showing as signed in from previous days. Update sign-out records to maintain accurate safeguarding log.`,
    });
  }

  // Positive: high DBS compliance
  if (overview.dbs_compliance_rate === 100 && dbsRequired.length > 0) {
    insights.push({
      severity: "positive",
      text: `100% DBS compliance for all ${dbsRequired.length} regulated visitors. Safeguarding checks robust.`,
    });
  }

  // Positive: all children receiving visits
  if (childrenWithVisits.size >= children.length && children.length > 0) {
    insights.push({
      severity: "positive",
      text: `All ${children.length} children have had visitor contact. Statutory and family contact arrangements being met.`,
    });
  }

  // Positive: good ID verification
  if (overview.id_compliance_rate === 100 && visitors.length > 0) {
    insights.push({
      severity: "positive",
      text: `100% ID verification rate across all ${visitors.length} visits. Visitor management procedures consistently followed.`,
    });
  }

  // Positive: balanced visitor types
  if (professional.length > 0 && family.length > 0) {
    insights.push({
      severity: "positive",
      text: `Balanced visitor profile — ${professional.length} professional and ${family.length} family visits. Children's network includes both professional support and family contact.`,
    });
  }

  // Positive: multiple staff hosting
  const uniqueHosts = new Set(visitors.map((v) => v.host_staff_id));
  if (uniqueHosts.size >= 3) {
    insights.push({
      severity: "positive",
      text: `${uniqueHosts.size} different staff members hosting visitors, demonstrating shared responsibility for contact arrangements.`,
    });
  }

  return {
    overview,
    category_breakdown,
    child_profiles,
    recent_visitors,
    alerts,
    insights,
  };
}
