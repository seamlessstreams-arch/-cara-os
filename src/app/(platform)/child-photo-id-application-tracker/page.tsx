"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  FileText, Camera, ShieldCheck, ChevronUp, ChevronDown, ArrowUpDown, Search, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type IdType =
  | "British Passport"
  | "Provisional Driving Licence"
  | "Citizen Card (free for care leavers)"
  | "Young Scot card"
  | "Photo Voter ID"
  | "PASS card"
  | "Other";

type IdStatus =
  | "Considering / planning"
  | "Documents being gathered"
  | "Application drafted"
  | "Application submitted"
  | "Awaiting biometrics"
  | "Issued"
  | "Renewal due"
  | "Lost / replacement applied"
  | "Not applicable";

interface IdRecord {
  id: string;
  youngPerson: string;
  recordedDate: string;
  idType: IdType;
  status: IdStatus;
  applicationDate?: string;
  costPaid?: number;
  fundingSource?: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  storageLocation: string;
  childHasOriginal: boolean;
  copiesKept: string[];
  evidenceProvidedToAuthority: string[];
  uniqueChallengesForLAC: string[];
  childVoice: string;
  staffObservation: string;
  reviewDate: string;
  keyWorker: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const ID_TYPE_CLR: Record<IdType, string> = {
  "British Passport": "bg-sky-100 text-sky-800",
  "Provisional Driving Licence": "bg-blue-100 text-blue-800",
  "Citizen Card (free for care leavers)": "bg-teal-100 text-teal-800",
  "Young Scot card": "bg-indigo-100 text-indigo-800",
  "Photo Voter ID": "bg-purple-100 text-purple-800",
  "PASS card": "bg-cyan-100 text-cyan-800",
  "Other": "bg-gray-100 text-gray-800",
};

const STATUS_CLR: Record<IdStatus, string> = {
  "Considering / planning": "bg-gray-100 text-gray-800",
  "Documents being gathered": "bg-amber-100 text-amber-800",
  "Application drafted": "bg-yellow-100 text-yellow-800",
  "Application submitted": "bg-blue-100 text-blue-800",
  "Awaiting biometrics": "bg-indigo-100 text-indigo-800",
  "Issued": "bg-green-100 text-green-800",
  "Renewal due": "bg-orange-100 text-orange-800",
  "Lost / replacement applied": "bg-red-100 text-red-800",
  "Not applicable": "bg-slate-100 text-slate-800",
};

const ID_TYPES: IdType[] = [
  "British Passport",
  "Provisional Driving Licence",
  "Citizen Card (free for care leavers)",
  "Young Scot card",
  "Photo Voter ID",
  "PASS card",
  "Other",
];

const fmtGBP = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);

