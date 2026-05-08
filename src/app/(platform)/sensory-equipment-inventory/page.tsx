"use client";

import { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ArrowUpDown, Sparkles, Package, Heart, AlertTriangle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSensoryEquipmentRecords } from "@/hooks/use-sensory-equipment-records";
import type { SensoryEquipmentRecord, SensoryEquipmentCategory, SensoryEquipmentCondition } from "@/types/extended";
import {
  SENSORY_EQUIPMENT_CATEGORY_LABEL,
  SENSORY_EQUIPMENT_LOCATION_LABEL,
  SENSORY_EQUIPMENT_CONDITION_LABEL,
  SENSORY_EQUIPMENT_USE_FREQUENCY_LABEL,
} from "@/types/extended";

/* ── local config ─────────────────────────────────────────────────────── */

const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

const categoryColour: Record<SensoryEquipmentCategory, string> = {
  weighted_proprioceptive: "bg-purple-100 text-purple-800",
  tactile_fidget: "bg-amber-100 text-amber-800",
  visual_lighting: "bg-blue-100 text-blue-800",
  auditory: "bg-emerald-100 text-emerald-800",
  vestibular: "bg-pink-100 text-pink-800",
  olfactory: "bg-rose-100 text-rose-800",
  oral_motor: "bg-indigo-100 text-indigo-800",
  compression: "bg-purple-100 text-purple-800",
  calming: "bg-cyan-100 text-cyan-800",
};

