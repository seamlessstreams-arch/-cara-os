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
  AlertTriangle, CheckCircle2, Camera, X, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName, YOUNG_PEOPLE } from "@/lib/seed-data";
import { toast } from "sonner";
import type { PhotoConsentRecord, PhotoConsentCategory, PhotoConsentStatus } from "@/types/extended";
import { PHOTO_CONSENT_CATEGORY_LABEL, PHOTO_CONSENT_STATUS_LABEL } from "@/types/extended";
import { usePhotoConsentRecords, useCreatePhotoConsentRecord } from "@/hooks/use-photo-consent-records";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

/* ── helpers ───────────────────────────────────────────────────────────────── */

const STATUS_CLR: Record<PhotoConsentStatus, string> = {
  granted: "bg-green-100 text-green-800",
  refused: "bg-red-100 text-red-800",
  conditional: "bg-amber-100 text-amber-800",
  expired: "bg-slate-100 text-slate-800",
  pending_sw: "bg-blue-100 text-blue-800",
};

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function PhotoConsentPage() {
  const { data: res, isLoading } = usePhotoConsentRecords();
  const records = res?.data ?? [];

  const [filterChild, setFilterChild] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const createRecord = useCreatePhotoConsentRecord();
  const [pcForm, setPcForm] = useState({ child_id: "", review_date: new Date().toISOString().slice(0, 10), young_person_views: "", overall_notes: "" });
  const setPC = (k: string, v: unknown) => setPcForm((p) => ({ ...p, [k]: v }));

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pcForm.child_id) { toast.error("Please select a young person."); return; }
    const next = new Date(pcForm.review_date); next.setFullYear(next.getFullYear() + 1);
    await createRecord.mutateAsync({ child_id: pcForm.child_id, last_review_date: pcForm.review_date, next_review_date: next.toISOString().slice(0, 10), reviewed_by: "staff_darren", overall_notes: pcForm.overall_notes.trim(), permissions: [], social_worker_consent: false, young_person_views: pcForm.young_person_views.trim(), delegated_authority: "", created_at: new Date().toISOString() });
    toast.success("Photo consent review saved.");
    setPcForm({ child_id: "", review_date: new Date().toISOString().slice(0, 10), young_person_views: "", overall_notes: "" });
    setShowNew(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    if (filterChild === "all") return records;
    return records.filter((r) => r.child_id === filterChild);
  }, [records, filterChild]);

  const totalGranted = records.flatMap((r) => r.permissions).filter((p) => p.status === "granted").length;
  const totalRefused = records.flatMap((r) => r.permissions).filter((p) => p.status === "refused").length;
  const totalConditional = records.flatMap((r) => r.permissions).filter((p) => p.status === "conditional").length;
  const reviewsDue = records.filter((r) => r.next_review_date <= new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)).length;

  const exportCols: ExportColumn<PhotoConsentRecord>[] = [
    { header: "Child", accessor: (r: PhotoConsentRecord) => getYPName(r.child_id) },
    { header: "Last Review", accessor: (r: PhotoConsentRecord) => r.last_review_date },
    { header: "Next Review", accessor: (r: PhotoConsentRecord) => r.next_review_date },
    { header: "Reviewed By", accessor: (r: PhotoConsentRecord) => getStaffName(r.reviewed_by) },
    { header: "SW Consent", accessor: (r: PhotoConsentRecord) => r.social_worker_consent ? "Yes" : "No" },
    { header: "YP Views", accessor: (r: PhotoConsentRecord) => r.young_person_views },
    { header: "Notes", accessor: (r: PhotoConsentRecord) => r.overall_notes },
  ];

  if (isLoading) {
    return (
      <PageShell title="Photo & Image Consent" subtitle="Data Protection Act 2018 · GDPR · Delegated Authority · Safeguarding">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Photo & Image Consent" subtitle="Data Protection Act 2018 · GDPR · Delegated Authority · Safeguarding" actions={<div className="flex items-center gap-2"><PrintButton title="Photo Consent Records" /><ExportButton data={filtered} columns={exportCols} filename="photo-consent" /><Button size="sm" onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" /> Review Consent</Button></div>}>
      <div id="print-area">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Granted", value: totalGranted, icon: CheckCircle2, clr: "text-green-600" },
            { label: "Refused", value: totalRefused, icon: X, clr: "text-red-600" },
            { label: "Conditional", value: totalConditional, icon: AlertTriangle, clr: "text-amber-600" },
            { label: "Reviews Due (30d)", value: reviewsDue, icon: Clock, clr: "text-indigo-600" },
          ].map((s) => (
            <Card key={s.label}><CardContent className="pt-4 pb-3 text-center"><s.icon className={cn("h-5 w-5 mx-auto mb-1", s.clr)} /><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></CardContent></Card>
          ))}
        </div>

        <div className="flex gap-3 mb-6">
          <Select value={filterChild} onValueChange={setFilterChild}><SelectTrigger className="w-[180px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All Children</SelectItem><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select>
        </div>

        <div className="space-y-4">
          {filtered.map((r) => {
            const open = expanded[r.id];
            const granted = r.permissions.filter((p) => p.status === "granted").length;
            const refused = r.permissions.filter((p) => p.status === "refused").length;
            const conditional = r.permissions.filter((p) => p.status === "conditional").length;

            return (
              <Card key={r.id} className="border-l-4 border-l-blue-400">
                <CardHeader className="pb-2 cursor-pointer" onClick={() => toggle(r.id)}>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Camera className="h-4 w-4 text-blue-600" />
                        {getYPName(r.child_id)} — Photo Consent
                        <Badge variant="outline" className="bg-green-50">{granted} granted</Badge>
                        <Badge variant="outline" className="bg-red-50">{refused} refused</Badge>
                        <Badge variant="outline" className="bg-amber-50">{conditional} conditional</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Last review: {r.last_review_date} · Next review: {r.next_review_date} · By: {getStaffName(r.reviewed_by)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* YP views */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1">Young Person&apos;s Views</p>
                      <p className="text-blue-700 text-xs italic">{r.young_person_views}</p>
                    </div>

                    {/* delegated authority */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="font-medium text-purple-800 mb-1">Delegated Authority</p>
                      <p className="text-purple-700 text-xs">{r.delegated_authority}</p>
                    </div>

                    {/* permissions grid */}
                    <div>
                      <p className="font-medium mb-2">Consent Permissions</p>
                      <div className="space-y-2">
                        {r.permissions.map((p, i) => (
                          <div key={i} className={cn("rounded-lg p-3 border", p.status === "granted" ? "bg-green-50 border-green-200" : p.status === "refused" ? "bg-red-50 border-red-200" : p.status === "conditional" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200")}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-xs">{PHOTO_CONSENT_CATEGORY_LABEL[p.category]}</p>
                              <Badge variant="outline" className={STATUS_CLR[p.status]}>{PHOTO_CONSENT_STATUS_LABEL[p.status]}</Badge>
                            </div>
                            {p.conditions && <p className="text-xs text-muted-foreground">{p.conditions}</p>}
                            <p className="text-xs text-muted-foreground mt-1">Granted by: {p.granted_by} · Date: {p.granted_date}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* overall notes */}
                    <div>
                      <p className="font-medium mb-1">Overall Notes</p>
                      <p className="text-muted-foreground text-xs">{r.overall_notes}</p>
                    </div>

                    {/* smart links */}
                    <SmartLinkPanel sourceType="photo-consent" sourceId={r.id} childId={r.child_id} compact />
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 bg-muted/30 rounded-lg p-4 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Regulatory Framework</p>
          <p>Data Protection Act 2018 / UK GDPR — photographs are personal data. Children&apos;s images require specific consent from those with parental responsibility or delegated authority. Social workers must provide written consent for looked-after children. Young person&apos;s views must be sought and recorded. Photos stored securely with restricted access. Social media posting requires explicit consent and must consider safeguarding risks. Review consent at minimum every 6 months or when circumstances change.</p>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Review Photo Consent</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveReview} className="grid grid-cols-2 gap-4 py-2">
            <div><Label>Young Person *</Label><Select value={pcForm.child_id} onValueChange={(v) => setPC("child_id", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => (<SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>Review Date</Label><Input type="date" className="mt-1" value={pcForm.review_date} onChange={(e) => setPC("review_date", e.target.value)} /></div>
            <div className="col-span-2"><Label>Young Person&apos;s Views</Label><Textarea className="mt-1" rows={2} placeholder="What does the young person say about photos?" value={pcForm.young_person_views} onChange={(e) => setPC("young_person_views", e.target.value)} /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea className="mt-1" rows={3} placeholder="Overall consent notes…" value={pcForm.overall_notes} onChange={(e) => setPC("overall_notes", e.target.value)} /></div>
            <DialogFooter className="col-span-2"><Button type="button" variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button type="submit" disabled={createRecord.isPending}>{createRecord.isPending ? "Saving…" : "Save Review"}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
