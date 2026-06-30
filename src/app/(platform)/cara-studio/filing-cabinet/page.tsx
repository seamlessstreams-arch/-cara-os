"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — FILING CABINET
//
// Visual filing structure showing where committed artifacts are stored.
// Browse by category, child, or date. Mirrors Ofsted-expected filing structure.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FolderOpen, Folder, FileText, ChevronRight, ChevronDown,
  Sparkles, Archive, Search,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface FilingFolder {
  path: string;
  label: string;
  childId: string | null;
  artifactCount: number;
  children: FilingFolder[];
}

// ══════════════════════════════════════════════════════════════════════════════

export default function FilingCabinetPage() {
  const [structure, setStructure] = useState<FilingFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/cara-studio/filing-cabinet?mode=structure")
      .then((r) => r.json())
      .then((data) => {
        setStructure(data.structure ?? []);
        // Auto-expand top level
        const topPaths = new Set<string>((data.structure ?? []).map((f: FilingFolder) => f.path));
        setExpandedPaths(topPaths);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // ── Recursive folder renderer ──────────────────────────────────────────────

  function renderFolder(folder: FilingFolder, depth: number = 0) {
    const isExpanded = expandedPaths.has(folder.path);
    const hasChildren = folder.children.length > 0;
    const isSelected = selectedPath === folder.path;
    const matchesSearch = !searchQuery || folder.label.toLowerCase().includes(searchQuery.toLowerCase()) || folder.path.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch && !hasChildren) return null;

    return (
      <div key={folder.path}>
        <button
          onClick={() => {
            if (hasChildren) toggleExpand(folder.path);
            setSelectedPath(folder.path);
            setSelectedChildId(folder.childId);
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all hover:bg-[var(--cs-surface)]",
            isSelected && "bg-[var(--cs-cara-gold-bg)] border border-[var(--cs-cara-gold-soft)]",
          )}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-[var(--cs-text-muted)] shrink-0" />
          ) : (
            <span className="w-3.5" />
          )}
          {hasChildren ? (
            isExpanded ? <FolderOpen className="h-4 w-4 text-[var(--cs-cara-gold)] shrink-0" /> : <Folder className="h-4 w-4 text-[var(--cs-cara-gold)] shrink-0" />
          ) : (
            <FileText className="h-4 w-4 text-[var(--cs-text-muted)] shrink-0" />
          )}
          <span className={cn("text-xs font-medium flex-1", isSelected ? "text-[var(--cs-navy)]" : "text-[var(--cs-text-secondary)]")}>
            {folder.label}
          </span>
          {folder.artifactCount > 0 && (
            <Badge className="text-[9px] px-1.5 py-0 bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]">
              {folder.artifactCount}
            </Badge>
          )}
        </button>
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <PageShell title="Filing Cabinet" subtitle="Committed artifacts filed by category">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Archive className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Filing Cabinet</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Committed Cara Studio artifacts automatically filed into Ofsted-aligned folder structures.
              </p>
            </div>
          </div>
        </div>

        {/* ── Search ──────────────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search folders..."
            className="w-full rounded-xl border border-[var(--cs-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-12 text-center">
            <Sparkles className="h-8 w-8 animate-pulse text-[var(--cs-cara-gold)] mx-auto mb-3" />
            <p className="text-sm text-[var(--cs-text-muted)]">Loading filing structure...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Folder tree ─────────────────────────────────────────────── */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-4 space-y-1">
                <h3 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Folder className="h-3.5 w-3.5 text-[var(--cs-cara-gold)]" />
                  Folders
                </h3>
                {structure.length === 0 ? (
                  <p className="text-xs text-[var(--cs-text-muted)] py-4 text-center">No committed artifacts yet.</p>
                ) : (
                  structure.map((folder) => renderFolder(folder))
                )}
              </div>
            </div>

            {/* ── Folder detail ────────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5">
                {selectedPath ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5 text-[var(--cs-cara-gold)]" />
                      <h3 className="text-sm font-semibold text-[var(--cs-navy)]">{selectedPath}</h3>
                    </div>
                    <p className="text-xs text-[var(--cs-text-muted)]">
                      Artifacts filed in this location will appear here once committed through the Cara Studio approval workflow.
                    </p>
                    <Link
                      href={selectedChildId ? `/cara-studio?childId=${selectedChildId}` : "/cara-studio"}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--cs-cara-gold)] transition-colors hover:bg-[var(--cs-cara-gold)] hover:text-white"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Draft in Cara Studio{selectedChildId ? " — grounded in this child's records" : ""}
                    </Link>
                    <div className="rounded-xl border border-dashed border-[var(--cs-border)] bg-[var(--cs-surface)] p-8 text-center">
                      <Archive className="h-8 w-8 text-[var(--cs-text-muted)] mx-auto mb-2" />
                      <p className="text-xs text-[var(--cs-text-muted)]">
                        Filed artifacts will be listed here with status, date, and direct links to the record.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FolderOpen className="h-10 w-10 text-[var(--cs-text-muted)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--cs-text-secondary)]">Select a folder to view its contents</p>
                    <p className="text-xs text-[var(--cs-text-muted)] mt-1">
                      The filing cabinet mirrors Ofsted-expected record-keeping structures.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
