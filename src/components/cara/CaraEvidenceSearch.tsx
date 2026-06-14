// ══════════════════════════════════════════════════════════════════════════════
// CaraEvidenceSearch — Semantic evidence search UI with source types
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { CaraRole } from "@/lib/cara/core/types";

interface EvidenceResult {
  id: string;
  documentId: string;
  sourceType: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  date: string;
  childId?: string;
  homeId?: string;
  metadata?: Record<string, unknown>;
}

interface Props {
  userRole: CaraRole;
  organisationId: string;
  homeId?: string;
  childId?: string;
  onSelectResult?: (result: EvidenceResult) => void;
}

const SOURCE_TYPE_OPTIONS = [
  { value: "all", label: "All Sources" },
  { value: "daily_log", label: "Daily Logs" },
  { value: "incident_report", label: "Incidents" },
  { value: "keywork_session", label: "Keywork" },
  { value: "risk_assessment", label: "Risk Assessments" },
  { value: "reg45_report", label: "Reg 45 Reports" },
  { value: "safeguarding_referral", label: "Safeguarding" },
  { value: "care_plan", label: "Care Plans" },
  { value: "placement_plan", label: "Placement Plans" },
  { value: "health_record", label: "Health Records" },
  { value: "education_plan", label: "Education Plans" },
  { value: "supervision_notes", label: "Supervision Notes" },
  { value: "missing_report", label: "Missing Reports" },
  { value: "contact_log", label: "Contact Logs" },
];

export function CaraEvidenceSearch({
  userRole,
  organisationId,
  homeId,
  childId,
  onSelectResult,
}: Props) {
  const [query, setQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [results, setResults] = useState<EvidenceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setSearched(true);

    try {
      const response = await fetch("/api/cara/evidence/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          userId: "current-user",
          userRole,
          organisationId,
          homeId,
          childId,
          sourceTypes: sourceFilter === "all" ? undefined : [sourceFilter],
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          maxResults: 20,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Search failed");
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch (err) {
      setError("Network error — could not reach evidence search");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold">Evidence Search</h3>
            <p className="text-xs text-muted-foreground">
              Semantic search across all documentation and records
            </p>
          </div>
        </div>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="p-4 space-y-3">
        <div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search evidence... e.g. 'escalating behaviour at bedtime' or 'progress with emotional regulation'"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs rounded-md border border-border bg-background px-2 py-1.5"
          >
            {SOURCE_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="text-xs rounded-md border border-border bg-background px-2 py-1.5"
            placeholder="From"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="text-xs rounded-md border border-border bg-background px-2 py-1.5"
          />

          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="ml-auto px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="border-t border-border">
          {error ? (
            <div className="p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No matching evidence found. Try broadening your search terms.
            </div>
          ) : (
            <div className="divide-y divide-border max-h-96 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => onSelectResult?.(result)}
                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {result.sourceType.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-medium">{result.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {Math.round(result.relevanceScore * 100)}% match
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{result.snippet}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(result.date).toLocaleDateString("en-GB")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
