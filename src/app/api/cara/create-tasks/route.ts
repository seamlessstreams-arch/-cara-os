// ══════════════════════════════════════════════════════════════════════════════
// API: /api/cara/create-tasks
// POST — creates one or more tasks from an Cara output. Links them via
// cara_task_links. Requires cara.create_tasks permission.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import { checkCaraAccess, type CaraActor, type CaraRole } from "@/lib/cara/cara-permissions";
import { writeAuditEvent } from "@/lib/cara/cara-service";
import { readJsonBody } from "@/lib/http/read-json";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSupabase = SupabaseClient<any, "public", any>;
function loose(client: ReturnType<typeof createServerClient>): LooseSupabase {
  return client as unknown as LooseSupabase;
}

interface TaskPayload {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  category?: string;
  assigned_role?: string;
  due_date?: string;
  linked_child_id?: string;
  linked_incident_id?: string;
}

function actorFromBody(body: Record<string, unknown>): CaraActor | null {
  const userId = typeof body.actorUserId === "string" ? body.actorUserId : "";
  const role = typeof body.actorRole === "string" ? (body.actorRole as CaraRole) : "none";
  if (!userId) return null;
  return {
    userId,
    role,
    organisationId: typeof body.organisationId === "string" ? body.organisationId : undefined,
    homeId: typeof body.homeId === "string" ? body.homeId : undefined,
  };
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actor = actorFromBody(body);
  if (!actor) {
    return NextResponse.json({ error: "actorUserId is required" }, { status: 400 });
  }

  const access = checkCaraAccess(actor, {
    permission: "cara.create_tasks",
    homeId: actor.homeId,
  });
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? "Access denied" }, { status: 403 });
  }

  const outputId = typeof body.outputId === "string" ? body.outputId : undefined;
  const homeId = typeof body.homeId === "string" ? body.homeId : undefined;
  const tasks = Array.isArray(body.tasks) ? (body.tasks as TaskPayload[]) : [];

  if (tasks.length === 0) {
    return NextResponse.json({ error: "tasks array is required and must not be empty" }, { status: 400 });
  }

  if (!isSupabaseEnabled()) {
    // Demo mode — return fake created tasks
    const fakeResults = tasks.map((t, i) => ({
      id: `task_demo_${Date.now()}_${i}`,
      title: t.title,
      created: true,
    }));
    return NextResponse.json({ data: { tasks: fakeResults, count: fakeResults.length } });
  }

  const supabaseRaw = createServerClient();
  if (!supabaseRaw) {
    return NextResponse.json({ error: "Database persistence is not configured. Enable Supabase to use this feature, or use the in-memory demo mode.", configured: false, supabaseRequired: true }, { status: 503 });
  }
  const supabase = loose(supabaseRaw);

  const createdTasks: Array<{ id: string; title: string; created: boolean }> = [];

  for (const taskPayload of tasks) {
    if (!taskPayload.title?.trim()) continue;

    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const { data: inserted, error: insertError } = await (supabase.from("tasks") as any)
      .insert({
        id: taskId,
        home_id: homeId ?? null,
        title: taskPayload.title.trim(),
        description: taskPayload.description ?? "",
        priority: taskPayload.priority ?? "medium",
        category: taskPayload.category ?? "general",
        status: "not_started",
        assigned_role: taskPayload.assigned_role ?? null,
        due_date: taskPayload.due_date ?? null,
        linked_child_id: taskPayload.linked_child_id ?? null,
        linked_incident_id: taskPayload.linked_incident_id ?? null,
        auto_generated: true,
        tags: ["cara-suggested"],
        created_by: actor.userId,
        updated_by: actor.userId,
      })
      .select("id, title")
      .single();

    if (!insertError && inserted) {
      createdTasks.push({ id: inserted.id, title: inserted.title, created: true });

      // Link to Cara output if provided
      if (outputId) {
        await (supabase.from("cara_task_links") as any).insert({
          id: `cara_tl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          output_id: outputId,
          task_id: inserted.id,
          task_title: inserted.title,
          task_source: "cara_suggested",
          confirmed_by: actor.userId,
        });
      }

      await writeAuditEvent({
        requestId: null,
        outputId: outputId ?? null,
        actorUserId: actor.userId,
        actorRole: actor.role,
        eventType: "task_created",
        eventDetail: { taskId: inserted.id, taskTitle: inserted.title },
      });
    }
  }

  return NextResponse.json({
    data: {
      tasks: createdTasks,
      count: createdTasks.length,
    },
  });
}
