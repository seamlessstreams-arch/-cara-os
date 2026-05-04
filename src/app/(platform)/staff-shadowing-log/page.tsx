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
  Clock,
  AlertTriangle,
  Users,
  Lightbulb,
  Star,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ShadowShift {
  id: string;
  newStaff: string; // name
  newStaffRole: string;
  shadowedBy: string; // experienced staff ID
  date: string;
  shiftType: "Early" | "Late" | "Long day" | "Sleep-in" | "Wake-night" | "Weekend";
  hoursShadowed: number;
  shadowNumber: number; // 1st, 2nd, 3rd shadow shift etc
  totalShadowsRequired: number;
  areasObserved: string[];
  competenciesDemonstrated: string[];
  competenciesDeveloping: string[];
  observerFeedback: string;
  newStaffReflection: string;
  signedOff: boolean;
  readyToWorkSolo: "Yes" | "Not yet" | "Additional shadows needed";
  followUpActions: string[];
  recordedBy: string;
}

const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

const data: ShadowShift[] = [
  {
    id: "ss-001",
    newStaff: "Aaliyah Rahman",
    newStaffRole: "Residential Care Worker (Grade 3)",
    shadowedBy: "staff_anna",
    date: d(-2),
    shiftType: "Long day",
    hoursShadowed: 12,
    shadowNumber: 5,
    totalShadowsRequired: 6,
    areasObserved: [
      "Morning routine support across all 3 young people",
      "Medication administration (observed only — not yet authorised)",
      "Education transport with Casey",
      "Key working session observed (Alex — by invitation)",
      "Incident de-escalation (Jordan)",
      "Evening routine and bedtime support",
    ],
    competenciesDemonstrated: [
      "Calm presence during Jordan's heightened moment",
      "Excellent rapport-building with Casey — sensitive to sensory needs",
      "Followed care plan precisely without prompts",
      "Good handover documentation",
      "Safeguarding concern recognition and reporting",
    ],
    competenciesDeveloping: [
      "Confidence in challenging behaviour situations",
      "Detailed daily log writing — needs more depth in observations",
      "Medication knowledge — not yet competency-checked",
    ],
    observerFeedback: "Aaliyah is showing strong relational skills and natural warmth. Children responded well — Casey particularly. Suggest one more shadow shift focused specifically on lone working scenarios and crisis response, then sign-off for solo working with phone support available.",
    newStaffReflection: "I felt confident with the children. Anna's debrief between shifts was really helpful. I'm aware I need to be more detailed in logs. Looking forward to more practice with the medication policy.",
    signedOff: false,
    readyToWorkSolo: "Additional shadows needed",
    followUpActions: [
      "Sixth shadow shift focused on lone working scenarios — staff_ryan to lead",
      "Medication competency assessment scheduled",
      "Daily log writing workshop attendance",
      "Final sign-off meeting with RM next week",
    ],
    recordedBy: "staff_anna",
  },
  {
    id: "ss-002",
    newStaff: "Aaliyah Rahman",
    newStaffRole: "Residential Care Worker (Grade 3)",
    shadowedBy: "staff_chervelle",
    date: d(-7),
    shiftType: "Sleep-in",
    hoursShadowed: 14,
    shadowNumber: 4,
    totalShadowsRequired: 6,
    areasObserved: [
      "Sleep-in protocol",
      "Night check procedures",
      "Welfare check documentation",
      "Lone working policies during sleep-in",
      "Emergency response simulation",
      "Morning handover to early shift",
    ],
    competenciesDemonstrated: [
      "Followed sleep-in protocol exactly",
      "Conducted welfare checks at correct intervals",
      "Documentation accurate and timely",
      "Stayed calm during simulated emergency response",
    ],
    competenciesDeveloping: [
      "Confidence calling on-call manager — hesitated before contacting",
      "Familiarity with night-time medication needs",
    ],
    observerFeedback: "Solid first sleep-in shadow. Aaliyah took the protocol seriously. Need to reinforce that calling on-call is encouraged not penalised. One more sleep-in shadow recommended before signing off.",
    newStaffReflection: "It felt long. I was nervous about calling on-call but Chervelle reassured me that's the whole point. Welfare check timing felt manageable.",
    signedOff: false,
    readyToWorkSolo: "Not yet",
    followUpActions: [
      "Additional sleep-in shadow scheduled",
      "Confidence-building chat with on-call team",
    ],
    recordedBy: "staff_chervelle",
  },
  {
    id: "ss-003",
    newStaff: "Marcus Okonkwo",
    newStaffRole: "Senior Residential Care Worker (Grade 4)",
    shadowedBy: "staff_ryan",
    date: d(-12),
    shiftType: "Late",
    hoursShadowed: 8,
    shadowNumber: 3,
    totalShadowsRequired: 4,
    areasObserved: [
      "Behaviour management approach (consequence framework)",
      "Restorative conversation with Alex post-incident",
      "Medication administration (Marcus is authorised)",
      "Family contact supervision",
      "Handover to night staff",
    ],
    competenciesDemonstrated: [
      "Confident application of consequence framework",
      "Excellent restorative skills — Alex responded openly",
      "Medication procedures flawless",
      "Strong leadership style — appropriate for senior role",
      "Knows policies thoroughly from prior experience",
    ],
    competenciesDeveloping: [
      "Familiarity with our specific therapeutic care model (TIAR)",
      "Knowledge of children's individual histories",
    ],
    observerFeedback: "Marcus brings significant experience and it shows. Strong fit for senior role. One more shadow recommended to deepen knowledge of children's individual needs, then ready to lead shifts. Will be a real asset.",
    newStaffReflection: "Loved the team dynamic and the way Ryan models the framework. Different from my previous home but I see the value. The children's complexity is more nuanced than I expected — I want to know them better before leading.",
    signedOff: false,
    readyToWorkSolo: "Yes",
    followUpActions: [
      "One more shadow focused on relational depth with each young person",
      "Read all care plans, formulations, and life story summaries before next shift",
      "Sign-off meeting with RM",
    ],
    recordedBy: "staff_ryan",
  },
  {
    id: "ss-004",
    newStaff: "Sofia Martins",
    newStaffRole: "Residential Care Worker (Grade 3)",
    shadowedBy: "staff_edward",
    date: d(-18),
    shiftType: "Early",
    hoursShadowed: 8,
    shadowNumber: 1,
    totalShadowsRequired: 6,
    areasObserved: [
      "Introduction to home routines",
      "Wake-up support with all young people",
      "Breakfast routine and morning preparation",
      "School transport and arrival",
      "First-time observation of relational care model",
    ],
    competenciesDemonstrated: [
      "Warm and respectful introduction to children",
      "Followed staff guidance well",
      "Asked thoughtful questions",
      "Strong values base evident",
    ],
    competenciesDeveloping: [
      "Familiarity with home routines",
      "Confidence in proactive engagement with children",
      "Documentation systems — needs orientation",
    ],
    observerFeedback: "Promising first shadow. Sofia is observant and respectful. Children warmed to her. As expected for first shadow — needs significant ongoing observation and learning. Five more shadows scheduled across different shift types.",
    newStaffReflection: "First shift felt overwhelming with so much to learn but I felt welcomed. Excited to keep learning. The way Edward speaks to the children is what I want my practice to look like.",
    signedOff: false,
    readyToWorkSolo: "Not yet",
    followUpActions: [
      "Five more shadow shifts scheduled across different shift types",
      "Documentation systems training",
      "Read all policies — focus on safeguarding and behaviour",
      "Reflect on first shift in next supervision",
    ],
    recordedBy: "staff_edward",
  },
  {
    id: "ss-005",
    newStaff: "Marcus Okonkwo",
    newStaffRole: "Senior Residential Care Worker (Grade 4)",
    shadowedBy: "staff_darren",
    date: d(-5),
    shiftType: "Long day",
    hoursShadowed: 12,
    shadowNumber: 4,
    totalShadowsRequired: 4,
    areasObserved: [
      "Full shift leadership",
      "Decision-making in real time",
      "Multi-agency phone call (school)",
      "Difficult conversation with parent (with deputy)",
      "End-to-end documentation responsibility",
    ],
    competenciesDemonstrated: [
      "Confident shift leadership",
      "Sound judgement in real-time decisions",
      "Professional handling of multi-agency contact",
      "Excellent documentation across the day",
      "Modelled framework consistently for junior staff",
    ],
    competenciesDeveloping: [
      "Continued depth of relational knowledge with each child (ongoing)",
    ],
    observerFeedback: "Marcus is ready to lead shifts. Demonstrated all required competencies. Sign-off complete. Welcome to the team properly!",
    newStaffReflection: "Feel ready. Grateful for the comprehensive shadowing. Will continue to read formulations and life story work in own time to deepen relational understanding.",
    signedOff: true,
    readyToWorkSolo: "Yes",
    followUpActions: [
      "First solo shift scheduled with phone support",
      "First supervision booked for 2 weeks post-sign-off",
      "Probation review at 12 weeks",
    ],
    recordedBy: "staff_darren",
  },
];

