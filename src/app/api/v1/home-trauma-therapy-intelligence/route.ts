import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import { computeTraumaTherapy } from "@/lib/engines/home-trauma-therapy-intelligence-engine";
import type { TraumaTherapyRecordInput } from "@/lib/engines/home-trauma-therapy-intelligence-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const store = getStore();
    const raw = store.traumaTherapyLogs as any[];
    const total_children = (store.youngPeople ?? []).length;
    const today = new Date().toISOString().slice(0, 10);

    const logs: TraumaTherapyRecordInput[] = raw.map((r: any) => ({
      id: r.id,
      child_id: r.child_id,
      session_date: r.session_date ? r.session_date.toString().slice(0, 10) : "",
      modality: r.modality || "talk_therapy",
      session_format: r.session_format || "individual",
      session_length_minutes: r.session_length_minutes || 60,
      attended: !!r.attended,
      child_presentation: r.child_presentation || "mixed",
      pre_session_mood: r.pre_session_mood_rating ?? r.pre_session_mood ?? 5,
      post_session_mood: r.post_session_mood_rating ?? r.post_session_mood ?? 5,
      regulation_strategy_count: Array.isArray(r.regulation_strategies_used_after)
        ? r.regulation_strategies_used_after.length
        : (r.regulation_strategy_count ?? 0),
      has_escalation_flags: Array.isArray(r.escalation_flags)
        ? r.escalation_flags.length > 0
        : !!r.has_escalation_flags,
      escalation_flag_count: Array.isArray(r.escalation_flags)
        ? r.escalation_flags.length
        : (r.escalation_flag_count ?? 0),
      has_child_voice: !!(r.child_voice_shared && r.child_voice_shared.trim()) || !!r.has_child_voice,
      has_staff_observation: !!(r.staff_observation && r.staff_observation.trim()) || !!r.has_staff_observation,
      has_next_session: !!r.next_session || !!r.has_next_session,
    }));

    const result = computeTraumaTherapy({ today, total_children, logs });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
