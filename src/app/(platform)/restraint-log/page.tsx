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
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, Calendar,
  Heart, Shield, Users, Eye
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type RestraintType = "standing" | "seated" | "ground" | "escort" | "other";
type RestraintReason = "harm_to_self" | "harm_to_others" | "significant_damage" | "absconding_danger";
type ReviewStatus = "pending_rm" | "pending_ri" | "reviewed" | "referred_lado";

interface RestraintRecord {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // seconds
  youngPersonId: string;
  staffInvolved: { staffId: string; role: string; technique: string }[];
  reason: RestraintReason;
  type: RestraintType;
  antecedent: string;
  behaviour: string;
  deEscalationAttempts: string[];
  justification: string;
  description: string;
  injuries: { person: string; injury: string; treatment: string }[];
  childDebriefed: boolean;
  childDebriefNotes: string;
  staffDebriefed: boolean;
  witnessedBy: string[];
  reviewStatus: ReviewStatus;
  reviewNotes: string;
  reviewedBy: string;
  linkedIncidentId: string;
  notificationsSent: { party: string; date: string }[];
  bodyMapCompleted: boolean;
  medicalCheckCompleted: boolean;
  recordedBy: string;
  createdAt: string;
}

const REASON_META: Record<RestraintReason, string> = {
  harm_to_self:         "Prevent harm to self",
  harm_to_others:       "Prevent harm to others",
  significant_damage:   "Prevent significant damage to property",
  absconding_danger:    "Prevent absconding into danger",
};

const TYPE_META: Record<RestraintType, string> = {
  standing: "Standing", seated: "Seated", ground: "Ground", escort: "Guided Escort", other: "Other",
};

