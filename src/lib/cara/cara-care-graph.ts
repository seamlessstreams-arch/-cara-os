// ══════════════════════════════════════════════════════════════════════════════
// Cara Care Graph Builder
//
// Synthesizes a typed knowledge graph (nodes + edges) from live operational
// records — children, incidents, missing episodes, restraints, risk
// assessments, behaviour plans, safeguarding patterns and early warnings.
//
// Output is an AI draft. Human approval is required before any node or edge
// influences statutory records. The graph powers formulation, decision support
// and traceability — every node carries a source_table/source_id link back to
// the underlying record so evidence is never severed from its origin.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  CaraCareGraphNode,
  CaraCareGraphEdge,
  CaraCareGraphSnapshot,
  CaraCareGraphNodeType,
  CaraCareGraphEdgeType,
  CaraPatternSeverity,
} from "@/types/cara-studio";

const DEFAULT_LOOKBACK_DAYS = 60;

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

interface BuildOptions {
  lookbackDays?: number;
  childId?: string | null;
  persist?: boolean;
}

interface DraftNode {
  key: string; // dedupe key (source_table:source_id) or synthetic
  node_type: CaraCareGraphNodeType;
  label: string;
  description: string | null;
  source_table: string | null;
  source_id: string | null;
  metadata: Record<string, unknown> | null;
  severity: CaraPatternSeverity | null;
  occurred_at: string | null;
  child_id: string | null;
}

interface DraftEdge {
  from_key: string;
  to_key: string;
  edge_type: CaraCareGraphEdgeType;
  weight: number;
  rationale: string | null;
}

// ── Build helpers ─────────────────────────────────────────────────────────────

function severityFromIncident(s: string): CaraPatternSeverity {
  if (s === "critical" || s === "high" || s === "medium" || s === "low") return s;
  return "low";
}

