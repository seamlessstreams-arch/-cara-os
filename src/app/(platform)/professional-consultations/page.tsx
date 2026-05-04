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
  Phone, MessageSquare, Calendar, Clock, Users,
  CheckCircle2, AlertTriangle, FileText, Stethoscope
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type ConsultationType = "camhs" | "social_worker" | "iro" | "lado" | "police" | "gp" | "therapist" | "education" | "legal" | "ofsted" | "other";
type ConsultationMethod = "phone" | "email" | "video" | "in_person" | "written";

interface Consultation {
  id: string;
  date: string;
  time: string;
  type: ConsultationType;
  method: ConsultationMethod;
  professionalName: string;
  professionalRole: string;
  organisation: string;
  youngPersonId: string;
  reason: string;
  adviceGiven: string;
  actionsAgreed: string[];
  followUpRequired: boolean;
  followUpDate: string;
  followUpCompleted: boolean;
  confidential: boolean;
  recordedBy: string;
  createdAt: string;
}

const TYPE_META: Record<ConsultationType, { label: string; color: string }> = {
  camhs:         { label: "CAMHS",              color: "bg-pink-100 text-pink-800" },
  social_worker: { label: "Social Worker",      color: "bg-blue-100 text-blue-800" },
  iro:           { label: "IRO",                color: "bg-purple-100 text-purple-800" },
  lado:          { label: "LADO",               color: "bg-red-100 text-red-800" },
  police:        { label: "Police",             color: "bg-slate-100 text-slate-800" },
  gp:            { label: "GP / Medical",       color: "bg-green-100 text-green-800" },
  therapist:     { label: "Therapist",          color: "bg-rose-100 text-rose-800" },
  education:     { label: "Education / School", color: "bg-indigo-100 text-indigo-800" },
  legal:         { label: "Legal",              color: "bg-amber-100 text-amber-800" },
  ofsted:        { label: "Ofsted",             color: "bg-orange-100 text-orange-800" },
  other:         { label: "Other",              color: "bg-gray-100 text-gray-800" },
};

