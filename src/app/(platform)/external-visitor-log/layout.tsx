import type { Metadata } from "next";

export const metadata: Metadata = { title: "External Visitors · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
