"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, ChevronDown, ChevronUp, ArrowUpDown, AlertTriangle, CheckCircle2,
  Clock, Search, Bell, FileText, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type NotificationType =
  | "death" | "serious_injury" | "serious_illness" | "restraint"
  | "allegation_against_staff" | "child_protection" | "police_involvement"
  | "absconding" | "serious_complaint" | "significant_incident"
  | "infectious_disease" | "fire" | "other";

type NotificationMethod = "phone" | "email" | "online_form" | "letter";
type OfstedResponse = "acknowledged" | "no_further_action" | "monitoring" | "inspection_brought_forward" | "awaiting_response";

interface Reg35Notification {
  id: string;
  dateOfEvent: string;
  dateNotified: string;
  notificationType: NotificationType;
  notifiedToOfsted: boolean;
  notifiedToLA: boolean;
  notifiedToPolice: boolean;
  notifiedToOther: string[];
  method: NotificationMethod;
  ofstedRef: string;
  youngPersonId: string | null;
  summary: string;
  actionsTaken: string[];
  notifiedById: string;
  timelinessCompliant: boolean;
  ofstedResponse: OfstedResponse;
  followUpRequired: boolean;
  followUpDetails: string;
  linkedRecords: string[];
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABEL: Record<NotificationType, string> = {
  death: "Death of a Child", serious_injury: "Serious Injury", serious_illness: "Serious Illness",
  restraint: "Use of Restraint", allegation_against_staff: "Allegation Against Staff",
  child_protection: "Child Protection Incident", police_involvement: "Police Involvement",
  absconding: "Absconding / Missing", serious_complaint: "Serious Complaint",
  significant_incident: "Significant Incident", infectious_disease: "Infectious Disease Outbreak",
  fire: "Fire", other: "Other Notifiable Event",
};

const METHOD_LABEL: Record<NotificationMethod, string> = {
  phone: "Telephone", email: "Email", online_form: "Ofsted Online Form", letter: "Letter",
};

const RESPONSE_LABEL: Record<OfstedResponse, string> = {
  acknowledged: "Acknowledged", no_further_action: "No Further Action",
  monitoring: "Monitoring", inspection_brought_forward: "Inspection Brought Forward",
  awaiting_response: "Awaiting Response",
};
const RESPONSE_CLR: Record<OfstedResponse, string> = {
  acknowledged: "bg-blue-100 text-blue-800", no_further_action: "bg-green-100 text-green-800",
  monitoring: "bg-amber-100 text-amber-800", inspection_brought_forward: "bg-red-100 text-red-800",
  awaiting_response: "bg-slate-100 text-slate-700",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: Reg35Notification[] = [
  {
    id: "r35_001", dateOfEvent: d(-45), dateNotified: d(-45),
    notificationType: "restraint", method: "online_form", ofstedRef: "OFS-2025-RES-44821",
    notifiedToOfsted: true, notifiedToLA: true, notifiedToPolice: false,
    notifiedToOther: ["Casey's Social Worker (Lisa Green)", "Casey's IRO (James Cooper)"],
    youngPersonId: "yp_casey",
    summary: "Physical intervention (PRICE hold) used on Casey following an escalating situation where Casey picked up a glass object and moved towards another young person. Two-person hold lasting 4 minutes by Ryan and Chervelle. De-escalation attempted for 12 minutes prior. No injuries to Casey or staff. Body map completed — no marks. Casey debriefed next day.",
    actionsTaken: [
      "Body map completed within 1 hour — no injuries",
      "Medical check completed — no concerns",
      "Post-incident debrief with Casey (next day)",
      "Post-incident debrief with Ryan and Chervelle",
      "Incident report completed and countersigned by RM",
      "Ofsted notification submitted same day via online form",
      "Placing LA and SW notified by phone within 2 hours",
    ],
    notifiedById: "staff_darren", timelinessCompliant: true,
    ofstedResponse: "no_further_action",
    followUpRequired: false, followUpDetails: "",
    linkedRecords: ["Incident report INC-2025-034", "Body map BM-2025-012", "PI Debrief PIR-2025-008"],
    notes: "Ofsted acknowledged notification and confirmed no further action. Reg 35(3)(d) — restraint notification. All documentation completed within required timeframes. RI (Richard Holt) informed same day and reviewed incident. Independent review confirmed proportionate response.",
  },
  {
    id: "r35_002", dateOfEvent: d(-30), dateNotified: d(-30),
    notificationType: "allegation_against_staff", method: "phone", ofstedRef: "OFS-2025-ALL-44903",
    notifiedToOfsted: true, notifiedToLA: true, notifiedToPolice: false,
    notifiedToOther: ["LADO (Derbyshire)", "RI (Richard Holt)"],
    youngPersonId: "yp_casey",
    summary: "Allegation received against staff member (Anna) regarding inappropriate physical contact during a comforting interaction with Casey. Casey disclosed to her social worker that Anna hugged her without asking. LADO strategy discussion convened. Anna placed on restricted duties pending investigation.",
    actionsTaken: [
      "LADO contacted same day — strategy discussion arranged",
      "Ofsted notified by telephone within 24 hours",
      "Anna placed on restricted duties (non-contact role pending investigation)",
      "Casey offered independent advocacy support",
      "All relevant parties notified per LADO protocol",
      "RI informed and consulted on interim risk management",
    ],
    notifiedById: "staff_darren", timelinessCompliant: true,
    ofstedResponse: "monitoring",
    followUpRequired: true, followUpDetails: "LADO investigation ongoing. Ofsted to be updated on outcome. Next LADO review meeting scheduled for " + d(7) + ".",
    linkedRecords: ["LADO Referral LADO-2025-003", "Staff risk assessment SRA-2025-001"],
    notes: "Reg 35(3)(c) — allegation against person working at the home. Ofsted notified by telephone (as required for allegations) and written confirmation sent same day. Investigation is ongoing under LADO direction. Anna continues on restricted duties. Casey is being supported by her advocate and key worker (Chervelle covering). Ofsted status: monitoring — requested update when LADO outcome is known.",
  },
  {
    id: "r35_003", dateOfEvent: d(-60), dateNotified: d(-60),
    notificationType: "absconding", method: "online_form", ofstedRef: "OFS-2025-MIS-43912",
    notifiedToOfsted: true, notifiedToLA: true, notifiedToPolice: true,
    notifiedToOther: ["Casey's Social Worker", "Casey's mother (via SW)"],
    youngPersonId: "yp_casey",
    summary: "Casey left the home without permission at approximately 21:45. Staff noticed Casey's room was empty during a night check at 22:00. Casey had climbed out of the ground-floor bedroom window. Police notified at 22:10. Casey was located by police at the retail park at 23:30 and returned home by 00:15. Casey was with an unknown adult male — information shared with police and exploitation screening updated.",
    actionsTaken: [
      "Night check identified absence at 22:00",
      "Missing from care protocol activated immediately",
      "Police called at 22:10 — reported as missing child",
      "Social worker notified by phone",
      "Ofsted notified next morning via online form",
      "Return home interview conducted (Anna, following day)",
      "Exploitation screening updated — unknown male flagged",
      "Window locks reviewed and additional security measure installed",
    ],
    notifiedById: "staff_darren", timelinessCompliant: true,
    ofstedResponse: "no_further_action",
    followUpRequired: false, followUpDetails: "",
    linkedRecords: ["Missing from Care MFC-2025-005", "Exploitation Screening ES-2025-002", "Return Interview RI-2025-003"],
    notes: "Reg 35(3)(e) — child absent without permission. Casey returned safely. The unknown male was identified by police as Marcus (known to exploitation team). Information shared with MASH. Casey's window was fitted with a restrictive lock (Casey consulted and agreed — documented as proportionate restriction). Updated exploitation screening reflects increased CSE risk. Strategy discussion held with SW and police.",
  },
  {
    id: "r35_004", dateOfEvent: d(-90), dateNotified: d(-89),
    notificationType: "serious_complaint", method: "online_form", ofstedRef: "OFS-2025-CMP-42687",
    notifiedToOfsted: true, notifiedToLA: false, notifiedToPolice: false,
    notifiedToOther: [],
    youngPersonId: null,
    summary: "Anonymous complaint received via Ofsted alleging inappropriate language used by a staff member towards a young person at Oak House. No specific details provided. Ofsted forwarded the complaint to the Registered Manager for investigation.",
    actionsTaken: [
      "Thorough investigation conducted over 14 days",
      "All YP interviewed individually (with advocacy offered)",
      "All staff interviewed",
      "CCTV reviewed for 30-day period",
      "Daily logs reviewed — no corroborating evidence",
      "Ofsted informed of outcome — complaint not upheld",
    ],
    notifiedById: "staff_darren", timelinessCompliant: false,
    ofstedResponse: "no_further_action",
    followUpRequired: false, followUpDetails: "",
    linkedRecords: ["Complaint COMP-2025-003"],
    notes: "This notification was originated by Ofsted (complaint came to them directly). The home was notified the following day. Investigation was thorough and well-documented. Complaint not upheld — no evidence found. Ofsted satisfied with investigation. Marked as non-compliant for timeliness because the notification was incoming (Ofsted to home) rather than outgoing, but logged here for completeness. All response timescales met.",
  },
  {
    id: "r35_005", dateOfEvent: d(-120), dateNotified: d(-120),
    notificationType: "serious_illness", method: "phone", ofstedRef: "OFS-2025-ILL-41290",
    notifiedToOfsted: true, notifiedToLA: true, notifiedToPolice: false,
    notifiedToOther: ["Alex's Social Worker (Karen Holding)", "Alex's mother (Sarah Mitchell)"],
    youngPersonId: "yp_alex",
    summary: "Alex was taken to A&E by ambulance following an acute asthma attack during football practice. Alex's reliever inhaler was not effective after 10 puffs. 999 called at 16:42. Paramedics arrived at 16:55. Alex was nebulised on scene and transported to hospital. Alex was discharged after 6 hours with adjusted medication plan.",
    actionsTaken: [
      "999 called immediately when reliever inhaler ineffective",
      "Staff (Ryan) accompanied Alex in ambulance",
      "Darren notified and attended hospital",
      "Social worker notified by phone within 1 hour",
      "Ofsted notified by phone same evening",
      "Alex's mother contacted by Darren",
      "Medication review conducted with hospital pharmacist",
      "Updated asthma action plan shared with school and stored in home",
    ],
    notifiedById: "staff_darren", timelinessCompliant: true,
    ofstedResponse: "acknowledged",
    followUpRequired: false, followUpDetails: "",
    linkedRecords: ["Health Record HR-2025-028", "Medication review MR-2025-004"],
    notes: "Reg 35(3)(b) — serious illness requiring hospital treatment. Alex recovered well and returned to the home the same evening. Medication adjusted to include a preventer inhaler. School nurse informed. Staff first aid response was prompt and appropriate. Ryan stayed with Alex throughout. Alex's mother was supportive and visited the hospital. Follow-up GP appointment arranged for 1 week later — confirmed adjusted meds are effective.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function Reg35NotificationsPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterResponse, setFilterResponse] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.summary.toLowerCase().includes(q) ||
        r.ofstedRef.toLowerCase().includes(q) ||
        (r.youngPersonId && getYPName(r.youngPersonId).toLowerCase().includes(q))
      );
    }
    if (filterType !== "all") rows = rows.filter((r) => r.notificationType === filterType);
    if (filterResponse !== "all") rows = rows.filter((r) => r.ofstedResponse === filterResponse);
    rows.sort((a, b) => sortBy === "newest" ? b.dateOfEvent.localeCompare(a.dateOfEvent) : a.dateOfEvent.localeCompare(b.dateOfEvent));
    return rows;
  }, [data, search, filterType, filterResponse, sortBy]);

  const total = data.length;
  const compliant = data.filter((r) => r.timelinessCompliant).length;
  const pending = data.filter((r) => r.ofstedResponse === "awaiting_response" || r.ofstedResponse === "monitoring").length;
  const followUps = data.filter((r) => r.followUpRequired).length;

  const exportCols: ExportColumn<Reg35Notification>[] = [
    { header: "Event Date", accessor: (r: Reg35Notification) => r.dateOfEvent },
    { header: "Notified", accessor: (r: Reg35Notification) => r.dateNotified },
    { header: "Type", accessor: (r: Reg35Notification) => TYPE_LABEL[r.notificationType] },
    { header: "Ofsted Ref", accessor: (r: Reg35Notification) => r.ofstedRef },
    { header: "Young Person", accessor: (r: Reg35Notification) => r.youngPersonId ? getYPName(r.youngPersonId) : "N/A" },
    { header: "Method", accessor: (r: Reg35Notification) => METHOD_LABEL[r.method] },
    { header: "Timely", accessor: (r: Reg35Notification) => r.timelinessCompliant ? "Yes" : "No" },
    { header: "Ofsted Response", accessor: (r: Reg35Notification) => RESPONSE_LABEL[r.ofstedResponse] },
    { header: "Follow-Up", accessor: (r: Reg35Notification) => r.followUpRequired ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Reg 35 Notifications"
      subtitle="Children's Homes Regulations 2015 · Reg 40 · Statutory Notifications to Ofsted"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Reg 35 Notifications" />
          <ExportButton data={data} columns={exportCols} filename="reg35-notifications" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Notification</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Notifications", value: total, icon: Bell, clr: "text-blue-600" },
            { label: "Timely (Compliant)", value: `${compliant}/${total}`, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Pending / Monitoring", value: pending, icon: Clock, clr: "text-amber-600" },
            { label: "Follow-Ups Required", value: followUps, icon: AlertTriangle, clr: "text-red-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-3 text-center">
                <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} />
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search notifications..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(TYPE_LABEL) as [NotificationType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterResponse} onValueChange={setFilterResponse}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Response" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Responses</SelectItem>
              {(Object.entries(RESPONSE_LABEL) as [OfstedResponse, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* follow-up alert */}
        {followUps > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{followUps} notification(s) require follow-up with Ofsted</p>
              <p className="text-amber-700">Outstanding follow-ups must be completed promptly. Ofsted may request additional information or updates. Failure to respond to Ofsted requests may result in regulatory action.</p>
            </div>
          </div>
        )}

        {/* notification cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            return (
              <Card key={r.id} className={cn("border-l-4", r.followUpRequired ? "border-l-amber-500" : r.timelinessCompliant ? "border-l-green-400" : "border-l-red-500")}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {TYPE_LABEL[r.notificationType]}
                        <Badge variant="outline" className={RESPONSE_CLR[r.ofstedResponse]}>{RESPONSE_LABEL[r.ofstedResponse]}</Badge>
                        {r.timelinessCompliant ? (
                          <Badge variant="outline" className="bg-green-100 text-green-800">Timely</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-100 text-red-800">Late</Badge>
                        )}
                        {r.followUpRequired && <Badge variant="outline" className="bg-amber-100 text-amber-800">Follow-Up</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Event: {r.dateOfEvent} · Notified: {r.dateNotified} · Ref: {r.ofstedRef}
                        {r.youngPersonId && ` · ${getYPName(r.youngPersonId)}`}
                        {" "}· By: {getStaffName(r.notifiedById)} · {METHOD_LABEL[r.method]}
                      </p>
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* summary */}
                    <div>
                      <p className="font-medium mb-1">Event Summary</p>
                      <p className="text-muted-foreground text-xs">{r.summary}</p>
                    </div>

                    {/* who was notified */}
                    <div>
                      <p className="font-medium mb-1">Notifications Sent To</p>
                      <div className="flex flex-wrap gap-1">
                        {r.notifiedToOfsted && <Badge variant="outline" className="bg-blue-50 text-blue-700 text-xs">Ofsted</Badge>}
                        {r.notifiedToLA && <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">Local Authority</Badge>}
                        {r.notifiedToPolice && <Badge variant="outline" className="bg-red-50 text-red-700 text-xs">Police</Badge>}
                        {r.notifiedToOther.map((o, i) => (
                          <Badge key={i} variant="outline" className="bg-muted/50 text-xs">{o}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* actions taken */}
                    <div>
                      <p className="font-medium mb-1">Actions Taken</p>
                      <ul className="space-y-1">
                        {r.actionsTaken.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* linked records */}
                    {r.linkedRecords.length > 0 && (
                      <div>
                        <p className="font-medium mb-1">Linked Records</p>
                        <div className="flex flex-wrap gap-1">
                          {r.linkedRecords.map((lr, i) => (
                            <Badge key={i} variant="outline" className="bg-muted/30 text-xs">
                              <FileText className="h-3 w-3 mr-1" />{lr}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* follow-up */}
                    {r.followUpRequired && (
                      <div className="bg-amber-50 border border-amber-200 rounded p-2">
                        <p className="font-medium text-xs text-amber-800 mb-1">Follow-Up Required</p>
                        <p className="text-xs text-amber-700">{r.followUpDetails}</p>
                      </div>
                    )}

                    {/* notes */}
                    <div><p className="font-medium mb-1">Notes</p><p className="text-muted-foreground text-xs">{r.notes}</p></div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Children&apos;s Homes (England) Regulations 2015, Reg 40 (formerly Reg 35 under 2001 Regs, commonly still referred to as &quot;Reg 35 notifications&quot;). The registered person must notify Ofsted without delay of events including: death or serious injury/illness, restraint, allegations against staff, child protection referrals, police involvement, absconding, serious complaints, and any other significant event. Notifications must be made by the quickest practicable means (telephone for deaths, allegations, serious injuries) with written confirmation within 24 hours. Ofsted may request further information or take regulatory action based on notifications. Timeliness and completeness of notifications are monitored during inspections.</p>
        </div>
      </div>

      {/* new notification dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Reg 35 Notification</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date of Event</Label><Input type="date" /></div>
            <div>
              <Label>Notification Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_LABEL) as [NotificationType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Related Young Person</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select YP (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">N/A</SelectItem>
                  <SelectItem value="yp_alex">{getYPName("yp_alex")}</SelectItem>
                  <SelectItem value="yp_jordan">{getYPName("yp_jordan")}</SelectItem>
                  <SelectItem value="yp_casey">{getYPName("yp_casey")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Method</Label>
              <Select><SelectTrigger><SelectValue placeholder="How was Ofsted notified?" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(METHOD_LABEL) as [NotificationMethod, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Ofsted Reference</Label><Input placeholder="e.g. OFS-2025-..." /></div>
            <div><Label>Summary</Label><Textarea placeholder="Describe the event and actions taken..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Log Notification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