const daysUntil = (iso?: string) => {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  const now = new Date().getTime();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
};

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: IdRecord[] = [
  {
    id: "id1",
    youngPerson: "yp_jordan",
    recordedDate: d(-180),
    idType: "British Passport",
    status: "Issued",
    applicationDate: d(-200),
    costPaid: 53.50,
    fundingSource: "Local Authority — s.23B(8) Children Act 1989 duty",
    documentNumber: "548237196",
    issueDate: d(-170),
    expiryDate: d(1640),
    storageLocation: "Office safe (locked, fire-rated) — Oak House",
    childHasOriginal: false,
    copiesKept: ["Photocopy in life-story box", "Encrypted scan on care file"],
    evidenceProvidedToAuthority: [
      "Full birth certificate (long form) — original obtained from GRO",
      "Local authority letter confirming corporate parent status",
      "Countersigned photo from Pathway Plan PA (Gemma)",
    ],
    uniqueChallengesForLAC: [
      "No parental signature available — countersignature obtained from PA acting on behalf of corporate parent",
      "Birth certificate had to be reordered from GRO before application could proceed",
    ],
    childVoice: "It feels good knowing I can travel if I want. The first time I held my own passport was emotional — it had my name on it and that's mine. I want it kept safe but I know where it is and I can ask Anna if I need it.",
    staffObservation: "Passport application coordinated with Personal Adviser and social worker. Birth certificate reorder added six weeks to the timeline — this is a recurring issue for LAC. Original document held in office safe per house policy on high-value documents; Jordan briefed on storage location and process for retrieval. Photocopy placed in life-story box at Jordan's request. Cost £53.50 paid from placement budget under the s.23B(8) duty to assist with identity documents.",
    reviewDate: d(365),
    keyWorker: "staff_anna",
  },
  {
    id: "id2",
    youngPerson: "yp_jordan",
    recordedDate: d(-30),
    idType: "Provisional Driving Licence",
    status: "Issued",
    applicationDate: d(-45),
    costPaid: 34.00,
    fundingSource: "Leaving Care Grant (cross-linked to driving-lessons-tracker)",
    documentNumber: "JONES912047JL9XY",
    issueDate: d(-32),
    expiryDate: d(3600),
    storageLocation: "Held by Jordan — wallet (used as photo ID)",
    childHasOriginal: true,
    copiesKept: ["Photocopy on care file", "Photo on Jordan's phone (for backup)"],
    evidenceProvidedToAuthority: [
      "Passport number (linked to id1)",
      "National Insurance number",
      "Three-year address history (Oak House plus previous placements)",
    ],
    uniqueChallengesForLAC: [
      "Three-year address history complicated by multiple placement moves — staff helped Jordan compile dates from care chronology",
      "Used as primary photo ID by Jordan day-to-day; cross-references the driving-lessons-tracker record",
    ],
    childVoice: "Having my provisional means I can get into clubs, prove my age, and obviously start lessons. It's mine, I keep it on me. The picture is alright I suppose.",
    staffObservation: "Provisional licence application supported during keywork. Address history compiled with Jordan from care chronology — a task only possible because the placement keeps a continuous record. Document carried day-to-day by Jordan as primary photo ID; linked to driving-lessons-tracker for the lessons workflow. Photocopy retained on care file in case of loss.",
    reviewDate: d(180),
    keyWorker: "staff_anna",
  },
  {
    id: "id3",
    youngPerson: "yp_jordan",
    recordedDate: d(-120),
    idType: "Citizen Card (free for care leavers)",
    status: "Issued",
    applicationDate: d(-130),
    costPaid: 0,
    fundingSource: "CitizenCard free-for-care-leavers scheme (no cost)",
    documentNumber: "CC-2025-487201",
    issueDate: d(-115),
    expiryDate: d(1700),
    storageLocation: "Held by Jordan — wallet",
    childHasOriginal: true,
    copiesKept: ["Photocopy on care file"],
    evidenceProvidedToAuthority: [
      "Local authority confirmation of care-leaver status (CitizenCard pro-forma)",
      "Passport (linked to id1) as supporting photo evidence",
    ],
    uniqueChallengesForLAC: [
      "Required local authority pro-forma confirming care-leaver status — Personal Adviser obtained this in two days",
      "Free-for-care-leavers scheme directly addresses the cost barrier LAC face for ID",
    ],
    childVoice: "I use this for the boxing club because they want photo ID at the door, and I used it to vote in the local elections. It looks proper. I like that it was free because I'm a care leaver.",
    staffObservation: "Citizen Card secured at no cost via the CitizenCard free-for-care-leavers scheme — a meaningful benefit for LAC who otherwise face a £15 fee. Used by Jordan as voter ID under the Elections Act 2022 (cross-references voter-registration-civic page) and routinely for age verification at boxing club. Holding the card himself supports identity and autonomy goals from his Pathway Plan.",
    reviewDate: d(365),
    keyWorker: "staff_anna",
  },
  {
    id: "id4",
    youngPerson: "yp_alex",
    recordedDate: d(-90),
    idType: "Citizen Card (free for care leavers)",
    status: "Issued",
    applicationDate: d(-100),
    costPaid: 0,
    fundingSource: "CitizenCard free-for-care-leavers scheme (no cost)",
    documentNumber: "CC-2025-461908",
    issueDate: d(-85),
    expiryDate: d(1730),
    storageLocation: "Held by Alex — wallet",
    childHasOriginal: true,
    copiesKept: ["Photocopy on care file"],
    evidenceProvidedToAuthority: [
      "Local authority confirmation of looked-after-child status",
      "School-issued photo ID as supporting evidence",
    ],
    uniqueChallengesForLAC: [
      "Alex has no passport yet (separate application below) so Citizen Card serves as primary photo ID",
      "Free scheme removed the financial barrier",
    ],
    childVoice: "It's the first proper photo ID I've ever had. I used it to vote at the council by-election — the staff at the polling station accepted it straight away. It's good having something with my face on that proves who I am.",
    staffObservation: "Citizen Card secured for Alex under the free-for-care-leavers scheme. Used as voter ID at the recent council by-election (cross-references voter-registration-civic page) — first time Alex has voted. The card has become Alex's primary photo ID pending the passport renewal below. Alex chose to keep the card on his person.",
    reviewDate: d(365),
    keyWorker: "staff_edward",
  },
  {
    id: "id5",
    youngPerson: "yp_alex",
    recordedDate: d(-14),
    idType: "British Passport",
    status: "Application submitted",
    applicationDate: d(-7),
    costPaid: 88.50,
    fundingSource: "Local Authority — s.23B(8) Children Act 1989 duty",
    documentNumber: undefined,
    issueDate: undefined,
    expiryDate: d(45),
    storageLocation: "Old passport held in office safe pending new issue",
    childHasOriginal: false,
    copiesKept: ["Old passport retained until new one arrives", "Photocopy of old passport on care file"],
    evidenceProvidedToAuthority: [
      "Old (expiring) British Passport",
      "New countersigned photograph",
      "Local authority confirmation of corporate parent status",
    ],
    uniqueChallengesForLAC: [
      "Renewal triggered by upcoming expiry — staff calendar reminder set six months ahead caught the deadline",
      "Countersignature from PA again required (no parental signature available)",
      "Cost £88.50 met by placement budget under s.23B(8) duty",
    ],
    childVoice: "I want the new passport before my school trip in the summer. I'm a bit worried the old one expires before the new one comes. Karen says it should be fine.",
    staffObservation: "Renewal application submitted online seven days ago after the expiry alarm fired six months out. Old passport retained as required by HMPO until new document issued. Karen (social worker) and the Personal Adviser are tracking the application; status currently 'Application submitted' awaiting HMPO biometric appointment. Cost £88.50 (online adult fee) met from placement budget.",
    reviewDate: d(28),
    keyWorker: "staff_edward",
  },
  {
    id: "id6",
    youngPerson: "yp_casey",
    recordedDate: d(-3),
    idType: "PASS card",
    status: "Considering / planning",
    applicationDate: undefined,
    costPaid: undefined,
    fundingSource: "TBD — awaiting decision",
    documentNumber: undefined,
    issueDate: undefined,
    expiryDate: undefined,
    storageLocation: "N/A — not yet issued",
    childHasOriginal: false,
    copiesKept: [],
    evidenceProvidedToAuthority: [],
    uniqueChallengesForLAC: [
      "Casey is under 16 — most adult schemes (Citizen Card free-for-care-leavers, voter ID) not yet applicable",
      "Discussion opened with social worker Fiona Brennan about appropriate under-16 photo ID",
      "No fixed proof-of-address documents in Casey's name — utility bills are in placement name",
      "Parental consent unavailable; corporate parent route required",
    ],
    childVoice: "My friends have got cards from school for the school bus. I don't know what I need but Chervelle said we'd talk about it. I'd like something with my photo on so I can prove I'm me.",
    staffObservation: "Discussion opened during keywork session with Casey about under-16 photo ID options. PASS-accredited under-16 cards (e.g. CitizenCard under-16) are the most appropriate route — they prove age and identity without requiring a passport. Raised with Fiona Brennan (social worker) at last LAC review; agreed to revisit at next Pathway Plan precursor meeting in four weeks. No application made yet — placeholder record to track the conversation and prevent it being forgotten.",
    reviewDate: d(28),
    keyWorker: "staff_chervelle",
  },
];

