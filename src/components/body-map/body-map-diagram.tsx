"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — BODY MAP DIAGRAM
// A reusable interactive body outline. Staff click where a mark, bruise or
// injury is and a numbered pin is dropped at that exact point; the clinical
// body region is derived from the click (patient-left/right aware, which is the
// safeguarding convention — the figure's left is the child's left). Used by the
// Body Map record form (one mark per record) and by the Accident Book form (an
// accident can produce several injuries → multiple pins). Also renders saved
// marks read-only for the record detail view and print/export.
//
// Positions are stored as a percentage of the diagram (0–100 on each axis) so
// they are resolution-independent and render identically at any size.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { BodyRegion, BodyMark, BodyView, MarkType } from "@/types/extended";

// ── Region labels (single source of truth, shared with the Body Map page) ──────
export const REGION_LABELS: Record<BodyRegion, string> = {
  head_front: "Head (Front)", head_back: "Head (Back)", head_left: "Head (Left)", head_right: "Head (Right)",
  face: "Face", neck: "Neck",
  chest: "Chest", abdomen: "Abdomen", upper_back: "Upper Back", lower_back: "Lower Back",
  left_shoulder: "Left Shoulder", right_shoulder: "Right Shoulder",
  left_upper_arm: "Left Upper Arm", right_upper_arm: "Right Upper Arm",
  left_forearm: "Left Forearm", right_forearm: "Right Forearm",
  left_hand: "Left Hand", right_hand: "Right Hand",
  left_hip: "Left Hip", right_hip: "Right Hip",
  left_thigh: "Left Thigh", right_thigh: "Right Thigh",
  left_knee: "Left Knee", right_knee: "Right Knee",
  left_shin: "Left Shin", right_shin: "Right Shin",
  left_foot: "Left Foot", right_foot: "Right Foot",
};

// SVG canvas. Width 120, height 260 — a standing figure.
const VB_W = 120;
const VB_H = 260;

/**
 * Derive the clinical body region from a click point.
 * `x`/`y` are 0–100 percentages of the diagram. Side is resolved to the
 * CHILD's left/right: on the front view the figure's left is on the viewer's
 * right; on the back view they coincide.
 */
export function regionAtPoint(view: BodyView, x: number, y: number): BodyRegion {
  const childSide = (nx: number): "left" | "right" =>
    view === "front" ? (nx < 50 ? "right" : "left") : nx < 50 ? "left" : "right";
  const side = childSide(x);

  // Head / neck (midline)
  if (y < 16) return view === "front" ? "face" : "head_back";
  if (y < 19) return "neck";

  const inTrunk = x >= 35 && x <= 65;

  // Arms & hands sit outside the trunk column
  if (!inTrunk && y >= 19 && y < 54) {
    if (y < 27) return side === "left" ? "left_shoulder" : "right_shoulder";
    if (y < 41) return side === "left" ? "left_upper_arm" : "right_upper_arm";
    if (y < 53) return side === "left" ? "left_forearm" : "right_forearm";
    return side === "left" ? "left_hand" : "right_hand";
  }

  // Trunk
  if (inTrunk && y < 40) return view === "front" ? "chest" : "upper_back";
  if (inTrunk && y < 54) return view === "front" ? "abdomen" : "lower_back";
  if (y < 60) return side === "left" ? "left_hip" : "right_hip";

  // Legs & feet
  if (y < 77) return side === "left" ? "left_thigh" : "right_thigh";
  if (y < 84) return side === "left" ? "left_knee" : "right_knee";
  if (y < 93) return side === "left" ? "left_shin" : "right_shin";
  return side === "left" ? "left_foot" : "right_foot";
}

