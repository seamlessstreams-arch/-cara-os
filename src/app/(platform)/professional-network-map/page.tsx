"use client";

import { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Search,
  Users,
  AlertTriangle,
  Clock,
  Network,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { cn } from "@/lib/utils";
import { getYPName } from "@/lib/seed-data";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useProfessionalNetworkContacts } from "@/hooks/use-professional-network-contacts";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import type { ProfessionalNetworkContact, NetworkContactFrequency } from "@/types/extended";
import { NETWORK_CONTACT_FREQUENCY_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

/* ── constants ─────────────────────────────────────────────────────────── */

const FREQUENCY_DAYS: Record<NetworkContactFrequency, number> = {
  weekly: 7,
  fortnightly: 14,
  monthly: 30,
  quarterly: 90,
  termly: 120,
  annually: 365,
};

function getContactFreshness(lastContact: string, frequency: NetworkContactFrequency): "green" | "amber" | "red" {
  const daysSince = Math.floor((Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24));
  const expected = FREQUENCY_DAYS[frequency] ?? 30;
  if (daysSince <= expected) return "green";
  if (daysSince <= expected * 1.5) return "amber";
  return "red";
}

const FRESHNESS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  green: { bg: "bg-green-100", text: "text-green-700", label: "Up to date" },
  amber: { bg: "bg-amber-100", text: "text-amber-700", label: "Due" },
  red:   { bg: "bg-red-100",   text: "text-red-700",   label: "Overdue" },
};

/* ── component ─────────────────────────────────────────────────────────── */

