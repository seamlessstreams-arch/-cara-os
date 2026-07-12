import type { Metadata } from "next";

export const metadata: Metadata = { title: "Garden · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
