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
  RefreshCw,
  Scale,
  Star,
  AlertTriangle,
  CheckCircle,
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
interface ConsequenceRecord {
  id: string;
  youngPerson: string;
  date: string;
  behaviour: string;
  behaviourLevel: "Low" | "Medium" | "High" | "Crisis";
  approach: "Restorative conversation" | "Natural consequence" | "Logical consequence" | "Repair activity" | "Relational repair" | "Boundary reset";
  description: string;
  childVoice: string;
  staffResponse: string;
  restorativeQuestions: string[];
  outcome: string;
  relationshipRepaired: boolean;
  followUp: string;
  recordedBy: string;
  linkedBehaviourPlan: boolean;
}

// ── seed data ───────────────────────────────────────────────────────────────
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ConsequenceRecord[] = [
  {
    id: "cf-001",
    youngPerson: "yp_alex",
    date: d(-2),
    behaviour: "Refused to attend school, threw breakfast plate when challenged",
    behaviourLevel: "Medium",
    approach: "Restorative conversation",
    description: "Alex became dysregulated at breakfast. Staff used PACE approach, gave space, then revisited after 30 minutes using restorative questions.",
    childVoice: "I didn't want to go because the teacher picks on me. I know I shouldn't have thrown the plate.",
    staffResponse: "Acknowledged Alex's feelings about school. Explored what 'picks on me' means. Agreed to speak with school SENCO. Discussed safer ways to express frustration.",
    restorativeQuestions: [
      "What happened?",
      "What were you thinking at the time?",
      "Who has been affected by what happened?",
      "What do you think you need to do to make things right?",
    ],
    outcome: "Alex helped clean up breakfast area, wrote apology to staff member. Agreed signal for when school anxiety is building.",
    relationshipRepaired: true,
    followUp: "Meeting with school SENCO arranged for Thursday. Morning routine adjusted to reduce pressure.",
    recordedBy: "staff_darren",
    linkedBehaviourPlan: true,
  },
  {
    id: "cf-002",
    youngPerson: "yp_jordan",
    date: d(-4),
    behaviour: "Took another young person's headphones without asking",
    behaviourLevel: "Low",
    approach: "Natural consequence",
    description: "Jordan took Alex's headphones from the communal area. Natural consequence: required to return item and lost privilege of using communal tech for remainder of day.",
    childVoice: "I just wanted to use them for a bit. I was going to give them back.",
    staffResponse: "Validated that sharing is sometimes hard but explained why asking first matters. Connected to respect and trust within the home.",
    restorativeQuestions: [
      "What happened?",
      "How do you think Alex felt when they couldn't find their headphones?",
      "What could you do differently next time?",
    ],
    outcome: "Jordan returned headphones and apologised to Alex directly. Discussed house agreements about personal property.",
    relationshipRepaired: true,
    followUp: "None required — low-level. Positive reinforcement when Jordan later asked before borrowing something.",
    recordedBy: "staff_edward",
    linkedBehaviourPlan: false,
  },
  {
    id: "cf-003",
    youngPerson: "yp_casey",
    date: d(-5),
    behaviour: "Meltdown during transition between activities — threw cushions, kicked door",
    behaviourLevel: "High",
    approach: "Relational repair",
    description: "Casey became overwhelmed during unexpected schedule change. Sensory overload escalated to physical dysregulation. Staff maintained calm presence, offered sensory tools, and reduced demands until Casey was regulated.",
    childVoice: "I didn't know we were doing something different. My brain went too fast and I couldn't stop it.",
    staffResponse: "Recognised as sensory/ASD-related rather than defiance. No consequence applied to the meltdown itself. Focused on co-regulation and preventing future occurrences through better transition preparation.",
    restorativeQuestions: [
      "What was happening in your body before it got too much?",
      "What could we do to help you know about changes earlier?",
      "What helps when your brain goes too fast?",
    ],
    outcome: "Created visual 'change warning' card system. Casey helped repair kicked door panel (sanded and painted together as repair activity). Staff validated Casey's experience.",
    relationshipRepaired: true,
    followUp: "Transition warnings now built into daily routine plan. Sensory bag refreshed with Casey's input.",
    recordedBy: "staff_anna",
    linkedBehaviourPlan: true,
  },
  {
    id: "cf-004",
    youngPerson: "yp_alex",
    date: d(-8),
    behaviour: "Verbal aggression towards staff member during bedtime routine",
    behaviourLevel: "Medium",
    approach: "Boundary reset",
    description: "Alex became verbally aggressive when asked to put phone away at agreed bedtime. Used offensive language directed at staff. Staff held boundary calmly, named the behaviour, and offered to revisit in the morning.",
    childVoice: "I was talking to my friend and it's not fair. Everyone else gets to stay up later.",
    staffResponse: "Held the boundary around screen time agreement (co-produced with Alex). Acknowledged frustration but maintained expectation. Did not escalate or lecture. Revisited with warmth next morning.",
    restorativeQuestions: [
      "What was happening for you last night?",
      "How do you think the staff member felt when those words were used?",
      "What's our agreement about phone time?",
      "How can we handle it differently if you feel frustrated about bedtime?",
    ],
    outcome: "Alex apologised unprompted the next morning. Reviewed phone time agreement — Alex requested 10-minute warning before screen off time. Staff agreed.",
    relationshipRepaired: true,
    followUp: "10-minute phone warning added to evening routine. Positive feedback given when Alex handed phone over calmly on subsequent nights.",
    recordedBy: "staff_ryan",
    linkedBehaviourPlan: true,
  },
  {
    id: "cf-005",
    youngPerson: "yp_jordan",
    date: d(-10),
    behaviour: "Left the building without permission during an argument with peer",
    behaviourLevel: "High",
    approach: "Logical consequence",
    description: "Jordan left the house following argument with Alex. Was away for 25 minutes but stayed in garden/street (visible from windows). Missing protocol NOT activated as within sight. On return, restorative approach used.",
    childVoice: "I needed to get out. If I stayed I was going to lose it. I stayed where you could see me.",
    staffResponse: "Recognised Jordan's self-regulation strategy (removing self from situation). Praised staying visible. Discussed the safety concern and agreed a 'safe space' within the building for future use.",
    restorativeQuestions: [
      "What triggered you to leave?",
      "What helped you decide to stay where staff could see you?",
      "What other safe spaces could we create for you inside?",
    ],
    outcome: "Created designated 'cool down zone' in conservatory. Jordan chose sensory items for the space. Agreed plan: tell staff 'I need space', go to zone, staff check after 10 mins.",
    relationshipRepaired: true,
    followUp: "Cool down zone used successfully 3 times since. No further boundary breaches. Positive feedback loop.",
    recordedBy: "staff_chervelle",
    linkedBehaviourPlan: true,
  },
  {
    id: "cf-006",
    youngPerson: "yp_casey",
    date: d(-12),
    behaviour: "Refused to engage in hygiene routine for 3 consecutive days",
    behaviourLevel: "Low",
    approach: "Repair activity",
    description: "Casey declined all hygiene prompts over 3 days. Rather than escalating, staff explored the 'why'. Discovered new shower gel had an overwhelming scent (sensory issue).",
    childVoice: "The new stuff smells horrible and it makes my skin feel wrong.",
    staffResponse: "Immediately understood as sensory rather than defiance. Went shopping together for unscented alternatives. Casey now has own chosen products.",
    restorativeQuestions: [
      "What is it about the shower that doesn't feel right?",
      "What did the old products feel/smell like that worked?",
      "Would you like to choose your own products?",
    ],
    outcome: "Casey selected own hygiene products (unscented, specific texture). Returned to regular hygiene routine immediately. Shopping trip became a positive relational activity.",
    relationshipRepaired: true,
    followUp: "Sensory preferences added to Casey's profile. Staff reminder not to change Casey's products without consultation.",
    recordedBy: "staff_anna",
    linkedBehaviourPlan: false,
  },
  {
    id: "cf-007",
    youngPerson: "yp_alex",
    date: d(-15),
    behaviour: "Damaged communal TV remote during gaming argument with peer",
    behaviourLevel: "Medium",
    approach: "Logical consequence",
    description: "Alex threw remote during argument over gaming time with Jordan. Remote broken beyond repair. Logical consequence discussed — contribution to replacement cost from pocket money.",
    childVoice: "I didn't mean to break it. Jordan was being annoying and wouldn't give me a turn. I shouldn't have thrown it.",
    staffResponse: "Separated the emotional response from the damage. Acknowledged frustration with turn-taking was valid. Discussed that replacing broken items is fair. Alex agreed to £5/week from pocket money (not punitive — collaborative decision).",
    restorativeQuestions: [
      "What happened with the remote?",
      "What do you think should happen when something gets broken?",
      "What's a fair way to sort this out?",
      "How can gaming time feel fairer for everyone?",
    ],
    outcome: "Alex agreed to contribute £5/week x 3 weeks toward replacement. Gaming rota created collaboratively by all young people. Conflict resolution conversation between Alex and Jordan.",
    relationshipRepaired: true,
    followUp: "Gaming rota displayed on notice board. Week 1 contribution made willingly. Praised Alex's ownership of the situation.",
    recordedBy: "staff_lackson",
    linkedBehaviourPlan: false,
  },
  {
    id: "cf-008",
    youngPerson: "yp_jordan",
    date: d(-1),
    behaviour: "Came home 30 minutes past curfew without calling",
    behaviourLevel: "Medium",
    approach: "Restorative conversation",
    description: "Jordan returned at 9:30pm (curfew 9pm) without contacting home. Staff had begun welfare concern process. Restorative approach next morning focused on safety and communication rather than punishment.",
    childVoice: "My phone died and I lost track of time at my mate's house. I wasn't doing anything wrong.",
    staffResponse: "Named the worry — staff were concerned and started processes. Linked to trust and safety. Didn't lecture but explored what the worry felt like from staff's perspective. Discussed practical solutions.",
    restorativeQuestions: [
      "What happened that you were late?",
      "What do you think staff were feeling when you weren't home on time?",
      "What could you do if your phone dies and you can't call?",
      "How can we make sure you stay safe and staff don't worry?",
    ],
    outcome: "Jordan agreed to always have portable charger. Back-up plan: borrow friend's phone or ask friend's parent to call. Curfew unchanged — trust maintained.",
    relationshipRepaired: false,
    followUp: "Portable charger purchased. Will review in 1 week whether relationship fully repaired (Jordan still slightly withdrawn).",
    recordedBy: "staff_mirela",
    linkedBehaviourPlan: false,
  },
];

