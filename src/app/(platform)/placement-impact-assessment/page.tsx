"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  ChevronUp,
  ChevronDown,
  Users,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Shield,
  Heart,
  ArrowUpDown,
  XCircle,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface ImpactOnChild {
  childId: string;
  riskLevel: "low" | "medium" | "high";
  considerations: string[];
  mitigations: string[];
  childView: string | null;
}

interface PlacementImpactAssessment {
  id: string;
  referralName: string;
  referralAge: number;
  referralGender: string;
  referralLA: string;
  assessedBy: string;
  assessmentDate: string;
  status: "approved" | "declined" | "pending" | "approved_with_conditions";
  overallRisk: "low" | "medium" | "high";
  decision: string;
  decisionRationale: string;
  impactOnExisting: ImpactOnChild[];
  compatibilityFactors: { factor: string; rating: "positive" | "neutral" | "concern" }[];
  staffingImplications: string[];
  environmentalConsiderations: string[];
  safeguardingConsiderations: string[];
  conditions: string[];
  reviewDate: string | null;
  notes: string;
}

/* ─── seed data ─── */
const assessments: PlacementImpactAssessment[] = [
  {
    id: "pia_001",
    referralName: "Child M (anonymised)",
    referralAge: 14,
    referralGender: "Male",
    referralLA: "Barchester City Council",
    assessedBy: "staff_darren",
    assessmentDate: d(-60),
    status: "approved_with_conditions",
    overallRisk: "medium",
    decision: "Placement approved with enhanced support plan",
    decisionRationale: "Child M's profile is broadly compatible with existing group. Main concerns around CSE history and Casey's existing vulnerabilities were mitigated by the conditions below. Staffing ratios already exceed minimum. Child M's needs can be met within the home's therapeutic model. RI consulted and agrees. Note: this was the placement that became Casey's actual placement.",
    impactOnExisting: [
      {
        childId: "yp_alex",
        riskLevel: "low",
        considerations: [
          "Alex is settled and confident — unlikely to be destabilised by new admission",
          "Similar age may support friendship development",
          "Alex has asked about having another child in the home",
        ],
        mitigations: [
          "Key worker to check in with Alex during settling-in period",
          "Maintain Alex's routines unchanged",
        ],
        childView: "Alex said 'it would be nice to have someone my age' when asked generally about new admissions.",
      },
      {
        childId: "yp_jordan",
        riskLevel: "medium",
        considerations: [
          "Jordan sensitive to change — may become dysregulated during transition",
          "Jordan has attachment difficulties — may feel threatened by attention given to new child",
          "Noise/disruption during settling could trigger Jordan's sensory difficulties",
        ],
        mitigations: [
          "Pre-admission preparation work with Jordan (social story, timeline)",
          "Jordan's quiet space guaranteed — no disruption during settling",
          "Extra key work sessions in weeks 1-4",
          "Jordan's therapist briefed and available for additional sessions",
          "Staff to explicitly reassure Jordan that their needs remain priority",
        ],
        childView: "Jordan was anxious when told about potential new admission. Said 'what if they're loud?' and 'will you still have time for me?' These concerns are being addressed therapeutically.",
      },
    ],
    compatibilityFactors: [
      { factor: "Age compatibility (14M with 13F, 12NB, 15NB)", rating: "positive" },
      { factor: "No history of aggression toward younger/vulnerable children", rating: "positive" },
      { factor: "CSE concerns in referral — potential for peer exploitation dynamics", rating: "concern" },
      { factor: "Education in place — different school to existing children", rating: "positive" },
      { factor: "No substance misuse concerns", rating: "positive" },
      { factor: "Referral notes emotional dysregulation — could clash with Jordan's needs", rating: "concern" },
      { factor: "Shared interests (gaming, sports) may aid peer bonding", rating: "positive" },
    ],
    staffingImplications: [
      "No additional staff required — ratio moves from 2.3:1 to 1.75:1 (still exceeds Reg 40 minimum)",
      "Night waking staff now essential (already in place)",
      "Key worker identified: staff_chervelle (CSE expertise)",
      "Additional TCI refresher for all staff given potential for dysregulation",
    ],
    environmentalConsiderations: [
      "Bedroom 4 prepared — away from Jordan's room to reduce noise transfer",
      "Wi-Fi and device boundaries consistent with existing children",
      "Transport: school run feasible without additional vehicle",
    ],
    safeguardingConsiderations: [
      "CSE history: ensure no unsupervised contact between referral and Casey initially (both have CSE indicators)",
      "Online safety: review and tighten filters during settling period",
      "MACE meeting to be attended pre-admission to understand full CSE picture",
      "Existing children informed age-appropriately that new child will be joining",
    ],
    conditions: [
      "MACE meeting attended and full information shared before admission",
      "Enhanced supervision plan for first 4 weeks (never alone with Casey unsupervised)",
      "Jordan's therapy schedule to be increased during transition (agreed with CAMHS)",
      "72-hour review meeting at day 3, week 1, week 2, week 4",
      "Placing authority to fund additional therapeutic support if needed",
    ],
    reviewDate: d(-30),
    notes: "This assessment was completed for the referral that became Casey's actual placement. The conditions were met and the placement has been successful. Jordan's anxiety settled within 2 weeks. No exploitation dynamics emerged between Casey and existing children. Conditions have since been stepped down.",
  },
  {
    id: "pia_002",
    referralName: "Child R (anonymised)",
    referralAge: 11,
    referralGender: "Female",
    referralLA: "Greenshire County Council",
    assessedBy: "staff_darren",
    assessmentDate: d(-30),
    status: "declined",
    overallRisk: "high",
    decision: "Placement declined — not in best interests of existing children",
    decisionRationale: "Child R presents with severe fire-setting behaviour and a history of sexual harm toward younger children. With Jordan (12) in placement and Jordan's existing vulnerabilities (attachment, sensory, trauma), the combination presents unacceptable risk. Additionally, Child R requires specialist therapeutic provision that Oak House cannot provide within its current model. RI consulted and agrees with decision. Alternative placements suggested to placing LA.",
    impactOnExisting: [
      {
        childId: "yp_jordan",
        riskLevel: "high",
        considerations: [
          "Child R has history of sexually harmful behaviour toward children Jordan's age",
          "Jordan's trauma history makes them particularly vulnerable",
          "Jordan would require constant separation protocols — restrictive and harmful to Jordan",
          "Fire-setting risk in close proximity to Jordan (who already has heightened anxiety)",
        ],
        mitigations: [
          "Mitigations considered insufficient — risk cannot be adequately managed",
        ],
        childView: null,
      },
      {
        childId: "yp_alex",
        riskLevel: "medium",
        considerations: [
          "Alex is generally resilient but would be affected by increased restrictive measures",
          "Fire-setting risk requires enhanced environmental controls affecting all children",
          "Alex's settled routine would be significantly disrupted",
        ],
        mitigations: [
          "Even with mitigations, the overall disruption to Alex's stability is disproportionate",
        ],
        childView: null,
      },
      {
        childId: "yp_casey",
        riskLevel: "medium",
        considerations: [
          "Casey's exploitation vulnerabilities could be compounded by Child R's profile",
          "Casey is making good progress — placement disruption risk",
        ],
        mitigations: [
          "Mitigations would require constant supervision affecting Casey's growing independence",
        ],
        childView: null,
      },
    ],
    compatibilityFactors: [
      { factor: "Age (11F) — younger than all current residents", rating: "neutral" },
      { factor: "Severe fire-setting behaviour — environmental risk", rating: "concern" },
      { factor: "History of sexually harmful behaviour toward peers", rating: "concern" },
      { factor: "Requires specialist therapeutic input (MST/AIM)", rating: "concern" },
      { factor: "No current education placement — would need sourcing", rating: "concern" },
      { factor: "Placing LA requesting emergency — pressure to accept", rating: "concern" },
    ],
    staffingImplications: [
      "Would require 2:1 staffing for Child R — not achievable within current team without agency",
      "No staff member has AIM assessment training",
      "Night waking staff would require second person",
    ],
    environmentalConsiderations: [
      "Fire-setting risk requires: locked kitchen, restricted access to lighters/matches, enhanced fire detection",
      "These restrictions would significantly impact all children's daily lives",
      "Home is not designed for this level of environmental restriction",
    ],
    safeguardingConsiderations: [
      "Sexual harm history + Jordan's vulnerability = unacceptable combination",
      "Fire risk with 3 other children in the home",
      "Would require separating Child R from all other children at night",
      "Reg 44 visitor previously raised concerns about mixing profiles",
    ],
    conditions: [],
    reviewDate: null,
    notes: "Declined with clear rationale documented. Placing LA notified of decision and offered signposting to specialist provision. RM wrote detailed letter explaining why admission would harm existing children. This is exactly the kind of matching decision Ofsted expects to see evidenced.",
  },
  {
    id: "pia_003",
    referralName: "Child T (anonymised)",
    referralAge: 13,
    referralGender: "Male",
    referralLA: "Barchester City Council",
    assessedBy: "staff_darren",
    assessmentDate: d(-5),
    status: "pending",
    overallRisk: "low",
    decision: "Under consideration — awaiting further information from placing LA",
    decisionRationale: "Initial referral looks promising. Child T's profile appears compatible. Low-risk indicators. Main concern is that one child would need to move bedrooms to accommodate. Further information requested on education, health needs, and therapeutic input before final decision.",
    impactOnExisting: [
      {
        childId: "yp_alex",
        riskLevel: "low",
        considerations: [
          "Very similar age and interests — good potential for friendship",
          "Same school could be positive or challenging (needs discussion with VS head)",
          "Alex has expressed wanting another child close in age",
        ],
        mitigations: [
          "Introductory visit before admission to gauge compatibility",
          "School informed in advance",
        ],
        childView: "Alex keen on the idea when discussed generally (without sharing details of referral).",
      },
      {
        childId: "yp_jordan",
        riskLevel: "low",
        considerations: [
          "Child T described as calm and quiet — compatible with Jordan's sensory needs",
          "No aggression or harmful behaviour in history",
          "Jordan coped well with Casey's admission — more resilient now",
        ],
        mitigations: [
          "Same preparation approach as before (social story, advance notice, therapist briefing)",
        ],
        childView: "Jordan asked 'are they nice?' — good sign of openness compared to previous anxiety.",
      },
      {
        childId: "yp_casey",
        riskLevel: "low",
        considerations: [
          "Casey settled in role as 'oldest' — may enjoy mentoring dynamic",
          "No exploitation or substance concerns in referral",
          "Casey's independence unlikely to be affected",
        ],
        mitigations: [
          "Ensure Casey's independence gains are maintained regardless of admission",
        ],
        childView: "Casey said 'yeah whatever, as long as they don't touch my stuff' — typical Casey response. No objection.",
      },
    ],
    compatibilityFactors: [
      { factor: "Age and gender (13M) — fits group well", rating: "positive" },
      { factor: "Calm temperament described in referral", rating: "positive" },
      { factor: "Education in place (may be same school as Alex)", rating: "neutral" },
      { factor: "No safeguarding concerns in referral", rating: "positive" },
      { factor: "Low complexity — standard residential care needs", rating: "positive" },
      { factor: "Awaiting health information", rating: "neutral" },
    ],
    staffingImplications: [
      "Ratio would move to 1.4:1 (4 children : 7 staff) — still strong",
      "No additional staff required",
      "Key worker to be assigned: staff_edward (capacity available)",
    ],
    environmentalConsiderations: [
      "Bedroom 3 (currently storage overflow) needs converting — 2-day job",
      "Transport: fourth child means minibus more important (already available)",
      "No environmental restrictions needed",
    ],
    safeguardingConsiderations: [
      "Low concern based on referral information",
      "Standard DBS and safer caring protocols apply",
      "Awaiting full social worker report before final decision",
    ],
    conditions: [
      "Full information pack from placing LA required before admission agreed",
      "Pre-admission visit for Child T to meet existing children",
      "School consultation with virtual school head",
      "Bedroom prepared and ready before admission date",
    ],
    reviewDate: d(7),
    notes: "Promising referral. If further information confirms low-risk profile, this would be a good match for the group. RM to meet with placing SW next week. Existing children's views are positive/neutral. Decision expected within 2 weeks.",
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<PlacementImpactAssessment>[] = [
  { header: "Referral", accessor: (r: PlacementImpactAssessment) => r.referralName },
  { header: "Age", accessor: (r: PlacementImpactAssessment) => r.referralAge.toString() },
  { header: "LA", accessor: (r: PlacementImpactAssessment) => r.referralLA },
  { header: "Assessed By", accessor: (r: PlacementImpactAssessment) => getStaffName(r.assessedBy) },
  { header: "Date", accessor: (r: PlacementImpactAssessment) => r.assessmentDate },
  { header: "Status", accessor: (r: PlacementImpactAssessment) => r.status.replace(/_/g, " ") },
  { header: "Overall Risk", accessor: (r: PlacementImpactAssessment) => r.overallRisk },
  { header: "Decision", accessor: (r: PlacementImpactAssessment) => r.decision },
  { header: "Conditions", accessor: (r: PlacementImpactAssessment) => r.conditions.length.toString() },
];

/* ─── component ─── */
export default function PlacementImpactAssessmentPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filtered = useMemo(() => {
    let list = [...assessments];
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.assessmentDate.localeCompare(a.assessmentDate);
        case "risk":
          const riskOrder = { high: 0, medium: 1, low: 2 };
          return riskOrder[a.overallRisk] - riskOrder[b.overallRisk];
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });
    return list;
  }, [filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = assessments.length;
    const approved = assessments.filter((a) => a.status === "approved" || a.status === "approved_with_conditions").length;
    const declined = assessments.filter((a) => a.status === "declined").length;
    const pending = assessments.filter((a) => a.status === "pending").length;
    return { total, approved, declined, pending };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "approved_with_conditions":
        return <Badge className="bg-blue-100 text-blue-800">Approved (Conditions)</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const riskBadge = (risk: string) => {
    switch (risk) {
      case "low":
        return <Badge className="bg-green-100 text-green-800 text-xs">Low Risk</Badge>;
      case "medium":
        return <Badge className="bg-amber-100 text-amber-800 text-xs">Medium Risk</Badge>;
      case "high":
        return <Badge className="bg-red-100 text-red-800 text-xs">High Risk</Badge>;
      default:
        return null;
    }
  };

  const compatRating = (rating: string) => {
    switch (rating) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
      case "concern":
        return <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />;
      default:
        return <Scale className="h-4 w-4 text-gray-400 shrink-0" />;
    }
  };

  return (
    <PageShell
      title="Placement Impact Assessments"
      subtitle="Reg 14 — assessing the impact of new admissions on existing children before placement decisions"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={assessments} columns={exportCols} filename="placement-impact-assessments" />
          <PrintButton title="Placement Impact Assessments" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Assessments</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.declined}</p>
            <p className="text-xs text-muted-foreground">Declined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── pending alert ─── */}
      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <Scale className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Assessment Pending</p>
              <p className="text-xs text-amber-700 mt-1">
                {assessments
                  .filter((a) => a.status === "pending")
                  .map((a) => `${a.referralName} (${a.referralLA})`)
                  .join("; ")}{" "}
                — awaiting further information before decision.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="approved">Approved</option>
          <option value="approved_with_conditions">Approved (Conditions)</option>
          <option value="declined">Declined</option>
          <option value="pending">Pending</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Most Recent</option>
            <option value="risk">Risk Level</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {/* ��── assessment cards ─── */}
      <div className="space-y-4">
        {filtered.map((assessment) => {
          const expanded = expandedId === assessment.id;

          return (
            <Card key={assessment.id} className={cn(
              "overflow-hidden",
              assessment.status === "declined" && "border-red-200",
              assessment.status === "pending" && "border-amber-200"
            )}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(assessment.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      assessment.status === "declined" ? "bg-red-100" :
                      assessment.status === "pending" ? "bg-amber-100" : "bg-green-100"
                    )}>
                      {assessment.status === "declined" ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : assessment.status === "pending" ? (
                        <Scale className="h-5 w-5 text-amber-600" />
                      ) : (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {assessment.referralName} — Age {assessment.referralAge}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(assessment.status)}
                        {riskBadge(assessment.overallRisk)}
                        <span className="text-xs text-muted-foreground">{assessment.referralLA}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Assessed</p>
                      <p className="text-sm">{assessment.assessmentDate}</p>
                    </div>
                    {expanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {expanded && (
                <CardContent className="pt-0 pb-4 space-y-5">
                  {/* decision */}
                  <div className={cn(
                    "rounded-lg p-3 border",
                    assessment.status === "declined" ? "bg-red-50 border-red-200" :
                    assessment.status === "pending" ? "bg-amber-50 border-amber-200" :
                    "bg-green-50 border-green-200"
                  )}>
                    <p className="text-sm font-medium">{assessment.decision}</p>
                    <p className="text-sm text-muted-foreground mt-1">{assessment.decisionRationale}</p>
                  </div>

                  {/* impact on existing children */}
                  <div>
                    <p className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Impact on Existing Children
                    </p>
                    <div className="space-y-3">
                      {assessment.impactOnExisting.map((impact) => (
                        <div key={impact.childId} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{getYPName(impact.childId)}</span>
                            {riskBadge(impact.riskLevel)}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Considerations</p>
                              <ul className="space-y-0.5">
                                {impact.considerations.map((c, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="mt-1">•</span> {c}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-muted-foreground">Mitigations</p>
                              <ul className="space-y-0.5">
                                {impact.mitigations.map((m, i) => (
                                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                    <span className="text-green-500 mt-1">✓</span> {m}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            {impact.childView && (
                              <div className="bg-blue-50 rounded p-2 mt-1">
                                <p className="text-xs text-blue-700">
                                  <span className="font-medium">Child&apos;s view:</span> {impact.childView}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* compatibility factors */}
                  <div>
                    <p className="text-sm font-medium mb-2">Compatibility Factors</p>
                    <div className="space-y-1.5">
                      {assessment.compatibilityFactors.map((cf, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          {compatRating(cf.rating)}
                          <span>{cf.factor}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* staffing, environment, safeguarding */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Staffing
                      </p>
                      <ul className="space-y-0.5">
                        {assessment.staffingImplications.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Heart className="h-3 w-3" /> Environment
                      </p>
                      <ul className="space-y-0.5">
                        {assessment.environmentalConsiderations.map((e, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {e}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium mb-1.5 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Safeguarding
                      </p>
                      <ul className="space-y-0.5">
                        {assessment.safeguardingConsiderations.map((s, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {s}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* conditions */}
                  {assessment.conditions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-blue-700">Conditions of Approval</p>
                      <ol className="space-y-1">
                        {assessment.conditions.map((cond, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-xs font-medium bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {cond}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* notes */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{assessment.notes}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Assessed By</p>
                      <p className="text-sm font-medium">{getStaffName(assessment.assessedBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="text-sm font-medium">{assessment.assessmentDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gender</p>
                      <p className="text-sm font-medium">{assessment.referralGender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Review</p>
                      <p className="text-sm font-medium">{assessment.reviewDate ?? "N/A"}</p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* ─── regulatory note ─── */}
      <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm font-medium text-slate-700 mb-1">Regulatory Context</p>
        <p className="text-xs text-slate-600">
          Regulation 14 of the Children&apos;s Homes Regulations 2015 requires that before admitting
          a child, the registered person assesses whether the placement is consistent with the
          home&apos;s Statement of Purpose and will not be detrimental to existing children. Quality
          Standard 3 (Protection of Children) requires that the impact of a new admission on the
          existing group is fully assessed. Ofsted&apos;s SCCIF specifically examines matching
          decisions and evidence that children&apos;s needs are compatible. The child&apos;s views
          must be sought (where appropriate) as part of this assessment.
        </p>
      </div>
    </PageShell>
  );
}
