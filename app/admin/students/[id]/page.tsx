import { Suspense } from "react";
import { StudentDevices } from "@/components/admin/student-devices";

export const metadata = { title: "أجهزة الطالب" };

export default function StudentDevicesPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">…</div>}>
      <Student params={params} />
    </Suspense>
  );
}

async function Student({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDevices userId={id} />;
}
