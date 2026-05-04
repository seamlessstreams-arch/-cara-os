"use client";

import { useState, useMemo } from "react";
import {
  Award,
  Heart,
  PoundSterling,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  FileText,
  Calendar,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ── types ─────────────────────────────────────────────────────────────── */

interface GrantRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  charityName: string;
  grantPurpose: string;
  category:
    | "Education"
    | "Recreation / hobbies"
    | "Therapy / wellbeing"
    | "Sports equipment"
    | "Music / arts"
    | "Driving lessons"
    | "IT / tech"
    | "Travel / experience"
    | "Family support"
    | "Other";
  applicationDate: string;
  applicationStatus:
    | "Drafted"
    | "Submitted"
    | "Under review"
    | "Awarded"
    | "Declined"
    | "Partial award"
    | "Withdrawn";
  amountRequested: number;
  amountAwarded?: number;
  decisionDate?: string;
  itemsFunded: string[];
  evidenceProvidedToCharity: string[];
  childInvolvedInApplication: boolean;
  childAcknowledgementSent: boolean;
  followUpReportRequired: boolean;
  followUpReportDate?: string;
  childVoice: string;
  staffObservation: string;
  recordedBy: string;
}

/* ── seed ──────────────────────────────────────────────────────────────── */

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const SEED: GrantRecord[] = [
  {
    id: "grant_001",
    youngPerson: getYPName("yp_jordan"),
    recordedDate: d(-65),
    charityName: "Buttle UK",
    grantPurpose:
      "Football boots and goalkeeper gloves to enable Jordan to attend Highfields Academy football training sessions and weekend league matches with proper kit.",
    category: "Sports equipment",
    applicationDate: d(-90),
    applicationStatus: "Awarded",
    amountRequested: 400,
    amountAwarded: 400,
    decisionDate: d(-72),
    itemsFunded: [
      "Adidas Predator goalkeeper gloves (size 8)",
      "Nike Phantom GX football boots (size 7)",
      "Goalkeeper jersey and padded shorts",
      "Kit bag and water bottle",
    ],
    evidenceProvidedToCharity: [
      "Cover letter from Registered Manager",
      "Confirmation of looked-after status from Nottinghamshire CC",
      "Quote / receipts from JD Sports",
      "Letter of support from Highfields Academy PE department",
    ],
    childInvolvedInApplication: true,
    childAcknowledgementSent: true,
    followUpReportRequired: true,
    followUpReportDate: d(120),
    childVoice:
      "I felt proper for the first time turning up to training in my own gloves. The other kids said the gear looked sick. I'm gonna keep them clean and write Buttle a thank you with a photo.",
    staffObservation:
      "Jordan has worn the kit to every training session since it arrived. Coach reports significant lift in confidence in goal. Thank-you photo and short note posted to Buttle UK on Jordan's behalf with consent.",
    recordedBy: getStaffName("staff_anna"),
  },
  {
    id: "grant_002",
    youngPerson: getYPName("yp_alex"),
    recordedDate: d(-50),
    charityName: "Coram Voice",
    grantPurpose:
      "Fees for an 8-week creative writing and spoken-word poetry workshop run by a local arts collective. Alex has expressed an interest in writing as a way to process feelings about contact with mum.",
    category: "Music / arts",
    applicationDate: d(-75),
    applicationStatus: "Awarded",
    amountRequested: 250,
    amountAwarded: 250,
    decisionDate: d(-58),
    itemsFunded: [
      "8-week poetry workshop fees",
      "Notebook and pen set",
      "Travel costs to and from venue",
    ],
    evidenceProvidedToCharity: [
      "Pathway Plan extract showing creative interest goal",
      "Workshop provider invoice",
      "Key worker letter of support",
    ],
    childInvolvedInApplication: true,
    childAcknowledgementSent: true,
    followUpReportRequired: false,
    childVoice:
      "Writing it out helps me when I can't say things out loud. The Wednesday group is the bit of the week I actually look forward to.",
    staffObservation:
      "Alex has attended every session. Has shared two poems in key work — one about home, one about his brother. Marked improvement in emotional regulation post-session days. Funding fully spent and acquittal sent.",
    recordedBy: getStaffName("staff_edward"),
  },
  {
    id: "grant_003",
    youngPerson: getYPName("yp_alex"),
    recordedDate: d(-30),
    charityName: "Lift the Limit",
    grantPurpose:
      "Boxing kit upgrade — gloves, hand wraps, gum shield and gym membership top-up for Alex's local non-contact boxing club, which the team uses as a positive regulation outlet.",
    category: "Sports equipment",
    applicationDate: d(-48),
    applicationStatus: "Awarded",
    amountRequested: 180,
    amountAwarded: 180,
    decisionDate: d(-35),
    itemsFunded: [
      "12oz training gloves",
      "Hand wraps (2 pairs)",
      "Custom-fit gum shield",
      "3-month gym membership extension",
    ],
    evidenceProvidedToCharity: [
      "Coach's letter confirming attendance",
      "Receipts from boxing supplier",
      "Risk assessment confirming non-contact training only",
    ],
    childInvolvedInApplication: true,
    childAcknowledgementSent: true,
    followUpReportRequired: false,
    childVoice:
      "When I go boxing I'm not thinking about anything else. The new gloves don't smash up my hands like the loaner ones did.",
    staffObservation:
      "Boxing remains a strong protective factor for Alex. Attendance averaging 3 nights/week. Coach reports excellent discipline. Kit in active use.",
    recordedBy: getStaffName("staff_lackson"),
  },
  {
    id: "grant_004",
    youngPerson: getYPName("yp_casey"),
    recordedDate: d(-40),
    charityName: "Family Fund",
    grantPurpose:
      "Sensory regulation kit to support Casey's sleep disturbance and sensory needs identified in the OT assessment — weighted blanket, lap pad and tactile fidget kit.",
    category: "Therapy / wellbeing",
    applicationDate: d(-62),
    applicationStatus: "Awarded",
    amountRequested: 500,
    amountAwarded: 500,
    decisionDate: d(-45),
    itemsFunded: [
      "7kg cotton weighted blanket (single)",
      "2kg lap pad for daytime regulation",
      "Tactile fidget kit (chewable, putty, textured rings)",
      "Blackout blind for bedroom window",
    ],
    evidenceProvidedToCharity: [
      "OT sensory assessment report",
      "GP letter confirming sleep disturbance",
      "Receipts from Sensory Direct",
      "Confirmation of looked-after status from Derbyshire CC",
    ],
    childInvolvedInApplication: true,
    childAcknowledgementSent: true,
    followUpReportRequired: true,
    followUpReportDate: d(80),
    childVoice:
      "The heavy blanket actually helps. I don't fight my bed as much. The squishy thing in my hand at the table stops me picking my arms.",
    staffObservation:
      "Demonstrable reduction in night-time disturbance since blanket introduced — sleep log shows average 6.4 hrs vs prior 4.1 hrs. Casey self-reaches for fidget kit during stressful moments. Excellent outcome from this grant.",
    recordedBy: getStaffName("staff_chervelle"),
  },
  {
    id: "grant_005",
    youngPerson: getYPName("yp_casey"),
    recordedDate: d(-12),
    charityName: "Buttle UK",
    grantPurpose:
      "Laptop for Year 7 transition to Allestree Woodlands — required for homework, online learning platforms and to reduce stigma of being the only child in class without a personal device.",
    category: "IT / tech",
    applicationDate: d(-18),
    applicationStatus: "Submitted",
    amountRequested: 600,
    itemsFunded: [
      "Mid-range laptop suitable for school workload",
      "Protective laptop case",
      "Microsoft 365 student licence (12 months)",
    ],
    evidenceProvidedToCharity: [
      "School letter confirming Year 7 device expectation",
      "Pathway Plan / Education section extract",
      "Two device quotes (Currys and Argos)",
      "Confirmation of looked-after status from Derbyshire CC",
    ],
    childInvolvedInApplication: true,
    childAcknowledgementSent: false,
    followUpReportRequired: true,
    childVoice:
      "I don't want to be the only one in class who can't do their homework on a laptop. I picked the silver one because it doesn't look babyish.",
    staffObservation:
      "Application submitted via Buttle UK online portal. Acknowledgement received. Decision typically within 4–6 weeks. Education Lead has flagged this as a priority for September transition readiness.",
    recordedBy: getStaffName("staff_diane"),
  },
];

