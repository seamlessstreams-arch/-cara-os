"use client";

import { useState, useMemo } from "react";
import {
  Briefcase, Plus, Search, ArrowUpDown,
  AlertTriangle, CheckCircle2, XCircle, Clock,
  ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE, STAFF } from "@/lib/seed-data";
import type { GrabBag, GrabBagItem, GrabBagStatus } from "@/types/extended";
import { GRAB_BAG_STATUS_LABEL } from "@/types/extended";
import { useGrabBags, useUpdateGrabBag, useCreateGrabBag } from "@/hooks/use-grab-bags";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── default items per bag ──────────────────────────────────────────── */
const DEFAULT_ITEMS: Omit<GrabBagItem, "present" | "expiry_date" | "notes">[] = [
  { name: "Placement Plan (copy)", required: true },
  { name: "Care Plan (copy)", required: true },
  { name: "Risk Assessment (copy)", required: true },
  { name: "Emergency Contact Numbers", required: true },
  { name: "Medication & MAR Sheet", required: true },
  { name: "Health Passport / Summary", required: true },
  { name: "Photo of Young Person", required: true },
  { name: "Social Worker Contact Details", required: true },
  { name: "Consent Forms (copies)", required: true },
  { name: "Passport / Birth Certificate (copy)", required: false },
  { name: "Change of Clothes", required: true },
  { name: "Toiletries (basic)", required: true },
  { name: "Comfort Item Details", required: false },
  { name: "Cash (£20 emergency)", required: true },
  { name: "Torch", required: true },
  { name: "Phone Charger", required: false },
  { name: "Allergy / Dietary Info Card", required: true },
  { name: "EHCP / PEP Summary (copy)", required: false },
];

