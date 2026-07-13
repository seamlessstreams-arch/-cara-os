"use client";

import { PageShell } from "@/components/layout/page-shell";
import { InOutBoardPanel } from "@/components/home-ops/in-out-board-panel";

export default function InOutBoardPage() {
  return (
    <PageShell
      title="In & Out Board"
      description="Where every young person is right now — in the home, out on a scheduled appointment or family time with a due-back time, or missing. Derived from today's schedule and live missing-episode status; refreshes every minute."
    >
      <div className="max-w-2xl">
        <InOutBoardPanel />
      </div>
    </PageShell>
  );
}
