import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "لوحة الطالب",
  description: "بوتات كادر، الدورات، والجلسات المحفوظة لصاحب العضوية.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return <DashboardHome />;
}