function newMarkId(): string {
  return `bm_${Math.random().toString(36).slice(2, 9)}`;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ── The figure outline (shared by front & back; a clean neutral pictogram) ──────
function FigureOutline() {
  const fill = "var(--cs-surface-2, #e9eef4)";
  const stroke = "var(--cs-border, #c2cdd9)";
  return (
    <g fill={fill} stroke={stroke} strokeWidth={1.4} strokeLinejoin="round">
      {/* head */}
      <circle cx={60} cy={26} r={17} />
      {/* neck */}
      <rect x={54} y={40} width={12} height={10} rx={3} />
      {/* torso → hips */}
      <rect x={42} y={48} width={36} height={100} rx={15} />
      {/* arms */}
      <rect x={24} y={52} width={14} height={92} rx={7} />
      <rect x={82} y={52} width={14} height={92} rx={7} />
      {/* hands */}
      <circle cx={31} cy={150} r={7} />
      <circle cx={89} cy={150} r={7} />
      {/* legs */}
      <rect x={45} y={140} width={14} height={110} rx={7} />
      <rect x={61} y={140} width={14} height={110} rx={7} />
      {/* feet */}
      <ellipse cx={50} cy={252} rx={9} ry={6} />
      <ellipse cx={70} cy={252} rx={9} ry={6} />
    </g>
  );
}

export interface BodyMapDiagramProps {
  marks: BodyMark[];
  /** Omit to render read-only (detail / print). Present → interactive. */
  onChange?: (marks: BodyMark[]) => void;
  /** "single" = one mark (body-map record); "multi" = many (accident). */
  mode?: "single" | "multi";
  /** Mark type assigned to newly-placed pins (optional). */
  markType?: MarkType;
  /** Start on this view. */
  initialView?: BodyView;
  className?: string;
}

/**
 * Interactive (or read-only) body map. In interactive mode, click the outline
 * to drop a pin; click a pin to remove it. In single mode a new click replaces
 * the existing pin.
 */
export function BodyMapDiagram({
  marks,
  onChange,
  mode = "multi",
  markType,
  initialView = "front",
  className,
}: BodyMapDiagramProps) {
  const [view, setView] = useState<BodyView>(initialView);
  const readOnly = !onChange;

  const frontCount = marks.filter((m) => m.view === "front").length;
  const backCount = marks.filter((m) => m.view === "back").length;
  const shown = marks.filter((m) => m.view === view);

  const handleSurfaceClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (readOnly || !onChange) return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
      const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);
      const mark: BodyMark = {
        id: newMarkId(),
        view,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        region: regionAtPoint(view, x, y),
        type: markType,
      };
      if (mode === "single") {
        onChange([mark]);
      } else {
        onChange([...marks, mark]);
      }
    },
    [readOnly, onChange, view, markType, mode, marks],
  );

  const removeMark = useCallback(
    (id: string) => {
      if (!onChange) return;
      onChange(marks.filter((m) => m.id !== id));
    },
    [onChange, marks],
  );

  // Stable number per mark (across both views), matching the list order.
  const numberOf = (id: string) => marks.findIndex((m) => m.id === id) + 1;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* view toggle */}
      <div className="flex items-center gap-1" role="group" aria-label="Body view">
        {(["front", "back"] as BodyView[]).map((v) => {
          const count = v === "front" ? frontCount : backCount;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium border transition-colors",
                view === v
                  ? "bg-[var(--cs-navy,#1e293b)] text-white border-transparent"
                  : "bg-background text-muted-foreground border-border hover:bg-muted",
              )}
            >
              {v === "front" ? "Front" : "Back"}
              {count > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center justify-center rounded-full text-[10px] font-semibold min-w-[16px] h-4 px-1",
                    view === v ? "bg-white/25 text-white" : "bg-rose-100 text-rose-700",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width="100%"
        onClick={handleSurfaceClick}
        role="img"
        aria-label={`Body outline, ${view} view${readOnly ? "" : " — click to mark an injury"}`}
        className={cn(
          "max-w-[220px] mx-auto select-none touch-none",
          readOnly ? "" : "cursor-crosshair",
        )}
        style={{ height: "auto" }}
      >
        <FigureOutline />

        {/* patient orientation markers (child's own left/right) */}
        <text x={6} y={12} fontSize={9} fill="var(--cs-text-secondary, #64748b)" fontWeight={600}>
          {view === "front" ? "R" : "L"}
        </text>
        <text x={VB_W - 12} y={12} fontSize={9} fill="var(--cs-text-secondary, #64748b)" fontWeight={600}>
          {view === "front" ? "L" : "R"}
        </text>

        {/* pins */}
        {shown.map((m) => {
          const cx = (m.x / 100) * VB_W;
          const cy = (m.y / 100) * VB_H;
          return (
            <g
              key={m.id}
              onClick={(e) => {
                if (readOnly) return;
                e.stopPropagation();
                removeMark(m.id);
              }}
              className={readOnly ? "" : "cursor-pointer"}
            >
              <circle cx={cx} cy={cy} r={8} fill="var(--cs-danger, #e11d48)" stroke="#ffffff" strokeWidth={1.6} />
              <text
                x={cx}
                y={cy}
                fontSize={9}
                fontWeight={700}
                fill="#ffffff"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {numberOf(m.id)}
              </text>
              {!readOnly && <title>Remove mark {numberOf(m.id)} ({REGION_LABELS[m.region]})</title>}
            </g>
          );
        })}
      </svg>

      {!readOnly && (
        <p className="text-[11px] text-muted-foreground text-center">
          {mode === "single"
            ? "Click the outline to place the mark · click the pin to clear it"
            : "Click to add each injury · click a pin to remove it"}
        </p>
      )}
    </div>
  );
}

/** Compact numbered list of marks (region + optional type/note), for detail views. */
export function BodyMarkList({ marks, className }: { marks: BodyMark[]; className?: string }) {
  if (marks.length === 0) return null;
  return (
    <ol className={cn("space-y-1 text-sm", className)}>
      {marks.map((m, i) => (
        <li key={m.id} className="flex items-baseline gap-2">
          <span className="inline-flex items-center justify-center rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold min-w-[18px] h-[18px] px-1 shrink-0">
            {i + 1}
          </span>
          <span>
            <span className="font-medium">{REGION_LABELS[m.region]}</span>
            <span className="text-muted-foreground"> · {m.view === "front" ? "front" : "back"}</span>
            {m.note ? <span className="text-muted-foreground"> — {m.note}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
