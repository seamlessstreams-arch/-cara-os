import type { Metadata } from "next";

export const metadata: Metadata = { title: "Plan My Day · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
