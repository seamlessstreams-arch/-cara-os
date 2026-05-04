"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import {
  ArrowUpDown, ChevronDown, ChevronUp, Plus, Search,
  RefreshCw, AlertTriangle, CheckCircle2, Clock, Calendar,
  Heart, Shield, Users, MessageSquare
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type DebriefType = "post_incident" | "post_restraint" | "critical_event" | "near_miss" | "team_reflection" | "safeguarding";

interface Debrief {
  id: string;
  date: string;
  type: DebriefType;
  linkedIncidentId: string;
  linkedIncidentSummary: string;
  youngPersonId: string;
  staffInvolved: string[];
  facilitatedBy: string;
  whatHappened: string;
  whatWorkedWell: string;
  whatCouldImprove: string;
  staffWellbeing: string;
  childPerspective: string;
  lessonsLearned: string[];
  changesNeeded: string[];
  followUpActions: { action: string; owner: string; completed: boolean }[];
  supportOffered: boolean;
  supportDetails: string;
  createdAt: string;
}

const TYPE_META: Record<DebriefType, { label: string; color: string }> = {
  post_incident:   { label: "Post-Incident",    color: "bg-red-100 text-red-800" },
  post_restraint:  { label: "Post-Restraint",   color: "bg-orange-100 text-orange-800" },
  critical_event:  { label: "Critical Event",   color: "bg-purple-100 text-purple-800" },
  near_miss:       { label: "Near Miss",        color: "bg-amber-100 text-amber-800" },
  team_reflection: { label: "Team Reflection",  color: "bg-blue-100 text-blue-800" },
  safeguarding:    { label: "Safeguarding",     color: "bg-pink-100 text-pink-800" },
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: Debrief[] = [
  {
    id: "db_001", date: d(-5), type: "post_incident", linkedIncidentId: "inc_001",
    linkedIncidentSummary: "Alex became aggressive after school — pushed furniture, shouted at staff",
    youngPersonId: "yp_alex", staffInvolved: ["staff_darren", "staff_ryan"], facilitatedBy: "staff_darren",
    whatHappened: "Alex came home from school angry after an argument with a peer. Escalated when asked to remove shoes — threw them across the hallway, pushed the console table, and shouted aggressively at staff. Staff used PACE approach and de-escalated over 20 minutes.",
    whatWorkedWell: "Staff remained calm throughout. Darren used low tone and positioned himself non-threateningly. Ryan removed other YP from the area without fuss. The 'space and time' approach worked — Alex was able to self-regulate once given room.",
    whatCouldImprove: "Initial interaction could have been better timed — Alex was clearly dysregulated on arrival. Asking about shoes immediately may have added pressure. Better to allow transition time first.",
    staffWellbeing: "Both staff debriefed. Ryan reported feeling confident in the approach. Darren acknowledged it was stressful but manageable. Neither requires further support at this time.",
    childPerspective: "Alex apologised afterwards and said 'I know I shouldn't have done that. I was just so angry about school.' Alex identified the peer argument as the real trigger.",
    lessonsLearned: ["Allow transition time when YP arrives home upset", "Avoid non-essential requests during dysregulation", "PACE approach continues to be effective with Alex"],
    changesNeeded: ["Add 'transition time' to Alex's behaviour support plan", "Brief all staff on avoiding requests during arrival if Alex appears upset"],
    followUpActions: [
      { action: "Update Alex's BSP with transition time guidance", owner: "staff_darren", completed: true },
      { action: "Brief team at next staff meeting", owner: "staff_darren", completed: false },
      { action: "Key work session with Alex about school triggers", owner: "staff_darren", completed: true },
    ],
    supportOffered: true, supportDetails: "Both staff offered supervision support. Ryan declined. Darren discussed in regular supervision.", createdAt: d(-5),
  },
  {
    id: "db_002", date: d(-12), type: "near_miss", linkedIncidentId: "",
    linkedIncidentSummary: "Jordan found near-open window on first floor after lights out",
    youngPersonId: "yp_jordan", staffInvolved: ["staff_edward"], facilitatedBy: "staff_darren",
    whatHappened: "During night checks, Edward found Jordan's bedroom window fully open and Jordan sitting on the windowsill looking outside. Jordan was not attempting to climb out but the window should have been restricted. Investigation revealed the window restrictor had failed.",
    whatWorkedWell: "Night checks caught the issue. Edward approached calmly and didn't startle Jordan. Jordan was cooperative and came inside immediately when asked.",
    whatCouldImprove: "Window restrictors should be checked more regularly as part of H&S schedule. Jordan's room should have been prioritised given absconding risk assessment.",
    staffWellbeing: "Edward was shaken but managed well. Received phone support from RM immediately.",
    childPerspective: "Jordan said 'I just wanted fresh air. I wasn't going to jump or anything.' Seemed genuine — was stargazing.",
    lessonsLearned: ["Window restrictors need monthly checks", "Night staff should have H&S awareness of window risks", "Jordan needs appropriate ventilation options"],
    changesNeeded: ["Repair all window restrictors immediately", "Add window checks to monthly H&S schedule", "Provide Jordan with a desk fan for ventilation"],
    followUpActions: [
      { action: "Replace window restrictors — all bedrooms", owner: "staff_ryan", completed: true },
      { action: "Add to H&S monthly checks", owner: "staff_ryan", completed: true },
      { action: "Buy desk fan for Jordan", owner: "staff_anna", completed: true },
    ],
    supportOffered: true, supportDetails: "Phone debrief with Edward same night. Follow-up in person next day.", createdAt: d(-12),
  },
  {
    id: "db_003", date: d(-8), type: "safeguarding", linkedIncidentId: "",
    linkedIncidentSummary: "Casey disclosed feeling unsafe in previous placement during key work session",
    youngPersonId: "yp_casey", staffInvolved: ["staff_chervelle"], facilitatedBy: "staff_darren",
    whatHappened: "During a key work session about identity, Casey became emotional and disclosed feeling unsafe and ignored in their previous foster placement. Casey did not make specific allegations but described a general sense of being unlistened to and invisible.",
    whatWorkedWell: "Chervelle handled the disclosure excellently — listened without leading, maintained calm, reassured Casey they were believed. Did not probe for details. Recorded verbatim immediately after session. Consulted RM same day.",
    whatCouldImprove: "Nothing significant — the response was textbook. Team reflected on the importance of creating safe spaces where children feel able to disclose.",
    staffWellbeing: "Chervelle found the disclosure emotionally difficult but felt supported by RM response. Received additional supervision the following day.",
    childPerspective: "Casey said 'I feel safe here and I didn't feel safe there. I just wanted someone to know.'",
    lessonsLearned: ["Safe, trusting relationships enable disclosures", "Identity work can open up deeper conversations — staff should be prepared", "Immediate RM consultation is essential"],
    changesNeeded: ["Ensure all staff refresh safeguarding disclosure response training", "Add identity work sessions as a standing agenda item in clinical meetings"],
    followUpActions: [
      { action: "Inform SW of disclosure", owner: "staff_darren", completed: true },
      { action: "Expedite therapy referral", owner: "staff_darren", completed: true },
      { action: "Safeguarding refresher for team", owner: "staff_darren", completed: false },
    ],
    supportOffered: true, supportDetails: "Chervelle received additional supervision. Offered counselling referral — declined but appreciated.", createdAt: d(-8),
  },
  {
    id: "db_004", date: d(-20), type: "team_reflection", linkedIncidentId: "",
    linkedIncidentSummary: "Reflecting on Casey's first two weeks at Oak House",
    youngPersonId: "yp_casey", staffInvolved: ["staff_darren", "staff_ryan", "staff_anna", "staff_chervelle"], facilitatedBy: "staff_darren",
    whatHappened: "Team met to reflect on Casey's first two weeks in placement. Discussed the welcome process, settling-in activities, and how the existing children responded.",
    whatWorkedWell: "Welcome house meeting was excellent. Alex volunteered as buddy — really stepped up. Casey engaged with creative activities from day one. Staff consistency in approach. Key worker relationship forming well.",
    whatCouldImprove: "Initial paperwork was slightly rushed due to short notice. Could have had more preparation time. Casey's room could have been more personalised before arrival.",
    staffWellbeing: "Team feeling positive about Casey's placement. Good energy in the home.",
    childPerspective: "Casey reported feeling welcomed and safe. Alex and Jordan both said they were glad Casey came.",
    lessonsLearned: ["Welcome meetings are invaluable — continue as standard", "Buddy system works well", "Pre-admission room preparation checklist would be useful"],
    changesNeeded: ["Create pre-admission room preparation checklist", "Build in 48-hour prep time for planned admissions where possible"],
    followUpActions: [
      { action: "Create admission prep checklist", owner: "staff_anna", completed: true },
      { action: "Share positive feedback with Casey's SW", owner: "staff_darren", completed: true },
    ],
    supportOffered: false, supportDetails: "", createdAt: d(-20),
  },
];

const EXPORT_COLS: ExportColumn<Debrief>[] = [
  { header: "ID",              accessor: (r: Debrief) => r.id },
  { header: "Date",            accessor: (r: Debrief) => r.date },
  { header: "Type",            accessor: (r: Debrief) => TYPE_META[r.type].label },
  { header: "Incident",        accessor: (r: Debrief) => r.linkedIncidentSummary },
  { header: "Young Person",    accessor: (r: Debrief) => r.youngPersonId ? getYPName(r.youngPersonId) : "—" },
  { header: "Staff Involved",  accessor: (r: Debrief) => r.staffInvolved.map(getStaffName).join(", ") },
  { header: "What Happened",   accessor: (r: Debrief) => r.whatHappened },
  { header: "What Worked",     accessor: (r: Debrief) => r.whatWorkedWell },
  { header: "To Improve",      accessor: (r: Debrief) => r.whatCouldImprove },
  { header: "Lessons",         accessor: (r: Debrief) => r.lessonsLearned.join("; ") },
  { header: "Changes",         accessor: (r: Debrief) => r.changesNeeded.join("; ") },
  { header: "Facilitated By",  accessor: (r: Debrief) => getStaffName(r.facilitatedBy) },
];

export default function DebriefsPage() {
  const [debriefs, setDebriefs] = useState<Debrief[]>(SEED);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...debriefs];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((db) => db.whatHappened.toLowerCase().includes(s) || db.lessonsLearned.some((l) => l.toLowerCase().includes(s)) || db.linkedIncidentSummary.toLowerCase().includes(s));
    }
    if (typeFilter !== "all") list = list.filter((db) => db.type === typeFilter);
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [debriefs, search, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const total = debriefs.length;
    const pendingActions = debriefs.flatMap((db) => db.followUpActions).filter((a) => !a.completed).length;
    const lessonsTotal = debriefs.reduce((a, db) => a + db.lessonsLearned.length, 0);
    return { total, pendingActions, lessonsTotal };
  }, [debriefs]);

  return (
    <PageShell
      title="Debriefs & Reflections"
      subtitle="Post-incident debriefs, team reflections, and lessons learned"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Debriefs & Reflections" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="debriefs" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> New Debrief</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Debriefs",   value: stats.total,          icon: <RefreshCw className="h-4 w-4" />,     color: "text-blue-600" },
            { label: "Pending Actions",   value: stats.pendingActions, icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600" },
            { label: "Lessons Captured",  value: stats.lessonsTotal,   icon: <CheckCircle2 className="h-4 w-4" />,  color: "text-green-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-lg font-bold">{s.value}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search debriefs…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No debriefs match your filters.</p>}
          {filtered.map((db) => {
            const open = !!expanded[db.id];
            const typeM = TYPE_META[db.type];
            const pending = db.followUpActions.filter((a) => !a.completed).length;
            return (
              <Card key={db.id} className={cn("border-l-4", db.type === "post_restraint" || db.type === "post_incident" ? "border-l-red-400" : db.type === "safeguarding" ? "border-l-pink-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(db.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
                        {pending > 0 && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">{pending} pending</Badge>}
                        {db.supportOffered && <Badge variant="outline" className="text-xs text-green-600 border-green-300">Support offered</Badge>}
                      </div>
                      <p className="font-semibold">{db.linkedIncidentSummary}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{db.date}</span>
                        {db.youngPersonId && <span>Re: {getYPName(db.youngPersonId)}</span>}
                        <span>Staff: {db.staffInvolved.map(getStaffName).join(", ")}</span>
                        <span>{db.lessonsLearned.length} lessons</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div><p className="font-medium text-muted-foreground mb-1">What Happened</p><p className="text-xs">{db.whatHappened}</p></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="font-medium text-green-800 text-xs mb-1">What Worked Well</p>
                          <p className="text-xs text-green-900">{db.whatWorkedWell}</p>
                        </div>
                        <div className="bg-amber-50 p-3 rounded-lg">
                          <p className="font-medium text-amber-800 text-xs mb-1">What Could Improve</p>
                          <p className="text-xs text-amber-900">{db.whatCouldImprove}</p>
                        </div>
                      </div>
                      {db.childPerspective && (
                        <div><p className="font-medium text-muted-foreground mb-1">Child&apos;s Perspective</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{db.childPerspective}</div>
                        </div>
                      )}
                      <div><p className="font-medium text-muted-foreground mb-1">Staff Wellbeing</p>
                        <div className="bg-blue-50 p-2 rounded text-xs text-blue-900 flex items-start gap-1"><Heart className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-blue-500" />{db.staffWellbeing}</div>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Lessons Learned</p>
                        <ul className="space-y-0.5 text-xs">{db.lessonsLearned.map((l, i) => <li key={i} className="flex items-start gap-1"><CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />{l}</li>)}</ul>
                      </div>
                      {db.changesNeeded.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Changes Needed</p>
                          <ul className="space-y-0.5 text-xs">{db.changesNeeded.map((c, i) => <li key={i} className="flex items-start gap-1"><AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 flex-shrink-0" />{c}</li>)}</ul>
                        </div>
                      )}
                      {db.followUpActions.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Follow-Up Actions</p>
                          <div className="space-y-1">{db.followUpActions.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              {a.completed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <Clock className="h-3.5 w-3.5 text-amber-600" />}
                              <span className={a.completed ? "line-through text-muted-foreground" : ""}>{a.action}</span>
                              <span className="text-muted-foreground">({getStaffName(a.owner)})</span>
                            </div>
                          ))}</div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Facilitated by {getStaffName(db.facilitatedBy)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              Post-incident debriefs should take place within 72 hours. Staff wellbeing must be considered and support offered. The child&apos;s perspective must be recorded. Lessons learned should inform practice changes and be shared with the wider team. Post-restraint debriefs are mandatory under Regulation 35.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Debrief</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" /></div>
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">What Happened</label><Textarea placeholder="Describe the incident or event…" rows={3} /></div>
            <div><label className="text-sm font-medium">What Worked Well</label><Textarea placeholder="Positive aspects of the response…" rows={2} /></div>
            <div><label className="text-sm font-medium">What Could Improve</label><Textarea placeholder="Areas for improvement…" rows={2} /></div>
            <div><label className="text-sm font-medium">Lessons Learned</label><Textarea placeholder="Key lessons (one per line)" rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Debrief</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
