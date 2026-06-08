"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { UserSquare2, ArrowRight } from "lucide-react";

/**
 * Lightweight Command Centre entry card for the Child Review Pack.
 * Link-only — the pack is per-child (needs a selector), so the live document
 * lives on its own page.
 */
export function ChildReviewPackCard() {
  return (
    <Card className="overflow-hidden border-2 border-violet-300">
      <CardContent className="p-0">
        <Link
          href="/child-review-pack"
          className="group flex items-center gap-4 bg-gradient-to-r from-violet-50 to-white p-4 transition-colors hover:from-violet-100"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
            <UserSquare2 className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">Child Review Pack</span>
              <span className="rounded-full border border-violet-200 bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                Per child
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Print-ready LAC review pack — wishes, progress, safety, health &amp; recommendations for any child in one document.
            </p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-violet-400 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-600" />
        </Link>
      </CardContent>
    </Card>
  );
}
