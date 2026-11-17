import { Suspense } from "react";
import { ThreadView } from "@/components/inbox/thread-view";

export default function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">…</div>}>
      <ThreadRoute params={params} />
    </Suspense>
  );
}

async function ThreadRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThreadView threadId={id} />;
}
