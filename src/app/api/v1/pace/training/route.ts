// CARA INTELLIGENCE — PACE training API
//   GET /api/v1/pace/training            → all micro-learning modules
//   GET /api/v1/pace/training?context=…  → modules relevant to a context
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import { getPACETrainingModules, getPACETrainingForContext, type PACEContext } from "@/lib/cara-intelligence/pace";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const auth = requirePermission(req, PERMISSIONS.VIEW_DASHBOARD);
  if (auth instanceof NextResponse) return auth;
  const context = new URL(req.url).searchParams.get("context") as PACEContext | null;
  const modules = context ? getPACETrainingForContext(context) : getPACETrainingModules();
  return NextResponse.json({ data: { modules } });
}
