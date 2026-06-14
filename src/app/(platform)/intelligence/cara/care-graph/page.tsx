"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Cara CARE GRAPH
// Live knowledge graph linking children, incidents, missing episodes,
// restraints, risks, plans, safeguarding patterns and early warnings.
// Cara drafts the structure. Humans approve every connection.
// ══════════════════════════════════════════════════════════════════════════════

import { useMemo } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Network, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { useCareGraph, useRebuildCareGraph } from "@/hooks/use-cara-care-graph";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToCaraRole } from "@/lib/cara/cara-permissions";
import type {
  CaraCareGraphNode,
  CaraCareGraphEdge,
  CaraCareGraphNodeType,
  CaraPatternSeverity,
} from "@/types/cara-studio";

const HOME_ID = "home_oak";

const SEVERITY_TONE: Record<CaraPatternSeverity, string> = {
  critical: "bg-rose-50 text-rose-800 border-rose-300",
  high: "bg-orange-50 text-orange-800 border-orange-300",
  medium: "bg-amber-50 text-amber-800 border-amber-300",
  low: "bg-slate-50 text-slate-700 border-slate-300",
};

const NODE_TYPE_LABELS: Record<CaraCareGraphNodeType, string> = {
  child: "Children",
  incident: "Incidents",
  missing_episode: "Missing Episodes",
  restraint: "Restraints",
  risk: "Risks",
  behaviour_plan: "Behaviour Plans",
  care_plan: "Care Plans",
  professional: "Professionals",
  family_member: "Family",
  key_worker: "Key Workers",
  placement: "Placements",
  safeguarding_pattern: "Safeguarding Patterns",
  early_warning: "Early Warnings",
  trigger: "Triggers",
  protective_factor: "Protective Factors",
  incident_cluster: "Clusters",
};

function NodeRow({
  node,
  edges,
  nodeIndex,
}: {
  node: CaraCareGraphNode;
  edges: CaraCareGraphEdge[];
  nodeIndex: Map<string, CaraCareGraphNode>;
}) {
  const outgoing = edges.filter((e) => e.from_node_id === node.id);
  const incoming = edges.filter((e) => e.to_node_id === node.id);

  return (
    <div
      className={`rounded border p-3 ${
        node.severity ? SEVERITY_TONE[node.severity] : "bg-background"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{node.label}</div>
          {node.description && (
            <div className="text-xs text-muted-foreground line-clamp-2">
              {node.description}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {node.severity && (
            <Badge variant="outline" className="bg-background text-[10px]">
              {node.severity.toUpperCase()}
            </Badge>
          )}
          {node.occurred_at && (
            <span className="text-[10px] text-muted-foreground">
              {node.occurred_at}
            </span>
          )}
        </div>
      </div>
      {(outgoing.length > 0 || incoming.length > 0) && (
        <div className="mt-2 grid grid-cols-1 gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
          {outgoing.slice(0, 4).map((e) => {
            const target = nodeIndex.get(e.to_node_id);
            if (!target) return null;
            return (
              <div key={e.id} className="truncate">
                → <span className="font-medium">{e.edge_type}</span> ·{" "}
                {target.label}
              </div>
            );
          })}
          {incoming.slice(0, 4).map((e) => {
            const source = nodeIndex.get(e.from_node_id);
            if (!source) return null;
            return (
              <div key={e.id} className="truncate">
                ← {source.label} ·{" "}
                <span className="font-medium">{e.edge_type}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CareGraphPage() {
  const { currentUser } = useAuthContext();
  const caraRole = appRoleToCaraRole(
    currentUser?.role ?? "registered_manager",
  );

  const graphQuery = useCareGraph(HOME_ID);
  const rebuild = useRebuildCareGraph();

  const snapshot = graphQuery.data?.data;
  const nodeIndex = useMemo(() => {
    const m = new Map<string, CaraCareGraphNode>();
    for (const n of snapshot?.nodes ?? []) m.set(n.id, n);
    return m;
  }, [snapshot]);

  const grouped = useMemo(() => {
    const groups = new Map<CaraCareGraphNodeType, CaraCareGraphNode[]>();
    for (const n of snapshot?.nodes ?? []) {
      const list = groups.get(n.node_type) ?? [];
      list.push(n);
      groups.set(n.node_type, list);
    }
    return groups;
  }, [snapshot]);

  const handleRebuild = () => {
    rebuild.mutate({
      home_id: HOME_ID,
      actor_id: currentUser?.id,
      actor_role: caraRole,
    });
  };

  return (
    <PageShell
      title="Cara Care Graph"
      subtitle="Linked view of every child, incident, risk, plan, pattern and warning. Cara drafts the connections — managers approve before they influence statutory records."
      actions={
        <Button onClick={handleRebuild} disabled={rebuild.isPending}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${rebuild.isPending ? "animate-spin" : ""}`}
          />
          {rebuild.isPending ? "Rebuilding…" : "Rebuild graph"}
        </Button>
      }
    >
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Graph summary
                </CardTitle>
                <CardDescription>
                  {snapshot
                    ? `${snapshot.summary.total_nodes} nodes · ${snapshot.summary.total_edges} edges · generated ${new Date(snapshot.generated_at).toLocaleString()}`
                    : "Loading…"}
                </CardDescription>
              </div>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          {snapshot && (
            <CardContent className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 lg:grid-cols-6">
              {Object.entries(snapshot.summary.node_counts).map(([k, v]) => (
                <div key={k} className="rounded border bg-background p-2">
                  <div className="font-medium">
                    {NODE_TYPE_LABELS[k as CaraCareGraphNodeType] ?? k}
                  </div>
                  <div className="text-lg">{v}</div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {snapshot && snapshot.nodes.length === 0 && (
          <Card>
            <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4" />
              No graph yet — press “Rebuild graph” to draft one from current
              records.
            </CardContent>
          </Card>
        )}

        {snapshot &&
          Array.from(grouped.entries()).map(([type, nodes]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="text-sm">
                  {NODE_TYPE_LABELS[type] ?? type}{" "}
                  <span className="text-xs text-muted-foreground">
                    ({nodes.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {nodes.map((n) => (
                  <NodeRow
                    key={n.id}
                    node={n}
                    edges={snapshot.edges}
                    nodeIndex={nodeIndex}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
      </div>
    </PageShell>
  );
}
