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
  Phone,
  Video,
  Users,
  MapPin,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle2,
  ArrowUpDown,
  Heart,
} from "lucide-react";

/* ─── date helper ─── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ─── types ─── */
interface ContactArrangement {
  contactWith: string;
  relationship: string;
  frequency: string;
  duration: string;
  type: "face_to_face" | "phone" | "video" | "letter" | "supervised";
  supervisionLevel: "unsupervised" | "monitored" | "supervised" | "no_contact";
  supervisionReason: string | null;
  venue: string;
  notes: string;
}

interface ContactPlan {
  id: string;
  youngPersonId: string;
  createdBy: string;
  createdDate: string;
  reviewDate: string;
  status: "active" | "under_review" | "suspended";
  arrangements: ContactArrangement[];
  childWishes: string;
  courtOrders: string | null;
  riskFactors: string[];
  positiveFactors: string[];
  overallAssessment: string;
  lastReviewedDate: string;
  nextScheduledContact: string;
}

/* ─── seed data ─── */
const plans: ContactPlan[] = [
  {
    id: "cp_001",
    youngPersonId: "yp_alex",
    createdBy: "staff_darren",
    createdDate: d(-120),
    reviewDate: d(14),
    status: "active",
    arrangements: [
      {
        contactWith: "Mum (Karen)",
        relationship: "Birth mother",
        frequency: "Fortnightly",
        duration: "2 hours",
        type: "face_to_face",
        supervisionLevel: "monitored",
        supervisionReason: "Mum can become emotionally dysregulated — staff nearby but not in room. Steps down to unsupervised planned for next review.",
        venue: "Local café or park (Alex's choice)",
        notes: "Contact generally positive. Alex looks forward to seeing mum. Mum occasionally late which upsets Alex.",
      },
      {
        contactWith: "Mum (Karen)",
        relationship: "Birth mother",
        frequency: "Weekly (midweek)",
        duration: "20 minutes",
        type: "phone",
        supervisionLevel: "unsupervised",
        supervisionReason: null,
        venue: "Alex's bedroom (privacy)",
        notes: "Alex calls mum every Wednesday after school. Generally positive. Staff available if Alex upset afterwards.",
      },
      {
        contactWith: "Nan (Doris)",
        relationship: "Maternal grandmother",
        frequency: "Monthly",
        duration: "Full day",
        type: "face_to_face",
        supervisionLevel: "unsupervised",
        supervisionReason: null,
        venue: "Nan's house",
        notes: "Excellent relationship. Alex stays for lunch and sometimes tea. Nan is a protective factor and stable attachment figure.",
      },
      {
        contactWith: "Dad (Steve)",
        relationship: "Birth father",
        frequency: "No current contact",
        duration: "N/A",
        type: "letter",
        supervisionLevel: "no_contact",
        supervisionReason: "Dad in prison (schedule 1 offence). No contact order in place. Alex aware and does not wish contact. Reviewed every 6 months.",
        venue: "N/A",
        notes: "Alex occasionally asks questions about dad — answered age-appropriately by key worker. Life story work addresses this relationship.",
      },
    ],
    childWishes: "Alex wants to see mum more often and is working toward overnight stays. Loves going to Nan's. Does not want any contact with dad and feels strongly about this. Would like to have a pen pal (friend from previous school).",
    courtOrders: "No contact order — birth father (Steve). Full Care Order s.31.",
    riskFactors: [
      "Mum's emotional dysregulation can upset Alex",
      "Mum has historically made promises she can't keep (e.g., 'you'll come home soon')",
      "Dad's offence history — no contact order in place",
    ],
    positiveFactors: [
      "Nan provides stability and unconditional positive regard",
      "Mum-Alex relationship improving with support",
      "Alex articulate about contact wishes — voice strongly heard",
      "Previous school friend contact supports social development",
    ],
    overallAssessment: "Contact plan working well. Mum contact is generally positive but requires monitoring due to occasional emotional dysregulation. Nan contact is wholly positive and a protective factor. Dad contact appropriately restricted. Plan for stepping down mum supervision at next review if positive trajectory continues.",
    lastReviewedDate: d(-30),
    nextScheduledContact: d(3),
  },
  {
    id: "cp_002",
    youngPersonId: "yp_jordan",
    createdBy: "staff_darren",
    createdDate: d(-90),
    reviewDate: d(7),
    status: "under_review",
    arrangements: [
      {
        contactWith: "Mum (Tracey)",
        relationship: "Birth mother",
        frequency: "Currently suspended — under review",
        duration: "Was 1 hour",
        type: "supervised",
        supervisionLevel: "supervised",
        supervisionReason: "Contact suspended 3 weeks ago after mum made distressing promises to Jordan about returning home that aren't realistic. Jordan severely dysregulated for 48 hours afterwards. SW and therapist recommend suspension pending therapeutic work.",
        venue: "Was at contact centre — currently suspended",
        notes: "Suspension is temporary. Plan to reintroduce indirect contact (letters) first, then build back to supervised visits. Jordan's therapist will advise on readiness.",
      },
      {
        contactWith: "Mum (Tracey)",
        relationship: "Birth mother",
        frequency: "Fortnightly (proposed restart)",
        duration: "Letter exchange",
        type: "letter",
        supervisionLevel: "monitored",
        supervisionReason: "Letters checked before giving to Jordan — mum has previously included inappropriate content (promises of return, criticism of care).",
        venue: "Written at home, posted via SW",
        notes: "Letter contact being considered as first step to rebuilding. Staff will read letters first and discuss content with Jordan before handing over.",
      },
      {
        contactWith: "Brother (Tyler, 8)",
        relationship: "Sibling (placed separately)",
        frequency: "Monthly",
        duration: "3 hours",
        type: "face_to_face",
        supervisionLevel: "unsupervised",
        supervisionReason: null,
        venue: "Soft play or park — activity-based",
        notes: "Jordan and Tyler have a lovely bond. Contact is always positive. Tyler's carers are cooperative and flexible. This is Jordan's most important relationship.",
      },
    ],
    childWishes: "Jordan misses mum deeply and wants contact to restart. Jordan says 'I know mum says things that aren't true but I still want to see her.' Loves seeing Tyler and asks for more frequent sibling contact. Jordan's therapist is working on helping Jordan manage expectations around mum.",
    courtOrders: "Full Care Order s.31. No restrictions on sibling contact.",
    riskFactors: [
      "Mum's promises of reunification cause severe emotional harm",
      "Mum has arrived at contact intoxicated (twice in past year)",
      "Jordan's sleep and behaviour significantly worse after difficult mum contact",
      "Mum has previously tried to take Jordan from contact centre",
    ],
    positiveFactors: [
      "Sibling relationship with Tyler is secure and positive",
      "Jordan can articulate feelings about contact (with support)",
      "Therapeutic input specifically addressing contact responses",
      "Jordan resilient — recovers from difficult contact within 48-72 hours",
    ],
    overallAssessment: "Complex situation. Mum contact currently causing more harm than good due to inappropriate promises and inconsistent behaviour. Suspension appropriate and supported by SW, therapist, and IRO. Sibling contact is protective and should be increased if possible. Plan is to reintroduce mum contact slowly via letters, with therapeutic support, once Jordan's therapist advises readiness. Jordan's wishes to see mum are heard and respected — suspension is to protect, not punish.",
    lastReviewedDate: d(-7),
    nextScheduledContact: d(10),
  },
  {
    id: "cp_003",
    youngPersonId: "yp_casey",
    createdBy: "staff_darren",
    createdDate: d(-60),
    reviewDate: d(30),
    status: "active",
    arrangements: [
      {
        contactWith: "Mum (Michelle)",
        relationship: "Birth mother",
        frequency: "Weekly phone call",
        duration: "As long as Casey wants",
        type: "phone",
        supervisionLevel: "unsupervised",
        supervisionReason: null,
        venue: "Casey's bedroom",
        notes: "Relationship improved significantly since Casey entered care. Calls are generally positive. Mum supportive of placement. Casey sometimes cancels if busy — this is Casey's choice and respected.",
      },
      {
        contactWith: "Mum (Michelle)",
        relationship: "Birth mother",
        frequency: "Monthly",
        duration: "Half day",
        type: "face_to_face",
        supervisionLevel: "unsupervised",
        supervisionReason: null,
        venue: "Mum's flat or local area — Casey's choice",
        notes: "Casey has good relationship with mum now — the distance has helped. Mum acknowledges she couldn't manage Casey's behaviour at home. Genuinely supportive now.",
      },
      {
        contactWith: "Older sister (Jade, 19)",
        relationship: "Half-sibling",
        frequency: "Ad hoc — Casey's initiative",
        duration: "Varies",
        type: "face_to_face",
        supervisionLevel: "unsupervised",
        supervisionReason: null,
        venue: "Jade's flat, local area, or home",
        notes: "Jade is a positive role model. Casey looks up to her. Contact is entirely Casey-led — sometimes weekly, sometimes fortnightly. Jade welcome at the home.",
      },
      {
        contactWith: "Dad (unknown)",
        relationship: "Birth father",
        frequency: "No contact",
        duration: "N/A",
        type: "letter",
        supervisionLevel: "no_contact",
        supervisionReason: "Father identity not confirmed. Casey does not wish to explore this currently. To be revisited if Casey expresses interest.",
        venue: "N/A",
        notes: "Casey has occasionally asked questions. Informed that life story work or CICC support available when ready. No pressure.",
      },
    ],
    childWishes: "Casey is happy with current arrangements. Likes that calls with mum are on their terms. Enjoys seeing Jade and values the independence of managing that relationship themselves. No interest in birth father contact currently but 'maybe one day.'",
    courtOrders: "Full Care Order s.31. No contact restrictions.",
    riskFactors: [
      "Historical DV in mum's household (Casey witnessed) — no current concerns",
      "Casey's peer associations outside of family contact more concerning than family contact itself",
    ],
    positiveFactors: [
      "Mum-Casey relationship much improved since placement",
      "Jade is protective factor and positive role model",
      "Casey exercises genuine autonomy over contact — empowering",
      "Mum engaged with care team and attends reviews",
    ],
    overallAssessment: "Contact plan is working well and is appropriately Casey-led given their age (15) and maturity. Family relationships are a strength. The risk in Casey's life is not from family contact but from peer associations — contact plan reflects this by enabling rather than restricting family time. Mum's engagement with the care team is excellent.",
    lastReviewedDate: d(-21),
    nextScheduledContact: d(2),
  },
];

