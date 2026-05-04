"use client";

import { useState, useMemo } from "react";
import {
  KeyRound, Search, ArrowUpDown, Filter,
  AlertTriangle, CheckCircle2, Clock,
  ChevronDown, ChevronUp, XCircle, HelpCircle,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";

/* ── helpers ─────────────────────────────────────────────────────────── */
const d = (n: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() + n);
  return dt.toISOString().slice(0, 10);
};

/* ── types ───────────────────────────────────────────────────────────── */
const AUTH_STATUSES = ["granted", "not_granted", "partial", "pending"] as const;
type AuthStatus = typeof AUTH_STATUSES[number];
const STATUS_COLORS: Record<AuthStatus, string> = {
  granted: "bg-green-100 text-green-800", not_granted: "bg-red-100 text-red-800",
  partial: "bg-yellow-100 text-yellow-800", pending: "bg-slate-100 text-slate-800",
};
const STATUS_LABELS: Record<AuthStatus, string> = {
  granted: "Granted", not_granted: "Not Granted",
  partial: "Partial", pending: "Pending",
};

const CATEGORIES = [
  "medical", "education", "leisure", "overnight_stays",
  "travel", "haircut_appearance", "social_media", "religion",
  "pocket_money", "contact", "photography", "emergency",
] as const;
type Category = typeof CATEGORIES[number];
const CAT_LABELS: Record<Category, string> = {
  medical: "Medical Consent", education: "Education Decisions",
  leisure: "Leisure & Activities", overnight_stays: "Overnight Stays",
  travel: "Travel & Holidays", haircut_appearance: "Haircut / Appearance",
  social_media: "Social Media / Phone", religion: "Religion & Culture",
  pocket_money: "Pocket Money / Spending", contact: "Contact Arrangements",
  photography: "Photography / Media", emergency: "Emergency Decisions",
};

interface DelegatedItem {
  category: Category;
  status: AuthStatus;
  detail: string;
  conditions: string;
  grantedBy: string;
  grantedDate: string;
  reviewDate: string;
}

interface DelegatedAuthority {
  id: string;
  youngPersonId: string;
  lastReviewed: string;
  nextReview: string;
  items: DelegatedItem[];
  notes: string;
}

