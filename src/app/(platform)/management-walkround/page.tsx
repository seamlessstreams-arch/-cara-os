"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Eye,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  Star,
  Clock,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Walkround {
  id: string;
  date: string;
  time: string;
  manager: string;
  walkroundType: "Daily" | "Weekly themed" | "Unannounced" | "Pre-inspection rehearsal" | "Post-incident review";
  durationMinutes: number;
  areasVisited: string[];
  observationsPositive: { area: string; observation: string; staffOrChildOrThing: string }[];
  observationsForImprovement: { area: string; observation: string; actionAgreed: string }[];
  childInteractions: { childInitial: string; observation: string }[];
  staffInteractions: { staffMember: string; observation: string }[];
  environmentalChecks: { area: string; status: "Good" | "Needs attention" | "Action taken in moment" }[];
  bookOrRecordReviews: string[];
  immediateActionsTaken: string[];
  followUpActionsLogged: { action: string; owner: string; deadline: string }[];
  themesEmerging: string[];
  positiveStaffPracticeNoted: string[];
  followUpDate: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: Walkround[] = [
  {
    id: "wr-001",
    date: d(0),
    time: "09:30",
    manager: "staff_darren",
    walkroundType: "Daily",
    durationMinutes: 35,
    areasVisited: ["Office", "Lounge", "Kitchen", "Garden", "Hallway/communal", "Stairs"],
    observationsPositive: [
      { area: "Lounge", observation: "Calm, well-organised space; sensory accommodations in place", staffOrChildOrThing: "Lounge environment + Anna's setup" },
      { area: "Kitchen", observation: "Casey making own breakfast independently; Anna nearby quietly", staffOrChildOrThing: "Casey + Anna" },
      { area: "Office", observation: "Handover notes well-written; risk register reviewed yesterday", staffOrChildOrThing: "Records quality" },
    ],
    observationsForImprovement: [],
    childInteractions: [
      { childInitial: "Casey", observation: "Calm, regulated; chose breakfast confidently" },
      { childInitial: "Alex", observation: "Coming downstairs ready for school; cheerful" },
    ],
    staffInteractions: [
      { staffMember: "staff_anna", observation: "Quiet professional presence; modelling sensory-aware practice" },
      { staffMember: "staff_edward", observation: "Education prep visible — homework checked already" },
    ],
    environmentalChecks: [
      { area: "Lounge cleanliness", status: "Good" },
      { area: "Kitchen hygiene", status: "Good" },
      { area: "Front door security", status: "Good" },
      { area: "Sensory equipment availability", status: "Good" },
    ],
    bookOrRecordReviews: [
      "Communication book reviewed",
      "Last shift handover notes reviewed",
    ],
    immediateActionsTaken: [],
    followUpActionsLogged: [],
    themesEmerging: ["Calm morning routine functioning well", "Anna's sensory practice is a strength"],
    positiveStaffPracticeNoted: [
      "Anna's quiet professionalism",
      "Edward's proactive education engagement",
    ],
    followUpDate: d(1),
  },
  {
    id: "wr-002",
    date: d(-1),
    time: "20:30",
    manager: "staff_ryan",
    walkroundType: "Daily",
    durationMinutes: 45,
    areasVisited: ["Lounge", "Kitchen", "Bedrooms (corridor only — respecting privacy)", "Office", "Sensory space"],
    observationsPositive: [
      { area: "Lounge", observation: "Children settled and relaxed; football match on (Jordan's pick)", staffOrChildOrThing: "Whole house" },
      { area: "Sensory space", observation: "Casey using bean bag and weighted blanket; self-initiated", staffOrChildOrThing: "Casey + sensory practice" },
      { area: "Kitchen", observation: "Cooking session with Jordan in progress; cultural meal", staffOrChildOrThing: "Jordan + Chervelle" },
    ],
    observationsForImprovement: [
      { area: "Hallway", observation: "Child's coat on floor — picked up", actionAgreed: "Brief reminder at next children's meeting about communal tidiness" },
    ],
    childInteractions: [
      { childInitial: "Casey", observation: "Self-regulating in sensory space — milestone" },
      { childInitial: "Jordan", observation: "Cooking lead role; clearly proud" },
      { childInitial: "Alex", observation: "Watching match with Jordan; good shared moment" },
    ],
    staffInteractions: [
      { staffMember: "staff_chervelle", observation: "Cultural cooking session — Jordan-led, Chervelle supporting" },
      { staffMember: "staff_lackson", observation: "Sleep-in handover prep done early; calm" },
    ],
    environmentalChecks: [
      { area: "Kitchen during cooking", status: "Good" },
      { area: "Lounge", status: "Good" },
      { area: "Coats/communal tidiness", status: "Action taken in moment" },
    ],
    bookOrRecordReviews: [
      "Reviewed evening medication MAR — accurate",
    ],
    immediateActionsTaken: [
      "Picked up coat in hallway, mentioned at brief check-in",
    ],
    followUpActionsLogged: [
      { action: "Add 'tidy as we go' as agenda item at children's meeting", owner: "staff_anna", deadline: d(7) },
    ],
    themesEmerging: ["Strong evening atmosphere", "Cultural cooking working very well as engagement tool"],
    positiveStaffPracticeNoted: [
      "Chervelle's empowerment of Jordan in cooking",
      "Casey's growing self-regulation",
    ],
    followUpDate: d(0),
  },
  {
    id: "wr-003",
    date: d(-3),
    time: "14:00",
    manager: "staff_darren",
    walkroundType: "Weekly themed",
    durationMinutes: 90,
    areasVisited: ["All bedrooms (with consent)", "All communal areas", "Office", "Records", "Garden", "Kitchen"],
    observationsPositive: [
      { area: "Bedrooms", observation: "Each room visibly the child's — meaningful items, identity", staffOrChildOrThing: "Personalisation working" },
      { area: "Records", observation: "Statutory visits all logged; LAC review prep on track", staffOrChildOrThing: "Edward's record-keeping" },
    ],
    observationsForImprovement: [
      { area: "Garden shed", observation: "Cluttered — sports equipment mixed with maintenance", actionAgreed: "Sort and label this week" },
    ],
    childInteractions: [
      { childInitial: "Alex", observation: "Brief chat about boxing tonight — clearly motivated" },
      { childInitial: "Casey", observation: "Showed me new artwork — proud" },
    ],
    staffInteractions: [
      { staffMember: "staff_edward", observation: "Strong record-keeping noted" },
      { staffMember: "staff_anna", observation: "Reviewed Casey's care plan together — well-aligned" },
    ],
    environmentalChecks: [
      { area: "Bedrooms (3)", status: "Good" },
      { area: "Communal", status: "Good" },
      { area: "Garden shed", status: "Needs attention" },
    ],
    bookOrRecordReviews: [
      "Reviewed last 2 weeks of statutory visits log",
      "Reviewed pre-LAC prep for Alex",
      "Reviewed risk register",
    ],
    immediateActionsTaken: [],
    followUpActionsLogged: [
      { action: "Sort garden shed", owner: "staff_lackson", deadline: d(7) },
    ],
    themesEmerging: ["Personalisation strong across home", "Record-keeping consistent"],
    positiveStaffPracticeNoted: [
      "Edward's attention to records",
      "Anna's care plan craft",
    ],
    followUpDate: d(4),
  },
  {
    id: "wr-004",
    date: d(-7),
    time: "19:00",
    manager: "staff_darren",
    walkroundType: "Unannounced",
    durationMinutes: 30,
    areasVisited: ["Lounge", "Kitchen", "Office"],
    observationsPositive: [
      { area: "Lounge", observation: "Settled; children watching film together", staffOrChildOrThing: "Whole house" },
      { area: "Office", observation: "Anna was making notes from key working session — quiet professional practice", staffOrChildOrThing: "Anna" },
    ],
    observationsForImprovement: [],
    childInteractions: [
      { childInitial: "Jordan", observation: "Brief catch-up about football — relaxed" },
    ],
    staffInteractions: [
      { staffMember: "staff_anna", observation: "Caught Anna doing detailed key working notes — clearly invested" },
    ],
    environmentalChecks: [
      { area: "Cleanliness", status: "Good" },
      { area: "Calm atmosphere", status: "Good" },
    ],
    bookOrRecordReviews: [],
    immediateActionsTaken: [],
    followUpActionsLogged: [],
    themesEmerging: ["Unannounced visit confirms steady-state quality"],
    positiveStaffPracticeNoted: ["Anna's note-taking depth"],
    followUpDate: d(0),
  },
  {
    id: "wr-005",
    date: d(-14),
    time: "10:00",
    manager: "staff_darren",
    walkroundType: "Pre-inspection rehearsal",
    durationMinutes: 120,
    areasVisited: ["Whole home — every room and area"],
    observationsPositive: [
      { area: "Records", observation: "All statutory records up to date; case files audited", staffOrChildOrThing: "Records function" },
      { area: "Environment", observation: "Personalised and warm; no institutional feel", staffOrChildOrThing: "Whole environment" },
      { area: "Atmosphere", observation: "Children visibly settled; staff calm; good interactions", staffOrChildOrThing: "Whole team" },
    ],
    observationsForImprovement: [
      { area: "Statement of Purpose", observation: "Due review", actionAgreed: "Schedule review with whole team" },
    ],
    childInteractions: [
      { childInitial: "All three", observation: "Each child engaged with happily; willing to talk" },
    ],
    staffInteractions: [
      { staffMember: "Whole team", observation: "Calm, professional, child-focused" },
    ],
    environmentalChecks: [
      { area: "Whole home", status: "Good" },
    ],
    bookOrRecordReviews: [
      "Reg 45 report — current",
      "Reg 44 reports — recent positive",
      "All statutory checks within date",
    ],
    immediateActionsTaken: [],
    followUpActionsLogged: [
      { action: "SoP annual review", owner: "staff_darren", deadline: d(30) },
    ],
    themesEmerging: ["Inspection-ready in normal operations — gold standard"],
    positiveStaffPracticeNoted: ["Whole team coherence"],
    followUpDate: d(7),
  },
];

const typeColour: Record<string, string> = {
  Daily: "bg-blue-100 text-blue-800",
  "Weekly themed": "bg-purple-100 text-purple-800",
  Unannounced: "bg-amber-100 text-amber-800",
  "Pre-inspection rehearsal": "bg-emerald-100 text-emerald-800",
  "Post-incident review": "bg-red-100 text-red-800",
};

const exportCols: ExportColumn<Walkround>[] = [
  { header: "Date", accessor: (r: Walkround) => r.date },
  { header: "Time", accessor: (r: Walkround) => r.time },
  { header: "Manager", accessor: (r: Walkround) => getStaffName(r.manager) },
  { header: "Type", accessor: (r: Walkround) => r.walkroundType },
  { header: "Duration", accessor: (r: Walkround) => `${r.durationMinutes}m` },
  { header: "Areas Visited", accessor: (r: Walkround) => r.areasVisited.length.toString() },
  { header: "Positive Observations", accessor: (r: Walkround) => r.observationsPositive.length.toString() },
  { header: "Improvements", accessor: (r: Walkround) => r.observationsForImprovement.length.toString() },
  { header: "Follow-Up Actions", accessor: (r: Walkround) => r.followUpActionsLogged.length.toString() },
];

export default function ManagementWalkroundPage() {
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterType !== "all") items = items.filter((w) => w.walkroundType === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (b.date + b.time).localeCompare(a.date + a.time);
        case "duration":
          return b.durationMinutes - a.durationMinutes;
        default:
          return 0;
      }
    });
    return items;
  }, [filterType, sortBy]);

  const total = data.length;
  const positiveTotal = data.reduce((sum, w) => sum + w.observationsPositive.length, 0);
  const improvementsTotal = data.reduce((sum, w) => sum + w.observationsForImprovement.length, 0);
  const totalActions = data.reduce((sum, w) => sum + w.followUpActionsLogged.length, 0);

  return (
    <PageShell
      title="Management Walkround"
      subtitle="Daily, weekly, and unannounced walkrounds — observation, recognition, and visible leadership"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="management-walkrounds" />
          <PrintButton title="Management Walkround" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{total}</p>
          <p className="text-xs text-muted-foreground">Recent Walkrounds</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{positiveTotal}</p>
          <p className="text-xs text-muted-foreground">Positives Logged</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{improvementsTotal}</p>
          <p className="text-xs text-muted-foreground">Improvements Identified</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{totalActions}</p>
          <p className="text-xs text-muted-foreground">Actions Logged</p>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6 flex items-start gap-2">
        <Eye className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-sm text-emerald-800">
          Visible leadership matters. Daily walkrounds keep the manager in touch with daily life. Weekly
          themed walkrounds focus on records, environment, or specific themes. Unannounced walkrounds
          confirm steady-state quality. Walkrounds always notice the good as well as the gaps.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Daily">Daily</SelectItem>
            <SelectItem value="Weekly themed">Weekly Themed</SelectItem>
            <SelectItem value="Unannounced">Unannounced</SelectItem>
            <SelectItem value="Pre-inspection rehearsal">Pre-Inspection Rehearsal</SelectItem>
            <SelectItem value="Post-incident review">Post-Incident Review</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="duration">Longest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((w) => {
          const isExpanded = expandedId === w.id;

          return (
            <div key={w.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : w.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Eye className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{w.date} {w.time} — {w.walkroundType} ({getStaffName(w.manager)})</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.durationMinutes} mins &middot; {w.areasVisited.length} areas &middot; {w.observationsPositive.length} positives &middot; {w.observationsForImprovement.length} improvements
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", typeColour[w.walkroundType])}>
                    {w.walkroundType}
                  </span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Areas Visited</p>
                    <div className="flex flex-wrap gap-1">
                      {w.areasVisited.map((a, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{a}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-2">
                      <Star className="h-3 w-3 inline mr-1" />Positive Observations
                    </p>
                    <div className="space-y-1">
                      {w.observationsPositive.map((o, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{o.area}: {o.observation}</p>
                          <p className="text-xs text-muted-foreground italic">{o.staffOrChildOrThing}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {w.observationsForImprovement.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />For Improvement
                      </p>
                      <div className="space-y-1">
                        {w.observationsForImprovement.map((o, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{o.area}: {o.observation}</p>
                            <p className="text-xs text-blue-700">Action: {o.actionAgreed}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {w.childInteractions.length > 0 && (
                    <div className="bg-pink-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-2">Child Interactions</p>
                      <div className="space-y-1">
                        {w.childInteractions.map((c, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                            <p className="font-medium">{c.childInitial}</p>
                            <p className="text-xs text-muted-foreground">{c.observation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-2">Staff Interactions</p>
                    <div className="space-y-1">
                      {w.staffInteractions.map((s, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm">
                          <p className="font-medium">{s.staffMember.startsWith("staff_") ? getStaffName(s.staffMember) : s.staffMember}</p>
                          <p className="text-xs text-muted-foreground">{s.observation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Environmental Checks</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {w.environmentalChecks.map((e, i) => (
                        <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between">
                          <span>{e.area}</span>
                          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                            e.status === "Good" ? "bg-green-100 text-green-800" :
                            e.status === "Needs attention" ? "bg-amber-100 text-amber-800" :
                            "bg-blue-100 text-blue-800"
                          )}>
                            {e.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {w.bookOrRecordReviews.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Records Reviewed</p>
                      <ul className="space-y-1">
                        {w.bookOrRecordReviews.map((r, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {w.followUpActionsLogged.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                      <div className="space-y-1">
                        {w.followUpActionsLogged.map((a, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-start justify-between gap-2">
                            <span className="flex-1">{a.action}</span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {getStaffName(a.owner)} &middot; {a.deadline}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {w.themesEmerging.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                        <MessageCircle className="h-3 w-3 inline mr-1" />Themes Emerging
                      </p>
                      <ul className="space-y-1">
                        {w.themesEmerging.map((t, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Clock className="h-3 w-3 inline mr-1" />{w.durationMinutes} mins</span>
                    <span>Manager: {getStaffName(w.manager)}</span>
                    <span>Follow-up: {w.followUpDate}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Management walkrounds support Quality Standard 13 (leadership
          and management — visible leadership), Reg 33 (induction/oversight), and Reg 45 (review of quality
          of care). Linked to Unannounced Visits Log, Reg 44 visits, and Service Improvement Board.
        </p>
      </div>
    </PageShell>
  );
}
