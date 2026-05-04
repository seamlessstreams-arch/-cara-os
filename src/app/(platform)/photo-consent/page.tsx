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
  AlertTriangle, CheckCircle2, Camera, X, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStaffName, getYPName } from "@/lib/seed-data";

/* ── types ─────────────────────────────────────────────────────────────────── */

type ConsentCategory = "school_photos" | "activities_outings" | "social_media" | "internal_records" | "press_media" | "medical" | "life_story" | "celebration_events" | "cctv";
type ConsentStatus = "granted" | "refused" | "conditional" | "expired" | "pending_sw";

interface ConsentPermission {
  category: ConsentCategory;
  status: ConsentStatus;
  conditions: string;
  grantedBy: string;
  grantedDate: string;
  reviewDate: string;
}

interface PhotoConsentRecord {
  id: string;
  youngPersonId: string;
  lastReviewDate: string;
  nextReviewDate: string;
  reviewedBy: string;
  overallNotes: string;
  permissions: ConsentPermission[];
  socialWorkerConsent: boolean;
  youngPersonViews: string;
  delegatedAuthority: string;
}

/* ── helpers ───────────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const CAT_LABEL: Record<ConsentCategory, string> = {
  school_photos: "School Photographs", activities_outings: "Activities & Outings",
  social_media: "Social Media", internal_records: "Internal Records / Life Story Book",
  press_media: "Press / Media", medical: "Medical Photography",
  life_story: "Life Story Work", celebration_events: "Celebration Events (Birthdays etc)",
  cctv: "CCTV Recording",
};
const STATUS_LABEL: Record<ConsentStatus, string> = { granted: "Granted", refused: "Refused", conditional: "Conditional", expired: "Expired", pending_sw: "Pending SW Decision" };
const STATUS_CLR: Record<ConsentStatus, string> = { granted: "bg-green-100 text-green-800", refused: "bg-red-100 text-red-800", conditional: "bg-amber-100 text-amber-800", expired: "bg-slate-100 text-slate-800", pending_sw: "bg-blue-100 text-blue-800" };

/* ── seed data ─────────────────────────────────────────────────────────────── */

