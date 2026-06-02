"use client";
import { useRouter } from "next/navigation";
import { ShiftMode } from "@/components/shift/shift-mode";
export default function ShiftModePage() {
  const router = useRouter();
  return <ShiftMode onExit={() => router.push("/dashboard")} />;
}