/* ── component ───────────────────────────────────────────────────────── */
export default function GrabBagPage() {
  const { data: res, isLoading } = useGrabBags();
  const bags = res?.data ?? [];

  const updateMutation = useUpdateGrabBag();

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("nextCheck");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checkBag, setCheckBag] = useState<GrabBag | null>(null);
  const [showNew, setShowNew] = useState(false);
  const createBag = useCreateGrabBag();
  const [bagForm, setBagForm] = useState({ child_id: "", location: "", notes: "" });
  const setBAG = (k: string, v: unknown) => setBagForm((p) => ({ ...p, [k]: v }));

  const handleSaveBag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bagForm.child_id) { toast.error("Please select a young person."); return; }
    const today = new Date().toISOString().slice(0, 10);
    const nextCheck = new Date(); nextCheck.setMonth(nextCheck.getMonth() + 1);
    await createBag.mutateAsync({ child_id: bagForm.child_id, location: bagForm.location.trim() || "Secure cupboard", last_checked: today, checked_by: "", next_check_due: nextCheck.toISOString().slice(0, 10), items: DEFAULT_ITEMS.map((item) => ({ name: item.name, present: false, notes: "", required: item.required, expiry_date: null })), overall_status: "incomplete" as GrabBagStatus, notes: bagForm.notes });
    toast.success("Grab bag record created.");
    setBagForm({ child_id: "", location: "", notes: "" });
    setShowNew(false);
  };

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = [...bags];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          getYPName(b.child_id).toLowerCase().includes(q) ||
          b.notes.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "nextCheck": return a.next_check_due.localeCompare(b.next_check_due);
        case "name": return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "status": {
          const order: Record<GrabBagStatus, number> = { incomplete: 0, expired_items: 1, complete: 2 };
          return order[a.overall_status] - order[b.overall_status];
        }
        default: return 0;
      }
    });
    return list;
  }, [bags, search, sortBy]);

  /* stats */
  const totalBags = bags.length;
  const completeBags = bags.filter((b) => b.overall_status === "complete").length;
  const overdueChecks = bags.filter((b) => b.next_check_due < today).length;
  const issuesBags = bags.filter((b) => b.overall_status !== "complete").length;

  const STATUS_COLORS: Record<string, string> = {
    complete: "bg-green-100 text-green-800",
    incomplete: "bg-red-100 text-red-800",
    expired_items: "bg-orange-100 text-orange-800",
  };

  /* flatten for export */
  const exportData = useMemo(() => {
    return bags.flatMap((b) =>
      b.items.map((item) => ({ bagId: b.id, child_id: b.child_id, ...item, bagStatus: b.overall_status, last_checked: b.last_checked, checked_by: b.checked_by }))
    );
  }, [bags]);

  type ExportRow = { bagId: string; child_id: string; name: string; required: boolean; present: boolean; expiry_date: string | null; notes: string; bagStatus: string; last_checked: string; checked_by: string };

  const exportCols: ExportColumn<ExportRow>[] = [
    { header: "Young Person", accessor: (r: ExportRow) => getYPName(r.child_id) },
    { header: "Item", accessor: (r: ExportRow) => r.name },
    { header: "Required", accessor: (r: ExportRow) => r.required ? "Yes" : "No" },
    { header: "Present", accessor: (r: ExportRow) => r.present ? "Yes" : "No" },
    { header: "Expiry Date", accessor: (r: ExportRow) => r.expiry_date ?? "N/A" },
    { header: "Item Notes", accessor: (r: ExportRow) => r.notes },
    { header: "Bag Status", accessor: (r: ExportRow) => r.bagStatus },
    { header: "Last Checked", accessor: (r: ExportRow) => r.last_checked },
    { header: "Checked By", accessor: (r: ExportRow) => getStaffName(r.checked_by) },
  ];

  const handleMarkChecked = (bagId: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const next = new Date();
    next.setDate(next.getDate() + 30);
    updateMutation.mutate({ id: bagId, last_checked: today, checked_by: "staff_darren", next_check_due: next.toISOString().slice(0, 10) });
  };

  if (isLoading) return <PageShell title="Emergency Grab Bags" subtitle="Essential documents and supplies for each young person — ready for immediate use"><div className="p-8 text-center text-muted-foreground">Loading grab bags…</div></PageShell>;

  return (
    <PageShell
      title="Emergency Grab Bags"
      subtitle="Essential documents and supplies for each young person — ready for immediate use"
      ariaContext={{ pageTitle: "Emergency Grab Bags", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Emergency Grab Bags" />
          <ExportButton data={exportData} columns={exportCols} filename="grab-bags" />
          <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />New Bag</Button>
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Bags", value: totalBags, icon: Briefcase, colour: "text-blue-600" },
            { label: "Complete", value: completeBags, icon: CheckCircle2, colour: "text-green-600" },
            { label: "Issues", value: issuesBags, icon: AlertTriangle, colour: issuesBags > 0 ? "text-red-600" : "text-[var(--cs-text-muted)]" },
            { label: "Checks Overdue", value: overdueChecks, icon: Clock, colour: overdueChecks > 0 ? "text-orange-600" : "text-[var(--cs-text-muted)]" },
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

        {/* ── alerts ────────────────────────────────────────────── */}
        {issuesBags > 0 && (
          <div className="rounded-lg border-l-4 border-red-400 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <p className="text-sm text-red-800">
                <strong>{issuesBags}</strong> grab bag(s) have missing or expired items — resolve immediately.
                Grab bags must be complete and ready at all times.
              </p>
            </div>
          </div>
        )}

        {/* ── filters ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search young people, notes…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nextCheck">Next Check Due</SelectItem>
                <SelectItem value="name">Young Person</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── bags ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {filtered.map((bag) => {
            const isExpanded = expanded === bag.id;
            const checkOverdue = bag.next_check_due < today;
            const missingRequired = bag.items.filter((i) => i.required && !i.present).length;
            const expiredItems = bag.items.filter((i) => i.expiry_date && i.expiry_date < today).length;
            const totalPresent = bag.items.filter((i) => i.present).length;

            return (
              <div key={bag.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : bag.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Briefcase className={cn("h-5 w-5 shrink-0",
                      bag.overall_status === "complete" ? "text-green-600" :
                      bag.overall_status === "expired_items" ? "text-orange-600" : "text-red-600"
                    )} />
                    <div className="min-w-0">
                      <p className="font-medium">{getYPName(bag.child_id)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bag.location} · {totalPresent}/{bag.items.length} items · Checked: {bag.last_checked}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {checkOverdue && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Check Overdue</Badge>}
                    <Badge className={cn("text-xs", STATUS_COLORS[bag.overall_status])}>
                      {GRAB_BAG_STATUS_LABEL[bag.overall_status]}
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t bg-slate-50 p-4 space-y-4">
                    {/* meta */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Last Checked:</span> <span className="font-medium">{bag.last_checked}</span></div>
                      <div><span className="text-muted-foreground">Checked By:</span> <span className="font-medium">{getStaffName(bag.checked_by)}</span></div>
                      <div><span className="text-muted-foreground">Next Check:</span> <span className={cn("font-medium", checkOverdue && "text-red-600")}>{bag.next_check_due}{checkOverdue ? " (Overdue)" : ""}</span></div>
                      <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{bag.location}</span></div>
                    </div>

                    {/* issue summary */}
                    {(missingRequired > 0 || expiredItems > 0) && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                        <p className="text-sm font-medium text-red-800 mb-1">Issues</p>
                        {missingRequired > 0 && <p className="text-sm text-red-700">{missingRequired} required item(s) missing</p>}
                        {expiredItems > 0 && <p className="text-sm text-red-700">{expiredItems} item(s) with expired documents</p>}
                      </div>
                    )}

                    {/* item checklist */}
                    <div>
                      <p className="text-sm font-medium mb-2">Contents Checklist</p>
                      <div className="space-y-1">
                        {bag.items.map((item: GrabBagItem, idx: number) => {
                          const isExpired = item.expiry_date && item.expiry_date < today;
                          return (
                            <div key={idx} className={cn(
                              "flex items-start gap-2 rounded-lg border p-2.5 text-sm",
                              !item.present && item.required ? "bg-red-50 border-red-200" :
                              isExpired ? "bg-orange-50 border-orange-200" : "bg-white"
                            )}>
                              {item.present ? (
                                <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", isExpired ? "text-orange-600" : "text-green-600")} />
                              ) : (
                                <XCircle className={cn("h-4 w-4 mt-0.5 shrink-0", item.required ? "text-red-600" : "text-[var(--cs-text-muted)]")} />
                              )}
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn(!item.present && item.required && "font-medium text-red-800")}>
                                    {item.name}
                                  </span>
                                  {item.required && <Badge variant="outline" className="text-[10px] py-0">Required</Badge>}
                                  {isExpired && <Badge variant="outline" className="text-[10px] py-0 border-orange-300 text-orange-700">Expired</Badge>}
                                </div>
                                {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
                                {item.expiry_date && <p className="text-xs text-muted-foreground">Expires: {item.expiry_date}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* notes */}
                    {bag.notes && (
                      <div className="rounded-lg bg-white border p-3">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">Notes</p>
                        <p className="text-sm">{bag.notes}</p>
                      </div>
                    )}

                    {/* actions */}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleMarkChecked(bag.id)}>
                        <RefreshCw className="h-3 w-3 mr-1" /> Mark Checked
                      </Button>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="grab-bag" sourceId={bag.id} childId={bag.child_id} compact />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── reg note ──────────────────────────────────────────── */}
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-900">
          <strong>Emergency Preparedness:</strong> Each young person must have an emergency grab bag
          containing essential documents, medication information, emergency contacts, and basic supplies.
          Bags must be checked monthly, stored securely but accessibly, and be ready for immediate use
          in the event of an emergency evacuation. Contents should be updated whenever care plans,
          risk assessments, or medication change.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Health & Safety"
        category="general"
        days={28}
        defaultCollapsed
      />
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Grab Bag</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveBag} className="space-y-3 py-2">
            <div><Label>Young Person *</Label><Select value={bagForm.child_id} onValueChange={(v) => setBAG("child_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select young person…" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (<SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Storage Location</Label><Input className="mt-1" placeholder="e.g. Secure cupboard, Room 2…" value={bagForm.location} onChange={(e) => setBAG("location", e.target.value)} /></div>
            <div><Label>Notes</Label><Textarea className="mt-1" rows={2} value={bagForm.notes} onChange={(e) => setBAG("notes", e.target.value)} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createBag.isPending}>{createBag.isPending ? "Saving…" : "Create Bag"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
