"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FILING CABINET
// Auto-filed records from Care Event routing — searchable, filterable archive
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Calendar,
  User,
  Zap,
  FileText,
} from "lucide-react";
import { useFilingCabinet, useVerifyFilingItem, type FilingCabinetItemEnriched } from "@/hooks/use-filing-cabinet";
import { useAuthContext } from "@/contexts/auth-context";
import { formatDate } from "@/lib/utils";
import { FILING_CATEGORY_LABEL, type FilingCategory } from "@/types/care-events";
import { toast } from "sonner";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";

// ── Category filter tabs ──────────────────────────────────────────────────────

const CATEGORY_TABS: Array<{ label: string; value: string }> = [
  { label: "All",            value: "all" },
  { label: "Daily Care",     value: "daily_care" },
  { label: "Incidents",      value: "incident" },
  { label: "Health",         value: "health" },
  { label: "Medication",     value: "medication" },
  { label: "Safeguarding",   value: "safeguarding" },
  { label: "Education",      value: "education" },
  { label: "Missing",        value: "missing_episode" },
  { label: "Family Contact", value: "family_contact" },
  { label: "PI",             value: "physical_intervention" },
  { label: "Complaints",     value: "complaint" },
  { label: "Reg 45",         value: "regulation_45" },
  { label: "Annex A",        value: "annex_a" },
  { label: "Reg 40",         value: "regulation_40" },
  { label: "Oversight",      value: "management_oversight" },
  { label: "Other",          value: "other" },
];

const CATEGORY_COLOUR: Record<FilingCategory, string> = {
  daily_care: "bg-blue-100 text-blue-800",
  incident: "bg-red-100 text-red-800",
  health: "bg-green-100 text-green-800",
  medication: "bg-purple-100 text-purple-800",
  education: "bg-yellow-100 text-yellow-800",
  safeguarding: "bg-orange-100 text-orange-800",
  missing_episode: "bg-rose-100 text-rose-800",
  physical_intervention: "bg-red-100 text-red-800",
  family_contact: "bg-pink-100 text-pink-800",
  professional_contact: "bg-indigo-100 text-indigo-800",
  complaint: "bg-amber-100 text-amber-800",
  regulation_45: "bg-slate-100 text-slate-800",
  annex_a: "bg-teal-100 text-teal-800",
  regulation_40: "bg-orange-100 text-orange-800",
  management_oversight: "bg-cyan-100 text-cyan-800",
  other: "bg-gray-100 text-gray-700",
};

// ── Filing Item Card ──────────────────────────────────────────────────────────

function FilingItemCard({
  item,
  onVerify,
  verifying,
}: {
  item: FilingCabinetItemEnriched;
  onVerify: (id: string) => void;
  verifying: boolean;
}) {
  return (
    <Card className="border border-slate-200 hover:border-slate-300 transition-colors">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge
                variant="outline"
                className={`text-xs ${CATEGORY_COLOUR[item.category as FilingCategory] ?? "bg-gray-100 text-gray-700"}`}
              >
                {FILING_CATEGORY_LABEL[item.category as FilingCategory] ?? item.category}
              </Badge>
              {item.is_verified ? (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Verified
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="h-3 w-3 mr-1" /> Unverified
                </Badge>
              )}
              {item.sub_category && (
                <span className="text-xs text-slate-400">{item.sub_category}</span>
              )}
            </div>

            <h3 className="font-medium text-slate-900 text-sm leading-snug">{item.title}</h3>

            {item.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
            )}

            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Filed {formatDate(item.filed_at)}
              </span>
              {item.care_event && (
                <Link
                  href={`/care-events/${item.care_event.id}`}
                  className="flex items-center gap-1 text-indigo-500 hover:underline"
                >
                  <Zap className="h-3 w-3" />
                  {item.care_event.title}
                </Link>
              )}
              {item.child_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.child_name}
                </span>
              )}
            </div>

            {item.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mt-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!item.is_verified && (
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 text-xs"
              onClick={() => onVerify(item.id)}
              disabled={verifying}
            >
              Verify
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function FilingCabinetPage() {
  const { currentUser } = useAuthContext();
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading } = useFilingCabinet({
    category: activeCategory !== "all" ? activeCategory : undefined,
    search: search || undefined,
  });

  const verifyMutation = useVerifyFilingItem();

  function handleVerify(id: string) {
    verifyMutation.mutate(
      { id, verified_by: currentUser?.id ?? "manager_default" },
      { onSuccess: () => toast.success("Record verified") }
    );
  }

  const items = data?.items ?? [];
  const meta = data?.meta;

  return (
    <PageShell
      title="Filing Cabinet"
      subtitle="Auto-filed records from Care Events — searchable archive with source links"
    >
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-slate-500" />
              <div>
                <div className="text-2xl font-bold text-slate-900">{meta?.total ?? 0}</div>
                <div className="text-xs text-slate-500">Total Filed</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-700">{meta?.verified ?? 0}</div>
                <div className="text-xs text-slate-500">Verified</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <div>
                <div className="text-2xl font-bold text-amber-700">{meta?.unverified ?? 0}</div>
                <div className="text-xs text-slate-500">Unverified</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <div>
                <div className="text-2xl font-bold text-slate-700">
                  {Object.keys(meta?.category_counts ?? {}).length}
                </div>
                <div className="text-xs text-slate-500">Categories</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="pl-8"
            placeholder="Search filed records..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
          />
        </div>
        <Button variant="outline" onClick={() => setSearch(searchInput)}>
          Search
        </Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => { setSearch(""); setSearchInput(""); }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 flex-wrap mb-4 border-b border-slate-200 pb-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveCategory(tab.value)}
            className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
              activeCategory === tab.value
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && meta?.category_counts[tab.value] ? (
              <span className="ml-1 opacity-70">({meta.category_counts[tab.value]})</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-slate-400">
          <FileText className="h-5 w-5 animate-pulse mr-2" /> Loading records...
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 text-center text-slate-400">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No filed records yet.</p>
            <p className="text-xs mt-1">Records are auto-filed when Care Events are routed.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FilingItemCard
              key={item.id}
              item={item}
              onVerify={handleVerify}
              verifying={verifyMutation.isPending}
            />
          ))}
        </div>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
    </PageShell>
  );
}
