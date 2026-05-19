"use client";

import { useState, useMemo } from "react";
import {
  PawPrint,
  Heart,
  Calendar,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Search,
  Stethoscope,
  Loader2,
} from "lucide-react";
import { PageShell } from "@/components/layout/page-shell";
import { ExportButton, type ExportColumn } from "@/components/ui/export-button";
import { PrintButton } from "@/components/ui/print-button";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { usePetRecords } from "@/hooks/use-pet-records";
import type { PetRecord, PetSpecies } from "@/types/extended";
import { PET_SPECIES_LABEL } from "@/types/extended";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

/* ── colour maps ───────────────────────────────────────────────────────── */

const SPECIES_COLOURS: Record<PetSpecies, string> = {
  dog: "bg-amber-100 text-amber-800",
  cat: "bg-purple-100 text-purple-800",
  rabbit: "bg-rose-100 text-rose-800",
  guinea_pig: "bg-teal-100 text-teal-800",
  fish: "bg-blue-100 text-blue-800",
  hamster: "bg-orange-100 text-orange-800",
  bird: "bg-sky-100 text-sky-800",
  other: "bg-gray-100 text-gray-700",
};

/* ── flat row for export ───────────────────────────────────────────────── */

interface FlatRow {
  name: string;
  species: string;
  breed: string;
  dob: string;
  arrived_at: string;
  microchipped: string;
  insurance: string;
  vaccinations_up_to_date: string;
  last_vet_visit: string;
  next_vet_due: string;
  children_involved_in_care: string;
  child_allergies_cleared: string;
  risk_assessment_date: string;
  flags: string;
  logged_by: string;
}

const exportCols: ExportColumn<FlatRow>[] = [
  { header: "Name", accessor: (r: FlatRow) => r.name },
  { header: "Species", accessor: (r: FlatRow) => r.species },
  { header: "Breed", accessor: (r: FlatRow) => r.breed },
  { header: "Date of Birth", accessor: (r: FlatRow) => r.dob },
  { header: "Arrived At Home", accessor: (r: FlatRow) => r.arrived_at },
  { header: "Microchipped", accessor: (r: FlatRow) => r.microchipped },
  { header: "Insured", accessor: (r: FlatRow) => r.insurance },
  { header: "Vaccinations Up To Date", accessor: (r: FlatRow) => r.vaccinations_up_to_date },
  { header: "Last Vet Visit", accessor: (r: FlatRow) => r.last_vet_visit },
  { header: "Next Vet Due", accessor: (r: FlatRow) => r.next_vet_due },
  { header: "Children Involved In Care", accessor: (r: FlatRow) => r.children_involved_in_care },
  { header: "Allergies Cleared (children)", accessor: (r: FlatRow) => r.child_allergies_cleared },
  { header: "Risk Assessment Date", accessor: (r: FlatRow) => r.risk_assessment_date },
  { header: "Flags", accessor: (r: FlatRow) => r.flags },
  { header: "Logged By", accessor: (r: FlatRow) => r.logged_by },
];

/* ── component ─────────────────────────────────────────────────────────── */

