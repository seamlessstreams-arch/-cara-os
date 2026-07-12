import type { Metadata } from "next";

export const metadata: Metadata = { title: "Quality of Care · Cara" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