const conditionColour: Record<SensoryEquipmentCondition, string> = {
  excellent: "bg-green-100 text-green-800",
  good: "bg-blue-100 text-blue-800",
  worn_replace_soon: "bg-amber-100 text-amber-800",
  damaged_out_of_use: "bg-red-100 text-red-800",
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function SensoryEquipmentInventoryPage() {
  const { data: records = [], isLoading } = useSensoryEquipmentRecords();
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCondition, setFilterCondition] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = [...records];
    if (filterCategory !== "all") items = items.filter((i) => i.category === filterCategory);
    if (filterCondition !== "all") items = items.filter((i) => i.condition === filterCondition);
    items.sort((a, b) => sortBy === "name" ? a.item_name.localeCompare(b.item_name) : sortBy === "replacement" ? a.replacement_due.localeCompare(b.replacement_due) : 0);
    return items;
  }, [records, filterCategory, filterCondition, sortBy]);

  const total = records.length;
  const childAssigned = records.filter((i) => i.assigned_to_child).length;
  const dueReplacement = records.filter((i) => i.replacement_due <= d(60) || i.condition === "worn_replace_soon" || i.condition === "damaged_out_of_use").length;
  const categories = new Set(records.map((i) => i.category)).size;

  const exportCols: ExportColumn<SensoryEquipmentRecord>[] = [
    { header: "Item", accessor: (r) => r.item_name },
    { header: "Category", accessor: (r) => SENSORY_EQUIPMENT_CATEGORY_LABEL[r.category] },
    { header: "Location", accessor: (r) => SENSORY_EQUIPMENT_LOCATION_LABEL[r.location] },
    { header: "Assigned", accessor: (r) => r.assigned_to_child ? getYPName(r.assigned_to_child) : "Shared" },
    { header: "Condition", accessor: (r) => SENSORY_EQUIPMENT_CONDITION_LABEL[r.condition] },
    { header: "Use Frequency", accessor: (r) => SENSORY_EQUIPMENT_USE_FREQUENCY_LABEL[r.use_frequency] },
    { header: "Cost £", accessor: (r) => `£${r.purchase_cost}` },
    { header: "Replacement Due", accessor: (r) => r.replacement_due },
  ];

  if (isLoading) {
    return (
      <PageShell title="Sensory Equipment Inventory" subtitle="All sensory regulation items — owned, shared, mobile — with condition, replacement, and child assignment">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Sensory Equipment Inventory" subtitle="All sensory regulation items — owned, shared, mobile — with condition, replacement, and child assignment"
      actions={<div className="flex items-center gap-2"><ExportButton data={records} columns={exportCols} filename="sensory-equipment-inventory" /><PrintButton title="Sensory Equipment Inventory" /></div>}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold">{total}</p><p className="text-xs text-muted-foreground">Total Items</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-pink-600">{childAssigned}</p><p className="text-xs text-muted-foreground">Child-Assigned</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className={cn("text-2xl font-bold", dueReplacement > 0 ? "text-amber-600" : "text-green-600")}>{dueReplacement}</p><p className="text-xs text-muted-foreground">Due Replacement</p></div>
        <div className="rounded-xl border bg-white p-4 text-center"><p className="text-2xl font-bold text-blue-600">{categories}</p><p className="text-xs text-muted-foreground">Categories</p></div>
      </div>
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 mb-6 flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
        <p className="text-sm text-purple-800">Sensory equipment is meaningful, individual, and respected. Casey&apos;s items are sacred — Otter is non-replaceable without consent. Items chosen with input from OT, child, and staff. Items wear; we replace responsively.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.keys(SENSORY_EQUIPMENT_CATEGORY_LABEL) as SensoryEquipmentCategory[]).map((c) => (
              <SelectItem key={c} value={c}>{SENSORY_EQUIPMENT_CATEGORY_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterCondition} onValueChange={setFilterCondition}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Conditions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Conditions</SelectItem>
            {(Object.keys(SENSORY_EQUIPMENT_CONDITION_LABEL) as SensoryEquipmentCondition[]).map((c) => (
              <SelectItem key={c} value={c}>{SENSORY_EQUIPMENT_CONDITION_LABEL[c]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1"><ArrowUpDown className="h-4 w-4 text-muted-foreground" /><Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="name">By Name</SelectItem><SelectItem value="replacement">Replacement Due</SelectItem></SelectContent></Select></div>
      </div>
      <div className="space-y-3">
        {filtered.map((i) => {
          const isExpanded = expandedId === i.id;
          const isCritical = i.notes?.toLowerCase().includes("do not replace");
          return (
            <div key={i.id} className={cn("rounded-xl border bg-white overflow-hidden", isCritical && "border-l-4 border-l-pink-500")}>
              <button className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : i.id)}>
                <div className="flex items-center gap-3 flex-1 min-w-0"><Package className="h-5 w-5 text-purple-600 shrink-0" /><div className="min-w-0"><p className="font-medium truncate">{i.item_name}</p><p className="text-xs text-muted-foreground mt-0.5">{SENSORY_EQUIPMENT_LOCATION_LABEL[i.location]} &middot; {i.assigned_to_child ? getYPName(i.assigned_to_child) : "Shared"} &middot; {SENSORY_EQUIPMENT_USE_FREQUENCY_LABEL[i.use_frequency]}</p></div></div>
                <div className="flex items-center gap-2 shrink-0 ml-3"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryColour[i.category])}>{SENSORY_EQUIPMENT_CATEGORY_LABEL[i.category]}</span><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", conditionColour[i.condition])}>{SENSORY_EQUIPMENT_CONDITION_LABEL[i.condition]}</span>{isCritical && <Heart className="h-4 w-4 text-pink-500" />}{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
              </button>
              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-3 text-sm">
                  <div className="bg-blue-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Sensory Profile / Function</p><p>{i.sensory_profile}</p></div>
                  <div className="bg-pink-50 rounded-lg p-3"><p className="text-xs font-semibold text-pink-800 uppercase tracking-wide mb-1">Child Preference / Use</p><p>{i.child_preference}</p></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2"><div className="bg-white rounded-lg p-2 border"><p className="text-xs text-muted-foreground">Purchased</p><p className="font-medium">{i.purchase_date}</p></div><div className="bg-white rounded-lg p-2 border"><p className="text-xs text-muted-foreground">Cost</p><p className="font-medium">£{i.purchase_cost}</p></div><div className="bg-white rounded-lg p-2 border"><p className="text-xs text-muted-foreground">Replace Due</p><p className="font-medium">{i.replacement_due}</p></div><div className="bg-white rounded-lg p-2 border"><p className="text-xs text-muted-foreground">Recommended By</p><p className="font-medium">{i.recommended_by}</p></div></div>
                  {i.notes && <div className="bg-amber-50 rounded-lg p-3"><p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1"><AlertTriangle className="h-3 w-3 inline mr-1" />Notes</p><p>{i.notes}</p></div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 rounded-lg bg-muted/50 border p-4"><p className="text-xs text-muted-foreground"><strong>Regulatory Context:</strong> Sensory equipment supports Quality Standard 5 (protection — non-restrictive practice), Quality Standard 7 (health and wellbeing). Linked to Sensory Profiles, Bedroom Personalisation, and Sensory Room Usage.</p></div>
    </PageShell>
  );
}