const METHOD_META: Record<ConsultationMethod, string> = {
  phone: "Phone", email: "Email", video: "Video Call", in_person: "In Person", written: "Written",
};

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: Consultation[] = [
  {
    id: "con_001", date: d(-1), time: "10:30", type: "social_worker", method: "phone",
    professionalName: "Sarah Mitchell", professionalRole: "Social Worker", organisation: "Derby City Council",
    youngPersonId: "yp_alex", reason: "Discussion about college consent — application deadline approaching",
    adviceGiven: "SW confirmed consent will be granted. Paperwork being processed. Advised to proceed with application prep in the meantime.",
    actionsAgreed: ["SW to send written consent by Friday", "Home to support Alex with personal statement"],
    followUpRequired: true, followUpDate: d(3), followUpCompleted: false,
    confidential: false, recordedBy: "staff_darren", createdAt: d(-1),
  },
  {
    id: "con_002", date: d(-3), time: "14:00", type: "camhs", method: "video",
    professionalName: "Dr Anika Patel", professionalRole: "Clinical Psychologist", organisation: "Derbyshire CAMHS",
    youngPersonId: "yp_jordan", reason: "Initial consultation following CAMHS referral for sleep and anxiety",
    adviceGiven: "Assessment completed. CBT sessions recommended weekly for 12 weeks. Sleep hygiene strategies shared. Suggested reducing screen time before bed and implementing consistent wind-down routine.",
    actionsAgreed: ["Begin weekly CBT sessions from next week", "Implement sleep hygiene plan at home", "Review in 6 weeks"],
    followUpRequired: true, followUpDate: d(35), followUpCompleted: false,
    confidential: false, recordedBy: "staff_anna", createdAt: d(-3),
  },
  {
    id: "con_003", date: d(-5), time: "09:15", type: "education", method: "phone",
    professionalName: "Mrs Thompson", professionalRole: "SENCO", organisation: "Derby Academy",
    youngPersonId: "yp_alex", reason: "Update on Alex's behaviour improvement at school",
    adviceGiven: "School very pleased with Alex's progress. Using calming strategies successfully. SENCO recommending Alex for student council. PEP meeting to be arranged.",
    actionsAgreed: ["Arrange PEP meeting within 2 weeks", "Share positive feedback with Alex and SW"],
    followUpRequired: true, followUpDate: d(9), followUpCompleted: false,
    confidential: false, recordedBy: "staff_darren", createdAt: d(-5),
  },
  {
    id: "con_004", date: d(-7), time: "16:45", type: "social_worker", method: "phone",
    professionalName: "David Clarke", professionalRole: "Social Worker", organisation: "Derbyshire County Council",
    youngPersonId: "yp_jordan", reason: "Discussed cancelled contact with mother — pattern of cancellations",
    adviceGiven: "SW to speak directly with mother about commitment to contact. Will consider formal review of contact plan if cancellations continue. Advised home to manage Jordan's expectations sensitively.",
    actionsAgreed: ["SW to contact mother this week", "Home to provide extra emotional support around contact times", "Review contact plan at next LAC review"],
    followUpRequired: true, followUpDate: d(-2), followUpCompleted: true,
    confidential: false, recordedBy: "staff_anna", createdAt: d(-7),
  },
  {
    id: "con_005", date: d(-7), time: "11:00", type: "therapist", method: "in_person",
    professionalName: "Rachel Green", professionalRole: "Art Therapist", organisation: "Derby Therapeutic Services",
    youngPersonId: "yp_casey", reason: "Pre-therapy consultation — preparing for Casey's referral",
    adviceGiven: "Therapist recommended starting with art therapy given Casey's creative strengths. Sessions to be weekly, 50 minutes. Advised home not to probe about previous placement — let Casey share at own pace.",
    actionsAgreed: ["First session booked for next Wednesday", "Home to provide art supplies for between-session work", "Therapist to liaise with key worker after each session"],
    followUpRequired: false, followUpDate: "", followUpCompleted: false,
    confidential: true, recordedBy: "staff_chervelle", createdAt: d(-7),
  },
  {
    id: "con_006", date: d(-10), time: "13:30", type: "gp", method: "phone",
    professionalName: "Dr Singh", professionalRole: "GP", organisation: "Derby Medical Centre",
    youngPersonId: "yp_casey", reason: "Registering Casey with GP and arranging initial health check",
    adviceGiven: "Casey registered. Initial LAC health assessment booked. GP noted no immediate health concerns from referral paperwork. Immunisation records being transferred.",
    actionsAgreed: ["Attend health assessment on booked date", "Bring immunisation records if available"],
    followUpRequired: false, followUpDate: "", followUpCompleted: false,
    confidential: false, recordedBy: "staff_darren", createdAt: d(-10),
  },
  {
    id: "con_007", date: d(-14), time: "10:00", type: "iro", method: "email",
    professionalName: "Jane Andrews", professionalRole: "IRO", organisation: "Derby City Council",
    youngPersonId: "yp_alex", reason: "Pre-meeting consultation ahead of LAC review",
    adviceGiven: "IRO requested update report covering progress, education, wellbeing, and contact. Asked for Alex's views to be gathered before the review. Confirmed review date and attendee list.",
    actionsAgreed: ["Submit RM report 5 days before review", "Gather Alex's views using consultation form", "Confirm attendees"],
    followUpRequired: true, followUpDate: d(-7), followUpCompleted: true,
    confidential: false, recordedBy: "staff_darren", createdAt: d(-14),
  },
  {
    id: "con_008", date: d(-21), time: "15:00", type: "police", method: "phone",
    professionalName: "PC Williams", professionalRole: "Missing Persons Coordinator", organisation: "Derbyshire Police",
    youngPersonId: "", reason: "Routine liaison — updating missing protocols and emergency contact details",
    adviceGiven: "Police confirmed they have up-to-date photos and descriptions for all YP. Reminded of 30-minute reporting threshold. Offered to attend a team meeting to discuss missing protocols.",
    actionsAgreed: ["Update YP photos in police system", "Invite PC Williams to next team meeting"],
    followUpRequired: false, followUpDate: "", followUpCompleted: false,
    confidential: false, recordedBy: "staff_ryan", createdAt: d(-21),
  },
];

const EXPORT_COLS: ExportColumn<Consultation>[] = [
  { header: "ID",              accessor: (r: Consultation) => r.id },
  { header: "Date",            accessor: (r: Consultation) => r.date },
  { header: "Time",            accessor: (r: Consultation) => r.time },
  { header: "Type",            accessor: (r: Consultation) => TYPE_META[r.type].label },
  { header: "Method",          accessor: (r: Consultation) => METHOD_META[r.method] },
  { header: "Professional",    accessor: (r: Consultation) => r.professionalName },
  { header: "Role",            accessor: (r: Consultation) => r.professionalRole },
  { header: "Organisation",    accessor: (r: Consultation) => r.organisation },
  { header: "Young Person",    accessor: (r: Consultation) => r.youngPersonId ? getYPName(r.youngPersonId) : "General" },
  { header: "Reason",          accessor: (r: Consultation) => r.reason },
  { header: "Advice Given",    accessor: (r: Consultation) => r.adviceGiven },
  { header: "Actions",         accessor: (r: Consultation) => r.actionsAgreed.join("; ") },
  { header: "Follow Up",       accessor: (r: Consultation) => r.followUpDate || "—" },
  { header: "Recorded By",     accessor: (r: Consultation) => getStaffName(r.recordedBy) },
];

