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
  Clock, Search, FileText, Lock, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type RequestType = "subject_access" | "right_to_erasure" | "data_portability" | "rectification" | "restriction" | "objection";
type RequestStatus = "received" | "identity_verified" | "in_progress" | "redaction" | "completed" | "refused" | "extended";
type RequesterType = "care_leaver" | "parent" | "social_worker" | "young_person" | "staff" | "solicitor" | "other";

interface SARRecord {
  id: string;
  dateReceived: string;
  deadlineDate: string;
  requestType: RequestType;
  requesterName: string;
  requesterType: RequesterType;
  requesterRelation: string;
  dataSubjectId: string | null;
  dataSubjectType: "child" | "staff";
  status: RequestStatus;
  identityVerified: boolean;
  identityMethod: string;
  dataScope: string[];
  redactionsRequired: boolean;
  redactionCategories: string[];
  thirdPartyConsent: boolean;
  extensionApplied: boolean;
  extensionReason: string;
  dateCompleted: string | null;
  responseMethod: string;
  handledById: string;
  dpoConsulted: boolean;
  notes: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const TYPE_LABEL: Record<RequestType, string> = {
  subject_access: "Subject Access Request (SAR)", right_to_erasure: "Right to Erasure",
  data_portability: "Data Portability", rectification: "Rectification",
  restriction: "Restriction of Processing", objection: "Right to Object",
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  received: "Received", identity_verified: "Identity Verified", in_progress: "In Progress",
  redaction: "Redaction Review", completed: "Completed", refused: "Refused", extended: "Extended",
};
const STATUS_CLR: Record<RequestStatus, string> = {
  received: "bg-slate-100 text-slate-700", identity_verified: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800", redaction: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800", refused: "bg-red-100 text-red-800",
  extended: "bg-orange-100 text-orange-800",
};
const STATUS_BORDER: Record<RequestStatus, string> = {
  received: "border-l-slate-400", identity_verified: "border-l-blue-400",
  in_progress: "border-l-amber-400", redaction: "border-l-purple-400",
  completed: "border-l-green-400", refused: "border-l-red-500", extended: "border-l-orange-400",
};

const REQUESTER_LABEL: Record<RequesterType, string> = {
  care_leaver: "Care Leaver", parent: "Parent/Carer", social_worker: "Social Worker",
  young_person: "Young Person (Current)", staff: "Staff Member", solicitor: "Solicitor", other: "Other",
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: SARRecord[] = [
  {
    id: "sar_001", dateReceived: d(-25), deadlineDate: d(5),
    requestType: "subject_access", requesterName: "Mark Davies (Alex's birth father)",
    requesterType: "parent", requesterRelation: "Birth father of Alex Davies",
    dataSubjectId: "yp_alex", dataSubjectType: "child",
    status: "redaction",
    identityVerified: true, identityMethod: "Photographic ID (driving licence) verified by Darren. Parental responsibility confirmed via social worker.",
    dataScope: ["Daily log entries mentioning Alex", "Incident reports involving Alex", "Contact records", "Education records", "Health records"],
    redactionsRequired: true,
    redactionCategories: [
      "Third-party personal data (other YP names, staff home addresses)",
      "Information provided in confidence by other professionals",
      "Risk assessment details where disclosure could cause harm",
      "Casey and Jordan's personal information in shared incident reports",
    ],
    thirdPartyConsent: false, extensionApplied: false, extensionReason: "",
    dateCompleted: null, responseMethod: "Secure email with password-protected PDF",
    handledById: "staff_darren", dpoConsulted: true,
    notes: "Mark requested access to all records relating to Alex for the last 12 months. Identity verified. Social worker (Karen Holding) confirmed parental responsibility. Data collation in progress — significant volume of daily logs. Redaction needed: other YP names must be removed from daily logs and incident reports. DPO (organisation level) consulted on scope and redaction approach. On track to meet 30-day deadline.",
  },
  {
    id: "sar_002", dateReceived: d(-60), deadlineDate: d(-30),
    requestType: "subject_access", requesterName: "Rachel Thompson (former care leaver)",
    requesterType: "care_leaver", requesterRelation: "Former resident of Oak House (2019-2022)",
    dataSubjectId: null, dataSubjectType: "child",
    status: "completed",
    identityVerified: true, identityMethod: "Video call identity verification with passport. Former placement confirmed via archived records.",
    dataScope: ["Full placement file", "Daily logs", "Incident reports", "Care plans", "LAC review minutes", "Photographs", "Correspondence"],
    redactionsRequired: true,
    redactionCategories: [
      "Staff personal contact details",
      "Other children's names and information",
      "Professional consultation notes marked confidential",
      "Court-ordered restricted information",
    ],
    thirdPartyConsent: false, extensionApplied: true,
    extensionReason: "Volume of data required retrieval from archived records (off-site storage). Two-month extension applied under Article 12(3) GDPR — requester notified within 30 days of original request.",
    dateCompleted: d(-10), responseMethod: "USB drive delivered via recorded delivery to verified address",
    handledById: "staff_darren", dpoConsulted: true,
    notes: "Rachel was a resident at Oak House from 2019 to 2022 (age 14-17). Now 20 years old. Requested full access to her file as part of processing her care experience. Extensive records retrieved from archive. Rachel was supported through the process — offered to view records with a worker present or receive them privately. Rachel chose to receive them privately but was given the contact details for an aftercare support worker and counselling service. 847 pages collated, redacted, and provided on encrypted USB. Rachel acknowledged receipt.",
  },
  {
    id: "sar_003", dateReceived: d(-10), deadlineDate: d(20),
    requestType: "rectification", requesterName: "Jordan (via advocate)",
    requesterType: "young_person", requesterRelation: "Current resident — request via independent advocate",
    dataSubjectId: "yp_jordan", dataSubjectType: "child",
    status: "in_progress",
    identityVerified: true, identityMethod: "Jordan is a current resident. Advocate verified as authorised representative.",
    dataScope: ["Specific daily log entry from " + d(-15)],
    redactionsRequired: false,
    redactionCategories: [],
    thirdPartyConsent: false, extensionApplied: false, extensionReason: "",
    dateCompleted: null, responseMethod: "Verbal explanation and record amendment",
    handledById: "staff_darren", dpoConsulted: false,
    notes: "Jordan, supported by their advocate, has requested correction of a daily log entry that states Jordan 'refused to engage with the activity.' Jordan states they did not refuse — they were overwhelmed due to sensory overload and needed to leave the room. Advocate supports this. Under GDPR Article 16, Jordan has the right to rectification. The original log author (Edward) has been consulted and agrees the wording was not reflective of the situation. Record will be amended to read: 'Jordan became overwhelmed due to sensory stimulation and needed space. Staff supported Jordan by offering a quiet alternative.' Original entry will be retained with note of amendment per data retention policy.",
  },
  {
    id: "sar_004", dateReceived: d(-40), deadlineDate: d(-10),
    requestType: "subject_access", requesterName: "Diane Carter (former staff)",
    requesterType: "staff", requesterRelation: "Former Residential Care Worker — dismissed following LADO investigation",
    dataSubjectId: null, dataSubjectType: "staff",
    status: "completed",
    identityVerified: true, identityMethod: "Photographic ID (passport) provided via solicitor.",
    dataScope: ["Personnel file", "Supervision records", "LADO investigation file", "Disciplinary records", "Training records"],
    redactionsRequired: true,
    redactionCategories: [
      "Children's personal data",
      "Information provided by third parties in confidence",
      "Internal management discussion notes (legal privilege claimed for some)",
    ],
    thirdPartyConsent: false, extensionApplied: false, extensionReason: "",
    dateCompleted: d(-15), responseMethod: "Secure email via solicitor with encrypted files",
    handledById: "staff_darren", dpoConsulted: true,
    notes: "Diane's solicitor submitted a SAR on her behalf following her dismissal. Legal advice obtained from the organisation's solicitor regarding scope, particularly around the LADO investigation file. DPO confirmed that Diane is entitled to her personal data within the investigation file but not to confidential third-party information or legally privileged material. All children's data redacted. Response provided within 30-day deadline. Solicitor acknowledged receipt — no further correspondence to date.",
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function SubjectAccessRequestsPage() {
  const [data] = useState(SEED);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.requesterName.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.dataSubjectId && (r.dataSubjectType === "child" ? getYPName(r.dataSubjectId) : getStaffName(r.dataSubjectId)).toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    if (filterType !== "all") rows = rows.filter((r) => r.requestType === filterType);
    rows.sort((a, b) => sortBy === "newest" ? b.dateReceived.localeCompare(a.dateReceived) : a.dateReceived.localeCompare(b.dateReceived));
    return rows;
  }, [data, search, filterStatus, filterType, sortBy]);

  const total = data.length;
  const open = data.filter((r) => !["completed", "refused"].includes(r.status)).length;
  const completed = data.filter((r) => r.status === "completed").length;
  const approaching = data.filter((r) => {
    if (r.status === "completed" || r.status === "refused") return false;
    const today = d(0);
    const sevenDays = d(7);
    return r.deadlineDate >= today && r.deadlineDate <= sevenDays;
  }).length;

  const exportCols: ExportColumn<SARRecord>[] = [
    { header: "ID", accessor: (r: SARRecord) => r.id },
    { header: "Received", accessor: (r: SARRecord) => r.dateReceived },
    { header: "Deadline", accessor: (r: SARRecord) => r.deadlineDate },
    { header: "Type", accessor: (r: SARRecord) => TYPE_LABEL[r.requestType] },
    { header: "Requester", accessor: (r: SARRecord) => r.requesterName },
    { header: "Source", accessor: (r: SARRecord) => REQUESTER_LABEL[r.requesterType] },
    { header: "Status", accessor: (r: SARRecord) => STATUS_LABEL[r.status] },
    { header: "Completed", accessor: (r: SARRecord) => r.dateCompleted || "Pending" },
    { header: "DPO Consulted", accessor: (r: SARRecord) => r.dpoConsulted ? "Yes" : "No" },
  ];

  return (
    <PageShell
      title="Subject Access Requests (SARs)"
      subtitle="GDPR · UK Data Protection Act 2018 · Information Rights"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Subject Access Requests" />
          <ExportButton data={data} columns={exportCols} filename="subject-access-requests" />
          <Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Log Request</Button>
        </div>
      }
    >
      <div id="print-area">
        {/* stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Requests", value: total, icon: FileText, clr: "text-blue-600" },
            { label: "Open / Active", value: open, icon: Clock, clr: "text-amber-600" },
            { label: "Completed", value: completed, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Deadline ≤7 Days", value: approaching, icon: AlertTriangle, clr: "text-red-600" },
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
            <Input className="pl-8" placeholder="Search requests..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {(Object.entries(STATUS_LABEL) as [RequestStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Request Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(TYPE_LABEL) as [RequestType, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => setSortBy(sortBy === "newest" ? "oldest" : "newest")}>
            <ArrowUpDown className="h-4 w-4 mr-1" />{sortBy === "newest" ? "Newest" : "Oldest"}
          </Button>
        </div>

        {/* deadline alert */}
        {open > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 flex items-start gap-2">
            <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{open} active request(s) — statutory deadline: 30 calendar days</p>
              <p className="text-amber-700">SARs must be responded to within 30 calendar days (extendable by 2 months for complex/voluminous requests under Article 12(3)). Failure to respond within the deadline may result in an ICO complaint. All requests must be logged, identity verified, and DPO consulted where appropriate.</p>
            </div>
          </div>
        )}

        {/* request cards */}
        <div className="space-y-3">
          {filtered.map((r) => {
            const isOpen = expandedId === r.id;
            const daysRemaining = Math.ceil((new Date(r.deadlineDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.requesterName}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline" className="bg-muted/50">{REQUESTER_LABEL[r.requesterType]}</Badge>
                        {r.extensionApplied && <Badge variant="outline" className="bg-orange-100 text-orange-800">Extended</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {TYPE_LABEL[r.requestType]} · Received: {r.dateReceived} · Deadline: {r.deadlineDate}
                        {r.dataSubjectId && ` · Subject: ${r.dataSubjectType === "child" ? getYPName(r.dataSubjectId) : getStaffName(r.dataSubjectId)}`}
                        {" "}· Handler: {getStaffName(r.handledById)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {r.status !== "completed" && r.status !== "refused" && (
                        <Badge variant="outline" className={cn(
                          daysRemaining <= 3 ? "bg-red-100 text-red-800" :
                          daysRemaining <= 7 ? "bg-amber-100 text-amber-800" :
                          "bg-green-100 text-green-800"
                        )}>{daysRemaining}d left</Badge>
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 space-y-3 text-sm">
                    {/* identity verification */}
                    <div className={cn("rounded p-2", r.identityVerified ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")}>
                      <p className="font-medium text-xs mb-1">{r.identityVerified ? "✓ Identity Verified" : "✗ Identity NOT Verified"}</p>
                      <p className="text-xs">{r.identityMethod}</p>
                    </div>

                    {/* data scope */}
                    <div>
                      <p className="font-medium mb-1">Data Scope Requested</p>
                      <div className="flex flex-wrap gap-1">
                        {r.dataScope.map((s, i) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* redactions */}
                    {r.redactionsRequired && (
                      <div>
                        <p className="font-medium mb-1">Redaction Categories</p>
                        <ul className="space-y-1">
                          {r.redactionCategories.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Shield className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* extension */}
                    {r.extensionApplied && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <p className="font-medium text-xs text-orange-800 mb-1">Extension Applied</p>
                        <p className="text-xs text-orange-700">{r.extensionReason}</p>
                      </div>
                    )}

                    {/* timeline */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Received</p>
                        <p className="text-xs font-bold">{r.dateReceived}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Deadline</p>
                        <p className={cn("text-xs font-bold", daysRemaining <= 3 && r.status !== "completed" ? "text-red-700" : "")}>{r.deadlineDate}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Completed</p>
                        <p className="text-xs font-bold">{r.dateCompleted || "Pending"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">DPO Consulted</p>
                        <p className={cn("text-xs font-bold", r.dpoConsulted ? "text-green-700" : "text-slate-500")}>{r.dpoConsulted ? "Yes" : "No"}</p>
                      </div>
                    </div>

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
          <p className="font-semibold mb-1">Data Protection Framework</p>
          <p>UK GDPR and Data Protection Act 2018 — individuals have the right to access their personal data (Article 15), rectification (Article 16), erasure (Article 17), restriction (Article 18), data portability (Article 20), and objection (Article 21). SARs must be responded to within 30 calendar days, extendable by 2 months for complex requests (with notification to the requester within the original 30 days). Identity must be verified before disclosure. Third-party data must be redacted unless consent is obtained or disclosure is reasonable. Children&apos;s records require particular care — redaction of other children&apos;s data, confidential third-party information, and legally privileged material. The ICO must be notified of any personal data breach within 72 hours. Care leavers have a right to access their full care file.</p>
        </div>
      </div>

      {/* new request dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log Data Request</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Requester Name</Label><Input placeholder="Full name of requester" /></div>
            <div>
              <Label>Requester Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(REQUESTER_LABEL) as [RequesterType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Request Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select request type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_LABEL) as [RequestType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Date Received</Label><Input type="date" /></div>
            <div><Label>Details</Label><Textarea placeholder="Describe what data is being requested..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={() => setShowNew(false)}>Log Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