function severityFromRisk(level: string): CaraPatternSeverity {
  switch (level) {
    case "critical": return "critical";
    case "high":     return "high";
    case "medium":   return "medium";
    default:         return "low";
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function buildCareGraph(homeId: string, options: BuildOptions = {}): CaraCareGraphSnapshot {
  const lookback = options.lookbackDays ?? DEFAULT_LOOKBACK_DAYS;
  const childIdFilter = options.childId ?? null;
  const persist = options.persist ?? true;
  const windowStart = daysAgoIso(lookback);

  const draftNodes = new Map<string, DraftNode>();
  const draftEdges: DraftEdge[] = [];

  function addNode(n: DraftNode): void {
    if (!draftNodes.has(n.key)) draftNodes.set(n.key, n);
  }
  function addEdge(e: DraftEdge): void {
    draftEdges.push(e);
  }

  // 1. Children — root nodes scoped to this home
  const children = db.youngPeople.findAll().filter((yp) => {
    if (yp.home_id !== homeId) return false;
    if (childIdFilter && yp.id !== childIdFilter) return false;
    return true;
  });
  const childIds = new Set(children.map((c) => c.id));

  for (const c of children) {
    addNode({
      key: `young_people:${c.id}`,
      node_type: "child",
      label: c.preferred_name || c.first_name || c.id,
      description: c.placement_type ? `Placement: ${c.placement_type}` : null,
      source_table: "young_people",
      source_id: c.id,
      metadata: { dob: c.date_of_birth ?? null, status: c.status ?? null },
      severity: null,
      occurred_at: null,
      child_id: c.id,
    });

    // Key worker edge
    if (c.key_worker_id) {
      const kwKey = `staff:${c.key_worker_id}`;
      const kwStaff = db.staff.findById(c.key_worker_id);
      addNode({
        key: kwKey,
        node_type: "key_worker",
        label: kwStaff ? `${kwStaff.first_name} ${kwStaff.last_name}` : c.key_worker_id,
        description: "Key worker",
        source_table: "staff",
        source_id: c.key_worker_id,
        metadata: null,
        severity: null,
        occurred_at: null,
        child_id: null,
      });
      addEdge({
        from_key: kwKey,
        to_key: `young_people:${c.id}`,
        edge_type: "managed_by",
        weight: 1,
        rationale: "Assigned key worker",
      });
    }
  }

  // 2. Incidents
  const incidents = db.incidents.findAll().filter((i) => {
    if (i.home_id !== homeId) return false;
    if (i.date < windowStart) return false;
    if (childIdFilter && i.child_id !== childIdFilter) return false;
    return true;
  });
  for (const inc of incidents) {
    if (!childIds.has(inc.child_id)) continue;
    const key = `incidents:${inc.id}`;
    addNode({
      key,
      node_type: "incident",
      label: inc.reference || `Incident ${inc.id.slice(0, 8)}`,
      description: inc.description?.slice(0, 200) ?? null,
      source_table: "incidents",
      source_id: inc.id,
      metadata: { type: inc.type, status: inc.status, requires_oversight: inc.requires_oversight },
      severity: severityFromIncident(inc.severity),
      occurred_at: inc.date,
      child_id: inc.child_id,
    });
    addEdge({
      from_key: key,
      to_key: `young_people:${inc.child_id}`,
      edge_type: "involves",
      weight: 1,
      rationale: `${inc.severity} severity ${inc.type}`,
    });
  }

  // 3. Missing episodes
  const missing = db.missingEpisodes.findAll().filter((m) => {
    if (m.home_id !== homeId) return false;
    if (m.date_missing < windowStart) return false;
    if (childIdFilter && m.child_id !== childIdFilter) return false;
    return true;
  });
  for (const m of missing) {
    if (!childIds.has(m.child_id)) continue;
    const key = `missing_episodes:${m.id}`;
    addNode({
      key,
      node_type: "missing_episode",
      label: `Missing — ${m.date_missing}`,
      description: m.location_last_seen
        ? `Last seen: ${m.location_last_seen}`
        : null,
      source_table: "missing_episodes",
      source_id: m.id,
      metadata: {
        risk_level: m.risk_level,
        status: m.status,
        contextual_safeguarding_risk: m.contextual_safeguarding_risk,
      },
      severity: severityFromRisk(m.risk_level),
      occurred_at: m.date_missing,
      child_id: m.child_id,
    });
    addEdge({
      from_key: key,
      to_key: `young_people:${m.child_id}`,
      edge_type: "involves",
      weight: 1,
      rationale: `${m.risk_level} risk missing episode`,
    });
    if (m.linked_incident_id) {
      addEdge({
        from_key: `incidents:${m.linked_incident_id}`,
        to_key: key,
        edge_type: "linked_to",
        weight: 1,
        rationale: "Linked incident reference",
      });
    }
  }

  // 4. Restraints (no home_id on record — filter by child set)
  const restraints = db.restraints.findAll().filter((r) => {
    if (!childIds.has(r.child_id)) return false;
    if (r.date < windowStart) return false;
    return true;
  });
  for (const r of restraints) {
    const key = `restraints:${r.id}`;
    addNode({
      key,
      node_type: "restraint",
      label: `${r.restraint_type} — ${r.date}`,
      description: r.reason?.slice(0, 200) ?? null,
      source_table: "restraints",
      source_id: r.id,
      metadata: { duration: r.duration, restraint_type: r.restraint_type },
      severity: r.duration && r.duration > 5 ? "high" : "medium",
      occurred_at: r.date,
      child_id: r.child_id,
    });
    addEdge({
      from_key: key,
      to_key: `young_people:${r.child_id}`,
      edge_type: "involves",
      weight: 1,
      rationale: `Physical intervention (${r.duration ?? "?"} min)`,
    });
  }

  // 5. Risk assessments — current only
  const risks = db.riskAssessments.findAll().filter((r) => {
    if (r.home_id !== homeId) return false;
    if (r.status !== "current") return false;
    if (childIdFilter && r.child_id !== childIdFilter) return false;
    return true;
  });
  for (const risk of risks) {
    if (!childIds.has(risk.child_id)) continue;
    const key = `risk_assessments:${risk.id}`;
    addNode({
      key,
      node_type: "risk",
      label: `${risk.domain} risk — ${risk.current_level}`,
      description: risk.indicators?.slice(0, 3).join("; ") || null,
      source_table: "risk_assessments",
      source_id: risk.id,
      metadata: { domain: risk.domain, trend: risk.trend },
      severity: severityFromRisk(risk.current_level),
      occurred_at: risk.assessed_date,
      child_id: risk.child_id,
    });
    addEdge({
      from_key: key,
      to_key: `young_people:${risk.child_id}`,
      edge_type: "relates_to",
      weight: 1,
      rationale: `Current ${risk.domain} risk`,
    });

    // Trigger nodes
    for (const t of risk.triggers ?? []) {
      const tk = `trigger:${risk.child_id}:${t}`;
      addNode({
        key: tk,
        node_type: "trigger",
        label: t,
        description: `Trigger identified in ${risk.domain} risk assessment`,
        source_table: "risk_assessments",
        source_id: risk.id,
        metadata: { domain: risk.domain },
        severity: null,
        occurred_at: null,
        child_id: risk.child_id,
      });
      addEdge({
        from_key: tk,
        to_key: key,
        edge_type: "triggered_by",
        weight: 1,
        rationale: "Identified trigger",
      });
    }

    // Mitigations as protective factors
    for (const mit of risk.mitigations ?? []) {
      const pk = `protective:${risk.child_id}:${mit.strategy.slice(0, 40)}`;
      addNode({
        key: pk,
        node_type: "protective_factor",
        label: mit.strategy.slice(0, 80),
        description: `Owner: ${mit.responsible} — ${mit.effectiveness}`,
        source_table: "risk_assessments",
        source_id: risk.id,
        metadata: { effectiveness: mit.effectiveness },
        severity: null,
        occurred_at: null,
        child_id: risk.child_id,
      });
      addEdge({
        from_key: pk,
        to_key: key,
        edge_type: "mitigates",
        weight: mit.effectiveness === "effective" ? 2 : 1,
        rationale: `Mitigation strategy (${mit.effectiveness})`,
      });
    }
  }

  // 6. Behaviour support plans — current
  const bsps = db.behaviourSupportPlans.findAll().filter((p) => {
    if (childIdFilter && p.child_id !== childIdFilter) return false;
    if (p.status !== "active") return false;
    if (!childIds.has(p.child_id)) return false;
    return true;
  });
  for (const bsp of bsps) {
    const key = `behaviour_support_plans:${bsp.id}`;
    addNode({
      key,
      node_type: "behaviour_plan",
      label: `Behaviour plan — ${bsp.child_id}`,
      description: null,
      source_table: "behaviour_support_plans",
      source_id: bsp.id,
      metadata: { review_date: bsp.review_date },
      severity: null,
      occurred_at: bsp.created_at?.slice(0, 10) ?? null,
      child_id: bsp.child_id,
    });
    addEdge({
      from_key: key,
      to_key: `young_people:${bsp.child_id}`,
      edge_type: "managed_by",
      weight: 1,
      rationale: "Active behaviour support plan",
    });
  }

  // 7. Safeguarding patterns (open) → connect to involved child
  const sgps = db.caraSafeguardingPatterns.findOpen(homeId);
  for (const p of sgps) {
    if (childIdFilter && p.child_id !== childIdFilter) continue;
    if (p.child_id && !childIds.has(p.child_id)) continue;
    const key = `cara_safeguarding_patterns:${p.id}`;
    addNode({
      key,
      node_type: "safeguarding_pattern",
      label: p.title,
      description: p.description,
      source_table: "cara_safeguarding_patterns",
      source_id: p.id,
      metadata: { pattern_type: p.pattern_type, status: p.status },
      severity: p.severity,
      occurred_at: p.detected_at?.slice(0, 10) ?? null,
      child_id: p.child_id,
    });
    if (p.child_id) {
      addEdge({
        from_key: key,
        to_key: `young_people:${p.child_id}`,
        edge_type: "relates_to",
        weight: p.severity === "critical" ? 3 : p.severity === "high" ? 2 : 1,
        rationale: "Detected safeguarding pattern",
      });
    }

    // Connect pattern back to its evidence records
    for (const ev of p.evidence_refs ?? []) {
      const evKey = `${ev.source_table}:${ev.source_id}`;
      if (draftNodes.has(evKey)) {
        addEdge({
          from_key: evKey,
          to_key: key,
          edge_type: "evidences",
          weight: 1,
          rationale: ev.excerpt?.slice(0, 120) ?? "Evidence reference",
        });
      }
    }
  }

  // 8. Active early warnings
  const warnings = db.caraEarlyWarnings.findActive(homeId);
  for (const w of warnings) {
    if (childIdFilter && w.child_id !== childIdFilter) continue;
    if (w.child_id && !childIds.has(w.child_id)) continue;
    const key = `cara_early_warnings:${w.id}`;
    addNode({
      key,
      node_type: "early_warning",
      label: w.title,
      description: w.rationale,
      source_table: "cara_early_warnings",
      source_id: w.id,
      metadata: { warning_type: w.warning_type, status: w.status },
      severity: w.severity,
      occurred_at: w.created_at?.slice(0, 10) ?? null,
      child_id: w.child_id,
    });
    if (w.child_id) {
      addEdge({
        from_key: key,
        to_key: `young_people:${w.child_id}`,
        edge_type: "relates_to",
        weight: 2,
        rationale: "Active early warning",
      });
    }
    if (w.source_pattern_id) {
      addEdge({
        from_key: `cara_safeguarding_patterns:${w.source_pattern_id}`,
        to_key: key,
        edge_type: "escalated_from",
        weight: 2,
        rationale: "Escalated from detected pattern",
      });
    }
  }

  // ── Persistence (idempotent: rebuild from scratch for the scope) ────────────

  if (persist) {
    // Wipe existing nodes/edges for this scope so re-runs replace cleanly.
    const existingNodes = db.caraCareGraphNodes.findAll(homeId).filter((n) => {
      if (childIdFilter !== null) {
        return n.child_id === childIdFilter || n.child_id === null;
      }
      return true;
    });
    const existingNodeIds = new Set(existingNodes.map((n) => n.id));
    db.caraCareGraphEdges.deleteByNodeIds(existingNodeIds);
    db.caraCareGraphNodes.deleteByHome(homeId, childIdFilter ?? undefined);
  }

  // Materialise nodes
  const keyToId = new Map<string, string>();
  const persistedNodes: CaraCareGraphNode[] = [];
  for (const draft of draftNodes.values()) {
    if (persist) {
      const created = db.caraCareGraphNodes.create({
        home_id: homeId,
        child_id: draft.child_id,
        node_type: draft.node_type,
        label: draft.label,
        description: draft.description,
        source_table: draft.source_table,
        source_id: draft.source_id,
        metadata: draft.metadata,
        severity: draft.severity,
        occurred_at: draft.occurred_at,
        is_ai_draft: true,
      });
      keyToId.set(draft.key, created.id);
      persistedNodes.push(created);
    } else {
      const synthetic: CaraCareGraphNode = {
        id: `preview_${draft.key}`,
        home_id: homeId,
        child_id: draft.child_id,
        node_type: draft.node_type,
        label: draft.label,
        description: draft.description,
        source_table: draft.source_table,
        source_id: draft.source_id,
        metadata: draft.metadata,
        severity: draft.severity,
        occurred_at: draft.occurred_at,
        is_ai_draft: true,
        created_at: new Date().toISOString(),
      };
      keyToId.set(draft.key, synthetic.id);
      persistedNodes.push(synthetic);
    }
  }

  // Materialise edges (skip any that point at unresolved keys)
  const persistedEdges: CaraCareGraphEdge[] = [];
  for (const e of draftEdges) {
    const fromId = keyToId.get(e.from_key);
    const toId = keyToId.get(e.to_key);
    if (!fromId || !toId) continue;
    if (persist) {
      const created = db.caraCareGraphEdges.create({
        home_id: homeId,
        from_node_id: fromId,
        to_node_id: toId,
        edge_type: e.edge_type,
        weight: e.weight,
        rationale: e.rationale,
        is_ai_draft: true,
      });
      persistedEdges.push(created);
    } else {
      persistedEdges.push({
        id: `preview_edge_${persistedEdges.length}`,
        home_id: homeId,
        from_node_id: fromId,
        to_node_id: toId,
        edge_type: e.edge_type,
        weight: e.weight,
        rationale: e.rationale,
        is_ai_draft: true,
        created_at: new Date().toISOString(),
      });
    }
  }

  // ── Summary counts ──────────────────────────────────────────────────────────
  const nodeCounts: Record<string, number> = {};
  for (const n of persistedNodes) {
    nodeCounts[n.node_type] = (nodeCounts[n.node_type] ?? 0) + 1;
  }
  const edgeCounts: Record<string, number> = {};
  for (const e of persistedEdges) {
    edgeCounts[e.edge_type] = (edgeCounts[e.edge_type] ?? 0) + 1;
  }

  return {
    home_id: homeId,
    child_id: childIdFilter,
    generated_at: new Date().toISOString(),
    nodes: persistedNodes,
    edges: persistedEdges,
    summary: {
      node_counts: nodeCounts,
      edge_counts: edgeCounts,
      total_nodes: persistedNodes.length,
      total_edges: persistedEdges.length,
    },
  };
}

export function loadCareGraph(homeId: string, childId?: string | null): CaraCareGraphSnapshot {
  const allNodes = db.caraCareGraphNodes.findAll(homeId).filter((n) => {
    if (!childId) return true;
    return n.child_id === childId || n.child_id === null;
  });
  const nodeIds = new Set(allNodes.map((n) => n.id));
  const allEdges = db.caraCareGraphEdges.findAll(homeId).filter(
    (e) => nodeIds.has(e.from_node_id) && nodeIds.has(e.to_node_id),
  );
  const nodeCounts: Record<string, number> = {};
  for (const n of allNodes) nodeCounts[n.node_type] = (nodeCounts[n.node_type] ?? 0) + 1;
  const edgeCounts: Record<string, number> = {};
  for (const e of allEdges) edgeCounts[e.edge_type] = (edgeCounts[e.edge_type] ?? 0) + 1;
  return {
    home_id: homeId,
    child_id: childId ?? null,
    generated_at: new Date().toISOString(),
    nodes: allNodes,
    edges: allEdges,
    summary: {
      node_counts: nodeCounts,
      edge_counts: edgeCounts,
      total_nodes: allNodes.length,
      total_edges: allEdges.length,
    },
  };
}
