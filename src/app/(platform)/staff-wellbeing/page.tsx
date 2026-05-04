"use client";

import { useState, useMemo } from "react";
import {
  HeartPulse, Plus, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Smile, Meh, Frown,
  Shield, Clock,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const CHECK_TYPES = [
  "monthly_checkin", "post_incident", "supervision_wellbeing",
  "return_from_absence", "self_referral", "manager_concern",
] as const;
type CheckType = typeof CHECK_TYPES[number];
const TYPE_LABELS: Record<CheckType, string> = {
  monthly_checkin: "Monthly Check-in", post_incident: "Post-Incident",
  supervision_wellbeing: "Supervision Wellbeing", return_from_absence: "Return from Absence",
  self_referral: "Self-Referral", manager_concern: "Manager Concern",
};

const WELLBEING_SCORES = [1, 2, 3, 4, 5] as const;
const SCORE_LABELS = ["Very Low", "Low", "Moderate", "Good", "Excellent"];
const SCORE_COLORS = [
  "bg-red-100 text-red-800", "bg-orange-100 text-orange-800",
  "bg-yellow-100 text-yellow-800", "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
];

interface WellbeingCheck {
  id: string;
  staffId: string;
  date: string;
  type: CheckType;
  overallScore: number; // 1-5
  workloadScore: number;
  supportScore: number;
  moralScore: number;
  stressors: string[];
  positives: string[];
  supportNeeded: string;
  actionAgreed: string;
  followUpDate: string | null;
  conductedBy: string;
  confidential: boolean;
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: WellbeingCheck[] = [
  {
    id: "wb_1", staffId: "staff_anna", date: d(-3), type: "monthly_checkin",
    overallScore: 4, workloadScore: 3, supportScore: 5, moralScore: 4,
    stressors: ["Alex's education attendance — feeling responsible", "Workload around PEP meetings"],
    positives: ["Strong team support", "Jordan's positive feedback", "Good relationship with all YP"],
    supportNeeded: "Admin support for PEP documentation",
    actionAgreed: "RM to review PEP admin process — consider template simplification. Anna to attend resilience training next month.",
    followUpDate: d(27), conductedBy: "staff_darren", confidential: false,
    notes: "Anna is doing well overall. Slight concern about taking on too much responsibility for Alex's attendance — reminded this is a shared team responsibility.",
  },
  {
    id: "wb_2", staffId: "staff_edward", date: d(-5), type: "post_incident",
    overallScore: 3, workloadScore: 3, supportScore: 4, moralScore: 3,
    stressors: ["Restraint incident with Alex — physically and emotionally draining", "Worry about Alex's wellbeing"],
    positives: ["Team handled incident well together", "Felt supported by RM in immediate aftermath"],
    supportNeeded: "Debrief with team. Reassurance about restraint appropriateness.",
    actionAgreed: "Team debrief scheduled. Edward confirmed restraint was proportionate and well-managed. External support line number provided. Follow-up in 2 weeks.",
    followUpDate: d(9), conductedBy: "staff_darren", confidential: false,
    notes: "Edward was shaken by the restraint but processed it well. Confirmed he acted appropriately. Monitoring for any delayed impact.",
  },
  {
    id: "wb_3", staffId: "staff_chervelle", date: d(-7), type: "monthly_checkin",
    overallScore: 5, workloadScore: 4, supportScore: 5, moralScore: 5,
    stressors: ["None significant at present"],
    positives: ["Casey's mother sent thank-you card", "Enjoying key work sessions", "Team cohesion strong"],
    supportNeeded: "None at present — happy and well-supported",
    actionAgreed: "Continue current support. Chervelle interested in additional therapeutic training — RM to investigate options.",
    followUpDate: null, conductedBy: "staff_darren", confidential: false,
    notes: "Chervelle is thriving. High morale, strong relationships with YP and team. Keen to develop skills further — positive sign.",
  },
  {
    id: "wb_4", staffId: "staff_ryan", date: d(-10), type: "monthly_checkin",
    overallScore: 4, workloadScore: 3, supportScore: 4, moralScore: 4,
    stressors: ["Deputy role can feel stretched when RM on leave", "Maintenance backlog"],
    positives: ["Good working relationship with RM", "Enjoys problem-solving aspects of the role", "Team respect"],
    supportNeeded: "Clarity on delegated authority when RM absent. More budget for maintenance issues.",
    actionAgreed: "Written delegation framework to be created. Maintenance priorities reviewed — emergency fund discussed. Ryan to attend leadership development workshop in June.",
    followUpDate: d(20), conductedBy: "staff_darren", confidential: false,
    notes: "Ryan manages the deputy responsibilities well. Needs clearer structures when RM is absent to reduce anxiety. Leadership development will help.",
  },
  {
    id: "wb_5", staffId: "staff_mirela", date: d(-2), type: "post_incident",
    overallScore: 3, workloadScore: 4, supportScore: 4, moralScore: 3,
    stressors: ["Casey's anxiety episode was distressing to witness", "A&E visit was lengthy and tiring", "Personal worry about Casey"],
    positives: ["Felt hospital staff were responsive", "Casey's mother was supportive and grateful"],
    supportNeeded: "Debrief about the incident. Reassurance about actions taken.",
    actionAgreed: "Debrief completed with RM. Mirela confirmed she followed correct protocols. Support line details shared. Follow-up in 1 week.",
    followUpDate: d(5), conductedBy: "staff_darren", confidential: false,
    notes: "Mirela was understandably affected by Casey's acute anxiety episode. Handled it professionally. Important to check in at follow-up.",
  },
  {
    id: "wb_6", staffId: "staff_diane", date: d(-14), type: "monthly_checkin",
    overallScore: 4, workloadScore: 4, supportScore: 4, moralScore: 4,
    stressors: ["Early starts for sleep-in recovery can be tiring"],
    positives: ["Enjoys night shifts — finds them rewarding when quiet", "Good rapport with young people in mornings"],
    supportNeeded: "Consideration of sleep-in frequency — current pattern is fine but don't want to increase",
    actionAgreed: "Sleep-in rota to remain as current frequency. Diane's preference noted and respected.",
    followUpDate: null, conductedBy: "staff_darren", confidential: false,
    notes: "Diane is steady and reliable. No concerns. Good to have noted her preference on sleep-in frequency.",
  },
  {
    id: "wb_7", staffId: "staff_lackson", date: d(-12), type: "monthly_checkin",
    overallScore: 4, workloadScore: 4, supportScore: 4, moralScore: 5,
    stressors: ["Occasional challenging behaviour from Alex — manages well but can be draining"],
    positives: ["Brilliant relationship with Jordan — football sessions are a highlight", "Feels valued by the team"],
    supportNeeded: "Additional behaviour management training refresh",
    actionAgreed: "Team-teach refresher booked for next quarter. Lackson to mentor new staff on activity planning.",
    followUpDate: null, conductedBy: "staff_darren", confidential: false,
    notes: "Lackson brings positive energy to the team. His relationship with Jordan through sport is excellent. Good mentor potential.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function StaffWellbeingPage() {
  const [checks] = useState<WellbeingCheck[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...checks];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          getStaffName(c.staffId).toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q) ||
          c.stressors.some((s) => s.toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") list = list.filter((c) => c.type === filterType);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "score": return a.overallScore - b.overallScore;
        case "staff": return getStaffName(a.staffId).localeCompare(getStaffName(b.staffId));
        default: return 0;
      }
    });
    return list;
  }, [checks, search, filterType, sortBy]);

  const total = checks.length;
  const avgScore = checks.length > 0 ? (checks.reduce((s, c) => s + c.overallScore, 0) / checks.length).toFixed(1) : "—";
  const lowScores = checks.filter((c) => c.overallScore <= 2).length;
  const pendingFollowUp = checks.filter((c) => c.followUpDate && c.followUpDate <= today).length;

  const ScoreIcon = ({ score }: { score: number }) => {
    if (score >= 4) return <Smile className="h-4 w-4 text-green-600" />;
    if (score === 3) return <Meh className="h-4 w-4 text-yellow-600" />;
    return <Frown className="h-4 w-4 text-red-600" />;
  };

  const exportCols: ExportColumn<WellbeingCheck>[] = [
    { header: "ID", accessor: (r: WellbeingCheck) => r.id },
    { header: "Staff", accessor: (r: WellbeingCheck) => getStaffName(r.staffId) },
    { header: "Date", accessor: (r: WellbeingCheck) => r.date },
    { header: "Type", accessor: (r: WellbeingCheck) => TYPE_LABELS[r.type] },
    { header: "Overall Score", accessor: (r: WellbeingCheck) => `${r.overallScore}/5` },
    { header: "Workload", accessor: (r: WellbeingCheck) => `${r.workloadScore}/5` },
    { header: "Support", accessor: (r: WellbeingCheck) => `${r.supportScore}/5` },
    { header: "Morale", accessor: (r: WellbeingCheck) => `${r.moralScore}/5` },
    { header: "Stressors", accessor: (r: WellbeingCheck) => r.stressors.join("; ") },
    { header: "Positives", accessor: (r: WellbeingCheck) => r.positives.join("; ") },
    { header: "Support Needed", accessor: (r: WellbeingCheck) => r.supportNeeded },
    { header: "Action Agreed", accessor: (r: WellbeingCheck) => r.actionAgreed },
    { header: "Follow-Up", accessor: (r: WellbeingCheck) => r.followUpDate ?? "N/A" },
    { header: "Conducted By", accessor: (r: WellbeingCheck) => getStaffName(r.conductedBy) },
  ];

  return (
    <PageShell
      title="Staff Wellbeing"
      subtitle="Monitor and support the emotional health and resilience of the team"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Staff Wellbeing" />
          <ExportButton data={filtered} columns={exportCols} filename="staff-wellbeing" />
          <Button onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Check-in
          </Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Check-ins", value: total, icon: HeartPulse, colour: "text-pink-600" },
            { label: "Avg. Score", value: `${avgScore}/5`, icon: TrendingUp, colour: "text-blue-600" },
            { label: "Low Scores (≤2)", value: lowScores, icon: AlertTriangle, colour: lowScores > 0 ? "text-red-600" : "text-green-600" },
            { label: "Follow-ups Due", value: pendingFollowUp, icon: Clock, colour: pendingFollowUp > 0 ? "text-orange-600" : "text-slate-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
              <s.icon className={cn("h-5 w-5", s.colour)} />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-bold">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── alerts ────────────────────────────────────────────── */}
        {lowScores > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{lowScores}</strong> staff member(s) reported low wellbeing — ensure follow-up support is in place.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff, stressors, notes…"
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
                {CHECK_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date (Recent)</SelectItem>
                <SelectItem value="score">Score (Low→High)</SelectItem>
                <SelectItem value="staff">Staff Name</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── list ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No check-ins match your filters.</div>
          )}
          {filtered.map((check) => {
            const isExpanded = expanded === check.id;
            return (
              <div key={check.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : check.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <ScoreIcon score={check.overallScore} />
                    <div className="min-w-0">
                      <p className="font-medium">{getStaffName(check.staffId)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {check.date} · {TYPE_LABELS[check.type]}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.followUpDate && check.followUpDate <= today && (
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Follow-up Due</Badge>
                    )}
                    <Badge className={cn("text-xs", SCORE_COLORS[check.overallScore - 1])}>
                      {check.overallScore}/5 — {SCORE_LABELS[check.overallScore - 1]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* scores breakdown */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { label: "Workload", score: check.workloadScore },
                        { label: "Support", score: check.supportScore },
                        { label: "Morale", score: check.moralScore },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border bg-white p-3 text-center">
                          <p className="text-xs text-muted-foreground">{s.label}</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className="text-lg font-bold">{s.score}</span>
                            <span className="text-xs text-muted-foreground">/5</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div
                              className={cn("h-1.5 rounded-full",
                                s.score >= 4 ? "bg-green-500" : s.score === 3 ? "bg-yellow-500" : "bg-red-500"
                              )}
                              style={{ width: `${(s.score / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* stressors & positives */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-xs font-medium text-red-700 mb-2">Stressors</p>
                        <ul className="space-y-1">
                          {check.stressors.map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 shrink-0" />
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-medium text-green-700 mb-2">Positives</p>
                        <ul className="space-y-1">
                          {check.positives.map((p: string, i: number) => (
                            <li key={i} className="flex items-start gap-1 text-sm">
                              <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              <span>{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-medium text-blue-700 mb-1">Support Needed</p>
                      <p className="text-sm">{check.supportNeeded}</p>
                    </div>

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                      <p className="text-xs font-medium text-amber-700 mb-1">Action Agreed</p>
                      <p className="text-sm">{check.actionAgreed}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Conducted By:</span> <span className="font-medium">{getStaffName(check.conductedBy)}</span></div>
                      {check.followUpDate && (
                        <div><span className="text-muted-foreground">Follow-Up:</span> <span className={cn("font-medium", check.followUpDate <= today && "text-orange-600")}>{check.followUpDate}</span></div>
                      )}
                      <div><span className="text-muted-foreground">Confidential:</span> <span className="font-medium">{check.confidential ? "Yes" : "No"}</span></div>
                    </div>

                    {check.notes && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Manager Notes</p>
                        <p className="text-sm">{check.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Staff Welfare:</strong> Regulation 33 requires the registered person to ensure staff
          are supported in their roles. Regular wellbeing checks, post-incident support, and access to
          counselling services are essential. Staff wellbeing directly impacts the quality of care provided
          to children. All wellbeing records are confidential and stored securely.
        </div>
      </div>

      {/* ── placeholder dialog ──────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Wellbeing Check-in</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center text-muted-foreground text-sm">
            <HeartPulse className="h-10 w-10 mx-auto mb-3 text-pink-300" />
            <p>Full form will capture wellbeing scores, stressors,</p>
            <p>positives, support needs, and agreed actions.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
