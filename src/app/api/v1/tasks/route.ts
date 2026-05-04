import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { todayStr } from "@/lib/utils";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";

export async function GET(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_TASKS);
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const assignedTo = searchParams.get("assigned_to");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const category = searchParams.get("category");
  const overdue = searchParams.get("overdue") === "true";

  let results = db.tasks.findAll();
  if (assignedTo) results = results.filter((t) => t.assigned_to === assignedTo);
  if (status) results = results.filter((t) => t.status === status);
  if (priority) results = results.filter((t) => t.priority === priority);
  if (category) results = results.filter((t) => t.category === category);
  if (overdue) results = db.tasks.findOverdue();

  const today = todayStr();
  return NextResponse.json({
    data: results.sort((a, b) => {
      const prioW: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
      const aO = a.due_date && a.due_date < today && a.status !== "completed" ? -10 : 0;
      const bO = b.due_date && b.due_date < today && b.status !== "completed" ? -10 : 0;
      return (aO + (prioW[a.priority] ?? 2)) - (bO + (prioW[b.priority] ?? 2));
    }),
    meta: {
      total: results.length,
      overdue: results.filter((t) => t.due_date && t.due_date < today && t.status !== "completed").length,
      due_today: results.filter((t) => t.due_date === today && t.status !== "completed").length,
      urgent: results.filter((t) => t.priority === "urgent" && t.status !== "completed").length,
    },
  });
}

export async function POST(req: NextRequest) {
  const auth = requirePermission(req, PERMISSIONS.CREATE_TASKS);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const task = db.tasks.create({
    ...body,
    home_id: "home_oak",
    created_by: auth.userId,
    updated_by: auth.userId,
  });
  return NextResponse.json({ data: task }, { status: 201 });
}