export default function ProfessionalConsultationsPage() {
  const [records, setRecords] = useState<Consultation[]>(SEED);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [childFilter, setChildFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const children = useMemo(() => {
    const ids = [...new Set(records.filter((r) => r.youngPersonId).map((r) => r.youngPersonId))];
    return ids.map((id) => ({ id, name: getYPName(id) }));
  }, [records]);

  const filtered = useMemo(() => {
    let list = [...records];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter((r) => r.reason.toLowerCase().includes(s) || r.adviceGiven.toLowerCase().includes(s) || r.professionalName.toLowerCase().includes(s));
    }
    if (typeFilter !== "all") list = list.filter((r) => r.type === typeFilter);
    if (childFilter !== "all") list = list.filter((r) => r.youngPersonId === childFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date": return b.date.localeCompare(a.date);
        case "type": return TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label);
        default:     return 0;
      }
    });
    return list;
  }, [records, search, typeFilter, childFilter, sortBy]);

  const stats = useMemo(() => {
    const total = records.length;
    const thisWeek = records.filter((r) => r.date >= d(-7)).length;
    const pendingFollowUp = records.filter((r) => r.followUpRequired && !r.followUpCompleted).length;
    return { total, thisWeek, pendingFollowUp };
  }, [records]);

  return (
    <PageShell
      title="Professional Consultations"
      subtitle="Recording advice, guidance, and discussions with external professionals"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Professional Consultations" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="professional-consultations" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Log Consultation</Button>
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total Consultations", value: stats.total,           icon: <Stethoscope className="h-4 w-4" />,   color: "text-blue-600" },
            { label: "This Week",           value: stats.thisWeek,        icon: <Calendar className="h-4 w-4" />,      color: "text-green-600" },
            { label: "Pending Follow-Up",   value: stats.pendingFollowUp, icon: <AlertTriangle className="h-4 w-4" />, color: "text-amber-600" },
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
            <Input placeholder="Search consultations…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {children.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="type">Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No consultations match your filters.</p>}
          {filtered.map((r) => {
            const open = !!expanded[r.id];
            const typeM = TYPE_META[r.type];
            return (
              <Card key={r.id} className={cn("border-l-4", r.type === "lado" || r.type === "police" ? "border-l-red-400" : r.type === "camhs" || r.type === "therapist" ? "border-l-pink-400" : "border-l-blue-400")}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(r.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", typeM.color)}>{typeM.label}</Badge>
                        <Badge variant="outline" className="text-xs">{METHOD_META[r.method]}</Badge>
                        {r.confidential && <Badge variant="outline" className="text-xs text-red-600 border-red-300">Confidential</Badge>}
                        {r.followUpRequired && !r.followUpCompleted && <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">Follow-up due</Badge>}
                      </div>
                      <p className="font-semibold">{r.professionalName} — {r.professionalRole}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{r.date} at {r.time}</span>
                        <span>{r.organisation}</span>
                        {r.youngPersonId && <span>Re: {getYPName(r.youngPersonId)}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{r.reason}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div><p className="font-medium text-muted-foreground mb-1">Reason for Consultation</p><p>{r.reason}</p></div>
                      <div><p className="font-medium text-muted-foreground mb-1">Advice / Guidance Given</p><p className="bg-blue-50 p-2 rounded text-blue-900 text-xs">{r.adviceGiven}</p></div>
                      {r.actionsAgreed.length > 0 && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Actions Agreed</p>
                          <ul className="list-disc list-inside space-y-0.5 text-xs">{r.actionsAgreed.map((a, i) => <li key={i}>{a}</li>)}</ul>
                        </div>
                      )}
                      {r.followUpRequired && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">Follow-up:</span>
                          <Badge variant="outline" className="text-xs">{r.followUpDate}</Badge>
                          {r.followUpCompleted ? (
                            <Badge className="bg-green-100 text-green-700 text-xs">Completed</Badge>
                          ) : (
                            <Button size="sm" variant="outline" className="text-xs h-6" onClick={() => setRecords((prev) => prev.map((x) => x.id === r.id ? { ...x, followUpCompleted: true } : x))}>Mark Done</Button>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">Recorded by {getStaffName(r.recordedBy)}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              All professional consultations must be recorded promptly. Advice received informs care planning and risk management. Confidential consultations (e.g. LADO) should be restricted to management access. Follow-up actions must be tracked to completion.
            </span>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Professional Consultation</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); setShowNew(false); }} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-sm font-medium">Date</label><Input type="date" /></div>
              <div><label className="text-sm font-medium">Time</label><Input type="time" /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select><SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>{Object.entries(TYPE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Method</label>
                <Select><SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>{Object.entries(METHOD_META).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div><label className="text-sm font-medium">Professional Name</label><Input placeholder="Name of professional" /></div>
            <div><label className="text-sm font-medium">Organisation</label><Input placeholder="Organisation" /></div>
            <div><label className="text-sm font-medium">Reason</label><Textarea placeholder="Why was this consultation sought?" rows={2} /></div>
            <div><label className="text-sm font-medium">Advice Given</label><Textarea placeholder="What advice or guidance was provided?" rows={3} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
