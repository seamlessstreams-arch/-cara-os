import type { Metadata } from "next";

export const metadata: Metadata = { title: "Child Daily Summaries · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
