"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Shield,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { PageShell }    from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton }  from "@/components/ui/print-button";
import { cn }           from "@/lib/utils";
import { getYPName, getStaffName } from "@/lib/seed-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAttachmentProfiles, useCreateAttachmentProfile } from "@/hooks/use-attachment-profiles";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { AttachmentProfile, AttachmentStyle, AttachmentProfileStatus, AttachmentBehaviour, AttachmentKeyRelationship } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── helpers ───────────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const STYLE_LABELS: Record<AttachmentStyle, string> = {
  secure: "Secure", anxious_ambivalent: "Anxious-Ambivalent",
  anxious_avoidant: "Anxious-Avoidant", disorganised: "Disorganised",
  emerging_secure: "Emerging Secure",
};
const STYLE_COLOURS: Record<AttachmentStyle, string> = {
  secure: "bg-green-100 text-green-800",
  anxious_ambivalent: "bg-amber-100 text-amber-800",
  anxious_avoidant: "bg-blue-100 text-blue-800",
  disorganised: "bg-red-100 text-red-800",
  emerging_secure: "bg-emerald-100 text-emerald-800",
};

const STATUS_LABELS: Record<AttachmentProfileStatus, string> = { active: "Active", under_review: "Under Review", archived: "Archived" };
const STATUS_COLOURS: Record<AttachmentProfileStatus, string> = {
  active: "bg-green-100 text-green-800", under_review: "bg-amber-100 text-amber-800", archived: "bg-gray-100 text-gray-700",
};

const QUALITY_COLOURS: Record<string, string> = {
  strong: "bg-green-100 text-green-800", developing: "bg-blue-100 text-blue-800",
  strained: "bg-amber-100 text-amber-800", absent: "bg-gray-100 text-gray-700",
};


