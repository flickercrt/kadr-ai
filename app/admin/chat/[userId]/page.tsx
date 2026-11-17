import { Suspense } from "react";
import { ChatDesk } from "@/components/admin/chat-desk";

export default function AdminChatThreadPage({ params }: { params: Promise<{ userId: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">…</div>}>
      <Thread params={params} />
    </Suspense>
  );
}

async function Thread({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <ChatDesk userId={userId} />;
}
