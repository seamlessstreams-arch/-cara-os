"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Cara STUDIO — CARE KNOWLEDGE GRAPH
//
// Visual representation of the connected knowledge across a child's care:
// people, events, themes, risks, interventions, and relationships between them.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/page-shell";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Network, Users, AlertTriangle, Heart, Shield,
  Sparkles, Search, ChevronRight, Activity,
  User, Calendar, BookOpen, Target,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface GraphNode {
  id: string;
  nodeType: string;
  label: string;
  data: Record<string, unknown>;
  edgeCount: number;
}

interface GraphEdge {
  id: string;
  fromLabel: string;
  toLabel: string;
  relationship: string;
  strength: number;
}

// ── Node type config ────────────────────────────────────────────────────────

const NODE_CONFIG: Record<string, { icon: React.ElementType; colour: string; label: string }> = {
  child: { icon: Heart, colour: "text-pink-600 bg-pink-50 border-pink-200", label: "Child" },
  staff: { icon: User, colour: "text-blue-600 bg-blue-50 border-blue-200", label: "Staff" },
  incident: { icon: AlertTriangle, colour: "text-amber-600 bg-amber-50 border-amber-200", label: "Incident" },
  risk: { icon: Shield, colour: "text-red-600 bg-red-50 border-red-200", label: "Risk" },
  theme: { icon: BookOpen, colour: "text-purple-600 bg-purple-50 border-purple-200", label: "Theme" },
  intervention: { icon: Target, colour: "text-emerald-600 bg-emerald-50 border-emerald-200", label: "Intervention" },
  behaviour: { icon: Activity, colour: "text-orange-600 bg-orange-50 border-orange-200", label: "Behaviour" },
  relationship: { icon: Users, colour: "text-teal-600 bg-teal-50 border-teal-200", label: "Relationship" },
};

// ── Demo data ───────────────────────────────────────────────────────────────

const DEMO_NODES: GraphNode[] = [
  { id: "n1", nodeType: "child", label: "Jayden", data: { age: 14 }, edgeCount: 8 },
  { id: "n2", nodeType: "child", label: "Amara", data: { age: 12 }, edgeCount: 6 },
  { id: "n3", nodeType: "child", label: "Reuben", data: { age: 15 }, edgeCount: 5 },
  { id: "n4", nodeType: "staff", label: "Darren Laville", data: { role: "Registered Manager" }, edgeCount: 12 },
  { id: "n5", nodeType: "staff", label: "Sarah Thompson", data: { role: "Deputy Manager" }, edgeCount: 9 },
  { id: "n6", nodeType: "staff", label: "Marcus Williams", data: { role: "Care Worker" }, edgeCount: 7 },
  { id: "n7", nodeType: "theme", label: "Family Contact", data: {}, edgeCount: 4 },
  { id: "n8", nodeType: "theme", label: "Identity & Belonging", data: {}, edgeCount: 3 },
  { id: "n9", nodeType: "theme", label: "Emotional Regulation", data: {}, edgeCount: 5 },
  { id: "n10", nodeType: "risk", label: "Self-Harm Indicators", data: { level: "medium" }, edgeCount: 3 },
  { id: "n11", nodeType: "risk", label: "Absconding Risk", data: { level: "low" }, edgeCount: 2 },
  { id: "n12", nodeType: "incident", label: "Window Damage — 10 May", data: { severity: "medium" }, edgeCount: 4 },
  { id: "n13", nodeType: "intervention", label: "PACE Key Work", data: {}, edgeCount: 3 },
  { id: "n14", nodeType: "intervention", label: "De-escalation Plan", data: {}, edgeCount: 4 },
  { id: "n15", nodeType: "behaviour", label: "Dysregulation after phone calls", data: {}, edgeCount: 3 },
  { id: "n16", nodeType: "relationship", label: "Mum — Jayden", data: { quality: "positive" }, edgeCount: 2 },
];

const DEMO_EDGES: GraphEdge[] = [
  { id: "e1", fromLabel: "Jayden", toLabel: "Family Contact", relationship: "theme_of", strength: 0.9 },
  { id: "e2", fromLabel: "Jayden", toLabel: "PACE Key Work", relationship: "receives", strength: 0.85 },
  { id: "e3", fromLabel: "Jayden", toLabel: "Mum — Jayden", relationship: "family_connection", strength: 0.8 },
  { id: "e4", fromLabel: "Reuben", toLabel: "Window Damage — 10 May", relationship: "involved_in", strength: 0.95 },
  { id: "e5", fromLabel: "Reuben", toLabel: "Emotional Regulation", relationship: "theme_of", strength: 0.88 },
  { id: "e6", fromLabel: "Reuben", toLabel: "De-escalation Plan", relationship: "receives", strength: 0.9 },
  { id: "e7", fromLabel: "Reuben", toLabel: "Dysregulation after phone calls", relationship: "exhibits", strength: 0.85 },
  { id: "e8", fromLabel: "Amara", toLabel: "Identity & Belonging", relationship: "theme_of", strength: 0.92 },
  { id: "e9", fromLabel: "Amara", toLabel: "Self-Harm Indicators", relationship: "risk_for", strength: 0.7 },
  { id: "e10", fromLabel: "Marcus Williams", toLabel: "Jayden", relationship: "key_worker_for", strength: 0.95 },
  { id: "e11", fromLabel: "Sarah Thompson", toLabel: "Amara", relationship: "key_worker_for", strength: 0.9 },
  { id: "e12", fromLabel: "Window Damage — 10 May", toLabel: "Dysregulation after phone calls", relationship: "triggered_by", strength: 0.8 },
];

