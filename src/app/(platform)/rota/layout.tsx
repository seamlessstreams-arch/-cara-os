import type { Metadata } from "next";

export const metadata: Metadata = { title: "Rota · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
