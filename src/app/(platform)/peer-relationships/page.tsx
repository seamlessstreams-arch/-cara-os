"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  Users,
  Plus,
  ArrowUpDown,
  Search,
  AlertTriangle,
  Heart,
  ShieldAlert,
  TrendingUp,
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
import { usePeerDynamics, useCreatePeerDynamic } from "@/hooks/use-peer-dynamics";
import { toast } from "sonner";
import { YOUNG_PEOPLE } from "@/lib/seed-data";
import { usePeerGroupDynamics } from "@/hooks/use-peer-group-dynamics";
import type {
  PeerDynamic,
  PeerGroupDynamic,
  PeerRelationshipQuality,
  PeerRiskLevel,
  PeerEntryType,
  PeerGroupAtmosphere,
} from "@/types/extended";
import {
  PEER_RELATIONSHIP_QUALITY_LABEL,
  PEER_RISK_LEVEL_LABEL,
  PEER_ENTRY_TYPE_LABEL,
  PEER_GROUP_ATMOSPHERE_LABEL,
} from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── colour maps ──────────────────────────────────────────────────────── */

const QUALITY_CLR: Record<PeerRelationshipQuality, string> = {
  positive: "bg-green-100 text-green-800", developing: "bg-blue-100 text-blue-800",
  strained: "bg-amber-100 text-amber-800", conflicted: "bg-red-100 text-red-800",
  neutral: "bg-gray-100 text-gray-700",
};

const RISK_CLR: Record<PeerRiskLevel, string> = {
  none: "bg-green-100 text-green-800", low: "bg-blue-100 text-blue-800",
  medium: "bg-amber-100 text-amber-800", high: "bg-red-100 text-red-800",
};

const ATMOS_CLR: Record<PeerGroupAtmosphere, string> = {
  calm: "bg-green-100 text-green-800", mixed: "bg-amber-100 text-amber-800",
  tense: "bg-orange-100 text-orange-800", volatile: "bg-red-100 text-red-800",
};

/* ── flat row for export ─────────────────────────────────────────────── */

interface FlatRow {
  child1: string; child2: string; quality: string; riskLevel: string;
  strengths: string; concerns: string; strategies: string;
  lastReview: string; nextReview: string; recentEntry: string;
  entryType: string; notes: string;
}

const EXPORT_COLS: ExportColumn<FlatRow>[] = [
  { header: "Child 1",       accessor: (r: FlatRow) => r.child1 },
  { header: "Child 2",       accessor: (r: FlatRow) => r.child2 },
  { header: "Quality",       accessor: (r: FlatRow) => r.quality },
  { header: "Risk Level",    accessor: (r: FlatRow) => r.riskLevel },
  { header: "Strengths",     accessor: (r: FlatRow) => r.strengths },
  { header: "Concerns",      accessor: (r: FlatRow) => r.concerns },
  { header: "Strategies",    accessor: (r: FlatRow) => r.strategies },
  { header: "Last Review",   accessor: (r: FlatRow) => r.lastReview },
  { header: "Next Review",   accessor: (r: FlatRow) => r.nextReview },
  { header: "Latest Entry",  accessor: (r: FlatRow) => r.recentEntry },
  { header: "Entry Type",    accessor: (r: FlatRow) => r.entryType },
  { header: "Notes",         accessor: (r: FlatRow) => r.notes },
];

/* ── component ────────────────────────────────────────────────────────── */