const SEED: PhotoConsentRecord[] = [
  {
    id: "pc_1", youngPersonId: "yp_alex", lastReviewDate: d(-30), nextReviewDate: d(152),
    reviewedBy: "staff_darren",
    overallNotes: "Alex is generally happy to be photographed. Birth father (Mark) has given blanket consent for internal photos. SW has provided written consent. No safeguarding reasons to restrict photography. Alex enjoys being in photos and has asked for copies for his life story book.",
    socialWorkerConsent: true, youngPersonViews: "Alex says: 'I like having my photo taken — I want photos of me doing football and cooking.'",
    delegatedAuthority: "Delegated authority from Karen Holding (SW) — written consent dated " + d(-60) + ". Covers school, activities, internal records, life story. Does NOT cover press/media — requires specific LA approval.",
    permissions: [
      { category: "school_photos", status: "granted", conditions: "", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
      { category: "activities_outings", status: "granted", conditions: "", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
      { category: "social_media", status: "refused", conditions: "No images of Alex to be posted on any social media platform. This includes the home's social media. Alex's identity must be protected online.", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
      { category: "internal_records", status: "granted", conditions: "", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
      { category: "press_media", status: "refused", conditions: "Requires specific LA approval for any press or media involvement. Not covered by delegated authority.", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
      { category: "life_story", status: "granted", conditions: "", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
      { category: "celebration_events", status: "granted", conditions: "Photos may be taken at birthday parties, Christmas etc. for internal use and life story only.", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
      { category: "cctv", status: "granted", conditions: "Standard home CCTV in communal areas. Alex is aware of camera locations.", grantedBy: "Karen Holding (SW)", grantedDate: d(-60), reviewDate: d(152) },
    ],
  },
  {
    id: "pc_2", youngPersonId: "yp_jordan", lastReviewDate: d(-14), nextReviewDate: d(168),
    reviewedBy: "staff_darren",
    overallNotes: "Jordan does not enjoy having their photo taken — sensory processing difficulties mean the camera flash and being asked to pose can cause distress. Photos should only be taken when strictly necessary and with Jordan's active consent at the time. Natural, candid shots preferred over posed. Never use flash.",
    socialWorkerConsent: true, youngPersonViews: "Jordan says: 'I don't like it when people take pictures of me. If they have to, no flash please and don't make me smile.'",
    delegatedAuthority: "Michael Osei (SW) has provided consent for internal and school photos only. All other categories require specific discussion.",
    permissions: [
      { category: "school_photos", status: "conditional", conditions: "Consent given but Jordan must agree on the day. School to be informed of Jordan's preferences — no flash, no forced posing. If Jordan declines, this must be respected.", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
      { category: "activities_outings", status: "conditional", conditions: "Only if Jordan actively consents at the time. Staff to ask before taking any photo. Candid shots only — no posed photos.", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
      { category: "social_media", status: "refused", conditions: "No images of Jordan on any platform.", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
      { category: "internal_records", status: "granted", conditions: "For placement file and care records only.", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
      { category: "press_media", status: "refused", conditions: "", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
      { category: "life_story", status: "conditional", conditions: "Jordan may choose which photos to include. Jordan has creative control over their life story book.", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
      { category: "celebration_events", status: "conditional", conditions: "Ask Jordan on the day. If Jordan declines, group photos should be taken without Jordan or Jordan positioned where they are comfortable.", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
      { category: "cctv", status: "granted", conditions: "Jordan aware of CCTV. No concerns raised.", grantedBy: "Michael Osei (SW)", grantedDate: d(-14), reviewDate: d(168) },
    ],
  },
  {
    id: "pc_3", youngPersonId: "yp_casey", lastReviewDate: d(-7), nextReviewDate: d(85),
    reviewedBy: "staff_darren",
    overallNotes: "Casey's photo consent is highly restricted due to active safeguarding concerns (CSE screening — high risk). Casey's identity must be protected. Additional restrictions on photo sharing following exploitation screening escalation. Casey should not appear in any photos that could identify the home's location.",
    socialWorkerConsent: true, youngPersonViews: "Casey says: 'I don't mind photos for my book, but I don't want them online anywhere.'",
    delegatedAuthority: "Fiona Brennan (SW) has provided restrictive consent — internal use only. Review in 3 months or sooner if safeguarding situation changes.",
    permissions: [
      { category: "school_photos", status: "conditional", conditions: "School individual photos only — NOT group photos that identify the school. School informed.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
      { category: "activities_outings", status: "conditional", conditions: "Internal records only. No photos that identify locations. Casey must consent on each occasion.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
      { category: "social_media", status: "refused", conditions: "Absolute prohibition. No images on any platform. High safeguarding risk — identity protection paramount.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
      { category: "internal_records", status: "granted", conditions: "For care records only. Stored in secure system.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
      { category: "press_media", status: "refused", conditions: "Absolute prohibition.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
      { category: "life_story", status: "granted", conditions: "Casey actively wants life story photos. These are stored securely and Casey has control over content.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
      { category: "celebration_events", status: "conditional", conditions: "Internal photos only. No location-identifying features. Ask Casey each time.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
      { category: "cctv", status: "granted", conditions: "Standard CCTV. Casey aware. CCTV footage retention policy applies — 30 days max unless preserved for safeguarding purpose.", grantedBy: "Fiona Brennan (SW)", grantedDate: d(-7), reviewDate: d(85) },
    ],
  },
];

/* ── page ──────────────────────────────────────────────────────────────────── */

export default function PhotoConsentPage() {
  const [data] = useState(SEED);
  const [filterChild, setFilterChild] = useState("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showNew, setShowNew] = useState(false);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const filtered = useMemo(() => {
    if (filterChild === "all") return data;
    return data.filter((r) => r.youngPersonId === filterChild);
  }, [data, filterChild]);

  const totalGranted = data.flatMap((r) => r.permissions).filter((p) => p.status === "granted").length;
  const totalRefused = data.flatMap((r) => r.permissions).filter((p) => p.status === "refused").length;
  const totalConditional = data.flatMap((r) => r.permissions).filter((p) => p.status === "conditional").length;
  const reviewsDue = data.filter((r) => r.nextReviewDate <= d(30)).length;

  const exportCols: ExportColumn<PhotoConsentRecord>[] = [
    { header: "Child", accessor: (r: PhotoConsentRecord) => getYPName(r.youngPersonId) },
    { header: "Last Review", accessor: (r: PhotoConsentRecord) => r.lastReviewDate },
    { header: "Next Review", accessor: (r: PhotoConsentRecord) => r.nextReviewDate },
    { header: "Reviewed By", accessor: (r: PhotoConsentRecord) => getStaffName(r.reviewedBy) },
    { header: "SW Consent", accessor: (r: PhotoConsentRecord) => r.socialWorkerConsent ? "Yes" : "No" },
    { header: "YP Views", accessor: (r: PhotoConsentRecord) => r.youngPersonViews },
    { header: "Notes", accessor: (r: PhotoConsentRecord) => r.overallNotes },
  ];

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
                        {getYPName(r.youngPersonId)} — Photo Consent
                        <Badge variant="outline" className="bg-green-50">{granted} granted</Badge>
                        <Badge variant="outline" className="bg-red-50">{refused} refused</Badge>
                        <Badge variant="outline" className="bg-amber-50">{conditional} conditional</Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">Last review: {r.lastReviewDate} · Next review: {r.nextReviewDate} · By: {getStaffName(r.reviewedBy)}</p>
                    </div>
                    {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </CardHeader>
                {open && (
                  <CardContent className="pt-0 space-y-4 text-sm">
                    {/* YP views */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-800 mb-1">Young Person&apos;s Views</p>
                      <p className="text-blue-700 text-xs italic">{r.youngPersonViews}</p>
                    </div>

                    {/* delegated authority */}
                    <div className="bg-purple-50 rounded-lg p-3">
                      <p className="font-medium text-purple-800 mb-1">Delegated Authority</p>
                      <p className="text-purple-700 text-xs">{r.delegatedAuthority}</p>
                    </div>

                    {/* permissions grid */}
                    <div>
                      <p className="font-medium mb-2">Consent Permissions</p>
                      <div className="space-y-2">
                        {r.permissions.map((p, i) => (
                          <div key={i} className={cn("rounded-lg p-3 border", p.status === "granted" ? "bg-green-50 border-green-200" : p.status === "refused" ? "bg-red-50 border-red-200" : p.status === "conditional" ? "bg-amber-50 border-amber-200" : "bg-slate-50 border-slate-200")}>
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-xs">{CAT_LABEL[p.category]}</p>
                              <Badge variant="outline" className={STATUS_CLR[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                            </div>
                            {p.conditions && <p className="text-xs text-muted-foreground">{p.conditions}</p>}
                            <p className="text-xs text-muted-foreground mt-1">Granted by: {p.grantedBy} · Date: {p.grantedDate}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* overall notes */}
                    <div>
                      <p className="font-medium mb-1">Overall Notes</p>
                      <p className="text-muted-foreground text-xs">{r.overallNotes}</p>
                    </div>
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
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Young Person</Label><Select><SelectTrigger><SelectValue placeholder="Select child…" /></SelectTrigger><SelectContent><SelectItem value="yp_alex">Alex</SelectItem><SelectItem value="yp_jordan">Jordan</SelectItem><SelectItem value="yp_casey">Casey</SelectItem></SelectContent></Select></div>
            <div><Label>Review Date</Label><Input type="date" /></div>
            <div className="col-span-2"><Label>Young Person&apos;s Views</Label><Textarea rows={2} placeholder="What does the young person say about photos?" /></div>
            <div className="col-span-2"><Label>Notes</Label><Textarea rows={3} placeholder="Overall consent notes…" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button><Button onClick={() => setShowNew(false)}>Save Review</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}