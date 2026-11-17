import { Suspense } from "react";
import { CourseView } from "@/components/dashboard/course-view";

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted">…</div>}>
      <CourseRoute params={params} />
    </Suspense>
  );
}

async function CourseRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseView courseId={id} />;
}