const REVIEW_META: Record<ReviewStatus, { label: string; color: string }> = {
  pending_rm:    { label: "Pending RM Review",  color: "bg-amber-100 text-amber-700" },
  pending_ri:    { label: "Pending RI Review",   color: "bg-purple-100 text-purple-700" },
  reviewed:      { label: "Reviewed",            color: "bg-green-100 text-green-700" },
  referred_lado: { label: "Referred to LADO",   color: "bg-red-100 text-red-700" },
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: RestraintRecord[] = [
  {
    id: "rst_001", date: d(-35), startTime: "16:22", endTime: "16:25", duration: 180,
    youngPersonId: "yp_alex",
    staffInvolved: [
      { staffId: "staff_darren", role: "Lead", technique: "Single-person standing hold" },
      { staffId: "staff_ryan", role: "Support", technique: "Verbal de-escalation" },
    ],
    reason: "harm_to_others", type: "standing",
    antecedent: "Alex had been increasingly agitated after school. A disagreement with Jordan about the TV remote escalated. Alex pushed Jordan and raised fist to strike.",
    behaviour: "Alex pushed Jordan against the sofa and raised fist. Jordan was at risk of being hit. Alex did not respond to verbal intervention.",
    deEscalationAttempts: ["Verbal calm-down requests", "Offered choice to walk away", "Distraction technique attempted", "Space offered — Alex followed Jordan"],
    justification: "Physical intervention was necessary as Alex was about to strike Jordan. All de-escalation strategies had been exhausted. The intervention was proportionate — minimal hold to prevent the strike.",
    description: "Darren positioned behind Alex and applied a single-person standing hold. Alex struggled for approximately 30 seconds then began to calm. Hold maintained for a further 2 minutes with ongoing verbal reassurance. Alex was released when calm and moved to quiet room voluntarily.",
    injuries: [],
    childDebriefed: true, childDebriefNotes: "Alex debriefed 2 hours later. Said 'I was just so angry. I'm sorry I nearly hit Jordan.' Acknowledged the hold was needed to keep everyone safe. No complaints about the hold.",
    staffDebriefed: true, witnessedBy: ["staff_anna"],
    reviewStatus: "reviewed", reviewNotes: "Proportionate and justified. All de-escalation attempted first. Good practice — minimal force used. Body map clear. Alex's behaviour plan updated.", reviewedBy: "staff_darren",
    linkedIncidentId: "inc_001",
    notificationsSent: [
      { party: "Social Worker (Sarah Mitchell)", date: d(-35) },
      { party: "Ofsted", date: d(-35) },
      { party: "Parent/Guardian", date: d(-34) },
    ],
    bodyMapCompleted: true, medicalCheckCompleted: true, recordedBy: "staff_darren", createdAt: d(-35),
  },
  {
    id: "rst_002", date: d(-90), startTime: "19:45", endTime: "19:47", duration: 120,
    youngPersonId: "yp_alex",
    staffInvolved: [
      { staffId: "staff_ryan", role: "Lead", technique: "Guided escort away from area" },
    ],
    reason: "significant_damage", type: "escort",
    antecedent: "Alex became frustrated during a board game and flipped the table. Started kicking the wall and pulling items off shelves.",
    behaviour: "Significant property damage — table overturned, items broken. Alex was escalating and heading towards the TV/electronics area.",
    deEscalationAttempts: ["Calm verbal intervention", "Offered to leave the room", "Offered time out"],
    justification: "Guided escort was proportionate to prevent further significant damage. Alex was heading towards expensive equipment and glass items. Brief intervention — escort to hallway.",
    description: "Ryan guided Alex by the arm away from the living room to the hallway. Alex initially resisted but then walked cooperatively. Total contact time under 2 minutes. Alex went to their room voluntarily afterwards.",
    injuries: [{ person: "Alex", injury: "Small scratch on forearm from broken game piece (pre-existing, not from hold)", treatment: "Cleaned and plaster applied" }],
    childDebriefed: true, childDebriefNotes: "Alex said 'I know I was out of control. I shouldn't have broken things.' No complaints about the escort.",
    staffDebriefed: true, witnessedBy: ["staff_edward"],
    reviewStatus: "reviewed", reviewNotes: "Proportionate. Brief intervention. Alex cooperative once out of the room. Good de-escalation attempted first.", reviewedBy: "staff_darren",
    linkedIncidentId: "",
    notificationsSent: [
      { party: "Social Worker (Sarah Mitchell)", date: d(-90) },
      { party: "Ofsted", date: d(-89) },
    ],
    bodyMapCompleted: true, medicalCheckCompleted: true, recordedBy: "staff_ryan", createdAt: d(-90),
  },
];

const EXPORT_COLS: ExportColumn<RestraintRecord>[] = [
  { header: "ID",              accessor: (r: RestraintRecord) => r.id },
  { header: "Date",            accessor: (r: RestraintRecord) => r.date },
  { header: "Start",           accessor: (r: RestraintRecord) => r.startTime },
  { header: "End",             accessor: (r: RestraintRecord) => r.endTime },
  { header: "Duration (s)",    accessor: (r: RestraintRecord) => String(r.duration) },
  { header: "Young Person",    accessor: (r: RestraintRecord) => getYPName(r.youngPersonId) },
  { header: "Staff",           accessor: (r: RestraintRecord) => r.staffInvolved.map((s: { staffId: string; role: string }) => `${getStaffName(s.staffId)} (${s.role})`).join(", ") },
  { header: "Reason",          accessor: (r: RestraintRecord) => REASON_META[r.reason] },
  { header: "Type",            accessor: (r: RestraintRecord) => TYPE_META[r.type] },
  { header: "De-escalation",   accessor: (r: RestraintRecord) => r.deEscalationAttempts.join("; ") },
  { header: "Description",     accessor: (r: RestraintRecord) => r.description },
  { header: "Injuries",        accessor: (r: RestraintRecord) => r.injuries.length > 0 ? r.injuries.map((inj: { person: string; injury: string }) => `${inj.person}: ${inj.injury}`).join("; ") : "None" },
  { header: "Review Status",   accessor: (r: RestraintRecord) => REVIEW_META[r.reviewStatus].label },
  { header: "Notifications",   accessor: (r: RestraintRecord) => r.notificationsSent.map((n: { party: string; date: string }) => `${n.party} (${n.date})`).join("; ") },
  { header: "Recorded By",     accessor: (r: RestraintRecord) => getStaffName(r.recordedBy) },
];

export default function RestraintLogPage() {
  const [records, setRecords] = useState<RestraintRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.description.toLowerCase().includes(s) || r.antecedent.toLowerCase().includes(s));
    }
    list.sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [records, search, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const last90Days = records.filter((r) => r.date >= d(-90)).length;
    const avgDuration = total > 0 ? Math.round(records.reduce((a, r) => a + r.duration, 0) / total) : 0;
    const pendingReview = records.filter((r) => r.reviewStatus === "pending_rm" || r.reviewStatus === "pending_ri").length;
    return { total, last90Days, avgDuration, pendingReview };
  }, [records]);

  return (
    <PageShell
      title="Restraint Log"
      subtitle="Physical intervention records — Regulation 35 compliance"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Restraint Log" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="restraint-log" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Record Restraint</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Records",    value: stats.total,         icon: <ShieldAlert className="h-4 w-4" />,    color: "text-blue-600" },
            { label: "Last 90 Days",      value: stats.last90Days,    icon: <Calendar className="h-4 w-4" />,       color: "text-purple-600" },
            { label: "Avg Duration",      value: `${stats.avgDuration}s`, icon: <Clock className="h-4 w-4" />,     color: "text-amber-600" },
            { label: "Pending Review",    value: stats.pendingReview, icon: <Eye className="h-4 w-4" />,            color: stats.pendingReview > 0 ? "text-red-600" : "text-green-600" },
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
            <Input placeholder="Search restraint records…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No restraint records found.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const reviewM = REVIEW_META[r.reviewStatus];
            return (
              <Card key={r.id} className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(r.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className="bg-red-100 text-red-800 text-xs">Physical Intervention</Badge>
                        <Badge variant="outline" className="text-xs">{TYPE_META[r.type]}</Badge>
                        <Badge className={cn("text-xs", reviewM.color)}>{reviewM.label}</Badge>
                        {r.injuries.length > 0 && <Badge variant="destructive" className="text-xs">Injury recorded</Badge>}
                      </div>
                      <p className="font-semibold">{getYPName(r.youngPersonId)} — {REASON_META[r.reason]}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{r.date} {r.startTime}–{r.endTime}</span>
                        <span>Duration: {Math.floor(r.duration / 60)}m {r.duration % 60}s</span>
                        <span>Staff: {r.staffInvolved.map((s) => getStaffName(s.staffId)).join(", ")}</span>
                      </div>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div><p className="font-medium text-muted-foreground mb-1">Antecedent</p><p className="text-xs">{r.antecedent}</p></div>
                      <div><p className="font-medium text-muted-foreground mb-1">Behaviour</p><p className="text-xs">{r.behaviour}</p></div>
                      <div>
                        <p className="font-medium text-muted-foreground mb-1">De-escalation Attempts</p>
                        <ul className="space-y-0.5 text-xs">{r.deEscalationAttempts.map((de, i) => <li key={i} className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />{de}</li>)}</ul>
                      </div>
                      <div><p className="font-medium text-muted-foreground mb-1">Justification</p><p className="bg-amber-50 p-2 rounded text-xs text-amber-900">{r.justification}</p></div>
                      <div><p className="font-medium text-muted-foreground mb-1">Description of Intervention</p><p className="text-xs">{r.description}</p></div>

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Staff Involved</p>
                        <div className="space-y-1">{r.staffInvolved.map((s, i) => (
                          <div key={i} className="text-xs flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{getStaffName(s.staffId)}</Badge>
                            <span>Role: {s.role}</span>
                            <span className="text-muted-foreground">Technique: {s.technique}</span>
                          </div>
                        ))}</div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="flex items-center gap-1 text-xs">{r.childDebriefed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}<span>Child debriefed</span></div>
                        <div className="flex items-center gap-1 text-xs">{r.staffDebriefed ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}<span>Staff debriefed</span></div>
                        <div className="flex items-center gap-1 text-xs">{r.bodyMapCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}<span>Body map</span></div>
                        <div className="flex items-center gap-1 text-xs">{r.medicalCheckCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> : <AlertTriangle className="h-3.5 w-3.5 text-red-600" />}<span>Medical check</span></div>
                      </div>

                      {r.childDebriefNotes && (
                        <div><p className="font-medium text-muted-foreground mb-1">Child Debrief</p>
                          <div className="bg-pink-50 p-2 rounded border border-pink-200 italic text-pink-900 text-xs">{r.childDebriefNotes}</div>
                        </div>
                      )}

                      {r.injuries.length > 0 && (
                        <div>
                          <p className="font-medium text-red-700 mb-1">Injuries</p>
                          {r.injuries.map((inj, i) => (
                            <div key={i} className="bg-red-50 p-2 rounded text-xs text-red-900">
                              <span className="font-medium">{inj.person}:</span> {inj.injury} — Treatment: {inj.treatment}
                            </div>
                          ))}
                        </div>
                      )}

                      {r.notificationsSent.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Notifications Sent</p>
                          <div className="space-y-0.5">{r.notificationsSent.map((n, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-green-600" /><span>{n.party}</span><span className="text-muted-foreground">{n.date}</span></div>
                          ))}</div>
                        </div>
                      )}

                      {r.reviewNotes && (
                        <div><p className="font-medium text-muted-foreground mb-1">Review Notes</p><p className="bg-green-50 p-2 rounded text-xs text-green-900">{r.reviewNotes}</p><p className="text-xs text-muted-foreground mt-1">Reviewed by: {getStaffName(r.reviewedBy)}</p></div>
                      )}
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
              Physical interventions must only be used as a last resort when all de-escalation has been exhausted. Under Regulation 35, the Registered Manager must review every use of restraint within 48 hours. Ofsted, the placing authority, and parents/guardians must be notified. Body maps and medical checks are mandatory. Children and staff must be debriefed.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Record Physical Intervention</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" /></div>
              <div><label className="text-sm font-medium">Young Person</label>
                <Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                    <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                    <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Start Time</label><Input type="time" /></div>
              <div><label className="text-sm font-medium">End Time</label><Input type="time" /></div>
            </div>
            <div><label className="text-sm font-medium">Reason</label>
              <Select><SelectTrigger><SelectValue placeholder="Reason" /></SelectTrigger>
                <SelectContent>{Object.entries(REASON_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-sm font-medium">Antecedent</label><Textarea placeholder="What led up to the incident?" rows={2} /></div>
            <div><label className="text-sm font-medium">De-escalation Attempts</label><Textarea placeholder="List all de-escalation attempts (one per line)" rows={2} /></div>
            <div><label className="text-sm font-medium">Description</label><Textarea placeholder="Detailed description of the intervention…" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