/* ─── export columns ─── */
const exportCols: ExportColumn<ContactPlan>[] = [
  { header: "Young Person", accessor: (r: ContactPlan) => getYPName(r.youngPersonId) },
  { header: "Status", accessor: (r: ContactPlan) => r.status.replace("_", " ") },
  { header: "Created", accessor: (r: ContactPlan) => r.createdDate },
  { header: "Review Due", accessor: (r: ContactPlan) => r.reviewDate },
  { header: "Arrangements", accessor: (r: ContactPlan) => r.arrangements.length.toString() },
  { header: "Court Orders", accessor: (r: ContactPlan) => r.courtOrders ?? "None" },
  { header: "Risk Factors", accessor: (r: ContactPlan) => r.riskFactors.length.toString() },
  { header: "Child Wishes", accessor: (r: ContactPlan) => r.childWishes },
  { header: "Next Contact", accessor: (r: ContactPlan) => r.nextScheduledContact },
  { header: "Assessment", accessor: (r: ContactPlan) => r.overallAssessment },
];

/* ─── component ─── */
export default function ContactPlansPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterYP, setFilterYP] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("review");

  const filtered = useMemo(() => {
    let list = [...plans];
    if (filterYP !== "all") list = list.filter((r) => r.youngPersonId === filterYP);
    if (filterStatus !== "all") list = list.filter((r) => r.status === filterStatus);
    list.sort((a, b) => {
      switch (sortBy) {
        case "review":
          return a.reviewDate.localeCompare(b.reviewDate);
        case "name":
          return getYPName(a.youngPersonId).localeCompare(getYPName(b.youngPersonId));
        case "created":
          return b.createdDate.localeCompare(a.createdDate);
        default:
          return 0;
      }
    });
    return list;
  }, [filterYP, filterStatus, sortBy]);

  const stats = useMemo(() => {
    const total = plans.length;
    const active = plans.filter((p) => p.status === "active").length;
    const underReview = plans.filter((p) => p.status === "under_review").length;
    const totalArrangements = plans.reduce((s, p) => s + p.arrangements.length, 0);
    const noContact = plans.reduce((s, p) => s + p.arrangements.filter((a) => a.supervisionLevel === "no_contact").length, 0);
    return { total, active, underReview, totalArrangements, noContact };
  }, []);

  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "under_review":
        return <Badge className="bg-amber-100 text-amber-800">Under Review</Badge>;
      case "suspended":
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const contactTypeIcon = (type: string) => {
    switch (type) {
      case "face_to_face": return <Users className="h-4 w-4 text-green-600" />;
      case "phone": return <Phone className="h-4 w-4 text-blue-600" />;
      case "video": return <Video className="h-4 w-4 text-purple-600" />;
      case "supervised": return <Shield className="h-4 w-4 text-amber-600" />;
      default: return <Heart className="h-4 w-4 text-pink-600" />;
    }
  };

  const supervisionBadge = (level: string) => {
    switch (level) {
      case "unsupervised":
        return <Badge className="bg-green-100 text-green-800 text-xs">Unsupervised</Badge>;
      case "monitored":
        return <Badge className="bg-blue-100 text-blue-800 text-xs">Monitored</Badge>;
      case "supervised":
        return <Badge className="bg-amber-100 text-amber-800 text-xs">Supervised</Badge>;
      case "no_contact":
        return <Badge className="bg-red-100 text-red-800 text-xs">No Contact</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">{level}</Badge>;
    }
  };

  return (
    <PageShell
      title="Contact Plans"
      subtitle="Family contact arrangements — frequency, supervision, child's wishes, and risk assessment"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={plans} columns={exportCols} filename="contact-plans" />
          <PrintButton title="Contact Plans" />
        </div>
      }
    >
      {/* ─── summary stats ─── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Plans</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{stats.underReview}</p>
            <p className="text-xs text-muted-foreground">Under Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-blue-700">{stats.totalArrangements}</p>
            <p className="text-xs text-muted-foreground">Arrangements</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold text-red-700">{stats.noContact}</p>
            <p className="text-xs text-muted-foreground">No Contact Orders</p>
          </CardContent>
        </Card>
      </div>

      {/* ─── alert for under-review plans ─── */}
      {stats.underReview > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Contact Plan Under Review</p>
              <p className="text-xs text-amber-700 mt-1">
                {plans
                  .filter((p) => p.status === "under_review")
                  .map((p) => getYPName(p.youngPersonId))
                  .join(", ")}{" "}
                — contact arrangements being reconsidered. Ensure child&apos;s wishes are central to any changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── filters ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterYP}
          onChange={(e) => setFilterYP(e.target.value)}
        >
          <option value="all">All Young People</option>
          <option value="yp_alex">Alex</option>
          <option value="yp_jordan">Jordan</option>
          <option value="yp_casey">Casey</option>
        </select>

        <select
          className="border rounded-md px-3 py-1.5 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="under_review">Under Review</option>
          <option value="suspended">Suspended</option>
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <select
            className="border rounded-md px-3 py-1.5 text-sm"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="review">Review Due</option>
            <option value="name">Name</option>
            <option value="created">Created</option>
          </select>
        </div>
      </div>

      {/* ─── plan cards ─── */}
      <div className="space-y-4">
        {filtered.map((plan) => {
          const expanded = expandedId === plan.id;

          return (
            <Card key={plan.id} className={cn("overflow-hidden", plan.status === "under_review" && "border-amber-200")}>
              <CardHeader
                className="cursor-pointer hover:bg-muted/40 transition-colors py-4"
                onClick={() => toggle(plan.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-full",
                      plan.status === "active" ? "bg-green-100" :
                      plan.status === "under_review" ? "bg-amber-100" : "bg-red-100"
                    )}>
                      <Heart className={cn(
                        "h-5 w-5",
                        plan.status === "active" ? "text-green-600" :
                        plan.status === "under_review" ? "text-amber-600" : "text-red-600"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {getYPName(plan.youngPersonId)}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {statusBadge(plan.status)}
                        <span className="text-xs text-muted-foreground">
                          {plan.arrangements.length} arrangement{plan.arrangements.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Next contact: {plan.nextScheduledContact}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Review Due</p>
                      <p className="text-sm font-medium">{plan.reviewDate}</p>
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
                  {/* arrangements */}
                  <div>
                    <p className="text-sm font-medium mb-3">Contact Arrangements</p>
                    <div className="space-y-3">
                      {plan.arrangements.map((arr, idx) => (
                        <div key={idx} className={cn(
                          "border rounded-lg p-3",
                          arr.supervisionLevel === "no_contact" && "bg-red-50 border-red-200"
                        )}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {contactTypeIcon(arr.type)}
                              <span className="text-sm font-medium">{arr.contactWith}</span>
                              <span className="text-xs text-muted-foreground">({arr.relationship})</span>
                            </div>
                            {supervisionBadge(arr.supervisionLevel)}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                            <div>
                              <p className="text-xs text-muted-foreground">Frequency</p>
                              <p className="text-xs font-medium">{arr.frequency}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="text-xs font-medium">{arr.duration}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Type</p>
                              <p className="text-xs font-medium capitalize">{arr.type.replace(/_/g, " ")}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Venue</p>
                              <p className="text-xs font-medium">{arr.venue}</p>
                            </div>
                          </div>
                          {arr.supervisionReason && (
                            <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
                              <span className="font-medium">Supervision rationale:</span> {arr.supervisionReason}
                            </p>
                          )}
                          {arr.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium">Notes:</span> {arr.notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* child wishes */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 flex items-center gap-1 mb-1">
                      <Heart className="h-4 w-4" /> Child&apos;s Wishes
                    </p>
                    <p className="text-sm text-blue-700">{plan.childWishes}</p>
                  </div>

                  {/* court orders */}
                  {plan.courtOrders && (
                    <div className="border rounded-md p-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Court Orders
                      </p>
                      <p className="text-sm">{plan.courtOrders}</p>
                    </div>
                  )}

                  {/* risk and positive factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Risk Factors
                      </p>
                      <ul className="space-y-1">
                        {plan.riskFactors.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-400 mt-1.5">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Positive Factors
                      </p>
                      <ul className="space-y-1">
                        {plan.positiveFactors.map((f, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-400 mt-1.5">•</span> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* overall assessment */}
                  <div className="bg-muted/30 rounded-md p-3">
                    <p className="text-sm font-medium mb-1">Overall Assessment</p>
                    <p className="text-sm text-muted-foreground">{plan.overallAssessment}</p>
                  </div>

                  {/* footer */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Created By</p>
                      <p className="text-sm font-medium">{getStaffName(plan.createdBy)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{plan.createdDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Reviewed</p>
                      <p className="text-sm font-medium">{plan.lastReviewedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Next Contact</p>
                      <p className="text-sm font-medium">{plan.nextScheduledContact}</p>
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
          Regulation 7(2)(b)(v) of the Children&apos;s Homes Regulations 2015 requires that the
          child&apos;s care plan includes arrangements for contact with family. Regulation 12
          (Contact and Access) requires that contact arrangements promote the child&apos;s welfare.
          The Children Act 1989 s.34 establishes a presumption of reasonable contact with parents
          unless restricted by court order. Quality Standard 1 (child-centred care) requires that
          children&apos;s wishes about contact are ascertained and given due weight. All contact
          arrangements are reviewed alongside the placement plan and at each LAC Review.
        </p>
      </div>
    </PageShell>
  );
}
