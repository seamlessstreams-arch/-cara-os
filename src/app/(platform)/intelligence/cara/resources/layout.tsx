import type { Metadata } from "next";

export const metadata: Metadata = { title: "Child Resources · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