// ── config ──────────────────────────────────────────────────────────────────
const levelColour: Record<string, string> = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
  Crisis: "bg-red-200 text-red-900",
};

const approachIcons: Record<string, typeof Heart> = {
  "Restorative conversation": MessageCircle,
  "Natural consequence": Scale,
  "Logical consequence": Scale,
  "Repair activity": RefreshCw,
  "Relational repair": Heart,
  "Boundary reset": AlertTriangle,
};

// ── export columns ──────────────────────────────────────────────────────────
const exportCols: ExportColumn<ConsequenceRecord>[] = [
  { header: "Young Person", accessor: (r: ConsequenceRecord) => getYPName(r.youngPerson) },
  { header: "Date", accessor: (r: ConsequenceRecord) => r.date },
  { header: "Behaviour", accessor: (r: ConsequenceRecord) => r.behaviour },
  { header: "Level", accessor: (r: ConsequenceRecord) => r.behaviourLevel },
  { header: "Approach", accessor: (r: ConsequenceRecord) => r.approach },
  { header: "Child Voice", accessor: (r: ConsequenceRecord) => r.childVoice },
  { header: "Outcome", accessor: (r: ConsequenceRecord) => r.outcome },
  { header: "Repaired", accessor: (r: ConsequenceRecord) => r.relationshipRepaired ? "Yes" : "Not yet" },
  { header: "Recorded By", accessor: (r: ConsequenceRecord) => getStaffName(r.recordedBy) },
];

