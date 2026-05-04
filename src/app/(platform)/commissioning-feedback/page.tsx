"use client";

import { useState, useMemo } from "react";
import {
  Building2, Star, ArrowUpDown, Filter, Search,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  ThumbsUp, MessageSquare, ClipboardCheck,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const FEEDBACK_TYPES = [
  "Annual Review",
  "Placement Update",
  "Quality Concern",
  "Compliment",
  "Statutory Visit",
] as const;
type FeedbackType = typeof FEEDBACK_TYPES[number];

const TYPE_COLORS: Record<FeedbackType, string> = {
  "Annual Review": "bg-blue-100 text-blue-800",
  "Placement Update": "bg-slate-100 text-slate-800",
  "Quality Concern": "bg-red-100 text-red-800",
  "Compliment": "bg-green-100 text-green-800",
  "Statutory Visit": "bg-purple-100 text-purple-800",
};

interface CommissioningFeedback {
  id: string;
  dateReceived: string;
  youngPerson: string;
  localAuthority: string;
  commissioner: string;
  feedbackType: FeedbackType;
  overallRating: 1 | 2 | 3 | 4 | 5;
  strengths: string[];
  areasForDevelopment: string[];
  specificComments: string;
  responseRequired: boolean;
  responseDate: string;
  responseGivenBy: string;
  responseSummary: string;
  nextReviewDate: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: CommissioningFeedback[] = [
  {
    id: "cf_1",
    dateReceived: d(-4),
    youngPerson: "yp_alex",
    localAuthority: "Manchester City Council",
    commissioner: "Helen Brookes (Placement Commissioning Officer)",
    feedbackType: "Annual Review",
    overallRating: 5,
    strengths: [
      "Excellent communication with placing authority",
      "Detailed monthly progress reports submitted on time",
      "Strong evidence of education engagement and PEP delivery",
      "Therapeutic care model well embedded in practice",
    ],
    areasForDevelopment: [
      "Continue to develop independence skills as Alex approaches 16",
    ],
    specificComments:
      "Manchester is extremely satisfied with the quality of care provided to Alex. The home has consistently met and exceeded the placement plan objectives. Stability has been transformative for Alex following multiple prior placement breakdowns. We are happy to recommend this provider to other commissioning teams.",
    responseRequired: true,
    responseDate: d(-2),
    responseGivenBy: "staff_darren",
    responseSummary:
      "Acknowledged feedback formally by letter. Confirmed independence pathway plan starts at 15.5 years. Invited Helen to next LAC review.",
    nextReviewDate: d(360),
  },
  {
    id: "cf_2",
    dateReceived: d(-1),
    youngPerson: "yp_jordan",
    localAuthority: "Leeds City Council",
    commissioner: "Marcus Field (Senior Commissioner)",
    feedbackType: "Quality Concern",
    overallRating: 3,
    strengths: [
      "Staff are warm and welcoming",
      "Jordan reports feeling safe in the home",
    ],
    areasForDevelopment: [
      "Delay in providing the most recent quarterly report (5 days late)",
      "Need more granular detail in education progress section",
      "Missed weekly social worker call last Tuesday",
    ],
    specificComments:
      "Whilst overall placement quality is good, Leeds has noted three administrative slips in the past 6 weeks. We require assurance that quality assurance processes are being followed and that communication will return to the standard initially demonstrated. A response is required within 10 working days.",
    responseRequired: true,
    responseDate: "",
    responseGivenBy: "",
    responseSummary: "",
    nextReviewDate: d(30),
  },
  {
    id: "cf_3",
    dateReceived: d(-12),
    youngPerson: "yp_casey",
    localAuthority: "Bradford Metropolitan District Council",
    commissioner: "Sarah Choudhury (Children's Resource Manager)",
    feedbackType: "Compliment",
    overallRating: 5,
    strengths: [
      "Exceptional handling of Casey's transition into the home",
      "Sensitive, trauma-informed approach to early relationships",
      "Proactive engagement with CAMHS and education",
      "Casey reports being happier than at any previous placement",
    ],
    areasForDevelopment: [],
    specificComments:
      "I wanted to formally record Bradford's appreciation for the outstanding work this home has done with Casey over the past 4 months. The change in Casey since moving here is remarkable. The team's understanding of attachment and trauma is evident in every interaction we observe.",
    responseRequired: false,
    responseDate: d(-11),
    responseGivenBy: "staff_darren",
    responseSummary:
      "Thanked Sarah and shared the compliment with the full team. Added to Reg 45 evidence file and Statement of Purpose review.",
    nextReviewDate: d(180),
  },
  {
    id: "cf_4",
    dateReceived: d(-22),
    youngPerson: "yp_alex",
    localAuthority: "Manchester City Council",
    commissioner: "James Whitfield (Quality Assurance Lead)",
    feedbackType: "Statutory Visit",
    overallRating: 4,
    strengths: [
      "Home environment was warm, clean and homely",
      "Alex spoke positively about staff relationships",
      "Care plan paperwork was clear and up to date",
    ],
    areasForDevelopment: [
      "Some behaviour log entries lacked outcome detail",
      "Risk assessment for community access could be more specific",
    ],
    specificComments:
      "Visit conducted under regulation 25 commissioning oversight protocol. Overall a positive picture, with two minor documentation points to address. No safeguarding concerns identified. Alex was relaxed and engaged during the visit.",
    responseRequired: true,
    responseDate: d(-18),
    responseGivenBy: "staff_ryan",
    responseSummary:
      "Behaviour log template updated to enforce outcome field. Community access risk assessment revised with location-specific detail. Both actions evidenced and shared with QA Lead.",
    nextReviewDate: d(150),
  },
  {
    id: "cf_5",
    dateReceived: d(-8),
    youngPerson: "yp_jordan",
    localAuthority: "Leeds City Council",
    commissioner: "Priya Anand (Allocated Social Worker Manager)",
    feedbackType: "Placement Update",
    overallRating: 4,
    strengths: [
      "Settling-in plan executed exactly as agreed",
      "Daily updates during first two weeks were invaluable",
      "Home accommodated last-minute family contact change",
    ],
    areasForDevelopment: [
      "Would benefit from clearer escalation contact list out-of-hours",
    ],
    specificComments:
      "Six-week placement update. Jordan is settling well and Leeds is content with progress. The home has demonstrated good flexibility around family contact. One small operational request around out-of-hours contacts.",
    responseRequired: true,
    responseDate: d(-6),
    responseGivenBy: "staff_darren",
    responseSummary:
      "Out-of-hours contact card produced and shared with Leeds duty team. Confirmed RM mobile and on-call manager rota.",
    nextReviewDate: d(45),
  },
  {
    id: "cf_6",
    dateReceived: d(-3),
    youngPerson: "yp_casey",
    localAuthority: "Bradford Metropolitan District Council",
    commissioner: "Tom Reeves (IRO)",
    feedbackType: "Statutory Visit",
    overallRating: 5,
    strengths: [
      "Casey was actively involved in the review",
      "Care plan goals are SMART and reviewed routinely",
      "Strong professional network coordination",
      "Voice of the child evidence is high quality",
    ],
    areasForDevelopment: [],
    specificComments:
      "Statutory LAC review. All review actions from previous meeting were completed. Casey participated meaningfully throughout. The quality of reflection and planning by the home team is among the best I see across my caseload.",
    responseRequired: false,
    responseDate: "",
    responseGivenBy: "",
    responseSummary: "",
    nextReviewDate: d(90),
  },
  {
    id: "cf_7",
    dateReceived: d(-30),
    youngPerson: "yp_alex",
    localAuthority: "Manchester City Council",
    commissioner: "Helen Brookes (Placement Commissioning Officer)",
    feedbackType: "Annual Review",
    overallRating: 4,
    strengths: [
      "Outcomes against placement plan consistently met",
      "Education attendance maintained above 90%",
      "Strong key working relationship",
    ],
    areasForDevelopment: [
      "Greater visibility of independence skills progression metrics",
      "Family contact reporting could be more structured",
    ],
    specificComments:
      "Mid-year placement review. Manchester remains satisfied with placement quality. Two areas for development have been agreed and will be reviewed at the annual placement quality meeting.",
    responseRequired: true,
    responseDate: d(-28),
    responseGivenBy: "staff_ryan",
    responseSummary:
      "Independence skills tracker rolled out for Alex with monthly progress measures. Family contact report template revised with structured headings.",
    nextReviewDate: d(60),
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function CommissioningFeedbackPage() {
  const [entries] = useState<CommissioningFeedback[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLA, setFilterLA] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const localAuthorities = useMemo(
    () => Array.from(new Set(entries.map((e) => e.localAuthority))).sort(),
    [entries],
  );

  const filtered = useMemo(() => {
    let list = [...entries];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.commissioner.toLowerCase().includes(q) ||
          e.localAuthority.toLowerCase().includes(q) ||
          e.specificComments.toLowerCase().includes(q),
      );
    }
    if (filterType !== "all") list = list.filter((e) => e.feedbackType === filterType);
    if (filterLA !== "all") list = list.filter((e) => e.localAuthority === filterLA);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.dateReceived.localeCompare(a.dateReceived);
        case "rating":
          return b.overallRating - a.overallRating;
        case "la":
          return a.localAuthority.localeCompare(b.localAuthority);
        case "type":
          return a.feedbackType.localeCompare(b.feedbackType);
        default:
          return 0;
      }
    });
    return list;
  }, [entries, search, filterType, filterLA, sortBy]);

  /* stats */
  const avgRating =
    entries.length === 0
      ? 0
      : entries.reduce((sum, e) => sum + e.overallRating, 0) / entries.length;
  const compliments = entries.filter((e) => e.feedbackType === "Compliment").length;
  const concernsToResolve = entries.filter(
    (e) => e.responseRequired && !e.responseDate,
  ).length;
  const lasEngaged = localAuthorities.length;

  const exportCols: ExportColumn<CommissioningFeedback>[] = [
    { header: "ID", accessor: (r: CommissioningFeedback) => r.id },
    { header: "Date Received", accessor: (r: CommissioningFeedback) => r.dateReceived },
    { header: "Young Person", accessor: (r: CommissioningFeedback) => getYPName(r.youngPerson) },
    { header: "Local Authority", accessor: (r: CommissioningFeedback) => r.localAuthority },
    { header: "Commissioner", accessor: (r: CommissioningFeedback) => r.commissioner },
    { header: "Feedback Type", accessor: (r: CommissioningFeedback) => r.feedbackType },
    { header: "Overall Rating", accessor: (r: CommissioningFeedback) => `${r.overallRating}/5` },
    { header: "Strengths", accessor: (r: CommissioningFeedback) => r.strengths.join("; ") },
    { header: "Areas for Development", accessor: (r: CommissioningFeedback) => r.areasForDevelopment.join("; ") },
    { header: "Specific Comments", accessor: (r: CommissioningFeedback) => r.specificComments },
    { header: "Response Required", accessor: (r: CommissioningFeedback) => (r.responseRequired ? "Yes" : "No") },
    { header: "Response Date", accessor: (r: CommissioningFeedback) => r.responseDate || "Pending" },
    { header: "Response Given By", accessor: (r: CommissioningFeedback) => (r.responseGivenBy ? getStaffName(r.responseGivenBy) : "") },
    { header: "Response Summary", accessor: (r: CommissioningFeedback) => r.responseSummary },
    { header: "Next Review Date", accessor: (r: CommissioningFeedback) => r.nextReviewDate },
  ];

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300",
          )}
        />
      ))}
    </div>
  );

  return (
    <PageShell
      title="Commissioning Feedback"
      subtitle="Feedback from placing local authorities on placement quality, communication, and outcomes"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Commissioning Feedback" />
          <ExportButton data={filtered} columns={exportCols} filename="commissioning-feedback" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Average Rating",
              value: avgRating.toFixed(1) + " / 5",
              icon: Star,
              colour: "text-amber-500",
            },
            {
              label: "Compliments Received",
              value: compliments,
              icon: ThumbsUp,
              colour: "text-green-600",
            },
            {
              label: "Concerns to Resolve",
              value: concernsToResolve,
              icon: AlertTriangle,
              colour: concernsToResolve > 0 ? "text-red-600" : "text-slate-400",
            },
            {
              label: "LAs Engaged",
              value: lasEngaged,
              icon: Building2,
              colour: "text-blue-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border bg-white p-4 flex items-center gap-3"
            >
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {concernsToResolve > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{concernsToResolve}</strong> commissioner feedback item(s)
                require a formal response. Track and clear within agreed timescales
                to maintain commissioning relationships.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commissioner, LA, comments…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {FEEDBACK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={filterLA} onValueChange={setFilterLA}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Local Authorities</SelectItem>
              {localAuthorities.map((la) => (
                <SelectItem key={la} value={la}>{la}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="rating">Rating (High–Low)</SelectItem>
                <SelectItem value="la">Local Authority</SelectItem>
                <SelectItem value="type">Feedback Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No commissioning feedback matches your filters.
            </div>
          )}
          {filtered.map((entry) => {
            const isExpanded = expandedId === entry.id;
            const unresolved = entry.responseRequired && !entry.responseDate;
            return (
              <div
                key={entry.id}
                className={cn(
                  "rounded-xl border bg-white overflow-hidden",
                  unresolved && "border-red-300 ring-1 ring-red-200",
                )}
              >
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Building2 className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {entry.localAuthority}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {entry.dateReceived} · {entry.commissioner} · Re: {getYPName(entry.youngPerson)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {unresolved && (
                      <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                        Response due
                      </Badge>
                    )}
                    {renderStars(entry.overallRating)}
                    <Badge className={cn("text-xs", TYPE_COLORS[entry.feedbackType])}>
                      {entry.feedbackType}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Young Person</p>
                        <p className="font-medium">{getYPName(entry.youngPerson)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Commissioner</p>
                        <p className="font-medium">{entry.commissioner}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Date Received</p>
                        <p className="font-medium">{entry.dateReceived}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Next Review</p>
                        <p className="font-medium">{entry.nextReviewDate}</p>
                      </div>
                    </div>

                    {/* comments */}
                    <div className="rounded-lg bg-white border p-3">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">
                        Specific Comments
                      </p>
                      <p className="text-sm">{entry.specificComments}</p>
                    </div>

                    {/* strengths */}
                    {entry.strengths.length > 0 && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <ThumbsUp className="h-4 w-4 text-green-700" />
                          <p className="text-xs font-medium text-green-800">Strengths</p>
                        </div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {entry.strengths.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* development */}
                    {entry.areasForDevelopment.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <div className="flex items-center gap-1 mb-2">
                          <ClipboardCheck className="h-4 w-4 text-amber-700" />
                          <p className="text-xs font-medium text-amber-800">
                            Areas for Development
                          </p>
                        </div>
                        <ul className="text-sm list-disc pl-5 space-y-1">
                          {entry.areasForDevelopment.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* response */}
                    <div
                      className={cn(
                        "rounded-lg border p-3",
                        unresolved
                          ? "bg-red-50 border-red-200"
                          : "bg-blue-50 border-blue-200",
                      )}
                    >
                      <div className="flex items-center gap-1 mb-2">
                        {unresolved ? (
                          <AlertTriangle className="h-4 w-4 text-red-700" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-blue-700" />
                        )}
                        <p
                          className={cn(
                            "text-xs font-medium",
                            unresolved ? "text-red-800" : "text-blue-800",
                          )}
                        >
                          Provider Response
                        </p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm mb-2">
                        <div>
                          <span className="text-muted-foreground">Required:</span>{" "}
                          <span className="font-medium">
                            {entry.responseRequired ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Given By:</span>{" "}
                          <span className="font-medium">
                            {entry.responseGivenBy
                              ? getStaffName(entry.responseGivenBy)
                              : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          <span
                            className={cn(
                              "font-medium",
                              unresolved ? "text-red-700" : "",
                            )}
                          >
                            {entry.responseDate || "Pending"}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">
                        {entry.responseSummary || (
                          <span className="italic text-muted-foreground">
                            No response recorded yet.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <div className="flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              <strong>Quality Standard 13 &amp; Reg 45:</strong> Feedback from placing
              local authorities is a key indicator of placement quality and leadership
              effectiveness. All commissioner concerns must receive a formal written
              response within agreed timescales, and themes must inform the Reg 45
              quality of care review and Statement of Purpose updates.
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
