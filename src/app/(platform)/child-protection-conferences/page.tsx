"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface CpConference {
  id: string;
  youngPerson: string;
  conferenceType: "Initial CP Conference" | "Review CP Conference" | "Pre-Birth Conference" | "Strategy Meeting";
  date: string;
  chairperson: string;
  outcome: "Subject to CP Plan" | "Plan Continued" | "Plan Stepped Down" | "No CP Plan Required" | "Strategy Decision Made";
  category: "Neglect" | "Physical Abuse" | "Sexual Abuse" | "Emotional Abuse" | "Multiple Categories" | "N/A";
  attendedBy: string;
  homeRepresentation: string;
  childAttended: boolean;
  childContribution: string;
  agenciesPresent: string[];
  keyConcerns: string[];
  protectiveFactors: string[];
  decisionsAgreed: string[];
  cpPlanActions: { action: string; owner: string; deadline: string; }[];
  nextReviewDate: string;
  reportSubmittedDate: string;
  reportAuthor: string;
  followUpComplete: boolean;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: CpConference[] = [
  {
    id: "cpc-001",
    youngPerson: "yp_alex",
    conferenceType: "Review CP Conference",
    date: d(-21),
    chairperson: "Helen Frost — Independent Chair, Riverside LSCB",
    outcome: "Plan Stepped Down",
    category: "Emotional Abuse",
    attendedBy: "staff_darren",
    homeRepresentation: "Registered Manager attended in person, contributed full home report",
    childAttended: false,
    childContribution: "Alex did not attend (chose not to). Views captured via advocate and pre-conference key work session. Alex stated they feel safe at Oak House and want to continue here.",
    agenciesPresent: [
      "Independent Chair (Riverside LSCB)",
      "Allocated Social Worker (Sarah Mitchell)",
      "School SENCO",
      "CAMHS Therapist",
      "Health Visitor (transition to school nurse pending)",
      "Police representative (CSE awareness)",
      "Independent Reviewing Officer",
      "Children's Home Representative (RM)",
    ],
    keyConcerns: [
      "Historical emotional harm from parental conflict and DV exposure",
      "ADHD and trauma presentation requiring continued specialist input",
      "Education engagement still developing post-PRU",
    ],
    protectiveFactors: [
      "Stable placement at Oak House for 6+ months",
      "Strong key worker relationship (Edward)",
      "Engaging well with therapy",
      "School attendance improved to 88%",
      "Mother making sustained progress in own treatment",
    ],
    decisionsAgreed: [
      "CP Plan stepped down to Child in Need (CIN) status",
      "Continued placement at Oak House confirmed",
      "Therapy to continue for minimum further 6 months",
      "Educational psychology assessment to be commissioned",
      "Family contact arrangements unchanged",
    ],
    cpPlanActions: [
      { action: "EP assessment referral submitted", owner: "Sarah Mitchell (SW)", deadline: d(7) },
      { action: "Updated CIN plan drafted and shared", owner: "Sarah Mitchell (SW)", deadline: d(14) },
      { action: "School nurse handover completed", owner: "Health Visitor", deadline: d(21) },
      { action: "Six-month CIN review scheduled", owner: "Sarah Mitchell (SW)", deadline: d(180) },
    ],
    nextReviewDate: d(180),
    reportSubmittedDate: d(-25),
    reportAuthor: "staff_darren",
    followUpComplete: true,
  },
  {
    id: "cpc-002",
    youngPerson: "yp_jordan",
    conferenceType: "Review CP Conference",
    date: d(-7),
    chairperson: "Marcus Webb — Independent Chair, Valley LSCB",
    outcome: "Plan Continued",
    category: "Neglect",
    attendedBy: "staff_ryan",
    homeRepresentation: "Deputy Manager attended, provided written report and verbal update",
    childAttended: true,
    childContribution: "Jordan attended for the first time with advocate support. Spoke briefly about feeling settled at Oak House and concerns about contact with mother. Conference paused for child-friendly summary.",
    agenciesPresent: [
      "Independent Chair (Valley LSCB)",
      "Allocated Social Worker (Tom Richards)",
      "School Designated Safeguarding Lead",
      "GP",
      "Police (Missing/Exploitation team)",
      "Prison liaison (mother in custody)",
      "Independent Reviewing Officer",
      "Advocate",
      "Children's Home Representative",
    ],
    keyConcerns: [
      "Recent missing-from-care episode (returned within 4 hours, safe)",
      "Mother's release from custody approaching — contact management complex",
      "Peer associations in community require ongoing safeguarding consideration",
    ],
    protectiveFactors: [
      "Strong placement stability — 18 months at Oak House",
      "Football club provides positive peer group and adult mentor",
      "School engagement strong, no exclusions in 12 months",
      "Jordan demonstrates increasing emotional literacy",
      "Open communication with key worker",
    ],
    decisionsAgreed: [
      "CP Plan continues under Neglect category",
      "Pre-release planning with mother's prison social worker",
      "Contact safety plan to be reviewed before mother's release",
      "Contextual safeguarding mapping updated quarterly",
      "Advocate involvement to continue",
    ],
    cpPlanActions: [
      { action: "Pre-release planning meeting with prison social worker", owner: "Tom Richards (SW)", deadline: d(14) },
      { action: "Contact risk assessment updated", owner: "staff_darren", deadline: d(21) },
      { action: "Contextual safeguarding map refreshed", owner: "staff_ryan", deadline: d(28) },
      { action: "Police community presence review", owner: "Police YOT liaison", deadline: d(30) },
    ],
    nextReviewDate: d(85),
    reportSubmittedDate: d(-12),
    reportAuthor: "staff_darren",
    followUpComplete: false,
  },
  {
    id: "cpc-003",
    youngPerson: "yp_casey",
    conferenceType: "Initial CP Conference",
    date: d(-90),
    chairperson: "Helen Frost — Independent Chair, Hillside LSCB",
    outcome: "Subject to CP Plan",
    category: "Neglect",
    attendedBy: "staff_darren",
    homeRepresentation: "Registered Manager attended virtually, comprehensive report submitted",
    childAttended: false,
    childContribution: "Casey did not attend (assessed as inappropriate given communication needs and anxiety). Views captured by SW visit using visual tools and shared with conference.",
    agenciesPresent: [
      "Independent Chair (Hillside LSCB)",
      "Allocated Social Worker (Lisa Chen)",
      "Special Needs Coordinator",
      "Paediatrician",
      "SALT (Speech and Language Therapy)",
      "Police (historical neglect investigation)",
      "Independent Reviewing Officer",
      "Children's Home Representative",
    ],
    keyConcerns: [
      "Chronic neglect history requiring ongoing safeguarding plan",
      "Complex trauma and ASD presentation",
      "Birth parents' continued involvement requires monitoring",
      "Specialist health needs require coordinated multi-agency input",
    ],
    protectiveFactors: [
      "Specialist placement at Oak House meeting needs",
      "ASD diagnosis now formal — appropriate adjustments in place",
      "Engaged with art therapy — significant therapeutic benefit",
      "Stable routines and sensory environment",
    ],
    decisionsAgreed: [
      "Casey subject to CP Plan under Neglect category",
      "Placement at Oak House to continue",
      "Multi-agency core group to meet monthly",
      "Direct work with Casey to continue at Oak House pace",
      "Family contact via letterbox only (current arrangement maintained)",
    ],
    cpPlanActions: [
      { action: "Multi-agency core group convened monthly", owner: "Lisa Chen (SW)", deadline: d(-60) },
      { action: "Sensory profile shared with all professionals", owner: "staff_anna", deadline: d(-80) },
      { action: "Health action plan implemented", owner: "Paediatrician", deadline: d(-70) },
      { action: "3-month review scheduled", owner: "Lisa Chen (SW)", deadline: d(0) },
    ],
    nextReviewDate: d(0),
    reportSubmittedDate: d(-95),
    reportAuthor: "staff_darren",
    followUpComplete: true,
  },
  {
    id: "cpc-004",
    youngPerson: "yp_alex",
    conferenceType: "Strategy Meeting",
    date: d(-45),
    chairperson: "DI Sarah Holmes — Riverside Police PVP",
    outcome: "Strategy Decision Made",
    category: "N/A",
    attendedBy: "staff_darren",
    homeRepresentation: "Registered Manager attended, provided incident context and risk assessment",
    childAttended: false,
    childContribution: "Not appropriate for strategy meeting. Alex's voice represented through home report.",
    agenciesPresent: [
      "Police (Detective Inspector)",
      "Allocated Social Worker (Sarah Mitchell)",
      "Children's Home Representative",
      "School DSL",
    ],
    keyConcerns: [
      "Single allegation by Alex of historical concern relating to family member",
      "Concerns raised during therapy session — credible disclosure",
    ],
    protectiveFactors: [
      "Alex disclosed in trusted therapeutic relationship",
      "No current contact with named individual",
      "Placement and therapeutic support continuing",
    ],
    decisionsAgreed: [
      "Joint investigation under Section 47 not progressing — historical, no current risk identified",
      "Single agency assessment by Children's Services to update CP Plan if needed",
      "Police to assess for criminal investigation separately",
      "Therapeutic support to continue",
      "Information shared with conference chair for next CP review",
    ],
    cpPlanActions: [
      { action: "S47 single agency assessment", owner: "Sarah Mitchell (SW)", deadline: d(-15) },
      { action: "Police investigation outcome noted", owner: "DI Holmes", deadline: d(-30) },
      { action: "Outcome shared with CP review", owner: "Sarah Mitchell (SW)", deadline: d(-21) },
    ],
    nextReviewDate: d(-21),
    reportSubmittedDate: d(-46),
    reportAuthor: "staff_darren",
    followUpComplete: true,
  },
];

