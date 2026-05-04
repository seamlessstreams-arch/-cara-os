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
  Star,
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── types ───────────────────────────────────────────────────────────────────
interface ChildPledge {
  id: string;
  youngPerson: string;
  pledgeCategory: "Safety" | "Respect" | "Opportunity" | "Belonging" | "Voice" | "Identity";
  pledge: string;
  howWeDeliver: string;
  evidenceOfDelivery: string[];
  childFeedback: string;
  status: "Consistently Met" | "Mostly Met" | "Working On It" | "Not Yet Met";
  lastReviewDate: string;
  reviewedWith: string;
  createdDate: string;
  uncrcArticle: string;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ChildPledge[] = [
  {
    id: "cp-001",
    youngPerson: "yp_alex",
    pledgeCategory: "Safety",
    pledge: "We will always keep you safe and explain any decisions we make about your safety",
    howWeDeliver: "Transparent risk assessments shared at child-friendly level. Safety plans co-produced. Staff always available 24/7.",
    evidenceOfDelivery: [
      "Safety plan reviewed together monthly",
      "Alex involved in fire drill planning",
      "Staff explained boundary rationale when community risk arose",
    ],
    childFeedback: "I feel safe here most of the time. I like that they tell me why things happen.",
    status: "Consistently Met",
    lastReviewDate: d(-14),
    reviewedWith: "staff_darren",
    createdDate: d(-180),
    uncrcArticle: "Article 19 — Protection from harm",
  },
  {
    id: "cp-002",
    youngPerson: "yp_alex",
    pledgeCategory: "Voice",
    pledge: "We will always listen to what you have to say and take your views seriously",
    howWeDeliver: "Weekly key work sessions, children's meetings, access to advocate, feedback forms, and open-door policy with the registered manager.",
    evidenceOfDelivery: [
      "Alex's request for later bedtime was considered and agreed",
      "Choice of bedroom decoration respected",
      "Views included in LAC review prep",
    ],
    childFeedback: "They do listen. Sometimes I don't get what I want but they explain why.",
    status: "Consistently Met",
    lastReviewDate: d(-14),
    reviewedWith: "staff_darren",
    createdDate: d(-180),
    uncrcArticle: "Article 12 — Right to be heard",
  },
  {
    id: "cp-003",
    youngPerson: "yp_alex",
    pledgeCategory: "Opportunity",
    pledge: "We will help you try new things and support your hobbies and interests",
    howWeDeliver: "Activity budget per child, transport to clubs, exploring new interests through taster sessions, education support for aspirations.",
    evidenceOfDelivery: [
      "Started boxing club — staff provide transport twice weekly",
      "Supported application to college taster day",
      "Gaming setup purchased for bedroom with agreed time boundaries",
    ],
    childFeedback: "They're good at helping me do stuff I enjoy. Boxing is my thing now.",
    status: "Consistently Met",
    lastReviewDate: d(-14),
    reviewedWith: "staff_darren",
    createdDate: d(-180),
    uncrcArticle: "Article 31 — Right to play and leisure",
  },
  {
    id: "cp-004",
    youngPerson: "yp_jordan",
    pledgeCategory: "Belonging",
    pledge: "This is your home — we will make sure it feels like it belongs to you",
    howWeDeliver: "Personalised bedroom, input into communal spaces, photos displayed, possessions respected, ability to have friends visit.",
    evidenceOfDelivery: [
      "Jordan chose new bedding and wall colour",
      "Football trophies displayed in lounge",
      "Friend visits happen regularly with agreed boundaries",
    ],
    childFeedback: "It's alright. It feels more like home than the last place. I've got my stuff around me.",
    status: "Mostly Met",
    lastReviewDate: d(-10),
    reviewedWith: "staff_ryan",
    createdDate: d(-160),
    uncrcArticle: "Article 27 — Adequate standard of living",
  },
  {
    id: "cp-005",
    youngPerson: "yp_jordan",
    pledgeCategory: "Respect",
    pledge: "We will treat you with respect and never embarrass you in front of others",
    howWeDeliver: "Difficult conversations always in private. No public consequences. Language is always respectful. Knock before entering rooms.",
    evidenceOfDelivery: [
      "Staff always knock and wait — Jordan confirmed this",
      "Incident debrief conducted privately next day",
      "Staff use chosen name and pronouns consistently",
    ],
    childFeedback: "Yeah they're respectful. They don't shout at me or make me feel small.",
    status: "Consistently Met",
    lastReviewDate: d(-10),
    reviewedWith: "staff_ryan",
    createdDate: d(-160),
    uncrcArticle: "Article 16 — Right to privacy",
  },
  {
    id: "cp-006",
    youngPerson: "yp_jordan",
    pledgeCategory: "Identity",
    pledge: "We will celebrate who you are and support your culture, identity, and faith",
    howWeDeliver: "Cultural calendar observed, food preferences respected, identity conversations in key work, cultural events supported.",
    evidenceOfDelivery: [
      "Heritage month activities planned with Jordan's input",
      "Cultural food requests incorporated into menu",
      "Life story work exploring family heritage",
    ],
    childFeedback: "They try. Sometimes they don't quite get it but they ask and learn.",
    status: "Working On It",
    lastReviewDate: d(-10),
    reviewedWith: "staff_ryan",
    createdDate: d(-160),
    uncrcArticle: "Article 30 — Right to own culture",
  },
  {
    id: "cp-007",
    youngPerson: "yp_casey",
    pledgeCategory: "Safety",
    pledge: "We will keep the home calm and predictable so you feel settled",
    howWeDeliver: "Visual timetables, advance warning of changes, consistent routines, sensory-friendly environment, staff trained in ASD-specific approaches.",
    evidenceOfDelivery: [
      "Visual schedule updated every Sunday for the week",
      "Transition warnings given 10 minutes before changes",
      "Sensory room available whenever needed",
    ],
    childFeedback: "I like knowing what's happening. The schedule helps my brain.",
    status: "Consistently Met",
    lastReviewDate: d(-7),
    reviewedWith: "staff_anna",
    createdDate: d(-140),
    uncrcArticle: "Article 23 — Rights of disabled children",
  },
  {
    id: "cp-008",
    youngPerson: "yp_casey",
    pledgeCategory: "Voice",
    pledge: "We will communicate with you in the way that works best for you",
    howWeDeliver: "Visual aids, written options alongside verbal, processing time given, sensory-appropriate environments for conversations, choice boards available.",
    evidenceOfDelivery: [
      "Choice cards used for meal preferences",
      "Key work sessions use visual prompts",
      "Feelings scale available on bedroom door",
    ],
    childFeedback: "I like the picture cards. It's easier when I don't have to find the words.",
    status: "Mostly Met",
    lastReviewDate: d(-7),
    reviewedWith: "staff_anna",
    createdDate: d(-140),
    uncrcArticle: "Article 13 — Freedom of expression",
  },
  {
    id: "cp-009",
    youngPerson: "yp_casey",
    pledgeCategory: "Opportunity",
    pledge: "We will find activities that match your interests and sensory needs",
    howWeDeliver: "Sensory-appropriate activity options, quiet alternatives, specialist clubs identified, 1:1 options when group settings are too much.",
    evidenceOfDelivery: [
      "Art therapy sessions arranged — Casey's preferred outlet",
      "Quiet library visits instead of noisy groups",
      "Nature walks scheduled in low-stimulation environments",
    ],
    childFeedback: "I love art best. And the walks when it's quiet outside.",
    status: "Consistently Met",
    lastReviewDate: d(-7),
    reviewedWith: "staff_anna",
    createdDate: d(-140),
    uncrcArticle: "Article 31 — Right to play and leisure",
  },
  {
    id: "cp-010",
    youngPerson: "yp_jordan",
    pledgeCategory: "Safety",
    pledge: "We will help you stay safe online and in the community",
    howWeDeliver: "Online safety education, age-appropriate monitoring, community safety planning, discussions about exploitation risks in accessible language.",
    evidenceOfDelivery: [
      "Online safety session completed with positive engagement",
      "Community map created together identifying safe spaces",
      "Social media discussion during key work — Jordan receptive",
    ],
    childFeedback: "They don't just ban stuff — they explain why and help me understand risks.",
    status: "Mostly Met",
    lastReviewDate: d(-10),
    reviewedWith: "staff_ryan",
    createdDate: d(-160),
    uncrcArticle: "Article 17 — Access to information",
  },
];

// ── config ──────────────────────────────────────────────────────────────────
const statusColour: Record<string, string> = {
  "Consistently Met": "bg-green-100 text-green-800",
  "Mostly Met": "bg-blue-100 text-blue-800",
  "Working On It": "bg-amber-100 text-amber-800",
  "Not Yet Met": "bg-red-100 text-red-800",
};

const categoryIcons: Record<string, typeof Heart> = {
  Safety: Shield,
  Respect: Heart,
  Opportunity: Star,
  Belonging: Heart,
  Voice: Heart,
  Identity: Star,
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<ChildPledge>[] = [
  { header: "Young Person", accessor: (r: ChildPledge) => getYPName(r.youngPerson) },
  { header: "Category", accessor: (r: ChildPledge) => r.pledgeCategory },
  { header: "Pledge", accessor: (r: ChildPledge) => r.pledge },
  { header: "Status", accessor: (r: ChildPledge) => r.status },
  { header: "Child Feedback", accessor: (r: ChildPledge) => r.childFeedback },
  { header: "Last Review", accessor: (r: ChildPledge) => r.lastReviewDate },
  { header: "UNCRC Article", accessor: (r: ChildPledge) => r.uncrcArticle },
  { header: "Reviewed With", accessor: (r: ChildPledge) => getStaffName(r.reviewedWith) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ChildrenPledgesPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("child");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((p) => p.youngPerson === filterYP);
    if (filterCategory !== "all") items = items.filter((p) => p.pledgeCategory === filterCategory);

    items.sort((a, b) => {
      switch (sortBy) {
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        case "category":
          return a.pledgeCategory.localeCompare(b.pledgeCategory);
        case "status":
          const ord = { "Consistently Met": 3, "Mostly Met": 2, "Working On It": 1, "Not Yet Met": 0 };
          return ord[a.status] - ord[b.status];
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterCategory, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const consistentlyMet = data.filter((p) => p.status === "Consistently Met").length;
  const totalPledges = data.length;
  const uniqueYP = new Set(data.map((p) => p.youngPerson)).size;
  const categoriesCovered = new Set(data.map((p) => p.pledgeCategory)).size;

  return (
    <PageShell
      title="Children's Pledges"
      subtitle="Our promises to each child — co-produced, reviewed regularly, and evidenced through practice"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="children-pledges" />
          <PrintButton title="Children's Pledges" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalPledges}</p>
          <p className="text-xs text-muted-foreground">Total Pledges</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{consistentlyMet}</p>
          <p className="text-xs text-muted-foreground">Consistently Met</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{uniqueYP}</p>
          <p className="text-xs text-muted-foreground">Children Covered</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{categoriesCovered}</p>
          <p className="text-xs text-muted-foreground">Categories Active</p>
        </div>
      </div>

      {/* ── pledge philosophy ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <p className="text-sm text-green-800">
          Pledges are co-produced with each child and reviewed regularly. They form our commitment to
          rights-based care and are linked to UNCRC articles. Children hold us accountable.
        </p>
      </div>

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
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Safety">Safety</SelectItem>
            <SelectItem value="Respect">Respect</SelectItem>
            <SelectItem value="Opportunity">Opportunity</SelectItem>
            <SelectItem value="Belonging">Belonging</SelectItem>
            <SelectItem value="Voice">Voice</SelectItem>
            <SelectItem value="Identity">Identity</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="status">By Status</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── pledge cards ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No pledges match your filters.</div>
        )}
        {filtered.map((pledge) => {
          const isExpanded = expandedId === pledge.id;
          const CatIcon = categoryIcons[pledge.pledgeCategory] || Heart;
          const StatusIcon = pledge.status === "Consistently Met" ? CheckCircle
            : pledge.status === "Not Yet Met" ? AlertCircle
            : Clock;

          return (
            <div key={pledge.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : pledge.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <CatIcon className="h-5 w-5 text-purple-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{pledge.pledge}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getYPName(pledge.youngPerson)} &middot; {pledge.pledgeCategory} &middot; {pledge.uncrcArticle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColour[pledge.status])}>
                    {pledge.status}
                  </span>
                  <StatusIcon className={cn("h-4 w-4",
                    pledge.status === "Consistently Met" ? "text-green-500" :
                    pledge.status === "Not Yet Met" ? "text-red-500" : "text-amber-500"
                  )} />
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">How We Deliver This</p>
                    <p className="text-sm">{pledge.howWeDeliver}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Evidence of Delivery</p>
                    <ul className="space-y-1">
                      {pledge.evidenceOfDelivery.map((e, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      Child&apos;s Feedback
                    </p>
                    <p className="text-sm text-blue-900 italic">&ldquo;{pledge.childFeedback}&rdquo;</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>UNCRC: {pledge.uncrcArticle}</span>
                    <span>Last reviewed: {pledge.lastReviewDate}</span>
                    <span>Reviewed with: {getStaffName(pledge.reviewedWith)}</span>
                    <span>Created: {pledge.createdDate}</span>
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
          <strong>Regulatory Context:</strong> Children&apos;s pledges demonstrate compliance with Quality Standard 1
          (child-centred care), the UNCRC, and Regulation 7 (children&apos;s views, wishes and feelings).
          Pledges are reviewed in children&apos;s meetings and during key work sessions. Children are encouraged
          to challenge the home when pledges are not being met.
        </p>
      </div>
    </PageShell>
  );
}
