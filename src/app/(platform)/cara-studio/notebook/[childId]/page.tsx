// CARA STUDIO — /cara-studio/notebook/[childId]
import { NotebookView } from "@/components/cara-studio/notebook/notebook-view";

export const dynamic = "force-dynamic";

export default async function NotebookChildPage({ params }: { params: Promise<{ childId: string }> }) {
  const { childId } = await params;
  return <NotebookView childId={childId} />;
}
