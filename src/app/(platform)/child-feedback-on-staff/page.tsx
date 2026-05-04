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
  Heart,
  MessageCircle,
  Star,
  Lock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StaffFeedback {
  id: string;
  childWhoGaveFeedback: string;
  attribution: "Named" | "Anonymous to subject" | "Anonymous to all but RM";
  feedbackDate: string;
  channel: "Children's meeting" | "Key working" | "Suggestion box" | "Independent advocate" | "Reg 44 visit" | "Direct to RM";
  staffSubject: string;
  feedbackSentiment: "Positive" | "Mixed" | "Constructive" | "Concern";
  feedbackTopic: "Relational warmth" | "Boundaries fairness" | "Communication style" | "Cultural awareness" | "Sensory awareness" | "Listening" | "Reliability" | "Consistency" | "Specific incident" | "Skill" | "General appreciation";
  childWords: string;
  contextOfFeedback: string;
  staffMemberInformed: boolean;
  staffMemberInformedDate: string;
  staffResponse: string;
  managerActions: string[];
  feedbackSharedWith: string[];
  childWishesForResponse: string;
  followUpDate: string;
  recordedBy: string;
  protectedFromRetaliation: boolean;
  patternIndicator: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: StaffFeedback[] = [
  {
    id: "sf-001",
    childWhoGaveFeedback: "yp_casey",
    attribution: "Named",
    feedbackDate: d(-3),
    channel: "Children's meeting",
    staffSubject: "staff_anna",
    feedbackSentiment: "Positive",
    feedbackTopic: "Sensory awareness",
    childWords: "Anna gets it. She knows when I need quiet, when I need a card, when I need her to just sit. She doesn't make me explain.",
    contextOfFeedback: "Casey nominated Anna formally for sensory-aware care during Children's Pledges review. Casey speaks rarely about staff but chose to here.",
    staffMemberInformed: true,
    staffMemberInformedDate: d(-3),
    staffResponse: "Anna emotional. 'Casey trusting me to be silent is the highest compliment.' Wrote a thank-you note back to Casey.",
    managerActions: [
      "Logged in Staff Recognition",
      "Anna's approach to be shared (with permission) as practice example",
    ],
    feedbackSharedWith: ["Anna directly", "Whole team meeting (with Casey's permission)", "Reg 44 visitor"],
    childWishesForResponse: "Casey just wanted Anna to know — was happy with thanks note response.",
    followUpDate: d(60),
    recordedBy: "staff_darren",
    protectedFromRetaliation: true,
    patternIndicator: "Consistent with multiple positive observations of Anna's sensory practice",
  },
  {
    id: "sf-002",
    childWhoGaveFeedback: "yp_alex",
    attribution: "Named",
    feedbackDate: d(-7),
    channel: "Key working",
    staffSubject: "staff_lackson",
    feedbackSentiment: "Positive",
    feedbackTopic: "Reliability",
    childWords: "Lackson always shows up. Boxing nights, even his day off he came. He doesn't break promises.",
    contextOfFeedback: "Alex talked about boxing club inter-club competition support during key working session.",
    staffMemberInformed: true,
    staffMemberInformedDate: d(-7),
    staffResponse: "Lackson moved. 'Just love watching Alex thrive.' Continues commitment.",
    managerActions: [
      "Logged in Staff Recognition",
      "Reminded Lackson about boundaries — taking time off in lieu protected",
    ],
    feedbackSharedWith: ["Lackson directly", "RM oversight"],
    childWishesForResponse: "Just wanted Lackson to know.",
    followUpDate: d(60),
    recordedBy: "staff_anna",
    protectedFromRetaliation: true,
    patternIndicator: "Reliability theme — strength of Lackson's practice",
  },
  {
    id: "sf-003",
    childWhoGaveFeedback: "yp_jordan",
    attribution: "Named",
    feedbackDate: d(-14),
    channel: "Children's meeting",
    staffSubject: "staff_chervelle",
    feedbackSentiment: "Positive",
    feedbackTopic: "Cultural awareness",
    childWords: "Chervelle gets my background. She doesn't just learn about it from a website — she lives parts of it. I feel seen here.",
    contextOfFeedback: "Jordan shared with whole children's meeting; significant moment.",
    staffMemberInformed: true,
    staffMemberInformedDate: d(-13),
    staffResponse: "'Means everything. I came into care work because of relationships like this.'",
    managerActions: [
      "Logged in Staff Recognition",
      "Cultural responsiveness valued as core capability — informs hiring strategy",
    ],
    feedbackSharedWith: ["Chervelle directly", "Whole team", "Newsletter"],
    childWishesForResponse: "Wanted public acknowledgement — agreed.",
    followUpDate: d(60),
    recordedBy: "staff_darren",
    protectedFromRetaliation: true,
    patternIndicator: "Cultural matching theme — diversity in team is a strength",
  },
  {
    id: "sf-004",
    childWhoGaveFeedback: "yp_alex",
    attribution: "Anonymous to subject",
    feedbackDate: d(-30),
    channel: "Direct to RM",
    staffSubject: "[Staff member name held by RM]",
    feedbackSentiment: "Constructive",
    feedbackTopic: "Communication style",
    childWords: "Sometimes [they] talk to me like I'm younger than I am. I get it but I'm 13, not 8.",
    contextOfFeedback: "Alex came to RM privately. Asked that the named staff member be told the feedback but not who gave it.",
    staffMemberInformed: true,
    staffMemberInformedDate: d(-28),
    staffResponse: "Staff member reflected — recognised pattern. Apologised in supervision. Has adjusted approach. Alex hasn't raised it again.",
    managerActions: [
      "Confidential conversation with staff member (without naming Alex)",
      "Reflective supervision session focused on age-appropriate communication",
      "Check-in with Alex 4 weeks later — said issue resolved",
    ],
    feedbackSharedWith: ["Staff member (anonymised source)", "RM only"],
    childWishesForResponse: "Wanted the issue addressed without becoming awkward. Got that.",
    followUpDate: d(0),
    recordedBy: "staff_darren",
    protectedFromRetaliation: true,
    patternIndicator: "Single feedback — addressed; no recurrence",
  },
  {
    id: "sf-005",
    childWhoGaveFeedback: "yp_alex",
    attribution: "Named",
    feedbackDate: d(-45),
    channel: "Reg 44 visit",
    staffSubject: "staff_edward",
    feedbackSentiment: "Positive",
    feedbackTopic: "Listening",
    childWords: "Edward listens properly. Doesn't just nod. He remembers what I said last time.",
    contextOfFeedback: "Reg 44 visitor (Helen Frost) asked Alex who he trusts. Alex named Edward.",
    staffMemberInformed: true,
    staffMemberInformedDate: d(-43),
    staffResponse: "Edward valued the feedback. 'Listening is the work.' Continues practice.",
    managerActions: [
      "Logged in Staff Recognition",
      "Featured in Reg 44 report",
    ],
    feedbackSharedWith: ["Edward directly", "Reg 44 visitor (publicly logged)"],
    childWishesForResponse: "Happy for Helen to share with Edward.",
    followUpDate: d(60),
    recordedBy: "staff_darren",
    protectedFromRetaliation: true,
    patternIndicator: "Listening — Edward's strength repeatedly noted",
  },
  {
    id: "sf-006",
    childWhoGaveFeedback: "yp_jordan",
    attribution: "Named",
    feedbackDate: d(-60),
    channel: "Independent advocate",
    staffSubject: "staff_ryan",
    feedbackSentiment: "Positive",
    feedbackTopic: "Boundaries fairness",
    childWords: "Ryan is fair. He's strict but he explains. I'd rather have him saying no with a reason than someone else saying yes with no reason.",
    contextOfFeedback: "Karen (advocate) reported Jordan's view at advocacy review.",
    staffMemberInformed: true,
    staffMemberInformedDate: d(-58),
    staffResponse: "Ryan: 'That's my whole approach.' Continues practice.",
    managerActions: [
      "Logged in Staff Recognition",
      "Validates Ryan's deputy role and approach",
    ],
    feedbackSharedWith: ["Ryan directly", "Karen (advocate)"],
    childWishesForResponse: "Wanted Ryan to know — Karen passed on.",
    followUpDate: d(120),
    recordedBy: "staff_darren",
    protectedFromRetaliation: true,
    patternIndicator: "Boundaries-with-explanation theme — Ryan's practice strength",
  },
];

const sentimentColour: Record<string, string> = {
  Positive: "bg-green-100 text-green-800",
  Mixed: "bg-blue-100 text-blue-800",
  Constructive: "bg-amber-100 text-amber-800",
  Concern: "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<StaffFeedback>[] = [
  { header: "Date", accessor: (r: StaffFeedback) => r.feedbackDate },
  { header: "Child", accessor: (r: StaffFeedback) => getYPName(r.childWhoGaveFeedback) },
  { header: "Attribution", accessor: (r: StaffFeedback) => r.attribution },
  { header: "Subject", accessor: (r: StaffFeedback) => r.staffSubject.startsWith("staff_") ? getStaffName(r.staffSubject) : r.staffSubject },
  { header: "Topic", accessor: (r: StaffFeedback) => r.feedbackTopic },
  { header: "Sentiment", accessor: (r: StaffFeedback) => r.feedbackSentiment },
  { header: "Channel", accessor: (r: StaffFeedback) => r.channel },
  { header: "Staff Informed", accessor: (r: StaffFeedback) => r.staffMemberInformed ? "Yes" : "No" },
];

export default function ChildFeedbackOnStaffPage() {
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [filterChild, setFilterChild] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterSentiment !== "all") items = items.filter((r) => r.feedbackSentiment === filterSentiment);
    if (filterChild !== "all") items = items.filter((r) => r.childWhoGaveFeedback === filterChild);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.feedbackDate.localeCompare(a.feedbackDate);
        case "sentiment":
          return a.feedbackSentiment.localeCompare(b.feedbackSentiment);
        default:
          return 0;
      }
    });
    return items;
  }, [filterSentiment, filterChild, sortBy]);

  const total = data.length;
  const positive = data.filter((r) => r.feedbackSentiment === "Positive").length;
  const constructive = data.filter((r) => r.feedbackSentiment === "Constructive").length;
  const allInformed = data.every((r) => r.staffMemberInformed);

  return (
    <PageShell
      title="Child Feedback on Staff"
      subtitle="Children's voice about individual staff — celebrated, addressed, never dismissed"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="child-feedback-on-staff" />
          <PrintButton title="Child Feedback on Staff" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Feedback Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{positive}</p>
          <p className="text-xs text-muted-foreground">Positive</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{constructive}</p>
          <p className="text-xs text-muted-foreground">Constructive</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{allInformed ? "100%" : `${data.filter((r) => r.staffMemberInformed).length}/${total}`}</p>
          <p className="text-xs text-muted-foreground">Staff Informed</p>
        </div>
      </div>

      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Lock className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">
          Children must be able to give feedback about staff freely — including critical feedback —
          without fear. Anonymous channels exist. Children control attribution. Retaliation is never
          tolerated. Positive feedback is celebrated; constructive feedback is addressed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterChild} onValueChange={setFilterChild}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Children" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
            <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
            <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterSentiment} onValueChange={setFilterSentiment}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Sentiments" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sentiments</SelectItem>
            <SelectItem value="Positive">Positive</SelectItem>
            <SelectItem value="Mixed">Mixed</SelectItem>
            <SelectItem value="Constructive">Constructive</SelectItem>
            <SelectItem value="Concern">Concern</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="sentiment">By Sentiment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Heart className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.childWhoGaveFeedback)} on {r.staffSubject.startsWith("staff_") ? getStaffName(r.staffSubject) : r.staffSubject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {r.feedbackDate} &middot; {r.channel} &middot; {r.feedbackTopic} &middot; {r.attribution}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", sentimentColour[r.feedbackSentiment])}>
                    {r.feedbackSentiment}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />Child&apos;s Words
                    </p>
                    <p className="text-sm italic">&ldquo;{r.childWords}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Context</p>
                    <p className="text-sm">{r.contextOfFeedback}</p>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                      <Sparkles className="h-3 w-3 inline mr-1" />Staff Response
                    </p>
                    <p className="text-sm italic">&ldquo;{r.staffResponse}&rdquo;</p>
                  </div>

                  {r.managerActions.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Manager Actions</p>
                      <ul className="space-y-1">
                        {r.managerActions.map((a, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-pink-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child Wishes For Response</p>
                    <p className="text-sm">{r.childWishesForResponse}</p>
                  </div>

                  {r.patternIndicator && (
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">Pattern Indicator</p>
                      <p className="text-sm">{r.patternIndicator}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Lock className="h-3 w-3 inline mr-1" />Attribution: {r.attribution}</span>
                    <span>Recorded: {getStaffName(r.recordedBy)}</span>
                    {r.protectedFromRetaliation && <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Anti-Retaliation Protected</span>}
                    {r.staffMemberInformed && <span>Staff informed: {r.staffMemberInformedDate}</span>}
                  </div>

                  {r.feedbackSentiment === "Concern" && (
                    <div className="bg-red-50 rounded-lg p-3 flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-sm">Concern logged — see manager actions and follow-up.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Feedback on staff supports UNCRC Article 12 (right to be
          heard about all matters affecting them), Quality Standard 1 (child-centred care), and Quality
          Standard 13 (leadership and management). Anti-retaliation principle is absolute. Linked to
          Staff Recognition Log, Voice of Child, Reg 44 visits, and Children&apos;s Pledges.
        </p>
      </div>
    </PageShell>
  );
}
