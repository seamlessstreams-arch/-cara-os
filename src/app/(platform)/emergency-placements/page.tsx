"use client";

import { useState, useMemo } from "react";
import {
  AlertTriangle, Phone, Clock, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, HelpCircle, Shield, PhoneCall,
  Mail, Search, ArrowUpDown, Timer, Loader2,
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
import type {
  EmergencyReferral,
  EmergencyPlacementStatus,
  EmergencyPlacementContactMethod,
  EmergencyPlacementUrgency,
} from "@/types/extended";
import {
  EMERGENCY_PLACEMENT_STATUS_LABEL,
  EMERGENCY_PLACEMENT_URGENCY_LABEL,
} from "@/types/extended";
import { useEmergencyReferrals } from "@/hooks/use-emergency-referrals";

// ── Meta maps ───────────────────────────────────────────────────────────────
const STATUS_META: Record<EmergencyPlacementStatus, { label: string; color: string }> = {
  accepted_emergency: { label: "Accepted (Emergency)", color: "bg-green-100 text-green-800" },
  declined:           { label: "Declined",             color: "bg-red-100 text-red-800" },
  pending_capacity:   { label: "Pending Capacity",     color: "bg-amber-100 text-amber-800" },
};

const URGENCY_META: Record<EmergencyPlacementUrgency, { label: string; color: string }> = {
  immediate: { label: "Immediate",  color: "bg-red-100 text-red-800" },
  same_day:  { label: "Same Day",   color: "bg-amber-100 text-amber-800" },
  "24_hours": { label: "Within 24h", color: "bg-blue-100 text-blue-800" },
};

// ── Export columns ────────────────────────────────────────────────────────────
const EXPORT_COLS: ExportColumn<EmergencyReferral>[] = [
  { header: "ID",                  accessor: (r: EmergencyReferral) => r.id },
  { header: "Child Ref",           accessor: (r: EmergencyReferral) => r.child_ref },
  { header: "Age",                 accessor: (r: EmergencyReferral) => String(r.age) },
  { header: "Gender",              accessor: (r: EmergencyReferral) => r.gender },
  { header: "Request Date",        accessor: (r: EmergencyReferral) => r.request_date },
  { header: "Request Time",        accessor: (r: EmergencyReferral) => r.request_time },
  { header: "Out of Hours",        accessor: (r: EmergencyReferral) => r.out_of_hours ? "Yes" : "No" },
  { header: "Requesting Authority", accessor: (r: EmergencyReferral) => r.requesting_authority },
  { header: "Contact Person",      accessor: (r: EmergencyReferral) => r.contact_person },
  { header: "Contact Method",      accessor: (r: EmergencyReferral) => r.contact_method },
  { header: "Reason",              accessor: (r: EmergencyReferral) => r.reason },
  { header: "Urgency",             accessor: (r: EmergencyReferral) => EMERGENCY_PLACEMENT_URGENCY_LABEL[r.urgency_level] },
  { header: "Status",              accessor: (r: EmergencyReferral) => EMERGENCY_PLACEMENT_STATUS_LABEL[r.status] },
  { header: "Responded By",        accessor: (r: EmergencyReferral) => getStaffName(r.responded_by) },
  { header: "Response Time (mins)", accessor: (r: EmergencyReferral) => String(r.response_time) },
  { header: "Decline Reason",      accessor: (r: EmergencyReferral) => r.decline_reason || "—" },
  { header: "Admission Date",      accessor: (r: EmergencyReferral) => r.admission_date || "—" },
  { header: "Notes",               accessor: (r: EmergencyReferral) => r.notes },
];

// ══════════════════════════════════════════════════════════════════════════════
export default function EmergencyPlacementsPage() {
  const { data: queryData, isLoading } = useEmergencyReferrals();
  const referrals = queryData?.data ?? [];
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
          r.child_ref.toLowerCase().includes(s) ||
          r.requesting_authority.toLowerCase().includes(s) ||
          r.reason.toLowerCase().includes(s) ||
          r.notes.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);

    list.sort((a, b) => {
      switch (sortBy) {
        case "date":     return b.request_date.localeCompare(a.request_date);
        case "urgency":  return a.urgency_level.localeCompare(b.urgency_level);
        case "response": return a.response_time - b.response_time;
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
    const avgResponse = total > 0 ? Math.round(referrals.reduce((sum, r) => sum + r.response_time, 0) / total) : 0;
    const ooh = referrals.filter((r) => r.out_of_hours).length;
    return { total, accepted, acceptedPct, avgResponse, ooh };
  }, [referrals]);

  if (isLoading) {
    return (
      <PageShell
        title="Emergency & Out-of-Hours Placements"
        subtitle="Urgent referrals, emergency admissions, and out-of-hours placement requests"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageShell>
    );
  }

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
            const um = URGENCY_META[r.urgency_level];
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
                        {r.out_of_hours && (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">Out-of-Hours</Badge>
                        )}
                      </div>
                      <p className="font-semibold">{r.child_ref} &mdash; Age {r.age}, {r.gender}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {r.request_date} at {r.request_time}
                        </span>
                        <span>{r.requesting_authority}</span>
                        <span className="flex items-center gap-1">
                          <Timer className="h-3 w-3" /> Response: {r.response_time} mins
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
                            {r.contact_method === "phone" ? <Phone className="h-3 w-3" /> : <Mail className="h-3 w-3" />}
                            {r.contact_method === "phone" ? "Phone" : "Email"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Contact Person</p>
                          <p className="font-medium">{r.contact_person}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-muted-foreground mb-1">Reason for Emergency Request</p>
                        <p className="text-xs">{r.reason}</p>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Responded By</p>
                          <p className="font-medium">{getStaffName(r.responded_by)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Response Time</p>
                          <p className="font-medium">{r.response_time} minutes</p>
                        </div>
                        {r.admission_date && (
                          <div>
                            <p className="text-xs text-muted-foreground">Admission Date</p>
                            <p className="font-medium">{r.admission_date}</p>
                          </div>
                        )}
                      </div>

                      {r.decline_reason && (
                        <div>
                          <p className="font-medium text-muted-foreground mb-1">Reason for Decline</p>
                          <p className="bg-red-50 p-2 rounded text-xs text-red-900">{r.decline_reason}</p>
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
