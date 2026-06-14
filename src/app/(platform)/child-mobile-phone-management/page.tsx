"use client";

import { useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { SmartLinkPanel } from "@/components/intelligence/smart-link-panel";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import { useChildPhoneRecords } from "@/hooks/use-child-phone-records";
import type {
  ChildPhoneRecord,
  PhoneContractType,
  PhoneAppCategory,
  PhoneHandInProtocol,
} from "@/types/extended";
import {
  PHONE_CONTRACT_TYPE_LABEL,
  PHONE_FUNDING_SOURCE_LABEL,
  PHONE_HAND_IN_PROTOCOL_LABEL,
  PHONE_APP_CATEGORY_LABEL,
} from "@/types/extended";
import {
  Smartphone,
  ShieldCheck,
  Clock,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { CaraPanel } from "@/components/cara/cara-panel";
import { CaraStudioQuickActionButton } from "@/components/cara/studio-quick-action-button";

const contractTone: Record<PhoneContractType, string> = {
  payg: "bg-slate-100 text-[var(--cs-navy)]",
  sim_only: "bg-sky-100 text-sky-800",
  contract: "bg-indigo-100 text-indigo-800",
  family_shared: "bg-purple-100 text-purple-800",
  no_phone: "bg-amber-100 text-amber-800",
};

const handInTone: Record<PhoneHandInProtocol, string> = {
  bedtime: "bg-sky-100 text-sky-800",
  school_hours: "bg-amber-100 text-amber-800",
  both: "bg-emerald-100 text-emerald-800",
  never: "bg-slate-100 text-[var(--cs-navy)]",
  other_agreed_pattern: "bg-purple-100 text-purple-800",
};

const categoryTone: Record<PhoneAppCategory, string> = {
  social: "bg-pink-100 text-pink-800",
  games: "bg-orange-100 text-orange-800",
  education: "bg-emerald-100 text-emerald-800",
  health: "bg-teal-100 text-teal-800",
  communication: "bg-sky-100 text-sky-800",
  utility: "bg-slate-100 text-[var(--cs-navy)]",
  other: "bg-zinc-100 text-zinc-800",
};

export default function ChildMobilePhoneManagementPage() {
  const { data: raw, isLoading } = useChildPhoneRecords();
  const items = raw?.data ?? [];

  const [search, setSearch] = useState("");
  const [contractFilter, setContractFilter] = useState<"all" | PhoneContractType>("all");
  const [sortBy, setSortBy] = useState("name");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const exportCols = useMemo<ExportColumn<ChildPhoneRecord>[]>(() => [
    { header: "Young Person", accessor: (r: ChildPhoneRecord) => getYPName(r.child_id) },
    { header: "Phone Model", accessor: (r: ChildPhoneRecord) => r.phone_model },
    { header: "Contract Type", accessor: (r: ChildPhoneRecord) => PHONE_CONTRACT_TYPE_LABEL[r.contract_type] },
    { header: "Contract Holder", accessor: (r: ChildPhoneRecord) => r.contract_holder ?? "—" },
    { header: "Monthly Cost", accessor: (r: ChildPhoneRecord) => `£${r.monthly_cost.toFixed(2)}` },
    { header: "Funding Source", accessor: (r: ChildPhoneRecord) => PHONE_FUNDING_SOURCE_LABEL[r.funding_source] },
    { header: "Parental Controls", accessor: (r: ChildPhoneRecord) => (r.parental_controls_active ? "Active" : "Off") },
    { header: "Parental Controls Type", accessor: (r: ChildPhoneRecord) => r.parental_controls_type ?? "—" },
    { header: "Screen Time (hrs/week avg)", accessor: (r: ChildPhoneRecord) => r.screen_time_weekly_avg.toString() },
    { header: "Screen Time Agreed Limit", accessor: (r: ChildPhoneRecord) => (r.screen_time_agreed_limit !== undefined ? `${r.screen_time_agreed_limit} hrs` : "—") },
    { header: "Apps Installed", accessor: (r: ChildPhoneRecord) => r.apps_installed.length.toString() },
    { header: "Hand-In Protocol", accessor: (r: ChildPhoneRecord) => PHONE_HAND_IN_PROTOCOL_LABEL[r.hand_in_protocol] },
    { header: "Passcode With Staff", accessor: (r: ChildPhoneRecord) => (r.passcode_with_staff ? "Yes" : "No (private)") },
    { header: "Flags / Concerns", accessor: (r: ChildPhoneRecord) => r.flags_concerns.join("; ") || "—" },
    { header: "Key Worker", accessor: (r: ChildPhoneRecord) => getStaffName(r.key_worker) },
    { header: "Review Date", accessor: (r: ChildPhoneRecord) => r.review_date },
  ], []);

  const filtered = useMemo(() => {
    let list = [...items];
    if (contractFilter !== "all") list = list.filter((r) => r.contract_type === contractFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          getYPName(r.child_id).toLowerCase().includes(q) ||
          r.phone_model.toLowerCase().includes(q) ||
          PHONE_CONTRACT_TYPE_LABEL[r.contract_type].toLowerCase().includes(q) ||
          r.apps_installed.some((a) => a.name.toLowerCase().includes(q)),
      );
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return getYPName(a.child_id).localeCompare(getYPName(b.child_id));
        case "cost-high":
          return b.monthly_cost - a.monthly_cost;
        case "cost-low":
          return a.monthly_cost - b.monthly_cost;
        case "screen-time":
          return b.screen_time_weekly_avg - a.screen_time_weekly_avg;
        case "review":
          return a.review_date.localeCompare(b.review_date);
        default:
          return 0;
      }
    });
    return list;
  }, [items, search, contractFilter, sortBy]);

  if (isLoading) {
    return <PageShell title="Child Mobile Phone Management" subtitle="">Loading…</PageShell>;
  }

  const activePhones = items.filter((r) => r.contract_type !== "no_phone").length;
  const totalMonthlyCost = items.reduce((sum, r) => sum + r.monthly_cost, 0);
  const parentalControlsActive = items.filter((r) => r.parental_controls_active).length;
  const flagCount = items.reduce((sum, r) => sum + r.flags_concerns.length, 0);

  return (
    <PageShell
      title="Child Mobile Phone Management"
      subtitle="Per-child phone records — contracts, costs, parental controls, screen time, app inventory, hand-in protocols, and online safety"
      caraContext={{ pageTitle: "Mobile Phone Management", sourceType: "child_record" }}
      actions={
        <div className="flex items-center gap-2">
          <ExportButton data={items} columns={exportCols} filename="child-mobile-phone-management" />
          <PrintButton title="Mobile Phone Management" />
          <CaraStudioQuickActionButton context={{ record_type: "risk_assessment", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-sky-600">{activePhones}</p>
          <p className="text-xs text-muted-foreground">Active Phones</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-[var(--cs-text-secondary)]">£{totalMonthlyCost.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total Monthly Cost</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{parentalControlsActive}/{items.length}</p>
          <p className="text-xs text-muted-foreground">Parental Controls Active</p>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <p className={cn("text-2xl font-bold", flagCount > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]")}>{flagCount}</p>
          <p className="text-xs text-muted-foreground">Flags / Concerns</p>
        </div>
      </div>

      <div className="rounded-lg bg-sky-50 border border-sky-200 p-3 mb-6 flex items-start gap-2">
        <ShieldCheck className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />
        <p className="text-sm text-sky-800">
          Mobile phone access is a normal, healthy part of growing up. Each child&apos;s phone arrangement
          is individually negotiated — based on age, capability, and online safety needs. Controls are
          collaborative and proportionate, not surveillance. Children retain reasonable privacy under
          UNCRC Article 16. Hand-in protocols, parental controls, and what-if-lost plans are agreed with
          the child wherever possible.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search child, model, app..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-md border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
        <Select value={contractFilter} onValueChange={(v) => setContractFilter(v as typeof contractFilter)}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Contract Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Contract Types</SelectItem>
            {Object.entries(PHONE_CONTRACT_TYPE_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">By Child</SelectItem>
              <SelectItem value="cost-high">Cost (High to Low)</SelectItem>
              <SelectItem value="cost-low">Cost (Low to High)</SelectItem>
              <SelectItem value="screen-time">Screen Time (High)</SelectItem>
              <SelectItem value="review">Earliest Review</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((r) => {
          const isExpanded = expandedId === r.id;
          const overLimit =
            r.screen_time_agreed_limit !== undefined && r.screen_time_weekly_avg > r.screen_time_agreed_limit;

          return (
            <div key={r.id} className="rounded-xl border bg-white overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--cs-surface)] transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Smartphone className="h-5 w-5 text-sky-600 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{getYPName(r.child_id)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.phone_model}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3 flex-wrap justify-end">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", contractTone[r.contract_type])}>
                    {PHONE_CONTRACT_TYPE_LABEL[r.contract_type]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[var(--cs-navy)] font-medium">
                    £{r.monthly_cost.toFixed(2)}/mo
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", handInTone[r.hand_in_protocol])}>
                    Hand-in: {PHONE_HAND_IN_PROTOCOL_LABEL[r.hand_in_protocol]}
                  </span>
                  {r.flags_concerns.length > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {r.flags_concerns.length}
                    </span>
                  )}
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t px-4 py-4 bg-slate-50 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Contract</p>
                      <p className="text-sm">{PHONE_CONTRACT_TYPE_LABEL[r.contract_type]} &middot; £{r.monthly_cost.toFixed(2)}/month</p>
                      {r.contract_holder && (
                        <p className="text-xs text-muted-foreground mt-1">Holder: {r.contract_holder}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">Funding: {PHONE_FUNDING_SOURCE_LABEL[r.funding_source]}</p>
                      {r.imei && <p className="text-xs text-muted-foreground mt-0.5">IMEI: {r.imei}</p>}
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        <ShieldCheck className="h-3 w-3 inline mr-1" />Parental Controls
                      </p>
                      <p className="text-sm">
                        {r.parental_controls_active ? (
                          <span className="text-emerald-700 font-medium">Active</span>
                        ) : (
                          <span className="text-[var(--cs-text-secondary)]">Not active</span>
                        )}
                      </p>
                      {r.parental_controls_type && (
                        <p className="text-xs text-muted-foreground mt-1">{r.parental_controls_type}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Passcode held with staff: {r.passcode_with_staff ? "Yes (agreed)" : "No (private — child's right)"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      <Clock className="h-3 w-3 inline mr-1" />Screen Time
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{r.screen_time_weekly_avg} hrs/week (avg)</span>
                      {r.screen_time_agreed_limit !== undefined && (
                        <>
                          <span className="text-xs text-muted-foreground">vs agreed limit</span>
                          <span
                            className={cn(
                              "text-xs px-2 py-0.5 rounded-full font-medium",
                              overLimit ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
                            )}
                          >
                            {r.screen_time_agreed_limit} hrs
                          </span>
                        </>
                      )}
                      {r.screen_time_agreed_limit === undefined && (
                        <span className="text-xs text-muted-foreground">No agreed limit (age/agreement)</span>
                      )}
                    </div>
                  </div>

                  {r.apps_installed.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        Apps Installed ({r.apps_installed.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                        {r.apps_installed.map((a, i) => (
                          <div key={i} className="bg-white rounded-lg p-2 border text-sm flex items-center justify-between gap-2">
                            <span className="font-medium truncate">{a.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", categoryTone[a.category])}>
                                {PHONE_APP_CATEGORY_LABEL[a.category]}
                              </span>
                              {a.age_rating && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-[var(--cs-text-secondary)] font-medium">
                                  {a.age_rating}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Apps Installed</p>
                      <p className="text-sm text-muted-foreground italic">No apps — basic feature phone (calls and texts only)</p>
                    </div>
                  )}

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-800 uppercase tracking-wide mb-1">Child Voice</p>
                    <p className="text-sm italic text-blue-900">&ldquo;{r.child_voice}&rdquo;</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Staff Observation</p>
                    <p className="text-sm">{r.staff_observation}</p>
                  </div>

                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">If Lost or Stolen — Plan</p>
                    <p className="text-sm">{r.what_if_lost_plan}</p>
                  </div>

                  {r.flags_concerns.length > 0 && (
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                        <AlertTriangle className="h-3 w-3 inline mr-1" />Flags / Concerns
                      </p>
                      <ul className="space-y-1">
                        {r.flags_concerns.map((f, i) => (
                          <li key={i} className="text-sm flex items-start gap-1">
                            <span className="text-amber-600 mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                    <span>Recorded: {r.recorded_date}</span>
                    <span>Key worker: {getStaffName(r.key_worker)}</span>
                    <span>Next review: {r.review_date}</span>
                    <span>Hand-in: {PHONE_HAND_IN_PROTOCOL_LABEL[r.hand_in_protocol]}</span>
                  </div>

                  <SmartLinkPanel sourceType="child-phone-record" sourceId={r.id} childId={r.child_id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg bg-muted/50 border p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Regulatory Context:</strong> Per-child mobile phone management supports
          Keeping Children Safe in Education (KCSIE) 2024 (online safety duty), the Online Safety Act
          2023, the UK GDPR Age Appropriate Design Code (Children&apos;s Code — privacy by design,
          age-appropriate experiences), Children&apos;s Homes Regulations 2015 Quality Standard 9
          (Protection of children — including online safety and exploitation prevention), and UNCRC
          Articles 16 (privacy) and 17 (access to information). Phone arrangements are collaborative,
          proportionate, and reviewed regularly with each child.
        </p>
      </div>
      <CareEventsPanel
        title="Care Events — Safeguarding & Behaviour"
        category={["safeguarding", "behaviour"]}
        days={90}
        defaultCollapsed
      />
      <CaraPanel
        mode="assist"
        pageContext="Mobile Phone Management — phone agreements, internet safety, parental controls, contacts approved, contact with birth family, grooming risk, online safety plan, confiscation, boundaries"
        recordType="risk_assessment"
        className="mt-6"
      />
    </PageShell>
  );
}
