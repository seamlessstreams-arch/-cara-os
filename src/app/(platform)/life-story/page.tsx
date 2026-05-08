"use client";

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PrintButton } from "@/components/ui/print-button";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import {
  Search, ArrowUpDown, X, Plus, BookOpen,
  CheckCircle2, Clock, User, Calendar,
  ChevronDown, ChevronUp, Shield, Heart, Star,
  Camera, Palette, MapPin,
  Loader2,
} from "lucide-react";
import { useLifeStoryEntries, useCreateLifeStoryEntry } from "@/hooks/use-life-story-entries";
import type { LifeStoryEntry, LifeStoryEntryType, LifeStoryEntryStatus } from "@/types/extended";
import { LIFE_STORY_ENTRY_TYPE_LABEL, LIFE_STORY_ENTRY_STATUS_LABEL } from "@/types/extended";

/* ── UI metadata ──────────────────────────────────────────────────────────── */

const TYPE_CONFIG: Record<LifeStoryEntryType, { label: string; colour: string; icon: React.ElementType }> = {
  memory:      { label: "Memory",        colour: "bg-blue-100 text-blue-700",     icon: BookOpen },
  milestone:   { label: "Milestone",     colour: "bg-green-100 text-green-700",   icon: Star     },
  heritage:    { label: "Heritage",      colour: "bg-purple-100 text-purple-700", icon: MapPin   },
  identity:    { label: "Identity",      colour: "bg-pink-100 text-pink-700",     icon: Heart    },
  wish:        { label: "Wish / Dream",  colour: "bg-amber-100 text-amber-700",   icon: Star     },
  achievement: { label: "Achievement",   colour: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  photo_story: { label: "Photo Story",   colour: "bg-cyan-100 text-cyan-700",     icon: Camera   },
  creative:    { label: "Creative Work", colour: "bg-rose-100 text-rose-700",     icon: Palette  },
};

const STATUS_CONFIG: Record<LifeStoryEntryStatus, { label: string; colour: string }> = {
  in_progress: { label: "In Progress", colour: "bg-blue-100 text-blue-700"   },
  completed:   { label: "Completed",   colour: "bg-green-100 text-green-700" },
  planned:     { label: "Planned",     colour: "bg-gray-100 text-gray-600"   },
};

export default function LifeStoryPage() {
  const { data: res, isLoading } = useLifeStoryEntries();
  const entries: LifeStoryEntry[] = res?.data ?? [];
  const createMut = useCreateLifeStoryEntry();

  const [search, setSearch] = useState("");
  const [childFilter, setChildFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "completed" | "planned">("all");

  const [nChild, setNChild] = useState("");
  const [nType, setNType] = useState<LifeStoryEntryType | "">("");
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nVoice, setNVoice] = useState("");

  const childIds = useMemo(() => [...new Set(entries.map(e => e.child_id))], [entries]);

  const filtered = useMemo(() => {
    let list = [...entries];
    if (tab === "completed") list = list.filter(e => e.status === "completed");
    if (tab === "planned") list = list.filter(e => e.status === "planned");
    if (childFilter !== "all") list = list.filter(e => e.child_id === childFilter);
    if (typeFilter !== "all") list = list.filter(e => e.type === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.child_voice.toLowerCase().includes(q) ||
        getYPName(e.child_id).toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "newest": return b.created_at.localeCompare(a.created_at);
        case "oldest": return a.created_at.localeCompare(b.created_at);
        case "child":  return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "type":   return a.type.localeCompare(b.type);
        default: return 0;
      }
    });
    return list;
  }, [entries, search, childFilter, typeFilter, sortBy, tab]);

  const stats = useMemo(() => ({
    total: entries.length,
    completed: entries.filter(e => e.status === "completed").length,
    planned: entries.filter(e => e.status === "planned").length,
    inBook: entries.filter(e => e.linked_to_book).length,
    withVoice: entries.filter(e => e.child_voice.length > 0).length,
  }), [entries]);

  const childCounts = useMemo(() => {
    const map = new Map<string, { total: number; inBook: number }>();
    entries.forEach(e => {
      const cur = map.get(e.child_id) || { total: 0, inBook: 0 };
      cur.total++;
      if (e.linked_to_book) cur.inBook++;
      map.set(e.child_id, cur);
    });
    return map;
  }, [entries]);

  const exportCols: ExportColumn<LifeStoryEntry>[] = [
    { header: "ID", accessor: r => r.id },
    { header: "Child", accessor: r => getYPName(r.child_id) },
    { header: "Date", accessor: r => r.date },
    { header: "Type", accessor: r => LIFE_STORY_ENTRY_TYPE_LABEL[r.type] },
    { header: "Title", accessor: r => r.title },
    { header: "Description", accessor: r => r.description },
    { header: "Child's Voice", accessor: r => r.child_voice },
    { header: "Facilitator", accessor: r => getStaffName(r.facilitator) },
    { header: "Status", accessor: r => LIFE_STORY_ENTRY_STATUS_LABEL[r.status] },
    { header: "In Book", accessor: r => r.linked_to_book ? "Yes" : "No" },
  ];

  const handleCreate = () => {
    if (!nChild || !nType || !nTitle || !nDesc) return;
    createMut.mutate({
      child_id: nChild,
      date: new Date().toISOString().slice(0, 10),
      type: nType as LifeStoryEntryType,
      title: nTitle,
      description: nDesc,
      child_voice: nVoice,
      facilitator: "staff_darren",
      status: "completed",
      linked_to_book: false,
    });
    setShowNew(false);
    setNChild(""); setNType(""); setNTitle(""); setNDesc(""); setNVoice("");
  };

  if (isLoading) return <PageShell title="Life Story Work" subtitle="Loading…"><div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div></PageShell>;

  return (
    <PageShell
      title="Life Story Work"
      subtitle="Identity, heritage, memories, and milestones"
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Life Story Work" />
          <ExportButton data={filtered} columns={exportCols} filename="life-story-work" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Entry
          </Button>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Entries",  value: stats.total, icon: BookOpen, c: "text-blue-600" },
          { label: "Completed",      value: stats.completed, icon: CheckCircle2, c: "text-green-600" },
          { label: "Planned",        value: stats.planned, icon: Clock, c: "text-amber-600" },
          { label: "In Life Book",   value: stats.inBook, icon: BookOpen, c: "text-purple-600" },
          { label: "Child Voice",    value: stats.withVoice, icon: Heart, c: "text-pink-600" },
        ].map(s => (
          <div key={s.label} className="rounded-lg border bg-card p-3 flex items-center gap-3">
            <s.icon className={cn("h-5 w-5", s.c)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {childIds.map(cid => {
          const c = childCounts.get(cid)!;
          return (
            <div key={cid} className="rounded-lg border bg-card p-3">
              <p className="font-medium text-sm mb-1">{getYPName(cid)}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{c.total} entries</span>
                <span>{c.inBook} in life book</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All", count: entries.length },
          { key: "completed", label: "Completed", count: stats.completed },
          { key: "planned", label: "Planned", count: stats.planned },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn(
            "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          )}>
            {t.label} <span className="text-xs ml-1 text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        <Select value={childFilter} onValueChange={setChildFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Children</SelectItem>
            {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {(Object.entries(TYPE_CONFIG) as [LifeStoryEntryType, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="child">By Child</SelectItem>
              <SelectItem value="type">By Type</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
        {(search || childFilter !== "all" || typeFilter !== "all") && " (filtered)"}
      </p>

      <div className="space-y-3" id="life-story-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No entries found</p>
          </div>
        )}

        {filtered.map(entry => {
          const isOpen = expandedId === entry.id;
          const tc = TYPE_CONFIG[entry.type];
          const sc = STATUS_CONFIG[entry.status];
          const Icon = tc.icon;

          return (
            <div key={entry.id} className="rounded-lg border bg-card overflow-hidden">
              <button onClick={() => setExpandedId(isOpen ? null : entry.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors">
                <div className={cn("rounded-full p-1.5 shrink-0", tc.colour)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{entry.title}</span>
                    <Badge variant="outline" className={cn("text-xs", tc.colour)}>{tc.label}</Badge>
                    <Badge variant="outline" className={cn("text-xs", sc.colour)}>{sc.label}</Badge>
                    {entry.linked_to_book && <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">In Book</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {getYPName(entry.child_id)} · {getStaffName(entry.facilitator)} · {entry.date}
                  </p>
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Description</p>
                    <p className="text-sm">{entry.description}</p>
                  </div>
                  {entry.child_voice && (
                    <div className="rounded-lg border border-pink-200 bg-pink-50 dark:bg-pink-950/20 p-3">
                      <p className="text-xs font-semibold text-pink-700 uppercase mb-1">Child&apos;s Voice</p>
                      <p className="text-sm italic text-pink-900 dark:text-pink-200">{entry.child_voice}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{getStaffName(entry.facilitator)}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{entry.date}</span>
                  </div>

                  <SmartLinkPanel sourceType="life-story-entries" sourceId={entry.id} childId={entry.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              <strong>Quality Standard 3 (Identity)</strong> requires that children understand their history and feel a
              sense of belonging. Life story work supports children to develop a coherent narrative about their life.
              <strong> Regulation 11 (Positive Relationships)</strong> emphasises that staff should help children
              understand and make sense of their experiences. All entries should capture the child&apos;s own voice.
            </p>
          </div>
        </div>
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Life Story Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Child *</label>
              <Select value={nChild} onValueChange={setNChild}>
                <SelectTrigger><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Type *</label>
              <Select value={nType} onValueChange={v => setNType(v as LifeStoryEntryType)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(TYPE_CONFIG) as [LifeStoryEntryType, { label: string }][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Title *</label>
              <Input placeholder="Title" value={nTitle} onChange={e => setNTitle(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description *</label>
              <Textarea placeholder="What happened, what was explored..." value={nDesc} onChange={e => setNDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Child&apos;s Voice</label>
              <Textarea placeholder="What did the child say? Use their words..." value={nVoice} onChange={e => setNVoice(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nChild || !nType || !nTitle || !nDesc}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