export default function PeerRelationshipsPage() {
  const { data: pairRes, isLoading: pairLoading } = usePeerDynamics();
  const { data: groupRes, isLoading: groupLoading } = usePeerGroupDynamics();
  const pairs: PeerDynamic[] = pairRes?.data ?? [];
  const groupDynamic: PeerGroupDynamic | undefined = (groupRes?.data ?? [])[0];
  const isLoading = pairLoading || groupLoading;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [filterQuality, setFilterQuality] = useState("all");
  const [sortBy, setSortBy] = useState("risk");
  const [dialogOpen, setDialogOpen] = useState(false);

  const createPeer = useCreatePeerDynamic();
  const [prForm, setPrForm] = useState({ child_id_1: "", child_id_2: "", entry_type: "observation" as PeerEntryType, description: "", outcome: "" });
  const setPR = (k: string, v: unknown) => setPrForm((p) => ({ ...p, [k]: v }));

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prForm.child_id_1 || !prForm.child_id_2) { toast.error("Please select both children."); return; }
    if (prForm.child_id_1 === prForm.child_id_2) { toast.error("Please select two different children."); return; }
    if (!prForm.description.trim()) { toast.error("Description is required."); return; }
    await createPeer.mutateAsync({ child_id_1: prForm.child_id_1, child_id_2: prForm.child_id_2, quality: "neutral", risk_level: "none", strengths: [], concerns: [], strategies: [], entries: [{ id: crypto.randomUUID(), date: new Date().toISOString(), type: prForm.entry_type, staff_witness: "staff_darren", intervention_used: "", description: prForm.description.trim(), outcome: prForm.outcome.trim() }], last_review_date: new Date().toISOString().slice(0, 10), reviewed_by: "staff_darren", next_review_due: "", notes: "", created_at: new Date().toISOString() });
    toast.success("Peer relationship entry saved.");
    setPrForm({ child_id_1: "", child_id_2: "", entry_type: "observation", description: "", outcome: "" });
    setDialogOpen(false);
  };

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const positive = pairs.filter((d) => d.quality === "positive").length;
    const concerns = pairs.filter((d) => ["strained", "conflicted"].includes(d.quality)).length;
    const highRisk = pairs.filter((d) => ["medium", "high"].includes(d.risk_level)).length;
    const totalEntries = pairs.reduce((s, d) => s + d.entries.length, 0);
    return { positive, concerns, highRisk, totalEntries };
  }, [pairs]);

  /* ── filtered / sorted ────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = pairs;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        getYPName(d.child_id_1).toLowerCase().includes(q) ||
        getYPName(d.child_id_2).toLowerCase().includes(q)
      );
    }
    if (filterQuality !== "all") list = list.filter((d) => d.quality === filterQuality);
    const out = [...list];
    switch (sortBy) {
      case "risk": {
        const o: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 };
        out.sort((a, b) => o[a.risk_level] - o[b.risk_level]);
        break;
      }
      case "quality": out.sort((a, b) => a.quality.localeCompare(b.quality)); break;
      case "recent": out.sort((a, b) => {
        const la = a.entries[0]?.date ?? ""; const lb = b.entries[0]?.date ?? "";
        return lb.localeCompare(la);
      }); break;
    }
    return out;
  }, [pairs, search, filterQuality, sortBy]);

  /* ── export ───────────────────────────────────────────────────────── */
  const exportData = useMemo<FlatRow[]>(() =>
    pairs.map((d) => ({
      child1: getYPName(d.child_id_1),
      child2: getYPName(d.child_id_2),
      quality: PEER_RELATIONSHIP_QUALITY_LABEL[d.quality],
      riskLevel: PEER_RISK_LEVEL_LABEL[d.risk_level],
      strengths: d.strengths.join("; "),
      concerns: d.concerns.join("; "),
      strategies: d.strategies.join("; "),
      lastReview: d.last_review_date,
      nextReview: d.next_review_due,
      recentEntry: d.entries[0]?.description ?? "—",
      entryType: d.entries[0] ? PEER_ENTRY_TYPE_LABEL[d.entries[0].type] : "—",
      notes: d.notes,
    })), [pairs]);

  /* ── loading ─────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <PageShell
        title="Peer Relationships"
        subtitle="Peer dynamic mapping, group living assessments and relationship tracking"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </PageShell>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <PageShell
      title="Peer Relationships"
      subtitle="Peer dynamic mapping, group living assessments and relationship tracking"
      caraContext={{ pageTitle: "Peer Relationships", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Peer Relationships" />
          <ExportButton data={exportData} columns={EXPORT_COLS} filename="peer-relationships" />
          <button onClick={() => setDialogOpen(true)} className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Log Entry
          </button>
          <CaraStudioQuickActionButton context={{ record_type: "direct_work", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Positive Dynamics", value: stats.positive, icon: Heart, colour: "text-green-600" },
          { label: "Strained/Conflicted", value: stats.concerns, icon: AlertTriangle, colour: stats.concerns > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Medium/High Risk", value: stats.highRisk, icon: ShieldAlert, colour: stats.highRisk > 0 ? "text-red-600" : "text-gray-400" },
          { label: "Total Observations", value: stats.totalEntries, icon: TrendingUp, colour: "text-blue-600" },
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

      {/* ── group dynamic card ─────────────────────────────────────── */}
      {groupDynamic && (
        <div className="rounded-lg border bg-white p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-400" />
                Group Dynamic Assessment
              </h3>
              <p className="text-xs text-gray-500">{groupDynamic.assessment_date} — {getStaffName(groupDynamic.assessed_by)}</p>
            </div>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", ATMOS_CLR[groupDynamic.overall_atmosphere])}>
              {PEER_GROUP_ATMOSPHERE_LABEL[groupDynamic.overall_atmosphere]}
            </span>
          </div>
          <p className="text-sm mb-3">{groupDynamic.current_dynamics}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md bg-green-50 p-3">
              <h4 className="text-xs font-semibold text-green-700 mb-1">Group Strengths</h4>
              <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                {groupDynamic.group_strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="rounded-md bg-amber-50 p-3">
              <h4 className="text-xs font-semibold text-amber-700 mb-1">Group Concerns</h4>
              <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                {groupDynamic.group_concerns.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          </div>
          {groupDynamic.recommendations.length > 0 && (
            <div className="mt-3 rounded-md bg-blue-50 p-3">
              <h4 className="text-xs font-semibold text-blue-700 mb-1">Recommendations</h4>
              <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                {groupDynamic.recommendations.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── filters ────────────────────────────────────────────────── */}
      <div id="peer-list" className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search children…" className="w-full rounded-md border py-2 pl-9 pr-3 text-sm" />
        </div>
        <Select value={filterQuality} onValueChange={setFilterQuality}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Qualities</SelectItem>
            {Object.entries(PEER_RELATIONSHIP_QUALITY_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="risk">Risk Level</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── pair cards ─────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((pd) => {
          const open = expanded[pd.id] ?? false;
          return (
            <div key={pd.id} className="rounded-lg border bg-white">
              <button onClick={() => toggle(pd.id)} className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{getYPName(pd.child_id_1)} ↔ {getYPName(pd.child_id_2)}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", QUALITY_CLR[pd.quality])}>{PEER_RELATIONSHIP_QUALITY_LABEL[pd.quality]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", RISK_CLR[pd.risk_level])}>Risk: {PEER_RISK_LEVEL_LABEL[pd.risk_level]}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{pd.entries.length} entries · Review {pd.next_review_due}</p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </button>

              {open && (
                <div className="border-t px-4 pb-4 space-y-4">
                  {/* strengths / concerns */}
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-green-50 p-3">
                      <h4 className="text-xs font-semibold text-green-700 mb-1">Strengths</h4>
                      <ul className="list-disc list-inside text-sm text-green-800 space-y-0.5">
                        {(pd.strengths ?? []).map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div className="rounded-md bg-amber-50 p-3">
                      <h4 className="text-xs font-semibold text-amber-700 mb-1">Concerns</h4>
                      <ul className="list-disc list-inside text-sm text-amber-800 space-y-0.5">
                        {(pd.concerns ?? []).map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    </div>
                  </div>

                  {/* strategies */}
                  <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                    <h4 className="text-xs font-semibold text-blue-700 mb-1">Management Strategies</h4>
                    <ul className="list-disc list-inside text-sm text-blue-800 space-y-0.5">
                      {(pd.strategies ?? []).map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>

                  {/* entries */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Entries &amp; Observations</h4>
                    <div className="space-y-3">
                      {pd.entries.map((e) => (
                        <div key={e.id} className="rounded-md border p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn("px-2 py-0.5 rounded text-xs font-medium",
                              e.type === "positive_interaction" ? "bg-green-100 text-green-800" :
                              e.type === "incident" ? "bg-red-100 text-red-800" :
                              e.type === "mediation" ? "bg-purple-100 text-purple-800" :
                              "bg-gray-100 text-gray-700"
                            )}>{PEER_ENTRY_TYPE_LABEL[e.type]}</span>
                            <span className="text-xs text-gray-500">{e.date} — {getStaffName(e.staff_witness)}</span>
                          </div>
                          <p className="text-sm mb-1">{e.description}</p>
                          {e.intervention_used && <p className="text-xs text-gray-600"><span className="font-medium">Intervention:</span> {e.intervention_used}</p>}
                          {e.outcome && <p className="text-xs text-gray-600"><span className="font-medium">Outcome:</span> {e.outcome}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* review info */}
                  <div className="rounded-md bg-gray-50 p-3 text-sm">
                    <span className="text-gray-500">Last reviewed:</span> {pd.last_review_date} by {getStaffName(pd.reviewed_by)} · <span className="text-gray-500">Next review:</span> <span className={cn(pd.next_review_due <= today ? "text-red-600 font-medium" : "")}>{pd.next_review_due}</span>
                  </div>

                  {/* notes */}
                  {pd.notes && (
                    <div className="rounded-md bg-pink-50 border border-pink-200 p-3">
                      <h4 className="text-xs font-semibold text-pink-700 mb-1">Key Worker Notes</h4>
                      <p className="text-sm text-pink-800">{pd.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── regulatory note ────────────────────────────────────────── */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 mb-6">
        <strong>Group Living &amp; Peer Dynamics:</strong> Reg 12 requires that the registered person protects children from bullying, harassment and exploitation. Regular assessment of peer dynamics is essential for anticipating conflict, managing group living pressures, and ensuring all children feel safe. Impact assessments for new admissions should always consider existing peer relationships.
      </div>

      {/* ── dialog ─────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Log Peer Relationship Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleSaveEntry} className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Child 1 *</label>
                <Select value={prForm.child_id_1} onValueChange={(v) => setPR("child_id_1", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Child 2 *</label>
                <Select value={prForm.child_id_2} onValueChange={(v) => setPR("child_id_2", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{YOUNG_PEOPLE.filter((y) => y.status === "current").map((y) => <SelectItem key={y.id} value={y.id}>{y.preferred_name ?? y.first_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Entry Type</label>
              <Select value={prForm.entry_type} onValueChange={(v) => setPR("entry_type", v)}><SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{Object.entries(PEER_ENTRY_TYPE_LABEL).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description *</label>
              <textarea rows={3} className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="Describe the interaction or observation…" value={prForm.description} onChange={(e) => setPR("description", e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Outcome</label>
              <input className="mt-1 w-full rounded-md border px-3 py-2 text-sm" placeholder="What happened as a result?" value={prForm.outcome} onChange={(e) => setPR("outcome", e.target.value)} />
            </div>
            <DialogFooter>
              <button type="button" onClick={() => setDialogOpen(false)} className="rounded-md border px-3 py-1.5 text-sm">Cancel</button>
              <button type="submit" disabled={createPeer.isPending} className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">{createPeer.isPending ? "Saving…" : "Save Entry"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <CareEventsPanel
        title="Care Events — Behaviour & Wellbeing"
        category={["behaviour", "wellbeing"]}
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Peer Relationships — friendships, peer dynamics, conflict, bullying, positive relationships, peer group concerns, peer support, social development, care plan evidence, Reg 45"
        recordType="direct_work"
        className="mt-6"
      />
    </PageShell>
  );
}