// ── Children ────────────────────────────────────────────────────────────────

const DEMO_CHILDREN = [
  { id: "child_1", name: "Jayden" },
  { id: "child_2", name: "Amara" },
  { id: "child_3", name: "Reuben" },
];

// ══════════════════════════════════════════════════════════════════════════════

export default function CareGraphPage() {
  const [nodes] = useState<GraphNode[]>(DEMO_NODES);
  const [edges] = useState<GraphEdge[]>(DEMO_EDGES);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = nodes.filter((n) => {
    if (typeFilter && n.nodeType !== typeFilter) return false;
    if (searchQuery && !n.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const connectedEdges = selectedNode
    ? edges.filter((e) => e.fromLabel === selectedNode.label || e.toLabel === selectedNode.label)
    : [];

  const typeCounts: Record<string, number> = {};
  for (const n of nodes) typeCounts[n.nodeType] = (typeCounts[n.nodeType] ?? 0) + 1;

  return (
    <PageShell title="Care Graph" subtitle="Connected knowledge across care records">
      <div className="space-y-6 pb-12">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-[var(--cs-cara-gold-soft)] bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--cs-navy)]">
              <Network className="h-5 w-5 text-[var(--cs-cara-gold)]" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-[var(--cs-navy)]">Care Knowledge Graph</h2>
              <p className="text-xs text-[var(--cs-text-secondary)] mt-0.5">
                Visual map of connected knowledge: children, staff, themes, risks, incidents, interventions, and the relationships between them.
              </p>
            </div>
            <Badge className="text-[10px] bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]">
              {nodes.length} nodes · {edges.length} connections
            </Badge>
          </div>
        </div>

        {/* ── Type filter pills ────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTypeFilter(null)}
            className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
              !typeFilter ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-navy)]" : "border-[var(--cs-border)] bg-white text-[var(--cs-text-secondary)]")}
          >
            All ({nodes.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const config = NODE_CONFIG[type];
            if (!config) return null;
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                  typeFilter === type ? "ring-1 ring-[var(--cs-cara-gold-soft)]" : "", config.colour)}
              >
                <Icon className="h-3 w-3" />{config.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Node list ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cs-text-muted)]" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..." className="w-full rounded-xl border border-[var(--cs-border)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--cs-navy)] placeholder:text-[var(--cs-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--cs-cara-gold)]" />
            </div>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
              {filteredNodes.map((node) => {
                const config = NODE_CONFIG[node.nodeType] ?? NODE_CONFIG.theme;
                const Icon = config.icon;
                const isSelected = selectedNode?.id === node.id;
                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                    className={cn("w-full flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all",
                      isSelected ? "border-[var(--cs-cara-gold)] bg-[var(--cs-cara-gold-bg)] ring-1 ring-[var(--cs-cara-gold-soft)]" : "border-[var(--cs-border)] bg-white hover:border-[var(--cs-cara-gold-soft)]")}
                  >
                    <div className={cn("flex h-7 w-7 items-center justify-center rounded-md border", config.colour)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-semibold text-[var(--cs-navy)] block truncate">{node.label}</span>
                      <span className="text-[10px] text-[var(--cs-text-muted)]">{config.label} · {node.edgeCount} connections</span>
                    </div>
                    <ChevronRight className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-[var(--cs-cara-gold)]" : "text-[var(--cs-text-muted)]")} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Connection detail ──────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {selectedNode ? (
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-5 space-y-4">
                <div className="flex items-center gap-3">
                  {(() => { const config = NODE_CONFIG[selectedNode.nodeType] ?? NODE_CONFIG.theme; const Icon = config.icon; return (
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border", config.colour)}>
                      <Icon className="h-5 w-5" />
                    </div>
                  ); })()}
                  <div>
                    <h3 className="text-base font-semibold text-[var(--cs-navy)]">{selectedNode.label}</h3>
                    <p className="text-xs text-[var(--cs-text-muted)]">{NODE_CONFIG[selectedNode.nodeType]?.label ?? selectedNode.nodeType} · {selectedNode.edgeCount} connections</p>
                  </div>
                </div>

                {connectedEdges.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-[var(--cs-navy)] uppercase tracking-wide">Connections</h4>
                    {connectedEdges.map((edge) => {
                      const otherLabel = edge.fromLabel === selectedNode.label ? edge.toLabel : edge.fromLabel;
                      return (
                        <div key={edge.id} className="flex items-center gap-3 rounded-lg border border-[var(--cs-border-subtle)] p-3">
                          <div className="flex-1">
                            <span className="text-xs font-medium text-[var(--cs-navy)]">{otherLabel}</span>
                            <Badge className="text-[9px] ml-2 bg-[var(--cs-surface)] text-[var(--cs-text-muted)] border-[var(--cs-border)]">
                              {edge.relationship.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-[var(--cs-surface)] rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--cs-cara-gold)] rounded-full" style={{ width: `${edge.strength * 100}%` }} />
                            </div>
                            <span className="text-[10px] text-[var(--cs-text-muted)]">{Math.round(edge.strength * 100)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--cs-border)] bg-white p-12 text-center">
                <Network className="h-10 w-10 text-[var(--cs-text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--cs-text-secondary)]">Select a node to see its connections</p>
                <p className="text-xs text-[var(--cs-text-muted)] mt-1">The knowledge graph maps relationships between children, staff, themes, risks, and interventions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
