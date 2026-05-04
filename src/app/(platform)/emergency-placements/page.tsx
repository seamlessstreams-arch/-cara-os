"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle, Phone, Clock, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, HelpCircle, Shield, PhoneCall,
  Mail, Search, ArrowUpDown, Timer,
} from "lucide-react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getStaffName } from "@/lib/seed-data";

// ── Types ────────────────────────────────────────────────────────────────────
type EmergencyStatus = "accepted_emergency" | "declined" | "pending_capacity";
type ContactMethod = "phone" | "email";
type UrgencyLevel = "immediate" | "same_day" | "24_hours";

interface EmergencyReferral {
  id: string;
  childRef: string;
  age: number;
  gender: string;
  requestTime: string;
  requestDate: string;
  requestingAuthority: string;
  contactPerson: string;
  contactMethod: ContactMethod;
  reason: string;
  urgencyLevel: UrgencyLevel;
  status: EmergencyStatus;
  respondedBy: string;
  responseTime: number;
  declineReason: string | null;
  admissionDate: string | null;
  notes: string;
  outOfHours: boolean;
}

const STATUS_META: Record<EmergencyStatus, { label: string; color: string }> = {
  accepted_emergency: { label: "Accepted (Emergency)", color: "bg-green-100 text-green-800" },
  declined:           { label: "Declined",             color: "bg-red-100 text-red-800" },
  pending_capacity:   { label: "Pending Capacity",     color: "bg-amber-100 text-amber-800" },
};

const URGENCY_META: Record<UrgencyLevel, { label: string; color: string }> = {
  immediate: { label: "Immediate",  color: "bg-red-100 text-red-800" },
  same_day:  { label: "Same Day",   color: "bg-amber-100 text-amber-800" },
  "24_hours": { label: "Within 24h", color: "bg-blue-100 text-blue-800" },
};

// ── Seed data ────────────────────────────────────────────────────────────────
const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const SEED: EmergencyReferral[] = [
  {
    id: "emr_001",
    childRef: "Child W",
    age: 14,
    gender: "Female",
    requestTime: "23:45",
    requestDate: d(-12),
    requestingAuthority: "Warwickshire County Council (EDT out-of-hours team)",
    contactPerson: "EDT Duty Social Worker",
    contactMethod: "phone",
    reason: "Police protection order after domestic violence incident",
    urgencyLevel: "immediate",
    status: "declined",
    respondedBy: "staff_darren",
    responseTime: 20,
    declineReason: "Home at capacity (3/3). Referred to 2 alternative homes.",
    admissionDate: null,
    notes: "Received call from EDT at 23:45. Home full. Unable to accommodate. Contacted Maple Lodge and Cedar House — Cedar House had capacity. Updated EDT.",
    outOfHours: true,
  },
  {
    id: "emr_002",
    childRef: "Child X",
    age: 13,
    gender: "Male",
    requestTime: "19:30",
    requestDate: d(-90),
    requestingAuthority: "Birmingham EDT",
    contactPerson: "Birmingham Emergency Duty Team",
    contactMethod: "phone",
    reason: "Previous placement broke down (foster carer gave notice with immediate effect)",
    urgencyLevel: "immediate",
    status: "accepted_emergency",
    respondedBy: "staff_darren",
    responseTime: 15,
    declineReason: null,
    admissionDate: d(-90),
    notes: "Emergency admission agreed by RM (Darren) and RI. Impact assessment completed retrospectively within 24 hours. Child settled well initially.",
    outOfHours: true,
  },
  {
    id: "emr_003",
    childRef: "Child Y",
    age: 16,
    gender: "Female",
    requestTime: "02:00",
    requestDate: d(-45),
    requestingAuthority: "West Midlands Police / Coventry CC EDT",
    contactPerson: "Sgt. K. Phillips / Coventry EDT",
    contactMethod: "phone",
    reason: "Absconded from another home, found by police, refuses to return",
    urgencyLevel: "immediate",
    status: "declined",
    respondedBy: "staff_darren",
    responseTime: 25,
    declineReason: "Not appropriate match — CSE risk would compound existing dynamics with Casey",
    admissionDate: null,
    notes: "Careful consideration given but CSE risk profile would negatively impact Casey’s safety plan. Declined with full explanation to EDT.",
    outOfHours: true,
  },
  {
    id: "emr_004",
    childRef: "Child Z",
    age: 11,
    gender: "Male",
    requestTime: "09:00",
    requestDate: d(-7),
    requestingAuthority: "Sandwell Children’s Services",
    contactPerson: "Amy Hartwell — Referrals Co-ordinator",
    contactMethod: "email",
    reason: "Section 20 voluntary care — family crisis",
    urgencyLevel: "same_day",
    status: "pending_capacity",
    respondedBy: "staff_ryan",
    responseTime: 35,
    declineReason: null,
    admissionDate: null,
    notes: "Not a true emergency but marked as urgent. Good matching profile. Added to referral tracker as priority.",
    outOfHours: false,
  },
];

