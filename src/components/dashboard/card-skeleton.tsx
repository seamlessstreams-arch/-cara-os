"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardSkeletonProps {
  label?: string;
  className?: string;
}

export function CardSkeleton({ label, className }: CardSkeletonProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-2">
        <div className="h-5 bg-muted rounded w-2/3 animate-pulse" />
        <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-4 bg-muted rounded w-full animate-pulse" />
        <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
          <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