// ── config ──────────────────────────────────────────────────────────────────
const outcomeColour: Record<string, string> = {
  "Subject to CP Plan": "bg-red-100 text-red-800",
  "Plan Continued": "bg-amber-100 text-amber-800",
  "Plan Stepped Down": "bg-blue-100 text-blue-800",
  "No CP Plan Required": "bg-green-100 text-green-800",
  "Strategy Decision Made": "bg-purple-100 text-purple-800",
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<CpConference>[] = [
  { header: "Young Person", accessor: (r: CpConference) => getYPName(r.youngPerson) },
  { header: "Type", accessor: (r: CpConference) => r.conferenceType },
  { header: "Date", accessor: (r: CpConference) => r.date },
  { header: "Outcome", accessor: (r: CpConference) => r.outcome },
  { header: "Category", accessor: (r: CpConference) => r.category },
  { header: "Chair", accessor: (r: CpConference) => r.chairperson },
  { header: "Home Rep", accessor: (r: CpConference) => getStaffName(r.attendedBy) },
  { header: "Child Attended", accessor: (r: CpConference) => r.childAttended ? "Yes" : "No" },
  { header: "Next Review", accessor: (r: CpConference) => r.nextReviewDate },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildProtectionConferencesPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((c) => c.youngPerson === filterYP);
    if (filterType !== "all") items = items.filter((c) => c.conferenceType === filterType);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "next-review":
          return a.nextReviewDate.localeCompare(b.nextReviewDate);
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterType, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const onCpPlan = data.filter((c) => c.outcome === "Subject to CP Plan" || c.outcome === "Plan Continued").length;
  const childrenAttended = data.filter((c) => c.childAttended).length;
  const followUpPending = data.filter((c) => !c.followUpComplete).length;
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingReviews = data.filter((c) => c.nextReviewDate >= todayStr && c.nextReviewDate <= d(60)).length;

  return (
    <PageShell
      title="Child Protection Conferences"
      subtitle="Statutory conference attendance, decisions, and follow-up — multi-agency safeguarding records"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="cp-conferences" />
          <PrintButton title="Child Protection Conferences" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">Total Conferences</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{onCpPlan}</p>
          <p className="text-xs text-muted-foreground">On CP Plan</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{upcomingReviews}</p>
          <p className="text-xs text-muted-foreground">Reviews Next 60 Days</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{childrenAttended}/{data.length}</p>
          <p className="text-xs text-muted-foreground">Children Attended</p>
        </div>
      </div>

      {/* ── alert banner ───────────────────────────────────────────────── */}
      {followUpPending > 0 && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 mb-6 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            <strong>{followUpPending} conference{followUpPending !== 1 ? "s" : ""}</strong> with outstanding follow-up actions. Review action tracker.
          </p>
        </div>
      )}

      {/* ── filters/sort ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterYP} onValueChange={setFilterYP}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Initial CP Conference">Initial CP Conference</SelectItem>
            <SelectItem value="Review CP Conference">Review CP Conference</SelectItem>
            <SelectItem value="Pre-Birth Conference">Pre-Birth Conference</SelectItem>
            <SelectItem value="Strategy Meeting">Strategy Meeting</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="next-review">Next Review</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── conference cards ───────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No conferences match your filters.</div>
        )}
        {filtered.map((conf) => {
          const isExpanded = expandedId === conf.id;

          return (
            <div key={conf.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : conf.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Shield className="h-5 w-5 text-red-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{conf.conferenceType}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conf.date} &middot; {getYPName(conf.youngPerson)} &middot; Chair: {conf.chairperson.split(" — ")[0]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", outcomeColour[conf.outcome])}>
                    {conf.outcome}
                  </span>
                  {conf.followUpComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  {/* attendance summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Home Representation</p>
                      <p className="text-sm">{conf.homeRepresentation}</p>
                      <p className="text-xs text-muted-foreground mt-1">By: {getStaffName(conf.attendedBy)}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Child Participation</p>
                      <p className="text-sm">{conf.childAttended ? "Child attended" : "Child did not attend"}</p>
                      <p className="text-xs text-muted-foreground mt-1">{conf.childContribution}</p>
                    </div>
                  </div>

                  {/* agencies */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Users className="h-3 w-3 inline mr-1" />Agencies Present ({conf.agenciesPresent.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {conf.agenciesPresent.map((a, i) => (
                        <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{a}</span>
                      ))}
                    </div>
                  </div>

                  {/* concerns vs protective */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Key Concerns
                      </p>
                      <ul className="space-y-1">
                        {conf.keyConcerns.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <Shield className="h-3 w-3 inline mr-1" />Protective Factors
                      </p>
                      <ul className="space-y-1">
                        {conf.protectiveFactors.map((p, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-green-600 mt-0.5">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* decisions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <FileText className="h-3 w-3 inline mr-1" />Decisions Agreed
                    </p>
                    <ul className="space-y-1">
                      {conf.decisionsAgreed.map((dec, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          {dec}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* actions */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">CP Plan Actions</p>
                    <div className="space-y-1">
                      {conf.cpPlanActions.map((act, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                          <span>{act.action}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {act.owner.split(" (")[0]} &middot; {act.deadline}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* metadata */}
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Calendar className="h-3 w-3 inline mr-1" />Next review: {conf.nextReviewDate}</span>
                    <span>Report submitted: {conf.reportSubmittedDate}</span>
                    <span>Author: {getStaffName(conf.reportAuthor)}</span>
                    <span>Category: {conf.category}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Child protection conference records support Working Together to
          Safeguard Children 2023, Children Act 1989 (Section 47), and Quality Standard 5 (protection of children).
          The home submits comprehensive reports to all conferences and represents children where appropriate.
          Children&apos;s wishes and feelings are always central to conference decisions per the Lundy model of
          participation.
        </p>
      </div>
    </PageShell>
  );
}