const readyColour: Record<string, string> = {
  "Yes": "bg-green-100 text-green-800",
  "Not yet": "bg-amber-100 text-amber-800",
  "Additional shadows needed": "bg-blue-100 text-blue-800",
};

const exportCols: ExportColumn<ShadowShift>[] = [
  { header: "New Staff", accessor: (r: ShadowShift) => r.newStaff },
  { header: "Role", accessor: (r: ShadowShift) => r.newStaffRole },
  { header: "Shadowed By", accessor: (r: ShadowShift) => getStaffName(r.shadowedBy) },
  { header: "Date", accessor: (r: ShadowShift) => r.date },
  { header: "Shift Type", accessor: (r: ShadowShift) => r.shiftType },
  { header: "Hours", accessor: (r: ShadowShift) => String(r.hoursShadowed) },
  { header: "Shadow Number", accessor: (r: ShadowShift) => `${r.shadowNumber}/${r.totalShadowsRequired}` },
  { header: "Ready Solo", accessor: (r: ShadowShift) => r.readyToWorkSolo },
  { header: "Signed Off", accessor: (r: ShadowShift) => r.signedOff ? "Yes" : "No" },
];

export default function StaffShadowingLogPage() {
  const [filterReady, setFilterReady] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...data];
    if (filterReady !== "all") items = items.filter((s) => s.readyToWorkSolo === filterReady);
    items.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.date.localeCompare(a.date);
        case "name":
          return a.newStaff.localeCompare(b.newStaff);
        case "progress":
          return (b.shadowNumber / b.totalShadowsRequired) - (a.shadowNumber / a.totalShadowsRequired);
        default:
          return 0;
      }
    });
    return items;
  }, [filterReady, sortBy]);

  const totalShifts = data.length;
  const signedOff = data.filter((s) => s.signedOff).length;
  const uniqueStaff = new Set(data.map((s) => s.newStaff)).size;
  const totalHours = data.reduce((sum, s) => sum + s.hoursShadowed, 0);

  return (
    <PageShell
      title="Staff Shadowing Log"
      subtitle="Records of new staff shadowing experienced colleagues during onboarding — supporting safe, supervised induction"
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={data} columns={exportCols} filename="staff-shadowing-log" />
          <PrintButton title="Staff Shadowing Log" />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold">{totalShifts}</p>
          <p className="text-xs text-muted-foreground">Total Shifts Logged</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{signedOff}</p>
          <p className="text-xs text-muted-foreground">Sign-Offs Complete</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{uniqueStaff}</p>
          <p className="text-xs text-muted-foreground">New Staff in Process</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Total Shadow Hours</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-6 flex items-start gap-2">
        <Eye className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          New staff complete a minimum of <strong>4 shadow shifts</strong> (6 for those new to children&apos;s homes
          sector) across different shift types before working solo. Sign-off requires demonstrated competency
          across all core areas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterReady} onValueChange={setFilterReady}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Yes">Ready Solo</SelectItem>
            <SelectItem value="Not yet">Not Yet Ready</SelectItem>
            <SelectItem value="Additional shadows needed">Needs More Shadows</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Most Recent</SelectItem>
              <SelectItem value="name">By New Staff</SelectItem>
              <SelectItem value="progress">By Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((shift) => {
          const isExpanded = expandedId === shift.id;
          const pct = Math.round((shift.shadowNumber / shift.totalShadowsRequired) * 100);

          return (
            <div key={shift.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : shift.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Eye className="h-5 w-5 text-blue-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{shift.newStaff} &middot; Shadow {shift.shadowNumber}/{shift.totalShadowsRequired}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {shift.date} &middot; {shift.shiftType} ({shift.hoursShadowed}h) &middot; with {getStaffName(shift.shadowedBy)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", readyColour[shift.readyToWorkSolo])}>
                    {shift.readyToWorkSolo}
                  </span>
                  <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", pct === 100 ? "bg-green-500" : "bg-blue-500")}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {shift.signedOff && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Areas Observed</p>
                    <ul className="space-y-1">
                      {shift.areasObserved.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-1">
                          <Eye className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-green-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-1">
                        <Star className="h-3 w-3 inline mr-1" />Competencies Demonstrated
                      </p>
                      <ul className="space-y-1">
                        {shift.competenciesDemonstrated.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <CheckCircle className="h-3 w-3 text-green-500 mt-1 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Competencies Developing
                      </p>
                      <ul className="space-y-1">
                        {shift.competenciesDeveloping.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <Clock className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">
                      <Lightbulb className="h-3 w-3 inline mr-1" />Observer Feedback
                    </p>
                    <p className="text-sm text-blue-900">{shift.observerFeedback}</p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-purple-800 uppercase tracking-wide mb-1">New Staff Reflection</p>
                    <p className="text-sm text-purple-900 italic">&ldquo;{shift.newStaffReflection}&rdquo;</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Follow-Up Actions</p>
                    <ul className="space-y-1">
                      {shift.followUpActions.map((a, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Clock className="h-3 w-3 text-blue-500 mt-1 shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span><Users className="h-3 w-3 inline mr-1" />Role: {shift.newStaffRole}</span>
                    <span>Recorded by: {getStaffName(shift.recordedBy)}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      shift.signedOff ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {shift.signedOff ? "Sign-Off Complete" : "Sign-Off Pending"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Shadow shifts support Regulation 32 (fitness of workers),
          Regulation 33 (induction), Quality Standard 13 (leadership and management), and KCSIE 2024 induction
          requirements. Shadow records form part of the staff member&apos;s induction file. New staff cannot
          work solo until competency sign-off is complete.
        </p>
      </div>
    </PageShell>
  );
}
