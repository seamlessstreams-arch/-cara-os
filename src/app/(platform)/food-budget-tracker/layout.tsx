import type { Metadata } from "next";

export const metadata: Metadata = { title: "Food Budget · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
