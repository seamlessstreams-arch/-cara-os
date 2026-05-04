"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle2, Clock, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ContactType = "phone_call" | "email" | "visit" | "lac_review" | "video_call" | "text" | "unplanned" | "statutory_visit";
type Direction = "incoming" | "outgoing";
type Urgency = "routine" | "urgent" | "emergency";

interface ActionItem { action: string; owner: string; dueDate: string; status: "pending" | "completed" | "overdue" }

interface SocialWorkerContact {
  id: string;
  youngPersonId: string;
  socialWorkerName: string;
  socialWorkerTeam: string;
  socialWorkerEmail: string;
  socialWorkerPhone: string;
  date: string;
  time: string;
  contactType: ContactType;
  direction: Direction;
  initiatedBy: "home" | "social_worker" | "other";
  staffMember: string;
  purpose: string;
  summary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
  childAware: boolean;
  childViews: string;
  followUpRequired: boolean;
  followUpDate: string | null;
  documentsShared: string[];
  urgency: Urgency;
  outcome: string;
  nextScheduledContact: string | null;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CT_LABEL: Record<ContactType, string> = {
  phone_call: "Phone Call", email: "Email", visit: "Visit", lac_review: "LAC Review",
  video_call: "Video Call", text: "Text", unplanned: "Unplanned", statutory_visit: "Statutory Visit",
};
const CT_CLR: Record<ContactType, string> = {
  phone_call: "bg-blue-100 text-blue-800", email: "bg-gray-100 text-gray-800",
  visit: "bg-green-100 text-green-800", lac_review: "bg-purple-100 text-purple-800",
  video_call: "bg-indigo-100 text-indigo-800", text: "bg-slate-100 text-slate-800",
  unplanned: "bg-amber-100 text-amber-800", statutory_visit: "bg-emerald-100 text-emerald-800",
};
const DIR_CLR: Record<Direction, string> = { incoming: "bg-teal-100 text-teal-800", outgoing: "bg-sky-100 text-sky-800" };
const URG_CLR: Record<Urgency, string> = { routine: "bg-gray-100 text-gray-800", urgent: "bg-amber-100 text-amber-800", emergency: "bg-red-100 text-red-800" };

/* social worker directory per child */
const SW_DIR: Record<string, { name: string; team: string; email: string; phone: string }> = {
  yp_alex: { name: "Karen Holding", team: "Millbrook Children's Services", email: "karen.holding@millbrook.gov.uk", phone: "01onal 778 2341" },
  yp_jordan: { name: "Michael Osei", team: "Fairfield MASH Team", email: "michael.osei@fairfield.gov.uk", phone: "01onal 445 9821" },
  yp_casey: { name: "Fiona Brennan", team: "Southgate Child Protection", email: "fiona.brennan@southgate.gov.uk", phone: "01onal 332 7765" },
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SocialWorkerContact[] = [
  {
    id: "swc1", youngPersonId: "yp_alex",
    ...SW_DIR.yp_alex, socialWorkerName: SW_DIR.yp_alex.name, socialWorkerTeam: SW_DIR.yp_alex.team,
    socialWorkerEmail: SW_DIR.yp_alex.email, socialWorkerPhone: SW_DIR.yp_alex.phone,
    date: d(-7), time: "10:30", contactType: "phone_call", direction: "outgoing",
    initiatedBy: "home", staffMember: "staff_darren", purpose: "Weekly update call",
    summary: "Discussed Alex's improved school attendance this week — 100% attendance for the first time. Positive feedback from teachers about engagement in English and Science. Upcoming LAC review booked for next month. Karen confirmed she will attend in person.",
    keyDecisions: ["LAC review confirmed for next month", "Karen to request updated PEP from school"],
    actionItems: [
      { action: "Send updated care plan to Karen ahead of LAC review", owner: "staff_darren", dueDate: d(7), status: "pending" },
      { action: "Chase PEP from school", owner: "staff_anna", dueDate: d(5), status: "completed" },
    ],
    childAware: true, childViews: "Alex knows about the call and asked if Karen would visit soon. Said he wants to talk to her about getting a new bike.",
    followUpRequired: false, followUpDate: null, documentsShared: [],
    urgency: "routine", outcome: "Positive update. All on track for LAC review.",
    nextScheduledContact: d(7),
  },
  {
    id: "swc2", youngPersonId: "yp_jordan",
    socialWorkerName: "Michael Osei", socialWorkerTeam: "Fairfield MASH Team",
    socialWorkerEmail: "michael.osei@fairfield.gov.uk", socialWorkerPhone: "01onal 445 9821",
    date: d(-5), time: "14:00", contactType: "statutory_visit", direction: "incoming",
    initiatedBy: "social_worker", staffMember: "staff_darren", purpose: "Statutory visit — Reg 28",
    summary: "Michael visited for statutory visit. Spent 45 minutes with Jordan privately in the lounge. Jordan showed Michael his bedroom and artwork. Discussed medication changes with staff — Concerta XL increased to 36mg, no adverse effects noted. Michael satisfied with care provided.",
    keyDecisions: ["Michael happy with placement", "Will request CAMHS appointment review"],
    actionItems: [
      { action: "Send latest medication review notes to Michael", owner: "staff_ryan", dueDate: d(-2), status: "completed" },
    ],
    childAware: true, childViews: "Jordan was pleased to see Michael. Showed him around proudly. Said he feels settled and likes living here. Asked Michael about summer holiday plans.",
    followUpRequired: false, followUpDate: null, documentsShared: ["Medication review notes"],
    urgency: "routine", outcome: "Successful statutory visit. Jordan presenting well.",
    nextScheduledContact: d(21),
  },
  {
    id: "swc3", youngPersonId: "yp_casey",
    socialWorkerName: "Fiona Brennan", socialWorkerTeam: "Southgate Child Protection",
    socialWorkerEmail: "fiona.brennan@southgate.gov.uk", socialWorkerPhone: "01onal 332 7765",
    date: d(-3), time: "09:15", contactType: "phone_call", direction: "incoming",
    initiatedBy: "social_worker", staffMember: "staff_ryan", purpose: "Urgent — contact arrangement changes",
    summary: "Fiona called urgently regarding Casey's contact arrangements. Birth mother has made threats towards grandmother at a recent supervised contact session. Fiona has suspended all direct contact with mother pending safety assessment. Indirect contact (letters only) to continue. Casey to be informed sensitively by key worker with Fiona present via video call.",
    keyDecisions: [
      "Direct contact with birth mother suspended immediately",
      "Indirect contact (letters only) to continue",
      "Casey to be told via video call with Fiona present",
    ],
    actionItems: [
      { action: "Arrange video call with Casey and Fiona to explain changes", owner: "staff_darren", dueDate: d(-1), status: "completed" },
      { action: "Update contact plan and circulate to all staff", owner: "staff_ryan", dueDate: d(-2), status: "completed" },
    ],
    childAware: false, childViews: "Casey not yet informed at time of call. Will be told sensitively with SW present.",
    followUpRequired: true, followUpDate: d(3), documentsShared: [],
    urgency: "emergency", outcome: "Contact suspended. Safety plan activated. Casey informed the following day with Fiona on video call — was upset but understood.",
    nextScheduledContact: d(3),
  },
  {
    id: "swc4", youngPersonId: "yp_alex",
    socialWorkerName: "Karen Holding", socialWorkerTeam: "Millbrook Children's Services",
    socialWorkerEmail: "karen.holding@millbrook.gov.uk", socialWorkerPhone: "01onal 778 2341",
    date: d(-10), time: "16:00", contactType: "email", direction: "outgoing",
    initiatedBy: "home", staffMember: "staff_anna", purpose: "Monthly progress report",
    summary: "Emailed Karen the monthly progress report for Alex covering behaviour, education, health, and social development. Attached school report and updated health assessment.",
    keyDecisions: [],
    actionItems: [],
    childAware: false, childViews: "",
    followUpRequired: false, followUpDate: null,
    documentsShared: ["Monthly Progress Report — April", "School Report — Spring Term"],
    urgency: "routine", outcome: "Karen acknowledged receipt and said report was thorough.",
    nextScheduledContact: d(-7),
  },
  {
    id: "swc5", youngPersonId: "yp_jordan",
    socialWorkerName: "Michael Osei", socialWorkerTeam: "Fairfield MASH Team",
    socialWorkerEmail: "michael.osei@fairfield.gov.uk", socialWorkerPhone: "01onal 445 9821",
    date: d(-2), time: "11:00", contactType: "video_call", direction: "outgoing",
    initiatedBy: "home", staffMember: "staff_darren", purpose: "LAC review preparation",
    summary: "Video call with Michael to prepare for Jordan's upcoming LAC review. Discussed Jordan's progress against outcome targets, particularly around emotional regulation and peer relationships. Jordan joined for the first 15 minutes and shared his views directly with Michael — said he wants to stay at Oak House and would like to join a football club.",
    keyDecisions: [
      "Jordan's views to be formally recorded in LAC review paperwork",
      "Football club referral to be explored",
      "Jordan to chair his own LAC review (with support)",
    ],
    actionItems: [
      { action: "Complete LAC review consultation form with Jordan", owner: "staff_ryan", dueDate: d(3), status: "pending" },
      { action: "Research local football clubs with SEN-friendly sessions", owner: "staff_anna", dueDate: d(5), status: "pending" },
      { action: "Draft outcome report for LAC review", owner: "staff_darren", dueDate: d(7), status: "pending" },
    ],
    childAware: true, childViews: "Jordan was happy to join the call. Said he wants to stay here because 'the food is good and Ryan is funny.' Wants to join a football team. Nervous about chairing his review but willing to try.",
    followUpRequired: true, followUpDate: d(7), documentsShared: [],
    urgency: "routine", outcome: "Good prep session. Jordan engaged well. LAC review on track.",
    nextScheduledContact: d(14),
  },
  {
    id: "swc6", youngPersonId: "yp_casey",
    socialWorkerName: "Fiona Brennan", socialWorkerTeam: "Southgate Child Protection",
    socialWorkerEmail: "fiona.brennan@southgate.gov.uk", socialWorkerPhone: "01onal 332 7765",
    date: d(-1), time: "15:30", contactType: "unplanned", direction: "incoming",
    initiatedBy: "social_worker", staffMember: "staff_darren", purpose: "Change of social worker notification",
    summary: "Fiona called to inform us that she is being promoted and will be leaving the team in 3 weeks. Casey's case will be transferred to a new social worker — Priya Kapoor. Handover period will be 2 weeks with a joint visit planned. Fiona will introduce Priya to Casey in person before handover.",
    keyDecisions: ["New SW: Priya Kapoor", "Joint introductory visit to be arranged", "Fiona to complete all outstanding paperwork before handover"],
    actionItems: [
      { action: "Inform Casey about SW change — sensitively, given attachment history", owner: "staff_darren", dueDate: d(2), status: "pending" },
      { action: "Prepare transition document for new SW", owner: "staff_darren", dueDate: d(10), status: "pending" },
    ],
    childAware: false, childViews: "Casey not yet informed. Given Casey's attachment difficulties, this needs to be handled very carefully with therapeutic support.",
    followUpRequired: true, followUpDate: d(5), documentsShared: [],
    urgency: "urgent", outcome: "Transition planned. Key concern is Casey's response given attachment profile.",
    nextScheduledContact: d(5),
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function SocialWorkerContactPage() {
  const [data] = useState<SocialWorkerContact[]>(SEED);
  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) { const s = search.toLowerCase(); out = out.filter(r => getYPName(r.youngPersonId).toLowerCase().includes(s) || r.socialWorkerName.toLowerCase().includes(s) || r.summary.toLowerCase().includes(s)); }
    if (childFilter !== "all") out = out.filter(r => r.youngPersonId === childFilter);
    if (typeFilter !== "all") out = out.filter(r => r.contactType === typeFilter);
    out.sort((a, b) => sortBy === "oldest" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
    return out;
  }, [data, search, childFilter, typeFilter, sortBy]);

  const today = d(0);
  const overdueFollowUps = data.filter(r => r.followUpRequired && r.followUpDate && r.followUpDate < today && r.actionItems.some(a => a.status !== "completed"));
  const statVisits = data.filter(r => r.contactType === "statutory_visit").length;
  const thisMonth = data.filter(r => r.date >= d(-30)).length;

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];

  const exportCols: ExportColumn<SocialWorkerContact>[] = useMemo(() => [
    { header: "Date", accessor: (r: SocialWorkerContact) => r.date },
    { header: "Time", accessor: (r: SocialWorkerContact) => r.time },
    { header: "Young Person", accessor: (r: SocialWorkerContact) => getYPName(r.youngPersonId) },
    { header: "Social Worker", accessor: (r: SocialWorkerContact) => r.socialWorkerName },
    { header: "Team", accessor: (r: SocialWorkerContact) => r.socialWorkerTeam },
    { header: "Type", accessor: (r: SocialWorkerContact) => CT_LABEL[r.contactType] },
    { header: "Direction", accessor: (r: SocialWorkerContact) => r.direction },
    { header: "Urgency", accessor: (r: SocialWorkerContact) => r.urgency },
    { header: "Staff", accessor: (r: SocialWorkerContact) => getStaffName(r.staffMember) },
    { header: "Purpose", accessor: (r: SocialWorkerContact) => r.purpose },
    { header: "Summary", accessor: (r: SocialWorkerContact) => r.summary },
    { header: "Outcome", accessor: (r: SocialWorkerContact) => r.outcome },
  ], []);

  return (
    <PageShell
      title="Social Worker Contact Log"
      subtitle="Communication record with allocated social workers — Regulation 5"
      actions={[
        <PrintButton key="p" title="Social Worker Contact Log" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="sw-contact-log" />,
        <Button key="n" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" />Log Contact</Button>,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Contacts This Month", value: thisMonth, icon: Phone, colour: "text-blue-600" },
            { label: "Statutory Visits", value: statVisits, icon: CheckCircle2, colour: "text-emerald-600" },
            { label: "Overdue Follow-Ups", value: overdueFollowUps.length, icon: AlertTriangle, colour: "text-red-600" },
            { label: "Avg Contacts / Week", value: Math.round(data.length / 4 * 10) / 10, icon: Clock, colour: "text-gray-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* per-child SW cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {childIds.map(cid => {
            const sw = SW_DIR[cid];
            const recs = data.filter(r => r.youngPersonId === cid);
            const last = recs.sort((a, b) => b.date.localeCompare(a.date))[0];
            const next = recs.map(r => r.nextScheduledContact).filter(Boolean).sort()[0];
            const daysSince = last ? Math.round((Date.now() - new Date(last.date).getTime()) / 86400000) : 999;
            const rag = daysSince <= 7 ? "border-green-400" : daysSince <= 21 ? "border-amber-400" : "border-red-400";
            return (
              <Card key={cid} className={cn("border-l-4", rag)}>
                <CardHeader className="pb-2"><CardTitle className="text-base">{getYPName(cid)}</CardTitle></CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><strong>SW:</strong> {sw?.name}</p>
                  <p className="text-xs text-muted-foreground">{sw?.team}</p>
                  <p className="text-xs">{sw?.phone} · {sw?.email}</p>
                  <div className="flex justify-between pt-1"><span className="text-muted-foreground">Last Contact</span><span>{last?.date ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Next Scheduled</span><span>{next ?? "—"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total Contacts</span><span className="font-medium">{recs.length}</span></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* alert banner */}
        {overdueFollowUps.length > 0 && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">{overdueFollowUps.length} overdue follow-up{overdueFollowUps.length > 1 ? "s" : ""}</p>
              <ul className="text-sm text-red-800 mt-1 list-disc list-inside">
                {overdueFollowUps.map(r => <li key={r.id}>{getYPName(r.youngPersonId)} — {r.purpose} (follow-up due {r.followUpDate})</li>)}
              </ul>
            </div>
          </div>
        )}

        {/* filter bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-xs">Search</Label>
                <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-8" placeholder="Name, SW, summary…" value={search} onChange={e => setSearch(e.target.value)} /></div>
              </div>
              <div className="w-40">
                <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" />Child</Label>
                <Select value={childFilter} onValueChange={setChildFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Children</SelectItem>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs">Contact Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="all">All Types</SelectItem>{(Object.entries(CT_LABEL) as [ContactType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="w-36">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="oldest">Oldest</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* contact cards */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            return (
              <Card key={r.id}>
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.youngPersonId)}</CardTitle>
                        <Badge className={cn("text-xs", CT_CLR[r.contactType])}>{CT_LABEL[r.contactType]}</Badge>
                        <Badge className={cn("text-xs", DIR_CLR[r.direction])}>{r.direction}</Badge>
                        {r.urgency !== "routine" && <Badge className={cn("text-xs", URG_CLR[r.urgency])}>{r.urgency}</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.date} {r.time}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.purpose} · SW: {r.socialWorkerName} · Staff: {getStaffName(r.staffMember)}</p>
                  </CardHeader>
                </button>
                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <p className="text-sm">{r.summary}</p>

                    {r.keyDecisions.length > 0 && (
                      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">Key Decisions</p>
                        <ol className="list-decimal list-inside text-sm text-blue-900 space-y-0.5">{r.keyDecisions.map((kd, i) => <li key={i}>{kd}</li>)}</ol>
                      </div>
                    )}

                    {r.actionItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-2">Action Items</p>
                        <table className="w-full text-sm border">
                          <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Action</th><th className="text-left p-2 font-medium">Owner</th><th className="text-left p-2 font-medium">Due</th><th className="text-left p-2 font-medium">Status</th></tr></thead>
                          <tbody>{r.actionItems.map((a, i) => {
                            const od = a.status !== "completed" && a.dueDate < today;
                            return (
                              <tr key={i} className={cn("border-t", od && "bg-red-50")}>
                                <td className="p-2">{a.action}</td>
                                <td className="p-2">{getStaffName(a.owner)}</td>
                                <td className={cn("p-2", od && "text-red-600 font-medium")}>{a.dueDate}{od && " (OVERDUE)"}</td>
                                <td className="p-2"><Badge className={cn("text-xs", a.status === "completed" ? "bg-green-100 text-green-800" : a.status === "overdue" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800")}>{a.status}</Badge></td>
                              </tr>
                            );
                          })}</tbody>
                        </table>
                      </div>
                    )}

                    {r.documentsShared.length > 0 && (
                      <div><p className="text-xs font-semibold mb-1">Documents Shared</p><div className="flex gap-1 flex-wrap">{r.documentsShared.map(dc => <Badge key={dc} variant="outline" className="text-xs">{dc}</Badge>)}</div></div>
                    )}

                    {r.childViews && (
                      <div className="rounded-lg bg-pink-50 border border-pink-200 p-3">
                        <p className="text-xs font-semibold text-pink-800 mb-1">Child&apos;s Views {r.childAware ? <CheckCircle2 className="inline h-3 w-3 text-green-600 ml-1" /> : <span className="text-xs text-muted-foreground ml-1">(not yet informed)</span>}</p>
                        <p className="text-sm text-pink-900">{r.childViews}</p>
                      </div>
                    )}

                    {r.followUpRequired && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span className="font-medium">Follow-up required:</span>
                        <span className={cn(r.followUpDate && r.followUpDate < today ? "text-red-600 font-medium" : "")}>{r.followUpDate ?? "TBC"}</span>
                      </div>
                    )}

                    {r.outcome && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                        <p className="text-xs font-semibold text-green-800 mb-1">Outcome</p>
                        <p className="text-sm text-green-900">{r.outcome}</p>
                      </div>
                    )}

                    {r.nextScheduledContact && (
                      <p className="text-xs text-muted-foreground">Next scheduled contact: <strong>{r.nextScheduledContact}</strong></p>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No contacts match filters.</p>}
        </div>

        {/* statutory visit tracker */}
        <Card>
          <CardHeader><CardTitle className="text-base">Statutory Visit Tracker</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm border">
              <thead className="bg-muted/50"><tr><th className="text-left p-2 font-medium">Young Person</th><th className="text-left p-2 font-medium">Social Worker</th><th className="text-left p-2 font-medium">Last Statutory Visit</th><th className="text-left p-2 font-medium">Days Since</th><th className="text-left p-2 font-medium">Next Due</th></tr></thead>
              <tbody>
                {childIds.map(cid => {
                  const sv = data.filter(r => r.youngPersonId === cid && r.contactType === "statutory_visit").sort((a, b) => b.date.localeCompare(a.date))[0];
                  const days = sv ? Math.round((Date.now() - new Date(sv.date).getTime()) / 86400000) : 999;
                  return (
                    <tr key={cid} className="border-t">
                      <td className="p-2 font-medium">{getYPName(cid)}</td>
                      <td className="p-2">{SW_DIR[cid]?.name}</td>
                      <td className="p-2">{sv?.date ?? "No record"}</td>
                      <td className="p-2"><Badge className={cn("text-xs", days <= 28 ? "bg-green-100 text-green-800" : days <= 42 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800")}>{days} days</Badge></td>
                      <td className="p-2">{sv ? d(42 - days) : "Overdue"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Children&apos;s Homes Regulations 2015, Reg 5 — Engagement with parents, social workers, and other relevant persons. Statutory visits must occur at intervals set by the IRO (typically every 6 weeks). All contact with allocated social workers must be recorded and available for inspection.</p>
        </div>
      </div>

      {/* dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Social Worker Contact</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger><SelectContent>{childIds.map(id => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3"><div><Label>Date</Label><Input type="date" /></div><div><Label>Time</Label><Input type="time" /></div></div>
            <div><Label>Contact Type</Label><Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{(Object.entries(CT_LABEL) as [ContactType, string][]).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Direction</Label><Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="incoming">Incoming</SelectItem><SelectItem value="outgoing">Outgoing</SelectItem></SelectContent></Select></div>
            <div><Label>Purpose</Label><Input placeholder="Purpose of contact" /></div>
            <div><Label>Summary</Label><Textarea rows={3} placeholder="Summary of discussion…" /></div>
            <div><Label>Outcome</Label><Textarea rows={2} placeholder="Outcome / agreed actions…" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Save Contact</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