/* ── seed data ───────────────────────────────────────────────────────── */
const SEED: DelegatedAuthority[] = [
  {
    id: "da_1", youngPersonId: "yp_alex", lastReviewed: d(-30), nextReview: d(60),
    items: [
      { category: "medical", status: "granted", detail: "Home can consent to routine medical and dental appointments. GP, dentist, optician.", conditions: "Emergency medical only — notify SW within 24 hours.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "education", status: "granted", detail: "Home can make day-to-day education decisions. School trips within UK, parents' evenings, PEP attendance.", conditions: "School changes require LA consultation.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "leisure", status: "granted", detail: "Home can authorise local activities, sports clubs, youth groups.", conditions: "Overnight activities require SW approval.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "overnight_stays", status: "not_granted", detail: "Overnight stays with friends NOT delegated.", conditions: "Must be approved by SW on a case-by-case basis. Risk assessment required for each request.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "travel", status: "partial", detail: "Day trips within England and Wales — delegated. Overseas travel — NOT delegated.", conditions: "International travel requires court order / SW written consent.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "haircut_appearance", status: "granted", detail: "Home can consent to haircuts and reasonable appearance changes.", conditions: "Significant changes (e.g. piercings, tattoos) NOT included — must consult SW and parent.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "social_media", status: "granted", detail: "Home manages age-appropriate social media access with agreed boundaries.", conditions: "Privacy settings must be reviewed. No public profiles. Phone boundaries as per care plan.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-30), reviewDate: d(60) },
      { category: "religion", status: "granted", detail: "Alex's wishes regarding religion are respected. No compulsory attendance.", conditions: "If Alex expresses interest in attending a place of worship, facilitate.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "pocket_money", status: "granted", detail: "Home provides agreed pocket money per placement plan.", conditions: "Amount reviewed at each LAC review.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "contact", status: "partial", detail: "Home facilitates contact as per contact plan. Additional phone contact can be agreed by home.", conditions: "Any changes to face-to-face contact must be agreed with SW.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "photography", status: "granted", detail: "Home can include Alex in general home photos for life story and records.", conditions: "No images on social media or public platforms. School photos — consent given.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
      { category: "emergency", status: "granted", detail: "Home can make emergency decisions to safeguard Alex.", conditions: "Notify SW as soon as reasonably practicable after any emergency action.", grantedBy: "Sarah Mitchell (SW)", grantedDate: d(-90), reviewDate: d(60) },
    ],
    notes: "Alex's delegated authority is well-established. Overnight stays remain not delegated due to previous safeguarding concerns — reviewed at each LAC review. Social media boundaries updated following recent incident.",
  },
  {
    id: "da_2", youngPersonId: "yp_jordan", lastReviewed: d(-14), nextReview: d(76),
    items: [
      { category: "medical", status: "granted", detail: "Routine medical appointments delegated.", conditions: "Non-routine or surgical referrals — notify SW and parent.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "education", status: "granted", detail: "Day-to-day education decisions delegated.", conditions: "None specified.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "leisure", status: "granted", detail: "All local leisure activities delegated.", conditions: "None specified.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "overnight_stays", status: "pending", detail: "Under discussion — Jordan has requested a sleepover at a school friend's home.", conditions: "Risk assessment to be completed. DBS not required for short stays but home visit recommended.", grantedBy: "Tom Richards (SW)", grantedDate: d(-14), reviewDate: d(30) },
      { category: "travel", status: "granted", detail: "UK travel delegated.", conditions: "Passport held by SW. International travel not delegated.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "haircut_appearance", status: "granted", detail: "Standard haircuts and age-appropriate appearance changes.", conditions: "None specified.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "social_media", status: "granted", detail: "Age-appropriate access managed by home.", conditions: "Home to monitor. Jordan currently has minimal social media use.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "contact", status: "partial", detail: "Maternal contact facilitated by home. Paternal contact supervised only.", conditions: "Paternal contact must be supervised by staff. Changes require SW agreement.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "photography", status: "granted", detail: "Home photos for records and life story.", conditions: "No public platforms.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
      { category: "emergency", status: "granted", detail: "Emergency safeguarding decisions delegated.", conditions: "Notify SW within 24 hours.", grantedBy: "Tom Richards (SW)", grantedDate: d(-150), reviewDate: d(76) },
    ],
    notes: "Jordan's delegated authority is clear. Overnight stay request is currently being discussed with SW — Jordan keen to accept a friend's invitation. Paternal contact remains supervised per court order.",
  },
  {
    id: "da_3", youngPersonId: "yp_casey", lastReviewed: d(-45), nextReview: d(45),
    items: [
      { category: "medical", status: "granted", detail: "Routine and CAMHS appointments delegated.", conditions: "Medication changes — notify SW and mother.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "education", status: "granted", detail: "College decisions delegated. Course changes may be made.", conditions: "Notify SW of any course changes.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "leisure", status: "granted", detail: "All activities delegated. Casey has good independence skills.", conditions: "Casey can attend local activities independently where risk assessed.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "overnight_stays", status: "granted", detail: "Overnight stays with approved friends delegated.", conditions: "Must be risk assessed. Parent contact details obtained. Maximum 2 nights.", grantedBy: "Lisa Park (SW)", grantedDate: d(-100), reviewDate: d(45) },
      { category: "travel", status: "granted", detail: "UK travel delegated.", conditions: "None specified.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "haircut_appearance", status: "granted", detail: "Full delegation.", conditions: "Casey's mother to be consulted on significant changes as a courtesy.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "social_media", status: "granted", detail: "Age-appropriate access. Casey manages responsibly.", conditions: "Standard monitoring by home.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "contact", status: "granted", detail: "Home facilitates contact per plan. Mother has open access for phone calls.", conditions: "None — positive contact arrangement.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "photography", status: "granted", detail: "Full consent for records, life story, and college portfolio.", conditions: "No social media posts without Casey's consent.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
      { category: "emergency", status: "granted", detail: "Emergency decisions delegated.", conditions: "Standard notification protocol.", grantedBy: "Lisa Park (SW)", grantedDate: d(-310), reviewDate: d(45) },
    ],
    notes: "Casey has the most comprehensive delegated authority reflecting their age, maturity, and strong parental relationship. Mother is supportive and involved. All categories actively delegated.",
  },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function DelegatedAuthorityPage() {
  const [records] = useState<DelegatedAuthority[]>(SEED);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const ypIds = ["yp_alex", "yp_jordan", "yp_casey"];

  /* per-child stats */
  const ypStats = records.map((r) => {
    const granted = r.items.filter((i) => i.status === "granted").length;
    const notGranted = r.items.filter((i) => i.status === "not_granted").length;
    const partial = r.items.filter((i) => i.status === "partial").length;
    const pending = r.items.filter((i) => i.status === "pending").length;
    const reviewDue = r.nextReview < today;
    return { id: r.youngPersonId, name: getYPName(r.youngPersonId), granted, notGranted, partial, pending, reviewDue, total: r.items.length };
  });

  const totalPending = records.reduce((s, r) => s + r.items.filter((i) => i.status === "pending").length, 0);
  const reviewsDue = records.filter((r) => r.nextReview < today).length;

  /* flatten for export */
  const exportData = useMemo(() => {
    return records.flatMap((r) =>
      r.items.map((item) => ({ youngPersonId: r.youngPersonId, lastReviewed: r.lastReviewed, nextReview: r.nextReview, ...item }))
    );
  }, [records]);

  type ExportRow = DelegatedItem & { youngPersonId: string; lastReviewed: string; nextReview: string };

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => getYPName(r.youngPersonId) },
    { header: "Category", accessor: (r: ExportRow) => CAT_LABELS[r.category] },
    { header: "Status", accessor: (r: ExportRow) => STATUS_LABELS[r.status] },
    { header: "Detail", accessor: (r: ExportRow) => r.detail },
    { header: "Conditions", accessor: (r: ExportRow) => r.conditions },
    { header: "Granted By", accessor: (r: ExportRow) => r.grantedBy },
    { header: "Granted Date", accessor: (r: ExportRow) => r.grantedDate },
    { header: "Review Date", accessor: (r: ExportRow) => r.reviewDate },
    { header: "Last Reviewed", accessor: (r: ExportRow) => r.lastReviewed },
    { header: "Next Review", accessor: (r: ExportRow) => r.nextReview },
  ];

  const StatusIcon = ({ status }: { status: AuthStatus }) => {
    switch (status) {
      case "granted": return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "not_granted": return <XCircle className="h-4 w-4 text-red-600" />;
      case "partial": return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "pending": return <HelpCircle className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <PageShell
      title="Delegated Authority"
      subtitle="Regulation 20 — decisions the home is authorised to make for each child"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Delegated Authority" />
          <ExportButton data={exportData} columns={exportCols} filename="delegated-authority" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Young People", value: records.length, icon: KeyRound, colour: "text-blue-600" },
            { label: "Pending Decisions", value: totalPending, icon: Clock, colour: totalPending > 0 ? "text-orange-600" : "text-slate-400" },
            { label: "Reviews Due", value: reviewsDue, icon: AlertTriangle, colour: reviewsDue > 0 ? "text-red-600" : "text-green-600" },
            { label: "Total Delegations", value: records.reduce((s, r) => s + r.items.length, 0), icon: CheckCircle2, colour: "text-green-600" },
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

        {/* ── per-child summary ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ypStats.map((yp) => (
            <div key={yp.id} className={cn("rounded-xl border bg-white p-4", yp.reviewDue && "border-orange-300")}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-medium">{yp.name}</p>
                {yp.reviewDue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Review Due</Badge>}
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-green-600">{yp.granted}</p>
                  <p className="text-[10px] text-muted-foreground">Granted</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-yellow-600">{yp.partial}</p>
                  <p className="text-[10px] text-muted-foreground">Partial</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-red-600">{yp.notGranted}</p>
                  <p className="text-[10px] text-muted-foreground">Not Granted</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-400">{yp.pending}</p>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── per-child detail ──────────────────────────────────── */}
        <div className="space-y-3">
          {records.map((record) => {
            const isExpanded = expanded === record.id;
            const yp = ypStats.find((y) => y.id === record.youngPersonId)!;

            return (
              <div key={record.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : record.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <KeyRound className="h-5 w-5 text-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(record.youngPersonId)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last reviewed: {record.lastReviewed} · Next: {record.nextReview} · {yp.granted}/{yp.total} granted
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {yp.pending > 0 && <Badge variant="outline" className="text-xs bg-slate-50">{yp.pending} pending</Badge>}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-3">
                    {record.items.map((item: DelegatedItem, idx: number) => (
                      <div key={idx} className={cn("rounded-lg border p-3 text-sm",
                        item.status === "granted" ? "bg-green-50 border-green-200" :
                        item.status === "not_granted" ? "bg-red-50 border-red-200" :
                        item.status === "partial" ? "bg-yellow-50 border-yellow-200" :
                        "bg-white"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <StatusIcon status={item.status} />
                          <span className="font-medium">{CAT_LABELS[item.category]}</span>
                          <Badge className={cn("text-xs ml-auto", STATUS_COLORS[item.status])}>
                            {STATUS_LABELS[item.status]}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{item.detail}</p>
                        {item.conditions && (
                          <p className="text-xs"><strong>Conditions:</strong> {item.conditions}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Granted by: {item.grantedBy} · {item.grantedDate} · Review: {item.reviewDate}
                        </p>
                      </div>
                    ))}

                    {record.notes && (
                      <div className="rounded-lg bg-white border p-3 mt-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p className="text-sm">{record.notes}</p>
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
          <strong>Regulation 20:</strong> The placing authority must set out in the placement plan the
          decisions which the registered person is authorised to make on behalf of the child. This must
          be clear, documented, and reviewed regularly. Staff should know what decisions they can and
          cannot make. Delegated authority supports normalised experiences for children in care and
          avoids unnecessary delays in day-to-day decision-making.
        </div>
      </div>
    </PageShell>
  );
}