export default function HomePetsCareLogPage() {
  const { data: raw, isLoading } = usePetRecords();
  const data = useMemo(() => raw?.data ?? [], [raw]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterSpecies, setFilterSpecies] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  const toggle = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  const d = (n: number) => { const dt = new Date(); dt.setDate(dt.getDate() + n); return dt.toISOString().slice(0, 10); };

  /* ── stats ────────────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    const petsInHome = data.length;
    const sixtyDays = d(60);
    const thirtyDays = d(30);
    const vaccinationsDue = data.filter((p) => !p.vaccinations_up_to_date || (p.next_vet_due && p.next_vet_due <= sixtyDays)).length;
    const nextVetVisits = data.filter((p) => p.next_vet_due && p.next_vet_due <= thirtyDays).length;
    const childIds = new Set<string>();
    data.forEach((p) => p.children_involved_in_care.forEach((c) => childIds.add(c)));
    return { petsInHome, vaccinationsDue, nextVetVisits, childrenInvolved: childIds.size };
  }, [data]);

  /* ── filter / sort ────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        PET_SPECIES_LABEL[p.species].toLowerCase().includes(q) ||
        (p.breed ?? "").toLowerCase().includes(q) ||
        p.behavioural_notes.toLowerCase().includes(q) ||
        p.therapeutic_value.toLowerCase().includes(q)
      );
    }
    if (filterSpecies !== "all") list = list.filter((p) => p.species === filterSpecies);
    const out = [...list];
    switch (sortBy) {
      case "name": out.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "species": out.sort((a, b) => a.species.localeCompare(b.species)); break;
      case "vet": out.sort((a, b) => (a.next_vet_due ?? "9999").localeCompare(b.next_vet_due ?? "9999")); break;
      case "arrived": out.sort((a, b) => b.arrived_at.localeCompare(a.arrived_at)); break;
    }
    return out;
  }, [data, search, filterSpecies, sortBy]);

  /* ── export rows ──────────────────────────────────────────────────── */
  const exportRows = useMemo<FlatRow[]>(() =>
    data.map((p) => ({
      name: p.name,
      species: PET_SPECIES_LABEL[p.species],
      breed: p.breed ?? "",
      dob: p.dob ?? "",
      arrived_at: p.arrived_at,
      microchipped: p.microchipped ? "Yes" : "No",
      insurance: p.insurance ? "Yes" : "No",
      vaccinations_up_to_date: p.vaccinations_up_to_date ? "Yes" : "No",
      last_vet_visit: p.last_vet_visit ?? "",
      next_vet_due: p.next_vet_due ?? "",
      children_involved_in_care: p.children_involved_in_care.map((c) => getYPName(c)).join("; "),
      child_allergies_cleared: p.child_allergies_cleared.map((c) => getYPName(c)).join("; "),
      risk_assessment_date: p.risk_assessment_date,
      flags: p.flags.join("; "),
      logged_by: getStaffName(p.logged_by),
    })), [data]);

  const speciesOptions = Object.keys(PET_SPECIES_LABEL) as PetSpecies[];

  const renderLeadName = (id: string) => {
    if (id.startsWith("yp_")) return getYPName(id);
    if (id.startsWith("staff_")) return getStaffName(id);
    return id;
  };

  if (isLoading) {
    return (
      <PageShell title="Home Pets Care Log" subtitle="Loading…">
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Home Pets Care Log"
      subtitle="The animals who share our home — welfare, vet records, child involvement, and the quiet therapeutic value they bring"
      ariaContext={{ pageTitle: "Home Pets Care Log", sourceType: "home_check" }}
      actions={
        <div className="flex items-center gap-2">
          <PrintButton title="Home Pets Care Log" />
          <ExportButton data={exportRows} columns={exportCols} filename="home-pets-care-log" />
          <AriaStudioQuickActionButton context={{ record_type: "policy", record_id: "home_oak", home_id: "home_oak" }} />
        </div>
      }
    >
      {/* ── stat strip ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pets in home", value: stats.petsInHome, icon: PawPrint, colour: "text-amber-600" },
          { label: "Vaccinations due (60d)", value: stats.vaccinationsDue, icon: Stethoscope, colour: stats.vaccinationsDue > 0 ? "text-amber-600" : "text-gray-400" },
          { label: "Next vet visits (30d)", value: stats.nextVetVisits, icon: Calendar, colour: stats.nextVetVisits > 0 ? "text-teal-600" : "text-gray-400" },
          { label: "Children involved", value: stats.childrenInvolved, icon: Heart, colour: "text-rose-500" },
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

      {/* ── opening note ──────────────────────────────────────────── */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 mb-6">
        <div className="flex items-start gap-2">
          <PawPrint className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Pets are part of the family.</strong> The animals who live at Oak House aren&apos;t a programme or an intervention — they are part of the home&apos;s daily fabric. This log records welfare, vet care, allergy clearance, and how the children are involved. Pet care is a shared responsibility, with rotas that build routine, pride, and gentle accountability into ordinary days.
          </div>
        </div>
      </div>

      {/* ── filters ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by pet, species, breed, or notes…"
            className="w-full rounded-md border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <Select value={filterSpecies} onValueChange={setFilterSpecies}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
            {speciesOptions.map((sp) => <SelectItem key={sp} value={sp}>{PET_SPECIES_LABEL[sp]}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <ArrowUpDown className="h-4 w-4" />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px] h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A–Z)</SelectItem>
              <SelectItem value="species">Species</SelectItem>
              <SelectItem value="vet">Next vet visit</SelectItem>
              <SelectItem value="arrived">Most recently arrived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── records ────────────────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((p) => {
          const open = expandedId === p.id;
          return (
            <div key={p.id} className="rounded-lg border border-amber-100 bg-white">
              <button
                onClick={() => toggle(p.id)}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-amber-50/40"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PawPrint className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold">{p.name}</h3>
                    {p.breed && <span className="text-sm text-gray-600">— {p.breed}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SPECIES_COLOURS[p.species])}>
                      {PET_SPECIES_LABEL[p.species]}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      p.vaccinations_up_to_date ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-700"
                    )}>
                      {p.vaccinations_up_to_date ? "Vaccinations up to date" : "Vaccinations overdue"}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      p.microchipped ? "bg-teal-100 text-teal-800" : "bg-gray-100 text-gray-600"
                    )}>
                      {p.microchipped ? "Microchipped" : "Not microchipped"}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      p.insurance ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    )}>
                      {p.insurance ? "Insured" : "No insurance"}
                    </span>
                    {p.flags.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        {p.flags.length} flag{p.flags.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Arrived {p.arrived_at}
                    {p.next_vet_due ? <> · Next vet {p.next_vet_due}</> : null}
                    {" · "}Logged by {getStaffName(p.logged_by)}
                  </p>
                </div>
                {open ? <ChevronUp className="h-5 w-5 text-gray-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 shrink-0" />}
              </button>

              {open && (
                <div className="border-t border-amber-100 px-4 pb-4 space-y-4">
                  {/* behavioural notes */}
                  <div className="rounded-md bg-gray-50 p-3 mt-3">
                    <h4 className="text-xs font-semibold text-gray-500 mb-1">Behavioural notes</h4>
                    <p className="text-sm whitespace-pre-line">{p.behavioural_notes}</p>
                  </div>

                  {/* therapeutic value */}
                  <div className="rounded-md bg-rose-50 border border-rose-200 p-3">
                    <h4 className="text-xs font-semibold text-rose-700 mb-1 flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" /> Therapeutic value
                    </h4>
                    <p className="text-sm text-rose-900">{p.therapeutic_value}</p>
                  </div>

                  {/* allergies cleared + children involved */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-emerald-50 border border-emerald-200 p-3">
                      <h4 className="text-xs font-semibold text-emerald-700 mb-1">Allergy register — cleared</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {p.child_allergies_cleared.length === 0
                          ? <span className="text-sm italic text-emerald-700/70">No clearance recorded yet.</span>
                          : p.child_allergies_cleared.map((c) => (
                              <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {getYPName(c)}
                              </span>
                            ))}
                      </div>
                    </div>
                    <div className="rounded-md bg-teal-50 border border-teal-200 p-3">
                      <h4 className="text-xs font-semibold text-teal-700 mb-1">Children involved in care</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {p.children_involved_in_care.length === 0
                          ? <span className="text-sm italic text-teal-700/70">No children currently engaged in care.</span>
                          : p.children_involved_in_care.map((c) => (
                              <span key={c} className="px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {getYPName(c)}
                              </span>
                            ))}
                      </div>
                    </div>
                  </div>

                  {/* rota */}
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <h4 className="text-xs font-semibold text-amber-700 mb-2">Walking &amp; feeding rota</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs text-amber-900/70">
                            <th className="py-1 pr-3 font-medium">Task</th>
                            <th className="py-1 pr-3 font-medium">Days / time</th>
                            <th className="py-1 font-medium">Lead</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.walking_feeding_rota.map((row, i) => (
                            <tr key={i} className="border-t border-amber-200/60">
                              <td className="py-1.5 pr-3 text-amber-900">{row.task}</td>
                              <td className="py-1.5 pr-3 text-amber-900">{row.days}</td>
                              <td className="py-1.5 text-amber-900">{renderLeadName(row.lead)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* vet info + risk assessment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
                      <h4 className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1">
                        <Stethoscope className="h-3.5 w-3.5" /> Vet record
                      </h4>
                      <p className="text-sm text-blue-900">
                        Last visit: <span className="font-medium">{p.last_vet_visit ?? "—"}</span><br />
                        Next due: <span className="font-medium">{p.next_vet_due ?? "—"}</span><br />
                        DOB: <span className="font-medium">{p.dob ?? "—"}</span>
                      </p>
                    </div>
                    <div className="rounded-md bg-purple-50 border border-purple-200 p-3">
                      <h4 className="text-xs font-semibold text-purple-700 mb-1 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Risk assessment
                      </h4>
                      <p className="text-sm text-purple-900">
                        Last reviewed: <span className="font-medium">{p.risk_assessment_date}</span>
                      </p>
                      <p className="text-xs text-purple-700/80 mt-1">
                        Annual review under Statement of Purpose and the home&apos;s Health &amp; Safety policy.
                      </p>
                    </div>
                  </div>

                  {/* flags */}
                  {p.flags.length > 0 && (
                    <div className="rounded-md bg-amber-50 border border-amber-300 p-3">
                      <h4 className="text-xs font-semibold text-amber-800 mb-1">Flags</h4>
                      <ul className="list-disc list-inside text-sm text-amber-900 space-y-0.5">
                        {p.flags.map((f, i) => <li key={i}>{f}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed bg-white p-8 text-center text-sm text-gray-500">
            No pets match these filters.
          </div>
        )}
      </div>

      {/* ── regulatory footer ──────────────────────────────────────── */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 text-sm text-teal-900 mb-6">
        <strong>Regulatory framework.</strong> Pet welfare in the home is held within the Animal Welfare Act 2006 and the RSPCA five welfare needs (suitable environment, suitable diet, ability to behave normally, housing with or apart from other animals, protection from pain, suffering, injury and disease). Children&apos;s involvement is risk-assessed under the Health &amp; Safety at Work Act 1974 and the home&apos;s own Health &amp; Safety policy, with allergy clearance recorded against each child&apos;s health profile. The therapeutic value of pet care contributes to Quality Standard 6 (enjoyment &amp; achievement) of the Children&apos;s Homes (England) Regulations 2015 and is described in the Statement of Purpose.
      </div>
      <CareEventsPanel
        title="Care Events — Wellbeing"
        category="wellbeing"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Home Pets Care Log — pets in the home, animal welfare, vet records, vaccinations, allergies, children's relationships with pets, therapeutic benefits, risk assessment"
        recordType="policy"
        className="mt-6"
      />
    </PageShell>
  );
}
