import { Suspense } from "react";
import { CertificatePage } from "@/components/inbox/certificate-page";

export default function CertificateRoute({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">…</div>}>
      <CertificateParams params={params} />
    </Suspense>
  );
}

async function CertificateParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CertificatePage certificateId={id} />;
}