// ── Export columns ────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<EmergencyReferral>[] = [
  { header: "ID",                  accessor: (r: EmergencyReferral) => r.id },
  { header: "Child Ref",           accessor: (r: EmergencyReferral) => r.childRef },
  { header: "Age",                 accessor: (r: EmergencyReferral) => String(r.age) },
  { header: "Gender",              accessor: (r: EmergencyReferral) => r.gender },
  { header: "Request Date",        accessor: (r: EmergencyReferral) => r.requestDate },
  { header: "Request Time",        accessor: (r: EmergencyReferral) => r.requestTime },
  { header: "Out of Hours",        accessor: (r: EmergencyReferral) => r.outOfHours ? "Yes" : "No" },
  { header: "Requesting Authority", accessor: (r: EmergencyReferral) => r.requestingAuthority },
  { header: "Contact Person",      accessor: (r: EmergencyReferral) => r.contactPerson },
  { header: "Contact Method",      accessor: (r: EmergencyReferral) => r.contactMethod },
  { header: "Reason",              accessor: (r: EmergencyReferral) => r.reason },
  { header: "Urgency",             accessor: (r: EmergencyReferral) => URGENCY_META[r.urgencyLevel].label },
  { header: "Status",              accessor: (r: EmergencyReferral) => STATUS_META[r.status].label },
  { header: "Responded By",        accessor: (r: EmergencyReferral) => getStaffName(r.respondedBy) },
  { header: "Response Time (mins)", accessor: (r: EmergencyReferral) => String(r.responseTime) },
  { header: "Decline Reason",      accessor: (r: EmergencyReferral) => r.declineReason || "—" },
  { header: "Admission Date",      accessor: (r: EmergencyReferral) => r.admissionDate || "—" },
  { header: "Notes",               accessor: (r: EmergencyReferral) => r.notes },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function EmergencyPlacementsPage() {
  const [referrals] = useState<EmergencyReferral[]>(SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  // ── Filtering & sorting ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...referrals];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.childRef.toLowerCase().includes(s) ||
          r.requestingAuthority.toLowerCase().includes(s) ||
          r.reason.toLowerCase().includes(s) ||
          r.notes.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.requestDate.localeCompare(a.requestDate);
        case "urgency":  return a.urgencyLevel.localeCompare(b.urgencyLevel);
        case "response": return a.responseTime - b.responseTime;
        default:         return 0;
      }
    });
    return list;
  }, [referrals, search, statusFilter, sortBy]);

  // ── Summary stats (rolling 12-month view) ────────────────────────────────
  const stats = useMemo(() => {
    const total = referrals.length;
    const accepted = referrals.filter((r) => r.status === "accepted_emergency").length;
    const acceptedPct = total > 0 ? Math.round((accepted / total) * 100) : 0;
    const avgResponse = total > 0 ? Math.round(referrals.reduce((sum, r) => sum + r.responseTime, 0) / total) : 0;
    const ooh = referrals.filter((r) => r.outOfHours).length;
    return { total, accepted, acceptedPct, avgResponse, ooh };
  }, [referrals]);

  return (
    <PageShell
      title="Emergency & Out-of-Hours Placements"
      subtitle="Urgent referrals, emergency admissions, and out-of-hours placement requests"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency & Out-of-Hours Placements" />
          <ExportButton data={filtered} columns={EXPORT_COLS} filename="emergency-placements" />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── Summary Stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Requests (12 mo)", value: stats.total,                     icon: <PhoneCall className="h-4 w-4" />, color: "text-blue-600" },
            { label: "Accepted",               value: `${stats.accepted} (${stats.acceptedPct}%)`, icon: <CheckCircle2 className="h-4 w-4" />, color: "text-green-600" },
            { label: "Avg Response Time",       value: `${stats.avgResponse} mins`,    icon: <Timer className="h-4 w-4" />,      color: "text-amber-600" },
            { label: "Out-of-Hours",            value: stats.ooh,                      icon: <Clock className="h-4 w-4" />,      color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-3 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-muted", s.color)}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Filters ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search emergency referrals…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex items-center gap-1">
            {(["all", "accepted_emergency", "declined", "pending_capacity"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
                className="text-xs"
              >
                {s === "all" ? "All" : STATUS_META[s].label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            {(["date", "urgency", "response"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={sortBy === s ? "default" : "ghost"}
                onClick={() => setSortBy(s)}
                className="text-xs capitalize"
              >
                {s === "response" ? "Response Time" : s}
              </Button>
            ))}
          </div>
        </div>

        {/* ── Referral List ─────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No emergency referrals match your filters.</p>
          )}
          {filtered.map((r) => {
            const open = expandedId === r.id;
            const sm = STATUS_META[r.status];
            const um = URGENCY_META[r.urgencyLevel];
            return (
              <Card
                key={r.id}
                className={cn(
                  "border-l-4",
                  r.status === "accepted_emergency"
                    ? "border-l-green-500"
                    : r.status === "declined"
                    ? "border-l-red-500"
                    : "border-l-amber-400"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between cursor-pointer" onClick={() => toggle(r.id)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={cn("text-xs", sm.color)}>{sm.label}</Badge>
                        <Badge className={cn("text-xs", um.color)}>{um.label}</Badge>
                        {r.outOfHours && (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">Out-of-Hours</Badge>
                        )}
                      </div>
                      <p className="font-semibold">{r.childRef} &mdash; Age {r.age}, {r.gender}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.requestDate} at {r.requestTime}
                        </span>
                        <span>{r.requestingAuthority}</span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" /> Response: {r.responseTime} mins
                        </span>
                      </div>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 mt-1 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mt-1 text-muted-foreground" />
                    )}
                  </div>

                  {open && (
                    <div className="mt-4 space-y-3 border-t pt-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Age</p>
                          <p className="font-medium">{r.age}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="font-medium">{r.gender}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Method</p>
                          <p className="font-medium flex items-center gap-1">
                            {r.contactMethod === "phone" ? <Phone className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                            {r.contactMethod === "phone" ? "Phone" : "Email"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Person</p>
                          <p className="font-medium">{r.contactPerson}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Reason for Emergency Request</p>
                        <p className="text-xs">{r.reason}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Responded By</p>
                          <p className="font-medium">{getStaffName(r.respondedBy)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Response Time</p>
                          <p className="font-medium">{r.responseTime} minutes</p>
                        </div>
                        {r.admissionDate && (
                          <div>
                            <p className="text-xs text-muted-foreground">Admission Date</p>
                            <p className="font-medium">{r.admissionDate}</p>
                          </div>
                        )}
                      </div>

                      {r.declineReason && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Reason for Decline</p>
                          <p className="bg-red-50 p-2 rounded text-xs text-red-900">{r.declineReason}</p>
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Notes</p>
                        <p className="italic text-muted-foreground text-xs">{r.notes}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Regulatory Note ───────────────────────────────────────────── */}
        <Card className="bg-muted/40">
          <CardContent className="p-3 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Regulation 14 &mdash; Admissions.</strong> Emergency placements must only be made when the Registered Manager is satisfied the placement is consistent with the home&apos;s Statement of Purpose. Where a child is admitted on an emergency basis, a retrospective impact assessment must be completed within 72 hours, considering the effect on existing children. All out-of-hours requests and decisions must be recorded, including rationale for acceptance or decline, and the Responsible Individual notified at the earliest opportunity.
            </span>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
