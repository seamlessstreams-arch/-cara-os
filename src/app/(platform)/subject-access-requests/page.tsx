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
  Clock, Search, FileText, Lock, Shield, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { useSubjectAccessRequestRecords } from "@/hooks/use-subject-access-request-records";
import type {
  SubjectAccessRequestRecord,
  SubjectAccessRequestType,
  SubjectAccessRequestStatus,
  SubjectAccessRequesterType,
} from "@/types/extended";
import {
  SUBJECT_ACCESS_REQUEST_TYPE_LABEL,
  SUBJECT_ACCESS_REQUEST_STATUS_LABEL,
  SUBJECT_ACCESS_REQUESTER_TYPE_LABEL,
} from "@/types/extended";

/* ── local config (colours not serializable) ────────────────────────────── */

const STATUS_CLR: Record<SubjectAccessRequestStatus, string> = {
  received: "bg-slate-100 text-slate-700",
  identity_verified: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  redaction: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  refused: "bg-red-100 text-red-800",
  extended: "bg-orange-100 text-orange-800",
};

const STATUS_BORDER: Record<SubjectAccessRequestStatus, string> = {
  received: "border-l-slate-400",
  identity_verified: "border-l-blue-400",
  in_progress: "border-l-amber-400",
  redaction: "border-l-purple-400",
  completed: "border-l-green-400",
  refused: "border-l-red-500",
  extended: "border-l-orange-400",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function SubjectAccessRequestsPage() {
  const { data: records = [], isLoading } = useSubjectAccessRequestRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [showNew, setShowNew] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let rows = [...records];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        r.requester_name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.data_subject_id && (r.data_subject_type === "child" ? getYPName(r.data_subject_id) : getStaffName(r.data_subject_id)).toLowerCase().includes(q))
      );
    }
    if (filterStatus !== "all") rows = rows.filter((r) => r.status === filterStatus);
    if (filterType !== "all") rows = rows.filter((r) => r.request_type === filterType);
    rows.sort((a, b) => sortBy === "newest" ? b.date_received.localeCompare(a.date_received) : a.date_received.localeCompare(b.date_received));
    return rows;
  }, [records, search, filterStatus, filterType, sortBy]);

  const total = records.length;
  const open = records.filter((r) => !["completed", "refused"].includes(r.status)).length;
  const completed = records.filter((r) => r.status === "completed").length;
  const approaching = records.filter((r) => {
    if (r.status === "completed" || r.status === "refused") return false;
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);
    const sevenDaysStr = sevenDays.toISOString().slice(0, 10);
    return r.deadline_date >= today && r.deadline_date <= sevenDaysStr;
  }).length;

  const exportCols: ExportColumn<SubjectAccessRequestRecord>[] = [
    { header: "ID", accessor: (r: SubjectAccessRequestRecord) => r.id },
    { header: "Received", accessor: (r: SubjectAccessRequestRecord) => r.date_received },
    { header: "Deadline", accessor: (r: SubjectAccessRequestRecord) => r.deadline_date },
    { header: "Type", accessor: (r: SubjectAccessRequestRecord) => SUBJECT_ACCESS_REQUEST_TYPE_LABEL[r.request_type] },
    { header: "Requester", accessor: (r: SubjectAccessRequestRecord) => r.requester_name },
    { header: "Source", accessor: (r: SubjectAccessRequestRecord) => SUBJECT_ACCESS_REQUESTER_TYPE_LABEL[r.requester_type] },
    { header: "Status", accessor: (r: SubjectAccessRequestRecord) => SUBJECT_ACCESS_REQUEST_STATUS_LABEL[r.status] },
    { header: "Completed", accessor: (r: SubjectAccessRequestRecord) => r.date_completed || "Pending" },
    { header: "DPO Consulted", accessor: (r: SubjectAccessRequestRecord) => r.dpo_consulted ? "Yes" : "No" },
  ];

  if (isLoading) {
    return (
      <PageShell title="Subject Access Requests (SARs)" subtitle="GDPR · UK Data Protection Act 2018 · Information Rights">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Subject Access Requests (SARs)"
      subtitle="GDPR · UK Data Protection Act 2018 · Information Rights"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Subject Access Requests" />
          <ExportButton data={records} columns={exportCols} filename="subject-access-requests" />
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
              {(Object.entries(SUBJECT_ACCESS_REQUEST_STATUS_LABEL) as [SubjectAccessRequestStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Request Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {(Object.entries(SUBJECT_ACCESS_REQUEST_TYPE_LABEL) as [SubjectAccessRequestType, string][]).map(([k, v]) => (
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
            const daysRemaining = Math.ceil((new Date(r.deadline_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={r.id} className={cn("border-l-4", STATUS_BORDER[r.status])}>
                <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpandedId(isOpen ? null : r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {r.requester_name}
                        <Badge variant="outline" className={STATUS_CLR[r.status]}>{SUBJECT_ACCESS_REQUEST_STATUS_LABEL[r.status]}</Badge>
                        <Badge variant="outline" className="bg-muted/50">{SUBJECT_ACCESS_REQUESTER_TYPE_LABEL[r.requester_type]}</Badge>
                        {r.extension_applied && <Badge variant="outline" className="bg-orange-100 text-orange-800">Extended</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {SUBJECT_ACCESS_REQUEST_TYPE_LABEL[r.request_type]} · Received: {r.date_received} · Deadline: {r.deadline_date}
                        {r.data_subject_id && ` · Subject: ${r.data_subject_type === "child" ? getYPName(r.data_subject_id) : getStaffName(r.data_subject_id)}`}
                        {" "}· Handler: {getStaffName(r.handled_by_id)}
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
                    <div className={cn("rounded p-2", r.identity_verified ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200")}>
                      <p className="font-medium text-xs mb-1">{r.identity_verified ? "✓ Identity Verified" : "✗ Identity NOT Verified"}</p>
                      <p className="text-xs">{r.identity_method}</p>
                    </div>

                    {/* data scope */}
                    <div>
                      <p className="font-medium mb-1">Data Scope Requested</p>
                      <div className="flex flex-wrap gap-1">
                        {r.data_scope.map((s, i) => (
                          <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* redactions */}
                    {r.redactions_required && (
                      <div>
                        <p className="font-medium mb-1">Redaction Categories</p>
                        <ul className="space-y-1">
                          {r.redaction_categories.map((c, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs">
                              <Shield className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* extension */}
                    {r.extension_applied && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2">
                        <p className="font-medium text-xs text-orange-800 mb-1">Extension Applied</p>
                        <p className="text-xs text-orange-700">{r.extension_reason}</p>
                      </div>
                    )}

                    {/* timeline */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Received</p>
                        <p className="text-xs font-bold">{r.date_received}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Deadline</p>
                        <p className={cn("text-xs font-bold", daysRemaining <= 3 && r.status !== "completed" ? "text-red-700" : "")}>{r.deadline_date}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">Completed</p>
                        <p className="text-xs font-bold">{r.date_completed || "Pending"}</p>
                      </div>
                      <div className="bg-muted/40 rounded p-2 text-center">
                        <p className="font-medium text-xs">DPO Consulted</p>
                        <p className={cn("text-xs font-bold", r.dpo_consulted ? "text-green-700" : "text-slate-500")}>{r.dpo_consulted ? "Yes" : "No"}</p>
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
                  {(Object.entries(SUBJECT_ACCESS_REQUESTER_TYPE_LABEL) as [SubjectAccessRequesterType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Request Type</Label>
              <Select><SelectTrigger><SelectValue placeholder="Select request type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(SUBJECT_ACCESS_REQUEST_TYPE_LABEL) as [SubjectAccessRequestType, string][]).map(([k, v]) => (
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
