import type { Metadata } from "next";

export const metadata: Metadata = { title: "Health Check · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