/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  youngPerson: string; primaryStyle: string; secondaryPatterns: string;
  status: string; assessedBy: string; assessmentDate: string; reviewDate: string;
  protectiveFactors: string; riskFactors: string; therapeuticApproach: string;
  keyGuidance: string; childViews: string; professionalInput: string;
  notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Young Person",      accessor: (r: FlatRow) => r.youngPerson },
  { header: "Primary Style",     accessor: (r: FlatRow) => r.primaryStyle },
  { header: "Secondary Patterns",accessor: (r: FlatRow) => r.secondaryPatterns },
  { header: "Status",            accessor: (r: FlatRow) => r.status },
  { header: "Assessed By",       accessor: (r: FlatRow) => r.assessedBy },
  { header: "Assessment Date",   accessor: (r: FlatRow) => r.assessmentDate },
  { header: "Review Date",       accessor: (r: FlatRow) => r.reviewDate },
  { header: "Protective Factors",accessor: (r: FlatRow) => r.protectiveFactors },
  { header: "Risk Factors",      accessor: (r: FlatRow) => r.riskFactors },
  { header: "Therapeutic Approach",accessor: (r: FlatRow) => r.therapeuticApproach },
  { header: "Staff Guidance",    accessor: (r: FlatRow) => r.keyGuidance },
  { header: "Child Views",       accessor: (r: FlatRow) => r.childViews },
  { header: "Professional Input",accessor: (r: FlatRow) => r.professionalInput },
  { header: "Notes",             accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function AttachmentProfilesPage() {
  const { data: apData, isLoading } = useAttachmentProfiles();
  const createAP = useCreateAttachmentProfile();
  const data = apData?.data ?? [];

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [dialogOpen, setDialogOpen] = useState(false);

  /* ── create form state ───────────────────────────────────────────── */
  const [nChild, setNChild] = useState("");
  const [nStyle, setNStyle] = useState("");
  const [nSource, setNSource] = useState("");
  const [nHistory, setNHistory] = useState("");

  const handleCreate = () => {
    if (!nChild || !nStyle) return;
    createAP.mutate({
      child_id: nChild,
      status: "active" as AttachmentProfileStatus,
      primary_style: nStyle as AttachmentStyle,
      secondary_patterns: [],
      assessed_by: "",
      assessment_date: d(0),
      review_date: d(90),
      assessment_source: nSource,
      early_history: nHistory,
      placement_history: "",
      behaviours: [],
      key_relationships: [],
      therapeutic_approach: [],
      staff_guidance: [],
      protective_factors: [],
      risk_factors: [],
      child_views: "",
      professional_input: "",
      notes: "",
      created_at: new Date().toISOString(),
    } as Partial<AttachmentProfile>, {
      onSuccess: () => {
        toast.success("Attachment profile created");
        setDialogOpen(false);
        setNChild(""); setNStyle(""); setNSource(""); setNHistory("");
      },
      onError: () => toast.error("Failed to create profile"),
    });
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const active = data.filter((p) => p.status === "active").length;
    const reviewDue = data.filter((p) => p.review_date <= d(14) && p.status !== "archived").length;
    const disorganised = data.filter((p) => p.primary_style === "disorganised").length;
    const totalBehaviours = data.reduce((s, p) => s + p.behaviours.length, 0);
    return { active, reviewDue, disorganised, totalBehaviours };
  }, [data]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        getYPName(p.child_id).toLowerCase().includes(q) ||
        STYLE_LABELS[p.primary_style].toLowerCase().includes(q)
      );
    }
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    const out = [...list];
    switch (sortBy) {
      case "name": out.sort((a, b) => getYPName(a.child_id).localeCompare(getYPName(b.child_id))); break;
      case "style": out.sort((a, b) => a.primary_style.localeCompare(b.primary_style)); break;
      case "review": out.sort((a, b) => a.review_date.localeCompare(b.review_date)); break;
    }
    return out;
  }, [data, search, filterStatus, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    data.map((p) => ({
      youngPerson: getYPName(p.child_id),
      primaryStyle: STYLE_LABELS[p.primary_style],
      secondaryPatterns: p.secondary_patterns.join("; "),
      status: STATUS_LABELS[p.status],
      assessedBy: getStaffName(p.assessed_by),
      assessmentDate: p.assessment_date,
      reviewDate: p.review_date,
      protectiveFactors: p.protective_factors.join("; "),
      riskFactors: p.risk_factors.join("; "),
      therapeuticApproach: p.therapeutic_approach.join("; "),
      keyGuidance: p.staff_guidance.join("; "),
      childViews: p.child_views,
      professionalInput: p.professional_input,
      notes: p.notes,
    })), [data]);

  return (
    <PageShell
      title="Attachment Profiles"
      subtitle="Individualised attachment assessments, care strategies and relational guidance for staff"
      ariaContext={{ pageTitle: "Attachment Profiles", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Attachment Profiles" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="attachment-profiles" />
          <AriaStudioQuickActionButton context={{ record_type: "care_plan", record_id: "home_oak", home_id: "home_oak" }} />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Profile
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
      <>
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Profiles", value: stats.active, icon: Heart, colour: "text-blue-600" },
          { label: "Reviews Due (14 d)", value: stats.reviewDue, icon: AlertTriangle, colour: stats.reviewDue > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Disorganised", value: stats.disorganised, icon: Shield, colour: stats.disorganised > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Behaviour Guides", value: stats.totalBehaviours, icon: Lightbulb, colour: "text-purple-600" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-white p-4 flex items-center gap-3">
            <s.icon className={cn("h-6 w-6", s.colour)} />
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── per-child summary ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {data.map((p) => (
          <div key={p.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{getYPName(p.child_id)}</h3>
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STYLE_COLOURS[p.primary_style])}>{STYLE_LABELS[p.primary_style]}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {p.secondary_patterns.map((pat, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{pat}</span>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>Behaviours: <span className="font-medium text-gray-700">{p.behaviours.length}</span></div>
              <div>Relationships: <span className="font-medium text-gray-700">{p.key_relationships.length}</span></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Review: {p.review_date <= d(0) ? <span className="text-red-600 font-medium">Overdue</span> : p.review_date}</p>
          </div>
        ))}
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="profiles-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children or attachment styles…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="style">Style</SelectItem>
              <SelectItem value="review">Review Due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── cards ──────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((p) => {
          const open = expanded[p.id] ?? false;
          return (
            <div key={p.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(p.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Heart className="h-4 w-4 text-gray-400" />
                    <h3 className="font-semibold">{getYPName(p.child_id)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STYLE_COLOURS[p.primary_style])}>{STYLE_LABELS[p.primary_style]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOURS[p.status])}>{STATUS_LABELS[p.status]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{p.behaviours.length} behaviour guides · {p.key_relationships.length} key relationships · {p.staff_guidance.length} staff guidance points</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* assessment info */}
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-gray-500">Assessed by:</span> <span className="font-medium">{getStaffName(p.assessed_by)}</span></div>
                    <div><span className="text-gray-500">Date:</span> <span className="font-medium">{p.assessment_date}</span></div>
                    <div><span className="text-gray-500">Review:</span> <span className={cn("font-medium", p.review_date <= d(0) ? "text-red-600" : "")}>{p.review_date}</span></div>
                    <div><span className="text-gray-500">Source:</span> <span className="font-medium text-xs">{p.assessment_source}</span></div>
                  </div>

                  {/* early history */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Early History</h4>
                    <p className="text-sm">{p.early_history}</p>
                  </div>

                  {/* placement history */}
                  <div className="rounded-md bg-gray-50 p-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Placement History</h4>
                    <p className="text-sm">{p.placement_history}</p>
                  </div>

                  {/* behaviour guides */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Behaviour Guides — &quot;When you see this, try this&quot;</h4>
                    <div className="space-y-3">
                      {p.behaviours.map((b, i) => (
                        <div key={i} className="rounded-md border p-3">
                          <p className="text-sm font-semibold text-gray-800 mb-2">Context: {b.context}</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div className="rounded bg-amber-50 p-2">
                              <p className="text-xs font-medium text-amber-700 mb-0.5">What you may see</p>
                              <p className="text-xs text-amber-800">{b.behaviour}</p>
                            </div>
                            <div className="rounded bg-blue-50 p-2">
                              <p className="text-xs font-medium text-blue-700 mb-0.5">Underlying need</p>
                              <p className="text-xs text-blue-800">{b.underlying_need}</p>
                            </div>
                            <div className="rounded bg-green-50 p-2">
                              <p className="text-xs font-medium text-green-700 mb-0.5">Recommended response</p>
                              <p className="text-xs text-green-800">{b.recommended_response}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* key relationships */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Key Relationships</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {p.key_relationships.map((kr, i) => (
                        <div key={i} className="rounded-md border p-3 flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{kr.person}</span>
                              <span className="text-xs text-gray-500">({kr.role})</span>
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", QUALITY_COLOURS[kr.quality])}>{kr.quality}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{kr.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* therapeutic approach */}
                  <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                    <h4 className="text-xs font-semibold text-purple-700 mb-1">Therapeutic Approach</h4>
                    <ul className="list-disc list-inside text-sm text-purple-800 space-y-0.5">
                      {p.therapeutic_approach.map((t, i) => <li key={i}>{t}</li>)}
                    </ul>
                  </div>

                  {/* staff guidance */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Staff Guidance — Essential Reading</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {p.staff_guidance.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>

                  {/* protective / risk factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Protective Factors</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {p.protective_factors.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-red-50 p-3">
                      <h4 className="text-xs font-semibold text-red-700 mb-1">Risk Factors</h4>
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-0.5">
                        {p.risk_factors.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* child's view */}
                  {p.child_views && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Child&apos;s Views</h4>
                      <p className="text-sm text-pink-800">{p.child_views}</p>
                    </div>
                  )}

                  {/* professional input */}
                  {p.professional_input && (
                    <div className="rounded-md bg-gray-50 p-3">
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Professional Input</h4>
                      <p className="text-sm">{p.professional_input}</p>
                    </div>
                  )}

                  {/* notes */}
                  {p.notes && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 mb-1">Notes</h4>
                      <p className="text-sm text-gray-700">{p.notes}</p>
                    </div>
                  )}

                  <SmartLinkPanel sourceType="attachment_profile" sourceId={p.id} childId={p.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Attachment &amp; Trauma-Informed Care:</strong> Understanding each child&apos;s attachment style is essential for providing relationship-based care. Attachment profiles should inform all daily interactions, care planning, and staff responses to behaviour. All staff must read and understand each child&apos;s profile. Profiles should be reviewed regularly and updated as the child develops. Behaviour is communication — these profiles help staff understand what children are communicating.
      </div>

      </>
      )}

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Attachment Profile</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium">Young Person</label>
              <Select value={nChild} onValueChange={setNChild}><SelectTrigger className="mt-1"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>{["yp_alex","yp_jordan","yp_casey"].map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Primary Attachment Style</label>
              <Select value={nStyle} onValueChange={setNStyle}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(STYLE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Assessment Source</label>
              <input value={nSource} onChange={(e) => setNSource(e.target.value)} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="e.g. Clinical psychologist assessment" />
            </div>
            <div>
              <label className="text-sm font-medium">Early History Summary</label>
              <textarea value={nHistory} onChange={(e) => setNHistory(e.target.value)} rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Key early relational experiences…" />
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
            <button onClick={handleCreate} disabled={!nChild || !nStyle || createAP.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
              {createAP.isPending ? <><Loader2 className="inline h-4 w-4 animate-spin mr-1" />Creating...</> : "Create Profile"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Attachment Profiles — attachment style, relational history, trauma-informed responses, triggers, co-regulation, therapeutic parenting, needs behind behaviour, key worker"
        recordType="care_plan"
        className="mt-6"
      />
    </PageShell>
  );
}
