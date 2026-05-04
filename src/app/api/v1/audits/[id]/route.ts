import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { intelligenceDb } from "@/lib/intelligence/store";

// ── Contextual findings seeded per audit ID ───────────────────────────────────
// Since the Audit model stores finding/action counts but no detail, we derive
// meaningful per-audit narratives here so the detail page is substantive.

interface AuditFinding {
  id: string;
  area: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  standard_ref?: string;
  action_required: string;
  owner: string;
  due_date: string;
  status: "open" | "in_progress" | "resolved";
}

const AUDIT_FINDINGS: Record<string, AuditFinding[]> = {
  a1: [
    {
      id: "f_a1_01",
      area: "MAR Sheet recording",
      description: "One late administration of Fluoxetine recorded without a rationale note. The Care Quality Commission standard requires that all exceptions are explained in writing at the time of the event.",
      severity: "medium",
      standard_ref: "SCCIF: Health — Standard 3.4",
      action_required: "Staff to complete medication error reporting form and clinical review requested. Manager to audit MAR sheets weekly for 4 weeks.",
      owner: "staff_ryan",
      due_date: "2026-05-01",
      status: "in_progress",
    },
  ],
  a2: [
    {
      id: "f_a2_01",
      area: "Fire safety — evacuation signage",
      description: "Two evacuation route signs in the rear corridor have faded and are no longer clearly legible. Signs must be clearly visible and maintained.",
      severity: "high",
      standard_ref: "Regulatory Reform (Fire Safety) Order 2005",
      action_required: "Replace both evacuation signs within 7 days. Include in monthly premises check.",
      owner: "staff_ryan",
      due_date: "2026-04-25",
      status: "open",
    },
    {
      id: "f_a2_02",
      area: "Window restrictors",
      description: "Window restrictor in bedroom 2 requires tightening — restricted movement exceeds 100mm. Immediate action required under restrictive safety standards.",
      severity: "high",
      standard_ref: "BS EN 14351 / CSCI Guidance",
      action_required: "Maintenance team to tighten restrictor today. Re-test and document.",
      owner: "staff_darren",
      due_date: "2026-04-18",
      status: "resolved",
    },
  ],
  a4: [
    {
      id: "f_a4_01",
      area: "Petty cash reconciliation",
      description: "March petty cash reconciliation has a £12.40 discrepancy. Three receipts from the 18–21 March period are missing from the cash box.",
      severity: "medium",
      action_required: "Locate or replace missing receipts. Introduce counter-signature requirement for all petty cash disbursements over £5.",
      owner: "staff_darren",
      due_date: "2026-04-30",
      status: "open",
    },
    {
      id: "f_a4_02",
      area: "Young person activity spend",
      description: "Two activity expense claims submitted without prior manager approval as required by financial policy. Both were within budget but not pre-approved.",
      severity: "low",
      action_required: "Remind team of pre-approval policy. Add to next team meeting agenda.",
      owner: "staff_ryan",
      due_date: "2026-04-30",
      status: "open",
    },
    {
      id: "f_a4_03",
      area: "Emergency fund",
      description: "Emergency fund balance falls below the £100 minimum threshold set in the home's financial procedures.",
      severity: "medium",
      action_required: "Replenish emergency fund to £150. Review cash flow management procedures.",
      owner: "staff_darren",
      due_date: "2026-04-25",
      status: "resolved",
    },
  ],
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const audit = db.audits.findById(id);
  if (!audit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const findings = AUDIT_FINDINGS[id] ?? [];

  // Linked training needs
  const allNeeds = intelligenceDb.trainingNeeds.findAll(audit.home_id);
  const linkedNeeds = allNeeds.filter(
    (n) => n.linked_audit_id === id
  );

  // Resolved staff name
  const staff = audit.completed_by ? db.staff.findById(audit.completed_by) : null;
  const completedByName = staff
    ? `${staff.first_name} ${staff.last_name}`
    : audit.completed_by ?? null;

  return NextResponse.json({
    data: {
      ...audit,
      completed_by_name: completedByName,
      findings_detail: findings,
      linked_training_needs: linkedNeeds.map((n) => ({
        id: n.id,
        title: n.title,
        priority: n.priority,
        status: n.status,
      })),
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const updated = db.audits.update(id, body);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data: updated });
}