// ── component ───────────────────────────────────────────────────────────────
export default function ConsequenceFrameworkPage() {
  const [filterYP, setFilterYP] = useState("all");
  const [filterApproach, setFilterApproach] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterYP !== "all") items = items.filter((r) => r.youngPerson === filterYP);
    if (filterApproach !== "all") items = items.filter((r) => r.approach === filterApproach);

    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "level":
          const ord = { Crisis: 0, High: 1, Medium: 2, Low: 3 };
          return ord[a.behaviourLevel] - ord[b.behaviourLevel];
        case "child":
          return a.youngPerson.localeCompare(b.youngPerson);
        default:
          return 0;
      }
    });
    return items;
  }, [filterYP, filterApproach, sortBy]);

  // ── stats ─────────────────────────────────────────────────────────────────
  const repaired = data.filter((r) => r.relationshipRepaired).length;
  const restorativeCount = data.filter((r) => r.approach === "Restorative conversation").length;
  const avgRepairRate = Math.round((repaired / data.length) * 100);

  return (
    <PageShell
      title="Consequence Framework"
      subtitle="Restorative approach to behaviour management — relational, proportionate, and child-centred"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="consequence-framework" />
          <PrintButton title="Consequence Framework" />
        </div>
      }
    >
      {/* ── summary stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">Total Records</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{avgRepairRate}%</p>
          <p className="text-xs text-muted-foreground">Repair Rate</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{restorativeCount}</p>
          <p className="text-xs text-muted-foreground">Restorative Convos</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{data.filter((r) => r.linkedBehaviourPlan).length}</p>
          <p className="text-xs text-muted-foreground">Linked to BSP</p>
        </div>
      </div>

      {/* ── principles banner ──────────────────────────────────────────── */}
      <div className="rounded-lg bg-green-50 border border-green-200 p-3 mb-6 flex items-start gap-2">
        <Heart className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
        <p className="text-sm text-green-800">
          Our approach: Consequences are relational, not punitive. We ask &ldquo;what happened?&rdquo; not &ldquo;what&apos;s wrong with you?&rdquo;
          Every incident is an opportunity to strengthen relationships and build emotional literacy.
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
        <Select value={filterApproach} onValueChange={setFilterApproach}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Approaches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Approaches</SelectItem>
            <SelectItem value="Restorative conversation">Restorative Conversation</SelectItem>
            <SelectItem value="Natural consequence">Natural Consequence</SelectItem>
            <SelectItem value="Logical consequence">Logical Consequence</SelectItem>
            <SelectItem value="Repair activity">Repair Activity</SelectItem>
            <SelectItem value="Relational repair">Relational Repair</SelectItem>
            <SelectItem value="Boundary reset">Boundary Reset</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="level">Level (High→Low)</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── record cards ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">No records match your filters.</div>
        )}
        {filtered.map((rec) => {
          const isExpanded = expandedId === rec.id;
          const ApproachIcon = approachIcons[rec.approach] || MessageCircle;

          return (
            <div key={rec.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : rec.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <ApproachIcon className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{rec.behaviour}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {rec.date} &middot; {getYPName(rec.youngPerson)} &middot; {rec.approach}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", levelColour[rec.behaviourLevel])}>
                    {rec.behaviourLevel}
                  </span>
                  {rec.relationshipRepaired ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <Clock className="h-4 w-4 text-amber-500" />
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">What Happened</p>
                    <p className="text-sm">{rec.description}</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <MessageCircle className="h-3 w-3 inline mr-1" />Child&apos;s Voice
                    </p>
                    <p className="text-sm text-blue-900 italic">&ldquo;{rec.childVoice}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Response</p>
                    <p className="text-sm">{rec.staffResponse}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Restorative Questions Used</p>
                    <ul className="space-y-1">
                      {rec.restorativeQuestions.map((q, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Outcome</p>
                    <p className="text-sm">{rec.outcome}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs pt-2 border-t">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      rec.relationshipRepaired ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {rec.relationshipRepaired ? "Relationship Repaired" : "Repair In Progress"}
                    </span>
                    {rec.linkedBehaviourPlan && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">Linked to BSP</span>
                    )}
                    <span className="text-muted-foreground">Recorded by: {getStaffName(rec.recordedBy)}</span>
                  </div>

                  {rec.followUp && (
                    <div className="bg-green-50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">Follow-Up</p>
                      <p className="text-sm text-green-900">{rec.followUp}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> This framework aligns with Quality Standard 3 (Protection of children —
          positive behaviour management), Children&apos;s Homes Regulations 2015 Regulation 19 (behaviour management),
          and NICE guideline NG205. Sanctions are never used. All consequences are proportionate, explained, and
          focused on relationship repair and learning.
        </p>
      </div>
    </PageShell>
  );
}
