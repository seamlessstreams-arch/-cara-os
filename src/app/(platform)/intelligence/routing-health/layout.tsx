import type { Metadata } from "next";

export const metadata: Metadata = { title: "Routing Health · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
