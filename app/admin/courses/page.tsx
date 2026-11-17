import type { Metadata } from "next";
import { CoursesAdmin } from "@/components/admin/courses-admin";

export const metadata: Metadata = { title: "الدورات" };

export default function AdminCoursesPage() {
  return <CoursesAdmin />;
}
