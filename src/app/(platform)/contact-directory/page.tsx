"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONTACT DIRECTORY
// Directory of all external professional contacts linked to the home and
// individual children: social workers, IROs, GPs, CAMHS, schools, police,
// Ofsted, local authority, advocates, and emergency contacts.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
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
import { cn, formatDate } from "@/lib/utils";
import { useAuthContext } from "@/contexts/auth-context";
import { PrintButton } from "@/components/common/print-button";
import { ExportButton, type ExportColumn } from "@/components/common/export-button";
import { getYPName } from "@/lib/seed-data";
import { toast } from "sonner";
import type { ContactDirectoryEntry, ContactCategory } from "@/types/extended";
import {
  useContactDirectoryEntries,
  useCreateContactDirectoryEntry,
} from "@/hooks/use-contact-directory-entries";
import {
  Search, ArrowUpDown, X, Plus, Phone, Mail, User,
  ChevronDown, ChevronUp, Shield, Building2,
  AlertTriangle, Copy, CheckCircle2,
} from "lucide-react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Config ────────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<ContactCategory, { label: string; colour: string }> = {
  social_worker:   { label: "Social Worker",   colour: "bg-blue-100 text-blue-700"     },
  iro:             { label: "IRO",             colour: "bg-purple-100 text-purple-700" },
  gp:              { label: "GP",              colour: "bg-green-100 text-green-700"   },
  dentist:         { label: "Dentist",         colour: "bg-cyan-100 text-cyan-700"     },
  camhs:           { label: "CAMHS",           colour: "bg-rose-100 text-rose-700"     },
  school:          { label: "School",          colour: "bg-amber-100 text-amber-700"   },
  police:          { label: "Police",          colour: "bg-slate-100 text-slate-700"   },
  ofsted:          { label: "Ofsted",          colour: "bg-red-100 text-red-700"       },
  local_authority: { label: "Local Authority", colour: "bg-indigo-100 text-indigo-700" },
  advocate:        { label: "Advocate",        colour: "bg-emerald-100 text-emerald-700" },
  therapist:       { label: "Therapist",       colour: "bg-pink-100 text-pink-700"     },
  emergency:       { label: "Emergency",       colour: "bg-red-100 text-red-800"       },
  other:           { label: "Other",           colour: "bg-gray-100 text-gray-600"     },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function ContactDirectoryPage() {
  const { currentUser } = useAuthContext();

  const { data, isLoading } = useContactDirectoryEntries();
  const createMutation = useCreateContactDirectoryEntry();
  const contacts: ContactDirectoryEntry[] = data?.data ?? [];

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [tab, setTab] = useState<"all" | "by_child" | "emergency">("all");
  const [childFilter, setChildFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // new form
  const [nName, setNName] = useState("");
  const [nRole, setNRole] = useState("");
  const [nOrg, setNOrg] = useState("");
  const [nCategory, setNCategory] = useState<ContactCategory | "">("");
  const [nPhone, setNPhone] = useState("");
  const [nEmail, setNEmail] = useState("");
  const [nAddress, setNAddress] = useState("");
  const [nNotes, setNNotes] = useState("");
  const [nEmergency, setNEmergency] = useState(false);

  const childIds = ["yp_alex", "yp_jordan", "yp_casey"];

  if (isLoading) return <PageShell title="Contact Directory" subtitle="Professional contacts and emergency numbers"><div /></PageShell>;

  /* ── copy helper ────────────────────────────────────────────────────────── */
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  /* ── filtering ──────────────────────────────────────────────────────────── */
  const filtered = (() => {
    let list = [...contacts];
    if (tab === "emergency") list = list.filter(c => c.is_emergency);
    if (tab === "by_child" && childFilter !== "all") list = list.filter(c => c.linked_children.includes(childFilter));
    if (categoryFilter !== "all") list = list.filter(c => c.category === categoryFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.organisation.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name": return a.name.localeCompare(b.name);
        case "category": return a.category.localeCompare(b.category);
        case "organisation": return a.organisation.localeCompare(b.organisation);
        case "updated": return b.last_updated.localeCompare(a.last_updated);
        default: return 0;
      }
    });
    return list;
  })();

  /* ── stats ──────────────────────────────────────────────────────────────── */
  const stats = {
    total: contacts.length,
    linked: contacts.filter(c => c.linked_children.length > 0).length,
    emergency: contacts.filter(c => c.is_emergency).length,
    categories: new Set(contacts.map(c => c.category)).size,
    recentlyUpdated: contacts.filter(c => {
      const diff = (Date.now() - new Date(c.last_updated).getTime()) / 86400000;
      return diff <= 30;
    }).length,
  };

  /* ── export ─────────────────────────────────────────────────────────────── */
  const exportCols: ExportColumn<ContactDirectoryEntry>[] = [
    { header: "Name", accessor: r => r.name },
    { header: "Role", accessor: r => r.role },
    { header: "Organisation", accessor: r => r.organisation },
    { header: "Category", accessor: r => CATEGORY_CONFIG[r.category].label },
    { header: "Phone", accessor: r => r.phone },
    { header: "Email", accessor: r => r.email },
    { header: "Address", accessor: r => r.address },
    { header: "Linked Children", accessor: r => r.linked_children.map(c => getYPName(c)).join(", ") },
    { header: "Emergency", accessor: r => r.is_emergency ? "Yes" : "No" },
    { header: "Notes", accessor: r => r.notes },
    { header: "Last Updated", accessor: r => r.last_updated },
  ];

  /* ── create ─────────────────────────────────────────────────────────────── */
  const handleCreate = () => {
    if (!nName || !nRole || !nCategory) return;
    createMutation.mutate(
      {
        name: nName,
        role: nRole,
        organisation: nOrg,
        category: nCategory as ContactCategory,
        phone: nPhone,
        email: nEmail,
        address: nAddress,
        linked_children: [],
        is_emergency: nEmergency,
        notes: nNotes,
      },
      {
        onSuccess: () => {
          toast.success("Contact added");
          setShowNew(false);
          setNName(""); setNRole(""); setNOrg(""); setNCategory("");
          setNPhone(""); setNEmail(""); setNAddress(""); setNNotes(""); setNEmergency(false);
        },
      }
    );
  };

  return (
    <PageShell
      title="Contact Directory"
      subtitle="Professional contacts and emergency numbers"
      ariaContext={{ pageTitle: "Related Care Events", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Contact Directory" subtitle="Oak House — Professional Contacts" />
          <ExportButton data={filtered} columns={exportCols} filename="contact-directory" />
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Contact
          </Button>
        </div>
      }
    >
      {/* ── Stats ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Total Contacts",  value: stats.total, icon: User, c: "text-blue-600" },
          { label: "Child-Linked",    value: stats.linked, icon: User, c: "text-green-600" },
          { label: "Emergency",       value: stats.emergency, icon: AlertTriangle, c: "text-red-600" },
          { label: "Categories",      value: stats.categories, icon: Building2, c: "text-purple-600" },
          { label: "Updated (30d)",   value: stats.recentlyUpdated, icon: CheckCircle2, c: "text-indigo-600" },
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

      {/* ── Emergency banner ──────────────────────────────────────────────────── */}
      {stats.emergency > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 p-3 mb-6">
          <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Emergency Contacts</p>
          <div className="flex flex-wrap gap-3">
            {contacts.filter(c => c.is_emergency).map(c => (
              <div key={c.id} className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded px-3 py-1.5 border border-red-200">
                <Phone className="h-3.5 w-3.5 text-red-600" />
                <span className="text-sm font-medium">{c.name}</span>
                <span className="text-sm text-muted-foreground">{c.phone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tabs ──────────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "all", label: "All Contacts", count: contacts.length },
          { key: "by_child", label: "By Child", count: stats.linked },
          { key: "emergency", label: "Emergency", count: stats.emergency },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label} <span className="text-xs ml-1 text-muted-foreground">({t.count})</span>
          </button>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search name, role, phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5"><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
        {tab === "by_child" && (
          <Select value={childFilter} onValueChange={setChildFilter}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue placeholder="Child" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {childIds.map(c => <SelectItem key={c} value={c}>{getYPName(c)}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(Object.entries(CATEGORY_CONFIG) as [ContactCategory, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Name</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
              <SelectItem value="organisation">By Organisation</SelectItem>
              <SelectItem value="updated">Recently Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3">
        {filtered.length} contact{filtered.length !== 1 ? "s" : ""}
        {(search || categoryFilter !== "all") && " (filtered)"}
      </p>

      {/* ── Contact Cards ─────────────────────────────────────────────────────── */}
      <div className="space-y-3" id="contacts-print">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No contacts found</p>
          </div>
        )}

        {filtered.map(contact => {
          const isOpen = expandedId === contact.id;
          const cc = CATEGORY_CONFIG[contact.category];

          return (
            <div key={contact.id} className={cn("rounded-lg border bg-card overflow-hidden",
              contact.is_emergency && "border-red-200"
            )}>
              <button
                onClick={() => setExpandedId(isOpen ? null : contact.id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
              >
                <div className={cn("rounded-full p-1.5 shrink-0", cc.colour)}>
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{contact.name}</span>
                    <Badge variant="outline" className={cn("text-xs", cc.colour)}>{cc.label}</Badge>
                    {contact.is_emergency && (
                      <Badge className="text-xs bg-red-600 text-white">Emergency</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {contact.role} · {contact.organisation}
                    {contact.linked_children.length > 0 && ` · ${contact.linked_children.map(c => getYPName(c)).join(", ")}`}
                  </p>
                </div>
                {/* quick contact */}
                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  {contact.phone && (
                    <button
                      onClick={() => copyToClipboard(contact.phone, `phone-${contact.id}`)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={`Copy: ${contact.phone}`}
                    >
                      {copiedId === `phone-${contact.id}` ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                  {contact.email && (
                    <button
                      onClick={() => copyToClipboard(contact.email, `email-${contact.id}`)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={`Copy: ${contact.email}`}
                    >
                      {copiedId === `email-${contact.id}` ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
                {isOpen ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t px-4 py-3 space-y-3 bg-muted/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.phone}</span>
                        <button onClick={() => copyToClipboard(contact.phone, `det-phone-${contact.id}`)} className="p-1 hover:bg-muted rounded">
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{contact.email}</span>
                        <button onClick={() => copyToClipboard(contact.email, `det-email-${contact.id}`)} className="p-1 hover:bg-muted rounded">
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </div>
                  {contact.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>{contact.address}</span>
                    </div>
                  )}
                  {contact.linked_children.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Linked Children</p>
                      <div className="flex gap-1 flex-wrap">
                        {contact.linked_children.map(c => (
                          <Badge key={c} variant="outline" className="text-xs">{getYPName(c)}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {contact.notes && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p>
                      <p className="text-sm">{contact.notes}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Last updated: {formatDate(contact.last_updated)}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Regulatory Note ───────────────────────────────────────────────────── */}
      <div className="mt-8 rounded-lg border border-dashed p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-semibold">Regulatory Context</p>
            <p>
              Children&apos;s homes must maintain up-to-date contact details for all professionals involved in each
              child&apos;s care, including social workers, IROs, GPs, and specialist services. Emergency contact numbers
              must be readily accessible to all staff. <strong>Schedule 4</strong> requires records of contacts made
              and <strong>Regulation 22</strong> requires the home to notify relevant persons of significant events.
            </p>
          </div>
        </div>
      </div>

      {/* ══ New Dialog ════════════════════════════════════════════════════════ */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Name *</label>
              <Input placeholder="Full name" value={nName} onChange={e => setNName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Role *</label>
                <Input placeholder="Job title" value={nRole} onChange={e => setNRole(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Category *</label>
                <Select value={nCategory} onValueChange={v => setNCategory(v as ContactCategory)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CATEGORY_CONFIG) as [ContactCategory, { label: string }][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Organisation</label>
              <Input placeholder="Organisation" value={nOrg} onChange={e => setNOrg(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Phone</label>
                <Input placeholder="Phone number" value={nPhone} onChange={e => setNPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <Input placeholder="Email" value={nEmail} onChange={e => setNEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Address</label>
              <Input placeholder="Address" value={nAddress} onChange={e => setNAddress(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea placeholder="Additional notes..." value={nNotes} onChange={e => setNNotes(e.target.value)} rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={nEmergency} onChange={e => setNEmergency(e.target.checked)} className="rounded" />
              Emergency contact
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!nName || !nRole || !nCategory}>Save Contact</Button>
          </DialogFooter>
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