/* ── constants ─────────────────────────────────────────────────────────── */

const STATUS_META: Record<
  GrantRecord["applicationStatus"],
  { label: string; colour: string }
> = {
  Drafted: { label: "Drafted", colour: "bg-gray-100 text-gray-700" },
  Submitted: { label: "Submitted", colour: "bg-blue-100 text-blue-700" },
  "Under review": {
    label: "Under review",
    colour: "bg-indigo-100 text-indigo-700",
  },
  Awarded: { label: "Awarded", colour: "bg-emerald-100 text-emerald-700" },
  Declined: { label: "Declined", colour: "bg-red-100 text-red-700" },
  "Partial award": {
    label: "Partial award",
    colour: "bg-amber-100 text-amber-700",
  },
  Withdrawn: { label: "Withdrawn", colour: "bg-stone-100 text-stone-700" },
};

const CATEGORIES: GrantRecord["category"][] = [
  "Education",
  "Recreation / hobbies",
  "Therapy / wellbeing",
  "Sports equipment",
  "Music / arts",
  "Driving lessons",
  "IT / tech",
  "Travel / experience",
  "Family support",
  "Other",
];

const CATEGORY_COLOUR: Record<GrantRecord["category"], string> = {
  Education: "bg-blue-100 text-blue-700",
  "Recreation / hobbies": "bg-amber-100 text-amber-800",
  "Therapy / wellbeing": "bg-teal-100 text-teal-800",
  "Sports equipment": "bg-emerald-100 text-emerald-800",
  "Music / arts": "bg-purple-100 text-purple-700",
  "Driving lessons": "bg-orange-100 text-orange-800",
  "IT / tech": "bg-slate-100 text-slate-700",
  "Travel / experience": "bg-sky-100 text-sky-800",
  "Family support": "bg-rose-100 text-rose-700",
  Other: "bg-gray-100 text-gray-700",
};

const gbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(n);

/* ── component ─────────────────────────────────────────────────────────── */

export default function ChildCharityGrantsApplicationsPage() {
  const [data] = useState<GrantRecord[]>(SEED);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("date");

  const stats = useMemo(() => {
    const yearStart = new Date();
    yearStart.setMonth(0, 1);
    const ytdAwarded = data
      .filter(
        (r) =>
          r.amountAwarded &&
          r.decisionDate &&
          new Date(r.decisionDate) >= yearStart
      )
      .reduce((s, r) => s + (r.amountAwarded ?? 0), 0);

    const open = data.filter((r) =>
      ["Drafted", "Submitted", "Under review"].includes(r.applicationStatus)
    ).length;

    const charitiesUsed = new Set(data.map((r) => r.charityName)).size;

    const pending = data.filter((r) =>
      ["Submitted", "Under review"].includes(r.applicationStatus)
    ).length;

    return { ytdAwarded, open, charitiesUsed, pending };
  }, [data]);

  const filtered = useMemo(() => {
    let list = [...data];
    if (statusFilter !== "all")
      list = list.filter((r) => r.applicationStatus === statusFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.youngPerson.toLowerCase().includes(q) ||
          r.charityName.toLowerCase().includes(q) ||
          r.grantPurpose.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.itemsFunded.some((i) => i.toLowerCase().includes(q))
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "amount":
          return (b.amountAwarded ?? 0) - (a.amountAwarded ?? 0);
        case "yp":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "charity":
          return a.charityName.localeCompare(b.charityName);
        default:
          return b.applicationDate.localeCompare(a.applicationDate);
      }
    });
    return list;
  }, [data, statusFilter, search, sortBy]);

  const exportCols: ExportColumn<GrantRecord>[] = [
    { header: "Young Person", accessor: (r: GrantRecord) => r.youngPerson },
    { header: "Charity", accessor: (r: GrantRecord) => r.charityName },
    { header: "Category", accessor: (r: GrantRecord) => r.category },
    { header: "Purpose", accessor: (r: GrantRecord) => r.grantPurpose },
    {
      header: "Application Date",
      accessor: (r: GrantRecord) => r.applicationDate,
    },
    {
      header: "Status",
      accessor: (r: GrantRecord) => r.applicationStatus,
    },
    {
      header: "Amount Requested (GBP)",
      accessor: (r: GrantRecord) => String(r.amountRequested),
    },
    {
      header: "Amount Awarded (GBP)",
      accessor: (r: GrantRecord) =>
        r.amountAwarded != null ? String(r.amountAwarded) : "",
    },
    {
      header: "Decision Date",
      accessor: (r: GrantRecord) => r.decisionDate ?? "",
    },
    {
      header: "Items Funded",
      accessor: (r: GrantRecord) => r.itemsFunded.join("; "),
    },
    {
      header: "Evidence Provided",
      accessor: (r: GrantRecord) => r.evidenceProvidedToCharity.join("; "),
    },
    {
      header: "Child Involved",
      accessor: (r: GrantRecord) =>
        r.childInvolvedInApplication ? "Yes" : "No",
    },
    {
      header: "Acknowledgement Sent",
      accessor: (r: GrantRecord) => (r.childAcknowledgementSent ? "Yes" : "No"),
    },
    {
      header: "Follow-up Required",
      accessor: (r: GrantRecord) => (r.followUpReportRequired ? "Yes" : "No"),
    },
    {
      header: "Follow-up Date",
      accessor: (r: GrantRecord) => r.followUpReportDate ?? "",
    },
    { header: "Child Voice", accessor: (r: GrantRecord) => r.childVoice },
    {
      header: "Staff Observation",
      accessor: (r: GrantRecord) => r.staffObservation,
    },
    { header: "Recorded By", accessor: (r: GrantRecord) => r.recordedBy },
    { header: "Recorded Date", accessor: (r: GrantRecord) => r.recordedDate },
  ];

  return (
    <PageShell
      title="Charity Grants & Applications"
      subtitle="Per-child charity grant applications, decisions and items funded — Buttle UK, Family Fund, Coram Voice, Lift the Limit, Princess Royal Trust, BBC Children in Need"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton
            data={data}
            columns={exportCols}
            filename="charity-grants-applications"
          />
          <PrintButton title="Charity Grants & Applications" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              l: "Total Awarded YTD",
              v: gbp(stats.ytdAwarded),
              icon: PoundSterling,
              c: "text-amber-600",
            },
            {
              l: "Applications Open",
              v: stats.open,
              icon: FileText,
              c: "text-teal-600",
            },
            {
              l: "Charities Used",
              v: stats.charitiesUsed,
              icon: Heart,
              c: "text-rose-600",
            },
            {
              l: "Pending Decisions",
              v: stats.pending,
              icon: Calendar,
              c: "text-indigo-600",
            },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-lg border bg-white p-3 text-center"
            >
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search child, charity, purpose, item…"
              className="w-full rounded-md border pl-8 pr-3 py-2 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_META).map((k) => (
                <SelectItem key={k} value={k}>
                  {k}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm"
            >
              <option value="date">Application Date</option>
              <option value="amount">Amount Awarded</option>
              <option value="yp">Young Person</option>
              <option value="charity">Charity</option>
            </select>
          </div>
        </div>

        {/* records */}
        {filtered.map((rec) => {
          const isOpen = expanded === rec.id;
          return (
            <div
              key={rec.id}
              className="rounded-lg border bg-white overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : rec.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-amber-50/40"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-amber-100 p-2">
                    <Award className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{rec.youngPerson}</h3>
                      <span className="text-sm text-muted-foreground">
                        — {rec.charityName}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          STATUS_META[rec.applicationStatus].colour
                        )}
                      >
                        {STATUS_META[rec.applicationStatus].label}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          CATEGORY_COLOUR[rec.category]
                        )}
                      >
                        {rec.category}
                      </span>
                      {rec.amountAwarded != null && (
                        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Awarded {gbp(rec.amountAwarded)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Applied {rec.applicationDate} · Requested{" "}
                      {gbp(rec.amountRequested)}
                      {rec.decisionDate
                        ? ` · Decision ${rec.decisionDate}`
                        : ""}
                    </p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {isOpen && (
                <div className="border-t p-4 space-y-4 bg-amber-50/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Charity:</span>{" "}
                      {rec.charityName}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      {rec.applicationStatus}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Requested:</span>{" "}
                      {gbp(rec.amountRequested)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Awarded:</span>{" "}
                      {rec.amountAwarded != null
                        ? gbp(rec.amountAwarded)
                        : "—"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Applied:</span>{" "}
                      {rec.applicationDate}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Decision:</span>{" "}
                      {rec.decisionDate ?? "Pending"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recorded by:</span>{" "}
                      {rec.recordedBy}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recorded:</span>{" "}
                      {rec.recordedDate}
                    </div>
                  </div>

                  <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
                    <h4 className="text-sm font-semibold text-teal-800 mb-1">
                      Grant Purpose
                    </h4>
                    <p className="text-sm text-teal-900">{rec.grantPurpose}</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="rounded-lg border bg-white p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <Award className="h-4 w-4 text-amber-600" /> Items
                        Funded
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {rec.itemsFunded.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border bg-white p-3">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                        <FileText className="h-4 w-4 text-teal-600" /> Evidence
                        Provided to Charity
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {rec.evidenceProvidedToCharity.map((i, idx) => (
                          <li key={idx}>{i}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Child involved
                      </p>
                      <p className="font-medium">
                        {rec.childInvolvedInApplication ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Acknowledgement sent
                      </p>
                      <p className="font-medium">
                        {rec.childAcknowledgementSent ? "Yes" : "Not yet"}
                      </p>
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Follow-up required
                      </p>
                      <p className="font-medium">
                        {rec.followUpReportRequired ? "Yes" : "No"}
                      </p>
                    </div>
                    <div className="rounded-md border bg-white p-2">
                      <p className="text-xs text-muted-foreground">
                        Follow-up date
                      </p>
                      <p className="font-medium">
                        {rec.followUpReportDate ?? "—"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                    <h4 className="text-sm font-semibold text-pink-800 mb-1 flex items-center gap-1">
                      <Heart className="h-4 w-4" /> Child&apos;s Voice
                    </h4>
                    <p className="text-sm text-pink-900 italic">
                      &ldquo;{rec.childVoice}&rdquo;
                    </p>
                  </div>

                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-sm font-semibold text-amber-900 mb-1">
                      Staff Observation
                    </h4>
                    <p className="text-sm text-amber-950">
                      {rec.staffObservation}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border bg-white p-8 text-center text-sm text-muted-foreground">
            No grant applications match the current filters.
          </div>
        )}

        <div className="rounded-lg border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>
            Why this matters — beyond statutory budgets
          </strong>{" "}
          — Charity grants from Buttle UK, Family Fund, Coram Voice, Lift the
          Limit, Princess Royal Trust and BBC Children in Need beneficiary
          funds are often the difference between a looked-after child surviving
          and thriving. They unlock the boots, the laptop, the workshop, the
          weighted blanket — the everyday things that build identity,
          confidence and a sense of being valued.
        </div>

        <div className="rounded-lg border-l-4 border-teal-500 bg-teal-50 p-4 text-sm text-teal-900">
          <strong>
            Regulatory framework — Care Leavers (England) Regs 2010
          </strong>{" "}
          (Pathway Plan funding supplements) · DfE Statutory Guidance for the
          Care of Looked-After Children · Children&apos;s Homes (England)
          Regulations 2015 — Quality Standard 5 (Education and learning),
          Quality Standard 6 (Enjoyment and achievement) and Quality Standard
          10 (Care planning). Charity grant applications must be evidenced,
          child-involved where possible and outcomes followed up in the
          Pathway / Placement Plan.
        </div>
      </div>
    </PageShell>
  );
}

/* keep CATEGORIES referenced so tree-shaking won't strip the type list */
export const _categories = CATEGORIES;
