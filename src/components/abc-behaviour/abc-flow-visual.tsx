"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ABC Flow Visual · §16
//
// A deterministic three-column flow: Antecedent → Behaviour → Consequence. Nodes
// are the recurring items in the child's chains; links connect A→B→C, sized by
// how often the chain recurs and coloured by how often the behaviour stayed
// contained (teal) versus escalated (rose). Pure SVG — no chart library.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import type { ChildABCProfile, ABCChain } from "@/lib/abc-behaviour/types";

const W = 720;
const COL = { a: { x: 24, w: 172 }, b: { x: 274, w: 172 }, c: { x: 524, w: 172 } };
const ROW_H = 46;
const PAD_TOP = 34;

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

/** Evenly spaced y-centres for a column's nodes. */
function positions(labels: string[]): Map<string, number> {
  const m = new Map<string, number>();
  labels.forEach((l, i) => m.set(l, PAD_TOP + i * ROW_H + ROW_H / 2));
  return m;
}

function chainColour(chain: ABCChain): string {
  const rate = chain.count ? chain.containedCount / chain.count : 0;
  if (rate >= 0.66) return "#0d9488"; // mostly contained
  if (rate >= 0.34) return "#b7791f"; // mixed
  return "#c0392b"; // mostly escalated
}

function link(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function ABCFlowVisual({ profile }: { profile: ChildABCProfile }) {
  const chains = profile.chains;
  if (chains.length === 0) {
    return <p className="py-6 text-center text-sm text-[var(--cs-text-muted,#6c7a83)]">No behaviour-log entries to chart for {profile.childName} yet.</p>;
  }

  // Nodes are the distinct items that actually appear in the displayed chains,
  // so every link has real endpoints.
  const aLabels = [...new Set(chains.map((c) => c.antecedent))];
  const bLabels = [...new Set(chains.map((c) => c.behaviour))];
  const cLabels = [...new Set(chains.map((c) => c.consequence))];
  const aPos = positions(aLabels);
  const bPos = positions(bLabels);
  const cPos = positions(cLabels);

  const rows = Math.max(aLabels.length, bLabels.length, cLabels.length);
  const H = PAD_TOP + rows * ROW_H + 8;
  const maxCount = Math.max(...chains.map((c) => c.count), 1);
  const strokeFor = (count: number) => 1.5 + (count / maxCount) * 7;

  const Node = ({ x, w, y, label, count }: { x: number; w: number; y: number; label: string; count: number }) => (
    <g>
      <rect x={x} y={y - ROW_H / 2 + 5} width={w} height={ROW_H - 12} rx={7} fill="#ffffff" stroke="var(--cs-border,#e2e8ec)" />
      <text x={x + 8} y={y - 1} fontSize={11} fontWeight={600} fill="#1f2a30">{truncate(label, 24)}</text>
      <text x={x + 8} y={y + 12} fontSize={9.5} fill="#8a97a0">{count}×</text>
    </g>
  );

  const colCount = (labels: string[], get: (c: ABCChain) => string): Map<string, number> => {
    const m = new Map<string, number>();
    for (const l of labels) m.set(l, chains.filter((c) => get(c) === l).reduce((s, c) => s + c.count, 0));
    return m;
  };
  const aCount = colCount(aLabels, (c) => c.antecedent);
  const bCount = colCount(bLabels, (c) => c.behaviour);
  const cCount = colCount(cLabels, (c) => c.consequence);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ minWidth: 560 }} role="img" aria-label={`ABC behaviour flow for ${profile.childName}`}>
        {/* Column headers */}
        <text x={COL.a.x} y={18} fontSize={11} fontWeight={700} fill="#0d9488">ANTECEDENT</text>
        <text x={COL.b.x} y={18} fontSize={11} fontWeight={700} fill="#0d9488">BEHAVIOUR</text>
        <text x={COL.c.x} y={18} fontSize={11} fontWeight={700} fill="#0d9488">CONSEQUENCE</text>

        {/* Links (drawn under nodes) */}
        {chains.map((ch, i) => {
          const colour = chainColour(ch);
          const sw = strokeFor(ch.count);
          const ay = aPos.get(ch.antecedent)!;
          const by = bPos.get(ch.behaviour)!;
          const cy = cPos.get(ch.consequence)!;
          return (
            <g key={i} opacity={0.5}>
              <path d={link(COL.a.x + COL.a.w, ay, COL.b.x, by)} stroke={colour} strokeWidth={sw} fill="none" strokeLinecap="round" />
              <path d={link(COL.b.x + COL.b.w, by, COL.c.x, cy)} stroke={colour} strokeWidth={sw} fill="none" strokeLinecap="round" />
            </g>
          );
        })}

        {/* Nodes */}
        {aLabels.map((l) => <Node key={`a-${l}`} x={COL.a.x} w={COL.a.w} y={aPos.get(l)!} label={l} count={aCount.get(l) ?? 0} />)}
        {bLabels.map((l) => <Node key={`b-${l}`} x={COL.b.x} w={COL.b.w} y={bPos.get(l)!} label={l} count={bCount.get(l) ?? 0} />)}
        {cLabels.map((l) => <Node key={`c-${l}`} x={COL.c.x} w={COL.c.w} y={cPos.get(l)!} label={l} count={cCount.get(l) ?? 0} />)}
      </svg>
      <div className="mt-1 flex items-center gap-3 px-1 text-[10px] text-[var(--cs-text-muted,#8a97a0)]">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-full" style={{ background: "#0d9488" }} /> mostly contained</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-full" style={{ background: "#b7791f" }} /> mixed</span>
        <span className="inline-flex items-center gap-1"><span className="inline-block h-2 w-4 rounded-full" style={{ background: "#c0392b" }} /> mostly escalated</span>
        <span className="ml-auto">line thickness = how often the chain recurs</span>
      </div>
    </div>
  );
}