export default function ProfessionalNetworkMapPage() {
  const { data: records = [], isLoading } = useProfessionalNetworkContacts();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterYP, setFilterYP] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [sortBy, setSortBy] = useState("yp");

  const roles = useMemo(() => [...new Set(records.map((r) => r.role))].sort(), [records]);

  /* ── stats ── */
  const stats = useMemo(() => {
    const active = records.filter((r) => r.is_active);
    const overdue = active.filter((r) => getContactFreshness(r.last_contact, r.contact_frequency) === "red").length;
    const ypSet = new Set(active.map((r) => r.child_id));
    const avgNetwork = ypSet.size > 0 ? Math.round(active.length / ypSet.size) : 0;
    const activeReferrals = active.filter((r) => r.role === "Advocate" || r.role === "CAMHS Therapist" || r.role === "YOT Worker").length;
    return { total: active.length, overdue, avgNetwork, activeReferrals };
  }, [records]);

  /* ── filtered + sorted ── */
  const filtered = useMemo(() => {
    let list = [...records];
    if (filterYP !== "all") list = list.filter((r) => r.child_id === filterYP);
    if (filterRole !== "all") list = list.filter((r) => r.role === filterRole);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.organisation.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "role": return a.role.localeCompare(b.role);
        case "lastContact": return b.last_contact.localeCompare(a.last_contact);
        case "name": return a.name.localeCompare(b.name);
        default: return a.child_id.localeCompare(b.child_id);
      }
    });
    return list;
  }, [records, filterYP, filterRole, search, sortBy]);

  /* ── grouped by YP ── */
  const grouped = useMemo(() => {
    const map = new Map<string, ProfessionalNetworkContact[]>();
    for (const item of filtered) {
      const existing = map.get(item.child_id) || [];
      existing.push(item);
      map.set(item.child_id, existing);
    }
    return map;
  }, [filtered]);

  /* ── export ── */
  const exportCols: ExportColumn<ProfessionalNetworkContact>[] = [
    { header: "Young Person", accessor: (r) => getYPName(r.child_id) },
    { header: "Role", accessor: (r) => r.role },
    { header: "Name", accessor: (r) => r.name },
    { header: "Organisation", accessor: (r) => r.organisation },
    { header: "Phone", accessor: (r) => r.phone },
    { header: "Email", accessor: (r) => r.email },
    { header: "Last Contact", accessor: (r) => r.last_contact },
    { header: "Contact Frequency", accessor: (r) => NETWORK_CONTACT_FREQUENCY_LABEL[r.contact_frequency] },
    { header: "Key Responsibilities", accessor: (r) => r.key_responsibilities.join("; ") },
    { header: "Notes", accessor: (r) => r.notes },
    { header: "Active", accessor: (r) => r.is_active ? "Yes" : "No" },
  ];

  const ypIds = [...new Set(records.map((r) => r.child_id))];

  if (isLoading) {
    return (
      <PageShell title="Professional Network Map" subtitle="Quality Standard 1 — Multi-agency professional contacts for each child">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Professional Network Map"
      subtitle="Quality Standard 1 — Multi-agency professional contacts for each child"
      caraContext={{ pageTitle: "Professional Network Map", sourceType: "contact_log" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton<ProfessionalNetworkContact> data={records} columns={exportCols} filename="professional-network-map" />
          <PrintButton title="Professional Network Map" />
          <CaraStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div id="print-area" className="space-y-6">
        {/* ── summary stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: "Total Professionals", v: stats.total, icon: Users, c: "text-blue-600" },
            { l: "Contacts Overdue", v: stats.overdue, icon: AlertTriangle, c: "text-red-600" },
            { l: "Avg Network Size", v: stats.avgNetwork, icon: Network, c: "text-purple-600" },
            { l: "Active Referrals", v: stats.activeReferrals, icon: Clock, c: "text-amber-600" },
          ].map((s) => (
            <div key={s.l} className="rounded-lg border bg-white p-3 text-center">
              <s.icon className={cn("mx-auto h-5 w-5 mb-1", s.c)} />
              <p className="text-2xl font-bold">{s.v}</p>
              <p className="text-xs text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </div>

        {/* ── filters / sort ── */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search professionals…" className="w-full rounded-md border pl-8 pr-3 py-2 text-sm" />
          </div>
          <Select value={filterYP} onValueChange={setFilterYP}>
            <SelectTrigger className="w-[170px]"><SelectValue placeholder="Young Person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Children</SelectItem>
              {ypIds.map((id) => <SelectItem key={id} value={id}>{getYPName(id)}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {roles.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1 text-sm">
            <ArrowUpDown className="h-4 w-4" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border px-2 py-1.5 text-sm">
              <option value="yp">Young Person</option>
              <option value="role">Role</option>
              <option value="name">Name</option>
              <option value="lastContact">Last Contact</option>
            </select>
          </div>
        </div>

        {/* ── grouped cards ── */}
        {[...grouped.entries()].map(([ypId, contacts]) => (
          <div key={ypId} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {getYPName(ypId)} — {contacts.length} professional{contacts.length !== 1 ? "s" : ""}
            </h2>

            {contacts.map((rec) => {
              const freshness = getContactFreshness(rec.last_contact, rec.contact_frequency);
              const style = FRESHNESS_STYLES[freshness];

              return (
                <div key={rec.id} className="rounded-lg border bg-white overflow-hidden">
                  <button onClick={() => setExpandedId(expandedId === rec.id ? null : rec.id)} className="w-full flex items-center justify-between p-4 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-brand" />
                      <div className="text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{rec.name}</h3>
                          <span className="text-sm text-muted-foreground">— {rec.role}</span>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", style.bg, style.text)}>
                            {style.label}
                          </span>
                          {!rec.is_active && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{rec.organisation} · Last contact: {rec.last_contact} · {NETWORK_CONTACT_FREQUENCY_LABEL[rec.contact_frequency]}</p>
                      </div>
                    </div>
                    {expandedId === rec.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </button>

                  {expandedId === rec.id && (
                    <div className="border-t p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Phone:</span> {rec.phone}</div>
                        <div><span className="text-muted-foreground">Email:</span> {rec.email}</div>
                        <div><span className="text-muted-foreground">Frequency:</span> {NETWORK_CONTACT_FREQUENCY_LABEL[rec.contact_frequency]}</div>
                        <div><span className="text-muted-foreground">Last Contact:</span> {rec.last_contact}</div>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold mb-1">Key Responsibilities</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                          {rec.key_responsibilities.map((resp, idx) => <li key={idx}>{resp}</li>)}
                        </ul>
                      </div>

                      {rec.notes && (
                        <div className="rounded-lg bg-gray-50 border p-3">
                          <h4 className="text-sm font-semibold mb-1">Notes</h4>
                          <p className="text-sm text-muted-foreground">{rec.notes}</p>
                        </div>
                      )}

                      <SmartLinkPanel sourceType="professional_network_contact" sourceId={rec.id} childId={rec.child_id} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No professionals match the current filters.</div>
        )}

        {/* ── regulatory note ── */}
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4 text-sm text-blue-900">
          <strong>Quality Standard 1 — Child-centred care</strong> — Each child&apos;s professional network must be clearly documented and kept up to date. Effective multi-agency working requires that all professionals involved in a child&apos;s care are known to staff, that contact is maintained at the agreed frequency, and that roles and responsibilities are clearly understood by the whole team.
        </div>
      </div>
      <CareEventsPanel
        title="Care Events — Professional Contact"
        category="professional_contact"
        days={28}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Professional Network Map — social workers, IROs, CAMHS, education, GP, LAC nurses, legal, commissioning, advocates, multi-agency, professional meetings, CLA reviews"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