/* ── component ─────────────────────────────────────────────────────────────── */

export default function ChildPhotoIdApplicationTrackerPage() {
  const [data] = useState<IdRecord[]>(SEED);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (id: string) => setExpanded(expanded === id ? null : id);

  const filtered = useMemo(() => {
    let out = [...data];
    if (search) {
      const s = search.toLowerCase();
      out = out.filter(r =>
        getYPName(r.youngPerson).toLowerCase().includes(s) ||
        r.idType.toLowerCase().includes(s) ||
        r.status.toLowerCase().includes(s) ||
        (r.documentNumber ?? "").toLowerCase().includes(s)
      );
    }
    if (typeFilter !== "all") out = out.filter(r => r.idType === typeFilter);
    out.sort((a, b) => {
      switch (sortBy) {
        case "name": return getYPName(a.youngPerson).localeCompare(getYPName(b.youngPerson));
        case "type": return a.idType.localeCompare(b.idType);
        case "status": return a.status.localeCompare(b.status);
        case "expiry": {
          const av = a.expiryDate ?? "9999-12-31";
          const bv = b.expiryDate ?? "9999-12-31";
          return av.localeCompare(bv);
        }
        case "cost": return (b.costPaid ?? 0) - (a.costPaid ?? 0);
        default: return 0;
      }
    });
    return out;
  }, [data, search, typeFilter, sortBy]);

  const issuedCount = data.filter(r => r.status === "Issued").length;
  const inProgressCount = data.filter(r =>
    r.status === "Documents being gathered" ||
    r.status === "Application drafted" ||
    r.status === "Application submitted" ||
    r.status === "Awaiting biometrics" ||
    r.status === "Lost / replacement applied"
  ).length;
  const expiringSoonCount = data.filter(r => {
    const days = daysUntil(r.expiryDate);
    return r.status === "Issued" && days !== null && days <= 90 && days >= 0;
  }).length;
  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  const totalCostYTD = data
    .filter(r => (r.applicationDate ?? "") >= yearStart)
    .reduce((s, r) => s + (r.costPaid ?? 0), 0);

  const exportCols: ExportColumn<IdRecord>[] = useMemo(() => [
    { header: "Young Person", accessor: (r: IdRecord) => getYPName(r.youngPerson) },
    { header: "Recorded Date", accessor: (r: IdRecord) => r.recordedDate },
    { header: "ID Type", accessor: (r: IdRecord) => r.idType },
    { header: "Status", accessor: (r: IdRecord) => r.status },
    { header: "Application Date", accessor: (r: IdRecord) => r.applicationDate ?? "" },
    { header: "Cost Paid", accessor: (r: IdRecord) => r.costPaid !== undefined ? fmtGBP(r.costPaid) : "" },
    { header: "Funding Source", accessor: (r: IdRecord) => r.fundingSource ?? "" },
    { header: "Document Number", accessor: (r: IdRecord) => r.documentNumber ?? "" },
    { header: "Issue Date", accessor: (r: IdRecord) => r.issueDate ?? "" },
    { header: "Expiry Date", accessor: (r: IdRecord) => r.expiryDate ?? "" },
    { header: "Storage Location", accessor: (r: IdRecord) => r.storageLocation },
    { header: "Child Has Original", accessor: (r: IdRecord) => r.childHasOriginal ? "Yes" : "No" },
    { header: "Copies Kept", accessor: (r: IdRecord) => r.copiesKept.join("; ") },
    { header: "Evidence Provided", accessor: (r: IdRecord) => r.evidenceProvidedToAuthority.join("; ") },
    { header: "LAC Challenges", accessor: (r: IdRecord) => r.uniqueChallengesForLAC.join("; ") },
    { header: "Child Voice", accessor: (r: IdRecord) => r.childVoice },
    { header: "Staff Observation", accessor: (r: IdRecord) => r.staffObservation },
    { header: "Review Date", accessor: (r: IdRecord) => r.reviewDate },
    { header: "Key Worker", accessor: (r: IdRecord) => getStaffName(r.keyWorker) },
  ], []);

  return (
    <PageShell
      title="Child Photo ID Application Tracker"
      subtitle="Passport, provisional licence, Citizen Card, voter ID and under-16 photo ID applications, renewals and storage — Care Leavers (England) Regulations 2010 and s.23B(8) Children Act 1989"
      actions={[
        <PrintButton key="p" title="Photo ID Applications" />,
        <ExportButton key="e" data={filtered} columns={exportCols} filename="child-photo-id-application-tracker" />,
      ]}
    >
      <div id="print-area" className="space-y-6">

        {/* stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "IDs Issued", value: issuedCount, icon: ShieldCheck, colour: "text-green-600" },
            { label: "Applications In Progress", value: inProgressCount, icon: FileText, colour: "text-sky-600" },
            { label: "Expiring within 90 days", value: expiringSoonCount, icon: Calendar, colour: "text-orange-600" },
            { label: "Total Cost YTD", value: fmtGBP(totalCostYTD), icon: Camera, colour: "text-teal-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 flex items-center gap-3">
                <s.icon className={cn("h-8 w-8", s.colour)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* filter bar */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-8" placeholder="Name, ID type, status, document number…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="w-64">
                <Label className="text-xs">ID Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ID types</SelectItem>
                    {ID_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-44">
                <Label className="text-xs flex items-center gap-1"><ArrowUpDown className="h-3 w-3" />Sort</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="type">ID Type</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="expiry">Expiry Date</SelectItem>
                    <SelectItem value="cost">Cost Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* records */}
        <div className="space-y-3">
          {filtered.map(r => {
            const open = expanded === r.id;
            const days = daysUntil(r.expiryDate);
            const expiringSoon = r.status === "Issued" && days !== null && days <= 90 && days >= 0;
            const expired = days !== null && days < 0 && r.status !== "Renewal due";

            return (
              <Card key={r.id} className="border-l-4 border-sky-400 bg-sky-50/30">
                <button className="w-full text-left" onClick={() => toggle(r.id)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{getYPName(r.youngPerson)}</CardTitle>
                        <Badge className={cn("text-xs", ID_TYPE_CLR[r.idType])}>{r.idType}</Badge>
                        <Badge className={cn("text-xs", STATUS_CLR[r.status])}>{r.status}</Badge>
                        {r.expiryDate && (
                          <Badge variant="outline" className={cn("text-xs", expiringSoon && "bg-orange-100 text-orange-800 border-orange-300", expired && "bg-red-100 text-red-800 border-red-300")}>
                            Expires {r.expiryDate}{days !== null && ` (${days >= 0 ? `${days}d` : `${Math.abs(days)}d ago`})`}
                          </Badge>
                        )}
                        <Badge variant="outline" className={cn("text-xs", r.childHasOriginal ? "bg-teal-50 text-teal-800 border-teal-300" : "bg-slate-50 text-slate-700")}>
                          {r.childHasOriginal ? "Child holds original" : "Held by placement"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Recorded: {r.recordedDate}</span>
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </CardHeader>
                </button>

                {open && (
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border bg-white p-3 space-y-1">
                        <p className="text-xs font-semibold text-sky-800 flex items-center gap-1"><FileText className="h-3 w-3" />Application</p>
                        <p className="text-xs">Application date: <strong>{r.applicationDate ?? "—"}</strong></p>
                        <p className="text-xs">Cost paid: <strong>{r.costPaid !== undefined ? fmtGBP(r.costPaid) : "—"}</strong></p>
                        <p className="text-xs">Funding: <strong>{r.fundingSource ?? "—"}</strong></p>
                      </div>
                      <div className="rounded-lg border bg-white p-3 space-y-1">
                        <p className="text-xs font-semibold text-teal-800 flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Document</p>
                        <p className="text-xs">Document number: <span className="font-mono">{r.documentNumber ?? "—"}</span></p>
                        <p className="text-xs">Issued: <strong>{r.issueDate ?? "—"}</strong></p>
                        <p className="text-xs">Expires: <strong>{r.expiryDate ?? "—"}</strong></p>
                      </div>
                    </div>

                    {/* storage */}
                    <div className="rounded-lg border bg-white p-3 text-sm space-y-1">
                      <p className="text-xs font-semibold text-blue-800 flex items-center gap-1"><Camera className="h-3 w-3" />Storage and Copies</p>
                      <p className="text-xs">Storage location: <strong>{r.storageLocation}</strong></p>
                      <p className="text-xs">Child has original: <strong>{r.childHasOriginal ? "Yes" : "No"}</strong></p>
                      {r.copiesKept.length > 0 && (
                        <ul className="list-disc list-inside text-xs space-y-0.5 mt-1">
                          {r.copiesKept.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      )}
                    </div>

                    {/* evidence */}
                    {r.evidenceProvidedToAuthority.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1 flex items-center gap-1"><FileText className="h-3 w-3" />Evidence Provided to Issuing Authority</p>
                        <ul className="list-disc list-inside text-sm space-y-0.5">
                          {r.evidenceProvidedToAuthority.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* LAC challenges */}
                    {r.uniqueChallengesForLAC.length > 0 && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                        <p className="text-xs font-semibold text-amber-900 mb-1">Unique Challenges for Looked-After Children</p>
                        <ul className="list-disc list-inside text-sm space-y-0.5 text-amber-900">
                          {r.uniqueChallengesForLAC.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* child voice */}
                    <div className="rounded-lg bg-sky-50 border border-sky-200 p-3">
                      <p className="text-xs font-semibold text-sky-800 mb-1">Child&apos;s Voice</p>
                      <p className="text-sm italic">&ldquo;{r.childVoice}&rdquo;</p>
                    </div>

                    {/* staff observation */}
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Staff Observation</p>
                      <p className="text-sm">{r.staffObservation}</p>
                    </div>

                    {/* meta */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Key Worker: <strong>{getStaffName(r.keyWorker)}</strong></span>
                      <span>Review Date: <strong>{r.reviewDate}</strong></span>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* regulatory note */}
        <div className="rounded-lg bg-muted/40 border p-4 text-xs text-muted-foreground space-y-1">
          <p className="font-semibold">Regulatory Framework</p>
          <p>Photo ID provision for looked-after children and care leavers is recorded under the Care Leavers (England) Regulations 2010 and section 23B(8) of the Children Act 1989, which places a duty on the local authority (as corporate parent) to assist care leavers in obtaining identity documents. The CitizenCard free-for-care-leavers scheme provides PASS-accredited photo ID at no cost. Photo Voter ID provision aligns with the Elections Act 2022 — a Citizen Card or passport is an accepted form. Pathway Plan reviews ensure ID is in place before a young person needs it for voting, banking, travel or employment. The work supports UNCRC Article 7 (right to identity registration) and Article 8 (preserving identity). Without ID, looked-after children disproportionately face barriers to voting, banking, accessing healthcare records, travel, employment and housing — this tracker exists to prevent that.</p>
        </div>
      </div>
    </PageShell>
  );
}
